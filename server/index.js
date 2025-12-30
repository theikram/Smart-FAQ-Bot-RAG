require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const multer = require('multer');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

// --- CONFIGURATION ---
const app = express();
const PORT = process.env.PORT || 3000;
const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://127.0.0.1:5000';

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/smartfaq";

let isMongoConnected = false;
let chatHistory = []; // In-memory fallback

mongoose.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000
})
  .then(() => {
    console.log('✅ MongoDB Connected Successfully');
    console.log('📊 Database: smartfaq');
    isMongoConnected = true;
  })
  .catch(err => {
    console.error('❌ MongoDB Connection Failed:', err.message);
    console.log('🔄 Using In-Memory Fallback Storage');
    isMongoConnected = false;
  });

// --- SCHEMAS (Mongoose) ---
const ChatSchema = new mongoose.Schema({
  question: String,
  answer: String,
  timestamp: { type: Date, default: Date.now }
});

const Chat = mongoose.model('Chat', ChatSchema);

// --- UPLOAD CONFIG ---
const upload = multer({ dest: 'uploads/' });

// --- ROUTES ---

// 1. Health Check
app.get('/', (req, res) => {
  res.send('Smart FAQ Bot API is running');
});

// 2. Upload Document (Forwards to Python AI Service)
app.post('/api/upload', upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  try {
    // Read file from disk
    const filePath = path.join(__dirname, req.file.path);
    const fileStream = fs.createReadStream(filePath);

    // Prepare form data for Python service
    const FormData = require('form-data');
    const form = new FormData();
    form.append('file', fileStream, req.file.originalname);

    // Call Python Service
    const response = await axios.post(`${AI_SERVICE_URL}/ingest`, form, {
      headers: { ...form.getHeaders() }
    });

    // Cleanup uploaded file
    fs.unlinkSync(filePath);

    res.json(response.data);
  } catch (error) {
    console.error('Upload Error:', error.message);
    if (error.response && error.response.data && error.response.data.error) {
      return res.status(400).json({ error: error.response.data.error });
    }
    res.status(500).json({ error: 'Failed to process document' });
  }
});

// 3. Chat Endpoint (RAG Flow)
app.post('/api/chat', async (req, res) => {
  const { question } = req.body;

  if (!question) {
    return res.status(400).json({ error: 'Question is required' });
  }

  try {
    // 1. Call Python Service to get Answer
    const aiResponse = await axios.post(`${AI_SERVICE_URL}/ask`, { question });
    const { answer, context_used } = aiResponse.data;

    // 2. Store in MongoDB or Memory
    const chatData = {
      question,
      answer,
      timestamp: new Date()
    };

    if (isMongoConnected) {
      const newChat = new Chat(chatData);
      await newChat.save();
      res.json({
        answer,
        context_used,
        history_id: newChat._id
      });
    } else {
      chatData._id = Date.now().toString();
      chatHistory.unshift(chatData);
      if (chatHistory.length > 50) chatHistory.pop(); // Limit size
      res.json({
        answer,
        context_used,
        history_id: chatData._id
      });
    }

  } catch (error) {
    console.error('Chat Error:', error.message);
    res.status(500).json({ error: 'Failed to get answer from AI' });
  }
});

// 4. Get Chat History
app.get('/api/history', async (req, res) => {
  try {
    if (isMongoConnected) {
      const history = await Chat.find().sort({ timestamp: -1 }).limit(10);
      res.json(history);
    } else {
      res.json(chatHistory.slice(0, 10));
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch history' });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
