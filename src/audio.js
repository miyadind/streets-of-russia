const AudioManager = {
  sfx: {},
  music: {},
  currentMusicKey: null,
  currentMusic: null,
  unlocked: false,

  init() {
    this.sfx = {};
    this.music = {};
    this.currentMusicKey = null;
    this.currentMusic = null;
    this.unlocked = false;

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

    if (this.currentMusicKey) this.playMusic(this.currentMusicKey, true);
  },

  isSoundOn() {
    return !GAME_CONFIG.settings || GAME_CONFIG.settings.soundEnabled !== false;
  },

  isMusicOn() {
    return this.isSoundOn() && (!GAME_CONFIG.settings || GAME_CONFIG.settings.musicEnabled !== false);
  },

  getSfxVolume(volume = 1) {
    const base = GAME_CONFIG.settings && GAME_CONFIG.settings.sfxVolume != null ? GAME_CONFIG.settings.sfxVolume : 0.85;
    return Math.max(0, Math.min(1, base * volume));
  },

  getMusicVolume() {
    const base = GAME_CONFIG.settings && GAME_CONFIG.settings.musicVolume != null ? GAME_CONFIG.settings.musicVolume : 0.45;
    return Math.max(0, Math.min(1, base));
  },

  playSfx(key, volume = 1) {
    if (!this.isSoundOn()) return;
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

  playMusic(key, forceRestart = false) {
    if (!key) return;
    this.currentMusicKey = key;

    if (!this.isMusicOn()) {
      this.stopMusic();
      return;
    }

    const next = this.music[key];
    if (!next) return;

    if (this.currentMusic === next && !forceRestart) {
      next.volume = this.getMusicVolume();
      return;
    }

    this.stopMusic();
    this.currentMusic = next;
    next.currentTime = 0;
    next.volume = this.getMusicVolume();
    next.play().catch(() => {});
  },

  stopMusic() {
    if (!this.currentMusic) return;
    this.currentMusic.pause();
    this.currentMusic.currentTime = 0;
    this.currentMusic = null;
  },

  refreshSettings() {
    if (this.currentMusic) this.currentMusic.volume = this.getMusicVolume();
    if (!this.isMusicOn()) this.stopMusic();
    else if (this.currentMusicKey && !this.currentMusic) this.playMusic(this.currentMusicKey, true);
  }
};
