// ===== Config =====
const BACKEND_URL = 'http://localhost:3001';
const AI_URL = 'http://localhost:3002';

const $ = (sel) => document.querySelector(sel);
let ttsEnabled = true;
const $$ = (sel) => document.querySelectorAll(sel);

// ===== Mute Button =====
document.addEventListener('DOMContentLoaded', () => {
  const muteBtn = $('#mute-btn');
  if (muteBtn) {
    muteBtn.addEventListener('click', () => {
      ttsEnabled = !ttsEnabled;
      muteBtn.classList.toggle('muted', !ttsEnabled);
      muteBtn.querySelector('.icon-unmuted').style.display = ttsEnabled ? '' : 'none';
      muteBtn.querySelector('.icon-muted').style.display = ttsEnabled ? 'none' : '';
      muteBtn.title = ttsEnabled ? 'Mute AI voice' : 'Unmute AI voice';
      // Stop current speech if muting
      if (!ttsEnabled && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    });
  }
});

// ===== Language Config =====
const LANGUAGES = {
  eng: { name: 'English', placeholder: 'Ask in English...', speech: 'en-IN' },
  hin: { name: 'हिन्दी', placeholder: 'हिंदी में पूछें...', speech: 'hi-IN' },
  tam: { name: 'தமிழ்', placeholder: 'தமிழில் கேளுங்கள்...', speech: 'ta-IN' },
  tel: { name: 'తెలుగు', placeholder: 'తెలుగులో అడగండి...', speech: 'te-IN' },
  kan: { name: 'ಕನ್ನಡ', placeholder: 'ಕನ್ನಡದಲ್ಲಿ ಕೇಳಿ...', speech: 'kn-IN' },
  mal: { name: 'മലയാളം', placeholder: 'മലയാളത്തിൽ ചോദിക്കൂ...', speech: 'ml-IN' },
  ben: { name: 'বাংলা', placeholder: 'বাংলায় জিজ্ঞাসা করুন...', speech: 'bn-IN' },
  mar: { name: 'मराठी', placeholder: 'मराठीत विचारा...', speech: 'mr-IN' },
  guj: { name: 'ગુજરાતી', placeholder: 'ગુજરાતીમાં પૂછો...', speech: 'gu-IN' },
  pan: { name: 'ਪੰਜਾਬੀ', placeholder: 'ਪੰਜਾਬੀ ਵਿੱਚ ਪੁੱਛੋ...', speech: 'pa-IN' },
  urd: { name: 'اردو', placeholder: 'اردو میں پوچھیں...', speech: 'ur-IN' },
};

let currentLang = 'eng';
let chatCount = 0;
let currentMessages = [];

// ===== Language Selector =====
const langSelect = $('#language-select');
const chatInput = $('#chat-input');

langSelect.addEventListener('change', () => {
  currentLang = langSelect.value;
  const lang = LANGUAGES[currentLang];
  chatInput.placeholder = lang.placeholder;
  if (recognition) {
    recognition.lang = lang.speech;
  }
  // Notify user of language change
  const statusText = $('#status-text');
  statusText.textContent = `Language: ${lang.name} • Indian Railways`;
  setTimeout(() => { statusText.textContent = 'AI powered • Indian Railways'; }, 3000);
});

// ===== Health Check =====
async function checkHealth() {
  const dot = $('#status-dot');
  const text = $('#status-text');
  try {
    const res = await fetch(`/api/health`, { signal: AbortSignal.timeout(3000) });
    if (res.ok) {
      dot.className = 'status-dot-live';
      text.textContent = 'AI powered • Indian Railways';
    }
  } catch (e) {
    dot.className = 'status-dot-live offline';
    text.textContent = 'Connecting...';
  }
}
checkHealth();
setInterval(checkHealth, 15000);

// Socket.io removed for Vercel deployment

// ===== Chat Functions =====
const chatMessages = $('#chat-messages');
const sendBtn = $('#send-btn');
const welcomeScreen = $('#welcome-screen');

sendBtn.addEventListener('click', sendMessage);
chatInput.addEventListener('keydown', e => { if (e.key === 'Enter') sendMessage(); });

// Action cards
$$('.action-card').forEach(card => {
  card.addEventListener('click', () => {
    chatInput.value = card.dataset.msg;
    sendMessage();
  });
});

// Quick chips
$$('.chip').forEach(chip => {
  chip.addEventListener('click', () => {
    chatInput.value = chip.dataset.msg;
    sendMessage();
  });
});

// Sidebar nav buttons
$$('.sidebar-nav-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const action = btn.dataset.action;
    const prompts = {
      pnr: 'How do I check my PNR status?',
      search: 'Find trains from Chennai to Delhi',
      complaints: 'How do I file a complaint about my train?',
      languages: 'What languages do you support?'
    };
    chatInput.value = prompts[action] || '';
    sendMessage();
    closeSidebar();
  });
});

function sendMessage() {
  const text = chatInput.value.trim();
  if (!text) return;

  // Hide welcome
  if (welcomeScreen) welcomeScreen.style.display = 'none';

  addMessage(text, 'user');
  chatInput.value = '';
  showTyping();

  fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: text,
      userId: 'web-user-1',
      language: currentLang
    })
  })
  .then(res => res.json())
  .then(data => handleAIResponse(data))
  .catch(err => {
    removeTyping();
    addMessage("I'm connecting to the AI service. Please wait a moment and try again.", 'ai');
    console.warn('API Error:', err);
  });
}

function handleAIResponse(data) {
  removeTyping();
  addMessage(data.message, 'ai', data.language);
  // Speak the response
  if (ttsEnabled) {
    speakText(data.message, data.language || currentLang);
  }
}

// ===== Text-to-Speech =====
function speakText(text, lang) {
  if (!('speechSynthesis' in window)) return;

  // Stop any ongoing speech
  window.speechSynthesis.cancel();

  // Clean text for speech (remove emojis, markdown-like symbols)
  const cleanText = text
    .replace(/[\u{1F600}-\u{1F9FF}\u{2600}-\u{2B55}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}]/gu, '')
    .replace(/[*_#•→↔]/g, '')
    .replace(/\n+/g, '. ')
    .trim();

  if (!cleanText) return;

  // Map language codes to BCP 47 speech tags
  const speechLangMap = {
    eng: 'en-IN', hin: 'hi-IN', tam: 'ta-IN', tel: 'te-IN',
    kan: 'kn-IN', mal: 'ml-IN', ben: 'bn-IN', mar: 'mr-IN',
    guj: 'gu-IN', pan: 'pa-IN', urd: 'ur-IN'
  };

  const utterance = new SpeechSynthesisUtterance(cleanText);
  utterance.lang = speechLangMap[lang] || 'en-IN';
  utterance.rate = 0.95;
  utterance.pitch = 1;
  utterance.volume = 1;

  // Try to find a matching voice
  const voices = window.speechSynthesis.getVoices();
  const targetLang = speechLangMap[lang] || 'en-IN';
  const matchingVoice = voices.find(v => v.lang === targetLang) ||
                        voices.find(v => v.lang.startsWith(targetLang.split('-')[0]));
  if (matchingVoice) {
    utterance.voice = matchingVoice;
  }

  window.speechSynthesis.speak(utterance);
}

// Pre-load voices
if ('speechSynthesis' in window) {
  window.speechSynthesis.getVoices();
  window.speechSynthesis.onvoiceschanged = () => window.speechSynthesis.getVoices();
}

function addMessage(text, role, lang) {
  const now = new Date();
  const time = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  const avatar = role === 'ai' ? '🚂' : '👤';

  const div = document.createElement('div');
  div.className = `message ${role}`;
  div.innerHTML = `
    <div class="msg-avatar">${avatar}</div>
    <div class="msg-content">
      <div class="msg-bubble">${escapeHtml(text)}</div>
      <div class="msg-meta">${time}</div>
    </div>
  `;
  chatMessages.appendChild(div);
  chatMessages.scrollTop = chatMessages.scrollHeight;

  currentMessages.push({ text, role, time });
}

function showTyping() {
  const div = document.createElement('div');
  div.className = 'typing-indicator';
  div.id = 'typing';
  div.innerHTML = `
    <div class="msg-avatar">🚂</div>
    <div class="typing-dots">
      <div class="typing-dot"></div>
      <div class="typing-dot"></div>
      <div class="typing-dot"></div>
    </div>
  `;
  chatMessages.appendChild(div);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function removeTyping() {
  const t = $('#typing');
  if (t) t.remove();
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// ===== New Chat =====
$('#new-chat-btn').addEventListener('click', () => {
  // Save current chat to history
  if (currentMessages.length > 0) {
    saveChatToHistory();
  }
  // Reset
  currentMessages = [];
  chatMessages.innerHTML = '';
  if (welcomeScreen) {
    chatMessages.appendChild(welcomeScreen);
    welcomeScreen.style.display = '';
  }
  closeSidebar();
});

function saveChatToHistory() {
  chatCount++;
  const history = $('#chat-history');
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-IN');
  const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  const firstMsg = currentMessages[0]?.text?.substring(0, 30) || 'Chat';

  const item = document.createElement('div');
  item.className = 'history-item';
  item.innerHTML = `
    <div class="history-num">${String(chatCount).padStart(2, '0')}</div>
    <div class="history-info">
      <div class="history-title">${escapeHtml(firstMsg)}${firstMsg.length > 30 ? '...' : ''}</div>
      <div class="history-date">${dateStr}, ${timeStr}</div>
    </div>
  `;
  item.addEventListener('click', () => {
    closeSidebar();
  });
  history.appendChild(item);
}

// ===== Sidebar Toggle (Mobile) =====
const sidebar = $('#sidebar');
const menuBtn = $('#menu-btn');

menuBtn.addEventListener('click', () => {
  sidebar.classList.toggle('open');
  toggleOverlay();
});

function closeSidebar() {
  sidebar.classList.remove('open');
  const overlay = $('.sidebar-overlay');
  if (overlay) overlay.remove();
}

function toggleOverlay() {
  let overlay = $('.sidebar-overlay');
  if (sidebar.classList.contains('open')) {
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.className = 'sidebar-overlay active';
      overlay.addEventListener('click', closeSidebar);
      document.body.appendChild(overlay);
    }
  } else if (overlay) {
    overlay.remove();
  }
}

// ===== Voice Input =====
let recognition;
const voiceBtn = $('#voice-btn');

if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  recognition = new SpeechRecognition();
  recognition.continuous = false;
  recognition.interimResults = true;
  recognition.lang = LANGUAGES[currentLang].speech;

  recognition.onstart = () => {
    voiceBtn.classList.add('listening');
    chatInput.placeholder = '🎤 Listening...';
  };

  recognition.onresult = (e) => {
    let interimTranscript = '';
    let finalTranscript = '';

    for (let i = e.resultIndex; i < e.results.length; i++) {
      const transcript = e.results[i][0].transcript;
      if (e.results[i].isFinal) {
        finalTranscript += transcript;
      } else {
        interimTranscript += transcript;
      }
    }

    // Show interim results in input
    chatInput.value = finalTranscript || interimTranscript;

    if (finalTranscript) {
      sendMessage();
    }
  };

  recognition.onend = () => {
    voiceBtn.classList.remove('listening');
    chatInput.placeholder = LANGUAGES[currentLang].placeholder;
  };

  recognition.onerror = (e) => {
    console.warn('Speech recognition error:', e.error);
    voiceBtn.classList.remove('listening');
    chatInput.placeholder = LANGUAGES[currentLang].placeholder;
  };

  voiceBtn.addEventListener('click', () => {
    if (voiceBtn.classList.contains('listening')) {
      recognition.stop();
    } else {
      recognition.lang = LANGUAGES[currentLang].speech;
      recognition.start();
    }
  });
} else {
  voiceBtn.style.display = 'none';
}
