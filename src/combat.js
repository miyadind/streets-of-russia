const Combat = {
  overlap(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  },

  sameLane(aY, bY, tolerance = GAME_CONFIG.yHitTolerance) {
    if (GAME_CONFIG.discreteCombatLanes !== false) {
      return this.laneIndex(aY) === this.laneIndex(bY);
    }
    return Math.abs(aY - bY) <= tolerance;
  },

  laneIndex(y) {
    const top = GAME_CONFIG.laneTop;
    const bottom = GAME_CONFIG.laneBottom;
    const count = Math.max(1, GAME_CONFIG.combatLaneCount || 3);
    const laneHeight = Math.max(1, (bottom - top) / count);
    const index = Math.floor((y - top) / laneHeight);
    return Math.max(0, Math.min(count - 1, index));
  },

  laneCenter(index) {
    const top = GAME_CONFIG.laneTop;
    const bottom = GAME_CONFIG.laneBottom;
    const count = Math.max(1, GAME_CONFIG.combatLaneCount || 3);
    const laneHeight = Math.max(1, (bottom - top) / count);
    return top + laneHeight * (Math.max(0, Math.min(count - 1, index)) + 0.5);
  },

  actorLaneY(actor) {
    if (!actor) return GAME_CONFIG.laneTop;
    if (Number.isFinite(actor.laneY)) return actor.laneY;
    if (Number.isFinite(actor.y)) return actor.y;
    const box = typeof actor.getPushbox === 'function' ? actor.getPushbox() :
      typeof actor.getBodyBox === 'function' ? actor.getBodyBox() :
      typeof actor.getHurtbox === 'function' ? actor.getHurtbox() : null;
    return box ? box.y + box.h : GAME_CONFIG.laneTop;
  },

  actorsSameLane(a, b, tolerance = GAME_CONFIG.yHitTolerance) {
    return this.sameLane(this.actorLaneY(a), this.actorLaneY(b), tolerance);
  }
};
