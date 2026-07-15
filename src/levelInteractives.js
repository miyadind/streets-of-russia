(function () {
  if (typeof GameApp === 'undefined' || typeof LevelScene === 'undefined') return;

  function loadImage(src) {
    return new Promise((resolve) => {
      if (!src) {
        resolve(null);
        return;
      }

      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => {
        console.warn('Missing interactive level image:', src);
        resolve(null);
      };
      img.src = src;
    });
  }

  function getInteractivesForLevel(level) {
    return Array.isArray(level && level.interactives) ? level.interactives : [];
  }

  function isVehicleObstacle(item) {
    return item && item.type === 'vehicleObstacle';
  }

  function getVehicleObstacles(level) {
    return getInteractivesForLevel(level).filter(isVehicleObstacle);
  }

  function getPosterState(scene, item) {
    if (!scene.levelInteractiveState) scene.levelInteractiveState = {};
    const key = scene.getLevelKey() + ':' + item.id;
    if (!scene.levelInteractiveState[key]) {
      scene.levelInteractiveState[key] = {
        hits: 0,
        replaced: false,
        flashMs: 0
      };
    }
    return scene.levelInteractiveState[key];
  }

  function isAttackActive(player) {
    if (!player || player.state !== 'attack' || !player.getAttackData) return false;
    const data = player.getAttackData();
    return player.attackTimer >= data.activeStart && player.attackTimer <= data.activeEnd;
  }

  function canHitPoster(scene, item, state) {
    const player = scene && scene.player;
    if (!player || state.replaced || player.attackHasHit || !isAttackActive(player)) return false;
    return Combat.canInteractHit(player, item, {
      attackBox: player.getHitbox(),
      laneTolerance: item.laneTolerance || GAME_CONFIG.yHitTolerance
    });
  }

  function hitPoster(scene, item, state) {
    state.hits += 1;
    state.flashMs = 150;
    scene.player.attackHasHit = true;
    scene.hitStop = Math.max(scene.hitStop || 0, GAME_CONFIG.playerHitStopMs || 55);

    if (state.hits >= (item.hitsToReplace || 3)) {
      state.replaced = true;
      state.flashMs = 0;
      AudioManager.playSfx('enemyDown', 0.82, { playbackRate: 0.92, startAt: 0.02 });
      return;
    }

    AudioManager.playSfx('hit', 0.76, {
      playbackRate: 0.82 + state.hits * 0.08,
      startAt: 0.015
    });
  }

  function drawCrackLine(ctx, rect, points, alpha, width) {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = '#ecf7ff';
    ctx.lineWidth = width;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.shadowColor = 'rgba(255,255,255,0.65)';
    ctx.shadowBlur = 4;
    ctx.beginPath();
    for (let i = 0; i < points.length; i++) {
      const p = points[i];
      const x = rect.x + p[0] * rect.w;
      const y = rect.y + p[1] * rect.h;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();
  }

  function drawPosterDamage(ctx, item, state) {
    const rect = item.effectRect || item.hitbox;
    const damageLevel = Math.min(2, state.hits);
    if (damageLevel <= 0) return;

    ctx.save();
    ctx.beginPath();
    ctx.rect(rect.x, rect.y, rect.w, rect.h);
    ctx.clip();

    const flash = Math.max(0, Math.min(1, (state.flashMs || 0) / 150));
    ctx.globalAlpha = 0.16 + flash * 0.18;
    ctx.fillStyle = '#f4f0e7';
    ctx.fillRect(rect.x, rect.y, rect.w, rect.h);

    ctx.globalAlpha = 0.22 + damageLevel * 0.08;
    ctx.fillStyle = '#151515';
    ctx.beginPath();
    ctx.ellipse(rect.x + rect.w * 0.52, rect.y + rect.h * 0.55, rect.w * 0.35, rect.h * 0.24, -0.18, 0, Math.PI * 2);
    ctx.fill();

    drawCrackLine(ctx, rect, [[0.46, 0.18], [0.55, 0.34], [0.49, 0.48], [0.58, 0.66], [0.51, 0.86]], 0.86, 2.1);
    drawCrackLine(ctx, rect, [[0.52, 0.36], [0.32, 0.42], [0.18, 0.55]], 0.72, 1.6);
    drawCrackLine(ctx, rect, [[0.52, 0.38], [0.72, 0.30], [0.88, 0.22]], 0.64, 1.35);

    if (damageLevel >= 2) {
      drawCrackLine(ctx, rect, [[0.28, 0.18], [0.39, 0.34], [0.31, 0.52], [0.44, 0.73], [0.38, 0.92]], 0.82, 1.7);
      drawCrackLine(ctx, rect, [[0.62, 0.18], [0.66, 0.36], [0.58, 0.52], [0.71, 0.68], [0.67, 0.90]], 0.76, 1.55);
      ctx.globalAlpha = 0.28;
      ctx.strokeStyle = '#070707';
      ctx.lineWidth = 7;
      ctx.beginPath();
      ctx.ellipse(rect.x + rect.w * 0.50, rect.y + rect.h * 0.56, rect.w * 0.28, rect.h * 0.20, -0.24, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.restore();
  }

  const previousLoadImages = GameApp.prototype.loadImages;
  GameApp.prototype.loadImages = async function () {
    const loaded = await previousLoadImages.call(this);
    loaded.levelInteractiveBackgrounds = loaded.levelInteractiveBackgrounds || {};
    loaded.levelInteractiveImages = loaded.levelInteractiveImages || {};

    const requests = [];
    const levels = GAME_CONFIG.levels || {};
    for (const key of Object.keys(levels)) {
      for (const item of getInteractivesForLevel(levels[key])) {
        if (!item.altBackground || loaded.levelInteractiveBackgrounds[item.altBackground]) continue;
        requests.push(loadImage(item.altBackground).then((image) => {
          loaded.levelInteractiveBackgrounds[item.altBackground] = image;
        }));
      }
      for (const item of getInteractivesForLevel(levels[key])) {
        if (!item.image || loaded.levelInteractiveImages[item.image]) continue;
        requests.push(loadImage(item.image).then((image) => {
          loaded.levelInteractiveImages[item.image] = image;
        }));
      }
    }

    await Promise.all(requests);
    return loaded;
  };

  function getActorObstacleBox(actor) {
    if (!actor) return null;
    if (typeof actor.getPushbox === 'function') {
      const box = actor.getPushbox();
      if (box && Number.isFinite(box.x) && Number.isFinite(box.y) && Number.isFinite(box.w) && Number.isFinite(box.h)) return box;
    }

    const radiusX = actor.bodyRadiusX || GAME_CONFIG.enemyBodyRadiusX || 42;
    const radiusY = actor.bodyRadiusY || GAME_CONFIG.enemyBodyRadiusY || 20;
    return {
      x: actor.x - radiusX,
      y: actor.y - radiusY,
      w: radiusX * 2,
      h: radiusY * 2
    };
  }

  function resolveActorFromObstacle(scene, actor, obstacle) {
    if (!scene || !actor || !obstacle || !obstacle.blockBox) return;
    const actorBox = getActorObstacleBox(actor);
    const block = obstacle.blockBox;
    if (!actorBox || !Combat.overlap(actorBox, block)) return;

    const leftPush = block.x - (actorBox.x + actorBox.w);
    const rightPush = block.x + block.w - actorBox.x;
    const upPush = block.y - (actorBox.y + actorBox.h);
    const downPush = block.y + block.h - actorBox.y;
    const options = [
      { dx: leftPush, dy: 0, amount: Math.abs(leftPush), axis: 'x' },
      { dx: rightPush, dy: 0, amount: Math.abs(rightPush), axis: 'x' },
      { dx: 0, dy: upPush, amount: Math.abs(upPush), axis: 'y' },
      { dx: 0, dy: downPush, amount: Math.abs(downPush), axis: 'y' }
    ];

    let chosen = options.sort((a, b) => a.amount - b.amount)[0];
    if (actor !== scene.player && scene.player && actor.alive !== false) {
      const obstacleCenterY = block.y + block.h / 2;
      const preferUp = scene.player.y < obstacleCenterY;
      const vertical = preferUp ? options[2] : options[3];
      const zone = scene.getWalkZone ? scene.getWalkZone() : { top: GAME_CONFIG.laneTop, bottom: GAME_CONFIG.laneBottom };
      const nextY = actor.y + vertical.dy;
      if (nextY >= zone.top && nextY <= zone.bottom) chosen = vertical;
    }

    actor.x += chosen.dx;
    actor.y += chosen.dy;
  }

  LevelScene.prototype.resolveObstacleCollisions = function (actor) {
    const level = this.getLevelConfig();
    for (const obstacle of getVehicleObstacles(level)) {
      resolveActorFromObstacle(this, actor, obstacle);
    }
  };

  const previousUpdate = LevelScene.prototype.update;
  LevelScene.prototype.update = function (dt) {
    previousUpdate.call(this, dt);
    if (this.player) this.resolveObstacleCollisions(this.player);
    for (const enemy of this.enemies || []) {
      if (enemy && !enemy.remove) this.resolveObstacleCollisions(enemy);
    }
  };

  LevelScene.prototype.getLevelBackgroundImage = function () {
    const level = this.getLevelConfig();
    for (const item of getInteractivesForLevel(level)) {
      if (item.type !== 'breakablePoster') continue;
      const state = getPosterState(this, item);
      if (state.replaced && item.altBackground) {
        const replacement = this.images.levelInteractiveBackgrounds && this.images.levelInteractiveBackgrounds[item.altBackground];
        if (replacement) return replacement;
      }
    }

    return this.images.streets[this.screenIndex] || this.images.streets[0];
  };

  LevelScene.prototype.updateLevelInteractives = function (dt) {
    const level = this.getLevelConfig();
    for (const item of getInteractivesForLevel(level)) {
      if (item.type !== 'breakablePoster') continue;
      const state = getPosterState(this, item);
      if (state.flashMs > 0) state.flashMs = Math.max(0, state.flashMs - dt);
      if (canHitPoster(this, item, state)) hitPoster(this, item, state);
    }
  };

  LevelScene.prototype.drawLevelBackgroundEffects = function (ctx) {
    const level = this.getLevelConfig();
    const showObjectEditor = typeof DevPanel !== 'undefined' && DevPanel.open && DevPanel.tab === 'OBJECTS';
    for (const item of getInteractivesForLevel(level)) {
      if (isVehicleObstacle(item)) {
        const rect = item.drawRect;
        const image = item.image && this.images.levelInteractiveImages && this.images.levelInteractiveImages[item.image];
        if (rect && image) {
          ctx.drawImage(image, rect.x, rect.y, rect.w, rect.h);
        } else if (rect) {
          ctx.fillStyle = 'rgba(20,45,75,0.82)';
          ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
        }

        if (this.debug || showObjectEditor) {
          ctx.save();
          if (rect) {
            ctx.strokeStyle = 'rgba(80, 190, 255, 0.9)';
            ctx.lineWidth = 2;
            ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
          }
          if (item.blockBox) {
            ctx.strokeStyle = 'rgba(255, 230, 90, 0.95)';
            ctx.lineWidth = 3;
            ctx.strokeRect(item.blockBox.x, item.blockBox.y, item.blockBox.w, item.blockBox.h);
          }
          ctx.restore();
        }
        continue;
      }

      if (item.type !== 'breakablePoster') continue;
      const state = getPosterState(this, item);
      if (!state.replaced) drawPosterDamage(ctx, item, state);

      if (this.debug || showObjectEditor) {
        ctx.save();
        ctx.strokeStyle = showObjectEditor ? 'rgba(255, 230, 90, 0.95)' : 'rgba(255, 230, 90, 0.75)';
        ctx.lineWidth = showObjectEditor ? 3 : 2;
        ctx.strokeRect(item.hitbox.x, item.hitbox.y, item.hitbox.w, item.hitbox.h);
        if (item.effectRect) {
          ctx.strokeStyle = 'rgba(80, 190, 255, 0.9)';
          ctx.strokeRect(item.effectRect.x, item.effectRect.y, item.effectRect.w, item.effectRect.h);
        }
        if (Number.isFinite(item.laneY)) {
          ctx.strokeStyle = 'rgba(80,255,120,0.85)';
          ctx.beginPath();
          ctx.moveTo(item.hitbox.x - 24, item.laneY);
          ctx.lineTo(item.hitbox.x + item.hitbox.w + 24, item.laneY);
          ctx.stroke();
        }
        ctx.restore();
      }
    }
  };

  if (typeof DevPanel !== 'undefined' && !DevPanel.objectEditorPatchApplied) {
    if (!DevPanel.tabs.includes('OBJECTS')) DevPanel.tabs.push('OBJECTS');
    DevPanel.selectedObjectLevelIndex = DevPanel.selectedObjectLevelIndex || 0;
    DevPanel.selectedObjectIndex = DevPanel.selectedObjectIndex || 0;
    DevPanel.selectedObjectBoxKey = DevPanel.selectedObjectBoxKey || 'hitbox';

    DevPanel.getObjectLevelKeys = function () {
      return GAME_CONFIG.levelOrder || Object.keys(GAME_CONFIG.levels || {});
    };

    DevPanel.getSelectedObjectLevelKey = function () {
      const keys = this.getObjectLevelKeys();
      if (!keys.length) return null;
      this.selectedObjectLevelIndex = this.wrap ? this.wrap(this.selectedObjectLevelIndex, keys.length) :
        ((this.selectedObjectLevelIndex % keys.length) + keys.length) % keys.length;
      return keys[this.selectedObjectLevelIndex];
    };

    DevPanel.getSelectedObjectLevel = function () {
      const key = this.getSelectedObjectLevelKey();
      return key && GAME_CONFIG.levels ? GAME_CONFIG.levels[key] : null;
    };

    DevPanel.getSelectedObjectList = function () {
      return getInteractivesForLevel(this.getSelectedObjectLevel());
    };

    DevPanel.getSelectedObject = function () {
      const list = this.getSelectedObjectList();
      if (!list.length) return null;
      this.selectedObjectIndex = this.wrap ? this.wrap(this.selectedObjectIndex, list.length) :
        ((this.selectedObjectIndex % list.length) + list.length) % list.length;
      return list[this.selectedObjectIndex];
    };

    DevPanel.getSelectedObjectBox = function () {
      const item = this.getSelectedObject();
      if (!item) return null;
      if (this.selectedObjectBoxKey === 'lane') return item;
      if (!item[this.selectedObjectBoxKey]) item[this.selectedObjectBoxKey] = { x: 0, y: 0, w: 40, h: 40 };
      return item[this.selectedObjectBoxKey];
    };

    DevPanel.objectEditorRects = function () {
      const panel = this.panelRect();
      const x = panel.x + 36;
      const y = panel.y + 118;
      return {
        box: { x, y, w: 980, h: 496 },
        levelPrev: { x: x + 112, y: y + 24, w: 36, h: 28 },
        levelNext: { x: x + 620, y: y + 24, w: 36, h: 28 },
        objectPrev: { x: x + 112, y: y + 64, w: 36, h: 28 },
        objectNext: { x: x + 620, y: y + 64, w: 36, h: 28 },
        boxPrev: { x: x + 112, y: y + 104, w: 36, h: 28 },
        boxNext: { x: x + 620, y: y + 104, w: 36, h: 28 }
      };
    };

    DevPanel.objectBoxKeys = function (item) {
      const keys = [];
      if (item && item.hitbox) keys.push('hitbox');
      if (item && item.drawRect) keys.push('drawRect');
      if (item && item.blockBox) keys.push('blockBox');
      if (item && item.effectRect) keys.push('effectRect');
      if (item && Number.isFinite(item.laneY)) keys.push('lane');
      if (!keys.length) keys.push('hitbox');
      return keys;
    };

    DevPanel.selectNextObjectBox = function (delta) {
      const item = this.getSelectedObject();
      const keys = this.objectBoxKeys(item);
      const index = Math.max(0, keys.indexOf(this.selectedObjectBoxKey));
      this.selectedObjectBoxKey = keys[((index + delta) % keys.length + keys.length) % keys.length];
    };

    const originalHandleClick = DevPanel.objectOriginalHandleClick || DevPanel.handleClick;
    DevPanel.objectOriginalHandleClick = originalHandleClick;
    DevPanel.handleClick = function (point, game) {
      const panel = this.panelRect();
      if (!this.inRect(point, panel)) return;
      const close = { x: panel.x + panel.w - 78, y: panel.y + 14, w: 56, h: 32 };
      if (this.inRect(point, close)) { this.open = false; return; }
      const tab = this.getClickedTab(point);
      if (tab) { this.tab = tab; this.setStatus('Tab: ' + tab); return; }
      if (this.handleFooterClick(point, game)) return;
      if (this.tab === 'OBJECTS') { this.handleObjectEditorClick(point, game); return; }
      originalHandleClick.call(this, point, game);
    };

    DevPanel.handleObjectEditorClick = function (point, game) {
      const r = this.objectEditorRects();
      const list = this.getSelectedObjectList();
      if (this.inRect(point, r.levelPrev)) { this.selectedObjectLevelIndex--; this.selectedObjectIndex = 0; this.setStatus('Object level: ' + this.getSelectedObjectLevelKey()); return true; }
      if (this.inRect(point, r.levelNext)) { this.selectedObjectLevelIndex++; this.selectedObjectIndex = 0; this.setStatus('Object level: ' + this.getSelectedObjectLevelKey()); return true; }
      if (this.inRect(point, r.objectPrev) && list.length) { this.selectedObjectIndex--; this.setStatus('Object changed'); return true; }
      if (this.inRect(point, r.objectNext) && list.length) { this.selectedObjectIndex++; this.setStatus('Object changed'); return true; }
      if (this.inRect(point, r.boxPrev)) { this.selectNextObjectBox(-1); this.setStatus('Object box: ' + this.selectedObjectBoxKey); return true; }
      if (this.inRect(point, r.boxNext)) { this.selectNextObjectBox(1); this.setStatus('Object box: ' + this.selectedObjectBoxKey); return true; }

      const box = this.getSelectedObjectBox();
      if (!box) return false;
      const props = this.selectedObjectBoxKey === 'lane' ? ['laneY', 'laneTolerance'] : ['x', 'y', 'w', 'h'];
      for (let i = 0; i < props.length; i++) {
        const y = r.box.y + 178 + i * 46;
        const minus = { x: r.box.x + 118, y: y - 22, w: 34, h: 28 };
        const plus = { x: r.box.x + 452, y: y - 22, w: 34, h: 28 };
        const bar = { x: r.box.x + 166, y: y - 13, w: 270, h: 12 };
        const prop = props[i];
        const min = prop === 'w' || prop === 'h' ? 4 : 0;
        const max = prop === 'w' ? GAME_CONFIG.width : prop === 'h' ? GAME_CONFIG.height : GAME_CONFIG.height;
        const step = prop === 'laneTolerance' ? 2 : 4;
        if (this.inRect(point, minus)) { box[prop] = Math.max(min, Math.round((Number(box[prop]) || 0) - step)); this.applyToCurrentScene(game); this.setStatus(prop + ': ' + box[prop]); return true; }
        if (this.inRect(point, plus)) { box[prop] = Math.min(max, Math.round((Number(box[prop]) || 0) + step)); this.applyToCurrentScene(game); this.setStatus(prop + ': ' + box[prop]); return true; }
        if (this.inRect(point, bar)) {
          const ratio = Math.max(0, Math.min(1, (point.x - bar.x) / bar.w));
          box[prop] = Math.round(min + ratio * (max - min));
          this.applyToCurrentScene(game);
          this.setStatus(prop + ': ' + box[prop]);
          return true;
        }
      }
      return false;
    };

    const originalDraw = DevPanel.objectOriginalDraw || DevPanel.draw;
    DevPanel.objectOriginalDraw = originalDraw;
    DevPanel.draw = function (ctx) {
      if (!GAME_CONFIG.adminTuningEnabled) return;
      if (!this.open || this.tab !== 'OBJECTS') { originalDraw.call(this, ctx); return; }
      const panel = this.panelRect();
      ctx.fillStyle = 'rgba(0,0,0,0.92)';
      ctx.fillRect(panel.x, panel.y, panel.w, panel.h);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.strokeRect(panel.x, panel.y, panel.w, panel.h);
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 24px Arial';
      ctx.fillText('DEVELOPER PANEL', panel.x + 22, panel.y + 38);
      ctx.font = '13px Arial';
      ctx.fillStyle = '#aaa';
      ctx.fillText('Object editor: yellow = hitbox, blue = visual effect, green line = lane.', panel.x + 22, panel.y + 58);
      this.drawButton(ctx, panel.x + panel.w - 78, panel.y + 14, 56, 32, 'X');
      this.drawTabs(ctx);
      this.drawObjectEditor(ctx);
      this.drawFooter(ctx);
      this.drawStatus(ctx, panel);
    };

    DevPanel.drawObjectEditor = function (ctx) {
      const r = this.objectEditorRects();
      const item = this.getSelectedObject();
      const box = this.getSelectedObjectBox();
      ctx.fillStyle = 'rgba(255,255,255,0.06)';
      ctx.fillRect(r.box.x, r.box.y, r.box.w, r.box.h);
      ctx.strokeStyle = 'rgba(255,255,255,0.35)';
      ctx.strokeRect(r.box.x, r.box.y, r.box.w, r.box.h);

      const levelKey = this.getSelectedObjectLevelKey() || 'none';
      ctx.fillStyle = '#ccc';
      ctx.font = '14px Arial';
      ctx.fillText('Level:', r.box.x + 24, r.box.y + 43);
      this.drawButton(ctx, r.levelPrev.x, r.levelPrev.y, r.levelPrev.w, r.levelPrev.h, '<');
      this.drawButton(ctx, r.levelNext.x, r.levelNext.y, r.levelNext.w, r.levelNext.h, '>');
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 15px Arial';
      ctx.fillText(levelKey, r.box.x + 160, r.box.y + 43);

      ctx.fillStyle = '#ccc';
      ctx.font = '14px Arial';
      ctx.fillText('Object:', r.box.x + 24, r.box.y + 83);
      this.drawButton(ctx, r.objectPrev.x, r.objectPrev.y, r.objectPrev.w, r.objectPrev.h, '<');
      this.drawButton(ctx, r.objectNext.x, r.objectNext.y, r.objectNext.w, r.objectNext.h, '>');
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 15px Arial';
      ctx.fillText(item ? (item.id || item.type || 'object') : 'no objects', r.box.x + 160, r.box.y + 83);

      ctx.fillStyle = '#ccc';
      ctx.font = '14px Arial';
      ctx.fillText('Box:', r.box.x + 24, r.box.y + 123);
      this.drawButton(ctx, r.boxPrev.x, r.boxPrev.y, r.boxPrev.w, r.boxPrev.h, '<');
      this.drawButton(ctx, r.boxNext.x, r.boxNext.y, r.boxNext.w, r.boxNext.h, '>');
      ctx.fillStyle = this.selectedObjectBoxKey === 'hitbox' ? '#ffe65a' : this.selectedObjectBoxKey === 'effectRect' ? '#50beff' : '#50ff78';
      ctx.font = 'bold 15px Arial';
      ctx.fillText(String(this.selectedObjectBoxKey).toUpperCase(), r.box.x + 160, r.box.y + 123);

      if (!box) return;
      const props = this.selectedObjectBoxKey === 'lane' ? ['laneY', 'laneTolerance'] : ['x', 'y', 'w', 'h'];
      for (let i = 0; i < props.length; i++) {
        const prop = props[i];
        const value = Number(box[prop]) || 0;
        const min = prop === 'w' || prop === 'h' ? 4 : 0;
        const max = prop === 'w' ? GAME_CONFIG.width : prop === 'h' ? GAME_CONFIG.height : GAME_CONFIG.height;
        const ratio = (value - min) / Math.max(1, max - min);
        const y = r.box.y + 178 + i * 46;
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 14px Arial';
        ctx.fillText(prop, r.box.x + 24, y);
        ctx.fillStyle = '#ccc';
        ctx.fillText(String(value), r.box.x + 104, y);
        this.drawButton(ctx, r.box.x + 118, y - 22, 34, 28, '-');
        ctx.fillStyle = '#222';
        ctx.fillRect(r.box.x + 166, y - 13, 270, 12);
        ctx.fillStyle = '#55ccff';
        ctx.fillRect(r.box.x + 166, y - 13, 270 * Math.max(0, Math.min(1, ratio)), 12);
        ctx.strokeStyle = '#777';
        ctx.strokeRect(r.box.x + 166, y - 13, 270, 12);
        this.drawButton(ctx, r.box.x + 452, y - 22, 34, 28, '+');
      }

      ctx.fillStyle = '#aaa';
      ctx.font = '12px Arial';
      ctx.fillText('Use EXPORT to print the current level object JSON, then I can lock it into config.', r.box.x + 24, r.box.y + 392);
    };

    const originalExportConfig = DevPanel.objectOriginalExportConfig || DevPanel.exportConfig;
    DevPanel.objectOriginalExportConfig = originalExportConfig;
    DevPanel.exportConfig = function () {
      originalExportConfig.call(this);
      console.log('STREETS_OF_RUSSIA_OBJECTS_ONLY');
      console.log(JSON.stringify(GAME_CONFIG.levels, null, 2));
    };

    DevPanel.objectEditorPatchApplied = true;
  }
}());
