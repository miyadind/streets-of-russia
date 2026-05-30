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
  }
};
