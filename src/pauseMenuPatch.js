(function () {
  if (typeof GameApp === 'undefined') return;

  function pauseRect() {
    return { x: 18, y: 18, w: 82, h: 54 };
  }

  function resumeRect() {
    return { x: 390, y: 250, w: 500, h: 90 };
  }

  function menuRect() {
    return { x: 390, y: 370, w: 500, h: 90 };
  }

  function inRect(p, r) {
    return p && p.x >= r.x && p.x <= r.x + r.w && p.y >= r.y && p.y <= r.y + r.h;
  }

  function drawButton(ctx, r, label, active) {
    ctx.save();
    ctx.fillStyle = active ? 'rgba(130,0,0,0.82)' : 'rgba(0,0,0,0.58)';
    ctx.strokeStyle = active ? '#ffffff' : 'rgba(255,255,255,0.70)';
    ctx.lineWidth = active ? 5 : 3;
    ctx.fillRect(r.x, r.y, r.w, r.h);
    ctx.strokeRect(r.x, r.y, r.w, r.h);
    ctx.font = 'bold 30px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#fff';
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 5;
    ctx.strokeText(label, r.x + r.w / 2, r.y + r.h / 2 + 2);
    ctx.fillText(label, r.x + r.w / 2, r.y + r.h / 2 + 2);
    ctx.restore();
  }

  const originalUpdate = GameApp.prototype.update;
  GameApp.prototype.update = function (dt) {
    if (this.state === 'level') {
      if (Input.consume('escape')) {
        this.paused = !this.paused;
        AudioManager.playSfx('menuSelect', 0.65);
        return;
      }

      const click = Input.consumePointer();
      if (click) {
        if (inRect(click, pauseRect())) {
          this.paused = !this.paused;
          AudioManager.playSfx('menuSelect', 0.65);
          return;
        }

        if (this.paused) {
          if (inRect(click, resumeRect())) {
            this.paused = false;
            AudioManager.playSfx('menuSelect', 0.65);
            return;
          }
          if (inRect(click, menuRect())) {
            this.paused = false;
            this.setState('mainMenu');
            AudioManager.playSfx('menuSelect', 0.65);
            return;
          }
        }

        Input.restorePointer(click);
      }

      if (this.paused) return;
    }

    originalUpdate.call(this, dt);
  };

  const originalDraw = GameApp.prototype.draw;
  GameApp.prototype.draw = function () {
    originalDraw.call(this);
    if (this.state !== 'level') return;

    const ctx = this.ctx;
    drawButton(ctx, pauseRect(), this.paused ? '▶' : 'Ⅱ', false);

    if (!this.paused) return;
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.58)';
    ctx.fillRect(0, 0, GAME_CONFIG.width, GAME_CONFIG.height);
    ctx.font = 'bold 46px Arial';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#fff';
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 7;
    ctx.strokeText('ПАУЗА', GAME_CONFIG.width / 2, 190);
    ctx.fillText('ПАУЗА', GAME_CONFIG.width / 2, 190);
    ctx.restore();
    drawButton(ctx, resumeRect(), 'ПРОДОЛЖИТЬ', true);
    drawButton(ctx, menuRect(), 'В МЕНЮ', false);
  };
})();