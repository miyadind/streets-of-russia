(() => {
  if (typeof GAME_CONFIG === 'undefined') return;

  const COLORS = {
    body: '#00d6d6',
    hurt: '#ff3030',
    attack1: '#45ff45',
    attack2: '#45ff45',
    attack3: '#45ff45',
    club: '#ffd500',
    slide: '#00ffff',
    counter: '#8f7cff'
  };

  const DEFAULT_HITBOXES = {
    heroes: {
      boris: {
        body: { x: -34, y: -132, w: 68, h: 132 },
        attack1: { x: 22, y: -118, w: 46, h: 40 },
        attack2: { x: 22, y: -118, w: 52, h: 40 },
        attack3: { x: 22, y: -118, w: 62, h: 40 },
        counter: { x: 0, y: -58, w: 150, h: 116 }
      },
      alexey: {
        body: { x: -34, y: -132, w: 68, h: 132 },
        attack1: { x: 22, y: -118, w: 46, h: 40 },
        attack2: { x: 22, y: -118, w: 52, h: 40 },
        attack3: { x: 22, y: -118, w: 62, h: 40 },
        counter: { x: 0, y: -58, w: 150, h: 116 }
      },
      anna: {
        body: { x: -34, y: -132, w: 68, h: 132 },
        attack1: { x: 22, y: -118, w: 46, h: 40 },
        attack2: { x: 22, y: -118, w: 52, h: 40 },
        attack3: { x: 22, y: -118, w: 62, h: 40 },
        counter: { x: 0, y: -58, w: 150, h: 116 }
      }
    },
    enemies: {
      dogRegime: {
        hurt: { x: -38, y: -140, w: 76, h: 140 },
        body: { x: -42, y: -20, w: 84, h: 40 },
        club: { x: 28, y: -42, w: 54, h: 84 }
      },
      zetnik: {
        hurt: { x: -38, y: -140, w: 76, h: 140 },
        body: { x: -42, y: -20, w: 84, h: 40 },
        club: { x: 28, y: -42, w: 54, h: 84 }
      },
      sucker: {
        hurt: { x: -44, y: -150, w: 88, h: 150 },
        body: { x: -52, y: -24, w: 104, h: 48 },
        slide: { x: 8, y: -112, w: 88, h: 54 }
      },
      bastard: {
        hurt: { x: -38, y: -132, w: 76, h: 132 },
        body: { x: -44, y: -20, w: 88, h: 40 }
      }
    }
  };

  function mergeMissing(target, source) {
    for (const key of Object.keys(source)) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        if (!target[key]) target[key] = {};
        mergeMissing(target[key], source[key]);
      } else if (target[key] === undefined) {
        target[key] = source[key];
      }
    }
  }

  function ensureHitboxes() {
    if (!GAME_CONFIG.hitboxes) GAME_CONFIG.hitboxes = {};
    mergeMissing(GAME_CONFIG.hitboxes, DEFAULT_HITBOXES);
  }

  function mirrorBox(box) {
    return { x: -box.x - box.w, y: box.y, w: box.w, h: box.h };
  }

  function worldBox(anchorX, anchorY, facing, box) {
    const b = facing === -1 ? mirrorBox(box) : box;
    return { x: anchorX + b.x, y: anchorY + b.y, w: b.w, h: b.h };
  }

  function heroBox(heroKey, boxKey) {
    ensureHitboxes();
    const heroBoxes = GAME_CONFIG.hitboxes.heroes[heroKey] || GAME_CONFIG.hitboxes.heroes.boris;
    return heroBoxes[boxKey] || DEFAULT_HITBOXES.heroes.boris[boxKey];
  }

  function enemyBox(enemyType, boxKey) {
    ensureHitboxes();
    const enemyBoxes = GAME_CONFIG.hitboxes.enemies[enemyType] || GAME_CONFIG.hitboxes.enemies.dogRegime;
    return enemyBoxes[boxKey] || DEFAULT_HITBOXES.enemies.dogRegime[boxKey];
  }

  function strokeBox(ctx, box, color, label) {
    if (!box) return;
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.strokeRect(box.x, box.y, box.w, box.h);
    if (label) {
      ctx.font = 'bold 11px Arial';
      ctx.fillStyle = color;
      ctx.fillText(label, box.x + 3, box.y - 4);
    }
    ctx.restore();
  }

  ensureHitboxes();

  if (typeof Player !== 'undefined' && !Player.prototype.hitboxEditorPatchApplied) {
    const originalGetAttackData = Player.prototype.getAttackData;
    Player.prototype.getAttackData = function () {
      const data = originalGetAttackData.call(this);
      const key = this.comboStep === 3 ? 'attack3' : this.comboStep === 2 ? 'attack2' : 'attack1';
      const box = heroBox(this.heroKey, key);
      if (box) data.range = box.w;
      return data;
    };

    Player.prototype.getHitbox = function () {
      const key = this.comboStep === 3 ? 'attack3' : this.comboStep === 2 ? 'attack2' : 'attack1';
      return worldBox(this.x, this.y, this.facing, heroBox(this.heroKey, key));
    };

    Player.prototype.getBodyBox = function () {
      return worldBox(this.x, this.y, this.facing, heroBox(this.heroKey, 'body'));
    };

    Player.prototype.getCounterBox = function () {
      return worldBox(this.x, this.y, this.facing, heroBox(this.heroKey, 'counter'));
    };

    const originalCanCounterSlide = Player.prototype.canCounterSlide;
    Player.prototype.canCounterSlide = function (enemy) {
      if (this.state !== 'attack') return false;
      if (!enemy || typeof enemy.getHurtbox !== 'function') return false;
      const dy = Math.abs((enemy.y || 0) - this.y);
      const counter = this.getCounterBox ? this.getCounterBox() : null;
      return dy <= ((counter && counter.h / 2) || GAME_CONFIG.enemyAttackRangeY) && Combat.overlap(counter, enemy.getHurtbox());
    };

    const originalPlayerDraw = Player.prototype.draw;
    Player.prototype.draw = function (ctx, debug = false) {
      originalPlayerDraw.call(this, ctx, debug);
      if (!debug) return;
      strokeBox(ctx, this.getBodyBox(), COLORS.body, 'BODY');
      if (this.state === 'attack') {
        strokeBox(ctx, this.getHitbox(), COLORS.attack1, 'ATTACK');
        strokeBox(ctx, this.getCounterBox(), COLORS.counter, 'COUNTER');
      }
    };

    Player.prototype.hitboxEditorPatchApplied = true;
  }

  if (typeof DogRegimeEnemy !== 'undefined' && !DogRegimeEnemy.prototype.hitboxEditorPatchApplied) {
    DogRegimeEnemy.prototype.getHurtbox = function () {
      return worldBox(this.x, this.y, this.facing, enemyBox(this.enemyType, 'hurt'));
    };

    DogRegimeEnemy.prototype.getGroundBodyBox = function () {
      return worldBox(this.x, this.y, this.facing, enemyBox(this.enemyType, 'body'));
    };

    DogRegimeEnemy.prototype.getClubReachBox = function () {
      const b = enemyBox(this.enemyType, 'club');
      if (!b) return null;
      return worldBox(this.x, this.y, this.facing, b);
    };

    DogRegimeEnemy.prototype.canClubReachPlayer = function (player, anticipation = false) {
      if (!player || typeof player.getBodyBox !== 'function') return false;
      const reach = this.getClubReachBox && this.getClubReachBox();
      if (!reach) return false;
      const pad = anticipation ? 4 : 0;
      const paddedReach = { x: reach.x - pad, y: reach.y - pad, w: reach.w + pad * 2, h: reach.h + pad * 2 };
      return Combat.overlap(paddedReach, player.getBodyBox());
    };

    const originalEnemyDraw = DogRegimeEnemy.prototype.draw;
    DogRegimeEnemy.prototype.draw = function (ctx, debug = false) {
      originalEnemyDraw.call(this, ctx, false);
      if (!debug || !this.alive) return;
      strokeBox(ctx, this.getHurtbox(), COLORS.hurt, 'HURT');
      strokeBox(ctx, this.getGroundBodyBox(), COLORS.body, 'BODY');
      if (this.enemyType === 'dogRegime' || this.enemyType === 'zetnik') strokeBox(ctx, this.getClubReachBox(), COLORS.club, 'CLUB');
    };

    DogRegimeEnemy.prototype.hitboxEditorPatchApplied = true;
  }

  if (typeof SuckerEnemy !== 'undefined' && !SuckerEnemy.prototype.hitboxEditorPatchApplied) {
    SuckerEnemy.prototype.getSlideHitbox = function () {
      return worldBox(this.x, this.slideY || this.y, this.facing, enemyBox('sucker', 'slide'));
    };

    const originalSuckerDraw = SuckerEnemy.prototype.draw;
    SuckerEnemy.prototype.draw = function (ctx, debug = false) {
      originalSuckerDraw.call(this, ctx, debug);
      if (debug && this.alive && this.state === 'slide') strokeBox(ctx, this.getSlideHitbox(), COLORS.slide, 'SLIDE');
    };

    SuckerEnemy.prototype.hitboxEditorPatchApplied = true;
  }

  if (typeof DevPanel !== 'undefined' && !DevPanel.hitboxEditorPatchApplied) {
    if (!DevPanel.tabs.includes('HITBOXES')) DevPanel.tabs.push('HITBOXES');
    DevPanel.selectedHitboxEntityIndex = DevPanel.selectedHitboxEntityIndex || 0;
    DevPanel.selectedHitboxBoxIndex = DevPanel.selectedHitboxBoxIndex || 0;

    DevPanel.hitboxEntities = function () {
      return [
        { group: 'heroes', key: 'boris', label: 'Hero: Boris' },
        { group: 'heroes', key: 'alexey', label: 'Hero: Alexey' },
        { group: 'heroes', key: 'anna', label: 'Hero: Anna' },
        { group: 'enemies', key: 'dogRegime', label: 'Enemy: Dog' },
        { group: 'enemies', key: 'zetnik', label: 'Enemy: Zetnik' },
        { group: 'enemies', key: 'sucker', label: 'Enemy: Sucker' },
        { group: 'enemies', key: 'bastard', label: 'Enemy: Bastard' }
      ];
    };

    DevPanel.hitboxBoxKeys = function (entity) {
      const data = GAME_CONFIG.hitboxes[entity.group][entity.key] || {};
      return Object.keys(data);
    };

    DevPanel.getSelectedHitboxEntity = function () {
      const entities = this.hitboxEntities();
      this.selectedHitboxEntityIndex = ((this.selectedHitboxEntityIndex % entities.length) + entities.length) % entities.length;
      return entities[this.selectedHitboxEntityIndex];
    };

    DevPanel.getSelectedHitboxBoxKey = function () {
      const entity = this.getSelectedHitboxEntity();
      const keys = this.hitboxBoxKeys(entity);
      if (keys.length === 0) return null;
      this.selectedHitboxBoxIndex = ((this.selectedHitboxBoxIndex % keys.length) + keys.length) % keys.length;
      return keys[this.selectedHitboxBoxIndex];
    };

    DevPanel.getSelectedHitbox = function () {
      const entity = this.getSelectedHitboxEntity();
      const key = this.getSelectedHitboxBoxKey();
      return GAME_CONFIG.hitboxes[entity.group][entity.key][key];
    };

    DevPanel.hitboxEditorRects = function () {
      const panel = this.panelRect();
      const x = panel.x + 36;
      const y = panel.y + 122;
      return {
        box: { x, y, w: 978, h: 492 },
        entityPrev: { x: x + 110, y: y + 24, w: 36, h: 28 },
        entityNext: { x: x + 600, y: y + 24, w: 36, h: 28 },
        boxPrev: { x: x + 110, y: y + 64, w: 36, h: 28 },
        boxNext: { x: x + 600, y: y + 64, w: 36, h: 28 },
        preview: { x: x + 650, y: y + 24, w: 300, h: 420 }
      };
    };

    const originalHandleClick = DevPanel.handleClick;
    DevPanel.handleClick = function (point, game) {
      const panel = this.panelRect();
      if (!this.inRect(point, panel)) return;
      const close = { x: panel.x + panel.w - 78, y: panel.y + 14, w: 56, h: 32 };
      if (this.inRect(point, close)) { this.open = false; return; }
      const tab = this.getClickedTab(point);
      if (tab) { this.tab = tab; this.setStatus('Tab: ' + tab); return; }
      if (this.handleFooterClick(point, game)) return;
      if (this.tab === 'HITBOXES') { this.handleHitboxEditorClick(point, game); return; }
      originalHandleClick.call(this, point, game);
    };

    DevPanel.handleHitboxEditorClick = function (point, game) {
      const r = this.hitboxEditorRects();
      const entity = this.getSelectedHitboxEntity();
      const keys = this.hitboxBoxKeys(entity);
      if (this.inRect(point, r.entityPrev)) { this.selectedHitboxEntityIndex--; this.selectedHitboxBoxIndex = 0; this.setStatus('Entity changed'); return true; }
      if (this.inRect(point, r.entityNext)) { this.selectedHitboxEntityIndex++; this.selectedHitboxBoxIndex = 0; this.setStatus('Entity changed'); return true; }
      if (this.inRect(point, r.boxPrev)) { this.selectedHitboxBoxIndex--; this.setStatus('Box changed'); return true; }
      if (this.inRect(point, r.boxNext)) { this.selectedHitboxBoxIndex++; this.setStatus('Box changed'); return true; }

      const props = ['x', 'y', 'w', 'h'];
      const hb = this.getSelectedHitbox();
      for (let i = 0; i < props.length; i++) {
        const y = r.box.y + 140 + i * 46;
        const minus = { x: r.box.x + 118, y: y - 22, w: 34, h: 28 };
        const plus = { x: r.box.x + 452, y: y - 22, w: 34, h: 28 };
        const bar = { x: r.box.x + 166, y: y - 13, w: 270, h: 12 };
        const prop = props[i];
        const min = prop === 'w' || prop === 'h' ? 4 : -220;
        const max = prop === 'w' || prop === 'h' ? 260 : 220;
        if (this.inRect(point, minus)) { hb[prop] = Math.max(min, hb[prop] - 2); this.applyToCurrentScene(game); this.setStatus(prop + ': ' + hb[prop]); return true; }
        if (this.inRect(point, plus)) { hb[prop] = Math.min(max, hb[prop] + 2); this.applyToCurrentScene(game); this.setStatus(prop + ': ' + hb[prop]); return true; }
        if (this.inRect(point, bar)) {
          const ratio = Math.max(0, Math.min(1, (point.x - bar.x) / bar.w));
          hb[prop] = Math.round(min + ratio * (max - min));
          this.applyToCurrentScene(game);
          this.setStatus(prop + ': ' + hb[prop]);
          return true;
        }
      }
      return false;
    };

    const originalDraw = DevPanel.draw;
    DevPanel.draw = function (ctx) {
      if (!GAME_CONFIG.adminTuningEnabled) return;
      if (!this.open || this.tab !== 'HITBOXES') { originalDraw.call(this, ctx); return; }

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
      ctx.fillText('Hitbox editor: choose entity, choose rectangle, tune x/y/w/h, SAVE, then EXPORT.', panel.x + 22, panel.y + 58);
      this.drawButton(ctx, panel.x + panel.w - 78, panel.y + 14, 56, 32, 'X');
      this.drawTabs(ctx);
      this.drawHitboxEditor(ctx);
      this.drawFooter(ctx);
      this.drawStatus(ctx, panel);
    };

    DevPanel.drawHitboxEditor = function (ctx) {
      const r = this.hitboxEditorRects();
      const entity = this.getSelectedHitboxEntity();
      const boxKey = this.getSelectedHitboxBoxKey();
      const hb = this.getSelectedHitbox();

      ctx.fillStyle = 'rgba(255,255,255,0.06)';
      ctx.fillRect(r.box.x, r.box.y, r.box.w, r.box.h);
      ctx.strokeStyle = 'rgba(255,255,255,0.35)';
      ctx.strokeRect(r.box.x, r.box.y, r.box.w, r.box.h);

      ctx.fillStyle = '#ccc';
      ctx.font = '14px Arial';
      ctx.fillText('Entity:', r.box.x + 24, r.box.y + 43);
      this.drawButton(ctx, r.entityPrev.x, r.entityPrev.y, r.entityPrev.w, r.entityPrev.h, '<');
      this.drawButton(ctx, r.entityNext.x, r.entityNext.y, r.entityNext.w, r.entityNext.h, '>');
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 15px Arial';
      ctx.fillText(entity.label, r.box.x + 160, r.box.y + 43);

      ctx.fillStyle = '#ccc';
      ctx.font = '14px Arial';
      ctx.fillText('Box:', r.box.x + 24, r.box.y + 83);
      this.drawButton(ctx, r.boxPrev.x, r.boxPrev.y, r.boxPrev.w, r.boxPrev.h, '<');
      this.drawButton(ctx, r.boxNext.x, r.boxNext.y, r.boxNext.w, r.boxNext.h, '>');
      ctx.fillStyle = COLORS[boxKey] || '#fff';
      ctx.font = 'bold 15px Arial';
      ctx.fillText(String(boxKey).toUpperCase(), r.box.x + 160, r.box.y + 83);

      const props = ['x', 'y', 'w', 'h'];
      for (let i = 0; i < props.length; i++) this.drawHitboxSlider(ctx, props[i], hb[props[i]], r.box.x + 24, r.box.y + 140 + i * 46);

      this.drawHitboxPreview(ctx, r.preview, entity, boxKey);

      ctx.fillStyle = '#aaa';
      ctx.font = '12px Arial';
      ctx.fillText('Tip: x/y are offsets from feet anchor. w/h are rectangle size. Positive x goes forward when facing right.', r.box.x + 24, r.box.y + 370);
      ctx.fillText('After tuning: SAVE stores locally. EXPORT copies JSON to console/clipboard for permanent config update.', r.box.x + 24, r.box.y + 392);
    };

    DevPanel.drawHitboxSlider = function (ctx, prop, value, x, y) {
      const min = prop === 'w' || prop === 'h' ? 4 : -220;
      const max = prop === 'w' || prop === 'h' ? 260 : 220;
      const ratio = (value - min) / (max - min);
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 14px Arial';
      ctx.fillText(prop.toUpperCase(), x, y);
      ctx.fillStyle = '#ccc';
      ctx.fillText(String(value), x + 46, y);
      this.drawButton(ctx, x + 94, y - 22, 34, 28, '-');
      ctx.fillStyle = '#222';
      ctx.fillRect(x + 142, y - 13, 270, 12);
      ctx.fillStyle = '#55ccff';
      ctx.fillRect(x + 142, y - 13, 270 * Math.max(0, Math.min(1, ratio)), 12);
      ctx.strokeStyle = '#777';
      ctx.strokeRect(x + 142, y - 13, 270, 12);
      this.drawButton(ctx, x + 428, y - 22, 34, 28, '+');
    };

    DevPanel.drawHitboxPreview = function (ctx, rect, entity, selectedBoxKey) {
      ctx.fillStyle = 'rgba(0,0,0,0.34)';
      ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
      ctx.strokeStyle = 'rgba(255,255,255,0.35)';
      ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
      const anchor = { x: rect.x + rect.w / 2, y: rect.y + rect.h - 48 };
      const img = this.getPreviewImage(entity);
      if (img) {
        const scale = entity.group === 'heroes'
          ? ((GAME_CONFIG.heroes[entity.key] && GAME_CONFIG.heroes[entity.key].scale) || GAME_CONFIG.playerScale)
          : ((GAME_CONFIG.enemies[entity.key] && GAME_CONFIG.enemies[entity.key].scale) || GAME_CONFIG.enemyScale);
        const w = img.width * scale;
        const h = img.height * scale;
        ctx.drawImage(img, anchor.x - w / 2, anchor.y - h, w, h);
      }
      ctx.fillStyle = 'rgba(255,255,255,0.35)';
      ctx.fillRect(anchor.x - 5, anchor.y - 1, 10, 2);
      ctx.fillRect(anchor.x - 1, anchor.y - 5, 2, 10);

      const boxes = GAME_CONFIG.hitboxes[entity.group][entity.key] || {};
      for (const key of Object.keys(boxes)) {
        const b = worldBox(anchor.x, anchor.y, 1, boxes[key]);
        strokeBox(ctx, b, COLORS[key] || '#fff', key === selectedBoxKey ? key.toUpperCase() : '');
      }
    };

    DevPanel.getPreviewImage = function (entity) {
      const game = window.game || null;
      const images = game && game.images;
      if (!images) return null;
      if (entity.group === 'heroes') return images.heroes && images.heroes[entity.key] && images.heroes[entity.key].idle;
      return images.enemies && images.enemies[entity.key] && images.enemies[entity.key].idle;
    };

    const originalExportConfig = DevPanel.exportConfig;
    DevPanel.exportConfig = function () {
      originalExportConfig.call(this);
      console.log('STREETS_OF_RUSSIA_HITBOXES_ONLY');
      console.log(JSON.stringify(GAME_CONFIG.hitboxes, null, 2));
    };

    DevPanel.hitboxEditorPatchApplied = true;
  }
})();