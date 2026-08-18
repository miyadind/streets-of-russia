/*
 * Configurable walk-zone patch for Streets of Russia.
 * Adds per-level movement bounds that can be tuned from the Developer Panel.
 */
(function () {
  if (typeof GAME_CONFIG === 'undefined') return;

  const EXTRA_BOTTOM_TUNING = 220;

  const DEFAULT_ZONE = {
    left: 70,
    right: 1210,
    top: 515,
    bottom: 675
  };

  const DEFAULT_PLAYER_START = {
    x: 190,
    y: 620
  };

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function num(value, fallback) {
    const n = Number(value);
    return Number.isFinite(n) ? n : fallback;
  }

  function bottomTuningMax() {
    return GAME_CONFIG.height + EXTRA_BOTTOM_TUNING;
  }

  function levelKeys() {
    return GAME_CONFIG.levelOrder || Object.keys(GAME_CONFIG.levels || {});
  }

  function ensureLevelArea(level) {
    if (!level) return;
    if (!level.walkZone) level.walkZone = {};
    level.walkZone.left = num(level.walkZone.left, DEFAULT_ZONE.left);
    level.walkZone.right = num(level.walkZone.right, DEFAULT_ZONE.right);
    level.walkZone.top = num(level.walkZone.top, GAME_CONFIG.laneTop || DEFAULT_ZONE.top);
    level.walkZone.bottom = num(level.walkZone.bottom, GAME_CONFIG.laneBottom || DEFAULT_ZONE.bottom);

    if (!level.playerStart) level.playerStart = {};
    level.playerStart.x = num(level.playerStart.x, DEFAULT_PLAYER_START.x);
    level.playerStart.y = num(level.playerStart.y, clamp(DEFAULT_PLAYER_START.y, level.walkZone.top, level.walkZone.bottom));

    if (!level.enemySpawnMargin) level.enemySpawnMargin = {};
    level.enemySpawnMargin.x = num(level.enemySpawnMargin.x, 40);
    level.enemySpawnMargin.y = num(level.enemySpawnMargin.y, 28);
  }

  function ensureAllLevelAreas() {
    if (!GAME_CONFIG.levels) GAME_CONFIG.levels = {};
    for (const key of levelKeys()) ensureLevelArea(GAME_CONFIG.levels[key]);
  }

  function getLevel(scene) {
    if (scene && typeof scene.getLevelConfig === 'function') return scene.getLevelConfig();
    const key = levelKeys()[0];
    return (GAME_CONFIG.levels && GAME_CONFIG.levels[key]) || null;
  }

  function getWalkZone(scene) {
    const level = getLevel(scene);
    ensureLevelArea(level);
    const raw = (level && level.walkZone) || DEFAULT_ZONE;
    const left = clamp(num(raw.left, DEFAULT_ZONE.left), 0, GAME_CONFIG.width - 1);
    const right = clamp(num(raw.right, DEFAULT_ZONE.right), left + 1, GAME_CONFIG.width);
    const top = clamp(num(raw.top, DEFAULT_ZONE.top), 0, bottomTuningMax() - 1);
    const bottom = clamp(num(raw.bottom, DEFAULT_ZONE.bottom), top + 1, bottomTuningMax());
    return { left, right, top, bottom };
  }

  function syncLegacyLane(scene) {
    const zone = getWalkZone(scene);
    GAME_CONFIG.laneTop = zone.top;
    GAME_CONFIG.laneBottom = zone.bottom;
    return zone;
  }

  function getLevelAreaVisuals(level) {
    ensureLevelArea(level);
    const zone = level.walkZone;
    const spawnX = clamp(num(level.enemySpawnMargin.x, 40), 0, 240);
    const spawnY = clamp(num(level.enemySpawnMargin.y, 28), 0, 120);
    const playerStart = {
      x: clamp(num(level.playerStart.x, DEFAULT_PLAYER_START.x), zone.left, zone.right),
      y: clamp(num(level.playerStart.y, DEFAULT_PLAYER_START.y), zone.top, zone.bottom)
    };
    return {
      zone,
      playerStart,
      spawn: {
        leftX: zone.left + spawnX,
        rightX: zone.right - spawnX,
        topY: Math.min(zone.bottom, zone.top + spawnY),
        bottomY: Math.max(zone.top, zone.bottom - spawnY)
      }
    };
  }

  function drawMarkerLabel(ctx, text, x, y, fill) {
    ctx.save();
    ctx.font = 'bold 13px Arial';
    ctx.textAlign = 'center';
    ctx.lineWidth = 4;
    ctx.strokeStyle = 'rgba(0,0,0,0.78)';
    ctx.fillStyle = fill;
    ctx.strokeText(text, x, y);
    ctx.fillText(text, x, y);
    ctx.restore();
  }

  function drawLevelAreaOverlay(ctx, level, activeKey) {
    const visual = getLevelAreaVisuals(level);
    const z = visual.zone;
    const p = visual.playerStart;
    const s = visual.spawn;
    const walkColor = activeKey && ['left', 'right', 'top', 'bottom'].includes(activeKey) ? '#d6d6d6' : '#8f8f8f';
    const playerColor = activeKey && ['playerX', 'playerY'].includes(activeKey) ? '#72b7ff' : '#4aa3ff';
    const spawnColor = activeKey && ['spawnX', 'spawnY'].includes(activeKey) ? '#ffcf5a' : '#ffa33b';

    ctx.save();
    ctx.fillStyle = 'rgba(155, 155, 155, 0.13)';
    ctx.fillRect(z.left, z.top, z.right - z.left, z.bottom - z.top);
    ctx.strokeStyle = walkColor;
    ctx.lineWidth = 4;
    ctx.setLineDash([12, 7]);
    ctx.strokeRect(z.left, z.top, z.right - z.left, z.bottom - z.top);
    ctx.setLineDash([]);
    drawMarkerLabel(ctx, 'WALK AREA', (z.left + z.right) / 2, z.top - 10, walkColor);

    ctx.strokeStyle = spawnColor;
    ctx.fillStyle = 'rgba(255, 165, 45, 0.16)';
    ctx.lineWidth = 3;
    ctx.fillRect(s.leftX - 8, s.topY, 16, s.bottomY - s.topY);
    ctx.fillRect(s.rightX - 8, s.topY, 16, s.bottomY - s.topY);
    ctx.beginPath();
    ctx.moveTo(s.leftX, s.topY);
    ctx.lineTo(s.leftX, s.bottomY);
    ctx.moveTo(s.rightX, s.topY);
    ctx.lineTo(s.rightX, s.bottomY);
    ctx.stroke();
    drawMarkerLabel(ctx, 'ENEMY SPAWN', s.rightX, s.topY - 10, spawnColor);

    ctx.fillStyle = playerColor;
    ctx.strokeStyle = 'rgba(0,0,0,0.85)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 12, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(p.x - 22, p.y);
    ctx.lineTo(p.x + 22, p.y);
    ctx.moveTo(p.x, p.y - 22);
    ctx.lineTo(p.x, p.y + 22);
    ctx.strokeStyle = playerColor;
    ctx.lineWidth = 2;
    ctx.stroke();
    drawMarkerLabel(ctx, 'PLAYER START', p.x, p.y - 24, playerColor);
    ctx.restore();
  }

  function buildLevelAreaExport() {
    ensureAllLevelAreas();
    const levels = {};
    for (const key of levelKeys()) {
      const level = GAME_CONFIG.levels[key];
      ensureLevelArea(level);
      levels[key] = {
        walkZone: {
          left: level.walkZone.left,
          right: level.walkZone.right,
          top: level.walkZone.top,
          bottom: level.walkZone.bottom
        },
        playerStart: {
          x: level.playerStart.x,
          y: level.playerStart.y
        },
        enemySpawnMargin: {
          x: level.enemySpawnMargin.x,
          y: level.enemySpawnMargin.y
        }
      };
    }
    return {
      buildVersion: GAME_CONFIG.buildVersion,
      exportedAt: new Date().toISOString(),
      levels
    };
  }

  function exportLevelAreas() {
    const data = buildLevelAreaExport();
    const text = JSON.stringify(data, null, 2);
    localStorage.setItem('streetsOfRussia.levelAreas.export', text);
    console.log('STREETS_OF_RUSSIA_LEVEL_AREAS_EXPORT');
    console.log(text);
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).catch(() => {});
    }
    return data;
  }

  ensureAllLevelAreas();

  if (typeof Player !== 'undefined') {
    const oldPlayerUpdate = Player.prototype.update;
    Player.prototype.update = function (dt, scene) {
      oldPlayerUpdate.call(this, dt, scene);
      if (scene && typeof scene.clampActorPosition === 'function') scene.clampActorPosition(this, 70);
    };
  }

  if (typeof DogRegimeEnemy !== 'undefined') {
    const oldDogUpdate = DogRegimeEnemy.prototype.update;
    DogRegimeEnemy.prototype.update = function (dt, scene) {
      this.__scene = scene;
      oldDogUpdate.call(this, dt, scene);
      const offscreen = this.alive ? (GAME_CONFIG.enemyOffscreenMargin || 180) : 0;
      if (scene && typeof scene.clampActorPosition === 'function') scene.clampActorPosition(this, 45, offscreen);
    };

    DogRegimeEnemy.prototype.clampToScreen = function () {
      const scene = this.__scene;
      const offscreen = this.alive ? (GAME_CONFIG.enemyOffscreenMargin || 180) : 0;
      if (scene && typeof scene.clampActorPosition === 'function') {
        scene.clampActorPosition(this, 45, offscreen);
        return;
      }
      this.x = clamp(this.x, 45 - offscreen, GAME_CONFIG.width - 45 + offscreen);
      this.y = clamp(this.y, GAME_CONFIG.laneTop, GAME_CONFIG.laneBottom);
    };
  }

  if (typeof SuckerEnemy !== 'undefined') {
    const oldSuckerUpdate = SuckerEnemy.prototype.update;
    SuckerEnemy.prototype.update = function (dt, scene) {
      this.__scene = scene;
      oldSuckerUpdate.call(this, dt, scene);
      const offscreen = this.alive ? (GAME_CONFIG.enemyOffscreenMargin || 180) : 0;
      if (scene && typeof scene.clampActorPosition === 'function') scene.clampActorPosition(this, 45, offscreen);
    };
  }

  if (typeof BastardEnemy !== 'undefined') {
    const oldBastardUpdate = BastardEnemy.prototype.update;
    BastardEnemy.prototype.update = function (dt, scene) {
      this.__scene = scene;
      oldBastardUpdate.call(this, dt, scene);
      if (this.isHealingExit && this.isHealingExit()) return;
      if (scene && typeof scene.clampActorPosition === 'function') scene.clampActorPosition(this, 45);
    };

    const oldBastardTakeHit = BastardEnemy.prototype.takeHit;
    BastardEnemy.prototype.takeHit = function (damage, direction) {
      oldBastardTakeHit.call(this, damage, direction);
      const scene = this.__scene;
      if (this.isHealingExit && this.isHealingExit()) return;
      if (scene && typeof scene.clampActorPosition === 'function') scene.clampActorPosition(this, 45);
    };
  }

  if (typeof DevPanel !== 'undefined') {
    if (!DevPanel.tabs.includes('LEVEL AREA')) DevPanel.tabs.push('LEVEL AREA');

    const oldEnsureLevels = DevPanel.ensureLevels;
    DevPanel.ensureLevels = function () {
      oldEnsureLevels.call(this);
      ensureAllLevelAreas();
    };

    const oldHandleClick = DevPanel.handleClick;
    DevPanel.handleClick = function (point, game) {
      const panel = this.panelRect();
      if (!this.inRect(point, panel)) return;

      const close = { x: panel.x + panel.w - 78, y: panel.y + 14, w: 56, h: 32 };
      if (this.inRect(point, close)) { this.open = false; return; }

      const tab = this.getClickedTab(point);
      if (tab) { this.tab = tab; this.syncSelectedLevelWithScene(game); this.setStatus('Tab: ' + tab); return; }

      if (this.handleFooterClick(point, game)) return;

      if (this.tab === 'LEVEL AREA') {
        this.handleLevelAreaClick(point, game);
        return;
      }

      oldHandleClick.call(this, point, game);
    };

    const oldDraw = DevPanel.draw;
    DevPanel.draw = function (ctx) {
      if (!GAME_CONFIG.adminTuningEnabled) return;
      if (this.open && this.tab === 'LEVEL AREA') {
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
        ctx.fillText('LEVEL AREA: grey box = walking area, blue dot = player start, orange lines = enemy spawn lanes.', panel.x + 22, panel.y + 58);

        this.drawButton(ctx, panel.x + panel.w - 78, panel.y + 14, 56, 32, 'X');
        this.drawTabs(ctx);
        this.drawLevelAreaEditor(ctx);
        this.drawFooter(ctx);
        this.drawStatus(ctx, panel);
        return;
      }
      oldDraw.call(this, ctx);
    };

    DevPanel.levelAreaRects = function () {
      const panel = this.panelRect();
      const x = panel.x + 36;
      const y = panel.y + 124;
      const rows = ['left', 'right', 'top', 'bottom', 'playerX', 'playerY', 'spawnX', 'spawnY'];
      const out = {
        box: { x, y, w: 980, h: 492 },
        preview: { x: x + 744, y: y + 86, w: 210, h: 118 },
        levelPrev: { x: x + 92, y: y + 54, w: 36, h: 26 },
        levelNext: { x: x + 690, y: y + 54, w: 36, h: 26 }
      };
      rows.forEach((name, i) => {
        const rowY = y + 112 + i * 38;
        out[name + 'Minus'] = { x: x + 250, y: rowY - 21, w: 36, h: 26 };
        out[name + 'Plus'] = { x: x + 642, y: rowY - 21, w: 36, h: 26 };
        out[name + 'Bar'] = { x: x + 300, y: rowY - 14, w: 326, h: 12 };
        out[name + 'Y'] = rowY;
      });
      return out;
    };

    DevPanel.getLevelAreaFields = function () {
      const key = this.getSelectedLevelKey();
      return [
        { key: 'left', label: 'Walk area left edge', hint: 'moves the left side of the grey walking box', path: 'levels.' + key + '.walkZone.left', min: 0, max: GAME_CONFIG.width - 100, step: 5 },
        { key: 'right', label: 'Walk area right edge', hint: 'moves the right side of the grey walking box', path: 'levels.' + key + '.walkZone.right', min: 100, max: GAME_CONFIG.width, step: 5 },
        { key: 'top', label: 'Walk area top edge', hint: 'moves the top side of the grey walking box', path: 'levels.' + key + '.walkZone.top', min: 260, max: GAME_CONFIG.height - 20, step: 5 },
        { key: 'bottom', label: 'Walk area bottom edge', hint: 'moves the bottom side of the grey walking box', path: 'levels.' + key + '.walkZone.bottom', min: 320, max: bottomTuningMax(), step: 5 },
        { key: 'playerX', label: 'Player start left/right', hint: 'moves the blue player-start dot horizontally', path: 'levels.' + key + '.playerStart.x', min: 0, max: GAME_CONFIG.width, step: 5 },
        { key: 'playerY', label: 'Player start up/down', hint: 'moves the blue player-start dot vertically', path: 'levels.' + key + '.playerStart.y', min: 260, max: bottomTuningMax(), step: 5 },
        { key: 'spawnX', label: 'Enemy spawn side inset', hint: 'moves orange spawn lines inward from left and right edges', path: 'levels.' + key + '.enemySpawnMargin.x', min: 0, max: 240, step: 5 },
        { key: 'spawnY', label: 'Enemy spawn top/bottom gap', hint: 'shrinks or expands the orange spawn segment vertically', path: 'levels.' + key + '.enemySpawnMargin.y', min: 0, max: 120, step: 2 }
      ];
    };

    DevPanel.drawLevelAreaMiniPreview = function (ctx, r, level, activeKey) {
      const p = r.preview;
      const visual = getLevelAreaVisuals(level);
      const sx = p.w / GAME_CONFIG.width;
      const sy = p.h / GAME_CONFIG.height;
      const tx = x => p.x + x * sx;
      const ty = y => p.y + y * sy;
      const z = visual.zone;
      const s = visual.spawn;
      const start = visual.playerStart;

      ctx.save();
      ctx.fillStyle = 'rgba(0,0,0,0.52)';
      ctx.fillRect(p.x, p.y, p.w, p.h);
      ctx.strokeStyle = 'rgba(255,255,255,0.35)';
      ctx.strokeRect(p.x, p.y, p.w, p.h);

      ctx.fillStyle = 'rgba(150,150,150,0.22)';
      ctx.fillRect(tx(z.left), ty(z.top), (z.right - z.left) * sx, (z.bottom - z.top) * sy);
      ctx.strokeStyle = activeKey && ['left', 'right', 'top', 'bottom'].includes(activeKey) ? '#fff' : '#aaa';
      ctx.lineWidth = 2;
      ctx.strokeRect(tx(z.left), ty(z.top), (z.right - z.left) * sx, (z.bottom - z.top) * sy);

      ctx.strokeStyle = activeKey && ['spawnX', 'spawnY'].includes(activeKey) ? '#ffcf5a' : '#ffa33b';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(tx(s.leftX), ty(s.topY));
      ctx.lineTo(tx(s.leftX), ty(s.bottomY));
      ctx.moveTo(tx(s.rightX), ty(s.topY));
      ctx.lineTo(tx(s.rightX), ty(s.bottomY));
      ctx.stroke();

      ctx.fillStyle = activeKey && ['playerX', 'playerY'].includes(activeKey) ? '#9fd0ff' : '#4aa3ff';
      ctx.beginPath();
      ctx.arc(tx(start.x), ty(start.y), 5, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ddd';
      ctx.font = '12px Arial';
      ctx.fillText('mini map', p.x, p.y - 8);
      ctx.restore();
    };

    DevPanel.drawLevelAreaEditor = function (ctx) {
      this.ensureLevels();
      const r = this.levelAreaRects();
      const levelKey = this.getSelectedLevelKey();
      const level = this.getSelectedLevel();
      ensureLevelArea(level);
      const fields = this.getLevelAreaFields();

      ctx.fillStyle = 'rgba(255,255,255,0.06)';
      ctx.fillRect(r.box.x, r.box.y, r.box.w, r.box.h);
      ctx.strokeStyle = 'rgba(255,255,255,0.35)';
      ctx.strokeRect(r.box.x, r.box.y, r.box.w, r.box.h);

      ctx.fillStyle = '#fff';
      ctx.font = 'bold 18px Arial';
      ctx.fillText('LEVEL WALK AREA', r.box.x + 20, r.box.y + 32);

      this.drawRowLabel(ctx, 'Level:', r.box.x + 24, r.box.y + 76);
      this.drawButton(ctx, r.levelPrev.x, r.levelPrev.y, r.levelPrev.w, r.levelPrev.h, '<');
      this.drawButton(ctx, r.levelNext.x, r.levelNext.y, r.levelNext.w, r.levelNext.h, '>');
      this.drawValue(ctx, levelKey + ' / ' + level.name, r.box.x + 145, r.box.y + 76);
      this.drawLevelAreaMiniPreview(ctx, r, level, this.levelAreaActiveKey);

      for (const field of fields) {
        const value = this.getValue(field.path);
        const ratio = (value - field.min) / Math.max(1, field.max - field.min);
        const y = r[field.key + 'Y'];
        const active = this.levelAreaActiveKey === field.key;
        const groupColor = ['playerX', 'playerY'].includes(field.key)
          ? '#4aa3ff'
          : ['spawnX', 'spawnY'].includes(field.key)
            ? '#ffa33b'
            : '#cfcfcf';
        ctx.font = '14px Arial';
        ctx.fillStyle = active ? groupColor : '#fff';
        ctx.fillText(field.label, r.box.x + 24, y);
        ctx.fillStyle = '#ccc';
        ctx.fillText(String(value), r.box.x + 218, y);
        this.drawButton(ctx, r[field.key + 'Minus'].x, r[field.key + 'Minus'].y, r[field.key + 'Minus'].w, r[field.key + 'Minus'].h, '-');
        ctx.fillStyle = '#222';
        ctx.fillRect(r[field.key + 'Bar'].x, r[field.key + 'Bar'].y, r[field.key + 'Bar'].w, r[field.key + 'Bar'].h);
        ctx.fillStyle = groupColor;
        ctx.fillRect(r[field.key + 'Bar'].x, r[field.key + 'Bar'].y, r[field.key + 'Bar'].w * clamp(ratio, 0, 1), r[field.key + 'Bar'].h);
        ctx.strokeStyle = active ? groupColor : '#777';
        ctx.strokeRect(r[field.key + 'Bar'].x, r[field.key + 'Bar'].y, r[field.key + 'Bar'].w, r[field.key + 'Bar'].h);
        this.drawButton(ctx, r[field.key + 'Plus'].x, r[field.key + 'Plus'].y, r[field.key + 'Plus'].w, r[field.key + 'Plus'].h, '+');
        if (active && field.hint) {
          ctx.font = '12px Arial';
          ctx.fillStyle = '#bbb';
          ctx.fillText(field.hint, r.box.x + 710, y);
        }
      }

      ctx.font = '13px Arial';
      ctx.fillStyle = '#aaa';
      ctx.fillText('Tip: click any row or +/- button. The same color marker moves on the level and mini map.', r.box.x + 24, r.box.y + 462);
    };

    DevPanel.handleLevelAreaClick = function (point, game) {
      const r = this.levelAreaRects();
      const keys = this.getLevelKeys();
      if (this.inRect(point, r.levelPrev)) { this.selectedLevelIndex = this.wrap(this.selectedLevelIndex - 1, keys.length); this.setStatus('Level: ' + this.getSelectedLevelKey()); return true; }
      if (this.inRect(point, r.levelNext)) { this.selectedLevelIndex = this.wrap(this.selectedLevelIndex + 1, keys.length); this.setStatus('Level: ' + this.getSelectedLevelKey()); return true; }

      const fields = this.getLevelAreaFields();
      for (const field of fields) {
        const minus = r[field.key + 'Minus'];
        const plus = r[field.key + 'Plus'];
        const bar = r[field.key + 'Bar'];
        const row = { x: r.box.x + 18, y: r[field.key + 'Y'] - 24, w: r.box.w - 36, h: 34 };
        if (this.inRect(point, minus)) { this.changeLevelAreaField(field, -field.step, game); return true; }
        if (this.inRect(point, plus)) { this.changeLevelAreaField(field, field.step, game); return true; }
        if (this.inRect(point, bar)) {
          const ratio = clamp((point.x - bar.x) / bar.w, 0, 1);
          const raw = field.min + ratio * (field.max - field.min);
          this.setLevelAreaValue(field, this.roundToStep(raw, field.step), game);
          return true;
        }
        if (this.inRect(point, row)) { this.levelAreaActiveKey = field.key; this.setStatus(field.hint || field.label); return true; }
      }
      return false;
    };

    DevPanel.changeLevelAreaField = function (field, delta, game) {
      const current = this.getValue(field.path);
      this.levelAreaActiveKey = field.key;
      this.setLevelAreaValue(field, current + delta, game);
    };

    DevPanel.setLevelAreaValue = function (field, value, game) {
      const level = this.getSelectedLevel();
      ensureLevelArea(level);
      this.levelAreaActiveKey = field.key;
      const next = clamp(this.roundToStep(value, field.step), field.min, field.max);
      this.setValue(field.path, next);
      this.fixSelectedLevelArea();
      if (game && game.scene && typeof game.scene.getLevelKey === 'function' && game.scene.getLevelKey() === this.getSelectedLevelKey()) {
        syncLegacyLane(game.scene);
        if (game.scene.player) game.scene.clampActorPosition(game.scene.player, 70);
        for (const enemy of game.scene.enemies || []) game.scene.clampActorPosition(enemy, 45);
      }
      this.setStatus(field.label + ': ' + this.getValue(field.path));
    };

    DevPanel.fixSelectedLevelArea = function () {
      const level = this.getSelectedLevel();
      ensureLevelArea(level);
      const z = level.walkZone;
      if (z.right <= z.left + 80) z.right = z.left + 80;
      if (z.bottom <= z.top + 40) z.bottom = z.top + 40;
      z.right = clamp(z.right, z.left + 80, GAME_CONFIG.width);
      z.bottom = clamp(z.bottom, z.top + 40, bottomTuningMax());
      level.playerStart.x = clamp(level.playerStart.x, z.left, z.right);
      level.playerStart.y = clamp(level.playerStart.y, z.top, z.bottom);
    };

    const oldExportConfig = DevPanel.exportConfig;
    DevPanel.exportConfig = function () {
      ensureAllLevelAreas();
      exportLevelAreas();
      oldExportConfig.call(this);
    };
  }

  window.WalkZoneTools = {
    ensureAllLevelAreas,
    ensureLevelArea,
    getWalkZone,
    drawLevelAreaOverlay,
    buildLevelAreaExport,
    exportLevelAreas,
    syncLegacyLane
  };
})();
