const Intro = {
  scrollY: 0,
  finished: false,
  lines: null,
  text: '',
  loading: false,
  loaded: false,
  loadError: false,
  voice: null,
  voiceStarted: false,
  voiceDuration: 150,
  totalScrollDistance: 0,
  fallbackElapsed: 0,
  typedCharacters: 0,

  reset() {
    this.stopVoice();
    if (typeof AudioManager !== 'undefined') AudioManager.stopMusic();

    this.scrollY = 0;
    this.finished = false;
    this.lines = null;
    this.text = '';
    this.loading = false;
    this.loaded = false;
    this.loadError = false;
    this.voiceStarted = false;
    this.totalScrollDistance = 0;
    this.fallbackElapsed = 0;
    this.typedCharacters = 0;
    this.loadText();
    this.startVoice();
  },

  getIntroText() {
    if (typeof window !== 'undefined' && typeof window.STREETS_INTRO_TEXT === 'string' && window.STREETS_INTRO_TEXT.trim()) {
      return window.STREETS_INTRO_TEXT;
    }
    return '';
  },

  loadText() {
    const text = this.getIntroText();
    if (!text) {
      this.text = 'Ошибка загрузки introContent.js';
      this.lines = null;
      this.loaded = false;
      this.loadError = true;
      return;
    }

    this.text = text;
    this.lines = null;
    this.loaded = true;
    this.loadError = false;
    console.log('[INTRO] Text loaded from window.STREETS_INTRO_TEXT. Length:', this.text.length);
  },

  getVoiceSrc() {
    return 'assets/audio/music/intro voice.mp3';
  },

  startVoice() {
    try {
      const audio = new Audio(this.getVoiceSrc());
      audio.preload = 'auto';
      audio.loop = false;
      audio.volume = this.getVoiceVolume();
      audio.addEventListener('loadedmetadata', () => {
        if (Number.isFinite(audio.duration) && audio.duration > 0) this.voiceDuration = audio.duration;
        console.log('[INTRO] Voice loaded. Duration:', this.voiceDuration);
      });
      audio.addEventListener('play', () => {
        this.voiceStarted = true;
      });
      audio.addEventListener('ended', () => {
        this.voiceStarted = false;
        this.typedCharacters = this.getTotalCharacterCount();
      });
      audio.addEventListener('error', () => {
        console.warn('[INTRO] Missing intro voice:', this.getVoiceSrc());
      });
      this.voice = audio;

      audio.play()
        .then(() => {
          this.voiceStarted = true;
        })
        .catch((error) => {
          this.voiceStarted = false;
          console.warn('[INTRO] Voice autoplay blocked or failed:', error);
        });
    } catch (error) {
      console.warn('[INTRO] Cannot start intro voice:', error);
    }
  },

  stopVoice() {
    if (!this.voice) return;
    try {
      this.voice.pause();
      this.voice.currentTime = 0;
    } catch (error) {}
    this.voice = null;
    this.voiceStarted = false;
  },

  getVoiceVolume() {
    if (!AudioManager.isMusicOn()) return 0;
    return AudioManager.getMusicVolume();
  },

  syncVoiceVolume() {
    if (!this.voice) return;
    this.voice.volume = this.getVoiceVolume();
  },

  getVoiceProgress() {
    if (!this.voice || !Number.isFinite(this.voice.currentTime)) return null;
    if (!this.voiceStarted && this.voice.currentTime <= 0.01) return null;
    const duration = Number.isFinite(this.voice.duration) && this.voice.duration > 0 ? this.voice.duration : this.voiceDuration;
    if (!duration) return null;
    return Math.max(0, Math.min(1, this.voice.currentTime / duration));
  },

  getTotalCharacterCount() {
    const lines = this.lines || [];
    if (!lines.length) return this.text.length;
    return lines.reduce((sum, line) => sum + line.length + 1, 0);
  },

  updateTypedCharacters(progress) {
    const totalCharacters = this.getTotalCharacterCount();
    this.typedCharacters = Math.max(0, Math.min(totalCharacters, Math.floor(progress * totalCharacters)));
  },

  resumeMenuMusic(game) {
    if (game && typeof game.ensureMenuMusic === 'function') game.ensureMenuMusic();
  },

  finish(game) {
    if (this.finished) return;
    this.finished = true;
    this.typedCharacters = this.getTotalCharacterCount();
    this.stopVoice();
    AudioManager.playSfx('menuSelect', 0.85);
    game.setState('characterSelect');
    this.resumeMenuMusic(game);
  },

  update(game, dt) {
    if (!this.loaded && !this.loading && !this.loadError) this.loadText();
    this.syncVoiceVolume();

    if (Input.consume('escape')) {
      this.stopVoice();
      AudioManager.playSfx('menuSelect', 0.75);
      game.setState('mainMenu');
      this.resumeMenuMusic(game);
      return;
    }

    const skip = Input.consume('enter') || Input.consume('space') || Input.consumePointer();
    if (skip && this.loaded) {
      this.finish(game);
      return;
    }

    const progress = this.getVoiceProgress();
    if (progress != null) {
      this.updateTypedCharacters(progress);
      return;
    }

    if (!this.voiceStarted) {
      this.fallbackElapsed += dt / 1000;
      const fallbackProgress = Math.max(0, Math.min(1, this.fallbackElapsed / this.voiceDuration));
      this.updateTypedCharacters(fallbackProgress);
    }
  },

  getWrappedLines(ctx) {
    if (this.lines) return this.lines;

    const maxWidth = 900;
    const paragraphs = this.text.split('\n');
    const lines = [];

    paragraphs.forEach((paragraph) => {
      const trimmed = paragraph.trim();
      if (!trimmed) {
        lines.push('');
        return;
      }

      const words = trimmed.split(/\s+/);
      let line = '';

      words.forEach((word) => {
        const testLine = line ? line + ' ' + word : word;
        if (ctx.measureText(testLine).width > maxWidth && line) {
          lines.push(line);
          line = word;
        } else {
          line = testLine;
        }
      });

      if (line) lines.push(line);
    });

    this.lines = lines;
    return lines;
  },

  getLineHeight(lineHeight, line) {
    return line === '' ? lineHeight * 0.75 : lineHeight;
  },

  calculateTotalScrollDistance(lines, lineHeight) {
    const contentHeight = lines.reduce((sum, line) => sum + this.getLineHeight(lineHeight, line), 0);
    const startY = 130;
    const endY = 430;
    return Math.max(0, contentHeight + startY - endY);
  },

  calculateVisibleHeight(lines, lineHeight, visibleCharacters) {
    let remaining = visibleCharacters;
    let height = 0;

    for (const line of lines) {
      if (remaining <= 0) break;
      height += this.getLineHeight(lineHeight, line);
      remaining -= line.length + 1;
    }

    return height;
  },

  updateScrollForTypedText(lines, lineHeight) {
    const startY = 130;
    const endY = 585;
    const visibleHeight = this.calculateVisibleHeight(lines, lineHeight, this.typedCharacters);
    this.scrollY = Math.max(0, visibleHeight + startY - endY);
  },

  drawLoadingMessage(ctx, message) {
    ctx.font = 'bold 28px Arial';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 4;
    ctx.strokeText(message, GAME_CONFIG.width / 2, GAME_CONFIG.height / 2);
    ctx.fillText(message, GAME_CONFIG.width / 2, GAME_CONFIG.height / 2);
    ctx.textAlign = 'left';
  },

  draw(ctx, images) {
    if (images.main) ctx.drawImage(images.main, 0, 0, GAME_CONFIG.width, GAME_CONFIG.height);

    ctx.fillStyle = 'rgba(0,0,0,0.78)';
    ctx.fillRect(0, 0, GAME_CONFIG.width, GAME_CONFIG.height);

    const gradient = ctx.createLinearGradient(0, 0, 0, GAME_CONFIG.height);
    gradient.addColorStop(0, 'rgba(0,0,0,0.95)');
    gradient.addColorStop(0.15, 'rgba(0,0,0,0.15)');
    gradient.addColorStop(0.82, 'rgba(0,0,0,0.1)');
    gradient.addColorStop(1, 'rgba(0,0,0,0.95)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, GAME_CONFIG.width, GAME_CONFIG.height);

    if (!this.loaded) {
      this.drawLoadingMessage(ctx, this.loadError ? 'НЕ УДАЛОСЬ ЗАГРУЗИТЬ introContent.js' : 'ЗАГРУЗКА ИНТРО...');
      return;
    }

    ctx.save();
    ctx.beginPath();
    ctx.rect(130, 84, 1020, 530);
    ctx.clip();

    ctx.font = '26px Arial';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#f1f1f1';
    ctx.strokeStyle = 'rgba(0,0,0,0.8)';
    ctx.lineWidth = 4;

    const lines = this.getWrappedLines(ctx);
    const lineHeight = 34;
    this.totalScrollDistance = this.calculateTotalScrollDistance(lines, lineHeight);
    this.updateScrollForTypedText(lines, lineHeight);

    let y = 130 - this.scrollY;
    let remainingCharacters = this.typedCharacters;

    lines.forEach((line) => {
      const lineBudget = line.length + 1;
      const visibleCount = Math.max(0, Math.min(line.length, remainingCharacters));
      const visibleLine = line.slice(0, visibleCount);

      if (visibleLine && y > 55 && y < 640) {
        if (line === 'Россия. 2026 год.' || line === 'Это Streets of Russia!') {
          ctx.font = 'bold 34px Arial';
          ctx.fillStyle = '#ffffff';
        } else {
          ctx.font = '26px Arial';
          ctx.fillStyle = '#f1f1f1';
        }
        ctx.strokeText(visibleLine, GAME_CONFIG.width / 2, y);
        ctx.fillText(visibleLine, GAME_CONFIG.width / 2, y);
      }

      remainingCharacters -= lineBudget;
      y += this.getLineHeight(lineHeight, line);
    });

    ctx.restore();

    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(300, 638, 680, 46);
    ctx.strokeStyle = 'rgba(255,255,255,0.55)';
    ctx.lineWidth = 2;
    ctx.strokeRect(300, 638, 680, 46);
    ctx.font = 'bold 20px Arial';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffffff';
    ctx.fillText('ENTER / SPACE / КЛИК — ПРОПУСТИТЬ   •   КНОПКА 🔊 СПРАВА — ЗВУК   •   ESC — НАЗАД', GAME_CONFIG.width / 2, 668);
    ctx.textAlign = 'left';
  }
};
