(function patchDevPanelAudio() {
  if (!window.DevPanel && typeof DevPanel === 'undefined') return;

  const panel = DevPanel;
  if (!panel.tabs.includes('AUDIO')) panel.tabs.push('AUDIO');
  panel.selectedBossEnemyIndex = panel.selectedBossEnemyIndex || 0;

  panel.audioPanelRects = function audioPanelRects() {
    const p = this.panelRect();
    const x = p.x + 36;
    const y = p.y + 124;
    return {
      box: { x, y, w: 960, h: 492 },

      menuPrev: { x: x + 150, y: y + 58, w: 36, h: 28 },
      menuNext: { x: x + 452, y: y + 58, w: 36, h: 28 },
      musicToggle: { x: x + 150, y: y + 100, w: 120, h: 30 },
      musicDown: { x: x + 150, y: y + 142, w: 36, h: 28 },
      musicUp: { x: x + 452, y: y + 142, w: 36, h: 28 },
      sfxToggle: { x: x + 150, y: y + 184, w: 120, h: 30 },
      sfxDown: { x: x + 150, y: y + 226, w: 36, h: 28 },
      sfxUp: { x: x + 452, y: y + 226, w: 36, h: 28 },

      levelPrev: { x: x + 650, y: y + 58, w: 36, h: 28 },
      levelNext: { x: x + 898, y: y + 58, w: 36, h: 28 },
      levelMusicPrev: { x: x + 650, y: y + 100, w: 36, h: 28 },
      levelMusicNext: { x: x + 898, y: y + 100, w: 36, h: 28 },
      applyLevelMusic: { x: x + 650, y: y + 142, w: 132, h: 30 },

      bossPrev: { x: x + 150, y: y + 322, w: 36, h: 28 },
      bossNext: { x: x + 452, y: y + 322, w: 36, h: 28 },
      bossToggle: { x: x + 150, y: y + 364, w: 120, h: 30 },
      bossMusicPrev: { x: x + 150, y: y + 406, w: 36, h: 28 },
      bossMusicNext: { x: x + 452, y: y + 406, w: 36, h: 28 },
      testSfx: { x: x + 650, y: y + 322, w: 132, h: 32 },
      testMusic: { x: x + 802, y: y + 322, w: 132, h: 32 }
    };
  };

  panel.getMusicKeys = panel.getMusicKeys || function getMusicKeys() {
    const keys = Object.keys((Assets.audio && Assets.audio.music) || {});
    return keys.length ? keys : ['menuTheme'];
  };

  panel.getBossEnemyTypes = function getBossEnemyTypes() {
    const types = Object.keys(GAME_CONFIG.enemies || {});
    return types.length ? types : ['sucker'];
  };

  panel.getSelectedBossEnemyType = function getSelectedBossEnemyType() {
    const types = this.getBossEnemyTypes();
    this.selectedBossEnemyIndex = this.wrap(this.selectedBossEnemyIndex, types.length);
    return types[this.selectedBossEnemyIndex];
  };

  panel.changeMenuMusic = function changeMenuMusic(direction) {
    const keys = this.getMusicKeys();
    const current = (GAME_CONFIG.audio && GAME_CONFIG.audio.music && GAME_CONFIG.audio.music.menu) || 'menuTheme';
    const index = Math.max(0, keys.indexOf(current));
    GAME_CONFIG.audio.music.menu = keys[this.wrap(index + direction, keys.length)];
    AudioManager.playMusic(GAME_CONFIG.audio.music.menu, true);
    this.setStatus('Menu music: ' + GAME_CONFIG.audio.music.menu);
  };

  panel.changeLevelMusicFromAudio = function changeLevelMusicFromAudio(direction, game) {
    const level = this.getSelectedLevel();
    const keys = this.getMusicKeys();
    const current = level.music || 'levelTheme';
    const index = Math.max(0, keys.indexOf(current));
    level.music = keys[this.wrap(index + direction, keys.length)];
    if (game && game.scene && game.scene.getLevelKey && game.scene.getLevelKey() === this.getSelectedLevelKey()) {
      AudioManager.playMusic(level.music, true);
    }
    this.setStatus('Level ' + this.getSelectedLevelKey() + ' music: ' + level.music);
  };

  panel.changeBossEnemy = function changeBossEnemy(direction) {
    const types = this.getBossEnemyTypes();
    this.selectedBossEnemyIndex = this.wrap(this.selectedBossEnemyIndex + direction, types.length);
    this.setStatus('Boss enemy: ' + this.getSelectedBossEnemyType());
  };

  panel.toggleBossMusicForSelected = function toggleBossMusicForSelected() {
    const type = this.getSelectedBossEnemyType();
    const enemy = GAME_CONFIG.enemies[type];
    if (!enemy) return;
    enemy.bossMusic = !enemy.bossMusic;
    if (!enemy.bossMusicKey) enemy.bossMusicKey = 'bossTheme';
    this.setStatus(type + ' boss music: ' + (enemy.bossMusic ? 'ON' : 'OFF'));
  };

  panel.changeBossMusicForSelected = function changeBossMusicForSelected(direction) {
    const type = this.getSelectedBossEnemyType();
    const enemy = GAME_CONFIG.enemies[type];
    if (!enemy) return;
    const keys = this.getMusicKeys();
    const current = enemy.bossMusicKey || 'bossTheme';
    const index = Math.max(0, keys.indexOf(current));
    enemy.bossMusicKey = keys[this.wrap(index + direction, keys.length)];
    enemy.bossMusic = true;
    AudioManager.playMusic(enemy.bossMusicKey, true);
    this.setStatus(type + ' boss music: ' + enemy.bossMusicKey);
  };

  panel.changeMusicVolume = function changeMusicVolume(direction) {
    AudioManager.setMusicVolume(GAME_CONFIG.settings.musicVolume + direction * 0.05);
    this.setStatus('Music volume: ' + Math.round(GAME_CONFIG.settings.musicVolume * 100) + '%');
  };

  panel.changeSfxVolume = function changeSfxVolume(direction) {
    AudioManager.setSfxVolume(GAME_CONFIG.settings.sfxVolume + direction * 0.05);
    AudioManager.playSfx('menuSelect', 0.9);
    this.setStatus('SFX volume: ' + Math.round(GAME_CONFIG.settings.sfxVolume * 100) + '%');
  };

  panel.handleAudioPanelClick = function handleAudioPanelClick(point, game) {
    const r = this.audioPanelRects();
    if (this.inRect(point, r.menuPrev)) { this.changeMenuMusic(-1); return true; }
    if (this.inRect(point, r.menuNext)) { this.changeMenuMusic(1); return true; }
    if (this.inRect(point, r.musicToggle)) { AudioManager.toggleMusic(); this.setStatus('Music: ' + (GAME_CONFIG.settings.musicEnabled ? 'ON' : 'OFF')); return true; }
    if (this.inRect(point, r.musicDown)) { this.changeMusicVolume(-1); return true; }
    if (this.inRect(point, r.musicUp)) { this.changeMusicVolume(1); return true; }
    if (this.inRect(point, r.sfxToggle)) { AudioManager.toggleSfx(); this.setStatus('SFX: ' + (GAME_CONFIG.settings.sfxEnabled ? 'ON' : 'OFF')); return true; }
    if (this.inRect(point, r.sfxDown)) { this.changeSfxVolume(-1); return true; }
    if (this.inRect(point, r.sfxUp)) { this.changeSfxVolume(1); return true; }

    if (this.inRect(point, r.levelPrev)) { this.selectedLevelIndex = this.wrap(this.selectedLevelIndex - 1, this.getLevelKeys().length); this.setStatus('Level: ' + this.getSelectedLevelKey()); return true; }
    if (this.inRect(point, r.levelNext)) { this.selectedLevelIndex = this.wrap(this.selectedLevelIndex + 1, this.getLevelKeys().length); this.setStatus('Level: ' + this.getSelectedLevelKey()); return true; }
    if (this.inRect(point, r.levelMusicPrev)) { this.changeLevelMusicFromAudio(-1, game); return true; }
    if (this.inRect(point, r.levelMusicNext)) { this.changeLevelMusicFromAudio(1, game); return true; }
    if (this.inRect(point, r.applyLevelMusic)) { if (game && game.scene && game.scene.restartCurrentLevel) game.scene.restartCurrentLevel(); this.setStatus('Applied level music'); return true; }

    if (this.inRect(point, r.bossPrev)) { this.changeBossEnemy(-1); return true; }
    if (this.inRect(point, r.bossNext)) { this.changeBossEnemy(1); return true; }
    if (this.inRect(point, r.bossToggle)) { this.toggleBossMusicForSelected(); return true; }
    if (this.inRect(point, r.bossMusicPrev)) { this.changeBossMusicForSelected(-1); return true; }
    if (this.inRect(point, r.bossMusicNext)) { this.changeBossMusicForSelected(1); return true; }

    if (this.inRect(point, r.testSfx)) { AudioManager.playSfx('hit', 1); this.setStatus('SFX test'); return true; }
    if (this.inRect(point, r.testMusic)) { AudioManager.playMusic(GAME_CONFIG.audio.music.menu || 'menuTheme', true); this.setStatus('Music test'); return true; }
    return false;
  };

  panel.drawAudioPanel = function drawAudioPanel(ctx) {
    const r = this.audioPanelRects();
    const menuKey = (GAME_CONFIG.audio && GAME_CONFIG.audio.music && GAME_CONFIG.audio.music.menu) || 'menuTheme';
    const musicOn = GAME_CONFIG.settings.musicEnabled !== false;
    const sfxOn = GAME_CONFIG.settings.sfxEnabled !== false;
    const levelKey = this.getSelectedLevelKey();
    const level = this.getSelectedLevel();
    const bossType = this.getSelectedBossEnemyType();
    const boss = (GAME_CONFIG.enemies && GAME_CONFIG.enemies[bossType]) || {};

    ctx.fillStyle = 'rgba(255,255,255,0.06)';
    ctx.fillRect(r.box.x, r.box.y, r.box.w, r.box.h);
    ctx.strokeStyle = 'rgba(255,255,255,0.35)';
    ctx.strokeRect(r.box.x, r.box.y, r.box.w, r.box.h);

    ctx.fillStyle = '#fff';
    ctx.font = 'bold 18px Arial';
    ctx.fillText('AUDIO SETTINGS / PERMANENT ROUTING', r.box.x + 20, r.box.y + 32);

    ctx.font = 'bold 15px Arial';
    ctx.fillStyle = '#8fd8ff';
    ctx.fillText('GLOBAL', r.box.x + 24, r.box.y + 58);

    this.drawRowLabel(ctx, 'Menu music:', r.box.x + 24, r.box.y + 80);
    this.drawButton(ctx, r.menuPrev.x, r.menuPrev.y, r.menuPrev.w, r.menuPrev.h, '<');
    this.drawButton(ctx, r.menuNext.x, r.menuNext.y, r.menuNext.w, r.menuNext.h, '>');
    this.drawValue(ctx, menuKey, r.box.x + 205, r.box.y + 80);

    this.drawRowLabel(ctx, 'Music:', r.box.x + 24, r.box.y + 122);
    this.drawButton(ctx, r.musicToggle.x, r.musicToggle.y, r.musicToggle.w, r.musicToggle.h, musicOn ? 'ON' : 'OFF');

    this.drawRowLabel(ctx, 'Music volume:', r.box.x + 24, r.box.y + 164);
    this.drawButton(ctx, r.musicDown.x, r.musicDown.y, r.musicDown.w, r.musicDown.h, '-');
    this.drawButton(ctx, r.musicUp.x, r.musicUp.y, r.musicUp.w, r.musicUp.h, '+');
    this.drawValue(ctx, Math.round(GAME_CONFIG.settings.musicVolume * 100) + '%', r.box.x + 205, r.box.y + 164);

    this.drawRowLabel(ctx, 'SFX:', r.box.x + 24, r.box.y + 206);
    this.drawButton(ctx, r.sfxToggle.x, r.sfxToggle.y, r.sfxToggle.w, r.sfxToggle.h, sfxOn ? 'ON' : 'OFF');

    this.drawRowLabel(ctx, 'SFX volume:', r.box.x + 24, r.box.y + 248);
    this.drawButton(ctx, r.sfxDown.x, r.sfxDown.y, r.sfxDown.w, r.sfxDown.h, '-');
    this.drawButton(ctx, r.sfxUp.x, r.sfxUp.y, r.sfxUp.w, r.sfxUp.h, '+');
    this.drawValue(ctx, Math.round(GAME_CONFIG.settings.sfxVolume * 100) + '%', r.box.x + 205, r.box.y + 248);

    ctx.font = 'bold 15px Arial';
    ctx.fillStyle = '#8fd8ff';
    ctx.fillText('LEVEL MUSIC', r.box.x + 524, r.box.y + 58);

    this.drawRowLabel(ctx, 'Level:', r.box.x + 524, r.box.y + 80);
    this.drawButton(ctx, r.levelPrev.x, r.levelPrev.y, r.levelPrev.w, r.levelPrev.h, '<');
    this.drawButton(ctx, r.levelNext.x, r.levelNext.y, r.levelNext.w, r.levelNext.h, '>');
    this.drawValue(ctx, levelKey, r.box.x + 705, r.box.y + 80);

    this.drawRowLabel(ctx, 'Level track:', r.box.x + 524, r.box.y + 122);
    this.drawButton(ctx, r.levelMusicPrev.x, r.levelMusicPrev.y, r.levelMusicPrev.w, r.levelMusicPrev.h, '<');
    this.drawButton(ctx, r.levelMusicNext.x, r.levelMusicNext.y, r.levelMusicNext.w, r.levelMusicNext.h, '>');
    this.drawValue(ctx, level.music || 'levelTheme', r.box.x + 705, r.box.y + 122);
    this.drawButton(ctx, r.applyLevelMusic.x, r.applyLevelMusic.y, r.applyLevelMusic.w, r.applyLevelMusic.h, 'APPLY LEVEL');

    ctx.font = 'bold 15px Arial';
    ctx.fillStyle = '#ffcf8f';
    ctx.fillText('BOSS MUSIC BY ENEMY TYPE', r.box.x + 24, r.box.y + 306);

    this.drawRowLabel(ctx, 'Enemy:', r.box.x + 24, r.box.y + 344);
    this.drawButton(ctx, r.bossPrev.x, r.bossPrev.y, r.bossPrev.w, r.bossPrev.h, '<');
    this.drawButton(ctx, r.bossNext.x, r.bossNext.y, r.bossNext.w, r.bossNext.h, '>');
    this.drawValue(ctx, bossType, r.box.x + 205, r.box.y + 344);

    this.drawRowLabel(ctx, 'Boss mode:', r.box.x + 24, r.box.y + 386);
    this.drawButton(ctx, r.bossToggle.x, r.bossToggle.y, r.bossToggle.w, r.bossToggle.h, boss.bossMusic ? 'ON' : 'OFF');

    this.drawRowLabel(ctx, 'Boss track:', r.box.x + 24, r.box.y + 428);
    this.drawButton(ctx, r.bossMusicPrev.x, r.bossMusicPrev.y, r.bossMusicPrev.w, r.bossMusicPrev.h, '<');
    this.drawButton(ctx, r.bossMusicNext.x, r.bossMusicNext.y, r.bossMusicNext.w, r.bossMusicNext.h, '>');
    this.drawValue(ctx, boss.bossMusicKey || 'bossTheme', r.box.x + 205, r.box.y + 428);

    this.drawButton(ctx, r.testSfx.x, r.testSfx.y, r.testSfx.w, r.testSfx.h, 'TEST SFX');
    this.drawButton(ctx, r.testMusic.x, r.testMusic.y, r.testMusic.w, r.testMusic.h, 'TEST MENU');

    ctx.font = '13px Arial';
    ctx.fillStyle = '#aaa';
    ctx.fillText('Use SAVE for localStorage. Use EXPORT and send JSON to update config.js for GitHub/server.', r.box.x + 524, r.box.y + 408);
  };

  const originalHandleClick = panel.handleClick.bind(panel);
  panel.handleClick = function handleClickWithAudio(point, game) {
    if (this.tab === 'AUDIO') {
      const p = this.panelRect();
      if (!this.inRect(point, p)) return;

      const close = { x: p.x + p.w - 78, y: p.y + 14, w: 56, h: 32 };
      if (this.inRect(point, close)) { this.open = false; return; }

      const tab = this.getClickedTab(point);
      if (tab) { this.tab = tab; this.setStatus('Tab: ' + tab); return; }

      if (this.handleFooterClick(point, game)) return;
      if (this.handleAudioPanelClick(point, game)) return;
      return;
    }

    originalHandleClick(point, game);
  };

  const originalDraw = panel.draw.bind(panel);
  panel.draw = function drawWithAudio(ctx) {
    if (this.tab !== 'AUDIO') {
      originalDraw(ctx);
      return;
    }

    if (!GAME_CONFIG.adminTuningEnabled) return;

    if (!this.open) {
      originalDraw(ctx);
      return;
    }

    const p = this.panelRect();
    ctx.fillStyle = 'rgba(0,0,0,0.90)';
    ctx.fillRect(p.x, p.y, p.w, p.h);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.strokeRect(p.x, p.y, p.w, p.h);

    ctx.fillStyle = '#fff';
    ctx.font = 'bold 24px Arial';
    ctx.fillText('DEVELOPER PANEL', p.x + 22, p.y + 38);
    ctx.font = '13px Arial';
    ctx.fillStyle = '#aaa';
    ctx.fillText('Audio routing: menu, per-level tracks, per-boss tracks, volume.', p.x + 22, p.y + 58);

    this.drawButton(ctx, p.x + p.w - 78, p.y + 14, 56, 32, 'X');
    this.drawTabs(ctx);
    this.drawAudioPanel(ctx);
    this.drawFooter(ctx);
    this.drawStatus(ctx, p);
  };
})();
