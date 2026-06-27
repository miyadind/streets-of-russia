(function () {
  if (typeof GameApp === 'undefined') return;

  const STATS_KEY = 'streetsOfRussiaPlayerStatsV1';
  const DEFAULT_NAME = 'Игрок';
  const NAME_MAX = 18;

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

  function beginCampaignAfterName(game) {
    const stats = game.profileStats || loadStats();
    stats.totalNewGames = (Number(stats.totalNewGames) || 0) + 1;
    game.playerName = sanitizeName(game.nameEntryValue || stats.lastPlayerName || game.playerName);
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
    this.nameEntryValue = sanitizeName(this.playerName || stats.lastPlayerName || DEFAULT_NAME);
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

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = 'bold 54px Arial';
    ctx.fillStyle = '#f2d061';
    ctx.strokeStyle = '#2b0000';
    ctx.lineWidth = 6;
    ctx.strokeText('NEW FIGHTER', GAME_CONFIG.width / 2, 174);
    ctx.fillText('NEW FIGHTER', GAME_CONFIG.width / 2, 174);

    ctx.font = 'bold 22px Arial';
    ctx.fillStyle = 'rgba(255,255,255,0.78)';
    ctx.fillText('ВВЕДИ ИМЯ ДЛЯ СТАТИСТИКИ', GAME_CONFIG.width / 2, 238);

    const input = { x: 360, y: 292, w: 560, h: 74 };
    ctx.fillStyle = 'rgba(0,0,0,0.72)';
    ctx.fillRect(input.x, input.y, input.w, input.h);
    ctx.strokeStyle = '#f04a38';
    ctx.lineWidth = 3;
    ctx.strokeRect(input.x, input.y, input.w, input.h);

    const caret = Math.floor(t * 2) % 2 === 0 ? '_' : '';
    ctx.font = 'bold 34px monospace';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(sanitizeName(this.nameEntryValue) + caret, GAME_CONFIG.width / 2, input.y + input.h / 2 + 2);

    ctx.font = '16px Arial';
    ctx.fillStyle = 'rgba(255,255,255,0.62)';
    ctx.fillText('Backspace - стереть   Enter - начать', GAME_CONFIG.width / 2, 404);

    this.drawNameEntryButton(ctx, rects.start, 'НАЧАТЬ', true);
    this.drawNameEntryButton(ctx, rects.back, 'НАЗАД', false);
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
      const next = String(game.nameEntryValue || '') + event.key;
      game.nameEntryValue = next.replace(/\s+/g, ' ').slice(0, NAME_MAX);
      event.preventDefault();
    }
  });

  GameApp.prototype.openRegionStory = function (regionId) {
    this.regionStory = {
      regionId: regionId || 'farEast',
      title: 'ДАЛЬНИЙ ВОСТОК ОСВОБОЖДЁН',
      lines: [
        'Церковная сеть прикрывала вербовку людей.',
        'Спецслужбы внедряли своих тварей в приходы и через страх управляли толпой.',
        'Гундос сорвал маску и пал в облике демона.',
        'С этим узлом покончено. Впереди новая зона.'
      ],
      hint: 'ENTER / SPACE - НА КАРТУ'
    };
    this.setState('regionStory');
    if (AudioManager.currentMusic) AudioManager.currentMusic.volume = Math.min(AudioManager.currentMusic.volume, 0.18);
  };

  GameApp.prototype.updateRegionStory = function () {
    const click = Input.consumePointer();
    if (click && this.handleSpeakerClick(click)) return;
    if (Input.consume('enter') || Input.consume('space') || click) {
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

    const bg = this.images && this.images.streets && this.images.streets[2];
    if (bg) {
      ctx.globalAlpha = 0.42;
      ctx.drawImage(bg, 0, 0, GAME_CONFIG.width, GAME_CONFIG.height);
      ctx.globalAlpha = 1;
    }

    const devil = this.images && this.images.enemies && this.images.enemies.gundos && this.images.enemies.gundos.devil;
    if (devil) {
      ctx.save();
      ctx.translate(895, 635);
      ctx.rotate(-0.18);
      ctx.globalAlpha = 0.82;
      const scale = 0.34;
      ctx.drawImage(devil, -devil.width * scale / 2, -devil.height * scale, devil.width * scale, devil.height * scale);
      ctx.restore();
    } else {
      ctx.fillStyle = 'rgba(100,0,0,0.45)';
      ctx.fillRect(780, 560, 340, 46);
    }

    const grad = ctx.createLinearGradient(0, 0, 0, GAME_CONFIG.height);
    grad.addColorStop(0, 'rgba(0,0,0,0.25)');
    grad.addColorStop(0.55, 'rgba(0,0,0,0.72)');
    grad.addColorStop(1, 'rgba(0,0,0,0.9)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, GAME_CONFIG.width, GAME_CONFIG.height);

    ctx.strokeStyle = '#b52b22';
    ctx.lineWidth = 4;
    ctx.strokeRect(86, 72, 1108, 576);
    ctx.strokeStyle = '#e8c35a';
    ctx.lineWidth = 2;
    ctx.strokeRect(100, 86, 1080, 548);

    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.font = 'bold 42px Arial';
    ctx.fillStyle = '#f0c94e';
    ctx.strokeStyle = '#1b0000';
    ctx.lineWidth = 5;
    ctx.strokeText(story.title || 'РЕГИОН ОСВОБОЖДЁН', 148, 126);
    ctx.fillText(story.title || 'РЕГИОН ОСВОБОЖДЁН', 148, 126);

    ctx.font = '24px Arial';
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    const lines = story.lines || [];
    for (let i = 0; i < lines.length; i++) {
      ctx.fillText(lines[i], 150, 220 + i * 48);
    }

    ctx.font = 'bold 18px Arial';
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(255,232,148,0.82)';
    ctx.fillText(story.hint || 'ENTER - ПРОДОЛЖИТЬ', GAME_CONFIG.width / 2, 602);
    ctx.restore();
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
