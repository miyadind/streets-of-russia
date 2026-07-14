(function () {
  if (typeof LevelScene === 'undefined') return;

  function ensurePickupList(scene) {
    if (!scene.pickups) scene.pickups = [];
    return scene.pickups;
  }

  if (!LevelScene.prototype.pickupDropFinalPatchApplied) {
    const previousDraw = LevelScene.prototype.draw;
    LevelScene.prototype.draw = function (ctx) {
      previousDraw.call(this, ctx);
      const pickups = ensurePickupList(this);
      if (!pickups.length) return;
      for (const pickup of pickups) {
        if (!pickup || pickup.remove || typeof pickup.draw !== 'function') continue;
        pickup.draw(ctx);
      }
    };

    const previousMaybeDropPickup = LevelScene.prototype.maybeDropPickup;
    LevelScene.prototype.maybeDropPickup = function (enemy) {
      if (!enemy || enemy.pickupDropped || enemy.gundosMinion) return;

      if (previousMaybeDropPickup) {
        previousMaybeDropPickup.call(this, enemy);
      }

      if (enemy.pickupDropped) return;
      const drops = GAME_CONFIG.enemyPickupDrops || {};
      const pickupType = drops[enemy.enemyType];
      if (!pickupType || typeof HealthPickup === 'undefined') return;

      const cfg = (GAME_CONFIG.pickups && GAME_CONFIG.pickups[pickupType]) || {};
      const chance = cfg.dropChance == null ? 1 : cfg.dropChance;
      enemy.pickupDropped = true;
      if (Math.random() > chance) return;

      const x = Math.max(70, Math.min(GAME_CONFIG.width - 70, enemy.x || GAME_CONFIG.width / 2));
      const y = Math.max(GAME_CONFIG.laneTop + 35, Math.min(GAME_CONFIG.laneBottom, enemy.y || GAME_CONFIG.laneBottom));
      ensurePickupList(this).push(new HealthPickup(pickupType, x, y, this.images));
    };

    LevelScene.prototype.pickupDropFinalPatchApplied = true;
  }
})();
