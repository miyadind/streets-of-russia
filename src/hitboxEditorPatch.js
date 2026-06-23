(() => {
  if (typeof GAME_CONFIG === 'undefined') return;

  const COLORS = {
    body: '#ff3030',
    pushbox: '#ffd500',
    attack1: '#45ff45',
    attack2: '#45ff45',
    attack3: '#45ff45',
    attack: '#45ff45',
    slideAttack: '#45ff45',
    biteAttack: '#45ff45'
  };

  const DEFAULT_HITBOXES = {
    heroes: {
      boris: {
        body: { x: -34, y: -132, w: 68, h: 132 },
        pushbox: { x: -28, y: -20, w: 56, h: 36 },
        attack1: { x: 22, y: -118, w: 46, h: 40 },
        attack2: { x: 22, y: -118, w: 52, h: 40 },
        attack3: { x: 22, y: -118, w: 62, h: 40 }
      },
      alexey: {
        body: { x: -34, y: -132, w: 68, h: 132 },
        pushbox: { x: -28, y: -20, w: 56, h: 36 },
        attack1: { x: 22, y: -118, w: 46, h: 40 },
        attack2: { x: 22, y: -118, w: 52, h: 40 },
        attack3: { x: 22, y: -118, w: 62, h: 40 }
      },
      anna: {
        body: { x: -30, y: -124, w: 60, h: 124 },
        pushbox: { x: -24, y: -18, w: 48, h: 34 },
        attack1: { x: 20, y: -108, w: 42, h: 36 },
        attack2: { x: 20, y: -108, w: 48, h: 36 },
        attack3: { x: 20, y: -108, w: 56, h: 36 }
      }
    },
    enemies: {
      dogRegime: {
        body: { x: -38, y: -140, w: 76, h: 140 },
        pushbox: { x: -42, y: -20, w: 84, h: 40 },
        attack: { x: 28, y: -92, w: 58, h: 46 }
      },
      zetnik: {
        body: { x: -38, y: -140, w: 76, h: 140 },
        pushbox: { x: -42, y: -20, w: 84, h: 40 },
        attack: { x: 28, y: -92, w: 58, h: 46 }
      },
      sucker: {
        body: { x: -44, y: -150, w: 88, h: 150 },
        pushbox: { x: -52, y: -24, w: 104, h: 48 },
        slideAttack: { x: 8, y: -112, w: 88, h: 54 },
        biteAttack: { x: 18, y: -112, w: 62, h: 54 }
      },
      bastard: {
        body: { x: -38, y: -132, w: 76, h: 132 },
        pushbox: { x: -44, y: -20, w: 88, h: 40 },
        attack: { x: 26, y: -92, w: 54, h: 44 }
      }
    }
  };

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

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

  function migrateHitboxEntity(target, defaults) {
    if (!target || !defaults) return clone(defaults);
    if (target.hurt && !target.body) target.body = clone(target.hurt);
    if (target.club && !target.attack) target.attack = clone(target.club);
    if (target.slide && !target.slideAttack) target.slideAttack = clone(target.slide);
    delete target.hurt;
    delete target.club;
    delete target.counter;
    delete target.slide;
    mergeMissing(target, defaults);
    for (const key of Object.keys(target)) {
      if (!defaults[key]) delete target[key];
    }
    return target;
  }

  function ensureHitboxes() {
    if (!GAME_CONFIG.hitboxes) GAME_CONFIG.hitboxes = {};
    if (!GAME_CONFIG.hitboxes.heroes) GAME_CONFIG.hitboxes.heroes = {};
    if (!GAME_CONFIG.hitboxes.enemies) GAME_CONFIG.hitboxes.enemies = {};

    for (const key of Object.keys(DEFAULT_HITBOXES.heroes)) {
      GAME_CONFIG.hitboxes.heroes[key] = migrateHitboxEntity(GAME_CONFIG.hitboxes.heroes[key], DEFAULT_HITBOXES.heroes[key]);
    }
    for (const key of Object.keys(DEFAULT_HITBOXES.enemies)) {
      GAME_CONFIG.hitboxes.enemies[key] = migrateHitboxEntity(GAME_CONFIG.hitboxes.enemies[key], DEFAULT_HITBOXES.enemies[key]);
    }
  }

  function mirrorBox(box) {
    return { x: -box.x - box.w, y: box.y, w: box.w, h: box.h };
  }

  function worldBox(anchorX, anchorY, facing, box) {
    if (!box) return null;
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

  function boxOverlap(a, b) {
    return a && b && a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }

  ensureHitboxes();

  if (typeof Player !== 'undefined') {
    Player.prototype.getHitbox = function () {
      const key = this.comboStep === 3 ? 'attack3' : this.comboStep === 2 ? 'attack2' : 'attack1';
      return worldBox(this.x, this.y, this.facing, heroBox(this.heroKey, key));
    };

    Player.prototype.getBodyBox = function () {
      return worldBox(this.x, this.y, this.facing, heroBox(this.heroKey, 'body'));
    };

    Player.prototype.getPushbox = function () {
      return worldBox(this.x, this.y, this.facing, heroBox(this.heroKey, 'pushbox'));
    };

    Player.prototype.getCounterBox = function () {
      return null;
    };

    Player.prototype.canCounterSlide = function () {
      return false;
    };

    const originalPlayerDraw = Player.prototype.hitboxSimpleDrawOriginal || Player.prototype.draw;
    Player.prototype.hitboxSimpleDrawOriginal = originalPlayerDraw;
    Player.prototype.draw = function (ctx, debug = false) {
      originalPlayerDraw.call(this, ctx, false);
      if (!debug) return;
      strokeBox(ctx, this.getBodyBox(), COLORS.body, 'BODY');
      strokeBox(ctx, this.getPushbox(), COLORS.pushbox, 'PUSHBOX');
      if (this.state === 'attack') strokeBox(ctx, this.getHitbox(), COLORS.attack1, 'ATTACK');
    };
  }

  if (typeof DogRegimeEnemy !== 'undefined') {
    DogRegimeEnemy.prototype.getBodyBox = function () {
      return worldBox(this.x, this.y, this.facing, enemyBox(this.enemyType, 'body'));
    };

    DogRegimeEnemy.prototype.getHurtbox = function () {
      return this.getBodyBox();
    };

    DogRegimeEnemy.prototype.getPushbox = function () {
      return worldBox(this.x, this.y, this.facing, enemyBox(this.enemyType, 'pushbox'));
    };

    DogRegimeEnemy.prototype.getGroundBodyBox = function () {
      return this.getPushbox();
    };

    DogRegimeEnemy.prototype.getAttackBox = function () {
      return worldBox(this.x, this.y, this.facing, enemyBox(this.enemyType, 'attack'));
    };

    DogRegimeEnemy.prototype.getClubReachBox = function () {
      return this.getAttackBox();
    };

    DogRegimeEnemy.prototype.canClubReachPlayer = function (player, anticipation = false) {
      if (!player || typeof player.getBodyBox !== 'function') return false;
      const attack = this.getAttackBox();
      if (!anticipation) return boxOverlap(attack, player.getBodyBox());
      const pad = 4;
      return boxOverlap({ x: attack.x - pad, y: attack.y - pad, w: attack.w + pad * 2, h: attack.h + pad * 2 }, player.getBodyBox());
    };

    DogRegimeEnemy.prototype.isInAttackRange = function (player) {
      return this.canClubReachPlayer(player, true);
    };

    DogRegimeEnemy.prototype.updateAttack = function (dt, scene) {
      this.attackTimer += dt;
      const activeStart = GAME_CONFIG.enemyWindupMs;
      const activeEnd = GAME_CONFIG.enemyWindupMs + GAME_CONFIG.enemyActiveMs;

      if (!this.attackHasHit && this.attackTimer >= activeStart && this.attackTimer <= activeEnd) {
        const player = scene.player;
        if (this.canClubReachPlayer(player, false)) {
          const hit = player.receiveDamage(this.damage, { source: 'melee', knockbackX: this.facing * 18 });
          if (hit) scene.hitStop = 42;
        }
        this.attackHasHit = true;
      }

      if (this.attackTimer >= GAME_CONFIG.enemyWindupMs + GAME_CONFIG.enemyActiveMs + GAME_CONFIG.enemyRecoveryMs) {
        this.state = 'walk';
        this.intent = Math.random() < 0.58 ? 'retreat' : 'strafe';
        this.strafeDirection = Math.random() < 0.5 ? -1 : 1;
        this.retreatTimer = this.postAttackRetreatMs || 220;
        const min = this.attackCooldownMinMs || 300;
        const max = this.attackCooldownMaxMs || 520;
        this.cooldown = min + Math.random() * Math.max(1, max - min);
        this.attackTimer = 0;
        this.attackHasHit = false;
      }
    };

    const originalEnemyDraw = DogRegimeEnemy.prototype.hitboxSimpleDrawOriginal || DogRegimeEnemy.prototype.draw;
    DogRegimeEnemy.prototype.hitboxSimpleDrawOriginal = originalEnemyDraw;
    DogRegimeEnemy.prototype.draw = function (ctx, debug = false) {
      originalEnemyDraw.call(this, ctx, false);
      if (!debug || !this.alive) return;
      strokeBox(ctx, this.getBodyBox(), COLORS.body, 'BODY');
      strokeBox(ctx, this.getPushbox(), COLORS.pushbox, 'PUSHBOX');
      if (this.state === 'attack') strokeBox(ctx, this.getAttackBox(), COLORS.attack, 'ATTACK');
    };
  }

  if (typeof SuckerEnemy !== 'undefined') {
    SuckerEnemy.prototype.getSlideHitbox = function () {
      return worldBox(this.x, this.slideY || this.y, this.facing, enemyBox('sucker', 'slideAttack'));
    };

    SuckerEnemy.prototype.getBiteAttackBox = function () {
      return worldBox(this.x, this.y, this.facing, enemyBox('sucker', 'biteAttack'));
    };

    const originalSuckerDraw = SuckerEnemy.prototype.hitboxSimpleDrawOriginal || SuckerEnemy.prototype.draw;
    SuckerEnemy.prototype.hitboxSimpleDrawOriginal = originalSuckerDraw;
    SuckerEnemy.prototype.draw = function (ctx, debug = false) {
      originalSuckerDraw.call(this, ctx, debug);
      if (!debug || !this.alive) return;
      if (this.state === 'slide') strokeBox(ctx, this.getSlideHitbox(), COLORS.slideAttack, 'SLIDE_ATTACK');
      if (this.state === 'pinBite') strokeBox(ctx, this.getBiteAttackBox(), COLORS.biteAttack, 'BITE_ATTACK');
    };
  }

  if (typeof DevPanel !== 'undefined' && !DevPanel.hitboxEditorSimplePatchApplied) {
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

    const originalHandleClick = DevPanel.hitboxOriginalHandleClick || DevPanel.handleClick;
    DevPanel.hitboxOriginalHandleClick = originalHandleClick;
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
        const min = prop === 'w' || prop === 'h' ? 4 : -240;
        const max = prop === 'w' || prop === 'h' ? 280 : 240;
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

    const originalDraw = DevPanel.hitboxOriginalDraw || DevPanel.draw;
    DevPanel.hitboxOriginalDraw = originalDraw;
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
      ctx.fillText('Hitbox editor: BODY receives damage, ATTACK deals damage, PUSHBOX is only movement collision.', panel.x + 22, panel.y + 58);
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
      ctx.fillText('BODY + ATTACK are combat. PUSHBOX is only for spacing/separation.', r.box.x + 24, r.box.y + 370);
      ctx.fillText('SAVE stores locally. EXPORT prints hitboxes so they can be copied into permanent config.', r.box.x + 24, r.box.y + 392);
    };

    DevPanel.drawHitboxSlider = function (ctx, prop, value, x, y) {
      const min = prop === 'w' || prop === 'h' ? 4 : -240;
      const max = prop === 'w' || prop === 'h' ? 280 : 240;
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

    const originalExportConfig = DevPanel.hitboxOriginalExportConfig || DevPanel.exportConfig;
    DevPanel.hitboxOriginalExportConfig = originalExportConfig;
    DevPanel.exportConfig = function () {
      originalExportConfig.call(this);
      console.log('STREETS_OF_RUSSIA_HITBOXES_ONLY');
      console.log(JSON.stringify(GAME_CONFIG.hitboxes, null, 2));
    };

    DevPanel.hitboxEditorSimplePatchApplied = true;
  }
})();