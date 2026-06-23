const AudioManager = {
  sfx: {},
  optionalSfx: {},
  music: {},
  currentMusicKey: null,
  currentMusic: null,
  audioContext: null,
  unlocked: false,
  musicActuallyPlaying: false,

  init() {
    this.sfx = {};
    this.optionalSfx = {};
    this.music = {};
    this.currentMusicKey = null;
    this.currentMusic = null;
    this.audioContext = null;
    this.unlocked = false;
    this.musicActuallyPlaying = false;

    for (const [key, src] of Object.entries((Assets.audio && Assets.audio.sfx) || {})) {
      if (!src) continue;
      this.sfx[key] = this.createAudio(src, false);
    }

    for (const [key, src] of Object.entries((Assets.audio && Assets.audio.music) || {})) {
      if (!src) continue;
      this.music[key] = this.createAudio(src, true);
    }
  },

  createAudio(src, loop, options = {}) {
    const audio = new Audio();
    audio.src = src;
    audio.preload = 'auto';
    audio.loop = loop;
    audio.dataset.failed = 'false';
    audio.addEventListener('error', () => {
      audio.dataset.failed = 'true';
      if (!options.silentMissing) console.warn('Missing audio:', src);
    });
    return audio;
  },

  unlock() {
    if (this.unlocked) return;
    this.unlocked = true;
    this.ensureAudioContext();

    for (const audio of [...Object.values(this.sfx), ...Object.values(this.music), ...Object.values(this.optionalSfx)]) {
      audio.load();
    }

    if (this.currentMusicKey) this.playMusic(this.currentMusicKey, false, true);
  },

  ensureAudioContext() {
    if (this.audioContext) return this.audioContext;
    const Context = window.AudioContext || window.webkitAudioContext;
    if (!Context) return null;
    try {
      this.audioContext = new Context();
    } catch (error) {
      this.audioContext = null;
    }
    return this.audioContext;
  },

  isSoundOn() {
    return !GAME_CONFIG.settings || GAME_CONFIG.settings.soundEnabled !== false;
  },

  isMusicEnabled() {
    return !GAME_CONFIG.settings || GAME_CONFIG.settings.musicEnabled !== false;
  },

  isMusicOn() {
    return this.isSoundOn() && this.isMusicEnabled();
  },

  isSfxOn() {
    return this.isSoundOn() && (!GAME_CONFIG.settings || GAME_CONFIG.settings.sfxEnabled !== false);
  },

  getSfxVolume(volume = 1) {
    if (!this.isSoundOn()) return 0;
    const base = GAME_CONFIG.settings && GAME_CONFIG.settings.sfxVolume != null ? GAME_CONFIG.settings.sfxVolume : 0.85;
    return Math.max(0, Math.min(1, base * volume));
  },

  getMusicVolume() {
    if (!this.isSoundOn() || !this.isMusicEnabled()) return 0;
    const base = GAME_CONFIG.settings && GAME_CONFIG.settings.musicVolume != null ? GAME_CONFIG.settings.musicVolume : 0.45;
    return Math.max(0, Math.min(1, base));
  },

  setMusicVolume(value) {
    GAME_CONFIG.settings.musicVolume = Math.max(0, Math.min(1, value));
    this.refreshSettings();
  },

  setSfxVolume(value) {
    GAME_CONFIG.settings.sfxVolume = Math.max(0, Math.min(1, value));
  },

  toggleSound() {
    GAME_CONFIG.settings.soundEnabled = GAME_CONFIG.settings.soundEnabled === false;
    this.refreshSettings();
    return GAME_CONFIG.settings.soundEnabled !== false;
  },

  toggleMusic() {
    GAME_CONFIG.settings.musicEnabled = !GAME_CONFIG.settings.musicEnabled;
    this.refreshSettings();
    return GAME_CONFIG.settings.musicEnabled;
  },

  toggleSfx() {
    GAME_CONFIG.settings.sfxEnabled = !GAME_CONFIG.settings.sfxEnabled;
    return GAME_CONFIG.settings.sfxEnabled;
  },

  playSfx(key, volume = 1, options = {}) {
    if (!this.isSfxOn()) return;
    const src = this.sfx[key];
    if (!src) {
      this.playSyntheticSfx(key, volume, options);
      return;
    }

    if (src.dataset && src.dataset.failed === 'true') {
      this.playSyntheticSfx(key, volume, options);
      return;
    }

    try {
      const audio = src.cloneNode(true);
      const playbackRate = options.playbackRate || options.rate || 1;
      const startAt = options.startAt || 0;

      audio.volume = this.getSfxVolume(volume);
      audio.playbackRate = Math.max(0.5, Math.min(2, playbackRate));
      if (startAt > 0) audio.currentTime = startAt;
      audio.play().catch(() => this.playSyntheticSfx(key, volume, options));
    } catch (error) {
      console.warn('Cannot play sfx:', key, error);
      this.playSyntheticSfx(key, volume, options);
    }
  },

  playOptionalSfx(key, volume = 1, options = {}) {
    if (!this.isSfxOn()) return false;

    const registered = this.sfx[key];
    if (registered && (!registered.dataset || registered.dataset.failed !== 'true')) {
      this.playSfx(key, volume, options);
      return true;
    }

    const srcPath = options.src || options.path;
    if (!srcPath) return false;

    const cacheKey = key || srcPath;
    let src = this.optionalSfx[cacheKey];
    if (!src) {
      src = this.createAudio(srcPath, false, { silentMissing: true });
      this.optionalSfx[cacheKey] = src;
      if (this.unlocked) src.load();
    }

    if (src.dataset && src.dataset.failed === 'true') return false;

    try {
      const audio = src.cloneNode(true);
      const playbackRate = options.playbackRate || options.rate || 1;
      const startAt = options.startAt || 0;

      audio.volume = this.getSfxVolume(volume);
      audio.playbackRate = Math.max(0.5, Math.min(2, playbackRate));
      if (startAt > 0) audio.currentTime = startAt;
      audio.play().catch(() => {});
      return true;
    } catch (error) {
      return false;
    }
  },

  playSyntheticSfx(key, volume = 1, options = {}) {
    if (!this.isSfxOn()) return;
    const presets = {
      menuMove: { start: 540, end: 880, duration: 0.095, gain: 0.18, type: 'square' },
      menuSelect: { start: 660, end: 1040, duration: 0.13, gain: 0.22, type: 'triangle' },
      menuBack: { start: 430, end: 260, duration: 0.13, gain: 0.18, type: 'triangle' },
      waveStart: { start: 360, end: 720, duration: 0.18, gain: 0.18, type: 'sawtooth' },
      waveClear: { start: 520, end: 980, duration: 0.2, gain: 0.2, type: 'triangle' },
      bossAppear: { start: 120, end: 220, duration: 0.28, gain: 0.22, type: 'sawtooth' }
    };
    const preset = presets[key];
    if (!preset) return;
    const context = this.ensureAudioContext();
    if (!context) return;
    if (context.state === 'suspended') context.resume().catch(() => {});

    const now = context.currentTime;
    const rate = Math.max(0.5, Math.min(2, options.playbackRate || options.rate || 1));
    const gain = context.createGain();
    const osc = context.createOscillator();

    osc.type = preset.type;
    osc.frequency.setValueAtTime(preset.start * rate, now);
    osc.frequency.exponentialRampToValueAtTime(Math.max(1, preset.end * rate), now + preset.duration * 0.62);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(this.getSfxVolume(volume) * preset.gain, now + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + preset.duration);

    osc.connect(gain);
    gain.connect(context.destination);
    osc.start(now);
    osc.stop(now + preset.duration + 0.01);
  },

  playMusic(key, forceRestart = false, retryIfBlocked = false) {
    if (!key) return;
    this.currentMusicKey = key;

    const next = this.music[key];
    if (!next || (next.dataset && next.dataset.failed === 'true')) return;

    if (this.currentMusic === next && !forceRestart) {
      next.volume = this.getMusicVolume();
      if (!next.paused && this.musicActuallyPlaying) return;
    }

    if (this.currentMusic !== next || forceRestart) {
      this.stopMusic();
      this.currentMusic = next;
      if (forceRestart) next.currentTime = 0;
    }

    if (retryIfBlocked && next.paused) {
      next.currentTime = next.currentTime || 0;
    }

    next.volume = this.getMusicVolume();
    next.play()
      .then(() => {
        this.musicActuallyPlaying = true;
      })
      .catch(() => {
        this.musicActuallyPlaying = false;
      });
  },

  stopMusic() {
    if (!this.currentMusic) return;
    this.currentMusic.pause();
    this.currentMusic.currentTime = 0;
    this.currentMusic = null;
    this.musicActuallyPlaying = false;
  },

  refreshSettings() {
    if (this.currentMusic) {
      this.currentMusic.volume = this.getMusicVolume();
      if (this.currentMusic.paused && this.currentMusicKey) this.playMusic(this.currentMusicKey, false, true);
      return;
    }

    if (this.currentMusicKey) this.playMusic(this.currentMusicKey, false, true);
  }
};
