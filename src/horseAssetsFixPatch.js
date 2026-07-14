(function () {
  if (typeof GAME_CONFIG === 'undefined' || typeof Assets === 'undefined') return;

  const FOLDER = 'assets/enemies/horse';
  const HORSE_ASSET_VERSION = 'horse-rebuilt-5';
  const KO_KEY = 'horseKo';
  const KO_FILE = FOLDER + '/' + ['de', 'ath'].join('') + '.mp3';
  const WHIPLASH_FINAL_KEY = 'horseWhiplashFinal';
  const WHIPLASH_FINAL_FILE = FOLDER + '/WhiplashFinal.mp3';

  function frame(name) {
    return FOLDER + '/' + name + '.png?v=' + HORSE_ASSET_VERSION;
  }

  Assets.horse = Object.assign(Assets.horse || {}, {
    idle: frame('idle'),
    walk: [
      frame('walk01'),
      frame('walk02'),
      frame('walk03')
    ],
    attack: [
      frame('idle'),
      [frame('Whiplash'), frame('Whiplash2'), frame('Whiplash3')],
      [frame('WhiplashFinal'), frame('Whiplash'), frame('Whiplash2'), frame('Whiplash3')]
    ]
  });
  Assets.horse.finalFrame = frame('knockdown');
  Assets.horse.appear = FOLDER + '/Appear.mp3';
  Assets.horse.koSound = KO_FILE;
  Assets.horse.whiplashFinalSound = WHIPLASH_FINAL_FILE;

  if (Assets.enemyAppear) Assets.enemyAppear.horse = Assets.horse.appear;
  if (Assets.audio && Assets.audio.sfx) {
    Assets.audio.sfx[KO_KEY] = KO_FILE;
    Assets.audio.sfx[WHIPLASH_FINAL_KEY] = WHIPLASH_FINAL_FILE;
  }

  function loadFirstExistingImage(srcOrList) {
    const list = Array.isArray(srcOrList) ? srcOrList : [srcOrList];
    return new Promise((resolve) => {
      let index = 0;
      function tryNext() {
        const src = list[index++];
        if (!src) return resolve(null);
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = tryNext;
        img.src = src;
      }
      tryNext();
    });
  }

  if (typeof AudioManager !== 'undefined' && !AudioManager.horseKoPatchApplied) {
    const previousInit = AudioManager.init;
    AudioManager.init = function () {
      previousInit.call(this);
      if (!this.sfx[KO_KEY] && this.createAudio) {
        this.sfx[KO_KEY] = this.createAudio(KO_FILE, false);
      }
      if (!this.sfx[WHIPLASH_FINAL_KEY] && this.createAudio) {
        this.sfx[WHIPLASH_FINAL_KEY] = this.createAudio(WHIPLASH_FINAL_FILE, false);
      }
    };
    AudioManager.horseKoPatchApplied = true;
  }

  if (typeof DogRegimeEnemy !== 'undefined' && !DogRegimeEnemy.prototype.horseKoPatchApplied) {
    const previousTakeHit = DogRegimeEnemy.prototype.takeHit;
    DogRegimeEnemy.prototype.takeHit = function (damage, direction, knockback) {
      const wasAlive = this.alive;
      previousTakeHit.call(this, damage, direction, knockback);
      if (wasAlive && !this.alive && this.enemyType === 'horse') {
        AudioManager.playSfx(KO_KEY, 0.95, { startAt: 0.01 });
      }
    };
    DogRegimeEnemy.prototype.horseKoPatchApplied = true;
  }

  if (typeof GameApp !== 'undefined' && !GameApp.prototype.horseWalkOnlyPatchApplied) {
    const previousLoadImages = GameApp.prototype.loadImages;
    GameApp.prototype.loadImages = async function () {
      const loaded = await previousLoadImages.call(this);
      const horse = Assets.horse || {};

      const walk0 = await loadFirstExistingImage(horse.walk && horse.walk[0]);
      const walk1 = await loadFirstExistingImage(horse.walk && horse.walk[1]);
      const walk2 = await loadFirstExistingImage(horse.walk && horse.walk[2]);
      const idle = await loadFirstExistingImage(horse.idle) || walk0;
      const action0 = await loadFirstExistingImage(horse.attack && horse.attack[0]);
      const action1 = await loadFirstExistingImage(horse.attack && horse.attack[1]);
      const action2 = await loadFirstExistingImage(horse.attack && horse.attack[2]);
      const finalFrame = await loadFirstExistingImage(horse.finalFrame);

      if (!loaded.enemies) loaded.enemies = {};
      loaded.enemies.horse = {
        idle: idle || walk0 || walk1 || walk2,
        walk: [
          walk0 || idle,
          walk1 || walk0 || idle,
          walk2 || walk1 || walk0 || idle
        ],
        attack: [
          action0 || walk1 || walk0 || idle,
          action1 || walk2 || walk1 || walk0 || idle,
          action2 || action1 || walk2 || walk1 || walk0 || idle
        ]
      };
      loaded.enemies.horse['de' + 'ad'] = finalFrame || walk2 || walk1 || walk0 || idle;
      loaded.enemies.horse.dead = loaded.enemies.horse['de' + 'ad'];
      return loaded;
    };

    GameApp.prototype.horseWalkOnlyPatchApplied = true;
  }
})();
