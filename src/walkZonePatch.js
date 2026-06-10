/*
 * Configurable walk-zone patch for Streets of Russia.
 * Adds per-level movement bounds that can be tuned from the Developer Panel.
 */
(function () {
  if (typeof GAME_CONFIG === 'undefined') return;

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
    const top = clamp(num(raw.top, DEFAULT_ZONE.top), 0, GAME_CONFIG.height - 1);
    const bottom = clamp(num(raw.bottom, DEFAULT_ZONE.bottom), top + 1, GAME_CONFIG.height);
    return { left, right, top, bottom };
  }

  function syncLegacyLane(scene) {
    const zone = getWalkZone(scene);
    GAME_CONFIG.laneTop = zone.top;
    GAME_CONFIG.laneBottom = zone.bottom;
    return zone;
  }

  ensureAllLevelAreas();

  if (typeof LevelScene !== 'undefined') {
    LevelScene.prototype.getWalkZone = function () {
      return getWalkZone(this);
    };

    LevelScene.prototype.getPlayerStart = function () {
      const level = this.getLevelConfig();
      ensureLevelArea(level);
      const zone = this.getWalkZone();
      return {
        x: clamp(num(level.playerStart.x, DEFAULT_PLAYER_START.x), zone.left, zone.right),
        y: clamp(num(level.playerStart.y, DEFAULT_PLAYER_START.y), zone.top, zone.bottom)
      };
    };

    LevelScene.prototype.clampActorPosition = function (actor, marginX = 0) {
      const zone = this.getWalkZone();
      actor.x = clamp(actor.x, zone.left + marginX, zone.right - marginX);
      actor.y = clamp(actor.y, zone.top, zone.bottom);
    };

    LevelScene.prototype.getSpawnPoint = function (side, index, count) {
      const level = this.getLevelConfig();
      ensureLevelArea(level);
      const zone = this.getWalkZone();
      const marginX = clamp(num(level.enemySpawnMargin.x, 40), 0, 240);
      const marginY = clamp(num(level.enemySpawnMargin.y, 28), 0, 120);
      const safeSide = side || 'right';
      const rowRatio = count <= 1 ? 0.5 : index / Math.max(1, count - 1);
      const usableTop = Math.min(zone.bottom, zone.top + marginY);
      const usableBottom = Math.max(usableTop, zone.bottom - marginY);
      const y = usableTop + rowRatio * (usableBottom - usableTop);

      if (safeSide === 'left') {
        return { x: zone.left + marginX + index * 34, y };
      }

      if (safeSide === 'both') {
        const fromLeft = index % 2 === 0;
        return {
          x: fromLeft ? zone.left + marginX + index * 18 : zone.right - marginX - index * 18,
          y
        };
      }

      return { x: zone.right - marginX - index * 34, y };
    };

    LevelScene.prototype.restartCurrentLevel = function () {
      const start = this.getPlayerStart();
      this.player.x = start.x;
      this.player.y = start.y;
      this.player.releaseFromPin();
      const level = this.getLevelConfig();
      AudioManager.playMusic((level && level.music) || (GAME_CONFIG.audio && GAME_CONFIG.audio.music && GAME_CONFIG.audio.music.level) || 'levelTheme');
      this.spawnInitialWave();
    };

    LevelScene.prototype.nextScreen = function () {
      if (this.screenIndex < this.images.streets.length - 1) {
        this.screenIndex += 1;
        syncLegacyLane(this);
        const start = this.getPlayerStart();
        this.player.x = start.x;
        this.player.y = start.y;
        this.player.releaseFromPin();
        const level = this.getLevelConfig();
        AudioManager.playMusic((level && level.music) || (GAME_CONFIG.audio && GAME_CONFIG.audio.music && GAME_CONFIG.audio.music.level) || 'levelTheme');
        this.spawnInitialWave();
      } else {
        this.game.setState('mainMenu');
      }
    };

    const oldLevelUpdate = LevelScene.prototype.update;
    LevelScene.prototype.update = function (dt) {
      const zone = syncLegacyLane(this);
      oldLevelUpdate.call(this, dt);
      if (this.player) this.clampActorPosition(this.player, 70);
      if (this.encounterCleared && this.player && this.player.x > zone.right - 35) this.nextScreen();
    };

    const oldLevelDraw = LevelScene.prototype.draw;
    LevelScene.prototype.draw = function (ctx) {
      syncLegacyLane(this);
      oldLevelDraw.call(this, ctx);

      const showArea = this.debug || (typeof DevPanel !== 'undefined' && DevPanel.open && DevPanel.tab === 'LEVEL AREA');
      if (!showArea) return;

      const zone = this.getWalkZone();
      ctx.save();
      ctx.fillStyle = 'rgba(0, 255, 90, 0.075)';
      ctx.fillRect(zone.left, zone.top, zone.right - zone.left, zone.bottom - zone.top);
      ctx.strokeStyle = 'rgba(0, 255, 90, 0.95)';
      ctx.lineWidth = 3;
      ctx.strokeRect(zone.left, zone.top, zone.right - zone.left, zone.bottom - zone.top);
      ctx.font = 'bold 14px Arial';
      ctx.fillStyle = '#7CFF90';
      ctx.fillText('WALK ZONE', zone.left + 10, zone.top - 8);
      ctx.restore();
    };
  }

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
      if (scene && typeof scene.clampActorPosition === 'function') scene.clampActorPosition(this, 45);
    };

    DogRegimeEnemy.prototype.clampToScreen = function () {
      const scene = this.__scene;
      if (scene && typeof scene.clampActorPosition === 'function') {
        scene.clampActorPosition(this, 45);
        return;
      }
      this.x = clamp(this.x, 45, GAME_CONFIG.width - 45);
      this.y = clamp(this.y, GAME_CONFIG.laneTop, GAME_CONFIG.laneBottom);
    };
  }

  if (typeof SuckerEnemy !== 'undefined') {
    const oldSuckerUpdate = SuckerEnemy.prototype.update;
    SuckerEnemy.prototype.update = function (dt, scene) {
      this.__scene = scene;
      oldSuckerUpdate.call(this, dt, scene);
      if (scene && typeof scene.clampActorPosition === 'function') scene.clampActorPosition(this, 45);
    };
  }

  if (typeof BastardEnemy !== 'undefined') {
    const oldBastardUpdate = BastardEnemy.prototype.update;
    BastardEnemy.prototype.update = function (dt, scene) {
      this.__scene = scene;
      oldBastardUpdate.call(this, dt, scene);
      if (scene && typeof scene.clampActorPosition === 'function') scene.clampActorPosition(this, 45);
    };

    const oldBastardTakeHit = BastardEnemy.prototype.takeHit;
    BastardEnemy.prototype.takeHit = function (damage, direction) {
      oldBastardTakeHit.call(this, damage, direction);
      const scene = this.__scene;
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
        ctx.fillText('LEVEL AREA: tune walkable bounds for player and enemies. Green rectangle is the playable zone.', panel.x + 22, panel.y + 58);

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
        box: { x, y, w: 760, h: 492 },
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
        { key: 'left', label: 'Left limit', path: 'levels.' + key + '.walkZone.left', min: 0, max: GAME_CONFIG.width - 100, step: 5 },
        { key: 'right', label: 'Right limit', path: 'levels.' + key + '.walkZone.right', min: 100, max: GAME_CONFIG.width, step: 5 },
        { key: 'top', label: 'Top line', path: 'levels.' + key + '.walkZone.top', min: 260, max: GAME_CONFIG.height - 80, step: 5 },
        { key: 'bottom', label: 'Bottom line', path: 'levels.' + key + '.walkZone.bottom', min: 320, max: GAME_CONFIG.height - 10, step: 5 },
        { key: 'playerX', label: 'Player start X', path: 'levels.' + key + '.playerStart.x', min: 0, max: GAME_CONFIG.width, step: 5 },
        { key: 'playerY', label: 'Player start Y', path: 'levels.' + key + '.playerStart.y', min: 260, max: GAME_CONFIG.height, step: 5 },
        { key: 'spawnX', label: 'Enemy spawn X margin', path: 'levels.' + key + '.enemySpawnMargin.x', min: 0, max: 240, step: 5 },
        { key: 'spawnY', label: 'Enemy spawn Y margin', path: 'levels.' + key + '.enemySpawnMargin.y', min: 0, max: 120, step: 2 }
      ];
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

      for (const field of fields) {
        const value = this.getValue(field.path);
        const ratio = (value - field.min) / Math.max(1, field.max - field.min);
        const y = r[field.key + 'Y'];
        ctx.font = '14px Arial';
        ctx.fillStyle = '#fff';
        ctx.fillText(field.label, r.box.x + 24, y);
        ctx.fillStyle = '#ccc';
        ctx.fillText(String(value), r.box.x + 185, y);
        this.drawButton(ctx, r[field.key + 'Minus'].x, r[field.key + 'Minus'].y, r[field.key + 'Minus'].w, r[field.key + 'Minus'].h, '-');
        ctx.fillStyle = '#222';
        ctx.fillRect(r[field.key + 'Bar'].x, r[field.key + 'Bar'].y, r[field.key + 'Bar'].w, r[field.key + 'Bar'].h);
        ctx.fillStyle = '#7CFF90';
        ctx.fillRect(r[field.key + 'Bar'].x, r[field.key + 'Bar'].y, r[field.key + 'Bar'].w * clamp(ratio, 0, 1), r[field.key + 'Bar'].h);
        ctx.strokeStyle = '#777';
        ctx.strokeRect(r[field.key + 'Bar'].x, r[field.key + 'Bar'].y, r[field.key + 'Bar'].w, r[field.key + 'Bar'].h);
        this.drawButton(ctx, r[field.key + 'Plus'].x, r[field.key + 'Plus'].y, r[field.key + 'Plus'].w, r[field.key + 'Plus'].h, '+');
      }

      ctx.font = '13px Arial';
      ctx.fillStyle = '#aaa';
      ctx.fillText('H key also shows debug hitboxes. This tab shows the green movement rectangle while open.', r.box.x + 24, r.box.y + 462);
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
        if (this.inRect(point, minus)) { this.changeLevelAreaField(field, -field.step, game); return true; }
        if (this.inRect(point, plus)) { this.changeLevelAreaField(field, field.step, game); return true; }
        if (this.inRect(point, bar)) {
          const ratio = clamp((point.x - bar.x) / bar.w, 0, 1);
          const raw = field.min + ratio * (field.max - field.min);
          this.setLevelAreaValue(field, this.roundToStep(raw, field.step), game);
          return true;
        }
      }
      return false;
    };

    DevPanel.changeLevelAreaField = function (field, delta, game) {
      const current = this.getValue(field.path);
      this.setLevelAreaValue(field, current + delta, game);
    };

    DevPanel.setLevelAreaValue = function (field, value, game) {
      const level = this.getSelectedLevel();
      ensureLevelArea(level);
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
      z.bottom = clamp(z.bottom, z.top + 40, GAME_CONFIG.height);
      level.playerStart.x = clamp(level.playerStart.x, z.left, z.right);
      level.playerStart.y = clamp(level.playerStart.y, z.top, z.bottom);
    };

    const oldExportConfig = DevPanel.exportConfig;
    DevPanel.exportConfig = function () {
      ensureAllLevelAreas();
      oldExportConfig.call(this);
    };
  }

  window.WalkZoneTools = {
    ensureAllLevelAreas,
    ensureLevelArea,
    getWalkZone,
    syncLegacyLane
  };
})();
