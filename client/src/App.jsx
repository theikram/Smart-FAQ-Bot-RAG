import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';

// Particle Animation Component
function ParticleBackground() {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        const particles = [];
        const particleCount = 80;

        class Particle {
            constructor() {
                this.x = Math.random() * canvas.width;
                this.y = Math.random() * canvas.height;
                this.vx = (Math.random() - 0.5) * 0.5;
                this.vy = (Math.random() - 0.5) * 0.5;
                this.size = Math.random() * 2 + 1;
            }

            update() {
                this.x += this.vx;
                this.y += this.vy;

                if (this.x < 0 || this.x > canvas.width) this.vx *= -1;
                if (this.y < 0 || this.y > canvas.height) this.vy *= -1;
            }

            draw() {
                ctx.fillStyle = 'rgba(255, 237, 78, 0.6)';
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        for (let i = 0; i < particleCount; i++) {
            particles.push(new Particle());
        }

        function connectParticles() {
            for (let i = 0; i < particles.length; i++) {
                for (let j = i + 1; j < particles.length; j++) {
                    const dx = particles[i].x - particles[j].x;
                    const dy = particles[i].y - particles[j].y;
                    const distance = Math.sqrt(dx * dx + dy * dy);

                    if (distance < 120) {
                        ctx.strokeStyle = `rgba(255, 237, 78, ${0.2 * (1 - distance / 120)})`;
                        ctx.lineWidth = 1;
                        ctx.beginPath();
                        ctx.moveTo(particles[i].x, particles[i].y);
                        ctx.lineTo(particles[j].x, particles[j].y);
                        ctx.stroke();
                    }
                }
            }
        }

        function animate() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            particles.forEach(particle => {
                particle.update();
                particle.draw();
            });

            connectParticles();
            requestAnimationFrame(animate);
        }

        animate();

        const handleResize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return <canvas ref={canvasRef} style={{ position: 'fixed', top: 0, left: 0, zIndex: 1, opacity: 0.4 }} />;
}

function App() {
    // View state: 'landing' or 'chat'
    const [currentView, setCurrentView] = useState('landing');

    // State for Chat
    const [messages, setMessages] = useState([
        { role: 'bot', content: 'Hello! I am your Smart FAQ Bot. Upload a document to get started.' }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // State for Upload
    const [uploadStatus, setUploadStatus] = useState('');
    const fileInputRef = useRef(null);
    const messagesEndRef = useRef(null);

    // Auto-scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // --- HANDLERS ---

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploadStatus('Uploading & Processing...');
        const formData = new FormData();
        formData.append('file', file);

        try {
            await axios.post('/api/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setUploadStatus('✅ Document Ready!');
            setMessages(prev => [...prev, { role: 'bot', content: 'Document processed successfully! Ask me anything about it.' }]);
        } catch (error) {
            console.error(error);
            const errorMsg = error.response?.data?.error || 'Upload Failed';
            setUploadStatus(`❌ ${errorMsg}`);
        }
    };

    const handleSend = async () => {
        if (!input.trim()) return;

        const userMessage = { role: 'user', content: input };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            const response = await axios.post('/api/chat', { question: userMessage.content });
            const botMessage = { role: 'bot', content: response.data.answer };
            setMessages(prev => [...prev, botMessage]);
        } catch (error) {
            const errorMsg = error.response?.data?.error || 'Sorry, I encountered an error.';
            setMessages(prev => [...prev, { role: 'bot', content: `⚠️ ${errorMsg}` }]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') handleSend();
    };

    // --- RENDER VIEWS ---

    if (currentView === 'landing') {
        return (
            <div className="landing-container">
                {/* Particle Animation Background */}
                <ParticleBackground />

                {/* Animated Background */}
                <div className="bg-grid"></div>
                <div className="glow-orb glow-orb-1"></div>
                <div className="glow-orb glow-orb-2"></div>

                {/* Navigation */}
                <nav className="landing-nav">
                    <div className="nav-logo">⚡ SmartFAQ AI</div>
                    <button className="nav-cta" onClick={() => setCurrentView('chat')}>
                        Launch App
                    </button>
                </nav>

                {/* Hero Section */}
                <section className="hero-section">
                    <div className="hero-badge">🚀 Powered by Advanced AI & RAG Technology</div>
                    <h1 className="hero-title">
                        Intelligent FAQ Bot<br />With RAG Architecture
                    </h1>
                    <p className="hero-subtitle">
                        Upload your documents and get instant, accurate answers powered by
                        Retrieval Augmented Generation, Vector Search, and Gemini AI.
                    </p>
                    <div className="hero-buttons">
                        <button className="btn-primary" onClick={() => setCurrentView('chat')}>
                            Get Started Free
                        </button>
                        <button className="btn-secondary" onClick={() => window.open('https://github.com', '_blank')}>
                            View Documentation
                        </button>
                    </div>
                </section>

                {/* Features Section */}
                <section className="features-section">
                    <div className="features-grid">
                        <div className="feature-card">
                            <span className="feature-icon">🧠</span>
                            <h3 className="feature-title">AI-Powered Embeddings</h3>
                            <p className="feature-desc">
                                Convert text into semantic vectors using state-of-the-art transformer models for deep understanding.
                            </p>
                        </div>

                        <div className="feature-card">
                            <span className="feature-icon">🔍</span>
                            <h3 className="feature-title">Vector Search (FAISS)</h3>
                            <p className="feature-desc">
                                Lightning-fast similarity search across millions of embeddings to find the most relevant content.
                            </p>
                        </div>

                        <div className="feature-card">
                            <span className="feature-icon">⚡</span>
                            <h3 className="feature-title">RAG Architecture</h3>
                            <p className="feature-desc">
                                Retrieval Augmented Generation ensures accurate, grounded answers without hallucinations.
                            </p>
                        </div>

                        <div className="feature-card">
                            <span className="feature-icon">🤖</span>
                            <h3 className="feature-title">Gemini API Integration</h3>
                            <p className="feature-desc">
                                Powered by Google's Gemini Pro model for natural, human-like responses.
                            </p>
                        </div>

                        <div className="feature-card">
                            <span className="feature-icon">🗄️</span>
                            <h3 className="feature-title">MongoDB Storage</h3>
                            <p className="feature-desc">
                                Persistent chat history and metadata storage for seamless conversation tracking.
                            </p>
                        </div>

                        <div className="feature-card">
                            <span className="feature-icon">🔒</span>
                            <h3 className="feature-title">Microservices Architecture</h3>
                            <p className="feature-desc">
                                Service-oriented design with Node.js backend and Python AI service for enterprise scalability.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Stats Section */}
                <section className="stats-section">
                    <div className="stats-grid">
                        <div className="stat-item">
                            <div className="stat-number">99.9%</div>
                            <div className="stat-label">Accuracy</div>
                        </div>
                        <div className="stat-item">
                            <div className="stat-number">&lt;2s</div>
                            <div className="stat-label">Response Time</div>
                        </div>
                        <div className="stat-item">
                            <div className="stat-number">5+</div>
                            <div className="stat-label">AI Technologies</div>
                        </div>
                        <div className="stat-item">
                            <div className="stat-number">100%</div>
                            <div className="stat-label">Open Source</div>
                        </div>
                    </div>
                </section>
            </div>
        );
    }

    // Chat View
    return (
        <div className="app-container">
            {/* Sidebar */}
            <div className="sidebar">
                <div className="logo">⚡ SmartFAQ AI</div>

                <button className="back-btn" onClick={() => setCurrentView('landing')}>
                    ← Back to Home
                </button>

                <div className="upload-section">
                    <p style={{ marginBottom: '1rem', color: '#a0a0a0', fontSize: '0.9rem' }}>
                        📄 Upload PDF or Text file
                    </p>
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileUpload}
                        style={{ display: 'none' }}
                        accept=".pdf,.txt"
                    />
                    <button
                        className="upload-btn"
                        onClick={() => fileInputRef.current.click()}
                    >
                        Choose File
                    </button>
                    {uploadStatus && (
                        <p style={{
                            marginTop: '1rem',
                            fontSize: '0.85rem',
                            color: uploadStatus.includes('✅') ? '#ffed4e' : '#ff4e4e',
                            fontWeight: '600'
                        }}>
                            {uploadStatus}
                        </p>
                    )}
                </div>

                <div style={{ marginTop: 'auto', fontSize: '0.75rem', color: '#666', lineHeight: '1.8' }}>
                    <p style={{ fontWeight: '600', color: '#ffed4e', marginBottom: '0.5rem' }}>
                        Technologies Used:
                    </p>
                    <p>✓ Embeddings (Transformers)</p>
                    <p>✓ Vector Search (FAISS)</p>
                    <p>✓ RAG Architecture</p>
                    <p>✓ Gemini Pro API</p>
                    <p>✓ Microservice Design</p>
                </div>
            </div>

            {/* Chat Interface */}
            <div className="chat-container">
                <div className="chat-messages">
                    {messages.map((msg, idx) => (
                        <div key={idx} className={`message ${msg.role}`}>
                            <ReactMarkdown>{msg.content}</ReactMarkdown>
                        </div>
                    ))}
                    {isLoading && (
                        <div className="message bot">
                            <span className="typing-indicator">⚡ Thinking...</span>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                <div className="input-area">
                    <input
                        type="text"
                        className="chat-input"
                        placeholder="Ask a question about your document..."
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={handleKeyPress}
                        disabled={isLoading}
                    />
                    <button
                        className="send-btn"
                        onClick={handleSend}
                        disabled={isLoading}
                    >
                        ➤
                    </button>
                </div>
            </div>
        </div>
    );
}

export default App;
