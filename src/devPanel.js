const DevPanel = {
  open: false,
  fields: [],
  statusText: 'Ready',
  statusUntil: 0,
  selectedLevelIndex: 0,
  selectedWaveIndex: 0,

  init() {
    this.fields = [
      { label: 'Boris speed', path: 'heroes.boris.speed', min: 0.5, max: 5, step: 0.05 },
      { label: 'Boris HP', path: 'heroes.boris.hp', min: 10, max: 300, step: 5 },
      { label: 'Boris damage', path: 'heroes.boris.damage', min: 1, max: 80, step: 1 },

      { label: 'Alexey speed', path: 'heroes.alexey.speed', min: 0.5, max: 5, step: 0.05 },
      { label: 'Alexey HP', path: 'heroes.alexey.hp', min: 10, max: 300, step: 5 },
      { label: 'Alexey damage', path: 'heroes.alexey.damage', min: 1, max: 80, step: 1 },

      { label: 'Anna speed', path: 'heroes.anna.speed', min: 0.5, max: 5, step: 0.05 },
      { label: 'Anna HP', path: 'heroes.anna.hp', min: 10, max: 300, step: 5 },
      { label: 'Anna damage', path: 'heroes.anna.damage', min: 1, max: 80, step: 1 },

      { label: 'Dog speed', path: 'enemies.dogRegime.speed', min: 0.3, max: 4, step: 0.05 },
      { label: 'Dog HP', path: 'enemies.dogRegime.hp', min: 10, max: 300, step: 5 },
      { label: 'Dog damage', path: 'enemies.dogRegime.damage', min: 1, max: 60, step: 1 },

      { label: 'Player scale', path: 'playerScale', min: 0.05, max: 0.22, step: 0.005 },
      { label: 'Enemy scale', path: 'enemyScale', min: 0.05, max: 0.22, step: 0.005 },
      { label: 'Walk frame ms', path: 'walkFrameMs', min: 80, max: 400, step: 10 },
      { label: 'Enemy walk ms', path: 'enemyWalkFrameMs', min: 80, max: 500, step: 10 }
    ];
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
    if (click && !this.open && click.x < 78 && click.y < 42) {
      this.open = true;
      this.syncSelectedLevelWithScene(game);
      return;
    }

    if (!this.open) return;
    if (Input.consume('escape')) {
      this.open = false;
      return;
    }

    if (click) this.handleClick(click, game);
  },

  handleClick(point, game) {
    const panel = this.panelRect();
    if (point.x < panel.x || point.x > panel.x + panel.w || point.y < panel.y || point.y > panel.y + panel.h) return;

    const close = { x: panel.x + panel.w - 80, y: panel.y + 14, w: 58, h: 34 };
    if (this.inRect(point, close)) { this.open = false; return; }

    if (this.handleWaveEditorClick(point, game)) return;
    if (this.handleFooterClick(point, game)) return;

    const startY = panel.y + 72;
    for (let i = 0; i < this.fields.length; i++) {
      const y = startY + i * 29;
      const minus = { x: panel.x + 300, y: y - 18, w: 30, h: 23 };
      const plus = { x: panel.x + 552, y: y - 18, w: 30, h: 23 };
      const bar = { x: panel.x + 337, y: y - 12, w: 208, h: 10 };
      const field = this.fields[i];
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
    const slowPreset = { x: panel.x + 24, y: panel.y + panel.h - 104, w: 110, h: 30 };
    const normalPreset = { x: panel.x + 146, y: panel.y + panel.h - 104, w: 120, h: 30 };
    const fastPreset = { x: panel.x + 278, y: panel.y + panel.h - 104, w: 110, h: 30 };
    const save = { x: panel.x + 24, y: panel.y + panel.h - 58, w: 94, h: 36 };
    const reset = { x: panel.x + 130, y: panel.y + panel.h - 58, w: 96, h: 36 };
    const apply = { x: panel.x + 238, y: panel.y + panel.h - 58, w: 126, h: 36 };
    const exportBtn = { x: panel.x + 376, y: panel.y + panel.h - 58, w: 112, h: 36 };
    const restart = { x: panel.x + 500, y: panel.y + panel.h - 58, w: 112, h: 36 };

    if (this.inRect(point, save)) { this.save(); return true; }
    if (this.inRect(point, reset)) { this.reset(game); return true; }
    if (this.inRect(point, apply)) { this.applyToCurrentScene(game); this.restartScene(game); this.setStatus('Applied + restarted level'); return true; }
    if (this.inRect(point, exportBtn)) { this.exportConfig(); return true; }
    if (this.inRect(point, restart)) { this.restartScene(game); this.setStatus('Level restarted'); return true; }
    if (this.inRect(point, slowPreset)) { this.applyPreset('slow', game); return true; }
    if (this.inRect(point, normalPreset)) { this.applyPreset('normal', game); return true; }
    if (this.inRect(point, fastPreset)) { this.applyPreset('fast', game); return true; }

    return false;
  },

  handleWaveEditorClick(point, game) {
    const r = this.waveEditorRects();
    const levelKeys = this.getLevelKeys();
    const wave = this.getSelectedWave();
    if (!wave) return false;
    const enemy = this.getSelectedEnemyGroup(wave);

    if (this.inRect(point, r.levelPrev)) { this.selectedLevelIndex = this.wrap(this.selectedLevelIndex - 1, levelKeys.length); this.selectedWaveIndex = 0; this.setStatus('Selected ' + this.getSelectedLevelKey()); return true; }
    if (this.inRect(point, r.levelNext)) { this.selectedLevelIndex = this.wrap(this.selectedLevelIndex + 1, levelKeys.length); this.selectedWaveIndex = 0; this.setStatus('Selected ' + this.getSelectedLevelKey()); return true; }
    if (this.inRect(point, r.wavePrev)) { this.selectedWaveIndex = Math.max(0, this.selectedWaveIndex - 1); this.setStatus('Wave ' + (this.selectedWaveIndex + 1)); return true; }
    if (this.inRect(point, r.waveNext)) { this.selectedWaveIndex = Math.min(this.getSelectedLevel().waves.length - 1, this.selectedWaveIndex + 1); this.setStatus('Wave ' + (this.selectedWaveIndex + 1)); return true; }
    if (this.inRect(point, r.countMinus)) { enemy.count = Math.max(0, enemy.count - 1); this.restartScene(game); this.setStatus('Enemy count: ' + enemy.count); return true; }
    if (this.inRect(point, r.countPlus)) { enemy.count = Math.min(12, enemy.count + 1); this.restartScene(game); this.setStatus('Enemy count: ' + enemy.count); return true; }
    if (this.inRect(point, r.sideBtn)) { enemy.side = this.nextValue(enemy.side, ['right', 'left', 'both']); this.restartScene(game); this.setStatus('Side: ' + enemy.side); return true; }
    if (this.inRect(point, r.triggerBtn)) { wave.trigger = this.nextValue(wave.trigger, ['onEnter', 'afterWaveCleared']); this.restartScene(game); this.setStatus('Trigger: ' + wave.trigger); return true; }
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

  applyPreset(name, game) {
    const presets = {
      slow: {
        heroes: { boris: { speed: 1.85 }, alexey: { speed: 2.15 }, anna: { speed: 2.55 } },
        enemies: { dogRegime: { speed: 1.0 } },
        walkFrameMs: 260,
        enemyWalkFrameMs: 310
      },
      normal: {
        heroes: { boris: { speed: 2.25 }, alexey: { speed: 2.6 }, anna: { speed: 3.15 } },
        enemies: { dogRegime: { speed: 1.35 } },
        walkFrameMs: 220,
        enemyWalkFrameMs: 260
      },
      fast: {
        heroes: { boris: { speed: 2.55 }, alexey: { speed: 2.95 }, anna: { speed: 3.55 } },
        enemies: { dogRegime: { speed: 1.65 } },
        walkFrameMs: 180,
        enemyWalkFrameMs: 220
      }
    };

    this.deepMerge(GAME_CONFIG, presets[name]);
    this.applyToCurrentScene(game);
    this.setStatus('Preset applied: ' + name.toUpperCase());
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
      else {
        enemy.speed = GAME_CONFIG.enemies.dogRegime.speed;
        enemy.damage = GAME_CONFIG.enemies.dogRegime.damage;
        enemy.maxHp = GAME_CONFIG.enemies.dogRegime.hp;
        enemy.hp = Math.min(enemy.hp, enemy.maxHp);
      }
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
    ctx.fillStyle = 'rgba(0,0,0,0.88)';
    ctx.fillRect(panel.x, panel.y, panel.w, panel.h);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.strokeRect(panel.x, panel.y, panel.w, panel.h);

    ctx.fillStyle = '#fff';
    ctx.font = 'bold 24px Arial';
    ctx.fillText('DEVELOPER TUNING PANEL', panel.x + 22, panel.y + 40);
    ctx.font = '13px Arial';
    ctx.fillStyle = '#aaa';
    ctx.fillText('Toggle: ` / Ё   Level waves saved in localStorage, exported to console + clipboard', panel.x + 22, panel.y + 60);

    this.drawButton(ctx, panel.x + panel.w - 80, panel.y + 14, 58, 34, 'X');

    const startY = panel.y + 72;
    for (let i = 0; i < this.fields.length; i++) this.drawField(ctx, this.fields[i], panel.x + 22, startY + i * 29);

    this.drawWaveEditor(ctx);

    this.drawButton(ctx, panel.x + 24, panel.y + panel.h - 104, 110, 30, 'SLOW');
    this.drawButton(ctx, panel.x + 146, panel.y + panel.h - 104, 120, 30, 'NORMAL');
    this.drawButton(ctx, panel.x + 278, panel.y + panel.h - 104, 110, 30, 'FAST');

    this.drawButton(ctx, panel.x + 24, panel.y + panel.h - 58, 94, 36, 'SAVE');
    this.drawButton(ctx, panel.x + 130, panel.y + panel.h - 58, 96, 36, 'RESET');
    this.drawButton(ctx, panel.x + 238, panel.y + panel.h - 58, 126, 36, 'APPLY');
    this.drawButton(ctx, panel.x + 376, panel.y + panel.h - 58, 112, 36, 'EXPORT');
    this.drawButton(ctx, panel.x + 500, panel.y + panel.h - 58, 112, 36, 'RESTART');

    this.drawStatus(ctx, panel);
  },

  drawWaveEditor(ctx) {
    const r = this.waveEditorRects();
    const level = this.getSelectedLevel();
    const wave = this.getSelectedWave();
    const enemy = this.getSelectedEnemyGroup(wave);
    const levelKey = this.getSelectedLevelKey();
    const waves = level.waves || [];

    ctx.fillStyle = 'rgba(255,255,255,0.06)';
    ctx.fillRect(r.box.x, r.box.y, r.box.w, r.box.h);
    ctx.strokeStyle = 'rgba(255,255,255,0.35)';
    ctx.strokeRect(r.box.x, r.box.y, r.box.w, r.box.h);

    ctx.fillStyle = '#fff';
    ctx.font = 'bold 18px Arial';
    ctx.fillText('LEVEL WAVE EDITOR', r.box.x + 18, r.box.y + 30);

    ctx.font = '14px Arial';
    ctx.fillStyle = '#ccc';
    ctx.fillText('Level:', r.box.x + 18, r.box.y + 64);
    this.drawButton(ctx, r.levelPrev.x, r.levelPrev.y, r.levelPrev.w, r.levelPrev.h, '<');
    this.drawButton(ctx, r.levelNext.x, r.levelNext.y, r.levelNext.w, r.levelNext.h, '>');
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 14px Arial';
    ctx.fillText(levelKey + ' / ' + level.name, r.box.x + 96, r.box.y + 64);

    ctx.font = '14px Arial';
    ctx.fillStyle = '#ccc';
    ctx.fillText('Wave:', r.box.x + 18, r.box.y + 104);
    this.drawButton(ctx, r.wavePrev.x, r.wavePrev.y, r.wavePrev.w, r.wavePrev.h, '<');
    this.drawButton(ctx, r.waveNext.x, r.waveNext.y, r.waveNext.w, r.waveNext.h, '>');
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 14px Arial';
    ctx.fillText(String(this.selectedWaveIndex + 1) + ' / ' + waves.length, r.box.x + 96, r.box.y + 104);

    ctx.font = '14px Arial';
    ctx.fillStyle = '#ccc';
    ctx.fillText('Enemy type:', r.box.x + 18, r.box.y + 144);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 14px Arial';
    ctx.fillText(enemy.type, r.box.x + 130, r.box.y + 144);

    ctx.font = '14px Arial';
    ctx.fillStyle = '#ccc';
    ctx.fillText('Count:', r.box.x + 18, r.box.y + 184);
    this.drawButton(ctx, r.countMinus.x, r.countMinus.y, r.countMinus.w, r.countMinus.h, '-');
    this.drawButton(ctx, r.countPlus.x, r.countPlus.y, r.countPlus.w, r.countPlus.h, '+');
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 14px Arial';
    ctx.fillText(String(enemy.count), r.box.x + 130, r.box.y + 184);

    ctx.font = '14px Arial';
    ctx.fillStyle = '#ccc';
    ctx.fillText('Side:', r.box.x + 18, r.box.y + 224);
    this.drawButton(ctx, r.sideBtn.x, r.sideBtn.y, r.sideBtn.w, r.sideBtn.h, String(enemy.side).toUpperCase());

    ctx.font = '14px Arial';
    ctx.fillStyle = '#ccc';
    ctx.fillText('Trigger:', r.box.x + 18, r.box.y + 264);
    this.drawButton(ctx, r.triggerBtn.x, r.triggerBtn.y, r.triggerBtn.w, r.triggerBtn.h, wave.trigger);

    this.drawButton(ctx, r.addWave.x, r.addWave.y, r.addWave.w, r.addWave.h, 'ADD WAVE');
    this.drawButton(ctx, r.removeWave.x, r.removeWave.y, r.removeWave.w, r.removeWave.h, 'REMOVE');
    this.drawButton(ctx, r.copyWave.x, r.copyWave.y, r.copyWave.w, r.copyWave.h, 'COPY');
  },

  drawField(ctx, field, x, y) {
    const value = this.getValue(field.path);
    const ratio = (value - field.min) / (field.max - field.min);
    ctx.font = '14px Arial';
    ctx.fillStyle = '#fff';
    ctx.fillText(field.label, x, y);
    ctx.fillStyle = '#ccc';
    ctx.fillText(String(value), x + 210, y);

    this.drawButton(ctx, x + 278, y - 18, 30, 23, '-');
    ctx.fillStyle = '#222';
    ctx.fillRect(x + 315, y - 12, 208, 10);
    ctx.fillStyle = '#55ccff';
    ctx.fillRect(x + 315, y - 12, 208 * Math.max(0, Math.min(1, ratio)), 10);
    ctx.strokeStyle = '#777';
    ctx.strokeRect(x + 315, y - 12, 208, 10);
    this.drawButton(ctx, x + 530, y - 18, 30, 23, '+');
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

  drawStatus(ctx, panel) {
    ctx.font = '13px Arial';
    ctx.fillStyle = performance.now() < this.statusUntil ? '#8cff8c' : '#aaa';
    ctx.fillText('Status: ' + this.statusText, panel.x + 630, panel.y + panel.h - 36);
  },

  panelRect() {
    return { x: 24, y: 24, w: 1050, h: 670 };
  },

  waveEditorRects() {
    const panel = this.panelRect();
    const x = panel.x + 650;
    const y = panel.y + 86;
    return {
      box: { x, y, w: 370, h: 380 },
      levelPrev: { x: x + 72, y: y + 44, w: 32, h: 24 },
      levelNext: { x: x + 318, y: y + 44, w: 32, h: 24 },
      wavePrev: { x: x + 72, y: y + 84, w: 32, h: 24 },
      waveNext: { x: x + 160, y: y + 84, w: 32, h: 24 },
      countMinus: { x: x + 100, y: y + 164, w: 32, h: 24 },
      countPlus: { x: x + 160, y: y + 164, w: 32, h: 24 },
      sideBtn: { x: x + 100, y: y + 204, w: 120, h: 28 },
      triggerBtn: { x: x + 100, y: y + 244, w: 190, h: 28 },
      addWave: { x: x + 18, y: y + 314, w: 105, h: 34 },
      removeWave: { x: x + 135, y: y + 314, w: 95, h: 34 },
      copyWave: { x: x + 242, y: y + 314, w: 80, h: 34 }
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
    if (!wave.enemies || wave.enemies.length === 0) wave.enemies = [{ type: 'dogRegime', count: 1, side: 'right' }];
    return wave.enemies[0];
  },

  syncSelectedLevelWithScene(game) {
    if (!game.scene || typeof game.scene.getLevelKey !== 'function') return;
    const keys = this.getLevelKeys();
    const index = keys.indexOf(game.scene.getLevelKey());
    if (index >= 0) this.selectedLevelIndex = index;
    this.selectedWaveIndex = Math.max(0, game.scene.currentWaveIndex || 0);
  },

  createDefaultWave(trigger = 'afterWaveCleared') {
    return { trigger, enemies: [{ type: 'dogRegime', count: 1, side: 'right' }] };
  },

  addWave(game) {
    const level = this.getSelectedLevel();
    level.waves.push(this.createDefaultWave('afterWaveCleared'));
    this.selectedWaveIndex = level.waves.length - 1;
    this.restartScene(game);
    this.setStatus('Wave added');
  },

  removeWave(game) {
    const level = this.getSelectedLevel();
    if (level.waves.length <= 1) {
      this.setStatus('Cannot remove last wave');
      return;
    }
    level.waves.splice(this.selectedWaveIndex, 1);
    this.selectedWaveIndex = Math.max(0, this.selectedWaveIndex - 1);
    this.restartScene(game);
    this.setStatus('Wave removed');
  },

  copyWave(game) {
    const level = this.getSelectedLevel();
    const copy = JSON.parse(JSON.stringify(this.getSelectedWave()));
    level.waves.splice(this.selectedWaveIndex + 1, 0, copy);
    this.selectedWaveIndex += 1;
    this.restartScene(game);
    this.setStatus('Wave copied');
  },

  ensureLevels() {
    if (!GAME_CONFIG.levelOrder) GAME_CONFIG.levelOrder = ['street01', 'street02', 'street03'];
    if (!GAME_CONFIG.levels) GAME_CONFIG.levels = {};
    for (const key of GAME_CONFIG.levelOrder) {
      if (!GAME_CONFIG.levels[key]) GAME_CONFIG.levels[key] = { name: key, waves: [this.createDefaultWave('onEnter')] };
      if (!GAME_CONFIG.levels[key].waves || GAME_CONFIG.levels[key].waves.length === 0) {
        GAME_CONFIG.levels[key].waves = [this.createDefaultWave('onEnter')];
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
      this.ensureLevels();
      this.setStatus('Loaded saved tuning');
    } catch (error) {
      console.warn('Failed to load tuning', error);
      this.setStatus('Failed to load saved tuning');
    }
  },

  reset(game) {
    this.deepMerge(GAME_CONFIG, JSON.parse(JSON.stringify(DEFAULT_GAME_CONFIG)));
    localStorage.removeItem('streetsOfRussia.tuning');
    this.ensureLevels();
    this.selectedLevelIndex = 0;
    this.selectedWaveIndex = 0;
    this.restartScene(game);
    this.applyToCurrentScene(game);
    this.setStatus('Reset to default config');
  },

  exportConfig() {
    const exportData = {
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

    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text)
        .then(() => this.setStatus('Export copied to clipboard'))
        .catch(() => this.setStatus('Export printed in Console'));
    } else {
      this.setStatus('Export printed in Console');
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