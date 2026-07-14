(function () {
  if (typeof GAME_CONFIG === 'undefined' || typeof Assets === 'undefined') return;

  const HORSE_FOLDER = 'assets/enemies/horse';
  const HORSE_ASSET_VERSION = 'horse-rebuilt-6';
  const horseFrame = name => HORSE_FOLDER + '/' + name + '.png?v=' + HORSE_ASSET_VERSION;

  Assets.horse = Object.assign({
    idle: horseFrame('idle'),
    walk: [
      horseFrame('walk01'),
      horseFrame('walk02'),
      horseFrame('walk03')
    ],
    attack: [
      horseFrame('idle'),
      horseFrame('Whiplash'),
      horseFrame('WhiplashFinal')
    ],
    dead: horseFrame('knockdown')
  }, Assets.horse || {});

  GAME_CONFIG.enemies.horse = Object.assign({
    name: 'Horse',
    hp: 125,
    speed: 2.025,
    damage: 14,
    scale: 0.13,
    walkScale: 0.95,
    visibleHeight: 0,
    attackScale: 1,
    finalAttackScale: 1.31,
    attackWindupMs: 820,
    attackActiveMs: 560,
    attackRecoveryMs: 400,
    bossMusic: false,
    bossMusicKey: 'bossTheme',
    minDistanceX: 120,
    preferredDistanceX: 190,
    tooFarDistanceX: 310,
    attackMinDistanceX: 115,
    attackMaxDistanceX: 255,
    attackRangeX: 265,
    attackRangeY: 38,
    clubReachForward: 310,
    clubReachBack: 18,
    maxAttackers: 1,
    decisionMinMs: 340,
    decisionMaxMs: 920,
    strafeChance: 0.5,
    retreatChance: 0.26,
    attackChance: 0.46,
    closeRetreatChance: 0.78,
    postAttackRetreatMs: 760,
    slotSpacingX: 50,
    slotSpacingY: 44,
    flankDistanceX: 190,
    pressureDistanceX: 225
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
      const attack2 = await loadOptionalImage(horse.attack && horse.attack[2]);

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
          attack1 || attack0 || idle || (dog.attack && dog.attack[1]) || dog.idle,
          attack2 || attack1 || attack0 || idle || (dog.attack && dog.attack[1]) || dog.idle
        ],
        dead: dead || walk2 || idle || dog.dead || dog.idle
      };

      return loaded;
    };

    GameApp.prototype.horseEnemyPatchApplied = true;
  }

  function getAlphaBounds(img) {
    if (!img) return null;
    if (img.__alphaBounds) return img.__alphaBounds;
    try {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth || img.width;
      canvas.height = img.naturalHeight || img.height;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      ctx.drawImage(img, 0, 0);
      const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
      let minX = canvas.width;
      let minY = canvas.height;
      let maxX = -1;
      let maxY = -1;
      for (let y = 0; y < canvas.height; y++) {
        for (let x = 0; x < canvas.width; x++) {
          if (data[(y * canvas.width + x) * 4 + 3] <= 8) continue;
          if (x < minX) minX = x;
          if (y < minY) minY = y;
          if (x > maxX) maxX = x;
          if (y > maxY) maxY = y;
        }
      }
      img.__alphaBounds = maxX >= 0
        ? { minX, minY, maxX, maxY, w: maxX - minX + 1, h: maxY - minY + 1, bottomGap: canvas.height - 1 - maxY }
        : { minX: 0, minY: 0, maxX: canvas.width - 1, maxY: canvas.height - 1, w: canvas.width, h: canvas.height, bottomGap: 0 };
    } catch (error) {
      img.__alphaBounds = { minX: 0, minY: 0, maxX: img.width - 1, maxY: img.height - 1, w: img.width, h: img.height, bottomGap: 0 };
    }
    return img.__alphaBounds;
  }

  function getFootCenterX(img) {
    if (!img) return 0;
    if (img.__footCenterX != null) return img.__footCenterX;
    const bounds = getAlphaBounds(img);
    if (!bounds) {
      img.__footCenterX = img.width / 2;
      return img.__footCenterX;
    }
    try {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth || img.width;
      canvas.height = img.naturalHeight || img.height;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      ctx.drawImage(img, 0, 0);
      const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
      const startY = Math.max(bounds.minY, bounds.maxY - Math.max(18, Math.round(bounds.h * 0.08)));
      let weightedX = 0;
      let weight = 0;
      for (let y = startY; y <= bounds.maxY; y++) {
        for (let x = bounds.minX; x <= bounds.maxX; x++) {
          const alpha = data[(y * canvas.width + x) * 4 + 3];
          if (alpha <= 20) continue;
          weightedX += x * alpha;
          weight += alpha;
        }
      }
      img.__footCenterX = weight > 0 ? weightedX / weight : (bounds.minX + bounds.maxX) / 2;
    } catch (error) {
      img.__footCenterX = (bounds.minX + bounds.maxX) / 2;
    }
    return img.__footCenterX;
  }

  if (typeof DogRegimeEnemy !== 'undefined' && !DogRegimeEnemy.prototype.horseWhiplashFramePatchApplied) {
    const previousGetImage = DogRegimeEnemy.prototype.getImage;
    DogRegimeEnemy.prototype.getImage = function () {
      if (this.enemyType === 'horse' && this.state === 'attack') {
        const enemyImages = this.getEnemyImages();
        const attack = enemyImages.attack || [];
        const windupMs = this.attackWindupMs || GAME_CONFIG.enemyWindupMs;
        const activeMs = this.attackActiveMs || GAME_CONFIG.enemyActiveMs;
        if (this.attackTimer < windupMs) return attack[0] || enemyImages.idle;
        if (attack[2] && this.attackTimer >= windupMs + activeMs * 0.45) return attack[2];
        return attack[1] || attack[0] || enemyImages.idle;
      }
      return previousGetImage.call(this);
    };

    const previousGetFrameScale = DogRegimeEnemy.prototype.getFrameScale;
    DogRegimeEnemy.prototype.getFrameScale = function (img, baseScale) {
      if (this.enemyType !== 'horse') {
        return previousGetFrameScale ? previousGetFrameScale.call(this, img, baseScale) : (
          this.state === 'attack' ? baseScale * (this.attackScale || 1) : baseScale
        );
      }

      const horseConfig = GAME_CONFIG.enemies.horse || {};
      if (this.state === 'walk') return baseScale * (horseConfig.walkScale || 0.95);
      if (this.state === 'attack') {
        const attack = (this.getEnemyImages().attack || []);
        if (attack[2] && img === attack[2]) return baseScale * (horseConfig.finalAttackScale || 1.31);
      }
      return baseScale;
    };

    DogRegimeEnemy.prototype.getDrawOffsetX = function (img, frameScale) {
      if (this.enemyType === 'horse' && this.state === 'attack') {
        const attack = this.getEnemyImages().attack || [];
        if (attack[2] && img === attack[2]) {
          const bounds = getAlphaBounds(img);
          const reference = attack[1] || attack[0] || img;
          const baseScale = this.scale || GAME_CONFIG.enemyScale;
          const referenceScale = reference === img ? frameScale : this.getFrameScale(reference, baseScale);
          const targetFootX = (getFootCenterX(reference) - reference.width / 2) * referenceScale;
          const currentFootX = (getFootCenterX(img) - img.width / 2) * frameScale;
          return targetFootX - currentFootX;
        }
      }
      return 0;
    };

    const previousGetDrawOffsetY = DogRegimeEnemy.prototype.getDrawOffsetY;
    DogRegimeEnemy.prototype.getDrawOffsetY = function (img, frameScale) {
      if (this.enemyType === 'horse') {
        if (this.state === 'attack') {
          const attack = this.getEnemyImages().attack || [];
          if (attack[2] && img === attack[2]) {
            const bounds = getAlphaBounds(img);
            return bounds ? bounds.bottomGap * frameScale : 0;
          }
        }
        return 0;
      }
      return previousGetDrawOffsetY ? previousGetDrawOffsetY.call(this, img, frameScale) : 0;
    };

    DogRegimeEnemy.prototype.horseWhiplashFramePatchApplied = true;
  }

  if (typeof DogRegimeEnemy !== 'undefined' && !DogRegimeEnemy.prototype.horseTacticsPatchApplied) {
    const previousChooseIntent = DogRegimeEnemy.prototype.chooseIntent;
    DogRegimeEnemy.prototype.chooseIntent = function (scene, canAttackNow, inAttackRange, frontThreat = false, absX = Infinity) {
      if (this.enemyType !== 'horse') {
        return previousChooseIntent.call(this, scene, canAttackNow, inAttackRange, frontThreat, absX);
      }

      const roll = Math.random();
      if (frontThreat || absX < this.minDistanceX) {
        this.intent = roll < 0.72 ? 'retreat' : 'strafe';
        this.retreatTimer = 260 + Math.random() * 260;
        this.strafeDirection = Math.random() < 0.5 ? -1 : 1;
      } else if (canAttackNow && inAttackRange && this.cooldown <= 0 && roll < this.attackChance) {
        this.intent = 'attack';
      } else if (absX > this.attackMaxDistanceX) {
        this.intent = roll < 0.72 ? 'approach' : 'flank';
      } else if (roll < 0.5) {
        this.intent = 'strafe';
        this.strafeDirection = Math.random() < 0.5 ? -1 : 1;
      } else if (roll < 0.75) {
        this.intent = 'hold';
      } else {
        this.intent = 'retreat';
        this.retreatTimer = 180 + Math.random() * 220;
      }

      this.decisionTimer = this.decisionMinMs + Math.random() * Math.max(1, this.decisionMaxMs - this.decisionMinMs);
    };

    DogRegimeEnemy.prototype.horseTacticsPatchApplied = true;
  }
})();
