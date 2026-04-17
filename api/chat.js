const Groq = require('groq-sdk');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize AI providers
let groq, genAI, geminiModel;

try {
  groq = new Groq({ apiKey: process.env.GROQ_API_KEY || '' });
} catch (e) { console.warn('Groq init skipped'); }

try {
  genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
  geminiModel = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
} catch (e) { console.warn('Gemini init skipped'); }

const AI_PROVIDER = process.env.GROQ_API_KEY ? 'groq' : 'gemini';

function detectLanguage(text) {
  if (/[\u0900-\u097F]/.test(text)) return 'hin';
  if (/[\u0B80-\u0BFF]/.test(text)) return 'tam';
  if (/[\u0C00-\u0C7F]/.test(text)) return 'tel';
  if (/[\u0C80-\u0CFF]/.test(text)) return 'kan';
  if (/[\u0D00-\u0D7F]/.test(text)) return 'mal';
  return 'eng';
}

const LANG_NAMES = {
  hin: 'Hindi', tam: 'Tamil', tel: 'Telugu',
  kan: 'Kannada', mal: 'Malayalam', eng: 'English',
  ben: 'Bengali', guj: 'Gujarati', mar: 'Marathi',
  pan: 'Punjabi', urd: 'Urdu'
};

function getLocalResponse(message) {
  const msg = message.toLowerCase();
  if (msg.includes('chennai') && msg.includes('delhi')) {
    return `🚆 Popular Trains: Chennai → Delhi\n\n1. 12621 Tamil Nadu Express — Departs 22:00, Arrives 07:10+1 (₹1,850 - 3AC)\n2. 12615 Grand Trunk Express — Departs 18:45, Arrives 06:30+1 (₹1,720 - 3AC)\n3. 12951 Mumbai Rajdhani (via Delhi) — Premium (₹3,200 - 2AC)\n\n💡 Tip: Tamil Nadu Express is the most popular!`;
  }
  if (msg.includes('pnr')) {
    return `📋 PNR Status Check\n\n1. Visit indianrailways.gov.in or IRCTC app\n2. Enter your 10-digit PNR number\n3. Click "Get Status"\n\nStatuses: CNF = Confirmed ✅ | RAC = Shared berth | WL = Waitlisted`;
  }
  if (msg.includes('complaint') || msg.includes('complain')) {
    return `📝 File a Complaint\n\n1. RailMadad App (recommended)\n2. railmadad.indianrailways.gov.in\n3. Helpline: 139\n4. SMS to 9717630982`;
  }
  if (msg.includes('platform')) {
    return `🚏 Platform Info\n\nCheck platform numbers via:\n1. NTES app\n2. enquiry.indianrail.gov.in\n3. Call 139\n\n💡 Platforms are assigned 2-4 hours before arrival.`;
  }
  if (msg.includes('family') || msg.includes('travel')) {
    return `👨‍👩‍👧‍👦 Best Family Trains\n\n1. Rajdhani Express — AC, meals included\n2. Vande Bharat — Premium semi-high speed 🚄\n3. Shatabdi Express — Great for day travel\n4. Duronto Express — Non-stop comfort`;
  }
  if (msg.includes('book') || msg.includes('ticket')) {
    return `🎫 Book Tickets\n\nOnline: irctc.co.in or IRCTC app\nTatkal: 10AM (AC) / 11AM (Non-AC)\n\n💡 Use UPI for fastest payment!`;
  }
  if (msg.includes('train') && (msg.includes('find') || msg.includes('search') || msg.includes('show'))) {
    return `🔍 Train Search\n\nPopular routes:\n• Mumbai ↔ Delhi (Rajdhani)\n• Chennai ↔ Bangalore (Shatabdi)\n• Kolkata ↔ Delhi (Howrah Rajdhani)\n\nTell me your source and destination!`;
  }
  return `🚂 Hello! I'm RailAssistAI!\n\nI can help with:\n• 🔍 Train Search\n• 📋 PNR Status\n• 📝 Complaints\n• 🚏 Platform Info\n• 💰 Fare Info\n\nTry: "Trains from Chennai to Delhi" or "Check PNR status"`;
}

async function getGroqResponse(message, sessionLang) {
  const langName = LANG_NAMES[sessionLang] || 'English';
  const response = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [
      {
        role: "system",
        content: `You are RailAssistAI, an intelligent Indian Railways assistant.
You help with train searches, routes, schedules, fares, PNR status, complaints, and travel tips.
IMPORTANT: You MUST respond entirely in ${langName}. Every word must be in ${langName}.
Be helpful, concise, and friendly. Use emojis sparingly.`
      },
      { role: "user", content: message }
    ],
    max_tokens: 300,
    temperature: 0.7,
  });
  return response.choices[0].message.content;
}

async function getGeminiResponse(message, sessionLang) {
  const langName = LANG_NAMES[sessionLang] || 'English';
  const systemPrompt = `You are RailAssistAI, an intelligent Indian Railways assistant.
You help with train searches, routes, schedules, fares, PNR status, complaints, and travel tips.
IMPORTANT: You MUST respond entirely in ${langName}. Every word must be in ${langName}.
Be helpful, concise, and friendly.`;

  const chat = geminiModel.startChat({
    history: [],
    generationConfig: { maxOutputTokens: 300 },
  });
  const result = await chat.sendMessage(`${systemPrompt}\n\nUser: ${message}`);
  return result.response.text();
}

export default async function handler(req, res) {
  // CORS setup
  res.setHeader('Access-Control-Allow-Credentials', true)
  res.setHeader('Access-Control-Allow-Origin', '*') // Replace '*' with your specific origin if needed
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT')
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  )

  if (req.method === 'OPTIONS') {
    res.status(200).end()
    return
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method non allowed' });
    return;
  }

  const { message, userId, language = 'auto' } = req.body;
  if (!message) {
    res.status(400).json({ error: 'Message is required' });
    return;
  }
  
  const sessionLang = language !== 'auto' ? language : detectLanguage(message);

  try {
    let aiResponse;
    if (AI_PROVIDER === 'groq') {
      aiResponse = await getGroqResponse(message, sessionLang);
    } else {
      aiResponse = await getGeminiResponse(message, sessionLang);
    }
    
    res.status(200).json({
      message: aiResponse,
      language: sessionLang,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.warn(`${AI_PROVIDER} error, trying fallback:`, error.message?.substring(0, 80));

    try {
      let aiResponse;
      if (AI_PROVIDER === 'groq') {
        aiResponse = await getGeminiResponse(message, sessionLang);
      } else {
        aiResponse = await getGroqResponse(message, sessionLang);
      }
      res.status(200).json({
        message: aiResponse,
        language: sessionLang,
        timestamp: new Date().toISOString()
      });
    } catch (err2) {
      console.warn('Both providers failed, using local fallback');
      res.status(200).json({
        message: getLocalResponse(message),
        language: sessionLang,
        timestamp: new Date().toISOString()
      });
    }
  }
}
