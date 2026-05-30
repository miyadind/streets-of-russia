const Combat = {
  overlap(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  },

  sameLane(aY, bY, tolerance = GAME_CONFIG.yHitTolerance) {
    return Math.abs(aY - bY) <= tolerance;
  }
};
