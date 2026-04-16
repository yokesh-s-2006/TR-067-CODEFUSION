// ===== Config =====
const BACKEND_URL = 'http://localhost:3001';
const AI_URL = 'http://localhost:3002';

// ===== DOM Elements =====
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

// ===== Particles =====
(function initParticles() {
  const container = $('#particles');
  for (let i = 0; i < 30; i++) {
    const p = document.createElement('div');
    p.className = 'particle';
    p.style.left = Math.random() * 100 + '%';
    p.style.animationDelay = Math.random() * 8 + 's';
    p.style.animationDuration = (6 + Math.random() * 6) + 's';
    container.appendChild(p);
  }
})();

// ===== View Navigation =====
$$('.nav-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const view = btn.dataset.view;
    $$('.nav-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    $$('.view').forEach(v => v.classList.remove('active'));
    $(`#view-${view}`).classList.add('active');
    if (view === 'chat') $('#chat-input').focus();
  });
});

// ===== Health Check =====
async function checkHealth() {
  const dot = $('#status-dot');
  const text = $('#status-text');
  try {
    const [backendRes, aiRes] = await Promise.all([
      fetch(`${BACKEND_URL}/health`).then(r => r.json()),
      fetch(`${AI_URL}/health`).then(r => r.json())
    ]);
    dot.className = 'status-dot connected';
    text.textContent = 'All systems operational';
  } catch (e) {
    dot.className = 'status-dot error';
    text.textContent = 'Some services offline';
  }
}
checkHealth();
setInterval(checkHealth, 30000);

// ===== Train Search =====
const searchBtn = $('#search-btn');
const fromInput = $('#from-input');
const toInput = $('#to-input');
const swapBtn = $('#swap-btn');
const resultsSec = $('#results-section');
const trainList = $('#train-list');
const resultsTitle = $('#results-title');
const emptyState = $('#empty-state');

swapBtn.addEventListener('click', () => {
  [fromInput.value, toInput.value] = [toInput.value, fromInput.value];
});

searchBtn.addEventListener('click', searchTrains);
fromInput.addEventListener('keydown', e => { if (e.key === 'Enter') searchTrains(); });
toInput.addEventListener('keydown', e => { if (e.key === 'Enter') searchTrains(); });

async function searchTrains() {
  const from = fromInput.value.trim();
  const to = toInput.value.trim();
  if (!from || !to) return;

  searchBtn.classList.add('loading');
  searchBtn.querySelector('span').textContent = 'Searching...';
  emptyState.style.display = 'none';

  try {
    const res = await fetch(`${BACKEND_URL}/api/trains/search?source=${from}&destination=${to}`);
    if (!res.ok) throw new Error('Search failed');
    const data = await res.json();
    const trains = data.trains || [];
    renderTrains(trains, from, to);
  } catch (e) {
    // Demo fallback data
    const demoTrains = [
      { number: '12621', name: 'Tamil Nadu Express', from: { name: from }, to: { name: to }, fare: 1850 },
      { number: '12951', name: 'Mumbai Rajdhani', from: { name: from }, to: { name: to }, fare: 3200 },
      { number: '12301', name: 'Howrah Rajdhani', from: { name: from }, to: { name: to }, fare: 2800 },
      { number: '12002', name: 'Shatabdi Express', from: { name: from }, to: { name: to }, fare: 1450 },
      { number: '12431', name: 'Thiruvananthapuram Rajdhani', from: { name: from }, to: { name: to }, fare: 3550 },
    ];
    renderTrains(demoTrains, from, to);
  }

  searchBtn.classList.remove('loading');
  searchBtn.querySelector('span').textContent = 'Search Trains';
}

function renderTrains(trains, from, to) {
  if (!trains.length) {
    resultsSec.style.display = 'none';
    emptyState.style.display = 'block';
    emptyState.querySelector('h3').textContent = 'No trains found';
    emptyState.querySelector('p').textContent = `Try different stations or dates`;
    return;
  }
  emptyState.style.display = 'none';
  resultsSec.style.display = 'block';
  resultsTitle.textContent = `${trains.length} trains found · ${from} → ${to}`;
  trainList.innerHTML = trains.map((t, i) => `
    <div class="train-card" style="animation-delay: ${i * 0.08}s">
      <div class="train-info">
        <h3><span class="train-number">${t.number}</span>${t.name}</h3>
        <div class="train-route">
          ${t.from?.name || from} <span class="arrow">→</span> ${t.to?.name || to}
        </div>
      </div>
      <div class="train-fare">₹${t.fare?.toLocaleString('en-IN') || '—'}</div>
    </div>
  `).join('');
}

// ===== Socket.IO Chat =====
let socket;
try {
  socket = io(AI_URL, { transports: ['websocket'], autoConnect: true });
  socket.on('connect', () => console.log('✅ Connected to AI'));
  socket.on('chat-response', handleAIResponse);
  socket.on('disconnect', () => console.log('❌ Disconnected from AI'));
} catch (e) {
  console.warn('Socket.IO not available');
}

const chatMessages = $('#chat-messages');
const chatInput = $('#chat-input');
const sendBtn = $('#send-btn');
const micBtn = $('#mic-btn');

// Send message
sendBtn.addEventListener('click', sendMessage);
chatInput.addEventListener('keydown', e => { if (e.key === 'Enter') sendMessage(); });

// Quick actions
$$('.quick-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    chatInput.value = btn.dataset.msg;
    sendMessage();
  });
});

function sendMessage() {
  const text = chatInput.value.trim();
  if (!text) return;

  // Hide welcome
  const welcome = $('.chat-welcome');
  if (welcome) welcome.style.display = 'none';

  addMessage(text, 'user');
  chatInput.value = '';

  // Show typing
  showTyping();

  // Send via socket
  if (socket && socket.connected) {
    socket.emit('chat-message', { message: text, userId: 'web-user-1' });
  } else {
    // Fallback: simulate response
    setTimeout(() => {
      removeTyping();
      addMessage("I'm connecting to the AI service. Please make sure the AI service is running on port 3002.", 'ai');
    }, 1500);
  }
}

function handleAIResponse(data) {
  removeTyping();
  addMessage(data.message, 'ai', data.language);
}

function addMessage(text, role, lang) {
  const now = new Date();
  const time = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  const langLabel = lang && lang !== 'eng' ? ` · ${lang.toUpperCase()}` : '';

  const div = document.createElement('div');
  div.className = `message ${role}`;
  div.innerHTML = `
    <div class="message-bubble">${escapeHtml(text)}</div>
    <div class="message-meta">${time}${langLabel}</div>
  `;
  chatMessages.appendChild(div);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function showTyping() {
  const div = document.createElement('div');
  div.className = 'typing-indicator';
  div.id = 'typing';
  div.innerHTML = '<div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div>';
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

// ===== Voice Input =====
let recognition;
if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  recognition = new SpeechRecognition();
  recognition.continuous = false;
  recognition.interimResults = false;
  recognition.lang = 'en-IN';

  recognition.onresult = (e) => {
    const transcript = e.results[0][0].transcript;
    chatInput.value = transcript;
    sendMessage();
    micBtn.classList.remove('listening');
  };
  recognition.onend = () => micBtn.classList.remove('listening');
  recognition.onerror = () => micBtn.classList.remove('listening');

  micBtn.addEventListener('click', () => {
    if (micBtn.classList.contains('listening')) {
      recognition.stop();
    } else {
      recognition.start();
      micBtn.classList.add('listening');
    }
  });
} else {
  micBtn.style.display = 'none';
}
