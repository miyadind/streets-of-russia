(function () {
  if (typeof GAME_CONFIG === 'undefined' || typeof Assets === 'undefined') return;

  const HORSE_FOLDER = 'assets/enemies/horse';

  Assets.horse = Object.assign({
    idle: HORSE_FOLDER + '/idle.png',
    walk: [
      HORSE_FOLDER + '/walk01.png',
      HORSE_FOLDER + '/walk02.png',
      HORSE_FOLDER + '/walk03.png'
    ],
    attack: [
      HORSE_FOLDER + '/idle.png',
      HORSE_FOLDER + '/Whiplash.png'
    ],
    dead: HORSE_FOLDER + '/walk03.png'
  }, Assets.horse || {});

  GAME_CONFIG.enemies.horse = Object.assign({
    name: 'Horse',
    hp: 125,
    speed: 2.025,
    damage: 14,
    scale: 0.17,
    attackScale: 0.57,
    attackWindupMs: 1000,
    attackActiveMs: 560,
    attackRecoveryMs: 520,
    bossMusic: false,
    bossMusicKey: 'bossTheme',
    minDistanceX: 46,
    preferredDistanceX: 84,
    attackRangeX: 180,
    attackRangeY: 38,
    clubReachForward: 238,
    clubReachBack: 24,
    maxAttackers: 1,
    decisionMinMs: 240,
    decisionMaxMs: 620,
    strafeChance: 0.32,
    retreatChance: 0.07,
    attackChance: 0.74,
    slotSpacingX: 50,
    slotSpacingY: 34,
    flankDistanceX: 112,
    pressureDistanceX: 165
  }, GAME_CONFIG.enemies.horse || {});

  if (typeof DevPanel !== 'undefined') {
    if (DevPanel.tabs && !DevPanel.tabs.includes('HORSE')) DevPanel.tabs.push('HORSE');
    if (!DevPanel.fieldGroups) DevPanel.fieldGroups = {};
    if (!DevPanel.fieldGroups.HORSE) DevPanel.fieldGroups.HORSE = [];

    const fields = [
      { label: 'Horse speed', path: 'enemies.horse.speed', min: 0.3, max: 4, step: 0.05 },
      { label: 'Horse HP', path: 'enemies.horse.hp', min: 10, max: 500, step: 5 },
      { label: 'Horse damage', path: 'enemies.horse.damage', min: 1, max: 90, step: 1 },
      { label: 'Horse scale', path: 'enemies.horse.scale', min: 0.05, max: 0.35, step: 0.005 },
      { label: 'Min dist X', path: 'enemies.horse.minDistanceX', min: 20, max: 180, step: 2 },
      { label: 'Preferred dist X', path: 'enemies.horse.preferredDistanceX', min: 40, max: 260, step: 2 },
      { label: 'Attack range X', path: 'enemies.horse.attackRangeX', min: 30, max: 220, step: 2 },
      { label: 'Attack range Y', path: 'enemies.horse.attackRangeY', min: 14, max: 110, step: 2 },
      { label: 'Max attackers', path: 'enemies.horse.maxAttackers', min: 1, max: 5, step: 1 },
      { label: 'Decision min ms', path: 'enemies.horse.decisionMinMs', min: 100, max: 1400, step: 20 },
      { label: 'Decision max ms', path: 'enemies.horse.decisionMaxMs', min: 160, max: 2200, step: 20 },
      { label: 'Strafe chance', path: 'enemies.horse.strafeChance', min: 0, max: 1, step: 0.05 },
      { label: 'Retreat chance', path: 'enemies.horse.retreatChance', min: 0, max: 1, step: 0.05 },
      { label: 'Attack chance', path: 'enemies.horse.attackChance', min: 0, max: 1, step: 0.05 },
      { label: 'Slot spacing X', path: 'enemies.horse.slotSpacingX', min: 0, max: 200, step: 4 },
      { label: 'Slot spacing Y', path: 'enemies.horse.slotSpacingY', min: 0, max: 140, step: 4 },
      { label: 'Flank distance X', path: 'enemies.horse.flankDistanceX', min: 60, max: 280, step: 4 },
      { label: 'Pressure distance X', path: 'enemies.horse.pressureDistanceX', min: 80, max: 360, step: 4 }
    ];

    for (const field of fields) {
      if (!DevPanel.fieldGroups.HORSE.some(item => item.path === field.path)) {
        DevPanel.fieldGroups.HORSE.push(field);
      }
    }
  }

  function loadOptionalImage(src) {
    return new Promise((resolve) => {
      if (!src) {
        resolve(null);
        return;
      }
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => {
        console.warn('Missing horse image:', src);
        resolve(null);
      };
      img.src = src;
    });
  }

  if (typeof GameApp !== 'undefined' && !GameApp.prototype.horseEnemyPatchApplied) {
    const originalLoadImages = GameApp.prototype.loadImages;
    GameApp.prototype.loadImages = async function () {
      const loaded = await originalLoadImages.call(this);
      const horse = Assets.horse || {};

      const idle = await loadOptionalImage(horse.idle);
      const walk0 = await loadOptionalImage(horse.walk && horse.walk[0]);
      const walk1 = await loadOptionalImage(horse.walk && horse.walk[1]);
      const walk2 = await loadOptionalImage(horse.walk && horse.walk[2]);
      const attack0 = await loadOptionalImage(horse.attack && horse.attack[0]);
      const attack1 = await loadOptionalImage(horse.attack && horse.attack[1]);
      const dead = await loadOptionalImage(horse.dead);

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
          attack0 || idle || (dog.attack && dog.attack[0]) || dog.idle,
          attack1 || attack0 || idle || (dog.attack && dog.attack[1]) || dog.idle
        ],
        dead: dead || idle || dog.dead || dog.idle
      };

      return loaded;
    };

    GameApp.prototype.horseEnemyPatchApplied = true;
  }

  if (typeof DogRegimeEnemy !== 'undefined' && !DogRegimeEnemy.prototype.horseWhiplashFramePatchApplied) {
    const previousGetFrameScale = DogRegimeEnemy.prototype.getFrameScale;
    DogRegimeEnemy.prototype.getFrameScale = function (img, baseScale) {
      if (this.enemyType !== 'horse') {
        return previousGetFrameScale ? previousGetFrameScale.call(this, img, baseScale) : (
          this.state === 'attack' ? baseScale * (this.attackScale || 1) : baseScale
        );
      }

      if (this.state !== 'attack') return baseScale;
      const windupMs = this.attackWindupMs || GAME_CONFIG.enemyWindupMs;
      const isWhiplash = this.attackTimer >= windupMs;
      return baseScale * (isWhiplash ? 0.78 : 0.57);
    };

    const previousGetDrawOffsetY = DogRegimeEnemy.prototype.getDrawOffsetY;
    DogRegimeEnemy.prototype.getDrawOffsetY = function (img, frameScale) {
      if (this.enemyType === 'horse' && this.state === 'attack') {
        const windupMs = this.attackWindupMs || GAME_CONFIG.enemyWindupMs;
        const isWhiplash = this.attackTimer >= windupMs;
        return (isWhiplash ? 225 : 9) * frameScale;
      }
      return previousGetDrawOffsetY ? previousGetDrawOffsetY.call(this, img, frameScale) : 0;
    };

    DogRegimeEnemy.prototype.horseWhiplashFramePatchApplied = true;
  }
})();
