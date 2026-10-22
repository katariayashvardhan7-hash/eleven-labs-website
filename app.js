/**
 * VoxLabs • ElevenLabs AI Narration Studio
 * Complete Client Application Logic
 */

// Model descriptions dictionary
const MODEL_INFO = {
  'eleven_multilingual_v2': {
    badge: 'Multilingual v2',
    description: 'State-of-the-art multilingual model with life-like cadence and rich emotional expression (29 languages).'
  },
  'eleven_flash_v2_5': {
    badge: 'Flash v2.5 (~75ms)',
    description: 'Ultra-low latency model engineered for real-time speech and interactive voice agents (32 languages).'
  },
  'eleven_turbo_v2_5': {
    badge: 'Turbo v2.5',
    description: 'High-speed, top quality model optimized for developer throughput and responsive applications (32 languages).'
  },
  'eleven_flash_v2': {
    badge: 'Flash v2',
    description: 'Ultra-fast English voice synthesis tuned for instantaneous conversational experiences.'
  },
  'eleven_turbo_v2': {
    badge: 'Turbo v2',
    description: 'High performance English model balancing low latency with clear natural articulation.'
  },
  'eleven_monolingual_v1': {
    badge: 'Monolingual v1',
    description: 'Classic first-generation ElevenLabs synthesizer for standard English narration.'
  }
};

// Preset Texts
const SAMPLE_PRESETS = {
  story: `Deep within the whispering woods of Eldoria, an ancient stone gate began to glow with a faint sapphire light. Kael drew his cloak tightly around his shoulders, feeling the chill of a magic that had slept for a thousand years. "Whatever lies beyond," he whispered into the fog, "we face it together."`,
  tech: `Welcome to the frontier of generative audio. Today, we're unveiling our next-generation neural architecture that bridges the gap between synthetic speech and authentic human emotion. Powered by ultra-low latency inference, your ideas now speak with unprecedented clarity.`,
  quote: `The cosmos is within us. We are made of star-stuff. We are a way for the universe to know itself. In the immense silence of the infinite, our voices are the echoes of curiosity seeking meaning.`,
  multilingual: `Hello and welcome to VoxLabs. Bonjour et bienvenue! Hola y bienvenido a nuestro estudio de narración. Ciao e benvenuto. ElevenLabs transforms your written words into human voices across dozens of languages seamlessly.`
};

// Application State
const state = {
  apiKey: localStorage.getItem('elevenlabs_api_key') || '',
  selectedModel: localStorage.getItem('elevenlabs_model') || 'eleven_multilingual_v2',
  selectedVoice: localStorage.getItem('elevenlabs_voice') || '21m00Tcm4TlvDq8ikWAM',
  customVoiceId: localStorage.getItem('elevenlabs_custom_voice') || '',
  isPlaying: false,
  isGenerating: false,
  currentAudioUrl: null,
  history: JSON.parse(localStorage.getItem('voxlabs_history') || '[]')
};

// DOM Elements
const elements = {
  // API Key Drawer & Status
  apiKeyToggleBtn: document.getElementById('apiKeyToggleBtn'),
  keyStatusDot: document.getElementById('keyStatusDot'),
  keyStatusLabel: document.getElementById('keyStatusLabel'),
  apiKeyDrawer: document.getElementById('apiKeyDrawer'),
  closeKeyDrawerBtn: document.getElementById('closeKeyDrawerBtn'),
  apiKeyInput: document.getElementById('apiKeyInput'),
  toggleKeyVisibilityBtn: document.getElementById('toggleKeyVisibilityBtn'),
  keyEyeIcon: document.getElementById('keyEyeIcon'),
  saveApiKeyBtn: document.getElementById('saveApiKeyBtn'),
  testApiKeyBtn: document.getElementById('testApiKeyBtn'),
  keyFeedback: document.getElementById('keyFeedback'),

  // Controls
  modelSelect: document.getElementById('modelSelect'),
  modelBadge: document.getElementById('modelBadge'),
  modelDescription: document.getElementById('modelDescription'),
  voiceSelect: document.getElementById('voiceSelect'),
  customVoiceGroup: document.getElementById('customVoiceGroup'),
  customVoiceInputContainer: document.getElementById('customVoiceInputContainer'),
  customVoiceIdInput: document.getElementById('customVoiceIdInput'),
  refreshVoicesBtn: document.getElementById('refreshVoicesBtn'),

  // Sliders
  stabilitySlider: document.getElementById('stabilitySlider'),
  stabilityVal: document.getElementById('stabilityVal'),
  similaritySlider: document.getElementById('similaritySlider'),
  similarityVal: document.getElementById('similarityVal'),
  styleSlider: document.getElementById('styleSlider'),
  styleVal: document.getElementById('styleVal'),
  speakerBoostToggle: document.getElementById('speakerBoostToggle'),

  // Text Input
  textInput: document.getElementById('textInput'),
  charCount: document.getElementById('charCount'),
  wordCount: document.getElementById('wordCount'),
  clearTextBtn: document.getElementById('clearTextBtn'),
  presetChips: document.querySelectorAll('.preset-chip[data-sample]'),

  // Action / Hero Play Button
  playBtn: document.getElementById('playBtn'),
  playBtnText: document.getElementById('playBtnText'),
  playIcon: document.getElementById('playIcon'),
  stopIcon: document.getElementById('stopIcon'),
  btnSpinner: document.getElementById('btnSpinner'),
  statusPulse: document.getElementById('statusPulse'),
  statusText: document.getElementById('statusText'),

  // Audio Player & Visualizer
  audioPlayer: document.getElementById('audioPlayer'),
  visualizerCanvas: document.getElementById('visualizerCanvas'),
  canvasPlaceholder: document.getElementById('canvasPlaceholder'),
  playerStatusBadge: document.getElementById('playerStatusBadge'),
  currentTime: document.getElementById('currentTime'),
  totalDuration: document.getElementById('totalDuration'),
  seekBar: document.getElementById('seekBar'),
  seekFill: document.getElementById('seekFill'),
  playerPlayPauseBtn: document.getElementById('playerPlayPauseBtn'),
  subPlayIcon: document.getElementById('subPlayIcon'),
  subPauseIcon: document.getElementById('subPauseIcon'),
  playerRewindBtn: document.getElementById('playerRewindBtn'),
  playerForwardBtn: document.getElementById('playerForwardBtn'),
  muteBtn: document.getElementById('muteBtn'),
  volumeSlider: document.getElementById('volumeSlider'),
  speedSelect: document.getElementById('speedSelect'),
  downloadAudioBtn: document.getElementById('downloadAudioBtn'),

  // History & Toast
  historyList: document.getElementById('historyList'),
  clearHistoryBtn: document.getElementById('clearHistoryBtn'),
  toastContainer: document.getElementById('toastContainer')
};

// Web Audio API State for Visualizer
let audioContext = null;
let analyserNode = null;
let audioSourceNode = null;
let animationFrameId = null;

// ============================================================================
// Initialization
// ============================================================================
function init() {
  updateApiKeyStatusUI();

  // Load saved model
  if (state.selectedModel && elements.modelSelect.querySelector(`option[value="${state.selectedModel}"]`)) {
    elements.modelSelect.value = state.selectedModel;
  }
  updateModelInfo(elements.modelSelect.value);

  // Load saved voice
  if (state.selectedVoice) {
    if (elements.voiceSelect.querySelector(`option[value="${state.selectedVoice}"]`)) {
      elements.voiceSelect.value = state.selectedVoice;
    } else if (state.selectedVoice === 'custom') {
      elements.voiceSelect.value = 'custom';
      elements.customVoiceInputContainer.classList.remove('hidden');
      elements.customVoiceIdInput.value = state.customVoiceId;
    }
  }

  // Pre-fill sample text if empty
  if (!elements.textInput.value.trim()) {
    elements.textInput.value = SAMPLE_PRESETS.story;
  }
  updateTextCounts();

  // Setup Event Listeners
  setupEventListeners();

  // Render History
  renderHistory();

  // Init Canvas Dimensions
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);

  // Draw idle visualizer wave
  drawIdleVisualizer();

  // If API key is present, try loading custom voices automatically
  if (state.apiKey) {
    fetchAccountVoices(false);
  }
}

// ============================================================================
// API Key Management
// ============================================================================
function updateApiKeyStatusUI() {
  if (state.apiKey && state.apiKey.trim().length > 5) {
    elements.keyStatusDot.classList.add('active');
    const masked = state.apiKey.slice(0, 4) + '...' + state.apiKey.slice(-4);
    elements.keyStatusLabel.textContent = `Key: ${masked}`;
    elements.apiKeyInput.value = state.apiKey;
  } else {
    elements.keyStatusDot.classList.remove('active');
    elements.keyStatusLabel.textContent = 'Configure API Key';
  }
}

function showApiKeyDrawer() {
  elements.apiKeyDrawer.classList.remove('hidden');
  elements.apiKeyInput.focus();
}

function hideApiKeyDrawer() {
  elements.apiKeyDrawer.classList.add('hidden');
  elements.keyFeedback.className = 'feedback-msg';
  elements.keyFeedback.textContent = '';
}

function saveApiKey(testAfterSave = false) {
  const key = elements.apiKeyInput.value.trim();
  if (!key) {
    showKeyFeedback('Please enter a valid ElevenLabs API key.', 'error');
    return;
  }

  state.apiKey = key;
  localStorage.setItem('elevenlabs_api_key', key);
  updateApiKeyStatusUI();

  if (testAfterSave) {
    testApiKeyAndFetchVoices();
  } else {
    showKeyFeedback('API Key saved locally in your browser!', 'success');
    showToast('ElevenLabs API key saved.', 'success');
    setTimeout(hideApiKeyDrawer, 1200);
  }
}

function showKeyFeedback(msg, type) {
  elements.keyFeedback.textContent = msg;
  elements.keyFeedback.className = `feedback-msg show ${type}`;
}

// Test Key and Fetch Custom Voices from ElevenLabs
async function testApiKeyAndFetchVoices() {
  const key = elements.apiKeyInput.value.trim() || state.apiKey;
  if (!key) {
    showKeyFeedback('Please enter an API key first.', 'error');
    return;
  }

  showKeyFeedback('Connecting to ElevenLabs API...', '');
  try {
    const response = await fetch('https://api.elevenlabs.io/v1/voices', {
      method: 'GET',
      headers: {
        'xi-api-key': key
      }
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      const msg = errData?.detail?.message || errData?.message || `HTTP ${response.status}: Unauthorized`;
      showKeyFeedback(`Authentication failed: ${msg}`, 'error');
      showToast(`Key Error: ${msg}`, 'error');
      return;
    }

    const data = await response.json();
    state.apiKey = key;
    localStorage.setItem('elevenlabs_api_key', key);
    updateApiKeyStatusUI();

    populateVoices(data.voices || []);
    showKeyFeedback(`Success! Connected to ElevenLabs. Loaded ${(data.voices || []).length} voices.`, 'success');
    showToast('API Key validated! Custom voices loaded.', 'success');
    setTimeout(hideApiKeyDrawer, 1500);
  } catch (err) {
    showKeyFeedback(`Network or CORS Error: ${err.message}`, 'error');
    showToast('Could not reach ElevenLabs server.', 'error');
  }
}

// Fetch Account Voices
async function fetchAccountVoices(showToasts = true) {
  if (!state.apiKey) return;

  try {
    const response = await fetch('https://api.elevenlabs.io/v1/voices', {
      method: 'GET',
      headers: {
        'xi-api-key': state.apiKey
      }
    });

    if (response.ok) {
      const data = await response.json();
      populateVoices(data.voices || []);
      if (showToasts) showToast(`Synced ${(data.voices || []).length} ElevenLabs voices!`, 'success');
    }
  } catch (e) {
    console.warn('Voice sync error:', e);
  }
}

function populateVoices(voices) {
  if (!voices || voices.length === 0) return;

  // Find or create account voices optgroup
  let accountGroup = document.getElementById('accountVoiceGroup');
  if (!accountGroup) {
    accountGroup = document.createElement('optgroup');
    accountGroup.id = 'accountVoiceGroup';
    accountGroup.label = 'Your Cloned & Account Voices';
    elements.voiceSelect.insertBefore(accountGroup, elements.customVoiceGroup);
  } else {
    accountGroup.innerHTML = '';
  }

  // Add account voices
  voices.forEach(voice => {
    // Avoid duplicating default voices in the curated list
    const existing = elements.voiceSelect.querySelector(`option[value="${voice.voice_id}"]`);
    if (!existing) {
      const opt = document.createElement('option');
      opt.value = voice.voice_id;
      const desc = voice.labels ? Object.values(voice.labels).join(', ') : (voice.category || 'Custom');
      opt.textContent = `${voice.name} (${desc})`;
      accountGroup.appendChild(opt);
    }
  });

  // Restore active voice selection if possible
  if (state.selectedVoice && elements.voiceSelect.querySelector(`option[value="${state.selectedVoice}"]`)) {
    elements.voiceSelect.value = state.selectedVoice;
  }
}

// ============================================================================
// Model & Voice Handlers
// ============================================================================
function updateModelInfo(modelId) {
  const info = MODEL_INFO[modelId] || { badge: 'ElevenLabs', description: 'Neural speech synthesis model.' };
  elements.modelBadge.textContent = info.badge;
  elements.modelDescription.textContent = info.description;
  state.selectedModel = modelId;
  localStorage.setItem('elevenlabs_model', modelId);
}

function handleVoiceChange() {
  const val = elements.voiceSelect.value;
  if (val === 'custom') {
    elements.customVoiceInputContainer.classList.remove('hidden');
    elements.customVoiceIdInput.focus();
  } else {
    elements.customVoiceInputContainer.classList.add('hidden');
    state.selectedVoice = val;
    localStorage.setItem('elevenlabs_voice', val);
  }
}

// Get the actual Voice ID to send to the API
function getActiveVoiceId() {
  const val = elements.voiceSelect.value;
  if (val === 'custom') {
    return elements.customVoiceIdInput.value.trim();
  }
  return val;
}

// ============================================================================
// Text Input & Presets
// ============================================================================
function updateTextCounts() {
  const text = elements.textInput.value;
  elements.charCount.textContent = `${text.length} characters`;
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  elements.wordCount.textContent = `${words} words`;
}

function loadPreset(sampleKey) {
  if (SAMPLE_PRESETS[sampleKey]) {
    elements.textInput.value = SAMPLE_PRESETS[sampleKey];
    updateTextCounts();
    elements.textInput.focus();
  }
}

// ============================================================================
// Core TTS Generation & Playback
// ============================================================================
async function handlePlayButtonClick() {
  // If audio is currently playing, clicking hero button toggles Stop/Pause
  if (state.isPlaying) {
    elements.audioPlayer.pause();
    return;
  }

  // Validate API Key
  if (!state.apiKey) {
    showApiKeyDrawer();
    showToast('Please enter your ElevenLabs API Key to generate narration.', 'error');
    setStatus('API Key required. Please enter it in the top settings.', 'error');
    return;
  }

  // Validate Text
  const text = elements.textInput.value.trim();
  if (!text) {
    showToast('Please paste or write some text to narrate.', 'error');
    elements.textInput.focus();
    return;
  }

  // Validate Voice
  const voiceId = getActiveVoiceId();
  if (!voiceId) {
    showToast('Please select or provide a valid ElevenLabs Voice ID.', 'error');
    return;
  }

  // Start Narration Generation
  await generateAndPlayNarration(text, voiceId, elements.modelSelect.value);
}

async function generateAndPlayNarration(text, voiceId, modelId) {
  setGeneratingUI(true);
  setStatus('Sending request to ElevenLabs Neural Engine...', 'loading');

  const voiceSettings = {
    stability: parseFloat(elements.stabilitySlider.value),
    similarity_boost: parseFloat(elements.similaritySlider.value),
    style: parseFloat(elements.styleSlider.value),
    use_speaker_boost: elements.speakerBoostToggle.checked
  };

  try {
    const url = `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voiceId)}?optimize_streaming_latency=0&output_format=mp3_44100_128`;

    const requestBody = {
      text: text,
      model_id: modelId,
      voice_settings: voiceSettings
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'xi-api-key': state.apiKey,
        'Content-Type': 'application/json',
        'Accept': 'audio/mpeg'
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      let errorMessage = `ElevenLabs API error (HTTP ${response.status})`;
      try {
        const errJson = await response.json();
        if (errJson && errJson.detail) {
          errorMessage = errJson.detail.message || JSON.stringify(errJson.detail);
        }
      } catch (e) {
        const errText = await response.text().catch(() => '');
        if (errText) errorMessage = errText;
      }

      if (response.status === 401) {
        errorMessage = 'Invalid ElevenLabs API Key. Please verify your key.';
        showApiKeyDrawer();
      } else if (response.status === 429) {
        errorMessage = 'ElevenLabs quota or rate limit exceeded on this account.';
      }

      throw new Error(errorMessage);
    }

    // Convert response stream to Audio Blob
    setStatus('Streaming audio payload & preparing playback...', 'loading');
    const audioBlob = await response.blob();
    const audioUrl = URL.createObjectURL(audioBlob);

    // Update state & Audio Player
    state.currentAudioUrl = audioUrl;
    elements.audioPlayer.src = audioUrl;
    elements.downloadAudioBtn.href = audioUrl;
    elements.downloadAudioBtn.classList.remove('disabled');
    elements.playerPlayPauseBtn.disabled = false;

    // Save to session history
    const voiceName = elements.voiceSelect.options[elements.voiceSelect.selectedIndex]?.text || voiceId;
    addToHistory({
      id: Date.now(),
      text: text,
      modelId: modelId,
      voiceName: voiceName,
      audioUrl: audioUrl,
      blob: audioBlob,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });

    // Initialize Web Audio Visualizer on user action
    setupWebAudioContext();

    // Begin Playback
    await elements.audioPlayer.play();
    setStatus('Playing narration with ElevenLabs ' + elements.modelBadge.textContent, 'playing');
    showToast('Narration generated successfully!', 'success');

  } catch (err) {
    console.error('Narration error:', err);
    setStatus(`Narration failed: ${err.message}`, 'error');
    showToast(`Error: ${err.message}`, 'error');
  } finally {
    setGeneratingUI(false);
  }
}

// UI State Toggles during Generation
function setGeneratingUI(isGen) {
  state.isGenerating = isGen;
  if (isGen) {
    elements.playBtn.classList.add('loading');
    elements.btnSpinner.classList.remove('hidden');
    elements.playIcon.classList.add('hidden');
    elements.stopIcon.classList.add('hidden');
    elements.playBtnText.textContent = 'Generating Speech...';
    elements.playBtn.disabled = true;
  } else {
    elements.playBtn.classList.remove('loading');
    elements.btnSpinner.classList.add('hidden');
    elements.playBtn.disabled = false;
    updatePlaybackUI();
  }
}

// Update Status Message Bar
function setStatus(message, type = '') {
  elements.statusText.textContent = message;
  elements.statusPulse.className = 'status-pulse ' + type;
}

// ============================================================================
// Web Audio API & Waveform Visualizer
// ============================================================================
function setupWebAudioContext() {
  if (!audioContext) {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    audioContext = new AudioCtx();
    analyserNode = audioContext.createAnalyser();
    analyserNode.fftSize = 256;
    analyserNode.smoothingTimeConstant = 0.8;

    try {
      audioSourceNode = audioContext.createMediaElementSource(elements.audioPlayer);
      audioSourceNode.connect(analyserNode);
      analyserNode.connect(audioContext.destination);
    } catch (e) {
      console.warn('Audio source node already hooked or cross-origin restriction:', e);
    }
  }

  if (audioContext && audioContext.state === 'suspended') {
    audioContext.resume();
  }
}

function resizeCanvas() {
  const rect = elements.visualizerCanvas.parentElement.getBoundingClientRect();
  elements.visualizerCanvas.width = rect.width * (window.devicePixelRatio || 1);
  elements.visualizerCanvas.height = rect.height * (window.devicePixelRatio || 1);
}

function startVisualizer() {
  elements.canvasPlaceholder.classList.add('hidden');
  const canvas = elements.visualizerCanvas;
  const ctx = canvas.getContext('2d');
  const bufferLength = analyserNode ? analyserNode.frequencyBinCount : 64;
  const dataArray = new Uint8Array(bufferLength);

  function renderFrame() {
    animationFrameId = requestAnimationFrame(renderFrame);

    if (analyserNode && state.isPlaying) {
      analyserNode.getByteFrequencyData(dataArray);
    } else {
      for (let i = 0; i < bufferLength; i++) {
        dataArray[i] = Math.max(0, dataArray[i] - 4);
      }
    }

    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    // Draw background grid lines for a high-tech studio look
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, height / 2);
    ctx.lineTo(width, height / 2);
    ctx.stroke();

    // Draw dynamic neon bars
    const barCount = 48;
    const barWidth = (width / barCount) * 0.72;
    const barGap = (width / barCount) * 0.28;

    for (let i = 0; i < barCount; i++) {
      const dataIndex = Math.floor((i / barCount) * (bufferLength * 0.75));
      const value = dataArray[dataIndex] || 0;
      const percent = value / 255;
      const barHeight = Math.max(4, percent * (height * 0.85));

      const x = i * (barWidth + barGap) + barGap / 2;
      const y = (height - barHeight) / 2;

      // Dynamic color gradient based on frequency
      const grad = ctx.createLinearGradient(0, y, 0, y + barHeight);
      grad.addColorStop(0, '#06b6d4');
      grad.addColorStop(0.5, '#6366f1');
      grad.addColorStop(1, '#ec4899');

      ctx.fillStyle = grad;
      ctx.shadowBlur = percent > 0.4 ? 14 : 4;
      ctx.shadowColor = 'rgba(99, 102, 241, 0.7)';

      // Rounded bar top and bottom
      ctx.beginPath();
      ctx.roundRect(x, y, barWidth, barHeight, 4);
      ctx.fill();
    }
  }

  cancelAnimationFrame(animationFrameId);
  renderFrame();
}

function drawIdleVisualizer() {
  const canvas = elements.visualizerCanvas;
  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;
  ctx.clearRect(0, 0, width, height);

  const barCount = 48;
  const barWidth = (width / barCount) * 0.72;
  const barGap = (width / barCount) * 0.28;

  ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
  for (let i = 0; i < barCount; i++) {
    const x = i * (barWidth + barGap) + barGap / 2;
    const h = 4 + Math.sin(i * 0.3) * 2;
    const y = (height - h) / 2;
    ctx.fillRect(x, y, barWidth, h);
  }
}

// ============================================================================
// Audio Player Event Listeners & UI Synchronizer
// ============================================================================
function updatePlaybackUI() {
  if (state.isPlaying) {
    elements.playBtn.classList.add('playing');
    elements.playIcon.classList.add('hidden');
    elements.stopIcon.classList.remove('hidden');
    elements.playBtnText.textContent = 'Pause Narration';

    elements.subPlayIcon.classList.add('hidden');
    elements.subPauseIcon.classList.remove('hidden');
    elements.playerStatusBadge.textContent = 'Playing';
    elements.playerStatusBadge.className = 'audio-badge active';
  } else {
    elements.playBtn.classList.remove('playing');
    elements.playIcon.classList.remove('hidden');
    elements.stopIcon.classList.add('hidden');
    elements.playBtnText.textContent = 'Play Narration';

    elements.subPlayIcon.classList.remove('hidden');
    elements.subPauseIcon.classList.add('hidden');
    elements.playerStatusBadge.textContent = elements.audioPlayer.src ? 'Paused' : 'Idle';
    elements.playerStatusBadge.className = 'audio-badge';
  }
}

// Format Seconds to MM:SS
function formatTime(seconds) {
  if (isNaN(seconds) || seconds === Infinity) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

// ============================================================================
// History Session Management
// ============================================================================
function addToHistory(item) {
  state.history.unshift(item);
  if (state.history.length > 25) state.history.pop();
  renderHistory();
}

function renderHistory() {
  if (!state.history || state.history.length === 0) {
    elements.historyList.innerHTML = `
      <div class="history-empty">
        <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M2 12h20M12 2v20"/>
        </svg>
        <p>No narrations generated yet in this session. Enter your text and hit Play!</p>
      </div>
    `;
    return;
  }

  elements.historyList.innerHTML = '';
  state.history.forEach((entry, index) => {
    const itemEl = document.createElement('div');
    itemEl.className = 'history-item';
    itemEl.innerHTML = `
      <div class="history-details">
        <p class="history-text" title="${escapeHtml(entry.text)}">${escapeHtml(entry.text)}</p>
        <div class="history-badges">
          <span class="history-badge">${MODEL_INFO[entry.modelId]?.badge || entry.modelId}</span>
          <span class="history-badge">${escapeHtml(entry.voiceName)}</span>
          <span class="history-badge">${entry.timestamp}</span>
        </div>
      </div>
      <div class="history-actions">
        <button class="control-icon-btn history-replay-btn" data-index="${index}" title="Play this narration">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
            <polygon points="5 3 19 12 5 21 5 3"/>
          </svg>
        </button>
        <a class="control-icon-btn history-download-link" href="${entry.audioUrl}" download="elevenlabs_${entry.modelId}_${index + 1}.mp3" title="Download MP3">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="7 10 12 15 17 10"/>
            <line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
        </a>
      </div>
    `;
    elements.historyList.appendChild(itemEl);
  });

  // Attach history item replay clicks
  elements.historyList.querySelectorAll('.history-replay-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const idx = parseInt(btn.getAttribute('data-index'), 10);
      const entry = state.history[idx];
      if (entry && entry.audioUrl) {
        elements.audioPlayer.src = entry.audioUrl;
        elements.downloadAudioBtn.href = entry.audioUrl;
        elements.downloadAudioBtn.classList.remove('disabled');
        elements.playerPlayPauseBtn.disabled = false;
        setupWebAudioContext();
        elements.audioPlayer.play();
        setStatus(`Replaying saved narration: "${entry.text.slice(0, 30)}..."`, 'playing');
      }
    });
  });
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/[&<>"']/g, function(m) {
    return {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    }[m];
  });
}

// Toast notification helper
function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  elements.toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(8px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// ============================================================================
// Event Listeners Binding
// ============================================================================
function setupEventListeners() {
  // API Key Toggle & Controls
  elements.apiKeyToggleBtn.addEventListener('click', () => {
    if (elements.apiKeyDrawer.classList.contains('hidden')) {
      showApiKeyDrawer();
    } else {
      hideApiKeyDrawer();
    }
  });

  elements.closeKeyDrawerBtn.addEventListener('click', hideApiKeyDrawer);

  elements.toggleKeyVisibilityBtn.addEventListener('click', () => {
    const isPass = elements.apiKeyInput.type === 'password';
    elements.apiKeyInput.type = isPass ? 'text' : 'password';
    elements.keyEyeIcon.textContent = isPass ? '🔒' : '👁';
  });

  elements.saveApiKeyBtn.addEventListener('click', () => saveApiKey(false));
  elements.testApiKeyBtn.addEventListener('click', () => saveApiKey(true));

  elements.apiKeyInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') saveApiKey(false);
  });

  // Model Dropdown Change (Core requirement)
  elements.modelSelect.addEventListener('change', (e) => {
    updateModelInfo(e.target.value);
    showToast(`Model set to: ${MODEL_INFO[e.target.value]?.badge || e.target.value}`);
  });

  // Voice Select Change
  elements.voiceSelect.addEventListener('change', handleVoiceChange);
  elements.customVoiceIdInput.addEventListener('input', (e) => {
    state.customVoiceId = e.target.value.trim();
    localStorage.setItem('elevenlabs_custom_voice', state.customVoiceId);
  });

  elements.refreshVoicesBtn.addEventListener('click', () => {
    if (!state.apiKey) {
      showApiKeyDrawer();
      showToast('Please enter your ElevenLabs API Key first.', 'error');
    } else {
      fetchAccountVoices(true);
    }
  });

  // Sliders dynamic display
  elements.stabilitySlider.addEventListener('input', (e) => {
    elements.stabilityVal.textContent = Math.round(e.target.value * 100) + '%';
  });
  elements.similaritySlider.addEventListener('input', (e) => {
    elements.similarityVal.textContent = Math.round(e.target.value * 100) + '%';
  });
  elements.styleSlider.addEventListener('input', (e) => {
    elements.styleVal.textContent = Math.round(e.target.value * 100) + '%';
  });

  // Text Area Input
  elements.textInput.addEventListener('input', updateTextCounts);
  elements.clearTextBtn.addEventListener('click', () => {
    elements.textInput.value = '';
    updateTextCounts();
    elements.textInput.focus();
  });

  // Sample Text Presets
  elements.presetChips.forEach(chip => {
    chip.addEventListener('click', () => {
      const sampleKey = chip.getAttribute('data-sample');
      loadPreset(sampleKey);
    });
  });

  // Hero Play Button (Core requirement: below text field)
  elements.playBtn.addEventListener('click', handlePlayButtonClick);

  // HTML5 Audio Event Listeners
  elements.audioPlayer.addEventListener('play', () => {
    state.isPlaying = true;
    updatePlaybackUI();
    setupWebAudioContext();
    startVisualizer();
  });

  elements.audioPlayer.addEventListener('pause', () => {
    state.isPlaying = false;
    updatePlaybackUI();
  });

  elements.audioPlayer.addEventListener('ended', () => {
    state.isPlaying = false;
    updatePlaybackUI();
    setStatus('Narration playback finished.', '');
  });

  elements.audioPlayer.addEventListener('timeupdate', () => {
    const cur = elements.audioPlayer.currentTime;
    const dur = elements.audioPlayer.duration || 0;
    elements.currentTime.textContent = formatTime(cur);
    if (dur > 0) {
      const percent = (cur / dur) * 100;
      elements.seekBar.value = percent;
      elements.seekFill.style.width = percent + '%';
    }
  });

  elements.audioPlayer.addEventListener('loadedmetadata', () => {
    elements.totalDuration.textContent = formatTime(elements.audioPlayer.duration);
  });

  // Custom Player Controls
  elements.playerPlayPauseBtn.addEventListener('click', () => {
    if (elements.audioPlayer.paused) {
      elements.audioPlayer.play();
    } else {
      elements.audioPlayer.pause();
    }
  });

  elements.seekBar.addEventListener('input', (e) => {
    const dur = elements.audioPlayer.duration;
    if (dur > 0) {
      const seekTo = (e.target.value / 100) * dur;
      elements.audioPlayer.currentTime = seekTo;
      elements.seekFill.style.width = e.target.value + '%';
    }
  });

  elements.playerRewindBtn.addEventListener('click', () => {
    elements.audioPlayer.currentTime = Math.max(0, elements.audioPlayer.currentTime - 5);
  });

  elements.playerForwardBtn.addEventListener('click', () => {
    elements.audioPlayer.currentTime = Math.min(
      elements.audioPlayer.duration || Infinity,
      elements.audioPlayer.currentTime + 5
    );
  });

  // Volume
  elements.volumeSlider.addEventListener('input', (e) => {
    elements.audioPlayer.volume = parseFloat(e.target.value);
    elements.audioPlayer.muted = false;
  });

  elements.muteBtn.addEventListener('click', () => {
    elements.audioPlayer.muted = !elements.audioPlayer.muted;
    elements.volumeSlider.value = elements.audioPlayer.muted ? 0 : elements.audioPlayer.volume;
  });

  // Playback Rate / Speed
  elements.speedSelect.addEventListener('change', (e) => {
    elements.audioPlayer.playbackRate = parseFloat(e.target.value);
  });

  // Clear History
  elements.clearHistoryBtn.addEventListener('click', () => {
    state.history = [];
    localStorage.removeItem('voxlabs_history');
    renderHistory();
    showToast('Session history cleared.');
  });
}

// Start application when DOM is ready
document.addEventListener('DOMContentLoaded', init);
