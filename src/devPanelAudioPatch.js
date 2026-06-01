(function patchDevPanelAudio() {
  if (!window.DevPanel && typeof DevPanel === 'undefined') return;

  const panel = DevPanel;
  if (!panel.tabs.includes('AUDIO')) panel.tabs.push('AUDIO');

  panel.audioPanelRects = function audioPanelRects() {
    const p = this.panelRect();
    const x = p.x + 36;
    const y = p.y + 124;
    return {
      box: { x, y, w: 700, h: 430 },
      menuPrev: { x: x + 150, y: y + 72, w: 36, h: 28 },
      menuNext: { x: x + 642, y: y + 72, w: 36, h: 28 },
      musicToggle: { x: x + 150, y: y + 122, w: 150, h: 30 },
      musicDown: { x: x + 150, y: y + 172, w: 36, h: 28 },
      musicUp: { x: x + 642, y: y + 172, w: 36, h: 28 },
      sfxToggle: { x: x + 150, y: y + 222, w: 150, h: 30 },
      sfxDown: { x: x + 150, y: y + 272, w: 36, h: 28 },
      sfxUp: { x: x + 642, y: y + 272, w: 36, h: 28 },
      testSfx: { x: x + 150, y: y + 334, w: 150, h: 32 },
      testMusic: { x: x + 320, y: y + 334, w: 150, h: 32 }
    };
  };

  panel.getMusicKeys = panel.getMusicKeys || function getMusicKeys() {
    const keys = Object.keys((Assets.audio && Assets.audio.music) || {});
    return keys.length ? keys : ['menuTheme'];
  };

  panel.changeMenuMusic = function changeMenuMusic(direction) {
    const keys = this.getMusicKeys();
    const current = (GAME_CONFIG.audio && GAME_CONFIG.audio.music && GAME_CONFIG.audio.music.menu) || 'menuTheme';
    const index = Math.max(0, keys.indexOf(current));
    GAME_CONFIG.audio.music.menu = keys[this.wrap(index + direction, keys.length)];
    AudioManager.playMusic(GAME_CONFIG.audio.music.menu, true);
    this.setStatus('Menu music: ' + GAME_CONFIG.audio.music.menu);
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

  panel.handleAudioPanelClick = function handleAudioPanelClick(point) {
    const r = this.audioPanelRects();
    if (this.inRect(point, r.menuPrev)) { this.changeMenuMusic(-1); return true; }
    if (this.inRect(point, r.menuNext)) { this.changeMenuMusic(1); return true; }
    if (this.inRect(point, r.musicToggle)) { AudioManager.toggleMusic(); this.setStatus('Music: ' + (GAME_CONFIG.settings.musicEnabled ? 'ON' : 'OFF')); return true; }
    if (this.inRect(point, r.musicDown)) { this.changeMusicVolume(-1); return true; }
    if (this.inRect(point, r.musicUp)) { this.changeMusicVolume(1); return true; }
    if (this.inRect(point, r.sfxToggle)) { AudioManager.toggleSfx(); this.setStatus('SFX: ' + (GAME_CONFIG.settings.sfxEnabled ? 'ON' : 'OFF')); return true; }
    if (this.inRect(point, r.sfxDown)) { this.changeSfxVolume(-1); return true; }
    if (this.inRect(point, r.sfxUp)) { this.changeSfxVolume(1); return true; }
    if (this.inRect(point, r.testSfx)) { AudioManager.playSfx('hit', 1); this.setStatus('SFX test'); return true; }
    if (this.inRect(point, r.testMusic)) { AudioManager.playMusic(GAME_CONFIG.audio.music.menu || 'menuTheme', true); this.setStatus('Music test'); return true; }
    return false;
  };

  panel.drawAudioPanel = function drawAudioPanel(ctx) {
    const r = this.audioPanelRects();
    const menuKey = (GAME_CONFIG.audio && GAME_CONFIG.audio.music && GAME_CONFIG.audio.music.menu) || 'menuTheme';
    const musicOn = GAME_CONFIG.settings.musicEnabled !== false;
    const sfxOn = GAME_CONFIG.settings.sfxEnabled !== false;

    ctx.fillStyle = 'rgba(255,255,255,0.06)';
    ctx.fillRect(r.box.x, r.box.y, r.box.w, r.box.h);
    ctx.strokeStyle = 'rgba(255,255,255,0.35)';
    ctx.strokeRect(r.box.x, r.box.y, r.box.w, r.box.h);

    ctx.fillStyle = '#fff';
    ctx.font = 'bold 18px Arial';
    ctx.fillText('AUDIO SETTINGS', r.box.x + 20, r.box.y + 32);

    this.drawRowLabel(ctx, 'Menu music:', r.box.x + 24, r.box.y + 92);
    this.drawButton(ctx, r.menuPrev.x, r.menuPrev.y, r.menuPrev.w, r.menuPrev.h, '<');
    this.drawButton(ctx, r.menuNext.x, r.menuNext.y, r.menuNext.w, r.menuNext.h, '>');
    this.drawValue(ctx, menuKey, r.box.x + 205, r.box.y + 92);

    this.drawRowLabel(ctx, 'Music:', r.box.x + 24, r.box.y + 144);
    this.drawButton(ctx, r.musicToggle.x, r.musicToggle.y, r.musicToggle.w, r.musicToggle.h, musicOn ? 'ON' : 'OFF');

    this.drawRowLabel(ctx, 'Music volume:', r.box.x + 24, r.box.y + 194);
    this.drawButton(ctx, r.musicDown.x, r.musicDown.y, r.musicDown.w, r.musicDown.h, '-');
    this.drawButton(ctx, r.musicUp.x, r.musicUp.y, r.musicUp.w, r.musicUp.h, '+');
    this.drawValue(ctx, Math.round(GAME_CONFIG.settings.musicVolume * 100) + '%', r.box.x + 205, r.box.y + 194);

    this.drawRowLabel(ctx, 'SFX:', r.box.x + 24, r.box.y + 244);
    this.drawButton(ctx, r.sfxToggle.x, r.sfxToggle.y, r.sfxToggle.w, r.sfxToggle.h, sfxOn ? 'ON' : 'OFF');

    this.drawRowLabel(ctx, 'SFX volume:', r.box.x + 24, r.box.y + 294);
    this.drawButton(ctx, r.sfxDown.x, r.sfxDown.y, r.sfxDown.w, r.sfxDown.h, '-');
    this.drawButton(ctx, r.sfxUp.x, r.sfxUp.y, r.sfxUp.w, r.sfxUp.h, '+');
    this.drawValue(ctx, Math.round(GAME_CONFIG.settings.sfxVolume * 100) + '%', r.box.x + 205, r.box.y + 294);

    this.drawButton(ctx, r.testSfx.x, r.testSfx.y, r.testSfx.w, r.testSfx.h, 'TEST SFX');
    this.drawButton(ctx, r.testMusic.x, r.testMusic.y, r.testMusic.w, r.testMusic.h, 'TEST MUSIC');
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
    ctx.fillText('Audio: menu music, music volume, and SFX volume.', p.x + 22, p.y + 58);

    this.drawButton(ctx, p.x + p.w - 78, p.y + 14, 56, 32, 'X');
    this.drawTabs(ctx);
    this.drawAudioPanel(ctx);
    this.drawFooter(ctx);
    this.drawStatus(ctx, p);
  };
})();
