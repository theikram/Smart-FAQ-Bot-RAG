# 🤖 Smart FAQ Bot with RAG

> A production-ready AI chatbot using Retrieval Augmented Generation to provide accurate, hallucination-free answers from your documents.

![Tech Stack](https://img.shields.io/badge/React-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=node.js&logoColor=white)
![Python](https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white)

---

## ✨ What It Does

Upload a PDF or text file → Ask questions → Get accurate answers based **only** on your document content.

**No hallucinations.** The AI can't make things up because it only uses what's in your documents.

---

## 🎯 Key Features

- 📄 **Document Upload** - PDF & TXT file support
- 🧠 **Smart Embeddings** - Semantic text understanding
- 🔍 **Vector Search** - FAISS similarity matching
- ⚡ **RAG Pipeline** - Retrieval + AI generation
- 💬 **Chat Interface** - Beautiful dark theme with animations
- 💾 **MongoDB Storage** - Persistent conversation history

---

## 🏗️ Architecture

```
┌─────────────┐
│   React     │  Beautiful UI
│   Frontend  │  (Port 5173)
└──────┬──────┘
       │
       ▼
┌─────────────┐      ┌──────────────┐
│   Node.js   │◄────►│   MongoDB    │
│   Express   │      │   Atlas      │
│  (Port 3000)│      └──────────────┘
└──────┬──────┘
       │
       ▼
┌─────────────┐      ┌──────────────┐
│   Python    │─────►│  Gemini API  │
│   Flask     │      │  (OpenRouter)│
│  (Port 5000)│      └──────────────┘
└──────┬──────┘
       │
       ▼
┌─────────────┐
│    FAISS    │
│  Vectors    │
└─────────────┘
```

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Python 3.10+
- Miniconda
- MongoDB Atlas account

### 1️⃣ Setup Python AI Service

```bash
cd ai-service
conda create -n faq_env python=3.10 -y
conda activate faq_env
pip install -r requirements.txt
python app.py
```

### 2️⃣ Setup Node.js Backend

```bash
cd server
npm install
# Edit .env and add your MongoDB URI
node index.js
```

### 3️⃣ Setup React Frontend

```bash
cd client
npm install
npm run dev
```

### 4️⃣ Open Browser

Visit `http://localhost:5173` 🎉

---

## 📁 Project Structure

```
📦 Smart FAQ Bot
├── 📂 client/              # React Frontend
│   ├── 📂 src/
│   │   ├── App.jsx        # Main component
│   │   └── index.css      # Styles
│   └── package.json
│
├── 📂 server/              # Node.js Backend
│   ├── index.js           # Express server
│   ├── .env              # MongoDB config
│   └── package.json
│
├── 📂 ai-service/          # Python AI Service
│   ├── app.py            # RAG pipeline
│   ├── .env              # API keys
│   └── requirements.txt
│
└── 📄 README.md
```

---

## 🔄 How RAG Works

### Step-by-Step Flow:

1. **📤 Upload** - User uploads document
2. **✂️ Chunk** - Split into paragraphs
3. **🧮 Embed** - Convert text → 384D vectors
4. **💾 Store** - Save in FAISS index
5. **❓ Question** - User asks something
6. **🔍 Search** - Find top 3 similar chunks
7. **📝 Retrieve** - Get matching text
8. **🤖 Generate** - AI answers using context
9. **✅ Display** - Show answer to user

### Visual Pipeline:

```
Document Upload → Chunking → Embeddings → FAISS Storage
                                               ↓
User Question → Embed Query → Vector Search → Retrieve Context
                                               ↓
                                    Context + Question → Gemini AI
                                               ↓
                                           Answer ✨
```

---

## 🛠️ Tech Stack Details

### Frontend
- **React** - Component-based UI
- **Vite** - Fast development server
- **Axios** - HTTP requests
- **Plain CSS** - Custom animations

### Backend
- **Express.js** - REST API
- **MongoDB** - Chat history storage
- **Multer** - File upload handling
- **Mongoose** - MongoDB ORM

### AI Service
- **Flask** - Python web framework
- **Sentence-Transformers** - Generate embeddings
- **FAISS** - Vector similarity search
- **OpenRouter API** - Access to Gemini LLM
- **PyPDF** - PDF text extraction

---

## 🎓 Oracle GenAI Concepts

This project demonstrates all 5 core Oracle Generative AI certification concepts:

| Concept | Implementation |
|---------|----------------|
| 🤖 **GenAI Services** | Gemini API via OpenRouter |
| 🧮 **Embeddings** | Sentence-transformers (384D) |
| 🔍 **Vector Search** | FAISS IndexFlatL2 |
| ⚡ **RAG** | Retrieve → Inject → Generate |
| 💬 **Chatbot** | React chat interface + history |

---

## ⚙️ Environment Variables

### `server/.env`
```env
MONGO_URI=your_mongodb_atlas_connection_string
PORT=3000
AI_SERVICE_URL=http://127.0.0.1:5000
```

### `ai-service/.env`
```env
API_KEY=your_openrouter_api_key
LLM_MODEL=google/gemini-2.0-flash-exp:free
```

---

## 🎨 Features Showcase

### Beautiful UI
- 🌟 Animated particle background
- 🌙 Dark theme with neon yellow accents
- ✨ Glassmorphism effects
- 📱 Fully responsive design

### Smart AI
- ✅ No hallucinations - answers only from your docs
- 🚫 Refuses to answer if info not found
- 🔄 Retry logic for API failures
- 📊 Shows retrieved context

---

## 🧪 Testing

1. Upload `test_document.txt` from project root
2. Ask: **"What is RAG?"**
3. Get accurate answer from the document!

---

## 📝 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/upload` | Upload document |
| POST | `/api/chat` | Ask question |
| GET | `/api/history` | Get chat history |

---

## 🎯 Highlights

**What This Project Demonstrates:**

✅ Full-stack development (MERN + Python)  
✅ Microservices architecture  
✅ AI/ML integration (RAG, embeddings, vector search)  
✅ Modern UI design  
✅ Database management  
✅ API integration  
✅ Error handling & retry logic

---

## 🚨 Common Issues

**MongoDB Connection Failed?**
- Check IP whitelist in Atlas
- Verify .env connection string
- System auto-falls back to in-memory storage

**Rate Limit Errors?**
- Free API tier is limited
- Wait 60 seconds between requests
- Or add credits to OpenRouter ($5 = 5000 requests)

**Can't Extract PDF Text?**
- Ensure PDF has selectable text (not scanned images)
- Try converting to .txt first

---

## 📚 Learn More

- [Oracle GenAI Certification](https://education.oracle.com/oracle-cloud-infrastructure-2024-generative-ai-professional/pexam_1Z0-1127-24)
- [FAISS Documentation](https://github.com/facebookresearch/faiss)
- [Sentence-Transformers](https://www.sbert.net/)
- [OpenRouter API](https://openrouter.ai/)

---

## 📄 License

This project is for educational purposes. Free to use in portfolios.

---

## ⭐ Star This Repo

If this helped you learn RAG and GenAI concepts, give it a star! 🌟
