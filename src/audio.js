const AudioManager = {
  sfx: {},
  music: {},
  currentMusicKey: null,
  currentMusic: null,
  unlocked: false,
  musicActuallyPlaying: false,

  init() {
    this.sfx = {};
    this.music = {};
    this.currentMusicKey = null;
    this.currentMusic = null;
    this.unlocked = false;
    this.musicActuallyPlaying = false;

    for (const [key, src] of Object.entries((Assets.audio && Assets.audio.sfx) || {})) {
      this.sfx[key] = this.createAudio(src, false);
    }

    for (const [key, src] of Object.entries((Assets.audio && Assets.audio.music) || {})) {
      this.music[key] = this.createAudio(src, true);
    }
  },

  createAudio(src, loop) {
    const audio = new Audio();
    audio.src = src;
    audio.preload = 'auto';
    audio.loop = loop;
    audio.addEventListener('error', () => {
      console.warn('Missing audio:', src);
    });
    return audio;
  },

  unlock() {
    if (this.unlocked) return;
    this.unlocked = true;

    for (const audio of [...Object.values(this.sfx), ...Object.values(this.music)]) {
      audio.load();
    }

    if (this.currentMusicKey) this.playMusic(this.currentMusicKey, false, true);
  },

  isSoundOn() {
    return !GAME_CONFIG.settings || GAME_CONFIG.settings.soundEnabled !== false;
  },

  isMusicOn() {
    return this.isSoundOn() && (!GAME_CONFIG.settings || GAME_CONFIG.settings.musicEnabled !== false);
  },

  isSfxOn() {
    return this.isSoundOn() && (!GAME_CONFIG.settings || GAME_CONFIG.settings.sfxEnabled !== false);
  },

  getSfxVolume(volume = 1) {
    const base = GAME_CONFIG.settings && GAME_CONFIG.settings.sfxVolume != null ? GAME_CONFIG.settings.sfxVolume : 0.85;
    return Math.max(0, Math.min(1, base * volume));
  },

  getMusicVolume() {
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

  toggleMusic() {
    GAME_CONFIG.settings.musicEnabled = !GAME_CONFIG.settings.musicEnabled;
    this.refreshSettings();
    return GAME_CONFIG.settings.musicEnabled;
  },

  toggleSfx() {
    GAME_CONFIG.settings.sfxEnabled = !GAME_CONFIG.settings.sfxEnabled;
    return GAME_CONFIG.settings.sfxEnabled;
  },

  playSfx(key, volume = 1) {
    if (!this.isSfxOn()) return;
    const src = this.sfx[key];
    if (!src) return;

    try {
      const audio = src.cloneNode(true);
      audio.volume = this.getSfxVolume(volume);
      audio.play().catch(() => {});
    } catch (error) {
      console.warn('Cannot play sfx:', key, error);
    }
  },

  playMusic(key, forceRestart = false, retryIfBlocked = false) {
    if (!key) return;
    this.currentMusicKey = key;

    if (!this.isMusicOn()) {
      this.stopMusic();
      return;
    }

    const next = this.music[key];
    if (!next) return;

    if (this.currentMusic === next && !forceRestart && this.musicActuallyPlaying) {
      next.volume = this.getMusicVolume();
      return;
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
    if (this.currentMusic) this.currentMusic.volume = this.getMusicVolume();
    if (!this.isMusicOn()) this.stopMusic();
    else if (this.currentMusicKey) this.playMusic(this.currentMusicKey, false, true);
  }
};
