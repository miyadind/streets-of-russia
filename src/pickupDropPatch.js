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

    LevelScene.prototype.pickupDropFinalPatchApplied = true;
  }
})();
