const DevPanel = {
  open: false,
  fields: [],

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
    this.load();
  },

  update(game) {
    if (!GAME_CONFIG.adminTuningEnabled) return;

    if (Input.consume('dev') || Input.consume('`') || Input.consume('ё')) {
      this.open = !this.open;
    }

    const click = Input.consumePointer();
    if (click && !this.open && click.x < 78 && click.y < 42) {
      this.open = true;
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

    const save = { x: panel.x + 24, y: panel.y + panel.h - 58, w: 110, h: 36 };
    const reset = { x: panel.x + 150, y: panel.y + panel.h - 58, w: 120, h: 36 };
    const close = { x: panel.x + panel.w - 80, y: panel.y + 14, w: 58, h: 34 };
    const apply = { x: panel.x + 288, y: panel.y + panel.h - 58, w: 160, h: 36 };

    if (this.inRect(point, close)) { this.open = false; return; }
    if (this.inRect(point, save)) { this.save(); return; }
    if (this.inRect(point, reset)) { this.reset(game); return; }
    if (this.inRect(point, apply)) { this.applyToCurrentScene(game); return; }

    const startY = panel.y + 72;
    for (let i = 0; i < this.fields.length; i++) {
      const y = startY + i * 29;
      const minus = { x: panel.x + 300, y: y - 18, w: 30, h: 23 };
      const plus = { x: panel.x + 552, y: y - 18, w: 30, h: 23 };
      const bar = { x: panel.x + 337, y: y - 12, w: 208, h: 10 };
      const field = this.fields[i];
      if (this.inRect(point, minus)) this.change(field, -field.step, game);
      if (this.inRect(point, plus)) this.change(field, field.step, game);
      if (this.inRect(point, bar)) {
        const ratio = Math.max(0, Math.min(1, (point.x - bar.x) / bar.w));
        const raw = field.min + ratio * (field.max - field.min);
        this.setValue(field.path, this.roundToStep(raw, field.step));
        this.applyToCurrentScene(game);
      }
    }
  },

  change(field, delta, game) {
    const current = this.getValue(field.path);
    const next = Math.max(field.min, Math.min(field.max, this.roundToStep(current + delta, field.step)));
    this.setValue(field.path, next);
    this.applyToCurrentScene(game);
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
      enemy.speed = GAME_CONFIG.enemies.dogRegime.speed;
      enemy.damage = GAME_CONFIG.enemies.dogRegime.damage;
      enemy.maxHp = GAME_CONFIG.enemies.dogRegime.hp;
      enemy.hp = Math.min(enemy.hp, enemy.maxHp);
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
    ctx.fillStyle = 'rgba(0,0,0,0.86)';
    ctx.fillRect(panel.x, panel.y, panel.w, panel.h);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.strokeRect(panel.x, panel.y, panel.w, panel.h);

    ctx.fillStyle = '#fff';
    ctx.font = 'bold 24px Arial';
    ctx.fillText('DEVELOPER TUNING PANEL', panel.x + 22, panel.y + 40);
    ctx.font = '13px Arial';
    ctx.fillStyle = '#aaa';
    ctx.fillText('Toggle: ` / Ё   Save: localStorage   Apply: current scene', panel.x + 22, panel.y + 60);

    this.drawButton(ctx, panel.x + panel.w - 80, panel.y + 14, 58, 34, 'X');

    const startY = panel.y + 72;
    for (let i = 0; i < this.fields.length; i++) {
      this.drawField(ctx, this.fields[i], panel.x + 22, startY + i * 29);
    }

    this.drawButton(ctx, panel.x + 24, panel.y + panel.h - 58, 110, 36, 'SAVE');
    this.drawButton(ctx, panel.x + 150, panel.y + panel.h - 58, 120, 36, 'RESET');
    this.drawButton(ctx, panel.x + 288, panel.y + panel.h - 58, 160, 36, 'APPLY NOW');
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

  panelRect() {
    return { x: 30, y: 30, w: 640, h: 620 };
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

  roundToStep(value, step) {
    const precision = String(step).includes('.') ? String(step).split('.')[1].length : 0;
    return Number((Math.round(value / step) * step).toFixed(precision));
  },

  save() {
    localStorage.setItem('streetsOfRussia.tuning', JSON.stringify(GAME_CONFIG));
  },

  load() {
    const saved = localStorage.getItem('streetsOfRussia.tuning');
    if (!saved) return;
    try {
      const data = JSON.parse(saved);
      this.deepMerge(GAME_CONFIG, data);
    } catch (error) {
      console.warn('Failed to load tuning', error);
    }
  },

  reset(game) {
    this.deepMerge(GAME_CONFIG, JSON.parse(JSON.stringify(DEFAULT_GAME_CONFIG)));
    localStorage.removeItem('streetsOfRussia.tuning');
    this.applyToCurrentScene(game);
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