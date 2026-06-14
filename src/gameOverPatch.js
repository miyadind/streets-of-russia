(() => {
  if (typeof GameApp === 'undefined' || typeof LevelScene === 'undefined') return;

  const GAME_OVER_BUTTONS = [
    { key: 'retry', label: 'ПОПРОБОВАТЬ СНОВА' },
    { key: 'support', label: 'ПОДДЕРЖАТЬ ТЕХ, КТО БОРЕТСЯ' },
    { key: 'menu', label: 'ГЛАВНОЕ МЕНЮ' }
  ];

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function drawCenteredLines(ctx, lines, x, y, lineHeight) {
    lines.forEach((line, index) => ctx.fillText(line, x, y + index * lineHeight));
  }

  GameApp.prototype.openGameOver = function openGameOver(scene) {
    if (this.state === 'gameOver') return;

    this.gameOverSelection = 0;
    this.gameOverRegionStartIndex = this.getCurrentRegionStartIndex(scene);
    this.gameOverHero = this.selectedHero || 'boris';
    this.setState('gameOver');
    AudioManager.playSfx('playerDown', 0.8);
  };

  GameApp.prototype.getCurrentRegionStartIndex = function getCurrentRegionStartIndex(scene) {
    const levelOrder = Array.isArray(GAME_CONFIG.levelOrder) ? GAME_CONFIG.levelOrder : [];
    if (!scene || !levelOrder.length) return 0;

    const currentIndex = clamp(Number(scene.screenIndex) || 0, 0, levelOrder.length - 1);
    const currentKey = levelOrder[currentIndex];
    const currentLevel = (GAME_CONFIG.levels && GAME_CONFIG.levels[currentKey]) || {};
    const regionKey = currentLevel.region || currentLevel.regionKey || currentLevel.area || currentLevel.chapter;

    if (!regionKey) {
      return Number.isFinite(scene.regionStartIndex) ? clamp(scene.regionStartIndex, 0, levelOrder.length - 1) : 0;
    }

    let startIndex = currentIndex;
    for (let i = currentIndex - 1; i >= 0; i -= 1) {
      const key = levelOrder[i];
      const level = (GAME_CONFIG.levels && GAME_CONFIG.levels[key]) || {};
      const levelRegion = level.region || level.regionKey || level.area || level.chapter;
      if (levelRegion !== regionKey) break;
      startIndex = i;
    }

    return startIndex;
  };

  GameApp.prototype.getGameOverButtonRects = function getGameOverButtonRects() {
    const width = 470;
    const height = 54;
    const gap = 16;
    const startY = 500;
    const x = GAME_CONFIG.width / 2 - width / 2;
    return GAME_OVER_BUTTONS.map((button, index) => ({
      ...button,
      x,
      y: startY + index * (height + gap),
      w: width,
      h: height
    }));
  };

  GameApp.prototype.restartFromCurrentRegion = function restartFromCurrentRegion() {
    if (!this.scene) this.scene = new LevelScene(this, this.images);

    const levelOrder = Array.isArray(GAME_CONFIG.levelOrder) ? GAME_CONFIG.levelOrder : [];
    const maxIndex = Math.max(0, levelOrder.length - 1);
    const startIndex = clamp(Number(this.gameOverRegionStartIndex) || 0, 0, maxIndex);

    this.scene.screenIndex = startIndex;
    this.scene.player = new Player(this.gameOverHero || this.selectedHero || 'boris', this.images);

    const level = this.scene.getLevelConfig ? this.scene.getLevelConfig() : null;
    const start = (level && level.playerStart) || { x: 190, y: 620 };
    this.scene.player.x = start.x;
    this.scene.player.y = start.y;
    if (this.scene.player.releaseFromPin) this.scene.player.releaseFromPin();

    if (this.scene.spawnInitialWave) this.scene.spawnInitialWave();
    this.setState('level');
    AudioManager.playSfx('menuSelect', 0.8);
    AudioManager.playMusic((level && level.music) || (GAME_CONFIG.audio && GAME_CONFIG.audio.music && GAME_CONFIG.audio.music.level) || 'levelTheme', true);
  };

  GameApp.prototype.activateGameOverButton = function activateGameOverButton(key) {
    AudioManager.unlock();
    AudioManager.playSfx('menuSelect', 0.85);

    if (key === 'retry') {
      this.restartFromCurrentRegion();
      return;
    }

    if (key === 'support') {
      window.open('support.html', '_blank', 'noopener,noreferrer');
      return;
    }

    if (key === 'menu') {
      this.scene = null;
      this.setState('mainMenu');
      this.ensureMenuMusic();
    }
  };

  GameApp.prototype.updateGameOver = function updateGameOver(click) {
    const buttons = this.getGameOverButtonRects();

    if (Input.consume('arrowup') || Input.consume('w')) {
      this.gameOverSelection = (this.gameOverSelection + buttons.length - 1) % buttons.length;
      AudioManager.playSfx('menuMove', 0.7);
    }

    if (Input.consume('arrowdown') || Input.consume('s')) {
      this.gameOverSelection = (this.gameOverSelection + 1) % buttons.length;
      AudioManager.playSfx('menuMove', 0.7);
    }

    if (Input.consume('enter') || Input.consume('space')) {
      this.activateGameOverButton(buttons[this.gameOverSelection].key);
      return;
    }

    if (!click) return;

    const hoveredIndex = buttons.findIndex((button) => (
      click.x >= button.x && click.x <= button.x + button.w &&
      click.y >= button.y && click.y <= button.y + button.h
    ));

    if (hoveredIndex >= 0) {
      this.gameOverSelection = hoveredIndex;
      this.activateGameOverButton(buttons[hoveredIndex].key);
    }
  };

  GameApp.prototype.drawGameOver = function drawGameOver(ctx) {
    const w = GAME_CONFIG.width;
    const h = GAME_CONFIG.height;
    const bg = this.scene && this.scene.images && this.scene.images.streets
      ? this.scene.images.streets[this.scene.screenIndex] || this.scene.images.streets[0]
      : null;

    if (bg) ctx.drawImage(bg, 0, 0, w, h);
    else {
      ctx.fillStyle = '#050505';
      ctx.fillRect(0, 0, w, h);
    }

    const gradient = ctx.createLinearGradient(0, 0, 0, h);
    gradient.addColorStop(0, 'rgba(0,0,0,0.86)');
    gradient.addColorStop(0.45, 'rgba(18,0,0,0.82)');
    gradient.addColorStop(1, 'rgba(0,0,0,0.92)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, w, h);

    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    ctx.fillStyle = 'rgba(255,255,255,0.08)';
    ctx.fillRect(190, 72, 900, 420);
    ctx.strokeStyle = 'rgba(255,255,255,0.18)';
    ctx.lineWidth = 2;
    ctx.strokeRect(190, 72, 900, 420);

    ctx.fillStyle = '#f4d8a8';
    ctx.font = 'bold 42px Arial';
    drawCenteredLines(ctx, ['ОНИ ПОБЕЖДАЮТ ТОЛЬКО ТОГДА,', 'КОГДА ТЫ СДАЁШЬСЯ…'], w / 2, 145, 52);

    ctx.fillStyle = '#ffffff';
    ctx.font = '28px Arial';
    drawCenteredLines(ctx, [
      '«Моё послание на случай, если меня убьют,',
      'очень простое: не сдавайтесь.',
      'Не надо, нельзя сдаваться».',
      '',
      '— Алексей Навальный'
    ], w / 2, 300, 38);

    const buttons = this.getGameOverButtonRects();
    buttons.forEach((button, index) => {
      const selected = index === this.gameOverSelection;
      ctx.fillStyle = selected ? 'rgba(244,216,168,0.95)' : 'rgba(0,0,0,0.68)';
      ctx.fillRect(button.x, button.y, button.w, button.h);
      ctx.strokeStyle = selected ? '#ffffff' : 'rgba(255,255,255,0.42)';
      ctx.lineWidth = selected ? 3 : 2;
      ctx.strokeRect(button.x, button.y, button.w, button.h);

      ctx.fillStyle = selected ? '#140000' : '#ffffff';
      ctx.font = 'bold 22px Arial';
      ctx.fillText(button.label, button.x + button.w / 2, button.y + button.h / 2 + 1);
    });

    ctx.fillStyle = 'rgba(255,255,255,0.58)';
    ctx.font = '17px Arial';
    ctx.fillText('↑/↓ — выбор   Enter — подтвердить', w / 2, 695);
    ctx.restore();
  };

  const originalGameUpdate = GameApp.prototype.update;
  GameApp.prototype.update = function patchedGameUpdate(dt) {
    if (this.state === 'gameOver') {
      DevPanel.update(this);
      const click = Input.consumePointer();
      if (click && this.handleSpeakerClick(click)) return;
      if (DevPanel.open) return;
      this.updateGameOver(click);
      return;
    }

    originalGameUpdate.call(this, dt);
  };

  const originalGameDraw = GameApp.prototype.draw;
  GameApp.prototype.draw = function patchedGameDraw() {
    if (this.state === 'gameOver') {
      const ctx = this.ctx;
      ctx.clearRect(0, 0, GAME_CONFIG.width, GAME_CONFIG.height);
      this.drawGameOver(ctx);
      this.drawSpeaker(ctx);
      DevPanel.draw(ctx);
      return;
    }

    originalGameDraw.call(this);
  };

  const originalSceneUpdate = LevelScene.prototype.update;
  LevelScene.prototype.update = function patchedSceneUpdate(dt) {
    originalSceneUpdate.call(this, dt);

    if (this.player && this.player.hp <= 0) {
      this.game.openGameOver(this);
    }
  };
})();
