import os
import json
import numpy as np
import faiss
from flask import Flask, request, jsonify
from flask_cors import CORS
from sentence_transformers import SentenceTransformer
import requests
from pypdf import PdfReader
import io
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Initialize Flask App
app = Flask(__name__)
CORS(app)

# --- CONFIGURATION ---
# Load from .env file
API_KEY = os.getenv('API_KEY', 'your_api_key_here')
LLM_API_URL = os.getenv('LLM_API_URL', 'https://openrouter.ai/api/v1/chat/completions')
LLM_MODEL = os.getenv('LLM_MODEL', 'google/gemini-2.0-flash-exp:free')

# --- AI MODELS ---
print("Loading Embedding Model... (This may take a moment)")
# We use a local embedding model for speed and reliability (Concept: Embeddings)
embedder = SentenceTransformer('all-MiniLM-L6-v2')
EMBEDDING_DIM = 384

# --- VECTOR DATABASE (FAISS) ---
# Concept: Vector Search
# We use a simple flat index for this demo.
index = faiss.IndexFlatL2(EMBEDDING_DIM)
stored_docs = [] # Metadata storage: { "id": int, "text": str, "source": str }

print("AI Service Ready!")

# --- HELPER FUNCTIONS ---

def get_gemini_response(prompt, context):
    """
    Concept: Generative AI Service Usage
    Calls the external GenAI model (Gemini via OpenRouter) to generate an answer.
    """
    system_prompt = (
        "You are a Smart FAQ Bot. Answer the user's question strictly based on the provided context. "
        "If the answer is not in the context, say 'I cannot find the answer in the provided documents.' "
        "Keep answers concise and professional."
    )
    
    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": f"Context:\n{context}\n\nQuestion: {prompt}"}
    ]

    headers = {
        "Authorization": f"Bearer {API_KEY}",
        "Content-Type": "application/json"
    }
    
    data = {
        "model": LLM_MODEL,
        "messages": messages
    }

    import time

    try:
        # Retry logic for 429 errors
        max_retries = 3
        for attempt in range(max_retries):
            response = requests.post(LLM_API_URL, headers=headers, json=data)
            
            if response.status_code == 200:
                result = response.json()
                return result['choices'][0]['message']['content']
            
            if response.status_code == 429:
                print(f"Rate limit hit. Retrying in {2 ** attempt} seconds...")
                time.sleep(2 ** attempt)
                continue
                
            response.raise_for_status()
            
        return "Error: AI Service is busy (Rate Limit). Please try again later."
        
    except Exception as e:
        print(f"Error calling LLM: {e}")
        return "Error generating answer from AI service."

# --- API ENDPOINTS ---

@app.route('/status', methods=['GET'])
def status():
    return jsonify({"status": "running", "docs_count": index.ntotal})

@app.route('/ingest', methods=['POST'])
def ingest():
    """
    Concept: Embeddings & Vector Database
    Accepts text or PDF, chunks it, embeds it, and stores in FAISS.
    """
    try:
        print("--- INGEST REQUEST RECEIVED ---")
        print(f"Files: {request.files}")
        print(f"Form: {request.form}")
        
        text_content = ""
        
        # Handle File Upload
        if 'file' in request.files:
            file = request.files['file']
            print(f"Processing file: {file.filename}")
            
            # Ensure we are at the start of the file
            file.seek(0)
            
            if file.filename.lower().endswith('.pdf'):
                try:
                    pdf = PdfReader(file)
                    num_pages = len(pdf.pages)
                    print(f"PDF has {num_pages} pages.")
                    
                    for i, page in enumerate(pdf.pages):
                        extracted = page.extract_text()
                        if extracted:
                            text_content += extracted + "\n"
                        else:
                            print(f"Warning: Page {i+1} yielded no text.")
                            
                except Exception as pdf_err:
                    print(f"PDF Error: {pdf_err}")
                    return jsonify({"error": f"Invalid or Corrupt PDF: {str(pdf_err)}"}), 400
            else:
                # Assume text file
                try:
                    text_content = file.read().decode('utf-8')
                except UnicodeDecodeError:
                    # Try latin-1 fallback
                    file.seek(0)
                    text_content = file.read().decode('latin-1')

        else:
            data = request.json
            print(f"Processing JSON data: {data}")
            text_content = data.get('text', '')

        print(f"Extracted Text Length: {len(text_content)}")

        if not text_content.strip():
            print("Error: No content provided or PDF is empty/image-based")
            return jsonify({"error": "Could not extract text. The PDF might be scanned (image-only). Please try uploading a .txt file instead."}), 400

        # Simple Chunking (Concept: Preprocessing)
        # Split by paragraphs or rough character count
        chunks = [chunk for chunk in text_content.split('\n\n') if len(chunk) > 50]
        
        if not chunks:
             chunks = [text_content]

        # Generate Embeddings
        embeddings = embedder.encode(chunks)
        
        # Add to FAISS
        # FAISS expects float32
        faiss.normalize_L2(embeddings) # Optional: Normalize for cosine similarity equivalent
        index.add(np.array(embeddings).astype('float32'))
        
        # Store Metadata
        start_id = len(stored_docs)
        for i, chunk in enumerate(chunks):
            stored_docs.append({
                "id": start_id + i,
                "text": chunk,
                "source": "Uploaded Document"
            })

        return jsonify({
            "message": "Document processed and embedded successfully",
            "chunks_added": len(chunks),
            "total_vectors": index.ntotal
        })

    except Exception as e:
        print(f"Ingest Error: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

@app.route('/ask', methods=['POST'])
def ask():
    """
    Concept: RAG (Retrieval Augmented Generation)
    1. Embed question
    2. Search FAISS (Vector Search)
    3. Retrieve context
    4. Call LLM (Generation)
    """
    data = request.json
    question = data.get('question')
    
    if not question:
        return jsonify({"error": "No question provided"}), 400

    # 1. Embed Question
    query_vector = embedder.encode([question])
    faiss.normalize_L2(query_vector)

    # 2. Vector Search (Retrieve top 3 relevant chunks)
    k = 3
    distances, indices = index.search(np.array(query_vector).astype('float32'), k)

    # 3. Retrieve Context
    retrieved_chunks = []
    for idx in indices[0]:
        if idx != -1 and idx < len(stored_docs):
            retrieved_chunks.append(stored_docs[idx]['text'])
    
    context = "\n\n".join(retrieved_chunks)
    
    if not context:
        context = "No relevant context found."

    # 4. Generate Answer
    answer = get_gemini_response(question, context)

    return jsonify({
        "answer": answer,
        "context_used": retrieved_chunks
    })

if __name__ == '__main__':
    # Run on port 5000
    app.run(host='0.0.0.0', port=5000, debug=True)
