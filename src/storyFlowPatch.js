(function () {
  if (typeof GameApp === 'undefined') return;

  const STATS_KEY = 'streetsOfRussiaPlayerStatsV1';
  const DEFAULT_NAME = 'Игрок';
  const NAME_MAX = 15;
  const VICTORY_BG_SRC = 'assets/backgrounds/1/gundos_victory.png?v=story-flow-2';
  const victoryBg = new Image();
  victoryBg.src = VICTORY_BG_SRC;

  function sanitizeName(name) {
    const clean = String(name || '').trim().replace(/\s+/g, ' ').slice(0, NAME_MAX);
    return clean || DEFAULT_NAME;
  }

  function loadStats() {
    try {
      return JSON.parse(localStorage.getItem(STATS_KEY) || '{}') || {};
    } catch (error) {
      return {};
    }
  }

  function saveStats(stats) {
    try {
      localStorage.setItem(STATS_KEY, JSON.stringify(stats || {}));
    } catch (error) {}
  }

  function inRect(point, rect) {
    return point && point.x >= rect.x && point.x <= rect.x + rect.w && point.y >= rect.y && point.y <= rect.y + rect.h;
  }

  function buttonRects() {
    return {
      start: { x: 440, y: 500, w: 400, h: 58 },
      back: { x: 500, y: 574, w: 280, h: 46 }
    };
  }

  function regionStoryButtonRect() {
    return { x: 490, y: 612, w: 300, h: 54 };
  }

  function beginCampaignAfterName(game) {
    const stats = game.profileStats || loadStats();
    stats.totalNewGames = (Number(stats.totalNewGames) || 0) + 1;
    game.playerName = sanitizeName(game.nameEntryValue);
    stats.lastPlayerName = game.playerName;
    game.profileStats = stats;
    game.currentRunId = 'run-' + Date.now();
    game.currentRunStartedAt = Date.now();
    game.currentRunPlaySeconds = 0;
    if (game.clearCampaignSave) game.clearCampaignSave();
    saveStats(stats);

    game.runInProgress = true;
    game.resumeTarget = 'campaignMap';
    game.scene = null;
    game.paused = false;
    game.characterSelectMode = null;
    game.casualtyRespawn = null;
    if (game.campaignMap && game.campaignMap.resetProgress) game.campaignMap.resetProgress();
    if (game.resetTeamRun) game.resetTeamRun();
    if (game.startIntro) game.startIntro();
    else game.setState('campaignMap');
    if (game.saveCampaignProgress) game.saveCampaignProgress();
  }

  const previousStartNewCampaign = GameApp.prototype.startNewCampaign;
  GameApp.prototype.startNewCampaign = function () {
    const stats = this.profileStats || loadStats();
    this.profileStats = stats;
    this.nameEntryValue = '';
    this.nameEntryCaretVisible = true;
    this.nameEntryLastBlink = performance.now();
    this.nameEntryReturnState = this.state || 'mainMenu';
    AudioManager.unlock();
    AudioManager.playSfx('menuSelect', 0.85);
    this.setState('playerNameEntry');
  };

  GameApp.prototype.updatePlayerNameEntry = function () {
    const click = Input.consumePointer();
    if (click && this.handleSpeakerClick(click)) return;
    const rects = buttonRects();
    if (Input.consume('escape') || click && inRect(click, rects.back)) {
      AudioManager.playSfx('menuMove', 0.7);
      this.setState(this.nameEntryReturnState || 'mainMenu');
      return;
    }
    if (Input.consume('enter') || Input.consume('space') || click && inRect(click, rects.start)) {
      AudioManager.playSfx('menuSelect', 0.9);
      beginCampaignAfterName(this);
    }
  };

  GameApp.prototype.drawPlayerNameEntry = function (ctx) {
    const t = performance.now() / 1000;
    const rects = buttonRects();
    ctx.save();
    ctx.fillStyle = '#070707';
    ctx.fillRect(0, 0, GAME_CONFIG.width, GAME_CONFIG.height);

    const bg = this.images && this.images.main;
    if (bg) {
      ctx.globalAlpha = 0.22;
      ctx.drawImage(bg, 0, 0, GAME_CONFIG.width, GAME_CONFIG.height);
      ctx.globalAlpha = 1;
    }

    const scanY = Math.floor((t * 90) % 6);
    ctx.fillStyle = 'rgba(255,255,255,0.035)';
    for (let y = scanY; y < GAME_CONFIG.height; y += 6) ctx.fillRect(0, y, GAME_CONFIG.width, 2);

    ctx.strokeStyle = '#cc2b2b';
    ctx.lineWidth = 5;
    ctx.strokeRect(262, 96, 756, 430);
    ctx.strokeStyle = '#ffd447';
    ctx.lineWidth = 2;
    ctx.strokeRect(274, 108, 732, 406);

    const input = { x: 280, y: 248, w: 720, h: 126 };
    ctx.fillStyle = 'rgba(0,0,0,0.72)';
    ctx.fillRect(input.x, input.y, input.w, input.h);
    ctx.strokeStyle = '#f04a38';
    ctx.lineWidth = 3;
    ctx.strokeRect(input.x, input.y, input.w, input.h);

    this.drawNameSlots(ctx, this.nameEntryValue || '', input);

    this.drawNameEntryButton(ctx, rects.start, 'НАЧАТЬ', true);
    this.drawNameEntryButton(ctx, rects.back, 'НАЗАД', false);
    ctx.restore();
  };

  GameApp.prototype.drawNameSlots = function (ctx, value, rect) {
    const chars = Array.from(String(value || '')).slice(0, NAME_MAX);
    const slotW = 38;
    const gap = 8;
    const totalW = NAME_MAX * slotW + (NAME_MAX - 1) * gap;
    const startX = rect.x + rect.w / 2 - totalW / 2;
    const baseY = rect.y + 82;
    const blink = Math.floor(performance.now() / 360) % 2 === 0;
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = 'bold 32px Arial';
    for (let i = 0; i < NAME_MAX; i++) {
      const x = startX + i * (slotW + gap);
      const active = i === chars.length;
      ctx.strokeStyle = active && blink ? '#ffffff' : 'rgba(255,212,71,0.72)';
      ctx.lineWidth = active && blink ? 4 : 2;
      ctx.beginPath();
      ctx.moveTo(x + 2, baseY);
      ctx.lineTo(x + slotW - 2, baseY);
      ctx.stroke();
      if (chars[i]) {
        ctx.fillStyle = '#fff3d0';
        ctx.fillText(chars[i], x + slotW / 2, baseY - 27);
      }
    }
    ctx.restore();
  };

  GameApp.prototype.drawNameEntryButton = function (ctx, rect, label, primary) {
    ctx.save();
    ctx.fillStyle = primary ? '#9f1d18' : 'rgba(0,0,0,0.64)';
    ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
    ctx.strokeStyle = primary ? '#ffd447' : 'rgba(255,255,255,0.55)';
    ctx.lineWidth = primary ? 3 : 2;
    ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
    ctx.font = primary ? 'bold 28px Arial' : 'bold 20px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#fff3d0';
    ctx.fillText(label, rect.x + rect.w / 2, rect.y + rect.h / 2 + 1);
    ctx.restore();
  };

  const previousUpdate = GameApp.prototype.update;
  GameApp.prototype.update = function (dt) {
    if (this.state === 'playerNameEntry') {
      this.updatePlayerNameEntry(dt);
      return;
    }
    if (this.state === 'regionStory') {
      this.updateRegionStory(dt);
      return;
    }
    previousUpdate.call(this, dt);
  };

  const previousDraw = GameApp.prototype.draw;
  GameApp.prototype.draw = function () {
    if (this.state === 'playerNameEntry') {
      const ctx = this.ctx;
      ctx.clearRect(0, 0, GAME_CONFIG.width, GAME_CONFIG.height);
      this.drawPlayerNameEntry(ctx);
      this.drawSpeaker(ctx);
      DevPanel.draw(ctx);
      return;
    }
    if (this.state === 'regionStory') {
      const ctx = this.ctx;
      ctx.clearRect(0, 0, GAME_CONFIG.width, GAME_CONFIG.height);
      this.drawRegionStory(ctx);
      this.drawSpeaker(ctx);
      DevPanel.draw(ctx);
      return;
    }
    previousDraw.call(this);
  };

  window.addEventListener('keydown', function (event) {
    const game = window.game;
    if (!game || game.state !== 'playerNameEntry') return;
    if (event.key === 'Backspace') {
      game.nameEntryValue = String(game.nameEntryValue || '').slice(0, -1);
      event.preventDefault();
      return;
    }
    if (event.key === 'Enter' || event.key === 'Escape') return;
    if (event.key && event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
      const next = Array.from(String(game.nameEntryValue || '') + event.key).slice(0, NAME_MAX).join('');
      game.nameEntryValue = next.replace(/\s+/g, ' ');
      event.preventDefault();
    }
  });

  GameApp.prototype.openRegionStory = function (regionId) {
    this.regionStory = {
      regionId: regionId || 'farEast',
      title: '',
      lines: [
        'Под золотом и молитвами скрывалась машина вербовки.',
        '',
        'Спецслужбы прятали своих тварей в церкви,',
        'учили людей бояться, молчать и подчиняться.',
        '',
        'Тварь повержена!',
        'Личина сорвана!',
        'Путь открыт дальше!'
      ],
      hint: 'ENTER / SPACE - НА КАРТУ'
    };
    this.setState('regionStory');
    if (AudioManager.currentMusic) AudioManager.currentMusic.volume = Math.min(AudioManager.currentMusic.volume, 0.18);
  };

  GameApp.prototype.updateRegionStory = function () {
    const click = Input.consumePointer();
    if (click && this.handleSpeakerClick(click)) return;
    const nextRect = regionStoryButtonRect();
    if (Input.consume('enter') || Input.consume('space') || click && inRect(click, nextRect)) {
      AudioManager.playSfx('menuSelect', 0.85);
      if (AudioManager.currentMusic) AudioManager.currentMusic.volume = AudioManager.getMusicVolume();
      this.setState('campaignMap');
      this.ensureMenuMusic();
    }
  };

  GameApp.prototype.drawRegionStory = function (ctx) {
    const story = this.regionStory || {};
    ctx.save();
    ctx.fillStyle = '#060505';
    ctx.fillRect(0, 0, GAME_CONFIG.width, GAME_CONFIG.height);

    const bg = victoryBg && victoryBg.complete && victoryBg.naturalWidth > 0 ? victoryBg : null;
    if (bg) this.drawCoverImage(ctx, bg, 0, 0, GAME_CONFIG.width, GAME_CONFIG.height);

    const grad = ctx.createLinearGradient(0, 0, 0, GAME_CONFIG.height);
    grad.addColorStop(0, 'rgba(0,0,0,0.18)');
    grad.addColorStop(0.52, 'rgba(0,0,0,0.2)');
    grad.addColorStop(1, 'rgba(0,0,0,0.82)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, GAME_CONFIG.width, GAME_CONFIG.height);

    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.font = 'bold 30px Arial';
    const lines = story.lines || [];
    const startY = 405;
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (!line) continue;
      const emph = i >= 5;
      ctx.font = emph ? 'bold 34px Arial' : 'bold 28px Arial';
      ctx.fillStyle = emph ? '#ffd447' : 'rgba(255,245,220,0.94)';
      ctx.strokeStyle = 'rgba(0,0,0,0.78)';
      ctx.lineWidth = emph ? 5 : 4;
      const y = startY + i * 36;
      ctx.strokeText(line, GAME_CONFIG.width / 2, y);
      ctx.fillText(line, GAME_CONFIG.width / 2, y);
    }

    const button = regionStoryButtonRect();
    ctx.fillStyle = '#9f1d18';
    ctx.fillRect(button.x, button.y, button.w, button.h);
    ctx.strokeStyle = '#ffd447';
    ctx.lineWidth = 3;
    ctx.strokeRect(button.x, button.y, button.w, button.h);
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#fff3d0';
    ctx.fillText('\u0414\u0410\u041b\u042c\u0428\u0415', button.x + button.w / 2, button.y + button.h / 2 + 1);
    ctx.restore();
  };

  GameApp.prototype.drawCoverImage = function (ctx, img, x, y, w, h) {
    const scale = Math.max(w / img.width, h / img.height);
    const sw = w / scale;
    const sh = h / scale;
    const sx = (img.width - sw) / 2;
    const sy = (img.height - sh) / 2;
    ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
  };

  const previousCompleteCampaignRegion = GameApp.prototype.completeCampaignRegion;
  GameApp.prototype.completeCampaignRegion = function () {
    const completedRegionId = this.campaignMap && this.campaignMap.getActiveRegionId ? this.campaignMap.getActiveRegionId() : 'farEast';
    if (this.campaignMap && this.campaignMap.completeActiveRegion) this.campaignMap.completeActiveRegion();
    if (this.saveCampaignProgress) this.saveCampaignProgress();
    this.openRegionStory(completedRegionId);
  };

  window.StoryFlowPatch = {
    beginCampaignAfterName,
    previousStartNewCampaign,
    previousCompleteCampaignRegion
  };
})();
