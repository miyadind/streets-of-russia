(function () {
  if (typeof Assets !== 'undefined' && Assets.audio && Assets.audio.sfx) {
    Assets.audio.sfx.horseDeath = 'assets/enemies/horse/death.mp3';
  }

  if (typeof AudioManager !== 'undefined' && !AudioManager.horseDeathPatchApplied) {
    const originalInit = AudioManager.init;
    AudioManager.init = function () {
      originalInit.call(this);
      if (!this.sfx.horseDeath && this.createAudio) {
        this.sfx.horseDeath = this.createAudio('assets/enemies/horse/death.mp3', false);
      }
    };
    AudioManager.horseDeathPatchApplied = true;
  }

  if (typeof DogRegimeEnemy !== 'undefined' && !DogRegimeEnemy.prototype.horseDeathSoundPatchApplied) {
    const originalTakeHit = DogRegimeEnemy.prototype.takeHit;
    DogRegimeEnemy.prototype.takeHit = function (damage, direction, knockback) {
      const wasAlive = this.alive;
      originalTakeHit.call(this, damage, direction, knockback);

      if (wasAlive && !this.alive && this.enemyType === 'horse') {
        AudioManager.playSfx('horseDeath', 0.95, { startAt: 0.01 });
      }
    };

    DogRegimeEnemy.prototype.horseDeathSoundPatchApplied = true;
  }
})();