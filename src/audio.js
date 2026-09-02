const AudioManager = {
  sfx: {},
  optionalSfx: {},
  music: {},
  currentMusicKey: null,
  currentMusic: null,
  audioContext: null,
  unlocked: false,
  musicActuallyPlaying: false,
  activeSfx: [],
  pausedAudio: [],
  externalAudio: new Map(),
  audioContexts: new Set(),
  musicPauseReasons: null,
  voiceDuckSources: null,
  voiceDuckSequence: 0,
  enemyAppearType: null,

  init() {
    this.sfx = {};
    this.optionalSfx = {};
    this.music = {};
    this.currentMusicKey = null;
    this.currentMusic = null;
    this.audioContext = null;
    this.unlocked = false;
    this.musicActuallyPlaying = false;
    this.activeSfx = [];
    this.pausedAudio = [];
    this.externalAudio = new Map();
    this.audioContexts = new Set();
    this.musicPauseReasons = new Set();
    this.voiceDuckSources = new Set();
    this.voiceDuckSequence = 0;
    this.enemyAppearType = null;
    this.combatSfxPrimed = false;

    for (const [key, src] of Object.entries((Assets.audio && Assets.audio.sfx) || {})) {
      if (!src) continue;
      this.sfx[key] = this.createAudio(src, false);
    }

    this.registerCharacterSfx();

    for (const [key, src] of Object.entries((Assets.audio && Assets.audio.music) || {})) {
      if (!src) continue;
      this.music[key] = this.createAudio(src, true);
    }
    this.configureMenuPlaylist();
  },

  createAudio(src, loop, options = {}) {
    const audio = new Audio();
    audio.preload = 'none';
    audio.src = src;
    audio.loop = loop;
    audio.dataset.failed = 'false';
    audio.addEventListener('error', () => {
      audio.dataset.failed = 'true';
      if (!options.silentMissing) console.warn('Missing audio:', src);
    });
    return audio;
  },

  unlock() {
    if (!this.unlocked) {
      this.unlocked = true;
      this.ensureAudioContext();
    }
    this.primeCombatSfx();

    if (this.currentMusicKey) this.playMusic(this.currentMusicKey, false, true);
  },

  primeCombatSfx() {
    if (this.combatSfxPrimed) return;
    this.combatSfxPrimed = true;
    const keys = ['punch', 'punch1', 'punch2', 'punch3', 'hit', 'enemyDown', 'playerDown'];
    for (const key of keys) {
      const audio = this.sfx && this.sfx[key];
      if (!audio) continue;
      audio.preload = 'auto';
      try { audio.load(); } catch (error) {}
    }
  },

  ensureAudioContext() {
    if (this.audioContext) return this.audioContext;
    const Context = window.AudioContext || window.webkitAudioContext;
    if (!Context) return null;
    try {
      this.audioContext = new Context();
      this.registerAudioContext(this.audioContext);
    } catch (error) {
      this.audioContext = null;
    }
    return this.audioContext;
  },

  registerAudioContext(context) {
    if (context) this.audioContexts.add(context);
    return context;
  },

  registerExternalAudio(audio, options = {}) {
    if (!audio) return audio;
    const metadata = {
      owner: options.owner || 'external',
      channel: options.channel || 'sfx',
      resume: options.resume !== false,
      baseVolume: Number.isFinite(options.volume)
        ? Math.max(0, Math.min(1, options.volume))
        : Math.max(0, Math.min(1, Number(audio.volume) || 1))
    };
    this.externalAudio.set(audio, metadata);
    const cleanup = () => this.externalAudio.delete(audio);
    audio.addEventListener('error', cleanup, { once: true });
    if (!audio.loop) audio.addEventListener('ended', cleanup, { once: true });
    return audio;
  },

  configureMenuPlaylist() {
    this.menuPlaylist = ['menuTheme', 'menuThemeAlt'].filter(key => this.music[key]);
    for (const key of this.menuPlaylist) {
      const audio = this.music[key];
      audio.loop = false;
      audio.addEventListener('ended', () => this.playNextMenuTrack(key));
    }
  },

  playNextMenuTrack(currentKey) {
    const playlist = this.menuPlaylist || [];
    const index = playlist.indexOf(currentKey);
    if (index < 0 || this.currentMusicKey !== currentKey || !this.currentMusic || this.isMusicPausedByGame()) return;

    const game = window.game;
    if (!game || !game.isMenuState || !game.isMenuState(game.state)) return;

    const nextKey = playlist[(index + 1) % playlist.length];
    game.menuMusicKey = nextKey;
    this.playMusic(nextKey, true, true);
  },

  unregisterExternalAudio(audio) {
    if (audio) this.externalAudio.delete(audio);
  },

  stopExternalAudio(owner) {
    for (const [audio, metadata] of this.externalAudio) {
      if (owner && metadata.owner !== owner) continue;
      try {
        audio.pause();
        audio.currentTime = 0;
      } catch (error) {}
    }
    this.pausedAudio = (this.pausedAudio || []).filter(audio => {
      const metadata = this.externalAudio.get(audio);
      return !metadata || (owner && metadata.owner !== owner);
    });
  },

  canResumeExternalAudio(audio) {
    const metadata = this.externalAudio.get(audio);
    if (!metadata || !metadata.resume || document.hidden) return false;
    const game = window.game;
    if (metadata.owner === 'intro') return !!game && game.state === 'intro';
    if (metadata.owner === 'gundos') return !!game && game.state === 'level' && !game.paused;
    if (metadata.owner === 'heroVoice') return !!game && game.state === 'level' && !game.paused && this.isSfxOn();
    return metadata.channel === 'music' ? this.isMusicOn() : this.isSfxOn();
  },

  stopAllAudio() {
    this.stopMusic();
    for (const audio of this.activeSfx || []) {
      if (audio.__voiceDuckSource) this.setVoiceDucking(false, audio.__voiceDuckSource);
      try {
        audio.pause();
        audio.currentTime = 0;
      } catch (error) {}
    }
    this.activeSfx = [];
    if (this.voiceDuckSources) this.voiceDuckSources.clear();
    this.voiceDucking = false;
    this.stopExternalAudio();
    this.pausedAudio = [];
    for (const context of this.audioContexts || []) {
      try { context.suspend(); } catch (error) {}
    }
    if (this.audioContext) {
      try { this.audioContext.suspend(); } catch (error) {}
    }
  },

  stopGameplayAudio() {
    for (const audio of this.activeSfx || []) {
      if (audio && audio.__voiceDuckSource) this.setVoiceDucking(false, audio.__voiceDuckSource);
      try {
        audio.pause();
        audio.currentTime = 0;
      } catch (error) {}
    }
    this.activeSfx = [];
    if (this.voiceDuckSources) this.voiceDuckSources.clear();
    this.voiceDucking = false;
    this.stopExternalAudio();
    // A later focus event must not resume a track from the level we just left.
    this.pausedAudio = [];
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
    const ducking = this.voiceDucking || (this.voiceDuckSources && this.voiceDuckSources.size > 0) ? 0.28 : 1;
    return Math.max(0, Math.min(1, base * ducking));
  },

  setVoiceDucking(active, source = 'voice') {
    if (!this.voiceDuckSources) this.voiceDuckSources = new Set();
    if (active) this.voiceDuckSources.add(source);
    else this.voiceDuckSources.delete(source);
    this.voiceDucking = this.voiceDuckSources.size > 0;
    if (this.currentMusic) this.currentMusic.volume = this.getMusicVolume();
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
    this.syncExternalAudioVolumes();
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

  trackSfx(audio) {
    if (!audio) return audio;
    this.activeSfx = this.activeSfx.filter(item => item && !item.ended && !item.paused);
    this.activeSfx.push(audio);
    const cleanup = () => {
      this.activeSfx = this.activeSfx.filter(item => item !== audio);
    };
    audio.addEventListener('ended', cleanup, { once: true });
    audio.addEventListener('error', cleanup, { once: true });
    return audio;
  },

  untrackSfx(audio) {
    this.activeSfx = (this.activeSfx || []).filter(item => item !== audio);
  },

  isCombatSfx(key) {
    return ['punch', 'punch1', 'punch2', 'punch3', 'hit', 'enemyDown', 'playerDown'].includes(key);
  },

  stopActiveSfx() {
    for (const audio of this.activeSfx || []) {
      if (audio.__voiceDuckSource) this.setVoiceDucking(false, audio.__voiceDuckSource);
      try {
        audio.pause();
        audio.currentTime = 0;
      } catch (error) {}
    }
    this.activeSfx = [];

    for (const [audio, metadata] of this.externalAudio || []) {
      if (metadata && metadata.channel === 'music') continue;
      try {
        audio.pause();
        audio.currentTime = 0;
      } catch (error) {}
    }
  },

  getAssetDirectory(src) {
    if (!src || typeof src !== 'string' || src.indexOf('/') === -1) return null;
    return src.slice(0, src.lastIndexOf('/'));
  },

  getHeroHitSrc(heroKey) {
    const heroAssets = Assets && Assets[heroKey];
    const dir = this.getAssetDirectory(heroAssets && heroAssets.idle);
    return dir ? dir + '/Hit.mp3' : null;
  },

  getEnemyAppearSrc(enemyType) {
    if (enemyType === 'dogRegime') return null;
    const enemyConfig = (GAME_CONFIG.enemies && GAME_CONFIG.enemies[enemyType]) || {};
    if (enemyConfig.appearSoundPath) return enemyConfig.appearSoundPath;
    if (Assets.enemyAppear && Assets.enemyAppear[enemyType]) return Assets.enemyAppear[enemyType];
    const folder = String(enemyType || 'enemy').replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
    return 'assets/enemies/' + folder + '/Appear.mp3';
  },

  registerCharacterSfx() {
    for (const enemyType of Object.keys((GAME_CONFIG && GAME_CONFIG.enemies) || {})) {
      const src = this.getEnemyAppearSrc(enemyType);
      if (!src) continue;
      this.sfx[enemyType + 'Appear'] = this.createAudio(src, false);
    }

    for (const heroKey of Object.keys((GAME_CONFIG && GAME_CONFIG.heroes) || {})) {
      const src = this.getHeroHitSrc(heroKey);
      if (!src) continue;
      this.sfx[heroKey + 'Hit'] = this.createAudio(src, false);
    }
  },

  isUsableSfxKey(key) {
    const audio = this.sfx && this.sfx[key];
    return !!audio && (!audio.dataset || audio.dataset.failed !== 'true');
  },

  playSfx(key, volume = 1, options = {}) {
    if (!this.isSfxOn()) return;
    if (this.isBlockedHorseAppear(key, options)) return;
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
      const requestedAt = performance.now();
      const playbackRate = options.playbackRate || options.rate || 1;
      const startAt = options.startAt || 0;
      const duckSource = options.duckMusic
        ? `${options.duckSource || key}:${++this.voiceDuckSequence}`
        : null;
      let duckReleased = false;
      const releaseDuck = () => {
        if (!duckSource || duckReleased) return;
        duckReleased = true;
        this.setVoiceDucking(false, duckSource);
      };

      audio.volume = this.getSfxVolume(volume);
      audio.__sfxVolumeMultiplier = volume;
      audio.preload = 'auto';
      audio.playbackRate = Math.max(0.5, Math.min(2, playbackRate));
      if (startAt > 0) audio.currentTime = startAt;
      if (duckSource) {
        audio.__voiceDuckSource = duckSource;
        this.setVoiceDucking(true, duckSource);
        audio.addEventListener('ended', releaseDuck, { once: true });
        audio.addEventListener('error', releaseDuck, { once: true });
      }
      this.trackSfx(audio);
      audio.play().then(() => {
        // Never let an unloaded punch play long after the animation that caused it.
        if (this.isCombatSfx(key) && performance.now() - requestedAt > 260) {
          try {
            audio.pause();
            audio.currentTime = 0;
          } catch (error) {}
          this.untrackSfx(audio);
          releaseDuck();
        }
      }).catch(() => {
        releaseDuck();
        this.playSyntheticSfx(key, volume, options);
      });
    } catch (error) {
      console.warn('Cannot play sfx:', key, error);
      this.playSyntheticSfx(key, volume, options);
    }
  },

  playOptionalSfx(key, volume = 1, options = {}) {
    if (!this.isSfxOn()) return false;
    if (this.isBlockedHorseAppear(key, options)) return false;

    const registered = this.sfx[key];
    if (registered && (!registered.dataset || registered.dataset.failed !== 'true')) {
      this.playSfx(key, volume, options);
      return true;
    }

    const srcPath = options.src || options.path;
    if (this.isBlockedHorseAppear(key, { src: srcPath })) return false;
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
      const duckSource = options.duckMusic
        ? `${options.duckSource || key}:${++this.voiceDuckSequence}`
        : null;
      let duckReleased = false;
      const releaseDuck = () => {
        if (!duckSource || duckReleased) return;
        duckReleased = true;
        this.setVoiceDucking(false, duckSource);
      };

      audio.volume = this.getSfxVolume(volume);
      audio.__sfxVolumeMultiplier = volume;
      audio.playbackRate = Math.max(0.5, Math.min(2, playbackRate));
      if (startAt > 0) audio.currentTime = startAt;
      if (duckSource) {
        audio.__voiceDuckSource = duckSource;
        this.setVoiceDucking(true, duckSource);
        audio.addEventListener('ended', releaseDuck, { once: true });
        audio.addEventListener('error', releaseDuck, { once: true });
      }
      this.trackSfx(audio);
      audio.play().catch(releaseDuck);
      return true;
    } catch (error) {
      return false;
    }
  },

  isBlockedHorseAppear(key, options = {}) {
    const src = String(options.src || options.path || '').replace(/\\/g, '/').toLowerCase();
    const registered = this.sfx && key ? this.sfx[key] : null;
    const optional = this.optionalSfx && key ? this.optionalSfx[key] : null;
    const registeredSrc = registered && registered.src ? String(registered.src).replace(/\\/g, '/').toLowerCase() : '';
    const optionalSrc = optional && optional.src ? String(optional.src).replace(/\\/g, '/').toLowerCase() : '';
    const isHorseAppear = key === 'horseAppear' ||
      src.includes('assets/enemies/horse/appear.mp3') ||
      registeredSrc.includes('assets/enemies/horse/appear.mp3') ||
      optionalSrc.includes('assets/enemies/horse/appear.mp3');
    return isHorseAppear && this.enemyAppearType !== 'horse';
  },

  stopHorseAppearSfx() {
    this.activeSfx = (this.activeSfx || []).filter((audio) => {
      const src = audio && audio.src ? String(audio.src).replace(/\\/g, '/').toLowerCase() : '';
      if (!src.includes('assets/enemies/horse/appear.mp3')) return true;
      try {
        audio.pause();
        audio.currentTime = 0;
      } catch (error) {}
      return false;
    });
  },

  allMusicTracks() {
    return Object.values(this.music || {}).filter(Boolean);
  },

  silenceOtherMusic(except) {
    for (const audio of this.allMusicTracks()) {
      if (!audio || audio === except) continue;
      try {
        audio.pause();
        audio.currentTime = 0;
      } catch (error) {}
    }
  },

  isMusicPausedByGame() {
    return !!(this.musicPauseReasons && this.musicPauseReasons.size > 0);
  },

  pauseCurrentMusicForReason() {
    this.silenceOtherMusic(this.currentMusic || null);
    if (!this.currentMusic) return;
    try {
      if (!this.currentMusic.paused) this.currentMusic.pause();
    } catch (error) {}
    this.musicActuallyPlaying = false;
  },

  setMusicPauseReason(reason, paused) {
    if (!reason) return;
    if (!this.musicPauseReasons) this.musicPauseReasons = new Set();
    const hadPause = this.musicPauseReasons.size > 0;
    if (paused) this.musicPauseReasons.add(reason);
    else this.musicPauseReasons.delete(reason);

    const hasPause = this.musicPauseReasons.size > 0;
    if (hasPause) {
      this.pauseCurrentMusicForReason();
    } else if (hadPause && this.currentMusicKey && this.isMusicOn()) {
      this.playMusic(this.currentMusicKey, false, true);
    }
  },

  playSyntheticSfx(key, volume = 1, options = {}) {
    if (!this.isSfxOn()) return;
    const presets = {
      menuMove: { start: 540, end: 880, duration: 0.12, gain: 0.34, type: 'square' },
      menuSelect: { start: 660, end: 1040, duration: 0.13, gain: 0.22, type: 'triangle' },
      menuBack: { start: 430, end: 260, duration: 0.13, gain: 0.18, type: 'triangle' },
      waveStart: { start: 360, end: 720, duration: 0.18, gain: 0.18, type: 'sawtooth' },
      waveClear: { start: 520, end: 980, duration: 0.2, gain: 0.2, type: 'triangle' },
      revive: { start: 240, end: 1280, duration: 0.48, gain: 0.28, type: 'sine' },
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
    const next = this.music[key];
    if (!next || (next.dataset && next.dataset.failed === 'true')) return;
    const previous = this.currentMusic;
    const isSameTrack = previous === next;
    this.currentMusicKey = key;

    if (this.isMusicPausedByGame()) {
      if (forceRestart) {
        try { next.currentTime = 0; } catch (error) {}
      }
      this.pauseCurrentMusicForReason();
      return;
    }

    if (isSameTrack && !forceRestart) {
      next.volume = this.getMusicVolume();
      if (!next.paused && this.musicActuallyPlaying) return;
    }

    if (!isSameTrack || forceRestart) {
      this.silenceOtherMusic(null);
      this.currentMusic = next;
      if (forceRestart) next.currentTime = 0;
    }

    if (retryIfBlocked && next.paused) {
      next.currentTime = next.currentTime || 0;
    }

    next.volume = this.getMusicVolume();
    const playToken = (this.musicPlayToken || 0) + 1;
    this.musicPlayToken = playToken;
    next.play()
      .then(() => {
        if (this.musicPlayToken !== playToken || this.currentMusic !== next) {
          try { next.pause(); next.currentTime = 0; } catch (error) {}
          return;
        }
        this.musicActuallyPlaying = true;
        this.silenceOtherMusic(next);
      })
      .catch(() => {
        this.musicActuallyPlaying = false;
      });
  },

  stopMusic() {
    if (this.currentMusic) {
      try {
        this.currentMusic.pause();
        this.currentMusic.currentTime = 0;
      } catch (error) {}
    }
    this.currentMusic = null;
    this.currentMusicKey = null;
    this.musicPlayToken = (this.musicPlayToken || 0) + 1;
    this.musicActuallyPlaying = false;
    this.silenceOtherMusic(null);
  },

  pauseAllAudio() {
    const paused = (this.pausedAudio || []).filter(audio => audio && !audio.ended);
    const candidates = [
      this.currentMusic,
      ...this.activeSfx.filter(item => item && !item.ended),
      ...this.externalAudio.keys()
    ];

    for (const audio of candidates) {
      if (!audio || audio.ended || paused.includes(audio)) continue;
      if (audio.paused) continue;
      try {
        audio.pause();
        paused.push(audio);
      } catch (error) {}
    }

    this.pausedAudio = paused;
    this.musicActuallyPlaying = false;
  },

  resumePausedAudio() {
    const paused = this.pausedAudio || [];
    this.pausedAudio = [];
    for (const context of this.audioContexts || []) {
      try {
        if (context.state === 'suspended') context.resume();
      } catch (error) {}
    }
    if (this.audioContext) {
      try {
        if (this.audioContext.state === 'suspended') this.audioContext.resume();
      } catch (error) {}
    }
    for (const audio of paused) {
      if (!audio || audio.ended) continue;
      try {
        if (!audio.paused) continue;
        if (this.externalAudio.has(audio) && !this.canResumeExternalAudio(audio)) continue;
        if (audio === this.currentMusic) {
          if (this.isMusicPausedByGame()) continue;
          audio.volume = this.getMusicVolume();
        } else if (this.activeSfx.includes(audio)) {
          audio.volume = this.getSfxVolume(audio.__sfxVolumeMultiplier || 1);
        }
        audio.play()
          .then(() => {
            if (audio === this.currentMusic) this.musicActuallyPlaying = true;
          })
          .catch(() => {});
      } catch (error) {}
    }
  },

  syncManagedVolumes() {
    if (this.currentMusic) this.currentMusic.volume = this.getMusicVolume();
    for (const audio of this.activeSfx || []) {
      if (!audio || audio.ended) continue;
      audio.volume = this.getSfxVolume(audio.__sfxVolumeMultiplier || 1);
    }
    this.syncExternalAudioVolumes();
  },

  syncExternalAudioVolumes() {
    for (const [audio, metadata] of this.externalAudio || []) {
      if (!audio || !metadata) continue;
      const enabled = metadata.channel === 'music' ? this.isMusicOn() : this.isSfxOn();
      audio.volume = enabled ? metadata.baseVolume : 0;
    }
  },

  refreshSettings() {
    if (this.isMusicPausedByGame()) {
      this.pauseCurrentMusicForReason();
      return;
    }

    if (this.currentMusic) {
      this.currentMusic.volume = this.getMusicVolume();
      if (this.currentMusic.paused && this.currentMusicKey) this.playMusic(this.currentMusicKey, false, true);
      this.silenceOtherMusic(this.currentMusic);
      return;
    }

    if (this.currentMusicKey) this.playMusic(this.currentMusicKey, false, true);
  }
};

if (typeof document !== 'undefined' && !AudioManager.windowPauseListenersInstalled) {
  document.addEventListener('visibilitychange', () => {
    AudioManager.setMusicPauseReason('hidden-tab', document.visibilityState !== 'visible');
    if (document.hidden) AudioManager.pauseAllAudio();
    else {
      AudioManager.syncManagedVolumes();
      AudioManager.resumePausedAudio();
    }
  });

  window.addEventListener('blur', () => {
    AudioManager.setMusicPauseReason('window-blur', true);
    AudioManager.pauseAllAudio();
  });

  window.addEventListener('focus', () => {
    AudioManager.setMusicPauseReason('window-blur', false);
    if (!document.hidden) {
      AudioManager.syncManagedVolumes();
      AudioManager.resumePausedAudio();
    }
  });

  const stopForExit = () => AudioManager.stopAllAudio();
  window.addEventListener('pagehide', stopForExit);
  window.addEventListener('beforeunload', stopForExit);

  AudioManager.windowPauseListenersInstalled = true;
}
