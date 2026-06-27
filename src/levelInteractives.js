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

    const requests = [];
    const levels = GAME_CONFIG.levels || {};
    for (const key of Object.keys(levels)) {
      for (const item of getInteractivesForLevel(levels[key])) {
        if (!item.altBackground || loaded.levelInteractiveBackgrounds[item.altBackground]) continue;
        requests.push(loadImage(item.altBackground).then((image) => {
          loaded.levelInteractiveBackgrounds[item.altBackground] = image;
        }));
      }
    }

    await Promise.all(requests);
    return loaded;
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
    for (const item of getInteractivesForLevel(level)) {
      if (item.type !== 'breakablePoster') continue;
      const state = getPosterState(this, item);
      if (!state.replaced) drawPosterDamage(ctx, item, state);

      if (this.debug) {
        ctx.save();
        ctx.strokeStyle = 'rgba(255, 230, 90, 0.75)';
        ctx.lineWidth = 2;
        ctx.strokeRect(item.hitbox.x, item.hitbox.y, item.hitbox.w, item.hitbox.h);
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
}());
