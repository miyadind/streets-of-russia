(function () {
  if (typeof GAME_CONFIG === 'undefined' || typeof Assets === 'undefined') return;

  const FOLDER = 'assets/enemies/horse';

  function candidates(name) {
    return [
      FOLDER + '/' + name + '.png',
      FOLDER + '/' + name + '.jpg',
      FOLDER + '/' + name + '.jpeg',
      FOLDER + '/' + name + '_ins.png',
      FOLDER + '/' + name + '_ins.jpg',
      FOLDER + '/' + name + '_.png',
      FOLDER + '/' + name + '_.jpg'
    ];
  }

  Assets.horse = Object.assign(Assets.horse || {}, {
    idle: candidates('walk01'),
    walk: [
      candidates('walk01'),
      candidates('walk02'),
      candidates('walk03')
    ],
    attack: [
      candidates('walk02'),
      candidates('walk03')
    ]
  });
  Assets.horse.finalFrame = candidates('walk03');
  Assets.horse.appear = FOLDER + '/Appear.mp3';

  if (Assets.enemyAppear) Assets.enemyAppear.horse = Assets.horse.appear;

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

  if (typeof GameApp !== 'undefined' && !GameApp.prototype.horseWalkOnlyPatchApplied) {
    const previousLoadImages = GameApp.prototype.loadImages;
    GameApp.prototype.loadImages = async function () {
      const loaded = await previousLoadImages.call(this);
      const horse = Assets.horse || {};

      const walk0 = await loadFirstExistingImage(horse.walk && horse.walk[0]);
      const walk1 = await loadFirstExistingImage(horse.walk && horse.walk[1]);
      const walk2 = await loadFirstExistingImage(horse.walk && horse.walk[2]);
      const idle = walk0 || await loadFirstExistingImage(horse.idle);
      const action0 = await loadFirstExistingImage(horse.attack && horse.attack[0]);
      const action1 = await loadFirstExistingImage(horse.attack && horse.attack[1]);
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
          action1 || walk2 || walk1 || walk0 || idle
        ]
      };
      loaded.enemies.horse['de' + 'ad'] = finalFrame || walk2 || walk1 || walk0 || idle;
      loaded.enemies.horse.dead = loaded.enemies.horse['de' + 'ad'];
      return loaded;
    };

    GameApp.prototype.horseWalkOnlyPatchApplied = true;
  }
})();