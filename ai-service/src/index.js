require('dotenv').config();
const express = require('express');
const { Server } = require('socket.io');
const OpenAI = require('openai');
const franc = require('franc');
const http = require('http');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const sessions = new Map();

app.get('/health', (req, res) => {
  res.json({ status: 'AI Service OK' });
});

io.on('connection', (socket) => {
  console.log('🤖 AI: User connected', socket.id);
  
  socket.on('chat-message', async (data) => {
    const { message, userId, language = 'auto' } = data;
    
    // Detect language
    const detectedLang = franc(message);
    const sessionLang = ['hin', 'tam', 'tel', 'kan', 'mal'].includes(detectedLang) 
      ? detectedLang : 'eng';
    
    // Session management
    if (!sessions.has(userId)) {
      sessions.set(userId, { language: sessionLang, context: [] });
    }
    const session = sessions.get(userId);
    session.context.push(message);
    if (session.context.length > 5) session.context.shift();
    
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are RailAssistAI AI assistant. Answer train queries in ${sessionLang}. Be helpful and concise.`
          },
          { role: "user", content: message }
        ],
        max_tokens: 200
      });
      
      const aiResponse = response.choices[0].message.content || 'Sorry, I need more info!';
      
      socket.emit('chat-response', {
        message: aiResponse,
        language: sessionLang,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      socket.emit('chat-response', {
        message: 'Sorry, AI service temporarily unavailable.',
        language: sessionLang
      });
    }
  });
});

const PORT = process.env.AI_PORT || 3002;
server.listen(PORT, () => {
  console.log(`🤖 RailAssistAI AI: http://localhost:${PORT}`);
});
