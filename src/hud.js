const HUD = {
  draw(ctx, scene) {
    ctx.fillStyle = 'rgba(0,0,0,0.62)';
    ctx.fillRect(0, 0, GAME_CONFIG.width, 86);

    const order = ['alexey', 'anna', 'boris'];
    for (let i = 0; i < order.length; i++) {
      const key = order[i];
      const hero = GAME_CONFIG.heroes[key];
      const x = 20 + i * 205;
      const active = scene.player.heroKey === key;

      ctx.fillStyle = active ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.04)';
      ctx.fillRect(x, 12, 180, 60);

      ctx.fillStyle = hero.color;
      ctx.fillRect(x + 8, 18, 42, 42);
      ctx.fillStyle = '#111';
      ctx.font = 'bold 14px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(hero.name[0], x + 29, 44);
      ctx.textAlign = 'left';

      ctx.fillStyle = '#fff';
      ctx.font = 'bold 14px Arial';
      ctx.fillText(hero.name, x + 58, 28);

      const hp = active ? scene.player.hp : hero.hp;
      const pct = Math.max(0, hp / hero.hp);
      ctx.fillStyle = '#222';
      ctx.fillRect(x + 58, 38, 108, 12);
      ctx.fillStyle = pct > 0.55 ? 'lime' : pct > 0.25 ? 'yellow' : 'red';
      ctx.fillRect(x + 58, 38, 108 * pct, 12);
      ctx.strokeStyle = '#777';
      ctx.strokeRect(x + 58, 38, 108, 12);
    }

    ctx.fillStyle = '#222';
    ctx.fillRect(875, 30, 330, 16);
    ctx.fillStyle = 'cyan';
    const progress = ((scene.screenIndex + (scene.encounterCleared ? 1 : 0.35)) / scene.images.streets.length);
    ctx.fillRect(875, 30, 330 * Math.min(1, progress), 16);
    ctx.strokeStyle = '#ddd';
    ctx.strokeRect(875, 30, 330, 16);

    ctx.fillStyle = '#aaa';
    ctx.font = '12px Arial';
    ctx.fillText('H debug', 1138, 66);

    this.drawEnemyRoster(ctx, scene);
  },

  drawEnemyRoster(ctx, scene) {
    const enemies = (scene.enemies || []).filter(enemy => enemy && enemy.alive && !enemy.remove);
    if (enemies.length === 0) return;

    const maxVisible = 6;
    const visibleEnemies = enemies.slice(0, maxVisible);
    const cardW = 170;
    const cardH = 46;
    const gap = 6;
    const x = GAME_CONFIG.width - cardW - 18;
    const startY = 96;

    for (let i = 0; i < visibleEnemies.length; i++) {
      const enemy = visibleEnemies[i];
      const y = startY + i * (cardH + gap);
      const config = (GAME_CONFIG.enemies && GAME_CONFIG.enemies[enemy.enemyType]) || {};
      const name = config.name || enemy.enemyType || 'Враг';
      const portrait = this.getEnemyPortraitImage(scene, enemy);

      ctx.fillStyle = 'rgba(0,0,0,0.56)';
      ctx.fillRect(x, y, cardW, cardH);
      ctx.strokeStyle = 'rgba(255,255,255,0.24)';
      ctx.strokeRect(x, y, cardW, cardH);

      ctx.fillStyle = 'rgba(255,255,255,0.08)';
      ctx.fillRect(x + 6, y + 5, 36, 36);
      if (portrait) this.drawEnemyPortrait(ctx, portrait, x + 6, y + 5, 36);

      ctx.fillStyle = '#fff';
      ctx.font = 'bold 13px Arial';
      ctx.textAlign = 'left';
      ctx.fillText(this.shorten(name, 15), x + 50, y + 28);
    }

    if (enemies.length > maxVisible) {
      const moreY = startY + maxVisible * (cardH + gap);
      ctx.fillStyle = 'rgba(0,0,0,0.46)';
      ctx.fillRect(x, moreY, cardW, 24);
      ctx.fillStyle = '#ddd';
      ctx.font = 'bold 12px Arial';
      ctx.fillText(`+${enemies.length - maxVisible} ещё`, x + 12, moreY + 16);
    }
  },

  getEnemyPortraitImage(scene, enemy) {
    const enemyImages = scene.images && scene.images.enemies && scene.images.enemies[enemy.enemyType];
    if (!enemyImages) return null;
    if (enemyImages.portrait) return enemyImages.portrait;
    if (enemyImages.idle) return enemyImages.idle;
    if (enemyImages.walk && enemyImages.walk[0]) return enemyImages.walk[0];
    if (enemyImages.attack && enemyImages.attack[0]) return enemyImages.attack[0];
    return null;
  },

  drawEnemyPortrait(ctx, img, x, y, size) {
    if (!img || !img.width || !img.height) return;

    ctx.save();
    ctx.beginPath();
    ctx.rect(x, y, size, size);
    ctx.clip();

    const sourceH = Math.max(1, img.height * 0.58);
    const sourceW = Math.min(img.width, sourceH);
    const sourceX = Math.max(0, (img.width - sourceW) / 2);
    const sourceY = 0;

    ctx.drawImage(img, sourceX, sourceY, sourceW, sourceH, x, y, size, size);
    ctx.restore();

    ctx.strokeStyle = 'rgba(255,255,255,0.25)';
    ctx.strokeRect(x, y, size, size);
  },

  shorten(text, maxLength) {
    const safe = String(text || '');
    if (safe.length <= maxLength) return safe;
    return safe.slice(0, Math.max(1, maxLength - 1)) + '…';
  }
};