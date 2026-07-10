const Combat = {
  overlap(a, b) {
    return !!a && !!b && a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  },

  sameLane(aY, bY, tolerance = GAME_CONFIG.yHitTolerance) {
    return Math.abs(aY - bY) <= tolerance;
  },

  sameFootLane(aY, bY, tolerance = GAME_CONFIG.yHitTolerance) {
    return this.sameLane(aY, bY, tolerance);
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
    if (Number.isFinite(actor.feetY)) return actor.feetY;
    if (Number.isFinite(actor.y)) return actor.y;
    const box = typeof actor.getPushbox === 'function' ? actor.getPushbox() :
      typeof actor.getBodyBox === 'function' ? actor.getBodyBox() :
      typeof actor.getHurtbox === 'function' ? actor.getHurtbox() : null;
    return box ? box.y + box.h : GAME_CONFIG.laneTop;
  },

  actorFeetY(actor) {
    return this.actorLaneY(actor);
  },

  actorsSameLane(a, b, tolerance = GAME_CONFIG.yHitTolerance) {
    return this.sameLane(this.actorLaneY(a), this.actorLaneY(b), tolerance);
  },

  actorsSameFootLane(a, b, tolerance = GAME_CONFIG.yHitTolerance) {
    return this.sameFootLane(this.actorFeetY(a), this.actorFeetY(b), tolerance);
  },

  actorFootTolerance(actor, fallback = GAME_CONFIG.yHitTolerance) {
    if (!actor) return fallback;
    if (Number.isFinite(actor.footTolerance)) return actor.footTolerance;
    if (Number.isFinite(actor.hitLaneTolerance)) return actor.hitLaneTolerance;

    const pushbox = typeof actor.getPushbox === 'function' ? actor.getPushbox() : null;
    if (pushbox && Number.isFinite(pushbox.h)) {
      return Math.max(14, Math.min(fallback, pushbox.h * 0.62));
    }

    return fallback;
  },

  actorFootBand(actor, tolerance = this.actorFootTolerance(actor)) {
    const y = this.actorFeetY(actor);
    const radius = Math.max(1, tolerance || GAME_CONFIG.yHitTolerance || 28);
    return { top: y - radius, bottom: y + radius, center: y, radius };
  },

  footBandsOverlap(a, b, tolerance = GAME_CONFIG.yHitTolerance) {
    const aBand = this.actorFootBand(a, this.actorFootTolerance(a, tolerance));
    const bBand = this.actorFootBand(b, this.actorFootTolerance(b, tolerance));
    return aBand.top <= bBand.bottom && aBand.bottom >= bBand.top;
  },

  verticalBandsOverlap(aTop, aBottom, bTop, bBottom, tolerance = 0) {
    return aTop <= bBottom + tolerance && aBottom >= bTop - tolerance;
  },

  pushboxLaneCanConnect(attacker, target, tolerance = GAME_CONFIG.pushboxLaneTolerance || 12) {
    const attackerPush = attacker && typeof attacker.getPushbox === 'function' ? attacker.getPushbox() : null;
    const targetPush = target && typeof target.getPushbox === 'function' ? target.getPushbox() : null;
    if (!attackerPush || !targetPush) return null;
    return this.verticalBandsOverlap(
      attackerPush.y,
      attackerPush.y + attackerPush.h,
      targetPush.y,
      targetPush.y + targetPush.h,
      tolerance
    );
  },

  actorOnLane(actor, laneY, tolerance = GAME_CONFIG.yHitTolerance) {
    if (!Number.isFinite(laneY)) return true;
    const band = this.actorFootBand(actor, tolerance);
    return laneY >= band.top && laneY <= band.bottom;
  },

  laneCanConnect(attacker, target, options = {}) {
    const pushboxResult = this.pushboxLaneCanConnect(attacker, target, options.pushboxLaneTolerance);
    if (pushboxResult !== null) return pushboxResult;

    const tolerance = options.laneTolerance || GAME_CONFIG.yHitTolerance || 28;
    if (Number.isFinite(options.laneY)) return this.actorOnLane(target, options.laneY, tolerance);
    return this.footBandsOverlap(attacker, target, tolerance);
  },

  canHit(attacker, target, options = {}) {
    if (!attacker || !target) return false;
    const attackBox = options.attackBox ||
      (typeof attacker.getAttackBox === 'function' ? attacker.getAttackBox() :
        typeof attacker.getHitbox === 'function' ? attacker.getHitbox() : null);
    const targetBox = options.targetBox ||
      (typeof target.getBodyBox === 'function' ? target.getBodyBox() :
        typeof target.getHurtbox === 'function' ? target.getHurtbox() : null);

    return this.laneCanConnect(attacker, target, options) && this.overlap(attackBox, targetBox);
  },

  canMeleeHit(attacker, target, options = {}) {
    return this.canHit(attacker, target, options);
  },

  canProjectileHit(projectile, target, options = {}) {
    const attackBox = options.attackBox ||
      (typeof projectile.getAttackBox === 'function' ? projectile.getAttackBox() :
        typeof projectile.getHurtbox === 'function' ? projectile.getHurtbox() : null);
    const targetBox = options.targetBox ||
      (typeof target.getBodyBox === 'function' ? target.getBodyBox() :
        typeof target.getHurtbox === 'function' ? target.getHurtbox() : null);
    return this.laneCanConnect(projectile, target, {
      laneY: Number.isFinite(options.laneY) ? options.laneY : projectile.laneY,
      laneTolerance: options.laneTolerance || GAME_CONFIG.yHitTolerance
    }) && this.overlap(attackBox, targetBox);
  },

  canInteractHit(attacker, item, options = {}) {
    if (!attacker || !item) return false;
    const attackBox = options.attackBox ||
      (typeof attacker.getHitbox === 'function' ? attacker.getHitbox() :
        typeof attacker.getAttackBox === 'function' ? attacker.getAttackBox() : null);
    if (!this.overlap(attackBox, item.hitbox)) return false;
    if (!Number.isFinite(item.laneY)) return true;
    return this.actorOnLane(attacker, item.laneY, item.laneTolerance || GAME_CONFIG.yHitTolerance);
  }
};
