// Hidden street02 easter egg: after all enemies are defeated,
// punching the poster area silently overlays street02-2.png.
(function () {
  if (typeof LevelScene === 'undefined') return;

  const originalUpdate = LevelScene.prototype.update;
  const originalDraw = LevelScene.prototype.draw;

  LevelScene.prototype.isExitUnlocked = function () {
    return true;
  };

  LevelScene.prototype.drawPosterObjective = function () {
    // Hidden easter egg: no visible objective, no highlight, no prompt.
  };

  LevelScene.prototype.removePoster = function () {
    this.posterRemoved[this.getLevelKey()] = true;
    AudioManager.playSfx('enemyDown', 0.8);
  };

  LevelScene.prototype.didPlayerPunchPoster = function () {
    if (this.getLevelKey() !== 'street02') return false;
    if (!this.encounterCleared || this.isPosterRemoved()) return false;
    if (this.player.state !== 'attack') return false;
    return Combat.overlap(this.player.getHitbox(), this.getPosterHitbox());
  };

  LevelScene.prototype.update = function (dt) {
    originalUpdate.call(this, dt);

    if (this.didPlayerPunchPoster()) {
      this.removePoster();
    }
  };

  LevelScene.prototype.draw = function (ctx) {
    if (this.getLevelKey() !== 'street02' || !this.isPosterRemoved()) {
      originalDraw.call(this, ctx);
      return;
    }

    const overlay = this.altBackgrounds && this.altBackgrounds.street02;
    const saved = this.posterRemoved.street02;

    this.posterRemoved.street02 = false;
    originalDraw.call(this, ctx);
    this.posterRemoved.street02 = saved;

    if (overlay) {
      ctx.drawImage(overlay, 0, 0, GAME_CONFIG.width, GAME_CONFIG.height);
    }
  };
}());
