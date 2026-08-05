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

    this.drawSupportButtons(ctx, scene, 745, 22);
    this.drawLowHpSwitchHint(ctx, scene);
    this.drawSuckerPinHint(ctx, scene);

    this.drawEnemyRoster(ctx, scene);
  },

  supportButtons: [
    { key: 'F', id: 'fact', icon: '!', color: '#4fc3ff' },
    { key: 'G', id: 'damage', icon: '*', color: '#ff5a58' },
    { key: 'H', id: 'heal', icon: '+', color: '#58e37b' },
    { key: 'J', id: 'special', icon: '?', color: '#ffd15a' },
    { key: 'K', id: 'stun', icon: '~', color: '#b58cff' }
  ],

  drawSupportButtons(ctx, scene, x = 745, y = 22) {
    const buttons = this.supportButtons || [];
    const buttonW = 58;
    const buttonH = 44;
    const gap = 8;

    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    for (let i = 0; i < buttons.length; i++) {
      const button = buttons[i];
      const bx = x + i * (buttonW + gap);
      const by = y;
      const active = scene && scene.pendingSupportCategory === button.id;

      ctx.fillStyle = active ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.44)';
      ctx.fillRect(bx, by, buttonW, buttonH);
      ctx.strokeStyle = active ? '#fff' : 'rgba(255,255,255,0.28)';
      ctx.lineWidth = active ? 2 : 1;
      ctx.strokeRect(bx + 0.5, by + 0.5, buttonW - 1, buttonH - 1);

      ctx.fillStyle = button.color;
      ctx.fillRect(bx + 8, by + 8, 24, 28);
      ctx.strokeStyle = 'rgba(0,0,0,0.38)';
      ctx.strokeRect(bx + 8.5, by + 8.5, 23, 27);

      ctx.fillStyle = '#111';
      ctx.font = 'bold 18px Arial';
      ctx.fillText(button.icon, bx + 20, by + 23);

      ctx.fillStyle = '#fff';
      ctx.font = 'bold 17px Arial';
      ctx.fillText(button.key, bx + 43, by + 23);
    }

    ctx.restore();
  },

  shouldShowLowHpSwitchHint(scene) {
    const game = scene && scene.game;
    const player = scene && scene.player;
    if (!game || !player || player.hp <= 0 || player.dead || player.state === 'knockdown') return false;
    if (game.state && game.state !== 'level') return false;
    if (game.paused || game.devPanelOpen || (typeof DevPanel !== 'undefined' && DevPanel.open)) return false;

    const maxHp = player.maxHp || (GAME_CONFIG.heroes[player.heroKey] && GAME_CONFIG.heroes[player.heroKey].hp) || 1;
    if (player.hp / maxHp > 0.3) return false;

    const heroes = (typeof CharacterSelect !== 'undefined' && CharacterSelect.heroes) || Object.keys(GAME_CONFIG.heroes || {});
    return heroes.some((key) => key !== player.heroKey && !(game.defeatedHeroes && game.defeatedHeroes[key]));
  },

  drawLowHpSwitchHint(ctx, scene) {
    if (!this.shouldShowLowHpSwitchHint(scene)) return;

    const now = performance.now();
    const pulse = 0.55 + 0.45 * Math.sin(now / 135);
    const x = GAME_CONFIG.width / 2 - 300;
    const y = this.getCombatHintY(scene, 94);
    const w = 600;
    const h = 44;

    ctx.save();
    ctx.globalAlpha = 0.72 + pulse * 0.28;
    ctx.fillStyle = 'rgba(120,0,0,0.86)';
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = '#ffd15a';
    ctx.lineWidth = 3;
    ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);

    ctx.fillStyle = '#ffd15a';
    ctx.font = 'bold 17px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('МАЛО ЖИЗНЕЙ', x + 110, y + h / 2);

    ctx.fillStyle = '#fff';
    ctx.font = 'bold 20px Arial';
    ctx.fillText('НАЖМИ C', x + 255, y + h / 2);

    ctx.font = 'bold 16px Arial';
    ctx.fillText('ЧТОБЫ СМЕНИТЬ ПЕРСОНАЖА', x + 445, y + h / 2);
    ctx.restore();
  },

  drawSuckerPinHint(ctx, scene) {
    const player = scene && scene.player;
    if (!scene || !scene.suckerPinHintActive || !player || player.state !== 'pinned') return;
    if (!player.pinnedBy || player.pinnedBy.enemyType !== 'sucker') return;

    const pulse = 0.72 + 0.28 * Math.sin(performance.now() / 95);
    const scale = 1 + pulse * 0.045;
    const text = 'НАЖМИ УДАР';
    const x = GAME_CONFIG.width / 2;
    const y = this.getCombatHintY(scene, 152, 188);

    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);
    ctx.globalAlpha = 0.78 + pulse * 0.22;
    ctx.font = 'bold 56px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = 'rgba(255,0,0,0.9)';
    ctx.shadowBlur = 18 + pulse * 18;
    ctx.lineWidth = 9;
    ctx.strokeStyle = 'rgba(0,0,0,0.92)';
    ctx.fillStyle = '#ff1d1d';
    ctx.strokeText(text, 0, 0);
    ctx.fillText(text, 0, 0);

    ctx.globalAlpha = 0.32 + pulse * 0.32;
    ctx.shadowBlur = 0;
    ctx.strokeStyle = '#ffb0b0';
    ctx.lineWidth = 2;
    ctx.strokeText(text, 0, 0);
    ctx.restore();
  },

  getCombatHintY(scene, regularY, bossY = 126) {
    const boss = scene && (scene.activeGundos || (scene.enemies || []).find((enemy) => enemy && enemy.enemyType === 'gundos' && enemy.alive));
    return boss ? bossY : regularY;
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
