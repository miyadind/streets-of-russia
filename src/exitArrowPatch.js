(function () {
  if (typeof LevelScene === 'undefined') return;

  function arrowPolygon(x, y, w, h) {
    const head = w * 0.24;
    return [
      [x, y],
      [x + w - head, y],
      [x + w - head, y - h * 0.18],
      [x + w, y + h / 2],
      [x + w - head, y + h + h * 0.18],
      [x + w - head, y + h],
      [x, y + h]
    ];
  }

  function drawPolygon(ctx, points) {
    ctx.beginPath();
    points.forEach(([px, py], i) => i ? ctx.lineTo(px, py) : ctx.moveTo(px, py));
    ctx.closePath();
  }

  function pointInPolygon(px, py, points) {
    let inside = false;
    for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
      const xi = points[i][0];
      const yi = points[i][1];
      const xj = points[j][0];
      const yj = points[j][1];
      const intersect = ((yi > py) !== (yj > py)) &&
        (px < (xj - xi) * (py - yi) / ((yj - yi) || 0.0001) + xi);
      if (intersect) inside = !inside;
    }
    return inside;
  }

  function drawLedDot(ctx, x, y, r, color, glow, alpha) {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = color;
    ctx.shadowColor = glow;
    ctx.shadowBlur = 4;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawExitLedArrow(ctx, x, y, phase) {
    const w = 90;
    const h = 32;
    const poly = arrowPolygon(x, y, w, h);
    const pulse = 0.5 + 0.5 * Math.sin(phase);

    ctx.save();

    ctx.shadowColor = 'rgba(80, 160, 255, 0.95)';
    ctx.shadowBlur = 8 + pulse * 6;
    ctx.fillStyle = 'rgba(30, 90, 190, 0.20)';
    drawPolygon(ctx, poly);
    ctx.fill();

    ctx.shadowBlur = 0;
    ctx.fillStyle = 'rgba(11, 13, 18, 0.92)';
    ctx.strokeStyle = 'rgba(215, 225, 240, 0.92)';
    ctx.lineWidth = 1.5;
    drawPolygon(ctx, poly);
    ctx.fill();
    ctx.stroke();

    const innerPad = 4;
    const innerPoly = arrowPolygon(x + innerPad, y + innerPad, w - innerPad * 2, h - innerPad * 2);
    ctx.fillStyle = 'rgba(2, 5, 9, 0.78)';
    ctx.strokeStyle = 'rgba(70, 82, 96, 0.92)';
    ctx.lineWidth = 1;
    drawPolygon(ctx, innerPoly);
    ctx.fill();
    ctx.stroke();

    const rows = 6;
    const cols = 18;
    const dotR = 1.75;
    const startX = x + innerPad + 6;
    const endX = x + w - innerPad - 7;
    const startY = y + innerPad + 4;
    const rowGap = (h - innerPad * 2 - 8) / Math.max(1, rows - 1);
    const colGap = (endX - startX) / Math.max(1, cols - 1);

    for (let row = 0; row < rows; row++) {
      let color = '#f7f8ff';
      let glow = 'rgba(245, 248, 255, 0.95)';
      if (row >= 2 && row <= 3) {
        color = '#0b74ff';
        glow = 'rgba(20, 145, 255, 1)';
      }

      for (let col = 0; col < cols; col++) {
        const cx = startX + col * colGap;
        const cy = startY + row * rowGap;
        if (!pointInPolygon(cx, cy, innerPoly)) continue;
        const wave = 0.76 + 0.24 * Math.sin(phase + col * 0.38 + row * 0.8);
        drawLedDot(ctx, cx, cy, dotR, color, glow, wave);
      }
    }

    ctx.shadowColor = 'rgba(70, 160, 255, 0.95)';
    ctx.shadowBlur = 4 + pulse * 4;
    ctx.strokeStyle = 'rgba(150, 210, 255, 0.92)';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(x + w - 18, y - 3);
    ctx.lineTo(x + w, y + h / 2);
    ctx.lineTo(x + w - 18, y + h + 3);
    ctx.stroke();

    ctx.restore();
  }

  LevelScene.prototype.draw = function (ctx) {
    const bg = this.images.streets[this.screenIndex] || this.images.streets[0];
    if (bg) ctx.drawImage(bg, 0, 0, GAME_CONFIG.width, GAME_CONFIG.height);
    else {
      ctx.fillStyle = '#222';
      ctx.fillRect(0, 0, GAME_CONFIG.width, GAME_CONFIG.height);
    }

    ctx.fillStyle = 'rgba(255,255,255,0.025)';
    ctx.fillRect(0, GAME_CONFIG.laneTop, GAME_CONFIG.width, GAME_CONFIG.laneBottom - GAME_CONFIG.laneTop);

    const entities = [{ type: 'player', y: this.player.y, ref: this.player }];
    for (const enemy of this.enemies) entities.push({ type: 'enemy', y: enemy.y, ref: enemy });
    entities.sort((a, b) => a.y - b.y);

    for (const entity of entities) entity.ref.draw(ctx, this.debug);

    if (this.encounterCleared) {
      const phase = performance.now() / 260;
      drawExitLedArrow(ctx, GAME_CONFIG.width - 128, 388, phase);
    }

    HUD.draw(ctx, this);

    if (this.debug) {
      ctx.strokeStyle = 'rgba(255,255,255,0.25)';
      ctx.lineWidth = 2;
      ctx.strokeRect(0, GAME_CONFIG.laneTop, GAME_CONFIG.width - 0, GAME_CONFIG.laneBottom - GAME_CONFIG.laneTop);
    }
  };

  if (typeof CharacterSelect !== 'undefined') {
    const goBackToMap = function (game) {
      AudioManager.playSfx('menuSelect', 0.65);
      game.setState('campaignMap');
    };

    CharacterSelect.update = function (game) {
      if (this.infoOpen) {
        if (Input.consume('escape') || Input.consume('i') || Input.consume('backspace') || Input.consume('enter') || Input.consume('space')) {
          this.closeInfo();
          return;
        }
        const infoClick = Input.consumePointer();
        if (infoClick) this.closeInfo();
        return;
      }

      if (Input.consume('arrowdown') || Input.consume('s')) {
        this.footerFocus = 'confirm';
        AudioManager.playSfx('menuMove', 0.65);
      }
      if (Input.consume('arrowup') || Input.consume('w')) {
        if (this.footerFocus) AudioManager.playSfx('menuMove', 0.65);
        this.footerFocus = null;
      }
      if (Input.consume('arrowleft') || Input.consume('a')) {
        if (this.footerFocus) this.moveFooterFocus(-1);
        else this.moveSelection(-1);
      }
      if (Input.consume('arrowright') || Input.consume('d')) {
        if (this.footerFocus) this.moveFooterFocus(1);
        else this.moveSelection(1);
      }

      if (Input.consume('i')) this.openInfo();
      if (Input.consume('escape')) {
        goBackToMap(game);
        return;
      }

      const click = Input.consumePointer();
      if (click) {
        for (let i = 0; i < this.heroes.length; i++) {
          const info = this.getInfoButtonBox(i);
          if (this.isPointInCircle(click, info)) {
            this.setSelection(i);
            this.footerFocus = null;
            this.openInfo();
            return;
          }
          const box = this.getCardBox(i);
          if (this.isPointInBox(click, box)) {
            this.setSelection(i);
            this.footerFocus = null;
          }
        }

        if (this.isPointInBox(click, this.getBackBox())) {
          goBackToMap(game);
          return;
        }
        if (this.isPointInBox(click, this.getConfirmBox())) {
          this.confirm(game);
          return;
        }
      }

      if (Input.consume('enter') || Input.consume('space')) {
        if (this.footerFocus === 'back') goBackToMap(game);
        else this.confirm(game);
      }
    };
  }
})();