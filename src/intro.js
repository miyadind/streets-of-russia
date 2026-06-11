const Intro = {
  scrollY: 0,
  finished: false,
  lines: null,
  text: '',
  loading: false,
  loaded: false,
  loadError: false,

  reset() {
    this.scrollY = 0;
    this.finished = false;
    this.lines = null;
    this.text = '';
    this.loading = false;
    this.loaded = false;
    this.loadError = false;
    this.loadText();
  },

  async loadText() {
    if (this.loading || this.loaded) return;
    this.loading = true;
    this.loadError = false;

    try {
      const url = '/src/introText.txt?cache=' + Date.now();
      console.log('[INTRO] Loading text from:', url);

      const response = await fetch(url, { cache: 'no-store' });
      console.log('[INTRO] Response:', response.status, response.url);

      if (!response.ok) throw new Error('Failed to load introText.txt: ' + response.status);

      const text = await response.text();
      if (text.trim().startsWith('<!DOCTYPE html') || text.trim().startsWith('<html')) {
        throw new Error('introText.txt request returned HTML instead of text. Check deploy path.');
      }

      this.text = text;
      this.lines = null;
      this.loaded = true;

      console.log('[INTRO] Text loaded. Length:', this.text.length);
      console.log('[INTRO] Text preview:', this.text.slice(0, 160));
    } catch (error) {
      console.error('[INTRO] Text load failed:', error);
      this.text = 'Ошибка загрузки introText.txt';
      this.lines = null;
      this.loadError = true;
    } finally {
      this.loading = false;
    }
  },

  finish(game) {
    if (this.finished) return;
    this.finished = true;
    AudioManager.playSfx('menuSelect', 0.85);
    game.setState('characterSelect');
  },

  update(game, dt) {
    if (!this.loaded && !this.loading && !this.loadError) this.loadText();

    if (Input.consume('escape')) {
      AudioManager.playSfx('menuSelect', 0.75);
      game.setState('mainMenu');
      return;
    }

    const skip = Input.consume('enter') || Input.consume('space') || Input.consumePointer();
    if (skip && this.loaded) {
      this.finish(game);
      return;
    }

    const speed = Input.pressed('arrowdown') || Input.pressed('s') ? 90 : 24;
    if (this.loaded) this.scrollY += speed * (dt / 1000);
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
      this.drawLoadingMessage(ctx, this.loadError ? 'НЕ УДАЛОСЬ ЗАГРУЗИТЬ /src/introText.txt' : 'ЗАГРУЗКА ИНТРО...');
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
    let y = 130 - this.scrollY;
    const lineHeight = 34;

    lines.forEach((line) => {
      if (y > 55 && y < 640) {
        if (line === 'Россия. 2026 год.' || line === 'Это Streets of Russia.') {
          ctx.font = 'bold 34px Arial';
          ctx.fillStyle = '#ffffff';
        } else {
          ctx.font = '26px Arial';
          ctx.fillStyle = '#f1f1f1';
        }
        ctx.strokeText(line, GAME_CONFIG.width / 2, y);
        ctx.fillText(line, GAME_CONFIG.width / 2, y);
      }
      y += line === '' ? lineHeight * 0.75 : lineHeight;
    });

    ctx.restore();

    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(330, 638, 620, 46);
    ctx.strokeStyle = 'rgba(255,255,255,0.55)';
    ctx.lineWidth = 2;
    ctx.strokeRect(330, 638, 620, 46);
    ctx.font = 'bold 20px Arial';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffffff';
    ctx.fillText('ENTER / SPACE / КЛИК — ПРОПУСТИТЬ   •   ↓ — БЫСТРЕЕ   •   ESC — НАЗАД', GAME_CONFIG.width / 2, 668);
    ctx.textAlign = 'left';
  }
};