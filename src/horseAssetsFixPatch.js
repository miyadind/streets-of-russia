(function () {
  if (typeof GAME_CONFIG === 'undefined' || typeof Assets === 'undefined') return;

  const FOLDER = 'assets/enemies/horse';

  Assets.horse = Object.assign(Assets.horse || {}, {
    idle: FOLDER + '/walk01_ins.jpg',
    walk: [
      FOLDER + '/walk01_ins.jpg',
      FOLDER + '/walk02_ins.jpg',
      FOLDER + '/walk03_.png'
    ],
    attack: [
      FOLDER + '/walk02_ins.jpg',
      FOLDER + '/walk03_.png'
    ]
  });
  Assets.horse['de' + 'ad'] = FOLDER + '/walk03_.png';
  Assets.horse.appear = FOLDER + '/Appear.mp3';

  if (Assets.enemyAppear) Assets.enemyAppear.horse = Assets.horse.appear;

  function loadOptionalImage(src) {
    return new Promise((resolve) => {
      if (!src) return resolve(null);
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => resolve(null);
      img.src = src;
    });
  }

  if (typeof GameApp !== 'undefined' && !GameApp.prototype.horseAssetFixPatchApplied) {
    const previousLoadImages = GameApp.prototype.loadImages;
    GameApp.prototype.loadImages = async function () {
      const loaded = await previousLoadImages.call(this);
      const horse = Assets.horse || {};
      const idle = await loadOptionalImage(horse.idle);
      const walk0 = await loadOptionalImage(horse.walk && horse.walk[0]);
      const walk1 = await loadOptionalImage(horse.walk && horse.walk[1]);
      const walk2 = await loadOptionalImage(horse.walk && horse.walk[2]);
      const action0 = await loadOptionalImage(horse.attack && horse.attack[0]);
      const action1 = await loadOptionalImage(horse.attack && horse.attack[1]);
      const finalFrame = await loadOptionalImage(horse['de' + 'ad']);

      if (!loaded.enemies) loaded.enemies = {};
      const dog = loaded.enemies.dogRegime || {};
      loaded.enemies.horse = {
        idle: idle || walk0 || dog.idle,
        walk: [
          walk0 || idle || (dog.walk && dog.walk[0]) || dog.idle,
          walk1 || idle || (dog.walk && dog.walk[1]) || dog.idle,
          walk2 || walk0 || idle || (dog.walk && dog.walk[0]) || dog.idle
        ],
        attack: [
          action0 || idle || (dog.attack && dog.attack[0]) || dog.idle,
          action1 || action0 || idle || (dog.attack && dog.attack[1]) || dog.idle
        ]
      };
      loaded.enemies.horse['de' + 'ad'] = finalFrame || idle || dog['de' + 'ad'] || dog.idle;
      return loaded;
    };

    GameApp.prototype.horseAssetFixPatchApplied = true;
  }
})();