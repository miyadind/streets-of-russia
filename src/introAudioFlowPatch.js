(function () {
  if (typeof GameApp === 'undefined' || typeof AudioManager === 'undefined') return;

  const INTRO_MUSIC = 'assets/audio/music/intro-theme.mp3';
  const INTRO_MUSIC_VOLUME = 0.42;
  const INTRO_VOICE_VOLUME = 0.72;
  const INTRO_SKIP_REVEAL_SECONDS = 0.9;
  const INTRO_VOICE_TEXT_SCALE = 0.90;
  const INTRO_FINAL_CATCHUP_START = 0.95;
  const INTRO_END_TEXT_HOLD_SECONDS = 2.15;
  const TYPE_CLICK_MIN_INTERVAL_MS = 165;
  const TYPE_CLICK_EVERY_CHARS = 5;

  function createAudio(src, loop, volume) {
    const audio = new Audio();
    audio.src = src;
    audio.preload = 'auto';
    audio.loop = loop;
    audio.volume = volume;
    audio.addEventListener('error', () => console.warn('[INTRO AUDIO FLOW] Missing audio:', src));
    return audio;
  }

  function getStartButtonRect() {
    return { x: GAME_CONFIG.width / 2 - 130, y: GAME_CONFIG.height - 86, w: 260, h: 52 };
  }

  function pointInRect(point, rect) {
    return point && point.x >= rect.x && point.x <= rect.x + rect.w && point.y >= rect.y && point.y <= rect.y + rect.h;
  }

  function smoothStep(t) {
    const x = Math.max(0, Math.min(1, t));
    return x * x * (3 - 2 * x);
  }

  function mapVoiceProgressToTextProgress(progress) {
    const p = Math.max(0, Math.min(1, progress));
    const base = p * INTRO_VOICE_TEXT_SCALE;
    if (p <= INTRO_FINAL_CATCHUP_START) return base;

    const t = smoothStep((p - INTRO_FINAL_CATCHUP_START) / (1 - INTRO_FINAL_CATCHUP_START));
    return Math.max(base, base + (1 - base) * t);
  }

  function ensureIntroMusic(game) {
    if (!game.intro) return;
    if (game.intro.music) return;

    game.intro.music = createAudio(INTRO_MUSIC, true, INTRO_MUSIC_VOLUME);
    game.intro.musicMissing = false;
  }

  function installIntroVoiceEndHold(game) {
    if (!game.intro || !game.intro.voice || game.intro.endHoldListenerInstalled) return;

    game.intro.endHoldListenerInstalled = true;
    game.intro.voice.addEventListener('ended', () => {
      if (!game.intro || game.intro.voiceSkipped) return;
      game.intro.voiceStarted = false;
      game.intro.time = game.intro.totalTimelineDuration || game.intro.time;
      game.intro.finalHoldActive = true;
      game.intro.finalHoldRemaining = INTRO_END_TEXT_HOLD_SECONDS;
      game.intro.readyToContinue = false;
      game.intro.readerScroll = 0;
    });
  }

  const originalInit = GameApp.prototype.init;
  GameApp.prototype.init = async function () {
    await originalInit.call(this);
    ensureIntroMusic(this);
    installIntroVoiceEndHold(this);
  };

  GameApp.prototype.syncIntroAudioVolumes = function () {
    if (!this.intro) return;
    const enabled = AudioManager.isMusicOn();

    if (this.intro.music) {
      const baseMusicVolume = AudioManager.getMusicVolume ? AudioManager.getMusicVolume() : INTRO_MUSIC_VOLUME;
      this.intro.music.volume = enabled ? Math.max(0, Math.min(1, baseMusicVolume)) : 0;
    }

    if (this.intro.voice) {
      this.intro.voice.volume = enabled ? INTRO_VOICE_VOLUME : 0;
    }
  };

  GameApp.prototype.playIntroBackgroundMusic = function () {
    ensureIntroMusic(this);
    const music = this.intro && this.intro.music;
    if (!music || this.intro.musicMissing) return;

    try {
      this.syncIntroAudioVolumes();
      music.currentTime = 0;
      music.play().catch((error) => {
        this.intro.musicMissing = true;
        console.warn('[INTRO AUDIO FLOW] Intro background music failed:', error);
      });
    } catch (error) {
      this.intro.musicMissing = true;
      console.warn('[INTRO AUDIO FLOW] Cannot play intro background music:', error);
    }
  };

  GameApp.prototype.stopIntroBackgroundMusic = function () {
    const music = this.intro && this.intro.music;
    if (!music) return;
    try {
      music.pause();
      music.currentTime = 0;
    } catch (error) {}
  };

  GameApp.prototype.playIntroVoice = function () {
    const voice = this.intro && this.intro.voice;
    if (!voice || this.intro.voiceMissing || this.intro.voiceSkipped) return;

    try {
      this.syncIntroAudioVolumes();
      voice.currentTime = 0;
      voice.play().catch((error) => {
        this.intro.voiceStarted = false;
        console.warn('[INTRO AUDIO FLOW] Intro voice failed:', error);
      });
    } catch (error) {
      this.intro.voiceMissing = true;
      console.warn('[INTRO AUDIO FLOW] Cannot play intro voice:', error);
    }
  };

  GameApp.prototype.stopIntroVoiceOnly = function () {
    const voice = this.intro && this.intro.voice;
    if (!voice) return;
    try {
      voice.pause();
      voice.currentTime = 0;
    } catch (error) {}
    this.intro.voiceStarted = false;
  };

  GameApp.prototype.stopIntroVoice = function () {
    this.stopIntroVoiceOnly();
  };

  GameApp.prototype.stopIntroMusic = function () {
    this.stopIntroVoiceOnly();
    this.stopIntroBackgroundMusic();
  };

  GameApp.prototype.startIntro = function () {
    if (!this.intro) return;

    ensureIntroMusic(this);
    installIntroVoiceEndHold(this);
    AudioManager.stopMusic();

    this.intro.time = 0;
    this.intro.firstRun = !this.hasSeenIntro || !this.hasSeenIntro();
    this.intro.fastForward = false;
    this.intro.skipRequested = false;
    this.intro.skipElapsed = 0;
    this.intro.voiceSkipped = false;
    this.intro.finalHoldActive = false;
    this.intro.finalHoldRemaining = 0;
    this.intro.readyToContinue = false;
    this.intro.readerScroll = 0;
    this.intro.lastTypedCursor = 0;
    this.intro.lastTypeSoundAt = 0;
    this.intro.voiceStarted = false;

    if (this.intro.typewriterSound) this.intro.typewriterSound.load();
    if (this.intro.voice) this.intro.voice.load();
    if (this.intro.music) this.intro.music.load();
    if (this.bindIntroWheel) this.bindIntroWheel();

    this.setState('intro');
    this.playIntroBackgroundMusic();
    this.playIntroVoice();
  };

  GameApp.prototype.finishIntro = function () {
    if (this.markIntroSeen) this.markIntroSeen();
    this.stopIntroVoiceOnly();
    this.stopIntroBackgroundMusic();
    this.setState('campaignMap');
    this.ensureMenuMusic();
  };

  GameApp.prototype.getIntroVoiceProgress = function () {
    const voice = this.intro && this.intro.voice;
    if (!voice || this.intro.voiceMissing || this.intro.voiceSkipped || !this.intro.voiceStarted) return null;
    const duration = Number.isFinite(voice.duration) && voice.duration > 0 ? voice.duration : 0;
    if (!duration || !Number.isFinite(voice.currentTime)) return null;
    return Math.max(0, Math.min(1, voice.currentTime / duration));
  };

  GameApp.prototype.requestIntroSkip = function () {
    if (!this.intro || this.intro.readyToContinue) return;
    this.stopIntroVoiceOnly();
    this.intro.voiceSkipped = true;
    this.intro.fastForward = true;
    this.intro.skipRequested = true;
    this.intro.skipElapsed = 0;
    this.intro.finalHoldActive = false;
    this.intro.finalHoldRemaining = 0;
    this.intro.lastTypedCursor = Number.MAX_SAFE_INTEGER;
  };

  const originalGeneratedTypeClick = GameApp.prototype.playGeneratedIntroTypeClick;
  GameApp.prototype.playGeneratedIntroTypeClick = function () {
    if (this.intro && this.intro.fastForward) return;

    try {
      const AudioCtor = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtor) return;
      if (!this.intro.audioContext) this.intro.audioContext = new AudioCtor();
      const audioCtx = this.intro.audioContext;
      if (audioCtx.state === 'suspended') audioCtx.resume().catch(() => {});

      const t = audioCtx.currentTime;
      const oscillator = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      const filter = audioCtx.createBiquadFilter();

      oscillator.type = 'square';
      oscillator.frequency.value = 760 + Math.random() * 180;
      filter.type = 'highpass';
      filter.frequency.value = 480;
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(0.032, t + 0.006);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.075);

      oscillator.connect(filter);
      filter.connect(gain);
      gain.connect(audioCtx.destination);
      oscillator.start(t);
      oscillator.stop(t + 0.08);
    } catch (error) {
      if (originalGeneratedTypeClick) originalGeneratedTypeClick.call(this);
    }
  };

  GameApp.prototype.playIntroTypeClick = function (typedCursor) {
    if (!this.intro || this.intro.fastForward) return;
    if (!typedCursor || typedCursor <= this.intro.lastTypedCursor) return;
    if (typedCursor % TYPE_CLICK_EVERY_CHARS !== 0) {
      this.intro.lastTypedCursor = typedCursor;
      return;
    }
    if (AudioManager.isSfxOn && !AudioManager.isSfxOn()) {
      this.intro.lastTypedCursor = typedCursor;
      return;
    }

    const now = performance.now();
    if (now - this.intro.lastTypeSoundAt < TYPE_CLICK_MIN_INTERVAL_MS) {
      this.intro.lastTypedCursor = typedCursor;
      return;
    }

    const realSound = this.intro.typewriterSound;
    if (realSound && !this.intro.typewriterSoundMissing) {
      try {
        const click = realSound.cloneNode(true);
        click.volume = 0.22;
        click.currentTime = 0;
        click.play().catch(() => {
          this.intro.typewriterSoundMissing = true;
          this.playGeneratedIntroTypeClick();
        });
      } catch (error) {
        this.intro.typewriterSoundMissing = true;
        this.playGeneratedIntroTypeClick();
      }
    } else {
      this.playGeneratedIntroTypeClick();
    }

    this.intro.lastTypeSoundAt = now;
    this.intro.lastTypedCursor = typedCursor;
  };

  GameApp.prototype.updateIntro = function (dt) {
    if (!this.intro) return;

    const click = Input.consumePointer();
    const anyKey = Input.consumeAnyKey();
    const requestedAction = !!(click || anyKey);

    this.syncIntroAudioVolumes();

    if (click && this.handleSpeakerClick(click)) return;

    if (this.intro.finalHoldActive) {
      this.intro.time = this.intro.totalTimelineDuration || this.intro.time;
      this.intro.finalHoldRemaining -= dt / 1000;
      if (this.intro.finalHoldRemaining <= 0) {
        this.intro.finalHoldActive = false;
        this.intro.readyToContinue = true;
        this.intro.readerScroll = 0;
      }
      return;
    }

    if (this.intro.readyToContinue) {
      if (click && pointInRect(click, getStartButtonRect())) {
        this.finishIntro();
        return;
      }

      if (Input.consume('arrowup') || Input.consume('w')) this.scrollIntroReader(-1);
      if (Input.consume('arrowdown') || Input.consume('s')) this.scrollIntroReader(1);
      if (Input.consume('pageup')) this.scrollIntroReader(-4);
      if (Input.consume('pagedown')) this.scrollIntroReader(4);

      if (Input.consume('enter') || Input.consume('space')) this.finishIntro();
      return;
    }

    if (requestedAction) this.requestIntroSkip();

    const voiceProgress = this.getIntroVoiceProgress();
    if (voiceProgress != null && this.intro.totalTimelineDuration > 0) {
      const textProgress = mapVoiceProgressToTextProgress(voiceProgress);
      this.intro.time = textProgress * this.intro.totalTimelineDuration;
      return;
    }

    if (this.intro.skipRequested && this.intro.totalTimelineDuration > 0) {
      this.intro.skipElapsed += dt / 1000;
      const remaining = Math.max(0, this.intro.totalTimelineDuration - this.intro.time);
      const step = Math.max(remaining / Math.max(0.01, INTRO_SKIP_REVEAL_SECONDS), this.intro.totalTimelineDuration * 0.5);
      this.intro.time = Math.min(this.intro.totalTimelineDuration, this.intro.time + step * (dt / 1000));
      if (this.intro.time >= this.intro.totalTimelineDuration) {
        this.intro.readyToContinue = true;
        this.intro.readerScroll = 0;
      }
      return;
    }

    this.intro.time += dt / 1000;
  };

  const originalDrawIntroReader = GameApp.prototype.drawIntroReader;
  GameApp.prototype.drawIntroReader = function (ctx, lines, maxWidth) {
    if (originalDrawIntroReader) originalDrawIntroReader.call(this, ctx, lines, maxWidth);

    const btn = getStartButtonRect();
    const pulse = 0.45 + 0.55 * Math.abs(Math.sin(performance.now() / 260));

    ctx.save();
    ctx.globalAlpha = 0.22 + pulse * 0.32;
    ctx.fillStyle = '#ff2b2b';
    ctx.fillRect(btn.x, btn.y, btn.w, btn.h);

    ctx.globalAlpha = 0.65 + pulse * 0.35;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 5 + pulse * 3;
    ctx.strokeRect(btn.x - 3, btn.y - 3, btn.w + 6, btn.h + 6);

    ctx.font = 'bold 28px Arial';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 6;
    ctx.strokeText('НАЧАТЬ', btn.x + btn.w / 2, btn.y + 34);
    ctx.fillText('НАЧАТЬ', btn.x + btn.w / 2, btn.y + 34);
    ctx.restore();
  };

  const originalHandleSpeakerClick = GameApp.prototype.handleSpeakerClick;
  GameApp.prototype.handleSpeakerClick = function (point) {
    if (!point || this.state === 'splash' || this.state === 'loading') return false;

    const rect = this.getSpeakerHitRect ? this.getSpeakerHitRect() : this.getSpeakerRect();
    if (!rect || point.x < rect.x || point.x > rect.x + rect.w || point.y < rect.y || point.y > rect.y + rect.h) return false;

    AudioManager.unlock();
    const musicOn = AudioManager.toggleMusic();

    if (this.state === 'intro') {
      this.syncIntroAudioVolumes();
      if (musicOn) {
        if (this.intro.music && this.intro.music.paused) this.intro.music.play().catch(() => {});
        if (this.intro.voice && !this.intro.voiceSkipped && this.intro.voice.paused && !this.intro.readyToContinue) {
          this.intro.voice.play().catch(() => {});
        }
      }
      AudioManager.playSfx('menuSelect', 0.7);
      return true;
    }

    if (originalHandleSpeakerClick) return originalHandleSpeakerClick.call(this, point);
    return false;
  };
})();
