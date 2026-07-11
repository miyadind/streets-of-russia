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

  const ANATOMICAL_HITBOX_VERSION = 2;

  const SPRITE_METRICS = {
    heroes: {
      boris: { w: 1254, h: 1254, scalePath: 'heroes.boris.scale' },
      alexey: { w: 1024, h: 1024, scalePath: 'heroes.alexey.scale' },
      anna: { w: 1024, h: 1536, scalePath: 'heroes.anna.scale' }
    },
    enemies: {
      dogRegime: { w: 1122, h: 1340, scalePath: 'enemies.dogRegime.scale' },
      zetnik: { w: 1024, h: 1536, scalePath: 'enemies.zetnik.scale' },
      sucker: { w: 1024, h: 1536, scalePath: 'enemies.sucker.scale' },
      bastard: { w: 1122, h: 1402, scalePath: 'enemies.bastard.scale' },
      horse: { w: 760, h: 934, scalePath: 'enemies.horse.scale' },
      gundos: { w: 1536, h: 1024, scalePath: 'enemies.gundos.scale' }
    }
  };

  const ANATOMY_PROFILES = {
    boris: { bodyW: 0.36, minBodyW: 68, bodyH: 0.78, bodyTop: 0.96, pushW: 0.34, pushH: 0.16, attackY: 0.76, attackH: 0.24, reach: [0.26, 0.3, 0.36] },
    alexey: { bodyW: 0.34, minBodyW: 64, bodyH: 0.79, bodyTop: 0.96, pushW: 0.32, pushH: 0.16, attackY: 0.76, attackH: 0.24, reach: [0.28, 0.33, 0.39] },
    anna: { bodyW: 0.28, minBodyW: 58, bodyH: 0.74, bodyTop: 0.95, pushW: 0.3, pushH: 0.14, attackY: 0.72, attackH: 0.22, reach: [0.27, 0.31, 0.37] },
    humanEnemy: { bodyW: 0.42, minBodyW: 72, bodyH: 0.92, bodyTop: 0.99, pushW: 0.42, pushH: 0.18, attackY: 0.66, attackH: 0.28, attackW: 0.52 },
    skinnyEnemy: { bodyW: 0.36, minBodyW: 64, bodyH: 0.9, bodyTop: 0.99, pushW: 0.38, pushH: 0.16, attackY: 0.66, attackH: 0.27, attackW: 0.55 },
    sucker: { bodyW: 0.5, minBodyW: 82, bodyH: 0.88, bodyTop: 0.99, pushW: 0.46, pushH: 0.18, slideY: 0.66, slideH: 0.27, slideW: 0.62, biteY: 0.64, biteH: 0.28, biteW: 0.45 },
    horse: { bodyW: 0.45, minBodyW: 46, bodyH: 0.86, bodyTop: 0.99, pushW: 0.5, pushH: 0.2, attackY: 0.63, attackH: 0.3, attackW: 0.58 },
    gundos: { bodyW: 0.26, bodyH: 0.88, bodyTop: 0.98, pushW: 0.3, pushH: 0.18, attackY: 0.66, attackH: 0.3, attackW: 0.42 }
  };

  function getByPath(path, fallback) {
    const parts = String(path || '').split('.');
    let node = GAME_CONFIG;
    for (const part of parts) {
      if (!node || node[part] == null) return fallback;
      node = node[part];
    }
    return Number(node) || fallback;
  }

  function roundBox(box) {
    return {
      x: Math.round(box.x),
      y: Math.round(box.y),
      w: Math.max(1, Math.round(box.w)),
      h: Math.max(1, Math.round(box.h))
    };
  }

  function metric(group, key) {
    const data = SPRITE_METRICS[group] && SPRITE_METRICS[group][key];
    const scale = data ? getByPath(data.scalePath, group === 'heroes' ? GAME_CONFIG.playerScale : GAME_CONFIG.enemyScale) :
      (group === 'heroes' ? GAME_CONFIG.playerScale : GAME_CONFIG.enemyScale);
    return {
      w: (data ? data.w : 1024) * scale,
      h: (data ? data.h : 1340) * scale
    };
  }

  function scaleSignature() {
    const parts = [];
    for (const group of Object.keys(SPRITE_METRICS)) {
      for (const key of Object.keys(SPRITE_METRICS[group])) {
        const data = SPRITE_METRICS[group][key];
        parts.push(group + ':' + key + '=' + getByPath(data.scalePath, group === 'heroes' ? GAME_CONFIG.playerScale : GAME_CONFIG.enemyScale));
      }
    }
    return parts.join('|');
  }

  function bodyBox(size, profile) {
    const w = Math.max(profile.minBodyW || 1, size.w * profile.bodyW);
    const h = size.h * profile.bodyH;
    const bottom = -size.h * (1 - profile.bodyTop);
    return roundBox({ x: -w / 2, y: bottom - h, w, h });
  }

  function pushBox(size, profile) {
    const w = size.w * profile.pushW;
    const h = size.h * profile.pushH;
    return roundBox({ x: -w / 2, y: -h, w, h });
  }

  function attackBox(size, profile, reach) {
    const h = size.h * profile.attackH;
    const w = size.w * reach;
    return roundBox({
      x: size.w * 0.14,
      y: -size.h * profile.attackY,
      w,
      h
    });
  }

  function makeHeroBoxes(key) {
    const size = metric('heroes', key);
    const profile = ANATOMY_PROFILES[key];
    return {
      body: bodyBox(size, profile),
      pushbox: pushBox(size, profile),
      attack1: attackBox(size, profile, profile.reach[0]),
      attack2: attackBox(size, profile, profile.reach[1]),
      attack3: attackBox(size, profile, profile.reach[2])
    };
  }

  function makeEnemyBoxes(key, profileKey) {
    const size = metric('enemies', key);
    const profile = ANATOMY_PROFILES[profileKey || 'humanEnemy'];
    return {
      body: bodyBox(size, profile),
      pushbox: pushBox(size, profile),
      attack: attackBox(size, profile, profile.attackW || 0.5)
    };
  }

  function makeSuckerBoxes() {
    const size = metric('enemies', 'sucker');
    const profile = ANATOMY_PROFILES.sucker;
    return {
      body: bodyBox(size, profile),
      pushbox: pushBox(size, profile),
      slideAttack: roundBox({ x: size.w * 0.04, y: -size.h * profile.slideY, w: size.w * profile.slideW, h: size.h * profile.slideH }),
      biteAttack: roundBox({ x: size.w * 0.12, y: -size.h * profile.biteY, w: size.w * profile.biteW, h: size.h * profile.biteH })
    };
  }

  const DEFAULT_HITBOXES = {
    heroes: {
      boris: makeHeroBoxes('boris'),
      alexey: makeHeroBoxes('alexey'),
      anna: makeHeroBoxes('anna')
    },
    enemies: {
      dogRegime: makeEnemyBoxes('dogRegime', 'humanEnemy'),
      zetnik: makeEnemyBoxes('zetnik', 'skinnyEnemy'),
      sucker: makeSuckerBoxes(),
      bastard: makeEnemyBoxes('bastard', 'humanEnemy'),
      horse: makeEnemyBoxes('horse', 'horse'),
      gundos: makeEnemyBoxes('gundos', 'gundos')
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
    const signature = scaleSignature();
    if (!GAME_CONFIG.hitboxes ||
        GAME_CONFIG.hitboxes.profileVersion !== ANATOMICAL_HITBOX_VERSION ||
        GAME_CONFIG.hitboxes.scaleSignature !== signature) {
      GAME_CONFIG.hitboxes = {
        profileVersion: ANATOMICAL_HITBOX_VERSION,
        scaleSignature: signature,
        heroes: {},
        enemies: {}
      };
    }
    if (!GAME_CONFIG.hitboxes.heroes) GAME_CONFIG.hitboxes.heroes = {};
    if (!GAME_CONFIG.hitboxes.enemies) GAME_CONFIG.hitboxes.enemies = {};
    GAME_CONFIG.hitboxes.profileVersion = ANATOMICAL_HITBOX_VERSION;
    GAME_CONFIG.hitboxes.scaleSignature = signature;

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
      const hero = GAME_CONFIG.heroes && (GAME_CONFIG.heroes[this.heroKey] || GAME_CONFIG.heroes.boris);
      const knockdownBody = (this.state === 'knockdown' || this.state === 'pinned') && hero && hero.knockdownBody;
      if (knockdownBody) {
        const w = Math.max(1, knockdownBody.w || 160);
        const h = Math.max(1, knockdownBody.h || 44);
        return {
          x: this.x - w / 2,
          y: this.y - h,
          w,
          h
        };
      }
      return worldBox(this.x, this.y, this.facing, heroBox(this.heroKey, 'body'));
    };

    Player.prototype.getPushbox = function () {
      return worldBox(this.x, this.y, this.facing, heroBox(this.heroKey, 'pushbox'));
    };

    Player.prototype.canCounterSlide = function (enemy) {
      if (this.state !== 'attack' || !enemy) return false;
      if (typeof Combat !== 'undefined' && Combat.laneCanConnect && !Combat.laneCanConnect(this, enemy, {
        laneTolerance: (GAME_CONFIG.enemies.sucker && GAME_CONFIG.enemies.sucker.counterRangeY) || GAME_CONFIG.yHitTolerance
      })) return false;
      const data = this.getAttackData();
      if (this.attackTimer < data.activeStart || this.attackTimer > data.activeEnd) return false;

      const config = (GAME_CONFIG.enemies && GAME_CONFIG.enemies.sucker) || {};
      const rangeX = config.counterRangeX || 150;
      const rangeY = config.counterRangeY || GAME_CONFIG.enemyAttackRangeY || 58;
      const counterZone = {
        x: this.facing === 1 ? this.x : this.x - rangeX,
        y: this.y - rangeY,
        w: rangeX,
        h: rangeY * 2
      };
      const forgiveness = 26;
      const targets = [];
      if (enemy.state === 'slide' && typeof enemy.getSlideHitbox === 'function') targets.push(enemy.getSlideHitbox());
      if (typeof enemy.getHurtbox === 'function') targets.push(enemy.getHurtbox());

      return targets.some(target => target && Combat.canMeleeHit(this, enemy, {
        attackBox: counterZone,
        targetBox: {
        x: target.x - forgiveness,
        y: target.y - forgiveness,
        w: target.w + forgiveness * 2,
        h: target.h + forgiveness * 2
        },
        laneTolerance: rangeY
      }));
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
      const pad = 4;
      const activeBox = anticipation ?
        { x: attack.x - pad, y: attack.y - pad, w: attack.w + pad * 2, h: attack.h + pad * 2 } :
        attack;
      return Combat.canMeleeHit(this, player, {
        attackBox: activeBox,
        targetBox: player.getBodyBox(),
        laneTolerance: anticipation ? (this.attackRangeY || GAME_CONFIG.yHitTolerance) : GAME_CONFIG.yHitTolerance
      });
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
