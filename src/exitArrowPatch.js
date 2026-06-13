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
    ctx.shadowBlur = 9;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawExitLedArrow(ctx, x, y, phase) {
    const w = 270;
    const h = 96;
    const poly = arrowPolygon(x, y, w, h);
    const pulse = 0.5 + 0.5 * Math.sin(phase);

    ctx.save();

    ctx.shadowColor = 'rgba(80, 160, 255, 0.95)';
    ctx.shadowBlur = 18 + pulse * 14;
    ctx.fillStyle = 'rgba(30, 90, 190, 0.20)';
    drawPolygon(ctx, poly);
    ctx.fill();

    ctx.shadowBlur = 0;
    ctx.fillStyle = 'rgba(11, 13, 18, 0.92)';
    ctx.strokeStyle = 'rgba(215, 225, 240, 0.92)';
    ctx.lineWidth = 3;
    drawPolygon(ctx, poly);
    ctx.fill();
    ctx.stroke();

    const innerPad = 12;
    const innerPoly = arrowPolygon(x + innerPad, y + innerPad, w - innerPad * 2, h - innerPad * 2);
    ctx.fillStyle = 'rgba(2, 5, 9, 0.78)';
    ctx.strokeStyle = 'rgba(70, 82, 96, 0.92)';
    ctx.lineWidth = 2;
    drawPolygon(ctx, innerPoly);
    ctx.fill();
    ctx.stroke();

    const rows = 6;
    const cols = 24;
    const dotR = 4.8;
    const startX = x + innerPad + 16;
    const endX = x + w - innerPad - 19;
    const startY = y + innerPad + 11;
    const rowGap = (h - innerPad * 2 - 22) / Math.max(1, rows - 1);
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
    ctx.shadowBlur = 10 + pulse * 8;
    ctx.strokeStyle = 'rgba(150, 210, 255, 0.92)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(x + w - 54, y - 10);
    ctx.lineTo(x + w, y + h / 2);
    ctx.lineTo(x + w - 54, y + h + 10);
    ctx.stroke();

    ctx.shadowBlur = 0;
    ctx.font = 'bold 18px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = 'rgba(255,255,255,0.88)';
    ctx.strokeStyle = 'rgba(0,0,0,0.78)';
    ctx.lineWidth = 4;
    ctx.strokeText('ВПЕРЁД', x + w / 2 - 18, y + h + 34);
    ctx.fillText('ВПЕРЁД', x + w / 2 - 18, y + h + 34);

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
      drawExitLedArrow(ctx, GAME_CONFIG.width - 345, 340, phase);
    }

    HUD.draw(ctx, this);

    if (this.debug) {
      ctx.strokeStyle = 'rgba(255,255,255,0.25)';
      ctx.lineWidth = 2;
      ctx.strokeRect(0, GAME_CONFIG.laneTop, GAME_CONFIG.width - 0, GAME_CONFIG.laneBottom - GAME_CONFIG.laneTop);
    }
  };
})();