const DevPanel = {
  open: false,
  tab: 'PLAYER',
  tabs: ['PLAYER', 'DOG', 'SUCKER', 'LEVEL WAVES'],
  statusText: 'Ready',
  statusUntil: 0,
  selectedLevelIndex: 0,
  selectedWaveIndex: 0,
  selectedGroupIndex: 0,

  fieldGroups: {
    PLAYER: [
      { label: 'Boris speed', path: 'heroes.boris.speed', min: 0.5, max: 5, step: 0.05 },
      { label: 'Boris HP', path: 'heroes.boris.hp', min: 10, max: 300, step: 5 },
      { label: 'Boris damage', path: 'heroes.boris.damage', min: 1, max: 80, step: 1 },
      { label: 'Alexey speed', path: 'heroes.alexey.speed', min: 0.5, max: 5, step: 0.05 },
      { label: 'Alexey HP', path: 'heroes.alexey.hp', min: 10, max: 300, step: 5 },
      { label: 'Alexey damage', path: 'heroes.alexey.damage', min: 1, max: 80, step: 1 },
      { label: 'Anna speed', path: 'heroes.anna.speed', min: 0.5, max: 5, step: 0.05 },
      { label: 'Anna HP', path: 'heroes.anna.hp', min: 10, max: 300, step: 5 },
      { label: 'Anna damage', path: 'heroes.anna.damage', min: 1, max: 80, step: 1 },
      { label: 'Player scale', path: 'playerScale', min: 0.05, max: 0.22, step: 0.005 },
      { label: 'Walk frame ms', path: 'walkFrameMs', min: 80, max: 400, step: 10 }
    ],
    DOG: [
      { label: 'Dog speed', path: 'enemies.dogRegime.speed', min: 0.3, max: 4, step: 0.05 },
      { label: 'Dog HP', path: 'enemies.dogRegime.hp', min: 10, max: 300, step: 5 },
      { label: 'Dog damage', path: 'enemies.dogRegime.damage', min: 1, max: 60, step: 1 },
      { label: 'Dog scale', path: 'enemies.dogRegime.scale', min: 0.05, max: 0.25, step: 0.005 },
      { label: 'Enemy walk ms', path: 'enemyWalkFrameMs', min: 80, max: 500, step: 10 }
    ],
    SUCKER: [
      { label: 'Sucker speed', path: 'enemies.sucker.speed', min: 0.3, max: 4, step: 0.05 },
      { label: 'Sucker HP', path: 'enemies.sucker.hp', min: 20, max: 500, step: 5 },
      { label: 'Sucker damage', path: 'enemies.sucker.damage', min: 1, max: 60, step: 1 },
      { label: 'Sucker scale', path: 'enemies.sucker.scale', min: 0.05, max: 0.25, step: 0.005 },
      { label: 'Attack start dist', path: 'enemies.sucker.attackStartDistance', min: 100, max: 900, step: 20 },
      { label: 'Min dist', path: 'enemies.sucker.minDistance', min: 40, max: 500, step: 10 },
      { label: 'Align Y', path: 'enemies.sucker.alignToleranceY', min: 8, max: 90, step: 2 },
      { label: 'Slide speed', path: 'enemies.sucker.slideSpeed', min: 2, max: 24, step: 0.25 },
      { label: 'Slide range', path: 'enemies.sucker.slideRange', min: 120, max: 1100, step: 20 },
      { label: 'Windup ms', path: 'enemies.sucker.windupMs', min: 80, max: 1200, step: 20 },
      { label: 'Recovery ms', path: 'enemies.sucker.slideRecoveryMs', min: 100, max: 1400, step: 20 },
      { label: 'Interrupt recovery', path: 'enemies.sucker.interruptedRecoveryMs', min: 100, max: 2000, step: 25 },
      { label: 'Pin ms', path: 'enemies.sucker.pinDurationMs', min: 400, max: 3500, step: 50 },
      { label: 'Bite tick', path: 'enemies.sucker.biteTickMs', min: 150, max: 1200, step: 25 },
      { label: 'Bite damage', path: 'enemies.sucker.biteDamage', min: 1, max: 40, step: 1 },
      { label: 'Enemy scatter', path: 'enemies.sucker.otherEnemyScatterDistance', min: 0, max: 300, step: 10 }
    ]
  },

  init() {
    this.ensureLevels();
    this.load();
  },

  update(game) {
    if (!GAME_CONFIG.adminTuningEnabled) return;

    if (Input.consume('dev') || Input.consume('`') || Input.consume('ё')) {
      this.open = !this.open;
      this.syncSelectedLevelWithScene(game);
    }

    const click = Input.consumePointer();
    if (!this.open) {
      if (click && click.x < 78 && click.y < 42) {
        this.open = true;
        this.syncSelectedLevelWithScene(game);
        return;
      }

      // The closed dev badge must not swallow normal menu or map clicks.
      if (click) Input.restorePointer(click);
      return;
    }
    if (Input.consume('escape')) {
      this.open = false;
      return;
    }

    if (click) this.handleClick(click, game);
  },

  handleClick(point, game) {
    const panel = this.panelRect();
    if (!this.inRect(point, panel)) return;

    const close = { x: panel.x + panel.w - 78, y: panel.y + 14, w: 56, h: 32 };
    if (this.inRect(point, close)) { this.open = false; return; }

    const tab = this.getClickedTab(point);
    if (tab) { this.tab = tab; this.setStatus('Tab: ' + tab); return; }

    if (this.handleFooterClick(point, game)) return;

    if (this.tab === 'LEVEL WAVES') {
      this.handleWaveEditorClick(point, game);
      return;
    }

    this.handleFieldsClick(point, game);
  },

  handleFieldsClick(point, game) {
    const fields = this.fieldGroups[this.tab] || [];
    const panel = this.panelRect();
    const startY = panel.y + 120;

    for (let i = 0; i < fields.length; i++) {
      const y = startY + i * 32;
      const minus = { x: panel.x + 350, y: y - 20, w: 34, h: 25 };
      const plus = { x: panel.x + 640, y: y - 20, w: 34, h: 25 };
      const bar = { x: panel.x + 395, y: y - 13, w: 235, h: 11 };
      const field = fields[i];

      if (this.inRect(point, minus)) { this.change(field, -field.step, game); return; }
      if (this.inRect(point, plus)) { this.change(field, field.step, game); return; }
      if (this.inRect(point, bar)) {
        const ratio = Math.max(0, Math.min(1, (point.x - bar.x) / bar.w));
        const raw = field.min + ratio * (field.max - field.min);
        this.setValue(field.path, this.roundToStep(raw, field.step));
        this.applyToCurrentScene(game);
        this.setStatus('Changed ' + field.label);
        return;
      }
    }
  },

  handleFooterClick(point, game) {
    const panel = this.panelRect();
    const y = panel.y + panel.h - 54;
    const buttons = {
      save: { x: panel.x + 24, y, w: 92, h: 34 },
      reset: { x: panel.x + 126, y, w: 96, h: 34 },
      apply: { x: panel.x + 232, y, w: 116, h: 34 },
      exportBtn: { x: panel.x + 358, y, w: 112, h: 34 },
      restart: { x: panel.x + 480, y, w: 112, h: 34 }
    };

    if (this.inRect(point, buttons.save)) { this.save(); return true; }
    if (this.inRect(point, buttons.reset)) { this.reset(game); return true; }
    if (this.inRect(point, buttons.apply)) { this.applyToCurrentScene(game); this.restartScene(game); this.setStatus('Applied + restarted'); return true; }
    if (this.inRect(point, buttons.exportBtn)) { this.exportConfig(); return true; }
    if (this.inRect(point, buttons.restart)) { this.restartScene(game); this.setStatus('Level restarted'); return true; }
    return false;
  },

  handleWaveEditorClick(point, game) {
    const r = this.waveEditorRects();
    const levelKeys = this.getLevelKeys();
    const level = this.getSelectedLevel();
    const wave = this.getSelectedWave();
    const group = this.getSelectedEnemyGroup(wave);
    const enemyTypes = this.getEnemyTypes();

    if (this.inRect(point, r.levelPrev)) { this.selectedLevelIndex = this.wrap(this.selectedLevelIndex - 1, levelKeys.length); this.selectedWaveIndex = 0; this.selectedGroupIndex = 0; this.applyLevelMusic(game); this.setStatus('Level: ' + this.getSelectedLevelKey()); return true; }
    if (this.inRect(point, r.levelNext)) { this.selectedLevelIndex = this.wrap(this.selectedLevelIndex + 1, levelKeys.length); this.selectedWaveIndex = 0; this.selectedGroupIndex = 0; this.applyLevelMusic(game); this.setStatus('Level: ' + this.getSelectedLevelKey()); return true; }
    if (this.inRect(point, r.musicPrev)) { this.changeLevelMusic(-1, game); return true; }
    if (this.inRect(point, r.musicNext)) { this.changeLevelMusic(1, game); return true; }
    if (this.inRect(point, r.wavePrev)) { this.selectedWaveIndex = Math.max(0, this.selectedWaveIndex - 1); this.selectedGroupIndex = 0; this.setStatus('Wave: ' + (this.selectedWaveIndex + 1)); return true; }
    if (this.inRect(point, r.waveNext)) { this.selectedWaveIndex = Math.min(level.waves.length - 1, this.selectedWaveIndex + 1); this.selectedGroupIndex = 0; this.setStatus('Wave: ' + (this.selectedWaveIndex + 1)); return true; }
    if (this.inRect(point, r.groupPrev)) { this.selectedGroupIndex = Math.max(0, this.selectedGroupIndex - 1); this.setStatus('Group: ' + (this.selectedGroupIndex + 1)); return true; }
    if (this.inRect(point, r.groupNext)) { this.selectedGroupIndex = Math.min(wave.enemies.length - 1, this.selectedGroupIndex + 1); this.setStatus('Group: ' + (this.selectedGroupIndex + 1)); return true; }
    if (this.inRect(point, r.typeBtn)) { group.type = this.nextValue(group.type, enemyTypes); this.restartScene(game); this.setStatus('Enemy type: ' + group.type); return true; }
    if (this.inRect(point, r.countMinus)) { group.count = Math.max(0, group.count - 1); this.restartScene(game); this.setStatus('Count: ' + group.count); return true; }
    if (this.inRect(point, r.countPlus)) { group.count = Math.min(12, group.count + 1); this.restartScene(game); this.setStatus('Count: ' + group.count); return true; }
    if (this.inRect(point, r.sideBtn)) { group.side = this.nextValue(group.side, ['right', 'left', 'both']); this.restartScene(game); this.setStatus('Side: ' + group.side); return true; }
    if (this.inRect(point, r.delayMinus)) { group.delayMs = Math.max(0, (Number(group.delayMs) || 0) - 500); this.restartScene(game); this.setStatus('Group delay: ' + this.formatDelay(group.delayMs)); return true; }
    if (this.inRect(point, r.delayPlus)) { group.delayMs = Math.min(60000, (Number(group.delayMs) || 0) + 500); this.restartScene(game); this.setStatus('Group delay: ' + this.formatDelay(group.delayMs)); return true; }
    if (this.inRect(point, r.triggerBtn)) { wave.trigger = this.nextValue(wave.trigger, ['onEnter', 'afterWaveCleared']); this.restartScene(game); this.setStatus('Trigger: ' + wave.trigger); return true; }
    if (this.inRect(point, r.addGroup)) { this.addEnemyGroup(game); return true; }
    if (this.inRect(point, r.removeGroup)) { this.removeEnemyGroup(game); return true; }
    if (this.inRect(point, r.addWave)) { this.addWave(game); return true; }
    if (this.inRect(point, r.removeWave)) { this.removeWave(game); return true; }
    if (this.inRect(point, r.copyWave)) { this.copyWave(game); return true; }

    return false;
  },

  change(field, delta, game) {
    const current = this.getValue(field.path);
    const next = Math.max(field.min, Math.min(field.max, this.roundToStep(current + delta, field.step)));
    this.setValue(field.path, next);
    this.applyToCurrentScene(game);
    this.setStatus(field.label + ': ' + next);
  },

  applyToCurrentScene(game) {
    if (!game.scene) return;
    const player = game.scene.player;
    if (player) {
      const hero = GAME_CONFIG.heroes[player.heroKey];
      player.speed = hero.speed;
      player.damage = hero.damage;
      player.maxHp = hero.hp;
      player.hp = Math.min(player.hp, player.maxHp);
    }
    for (const enemy of game.scene.enemies || []) {
      if (typeof enemy.applyTuning === 'function') enemy.applyTuning(false);
    }
  },

  restartScene(game) {
    if (game.scene && typeof game.scene.restartCurrentLevel === 'function') {
      game.scene.restartCurrentLevel();
      this.applyToCurrentScene(game);
    }
  },

  draw(ctx) {
    if (!GAME_CONFIG.adminTuningEnabled) return;

    if (!this.open) {
      ctx.fillStyle = 'rgba(0,0,0,0.45)';
      ctx.fillRect(8, 8, 58, 28);
      ctx.strokeStyle = 'rgba(255,255,255,0.55)';
      ctx.strokeRect(8, 8, 58, 28);
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 14px Arial';
      ctx.fillText('DEV', 22, 27);
      return;
    }

    const panel = this.panelRect();
    ctx.fillStyle = 'rgba(0,0,0,0.90)';
    ctx.fillRect(panel.x, panel.y, panel.w, panel.h);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.strokeRect(panel.x, panel.y, panel.w, panel.h);

    ctx.fillStyle = '#fff';
    ctx.font = 'bold 24px Arial';
    ctx.fillText('DEVELOPER PANEL', panel.x + 22, panel.y + 38);
    ctx.font = '13px Arial';
    ctx.fillStyle = '#aaa';
    ctx.fillText('Tabs: balance, enemies, level waves, and per-level music. SAVE stores in localStorage.', panel.x + 22, panel.y + 58);

    this.drawButton(ctx, panel.x + panel.w - 78, panel.y + 14, 56, 32, 'X');
    this.drawTabs(ctx);

    if (this.tab === 'LEVEL WAVES') this.drawWaveEditor(ctx);
    else this.drawFields(ctx);

    this.drawFooter(ctx);
    this.drawStatus(ctx, panel);
  },

  drawTabs(ctx) {
    const panel = this.panelRect();
    for (let i = 0; i < this.tabs.length; i++) {
      const r = this.tabRect(i);
      const active = this.tabs[i] === this.tab;
      ctx.fillStyle = active ? 'rgba(255,255,255,0.22)' : 'rgba(255,255,255,0.08)';
      ctx.fillRect(r.x, r.y, r.w, r.h);
      ctx.strokeStyle = active ? '#fff' : 'rgba(255,255,255,0.45)';
      ctx.strokeRect(r.x, r.y, r.w, r.h);
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 13px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(this.tabs[i], r.x + r.w / 2, r.y + 22);
      ctx.textAlign = 'left';
    }
  },

  drawFields(ctx) {
    const fields = this.fieldGroups[this.tab] || [];
    const panel = this.panelRect();
    const startY = panel.y + 120;
    for (let i = 0; i < fields.length; i++) this.drawField(ctx, fields[i], panel.x + 36, startY + i * 32);
  },

  drawField(ctx, field, x, y) {
    const value = this.getValue(field.path);
    const ratio = (value - field.min) / (field.max - field.min);
    ctx.font = '14px Arial';
    ctx.fillStyle = '#fff';
    ctx.fillText(field.label, x, y);
    ctx.fillStyle = '#ccc';
    ctx.fillText(String(value), x + 220, y);

    this.drawButton(ctx, x + 314, y - 20, 34, 25, '-');
    ctx.fillStyle = '#222';
    ctx.fillRect(x + 359, y - 13, 235, 11);
    ctx.fillStyle = '#55ccff';
    ctx.fillRect(x + 359, y - 13, 235 * Math.max(0, Math.min(1, ratio)), 11);
    ctx.strokeStyle = '#777';
    ctx.strokeRect(x + 359, y - 13, 235, 11);
    this.drawButton(ctx, x + 604, y - 20, 34, 25, '+');
  },

  drawWaveEditor(ctx) {
    const r = this.waveEditorRects();
    const level = this.getSelectedLevel();
    const wave = this.getSelectedWave();
    const group = this.getSelectedEnemyGroup(wave);
    const levelKey = this.getSelectedLevelKey();
    const musicKeys = this.getMusicKeys();

    ctx.fillStyle = 'rgba(255,255,255,0.06)';
    ctx.fillRect(r.box.x, r.box.y, r.box.w, r.box.h);
    ctx.strokeStyle = 'rgba(255,255,255,0.35)';
    ctx.strokeRect(r.box.x, r.box.y, r.box.w, r.box.h);

    ctx.fillStyle = '#fff';
    ctx.font = 'bold 18px Arial';
    ctx.fillText('LEVEL WAVE EDITOR', r.box.x + 20, r.box.y + 32);

    this.drawRowLabel(ctx, 'Level:', r.box.x + 24, r.box.y + 76);
    this.drawButton(ctx, r.levelPrev.x, r.levelPrev.y, r.levelPrev.w, r.levelPrev.h, '<');
    this.drawButton(ctx, r.levelNext.x, r.levelNext.y, r.levelNext.w, r.levelNext.h, '>');
    this.drawValue(ctx, levelKey + ' / ' + level.name, r.box.x + 145, r.box.y + 76);

    this.drawRowLabel(ctx, 'Music:', r.box.x + 24, r.box.y + 118);
    this.drawButton(ctx, r.musicPrev.x, r.musicPrev.y, r.musicPrev.w, r.musicPrev.h, '<');
    this.drawButton(ctx, r.musicNext.x, r.musicNext.y, r.musicNext.w, r.musicNext.h, '>');
    this.drawValue(ctx, (level.music || 'levelTheme') + '  [' + musicKeys.length + ' tracks]', r.box.x + 145, r.box.y + 118);

    this.drawRowLabel(ctx, 'Wave:', r.box.x + 24, r.box.y + 160);
    this.drawButton(ctx, r.wavePrev.x, r.wavePrev.y, r.wavePrev.w, r.wavePrev.h, '<');
    this.drawButton(ctx, r.waveNext.x, r.waveNext.y, r.waveNext.w, r.waveNext.h, '>');
    this.drawValue(ctx, String(this.selectedWaveIndex + 1) + ' / ' + level.waves.length, r.box.x + 145, r.box.y + 160);

    this.drawRowLabel(ctx, 'Group:', r.box.x + 24, r.box.y + 202);
    this.drawButton(ctx, r.groupPrev.x, r.groupPrev.y, r.groupPrev.w, r.groupPrev.h, '<');
    this.drawButton(ctx, r.groupNext.x, r.groupNext.y, r.groupNext.w, r.groupNext.h, '>');
    this.drawValue(ctx, String(this.selectedGroupIndex + 1) + ' / ' + wave.enemies.length, r.box.x + 145, r.box.y + 202);

    this.drawRowLabel(ctx, 'Enemy type:', r.box.x + 24, r.box.y + 248);
    this.drawButton(ctx, r.typeBtn.x, r.typeBtn.y, r.typeBtn.w, r.typeBtn.h, group.type);

    this.drawRowLabel(ctx, 'Count:', r.box.x + 24, r.box.y + 294);
    this.drawButton(ctx, r.countMinus.x, r.countMinus.y, r.countMinus.w, r.countMinus.h, '-');
    this.drawButton(ctx, r.countPlus.x, r.countPlus.y, r.countPlus.w, r.countPlus.h, '+');
    this.drawValue(ctx, String(group.count), r.box.x + 145, r.box.y + 294);

    this.drawRowLabel(ctx, 'Side:', r.box.x + 24, r.box.y + 340);
    this.drawButton(ctx, r.sideBtn.x, r.sideBtn.y, r.sideBtn.w, r.sideBtn.h, String(group.side).toUpperCase());

    this.drawRowLabel(ctx, 'Delay:', r.box.x + 24, r.box.y + 386);
    this.drawButton(ctx, r.delayMinus.x, r.delayMinus.y, r.delayMinus.w, r.delayMinus.h, '-');
    this.drawButton(ctx, r.delayPlus.x, r.delayPlus.y, r.delayPlus.w, r.delayPlus.h, '+');
    this.drawValue(ctx, this.formatDelay(group.delayMs), r.box.x + 145, r.box.y + 386);

    this.drawRowLabel(ctx, 'Trigger:', r.box.x + 24, r.box.y + 432);
    this.drawButton(ctx, r.triggerBtn.x, r.triggerBtn.y, r.triggerBtn.w, r.triggerBtn.h, wave.trigger);

    this.drawButton(ctx, r.addGroup.x, r.addGroup.y, r.addGroup.w, r.addGroup.h, 'ADD GROUP');
    this.drawButton(ctx, r.removeGroup.x, r.removeGroup.y, r.removeGroup.w, r.removeGroup.h, 'DEL GROUP');
    this.drawButton(ctx, r.addWave.x, r.addWave.y, r.addWave.w, r.addWave.h, 'ADD WAVE');
    this.drawButton(ctx, r.removeWave.x, r.removeWave.y, r.removeWave.w, r.removeWave.h, 'DEL WAVE');
    this.drawButton(ctx, r.copyWave.x, r.copyWave.y, r.copyWave.w, r.copyWave.h, 'COPY WAVE');
  },

  drawFooter(ctx) {
    const panel = this.panelRect();
    const y = panel.y + panel.h - 54;
    this.drawButton(ctx, panel.x + 24, y, 92, 34, 'SAVE');
    this.drawButton(ctx, panel.x + 126, y, 96, 34, 'RESET');
    this.drawButton(ctx, panel.x + 232, y, 116, 34, 'APPLY');
    this.drawButton(ctx, panel.x + 358, y, 112, 34, 'EXPORT');
    this.drawButton(ctx, panel.x + 480, y, 112, 34, 'RESTART');
  },

  drawButton(ctx, x, y, w, h, text) {
    ctx.fillStyle = 'rgba(255,255,255,0.12)';
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = 'rgba(255,255,255,0.75)';
    ctx.strokeRect(x, y, w, h);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 13px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(text, x + w / 2, y + h / 2 + 5);
    ctx.textAlign = 'left';
  },

  drawRowLabel(ctx, text, x, y) {
    ctx.font = '14px Arial';
    ctx.fillStyle = '#ccc';
    ctx.fillText(text, x, y);
  },

  drawValue(ctx, text, x, y) {
    ctx.font = 'bold 14px Arial';
    ctx.fillStyle = '#fff';
    ctx.fillText(text, x, y);
  },

  drawStatus(ctx, panel) {
    ctx.font = '13px Arial';
    ctx.fillStyle = performance.now() < this.statusUntil ? '#8cff8c' : '#aaa';
    ctx.fillText('Status: ' + this.statusText, panel.x + 620, panel.y + panel.h - 32);
  },

  panelRect() {
    return { x: 24, y: 24, w: 1050, h: 670 };
  },

  tabRect(index) {
    const panel = this.panelRect();
    return { x: panel.x + 24 + index * 152, y: panel.y + 76, w: 142, h: 34 };
  },

  getClickedTab(point) {
    for (let i = 0; i < this.tabs.length; i++) if (this.inRect(point, this.tabRect(i))) return this.tabs[i];
    return null;
  },

  waveEditorRects() {
    const panel = this.panelRect();
    const x = panel.x + 36;
    const y = panel.y + 124;
    return {
      box: { x, y, w: 700, h: 492 },
      levelPrev: { x: x + 92, y: y + 54, w: 36, h: 26 },
      levelNext: { x: x + 642, y: y + 54, w: 36, h: 26 },
      musicPrev: { x: x + 92, y: y + 96, w: 36, h: 26 },
      musicNext: { x: x + 642, y: y + 96, w: 36, h: 26 },
      wavePrev: { x: x + 92, y: y + 138, w: 36, h: 26 },
      waveNext: { x: x + 190, y: y + 138, w: 36, h: 26 },
      groupPrev: { x: x + 92, y: y + 180, w: 36, h: 26 },
      groupNext: { x: x + 190, y: y + 180, w: 36, h: 26 },
      typeBtn: { x: x + 132, y: y + 226, w: 160, h: 30 },
      countMinus: { x: x + 100, y: y + 272, w: 36, h: 26 },
      countPlus: { x: x + 180, y: y + 272, w: 36, h: 26 },
      sideBtn: { x: x + 132, y: y + 318, w: 160, h: 30 },
      delayMinus: { x: x + 100, y: y + 364, w: 36, h: 26 },
      delayPlus: { x: x + 180, y: y + 364, w: 36, h: 26 },
      triggerBtn: { x: x + 132, y: y + 410, w: 210, h: 30 },
      addGroup: { x: x + 24, y: y + 452, w: 110, h: 34 },
      removeGroup: { x: x + 146, y: y + 452, w: 110, h: 34 },
      addWave: { x: x + 280, y: y + 452, w: 110, h: 34 },
      removeWave: { x: x + 402, y: y + 452, w: 110, h: 34 },
      copyWave: { x: x + 524, y: y + 452, w: 110, h: 34 }
    };
  },

  inRect(p, r) {
    return p.x >= r.x && p.x <= r.x + r.w && p.y >= r.y && p.y <= r.y + r.h;
  },

  getValue(path) {
    return path.split('.').reduce((obj, key) => obj[key], GAME_CONFIG);
  },

  setValue(path, value) {
    const parts = path.split('.');
    let obj = GAME_CONFIG;
    for (let i = 0; i < parts.length - 1; i++) obj = obj[parts[i]];
    obj[parts[parts.length - 1]] = value;
  },

  getEnemyTypes() {
    return Object.keys(GAME_CONFIG.enemies || {});
  },

  getMusicKeys() {
    const keys = Object.keys((Assets.audio && Assets.audio.music) || {});
    return keys.length ? keys : ['levelTheme'];
  },

  changeLevelMusic(direction, game) {
    const level = this.getSelectedLevel();
    const musicKeys = this.getMusicKeys();
    const current = level.music || 'levelTheme';
    const currentIndex = Math.max(0, musicKeys.indexOf(current));
    level.music = musicKeys[this.wrap(currentIndex + direction, musicKeys.length)];
    this.applyLevelMusic(game);
    this.setStatus('Level music: ' + level.music);
  },

  applyLevelMusic(game) {
    const level = this.getSelectedLevel();
    if (game && game.scene && game.scene.getLevelKey && game.scene.getLevelKey() === this.getSelectedLevelKey()) {
      AudioManager.playMusic(level.music || 'levelTheme', true);
    }
  },

  getLevelKeys() {
    this.ensureLevels();
    return GAME_CONFIG.levelOrder || Object.keys(GAME_CONFIG.levels);
  },

  getSelectedLevelKey() {
    const keys = this.getLevelKeys();
    this.selectedLevelIndex = this.wrap(this.selectedLevelIndex, keys.length);
    return keys[this.selectedLevelIndex];
  },

  getSelectedLevel() {
    const key = this.getSelectedLevelKey();
    if (!GAME_CONFIG.levels[key]) GAME_CONFIG.levels[key] = { name: key, waves: [] };
    if (!GAME_CONFIG.levels[key].music) GAME_CONFIG.levels[key].music = 'levelTheme';
    if (!GAME_CONFIG.levels[key].waves || GAME_CONFIG.levels[key].waves.length === 0) {
      GAME_CONFIG.levels[key].waves = [this.createDefaultWave('onEnter')];
    }
    this.selectedWaveIndex = Math.min(this.selectedWaveIndex, GAME_CONFIG.levels[key].waves.length - 1);
    return GAME_CONFIG.levels[key];
  },

  getSelectedWave() {
    const level = this.getSelectedLevel();
    return level.waves[this.selectedWaveIndex];
  },

  getSelectedEnemyGroup(wave) {
    if (!wave.enemies || wave.enemies.length === 0) wave.enemies = [{ type: this.getEnemyTypes()[0] || 'dogRegime', count: 1, side: 'right' }];
    this.selectedGroupIndex = Math.min(this.selectedGroupIndex, wave.enemies.length - 1);
    return wave.enemies[this.selectedGroupIndex];
  },

  formatDelay(delayMs) {
    const seconds = Math.max(0, Number(delayMs) || 0) / 1000;
    return seconds.toFixed(seconds % 1 === 0 ? 0 : 1) + 's';
  },

  syncSelectedLevelWithScene(game) {
    if (!game.scene || typeof game.scene.getLevelKey !== 'function') return;
    const keys = this.getLevelKeys();
    const index = keys.indexOf(game.scene.getLevelKey());
    if (index >= 0) this.selectedLevelIndex = index;
    this.selectedWaveIndex = Math.max(0, game.scene.currentWaveIndex || 0);
    this.selectedGroupIndex = 0;
  },

  createDefaultWave(trigger = 'afterWaveCleared') {
    return { trigger, enemies: [{ type: 'dogRegime', count: 1, side: 'right', delayMs: 0 }] };
  },

  addEnemyGroup(game) {
    const wave = this.getSelectedWave();
    wave.enemies.push({ type: 'dogRegime', count: 1, side: 'right', delayMs: 0 });
    this.selectedGroupIndex = wave.enemies.length - 1;
    this.restartScene(game);
    this.setStatus('Enemy group added');
  },

  removeEnemyGroup(game) {
    const wave = this.getSelectedWave();
    if (wave.enemies.length <= 1) { this.setStatus('Cannot remove last group'); return; }
    wave.enemies.splice(this.selectedGroupIndex, 1);
    this.selectedGroupIndex = Math.max(0, this.selectedGroupIndex - 1);
    this.restartScene(game);
    this.setStatus('Enemy group removed');
  },

  addWave(game) {
    const level = this.getSelectedLevel();
    level.waves.push(this.createDefaultWave('afterWaveCleared'));
    this.selectedWaveIndex = level.waves.length - 1;
    this.selectedGroupIndex = 0;
    this.restartScene(game);
    this.setStatus('Wave added');
  },

  removeWave(game) {
    const level = this.getSelectedLevel();
    if (level.waves.length <= 1) { this.setStatus('Cannot remove last wave'); return; }
    level.waves.splice(this.selectedWaveIndex, 1);
    this.selectedWaveIndex = Math.max(0, this.selectedWaveIndex - 1);
    this.selectedGroupIndex = 0;
    this.restartScene(game);
    this.setStatus('Wave removed');
  },

  copyWave(game) {
    const level = this.getSelectedLevel();
    const copy = JSON.parse(JSON.stringify(this.getSelectedWave()));
    level.waves.splice(this.selectedWaveIndex + 1, 0, copy);
    this.selectedWaveIndex += 1;
    this.selectedGroupIndex = 0;
    this.restartScene(game);
    this.setStatus('Wave copied');
  },

  ensureLevels() {
    if (!GAME_CONFIG.levelOrder) GAME_CONFIG.levelOrder = ['street01', 'street02', 'street03'];
    if (!GAME_CONFIG.levels) GAME_CONFIG.levels = {};
    for (const key of GAME_CONFIG.levelOrder) {
      if (!GAME_CONFIG.levels[key]) GAME_CONFIG.levels[key] = { name: key, music: 'levelTheme', waves: [this.createDefaultWave('onEnter')] };
      if (!GAME_CONFIG.levels[key].music) GAME_CONFIG.levels[key].music = 'levelTheme';
      if (!GAME_CONFIG.levels[key].waves || GAME_CONFIG.levels[key].waves.length === 0) {
        GAME_CONFIG.levels[key].waves = [this.createDefaultWave('onEnter')];
      }
      for (const wave of GAME_CONFIG.levels[key].waves) {
        if (!wave.enemies || wave.enemies.length === 0) wave.enemies = [{ type: 'dogRegime', count: 1, side: 'right' }];
        for (const group of wave.enemies) {
          if (!group.type) group.type = 'dogRegime';
          if (group.count == null) group.count = 1;
          if (!group.side) group.side = 'right';
          if (group.delayMs == null) group.delayMs = 0;
        }
      }
    }
  },

  nextValue(current, values) {
    const index = values.indexOf(current);
    return values[(index + 1) % values.length];
  },

  wrap(index, length) {
    if (length <= 0) return 0;
    return ((index % length) + length) % length;
  },

  roundToStep(value, step) {
    const precision = String(step).includes('.') ? String(step).split('.')[1].length : 0;
    return Number((Math.round(value / step) * step).toFixed(precision));
  },

  save() {
    localStorage.setItem('streetsOfRussia.tuning', JSON.stringify(GAME_CONFIG));
    this.setStatus('Saved to localStorage');
  },

  load() {
    const saved = localStorage.getItem('streetsOfRussia.tuning');
    if (!saved) return;
    try {
      const data = JSON.parse(saved);
      this.deepMerge(GAME_CONFIG, data);
      this.migrateBuildDefaults(data);
      const restoredFarEast = this.restoreStaleFarEastWaves(data);
      const repairedPosterDrop = this.repairReleasedPosterDrop();
      const repairedFruitKiosk = this.repairFruitKiosk();
      const repairedHeroInfo = this.repairHeroInfo();
      this.migrateConfig();
      this.ensureLevels();
      if (restoredFarEast || repairedPosterDrop || repairedFruitKiosk || repairedHeroInfo) {
        localStorage.setItem('streetsOfRussia.tuning', JSON.stringify(GAME_CONFIG));
        this.setStatus('Applied released configuration updates');
      } else {
        this.setStatus('Loaded saved tuning');
      }
    } catch (error) {
      console.warn('Failed to load tuning', error);
      this.setStatus('Failed to load saved tuning');
    }
  },

  repairReleasedPosterDrop() {
    const level = GAME_CONFIG.levels && GAME_CONFIG.levels.street01;
    const defaults = DEFAULT_GAME_CONFIG.levels && DEFAULT_GAME_CONFIG.levels.street01;
    const poster = level && level.interactives && level.interactives.find((item) => item.id === 'shamanPoster');
    const defaultPoster = defaults && defaults.interactives && defaults.interactives.find((item) => item.id === 'shamanPoster');
    if (!poster || !defaultPoster || poster.dropPickup === defaultPoster.dropPickup) return false;
    poster.dropPickup = defaultPoster.dropPickup;
    return true;
  },

  repairFruitKiosk() {
    const level = GAME_CONFIG.levels && GAME_CONFIG.levels.street03;
    const defaults = DEFAULT_GAME_CONFIG.levels && DEFAULT_GAME_CONFIG.levels.street03;
    const defaultKiosk = defaults && defaults.interactives && defaults.interactives.find((item) => item.id === 'fruitKiosk');
    if (!level || !defaultKiosk) return false;

    if (!Array.isArray(level.interactives)) level.interactives = [];
    let kiosk = level.interactives.find((item) => item.id === 'fruitKiosk');
    if (!kiosk) {
      level.interactives.push(JSON.parse(JSON.stringify(defaultKiosk)));
      return true;
    }

    let repaired = false;
    for (const key of ['type', 'hitsToReplace', 'requiresBossDefeat', 'damageEffect', 'dropPickup', 'dropX', 'dropY']) {
      if (kiosk[key] === defaultKiosk[key]) continue;
      kiosk[key] = JSON.parse(JSON.stringify(defaultKiosk[key]));
      repaired = true;
    }
    return repaired;
  },

  repairHeroInfo() {
    const defaults = DEFAULT_GAME_CONFIG.heroes || {};
    let repaired = false;
    for (const heroKey of ['alexey', 'anna', 'boris']) {
      const hero = GAME_CONFIG.heroes && GAME_CONFIG.heroes[heroKey];
      const defaultHero = defaults[heroKey];
      if (!hero || !defaultHero) continue;
      for (const key of ['tagline', 'bio', 'ability']) {
        if (hero[key] === defaultHero[key]) continue;
        hero[key] = defaultHero[key];
        repaired = true;
      }
    }
    return repaired;
  },

  restoreStaleFarEastWaves(savedConfig) {
    const levels = savedConfig && savedConfig.levels;
    const farEastKeys = ['street01', 'street02', 'street03'];
    const hasExperimentalWaves = levels && farEastKeys.some((key) => this.hasExperimentalFarEastEnemy(levels[key]));
    const hasPosterRegression = savedConfig && ['0.4.184', '0.4.185'].includes(savedConfig.buildVersion);
    if (!hasExperimentalWaves && !hasPosterRegression) return false;

    // Keep positional tuning intact. Only the unfinished roster is replaced.
    for (const key of farEastKeys) {
      if (DEFAULT_GAME_CONFIG.levels && DEFAULT_GAME_CONFIG.levels[key]) {
        GAME_CONFIG.levels[key].waves = JSON.parse(JSON.stringify(DEFAULT_GAME_CONFIG.levels[key].waves));
      }
    }
    if (hasPosterRegression && GAME_CONFIG.levels.street01 && DEFAULT_GAME_CONFIG.levels.street01) {
      GAME_CONFIG.levels.street01.interactives = JSON.parse(JSON.stringify(DEFAULT_GAME_CONFIG.levels.street01.interactives));
    }
    return true;
  },

  hasExperimentalFarEastEnemy(level) {
    if (!level || !Array.isArray(level.waves)) return false;
    return level.waves.some((wave) => Array.isArray(wave.enemies) && wave.enemies.some((group) => (
      group && (group.type === 'goydenish' || group.type === 'negay')
    )));
  },

  migrateBuildDefaults(savedConfig) {
    if (!savedConfig || savedConfig.buildVersion === DEFAULT_GAME_CONFIG.buildVersion) return;

    const defaults = {
      buildVersion: DEFAULT_GAME_CONFIG.buildVersion,
      'heroes.alexey.speed': DEFAULT_GAME_CONFIG.heroes.alexey.speed,
      'heroes.anna.speed': DEFAULT_GAME_CONFIG.heroes.anna.speed,
      'heroes.anna.hp': DEFAULT_GAME_CONFIG.heroes.anna.hp,
      'heroes.boris.speed': DEFAULT_GAME_CONFIG.heroes.boris.speed,
      'bossMatchups.farEastRoc.outgoingDamageMultiplier': DEFAULT_GAME_CONFIG.bossMatchups.farEastRoc.outgoingDamageMultiplier,
      'enemies.dogRegime.speed': DEFAULT_GAME_CONFIG.enemies.dogRegime.speed,
      'enemies.zetnik.speed': DEFAULT_GAME_CONFIG.enemies.zetnik.speed,
      'enemies.sucker.speed': DEFAULT_GAME_CONFIG.enemies.sucker.speed,
      'enemies.sucker.slideSpeed': DEFAULT_GAME_CONFIG.enemies.sucker.slideSpeed,
      'enemies.sucker.fastRetreatSpeed': DEFAULT_GAME_CONFIG.enemies.sucker.fastRetreatSpeed,
      'enemies.sucker.fastRetreatMs': DEFAULT_GAME_CONFIG.enemies.sucker.fastRetreatMs,
      'enemies.sucker.hitsBeforeFastRetreat': DEFAULT_GAME_CONFIG.enemies.sucker.hitsBeforeFastRetreat,
      'enemies.bastard.speed': DEFAULT_GAME_CONFIG.enemies.bastard.speed,
      enemyOffscreenMargin: DEFAULT_GAME_CONFIG.enemyOffscreenMargin,
      'enemies.horse.speed': 2.025,
      'enemies.horse.scale': 0.13,
      'enemies.horse.walkScale': 0.95,
      'enemies.horse.visibleHeight': 0,
      'enemies.horse.attackScale': 1,
      'enemies.horse.finalAttackScale': 1.31,
      'enemies.horse.attackWindupMs': 820,
      'enemies.horse.attackActiveMs': 560,
      'enemies.horse.attackRecoveryMs': 400,
      'enemies.horse.minDistanceX': 120,
      'enemies.horse.preferredDistanceX': 190,
      'enemies.horse.attackMinDistanceX': 115,
      'enemies.horse.attackMaxDistanceX': 255,
      'enemies.horse.attackRangeX': 265,
      'enemies.horse.clubReachForward': 310,
      'enemies.negay.scale': DEFAULT_GAME_CONFIG.enemies.negay.scale,
      'enemies.negay.finalAttackScale': DEFAULT_GAME_CONFIG.enemies.negay.finalAttackScale,
      'enemies.goydenish.screenMarginX': DEFAULT_GAME_CONFIG.enemies.goydenish.screenMarginX,
      'enemies.goydenish.fleeDistanceX': DEFAULT_GAME_CONFIG.enemies.goydenish.fleeDistanceX,
      'enemies.goydenish.fleeSpeedMultiplier': DEFAULT_GAME_CONFIG.enemies.goydenish.fleeSpeedMultiplier,
      'enemies.gundos.speed': 1.875,
      'enemies.gundos.hp': DEFAULT_GAME_CONFIG.enemies.gundos.hp,
      'enemies.gundos.zetnikHitDamage': DEFAULT_GAME_CONFIG.enemies.gundos.zetnikHitDamage,
      'enemies.gundos.fireWallDamage': DEFAULT_GAME_CONFIG.enemies.gundos.fireWallDamage,
      'enemies.gundos.entranceY': 720,
      'enemies.gundos.arenaBottom': 720,
      'enemies.gundos.deathHoldMs': 5000,
      'enemies.gundos.victoryDelayMs': 4800,
      'levels.street01.interactives.0.hitbox.x': 342,
      'levels.street01.interactives.0.hitbox.y': 272,
      'levels.street01.interactives.0.hitbox.w': 128,
      'levels.street01.interactives.0.hitbox.h': 146
    };

    for (const path of Object.keys(defaults)) {
      const value = defaults[path];
      if (value !== undefined) this.setValue(path, value);
    }

    if (GAME_CONFIG.heroes && GAME_CONFIG.heroes.anna && GAME_CONFIG.heroes.anna.abilities) {
      delete GAME_CONFIG.heroes.anna.abilities.bossProjectileDamageMultiplier;
    }
  },

  migrateConfig() {
    const sucker = GAME_CONFIG.enemies && GAME_CONFIG.enemies.sucker;
    if (sucker) {
      if (sucker.attackStartDistance === undefined && sucker.preferredDistance !== undefined) sucker.attackStartDistance = sucker.preferredDistance;
      if (sucker.interruptedRecoveryMs === undefined) sucker.interruptedRecoveryMs = sucker.slideRecoveryMs || 900;
    }
    this.ensureLevels();
  },

  reset(game) {
    this.deepMerge(GAME_CONFIG, JSON.parse(JSON.stringify(DEFAULT_GAME_CONFIG)));
    localStorage.removeItem('streetsOfRussia.tuning');
    this.ensureLevels();
    this.selectedLevelIndex = 0;
    this.selectedWaveIndex = 0;
    this.selectedGroupIndex = 0;
    this.restartScene(game);
    this.applyToCurrentScene(game);
    this.setStatus('Reset to default config');
  },

  exportConfig() {
    const exportData = {
      buildVersion: GAME_CONFIG.buildVersion,
      exportedAt: new Date().toISOString(),
      settings: GAME_CONFIG.settings,
      audio: GAME_CONFIG.audio,
      playerScale: GAME_CONFIG.playerScale,
      enemyScale: GAME_CONFIG.enemyScale,
      walkFrameMs: GAME_CONFIG.walkFrameMs,
      enemyWalkFrameMs: GAME_CONFIG.enemyWalkFrameMs,
      heroes: GAME_CONFIG.heroes,
      enemies: GAME_CONFIG.enemies,
      levelOrder: GAME_CONFIG.levelOrder,
      levels: GAME_CONFIG.levels
    };
    const text = JSON.stringify(exportData, null, 2);
    console.log('STREETS_OF_RUSSIA_TUNING_EXPORT');
    console.log(text);
    this.downloadTextFile('streets-of-russia-dev-export.json', text, 'application/json');

    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text)
        .then(() => this.setStatus('Export downloaded + copied'))
        .catch(() => this.setStatus('Export downloaded + printed'));
    } else {
      this.setStatus('Export downloaded + printed');
    }
  },

  downloadTextFile(filename, text, mimeType = 'text/plain') {
    if (typeof Blob === 'undefined' || typeof URL === 'undefined' || !document.createElement) return false;
    try {
      const blob = new Blob([text], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      return true;
    } catch (error) {
      console.warn('Failed to download export', error);
      return false;
    }
  },

  setStatus(text) {
    this.statusText = text;
    this.statusUntil = performance.now() + 1800;
  },

  deepMerge(target, source) {
    for (const key of Object.keys(source)) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        if (!target[key]) target[key] = {};
        this.deepMerge(target[key], source[key]);
      } else {
        target[key] = source[key];
      }
    }
  }
};
