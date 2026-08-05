(function () {
  if (typeof GameApp === 'undefined' || typeof AudioManager === 'undefined') return;

  const INTRO_MUSIC = 'assets/audio/music/intro-theme.mp3';
  const INTRO_MUSIC_VOLUME = 0.42;
  const INTRO_VOICE_VOLUME = 0.72;
  const INTRO_SKIP_REVEAL_SECONDS = 0.9;
  const INTRO_VOICE_TEXT_SCALE = 0.90;
  const INTRO_FINAL_PAUSE_TRIM_SECONDS = 0.5;
  const INTRO_FINAL_PAUSE_TRIM_START_PROGRESS = 0.88;
  const INTRO_END_TEXT_HOLD_SECONDS = 3.0;
  const INTRO_TEXT_FADE_SECONDS = 1.45;
  const INTRO_BUTTON_FADE_SECONDS = 0.85;
  // Keep skipping locked until the opening voice has had time to finish its
  // first thought, not merely until the typewriter text has appeared.
  const INTRO_SKIP_UNLOCK_VOICE_SECONDS = 10;
  const TYPE_CLICK_MIN_INTERVAL_MS = 165;
  const TYPE_CLICK_EVERY_CHARS = 5;

  const INTRO_TYPE_X = 150;
  const INTRO_TYPE_Y = 455;
  const INTRO_LINE_HEIGHT = 34;
  const INTRO_CLIP_TOP = 76;
  const INTRO_CLIP_BOTTOM = GAME_CONFIG.height - 84;

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
    return { x: GAME_CONFIG.width / 2 - 125, y: GAME_CONFIG.height - 70, w: 250, h: 48 };
  }

  function pointInRect(point, rect) {
    return point && point.x >= rect.x && point.x <= rect.x + rect.w && point.y >= rect.y && point.y <= rect.y + rect.h;
  }

  function smoothStep(t) {
    const x = Math.max(0, Math.min(1, t));
    return x * x * (3 - 2 * x);
  }

  function mapVoiceProgressToTextTime(progress, totalTimelineDuration) {
    const p = Math.max(0, Math.min(1, progress));
    const baseTime = p * INTRO_VOICE_TEXT_SCALE * totalTimelineDuration;
    const trimT = smoothStep((p - INTRO_FINAL_PAUSE_TRIM_START_PROGRESS) / (1 - INTRO_FINAL_PAUSE_TRIM_START_PROGRESS));
    const trim = trimT * INTRO_FINAL_PAUSE_TRIM_SECONDS;
    return Math.min(totalTimelineDuration, baseTime + trim);
  }

  function getIntroEndFadeAlpha(game) {
    if (!game.intro || !game.intro.finalFadeActive) return 1;
    const t = Math.max(0, Math.min(1, game.intro.finalFadeElapsed / INTRO_TEXT_FADE_SECONDS));
    return 1 - smoothStep(t);
  }

  function getIntroButtonAlpha(game) {
    if (!game.intro || !game.intro.readyToContinue) return 0;
    const t = Math.max(0, Math.min(1, (game.intro.buttonFadeElapsed || 0) / INTRO_BUTTON_FADE_SECONDS));
    return smoothStep(t);
  }

  function ensureIntroMusic(game) {
    if (!game.intro) return;
    if (game.intro.music) return;

    game.intro.music = createAudio(INTRO_MUSIC, true, INTRO_MUSIC_VOLUME);
    AudioManager.registerExternalAudio(game.intro.music, { owner: 'intro', channel: 'music' });
    game.intro.musicMissing = false;
  }

  function installIntroVoiceEndHold(game) {
    if (!game.intro || !game.intro.voice || game.intro.endHoldListenerInstalled) return;

    game.intro.endHoldListenerInstalled = true;
    game.intro.voice.addEventListener('ended', () => {
      if (!game.intro || game.intro.voiceSkipped) return;
      game.intro.voiceStarted = false;
      game.intro.finalNaturalFinishActive = true;
      game.intro.finalHoldActive = false;
      game.intro.finalHoldRemaining = 0;
      game.intro.finalFadeActive = false;
      game.intro.finalFadeElapsed = 0;
      game.intro.readyToContinue = false;
      game.intro.buttonFadeElapsed = 0;
      game.intro.readerScroll = 0;
    });
  }

  const originalInit = GameApp.prototype.init;
  GameApp.prototype.init = async function () {
    await originalInit.call(this);
    if (this.intro && this.intro.voice) {
      AudioManager.registerExternalAudio(this.intro.voice, { owner: 'intro', channel: 'sfx' });
    }
    ensureIntroMusic(this);
    installIntroVoiceEndHold(this);
  };

  GameApp.prototype.syncIntroAudioVolumes = function () {
    if (!this.intro) return;
    const musicEnabled = AudioManager.isMusicOn();
    const voiceEnabled = AudioManager.isSfxOn();

    if (this.intro.music) {
      const baseMusicVolume = AudioManager.getMusicVolume ? AudioManager.getMusicVolume() : INTRO_MUSIC_VOLUME;
      this.intro.music.volume = musicEnabled ? Math.max(0, Math.min(1, baseMusicVolume)) : 0;
    }

    if (this.intro.voice) {
      this.intro.voice.volume = voiceEnabled ? INTRO_VOICE_VOLUME : 0;
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
        this.intro.voiceMissing = true;
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

  GameApp.prototype.startIntro = async function () {
    if (!this.intro || this.introStarting || this.state === 'intro') return;
    this.introStarting = true;

    try {

      if (this.storyAssetsPromise && !this.storyAssetsReady) {
        this.setState('storyLoading');
        await this.storyAssetsPromise;
      }

      ensureIntroMusic(this);
      installIntroVoiceEndHold(this);
      AudioManager.stopMusic();
      if (this.beginDeferredAssetLoad) this.beginDeferredAssetLoad();

      this.intro.time = 0;
      this.intro.skipUnlockAt = Number.POSITIVE_INFINITY;
      this.intro.firstRun = !this.hasSeenIntro || !this.hasSeenIntro();
      this.intro.fastForward = false;
      this.intro.skipRequested = false;
      this.intro.skipElapsed = 0;
      this.intro.voiceSkipped = false;
      this.intro.voiceMissing = false;
      this.intro.finalNaturalFinishActive = false;
      this.intro.finalHoldActive = false;
      this.intro.finalHoldRemaining = 0;
      this.intro.finalFadeActive = false;
      this.intro.finalFadeElapsed = 0;
      this.intro.readyToContinue = false;
      this.intro.buttonFadeElapsed = 0;
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
    } finally {
      this.introStarting = false;
    }
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

  GameApp.prototype.isIntroSkipUnlocked = function () {
    if (!this.intro) return false;
    const voice = this.intro.voice;
    if (voice && this.intro.voiceStarted && !this.intro.voiceMissing && !this.intro.voiceSkipped) {
      return Number.isFinite(voice.currentTime) && voice.currentTime >= INTRO_SKIP_UNLOCK_VOICE_SECONDS;
    }
    const unlockAt = this.intro.skipUnlockAt;
    return Number.isFinite(unlockAt) && (this.intro.time || 0) >= unlockAt;
  };

  GameApp.prototype.requestIntroSkip = function () {
    if (!this.intro || this.intro.readyToContinue || !this.isIntroSkipUnlocked()) return;
    this.stopIntroVoiceOnly();
    this.intro.voiceSkipped = true;
    this.intro.fastForward = true;
    this.intro.skipRequested = true;
    this.intro.skipElapsed = 0;
    this.intro.finalNaturalFinishActive = false;
    this.intro.finalHoldActive = false;
    this.intro.finalHoldRemaining = 0;
    this.intro.finalFadeActive = false;
    this.intro.finalFadeElapsed = 0;
    this.intro.buttonFadeElapsed = 0;
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
      AudioManager.registerAudioContext(audioCtx);
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
        AudioManager.registerExternalAudio(click, { owner: 'intro', channel: 'sfx', resume: false });
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

    if (this.intro.finalNaturalFinishActive) {
      this.intro.readyToContinue = false;
      this.intro.time = Math.min(this.intro.totalTimelineDuration || this.intro.time, this.intro.time + dt / 1000);
      if (this.intro.totalTimelineDuration > 0 && this.intro.time >= this.intro.totalTimelineDuration) {
        this.intro.finalNaturalFinishActive = false;
        this.intro.finalHoldActive = true;
        this.intro.finalHoldRemaining = INTRO_END_TEXT_HOLD_SECONDS;
      }
      return;
    }

    if (this.intro.finalHoldActive) {
      this.intro.readyToContinue = false;
      this.intro.time = this.intro.totalTimelineDuration || this.intro.time;
      this.intro.finalHoldRemaining -= dt / 1000;
      if (this.intro.finalHoldRemaining <= 0) {
        this.intro.finalHoldActive = false;
        this.intro.finalFadeActive = true;
        this.intro.finalFadeElapsed = 0;
      }
      return;
    }

    if (this.intro.finalFadeActive) {
      this.intro.readyToContinue = false;
      this.intro.time = this.intro.totalTimelineDuration || this.intro.time;
      this.intro.finalFadeElapsed += dt / 1000;
      if (this.intro.finalFadeElapsed >= INTRO_TEXT_FADE_SECONDS) {
        this.intro.finalFadeActive = false;
        this.intro.readyToContinue = true;
        this.intro.buttonFadeElapsed = 0;
        this.intro.readerScroll = 0;
      }
      return;
    }

    if (this.intro.readyToContinue) {
      this.intro.buttonFadeElapsed = Math.min(INTRO_BUTTON_FADE_SECONDS, (this.intro.buttonFadeElapsed || 0) + dt / 1000);
      if (click && pointInRect(click, getStartButtonRect())) {
        this.finishIntro();
        return;
      }

      if (Input.consume('enter') || Input.consume('space')) this.finishIntro();
      return;
    }

    if (requestedAction && this.isIntroSkipUnlocked()) this.requestIntroSkip();

    const voiceProgress = this.getIntroVoiceProgress();
    if (voiceProgress != null && this.intro.totalTimelineDuration > 0) {
      const voiceTime = mapVoiceProgressToTextTime(voiceProgress, this.intro.totalTimelineDuration);
      // A late browser audio event must never erase already revealed opening text.
      this.intro.time = Math.max(this.intro.time || 0, voiceTime);
      return;
    }

    // Do not advance the fallback text before the voice has either started or
    // genuinely failed. Otherwise the first line flashes, then jumps backward.
    const waitingForVoice = this.intro.voice && !this.intro.voiceStarted && !this.intro.voiceMissing && !this.intro.voiceSkipped;
    if (waitingForVoice) return;

    if (this.intro.skipRequested && this.intro.totalTimelineDuration > 0) {
      this.intro.skipElapsed += dt / 1000;
      const remaining = Math.max(0, this.intro.totalTimelineDuration - this.intro.time);
      const step = Math.max(remaining / Math.max(0.01, INTRO_SKIP_REVEAL_SECONDS), this.intro.totalTimelineDuration * 0.5);
      this.intro.time = Math.min(this.intro.totalTimelineDuration, this.intro.time + step * (dt / 1000));
      if (this.intro.time >= this.intro.totalTimelineDuration) {
        this.intro.readyToContinue = true;
        this.intro.buttonFadeElapsed = 0;
        this.intro.readerScroll = 0;
      }
      return;
    }

    this.intro.time += dt / 1000;
  };

  GameApp.prototype.drawIntroStartButton = function (ctx, alpha) {
    if (alpha <= 0) return;

    const btn = getStartButtonRect();
    const pulse = 0.35 + 0.65 * Math.abs(Math.sin(performance.now() / 330));
    const centerX = btn.x + btn.w / 2;
    const centerY = btn.y + btn.h / 2;

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = 'rgba(120, 0, 0, 0.88)';
    ctx.fillRect(btn.x, btn.y, btn.w, btn.h);
    ctx.strokeStyle = `rgba(255,255,255,${0.55 + pulse * 0.45})`;
    ctx.lineWidth = 3 + pulse * 2;
    ctx.strokeRect(btn.x, btn.y, btn.w, btn.h);

    ctx.font = 'bold 26px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 5;
    ctx.strokeText('НАЧАТЬ', centerX, centerY);
    ctx.fillText('НАЧАТЬ', centerX, centerY);
    ctx.restore();
  };

  GameApp.prototype.drawFinalIntroText = function (ctx, lines, alpha) {
    if (alpha <= 0) return;

    const lastIndex = Math.max(0, lines.length - 1);
    const maxWidth = GAME_CONFIG.width - 300;

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.beginPath();
    ctx.rect(INTRO_TYPE_X, INTRO_CLIP_TOP, maxWidth, INTRO_CLIP_BOTTOM - INTRO_CLIP_TOP);
    ctx.clip();

    ctx.font = 'bold 25px Arial';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.shadowColor = '#000';
    ctx.shadowBlur = 8;
    ctx.lineWidth = 5;
    ctx.strokeStyle = '#000';
    ctx.fillStyle = '#f4f4f4';

    for (let i = 0; i < lines.length; i++) {
      const y = INTRO_TYPE_Y - (lastIndex - i) * INTRO_LINE_HEIGHT;
      if (y < INTRO_CLIP_TOP - INTRO_LINE_HEIGHT || y > INTRO_CLIP_BOTTOM) continue;
      ctx.strokeText(lines[i], INTRO_TYPE_X, y);
      ctx.fillText(lines[i], INTRO_TYPE_X, y);
    }

    ctx.restore();
  };

  GameApp.prototype.drawIntroReader = function (ctx, lines, maxWidth) {
    const isFinalOnly = this.intro.finalNaturalFinishActive || this.intro.finalHoldActive || this.intro.finalFadeActive;

    if (isFinalOnly) {
      this.drawFinalIntroText(ctx, lines, getIntroEndFadeAlpha(this));
      return;
    }

    this.drawIntroStartButton(ctx, getIntroButtonAlpha(this));
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
