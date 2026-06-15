(function () {
  if (typeof DevPanel === 'undefined' || typeof GAME_CONFIG === 'undefined') return;

  const panel = DevPanel;

  function addTab(name) {
    if (!panel.tabs.includes(name)) panel.tabs.push(name);
  }

  function ensureGroup(name) {
    if (!panel.fieldGroups[name]) panel.fieldGroups[name] = [];
    return panel.fieldGroups[name];
  }

  function addField(groupName, field) {
    const group = ensureGroup(groupName);
    if (!group.some(item => item.path === field.path)) group.push(field);
  }

  function safeGet(path, fallback) {
    try {
      const value = path.split('.').reduce((obj, key) => obj && obj[key], GAME_CONFIG);
      return value == null ? fallback : value;
    } catch (error) {
      return fallback;
    }
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  GAME_CONFIG.adminTuningEnabled = true;
  if (GAME_CONFIG.playerHurtFreezeMs == null) GAME_CONFIG.playerHurtFreezeMs = 280;

  addField('PLAYER', { label: 'Hurt freeze ms', path: 'playerHurtFreezeMs', min: 80, max: 700, step: 10 });

  addTab('ZETNIK');
  addField('ZETNIK', { label: 'Zetnik speed', path: 'enemies.zetnik.speed', min: 0.3, max: 4, step: 0.05 });
  addField('ZETNIK', { label: 'Zetnik HP', path: 'enemies.zetnik.hp', min: 10, max: 400, step: 5 });
  addField('ZETNIK', { label: 'Zetnik damage', path: 'enemies.zetnik.damage', min: 1, max: 80, step: 1 });
  addField('ZETNIK', { label: 'Zetnik scale', path: 'enemies.zetnik.scale', min: 0.05, max: 0.25, step: 0.005 });
  addField('ZETNIK', { label: 'Min dist X', path: 'enemies.zetnik.minDistanceX', min: 20, max: 160, step: 2 });
  addField('ZETNIK', { label: 'Preferred dist X', path: 'enemies.zetnik.preferredDistanceX', min: 40, max: 240, step: 2 });
  addField('ZETNIK', { label: 'Attack range X', path: 'enemies.zetnik.attackRangeX', min: 30, max: 200, step: 2 });
  addField('ZETNIK', { label: 'Attack range Y', path: 'enemies.zetnik.attackRangeY', min: 14, max: 100, step: 2 });
  addField('ZETNIK', { label: 'Max attackers', path: 'enemies.zetnik.maxAttackers', min: 1, max: 5, step: 1 });
  addField('ZETNIK', { label: 'Decision min ms', path: 'enemies.zetnik.decisionMinMs', min: 100, max: 1200, step: 20 });
  addField('ZETNIK', { label: 'Decision max ms', path: 'enemies.zetnik.decisionMaxMs', min: 160, max: 2000, step: 20 });
  addField('ZETNIK', { label: 'Strafe chance', path: 'enemies.zetnik.strafeChance', min: 0, max: 1, step: 0.05 });
  addField('ZETNIK', { label: 'Retreat chance', path: 'enemies.zetnik.retreatChance', min: 0, max: 1, step: 0.05 });
  addField('ZETNIK', { label: 'Attack chance', path: 'enemies.zetnik.attackChance', min: 0, max: 1, step: 0.05 });
  addField('ZETNIK', { label: 'Self remove ms', path: 'enemies.zetnik.selfRemoveDelayMs', min: 1000, max: 30000, step: 500 });

  addTab('BASTARD');
  addField('BASTARD', { label: 'Bastard HP', path: 'enemies.bastard.hp', min: 10, max: 9999, step: 10 });
  addField('BASTARD', { label: 'Bastard speed', path: 'enemies.bastard.speed', min: 0, max: 3, step: 0.05 });
  addField('BASTARD', { label: 'Bastard scale', path: 'enemies.bastard.scale', min: 0.05, max: 0.25, step: 0.005 });
  addField('BASTARD', { label: 'Wander min ms', path: 'enemies.bastard.wanderMinMs', min: 100, max: 4000, step: 50 });
  addField('BASTARD', { label: 'Wander max ms', path: 'enemies.bastard.wanderMaxMs', min: 100, max: 5000, step: 50 });
  addField('BASTARD', { label: 'Idle min ms', path: 'enemies.bastard.idleMinMs', min: 100, max: 4000, step: 50 });
  addField('BASTARD', { label: 'Idle max ms', path: 'enemies.bastard.idleMaxMs', min: 100, max: 5000, step: 50 });
  addField('BASTARD', { label: 'Fallen min ms', path: 'enemies.bastard.fallenMinMs', min: 100, max: 5000, step: 50 });
  addField('BASTARD', { label: 'Fallen max ms', path: 'enemies.bastard.fallenMaxMs', min: 100, max: 6000, step: 50 });
  addField('BASTARD', { label: 'Idle chance', path: 'enemies.bastard.idleChance', min: 0, max: 1, step: 0.05 });
  addField('BASTARD', { label: 'Fall chance', path: 'enemies.bastard.fallChance', min: 0, max: 1, step: 0.01 });
  addField('BASTARD', { label: 'Turn chance', path: 'enemies.bastard.turnChance', min: 0, max: 1, step: 0.05 });
  addField('BASTARD', { label: 'Knockback X', path: 'enemies.bastard.knockbackX', min: 0, max: 180, step: 4 });

  addTab('LEVEL AREA');
  for (const key of GAME_CONFIG.levelOrder || Object.keys(GAME_CONFIG.levels || {})) {
    const level = GAME_CONFIG.levels[key];
    if (!level) continue;
    if (!level.walkZone) level.walkZone = { left: 0, right: GAME_CONFIG.width, top: GAME_CONFIG.laneTop, bottom: GAME_CONFIG.laneBottom };
    if (!level.playerStart) level.playerStart = { x: 190, y: 620 };
    if (!level.enemySpawnMargin) level.enemySpawnMargin = { x: 40, y: 28 };
  }

  function selectedLevelPath(suffix) {
    const key = panel.getSelectedLevelKey ? panel.getSelectedLevelKey() : (GAME_CONFIG.levelOrder && GAME_CONFIG.levelOrder[0]) || 'street01';
    return 'levels.' + key + '.' + suffix;
  }

  panel.panelRect = function () {
    return { x: 24, y: 18, w: 1232, h: 684 };
  };

  panel.tabRect = function (index) {
    const base = this.panelRect();
    const gap = 8;
    const w = Math.floor((base.w - 48 - gap * (this.tabs.length - 1)) / this.tabs.length);
    return { x: base.x + 24 + index * (w + gap), y: base.y + 76, w, h: 34 };
  };

  panel.openFromPauseMenu = function (game) {
    GAME_CONFIG.adminTuningEnabled = true;
    this.open = true;
    this.tab = 'LEVEL WAVES';
    if (typeof this.ensureLevels === 'function') this.ensureLevels();
    if (typeof this.syncSelectedLevelWithScene === 'function') this.syncSelectedLevelWithScene(game);
    this.setStatus('Developer panel opened');
  };

  const oldUpdate = panel.update;
  panel.update = function (game) {
    if (this.open) GAME_CONFIG.adminTuningEnabled = true;
    oldUpdate.call(this, game);
  };

  const oldDraw = panel.draw;
  panel.draw = function (ctx) {
    if (this.open) GAME_CONFIG.adminTuningEnabled = true;
    if (!this.tabs.includes(this.tab)) this.tab = 'LEVEL WAVES';
    oldDraw.call(this, ctx);
  };

  panel.getFieldsForCurrentTab = function () {
    if (this.tab !== 'LEVEL AREA') return this.fieldGroups[this.tab] || [];
    return [
      { label: 'Level left edge', path: selectedLevelPath('walkZone.left'), min: 0, max: GAME_CONFIG.width - 100, step: 10 },
      { label: 'Level right edge', path: selectedLevelPath('walkZone.right'), min: 100, max: GAME_CONFIG.width, step: 10 },
      { label: 'Walk top Y', path: selectedLevelPath('walkZone.top'), min: 360, max: GAME_CONFIG.height + 180, step: 5 },
      { label: 'Walk bottom Y', path: selectedLevelPath('walkZone.bottom'), min: 420, max: GAME_CONFIG.height + 220, step: 5 },
      { label: 'Player start X', path: selectedLevelPath('playerStart.x'), min: 0, max: GAME_CONFIG.width, step: 10 },
      { label: 'Player start Y', path: selectedLevelPath('playerStart.y'), min: 360, max: GAME_CONFIG.height + 220, step: 5 },
      { label: 'Enemy spawn margin X', path: selectedLevelPath('enemySpawnMargin.x'), min: 0, max: 260, step: 5 },
      { label: 'Enemy spawn margin Y', path: selectedLevelPath('enemySpawnMargin.y'), min: 0, max: 160, step: 5 }
    ];
  };

  panel.drawFields = function (ctx) {
    const fields = this.getFieldsForCurrentTab();
    const base = this.panelRect();
    const startY = base.y + 132;
    const rowH = 34;
    const colW = 565;
    const perCol = 14;

    if (this.tab === 'LEVEL AREA') {
      ctx.fillStyle = '#8cff8c';
      ctx.font = 'bold 15px Arial';
      ctx.fillText('Editing level: ' + this.getSelectedLevelKey(), base.x + 36, base.y + 118);
    }

    for (let i = 0; i < fields.length; i++) {
      const col = Math.floor(i / perCol);
      const row = i % perCol;
      this.drawField(ctx, fields[i], base.x + 36 + col * colW, startY + row * rowH);
    }
  };

  panel.drawField = function (ctx, field, x, y) {
    const value = Number(safeGet(field.path, field.min));
    const ratio = clamp((value - field.min) / Math.max(1, field.max - field.min), 0, 1);

    ctx.font = '14px Arial';
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'left';
    ctx.fillText(field.label, x, y);
    ctx.fillStyle = '#d7d7d7';
    ctx.fillText(String(value), x + 205, y);

    this.drawButton(ctx, x + 290, y - 20, 34, 25, '-');
    ctx.fillStyle = '#222';
    ctx.fillRect(x + 335, y - 13, 185, 11);
    ctx.fillStyle = '#55ccff';
    ctx.fillRect(x + 335, y - 13, 185 * ratio, 11);
    ctx.strokeStyle = '#777';
    ctx.strokeRect(x + 335, y - 13, 185, 11);
    this.drawButton(ctx, x + 530, y - 20, 34, 25, '+');
  };

  panel.handleFieldsClick = function (point, game) {
    const fields = this.getFieldsForCurrentTab();
    const base = this.panelRect();
    const startY = base.y + 132;
    const rowH = 34;
    const colW = 565;
    const perCol = 14;

    for (let i = 0; i < fields.length; i++) {
      const col = Math.floor(i / perCol);
      const row = i % perCol;
      const x = base.x + 36 + col * colW;
      const y = startY + row * rowH;
      const field = fields[i];
      const minus = { x: x + 290, y: y - 20, w: 34, h: 25 };
      const plus = { x: x + 530, y: y - 20, w: 34, h: 25 };
      const bar = { x: x + 335, y: y - 13, w: 185, h: 11 };

      if (this.inRect(point, minus)) { this.change(field, -field.step, game); return; }
      if (this.inRect(point, plus)) { this.change(field, field.step, game); return; }
      if (this.inRect(point, bar)) {
        const ratio = clamp((point.x - bar.x) / bar.w, 0, 1);
        const raw = field.min + ratio * (field.max - field.min);
        this.setValue(field.path, this.roundToStep(raw, field.step));
        this.applyToCurrentScene(game);
        this.setStatus('Changed ' + field.label);
        return;
      }
    }
  };

  const oldHandleClick = panel.handleClick;
  panel.handleClick = function (point, game) {
    if (this.tab === 'LEVEL AREA') {
      const tab = this.getClickedTab(point);
      if (tab) { this.tab = tab; this.setStatus('Tab: ' + tab); return; }
      if (this.handleFooterClick(point, game)) return;
      this.handleFieldsClick(point, game);
      return;
    }
    oldHandleClick.call(this, point, game);
  };
})();