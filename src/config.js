const GAME_CONFIG = {
  buildVersion: '0.4.54',
  width: 1280,
  height: 720,
  targetFPS: 60,

  adminTuningEnabled: true,

  settings: {
    difficulty: 'normal',
    soundEnabled: true,
    musicEnabled: true,
    sfxEnabled: true,
    sfxVolume: 0.85,
    musicVolume: 0.45
  },

  laneTop: 515,
  laneBottom: 675,

  playerScale: 0.115,
  enemyScale: 0.105,

  walkFrameMs: 220,
  enemyWalkFrameMs: 260,

  ySpeedMultiplier: 0.65,
  comboResetMs: 520,
  playerHitStopMs: 55,
  playerHitStunMs: 380,
  playerInvulnerableMs: 520,
  playerReviveKnockdownMs: 950,
  playerReviveTextMs: 1250,
  heroDefeatHoldMs: 1150,
  enemyBodyRadiusX: 42,
  enemyBodyRadiusY: 20,
  enemySeparationStrength: 0.55,
  enemySeparationIterations: 2,
  enemyAttackSlotRadiusX: 46,
  enemyAttackSlotRadiusY: 24,
  enemyOffscreenMargin: 180,
  pushboxLaneTolerance: 12,
  yHitTolerance: 28,
  combatLaneCount: 3,
  discreteCombatLanes: true,

  enemyAttackRangeX: 76,
  enemyAttackRangeY: 36,
  enemyWindupMs: 260,
  enemyActiveMs: 140,
  enemyRecoveryMs: 520,
  enemyHitStunMs: 380,
  enemyDeathFadeMs: 18000,

  heroes: {
    alexey: {
      name: 'Алексей',
      role: 'balanced',
      hp: 120,
      speed: 3.9,
      damage: 16,
      scale: 0.185,
      knockdownDraw: { alphaCenterX: 800, alphaBottomY: 834, facingMultiplier: -1 },
      knockdownBody: { footX: 1308, bottomY: 834, w: 190, h: 58 },
      strength: 5,
      speedStat: 5,
      health: 5,
      color: '#4f9cff',
      abilities: { reviveOnce: true },
      tagline: 'Сбалансированный герой сопротивления',
      bio: 'Политик, расследователь и символ упрямого гражданского сопротивления. В игре Алексей держит середину: он не самый сильный и не самый быстрый, зато стабилен почти в любой драке.',
      ability: 'Второе дыхание: один раз за прохождение, когда здоровье падает до нуля, Алексей возвращается в бой с половиной здоровья.'
    },
    anna: {
      name: 'Анна',
      role: 'fast',
      hp: 85,
      speed: 4.725,
      damage: 12,
      scale: 0.11,
      knockdownDraw: { alphaCenterX: 756, alphaBottomY: 688 },
      knockdownBody: { footX: 108, bottomY: 688, w: 155, h: 36 },
      strength: 3,
      speedStat: 7,
      health: 4,
      color: '#c163ff',
      abilities: { noKnockdown: true },
      tagline: 'Быстрая, резкая, опасная на дистанции',
      bio: 'Журналистка, которая идёт туда, куда другие боятся смотреть. В игре Анна выигрывает не грубой силой, а скоростью, манёвром и точными ударами.',
      ability: 'Несгибаемость: Анна получает урон, но её нельзя сбить с ног или прижать к земле. Она остаётся на ногах даже после тяжёлых атак.'
    },
    boris: {
      name: 'Борис',
      role: 'tank',
      hp: 160,
      speed: 3.375,
      damage: 22,
      scale: 0.16,
      knockdownDraw: { alphaCenterX: 730, alphaBottomY: 634 },
      knockdownBody: { footX: 155, bottomY: 634, w: 210, h: 50 },
      strength: 7,
      speedStat: 3,
      health: 8,
      color: '#5fd65f',
      abilities: { rangedDamageMultiplier: 0.5 },
      tagline: 'Тяжёлый боец с большим запасом здоровья',
      bio: 'Политик старой школы, который не отступает, когда улица становится опасной. В игре Борис медленнее остальных, но зато выдерживает больше ударов и бьёт тяжелее.',
      ability: 'Стальная выдержка: Борис получает только половину урона от дальних атак. Прыжковые и разгонные атаки врагов по нему проходят слабее.'
    }
  },

  audio: {
    music: {
      menu: 'menuTheme',
      level: 'levelTheme',
      boss: 'bossTheme'
    },
    sfx: {
      menuMove: 'menuMove',
      menuSelect: 'menuSelect',
      punch: 'punch',
      punch1: 'punch1',
      punch2: 'punch2',
      punch3: 'punch3',
      hit: 'hit',
      enemyDown: 'enemyDown',
      playerDown: 'playerDown',
      waveStart: 'waveStart',
      waveClear: 'waveClear',
      bossAppear: 'bossAppear'
    }
  },

  enemies: {
    dogRegime: {
      name: 'Пёс режима',
      hp: 90,
      speed: 2.025,
      damage: 10,
      scale: 0.105,
      attackScale: 1.11,
      smartAiVersion: 3,
      bossMusic: false,
      bossMusicKey: 'bossTheme',
      minDistanceX: 52,
      preferredDistanceX: 78,
      tooFarDistanceX: 150,
      attackMinDistanceX: 44,
      attackMaxDistanceX: 96,
      attackRangeX: 82,
      attackRangeY: 38,
      maxAttackers: 1,
      decisionMinMs: 120,
      decisionMaxMs: 280,
      strafeChance: 0.32,
      retreatChance: 0.16,
      attackChance: 0.86,
      closeRetreatChance: 0.42,
      playerAttackFearDistance: 86,
      postAttackRetreatMs: 220,
      attackCooldownMinMs: 300,
      attackCooldownMaxMs: 520,
      backstabChance: 0.78,
      slotSpacingX: 46,
      slotSpacingY: 32,
      flankDistanceX: 112,
      pressureDistanceX: 160
    },
    zetnik: {
      name: 'Зетник',
      hp: 110,
      speed: 5.8125,
      damage: 12,
      scale: 0.105,
      bossMusic: false,
      bossMusicKey: 'bossTheme',
      minDistanceX: 38,
      preferredDistanceX: 70,
      attackRangeX: 78,
      attackRangeY: 36,
      maxAttackers: 1,
      decisionMinMs: 220,
      decisionMaxMs: 560,
      strafeChance: 0.32,
      retreatChance: 0.06,
      attackChance: 0.78,
      slotSpacingX: 46,
      slotSpacingY: 32,
      flankDistanceX: 105,
      pressureDistanceX: 155,
      selfRemoveDelayMs: 18000
    },
    sucker: {
      name: 'Sucker',
      hp: 180,
      speed: 1.725,
      damage: 12,
      scale: 0.13,
      bossMusic: true,
      bossMusicKey: 'bossTheme',
      attackStartDistance: 420,
      minDistance: 220,
      alignToleranceY: 30,
      slideSpeed: 10.875,
      slideRange: 520,
      windupMs: 560,
      slideRecoveryMs: 650,
      interruptedRecoveryMs: 1100,
      fastRetreatSpeed: 14.5,
      fastRetreatMs: 620,
      hitsBeforeFastRetreat: 2,
      counterRangeX: 150,
      counterRangeY: 58,
      pinDurationMs: 1700,
      pinEscapeMinBites: 3,
      pinHoldMs: 120000,
      biteTickMs: 450,
      biteDamage: 6,
      otherEnemyScatterDistance: 120,
      bodyRadiusX: 52,
      bodyRadiusY: 24
    },
    bastard: {
      name: 'Bastard',
      hp: 9999,
      speed: 1.125,
      damage: 0,
      scale: 0.12,
      bossMusic: false,
      bossMusicKey: 'bossTheme',
      canAttack: false,
      canDie: false,
      blocksWaveClear: false,
      wanderMinMs: 700,
      wanderMaxMs: 1900,
      idleMinMs: 900,
      idleMaxMs: 2200,
      fallenMinMs: 1300,
      fallenMaxMs: 2600,
      idleChance: 0.32,
      fallChance: 0.04,
      turnChance: 0.3,
      knockbackX: 34,
      bodyRadiusX: 44,
      bodyRadiusY: 20
    }
  },

  pickups: {
    medkit: { image: 'medkit', heal: 1, fullHeal: true, dropChance: 0.7, scale: 0.34, label: 'FULL HP', collectDelayMs: 500 },
    pirozhok: { image: 'pirozhok', healPercent: 0.2, dropChance: 0.6, scale: 0.32, label: '+20% HP', collectDelayMs: 500 },
    tea: { image: 'tea', healPercent: 0.5, dropChance: 0.5, scale: 0.3, label: '+50% HP', collectDelayMs: 500 }
  },

  enemyPickupDrops: {
    zetnik: 'medkit',
    dogRegime: 'pirozhok',
    horse: 'tea'
  },

  levelOrder: [
    'street01', 'street02', 'street03',
    'siberia01', 'siberia02', 'siberia03',
    'ural01', 'ural02', 'ural03',
    'northwest01', 'northwest02', 'northwest03',
    'volga01', 'volga02', 'volga03',
    'south01', 'south02', 'south03',
    'moscow01', 'moscow02', 'moscow03'
  ],

  campaignRegions: [
    { mapId: 'farEast', levelRegion: 'far-east', levels: ['street01', 'street02', 'street03'] },
    { mapId: 'siberia', levelRegion: 'siberia', levels: ['siberia01', 'siberia02', 'siberia03'] },
    { mapId: 'ural', levelRegion: 'ural', levels: ['ural01', 'ural02', 'ural03'] },
    { mapId: 'northwestPiter', levelRegion: 'northwest', levels: ['northwest01', 'northwest02', 'northwest03'] },
    { mapId: 'volga', levelRegion: 'volga', levels: ['volga01', 'volga02', 'volga03'] },
    { mapId: 'southSochi', levelRegion: 'south', levels: ['south01', 'south02', 'south03'] },
    { mapId: 'centralMoscow', levelRegion: 'moscow', levels: ['moscow01', 'moscow02', 'moscow03'] }
  ],

  levels: {
    street01: {
      name: 'Far East 01',
      region: 'far-east',
      background: 'assets/backgrounds/1/street01.png',
      interactives: [
        {
          id: 'shamanPoster',
          type: 'breakablePoster',
          hitsToReplace: 3,
          altBackground: 'assets/backgrounds/1/street01_1.png',
          laneY: 620,
          laneTolerance: 42,
          hitbox: { x: 342, y: 272, w: 128, h: 146 },
          effectRect: { x: 360, y: 322, w: 72, h: 150 }
        }
      ],
      music: 'levelTheme',
      waves: [
        {
          trigger: 'onEnter',
          enemies: [
            { type: 'dogRegime', count: 2, side: 'right' }
          ]
        }
      ],
      walkZone: {
        left: 0,
        right: 1280,
        top: 550,
        bottom: 710
      },
      playerStart: {
        x: 195,
        y: 615
      },
      enemySpawnMargin: {
        x: 40,
        y: 28
      }
    },
    street02: {
      name: 'Far East 02',
      region: 'far-east',
      background: 'assets/backgrounds/1/street02.png',
      music: 'levelTheme',
      waves: [
        {
          trigger: 'onEnter',
          enemies: [
            { type: 'dogRegime', count: 2, side: 'right' }
          ]
        },
        {
          trigger: 'afterWaveCleared',
          enemies: [
            { type: 'dogRegime', count: 1, side: 'left' },
            { type: 'zetnik', count: 1, side: 'right' }
          ]
        },
        {
          trigger: 'afterWaveCleared',
          enemies: [
            { type: 'sucker', count: 1, side: 'right' }
          ]
        }
      ],
      walkZone: {
        left: 0,
        right: 1280,
        top: 585,
        bottom: 710
      },
      playerStart: {
        x: 1120,
        y: 620
      },
      enemySpawnMargin: {
        x: 40,
        y: 28
      }
    },
    street03: {
      name: 'Far East 03',
      region: 'far-east',
      background: 'assets/backgrounds/1/street03.png',
      music: 'levelTheme',
      waves: [
        {
          trigger: 'onEnter',
          enemies: [
            { type: 'gundos', count: 1, side: 'right' }
          ]
        }
      ],
      walkZone: {
        left: 0,
        right: 1280,
        top: 550,
        bottom: 725
      },
      playerStart: {
        x: 1165,
        y: 635
      },
      enemySpawnMargin: {
        x: 40,
        y: 28
      }
    },
    siberia01: {
      name: 'Siberia 01',
      region: 'siberia',
      background: 'assets/backgrounds/2/street01.png',
      music: 'levelTheme',
      waves: [
        { trigger: 'onEnter', enemies: [{ type: 'dogRegime', count: 2, side: 'right' }] }
      ],
      walkZone: { left: 0, right: 1280, top: 550, bottom: 710 },
      playerStart: { x: 195, y: 615 },
      enemySpawnMargin: { x: 40, y: 28 }
    },
    siberia02: {
      name: 'Siberia 02',
      region: 'siberia',
      background: 'assets/backgrounds/2/street02.png',
      music: 'levelTheme',
      waves: [
        { trigger: 'onEnter', enemies: [{ type: 'dogRegime', count: 2, side: 'right' }] },
        { trigger: 'afterWaveCleared', enemies: [{ type: 'zetnik', count: 1, side: 'right' }] }
      ],
      walkZone: { left: 0, right: 1280, top: 550, bottom: 710 },
      playerStart: { x: 195, y: 615 },
      enemySpawnMargin: { x: 40, y: 28 }
    },
    siberia03: {
      name: 'Siberia 03',
      region: 'siberia',
      background: 'assets/backgrounds/2/street03.png',
      music: 'levelTheme',
      waves: [
        { trigger: 'onEnter', enemies: [{ type: 'dogRegime', count: 2, side: 'right' }] },
        { trigger: 'afterWaveCleared', enemies: [{ type: 'sucker', count: 1, side: 'right' }] }
      ],
      walkZone: { left: 0, right: 1280, top: 550, bottom: 710 },
      playerStart: { x: 195, y: 615 },
      enemySpawnMargin: { x: 40, y: 28 }
    },
    ural01: {
      name: 'Ural 01',
      region: 'ural',
      background: 'assets/backgrounds/3/street01.png',
      music: 'levelTheme',
      waves: [{ trigger: 'onEnter', enemies: [{ type: 'dogRegime', count: 2, side: 'right' }] }],
      walkZone: { left: 0, right: 1280, top: 550, bottom: 710 },
      playerStart: { x: 195, y: 615 },
      enemySpawnMargin: { x: 40, y: 28 }
    },
    ural02: {
      name: 'Ural 02',
      region: 'ural',
      background: 'assets/backgrounds/3/street02.png',
      music: 'levelTheme',
      waves: [{ trigger: 'onEnter', enemies: [{ type: 'dogRegime', count: 2, side: 'right' }] }],
      walkZone: { left: 0, right: 1280, top: 550, bottom: 710 },
      playerStart: { x: 195, y: 615 },
      enemySpawnMargin: { x: 40, y: 28 }
    },
    ural03: {
      name: 'Ural 03',
      region: 'ural',
      background: 'assets/backgrounds/3/street03.png',
      music: 'levelTheme',
      waves: [{ trigger: 'onEnter', enemies: [{ type: 'sucker', count: 1, side: 'right' }] }],
      walkZone: { left: 0, right: 1280, top: 550, bottom: 710 },
      playerStart: { x: 195, y: 615 },
      enemySpawnMargin: { x: 40, y: 28 }
    },
    northwest01: {
      name: 'Northwest 01',
      region: 'northwest',
      background: 'assets/backgrounds/4/street01.png',
      music: 'levelTheme',
      waves: [{ trigger: 'onEnter', enemies: [{ type: 'dogRegime', count: 2, side: 'right' }] }],
      walkZone: { left: 0, right: 1280, top: 550, bottom: 710 },
      playerStart: { x: 195, y: 615 },
      enemySpawnMargin: { x: 40, y: 28 }
    },
    northwest02: {
      name: 'Northwest 02',
      region: 'northwest',
      background: 'assets/backgrounds/4/street02.png',
      music: 'levelTheme',
      waves: [{ trigger: 'onEnter', enemies: [{ type: 'dogRegime', count: 2, side: 'right' }] }],
      walkZone: { left: 0, right: 1280, top: 550, bottom: 710 },
      playerStart: { x: 195, y: 615 },
      enemySpawnMargin: { x: 40, y: 28 }
    },
    northwest03: {
      name: 'Northwest 03',
      region: 'northwest',
      background: 'assets/backgrounds/4/street03.png',
      music: 'levelTheme',
      waves: [{ trigger: 'onEnter', enemies: [{ type: 'sucker', count: 1, side: 'right' }] }],
      walkZone: { left: 0, right: 1280, top: 550, bottom: 710 },
      playerStart: { x: 195, y: 615 },
      enemySpawnMargin: { x: 40, y: 28 }
    },
    volga01: {
      name: 'Volga 01',
      region: 'volga',
      background: 'assets/backgrounds/5/street01.png',
      music: 'levelTheme',
      waves: [{ trigger: 'onEnter', enemies: [{ type: 'dogRegime', count: 2, side: 'right' }] }],
      walkZone: { left: 0, right: 1280, top: 550, bottom: 710 },
      playerStart: { x: 195, y: 615 },
      enemySpawnMargin: { x: 40, y: 28 }
    },
    volga02: {
      name: 'Volga 02',
      region: 'volga',
      background: 'assets/backgrounds/5/street02.png',
      music: 'levelTheme',
      waves: [{ trigger: 'onEnter', enemies: [{ type: 'dogRegime', count: 2, side: 'right' }] }],
      walkZone: { left: 0, right: 1280, top: 550, bottom: 710 },
      playerStart: { x: 195, y: 615 },
      enemySpawnMargin: { x: 40, y: 28 }
    },
    volga03: {
      name: 'Volga 03',
      region: 'volga',
      background: 'assets/backgrounds/5/street03.png',
      music: 'levelTheme',
      waves: [{ trigger: 'onEnter', enemies: [{ type: 'sucker', count: 1, side: 'right' }] }],
      walkZone: { left: 0, right: 1280, top: 550, bottom: 710 },
      playerStart: { x: 195, y: 615 },
      enemySpawnMargin: { x: 40, y: 28 }
    },
    south01: {
      name: 'South 01',
      region: 'south',
      background: 'assets/backgrounds/6/street01.png',
      music: 'levelTheme',
      waves: [{ trigger: 'onEnter', enemies: [{ type: 'dogRegime', count: 2, side: 'right' }] }],
      walkZone: { left: 0, right: 1280, top: 550, bottom: 710 },
      playerStart: { x: 195, y: 615 },
      enemySpawnMargin: { x: 40, y: 28 }
    },
    south02: {
      name: 'South 02',
      region: 'south',
      background: 'assets/backgrounds/6/street02.png',
      music: 'levelTheme',
      waves: [{ trigger: 'onEnter', enemies: [{ type: 'dogRegime', count: 2, side: 'right' }] }],
      walkZone: { left: 0, right: 1280, top: 550, bottom: 710 },
      playerStart: { x: 195, y: 615 },
      enemySpawnMargin: { x: 40, y: 28 }
    },
    south03: {
      name: 'South 03',
      region: 'south',
      background: 'assets/backgrounds/6/street03.png',
      music: 'levelTheme',
      waves: [{ trigger: 'onEnter', enemies: [{ type: 'sucker', count: 1, side: 'right' }] }],
      walkZone: { left: 0, right: 1280, top: 550, bottom: 710 },
      playerStart: { x: 195, y: 615 },
      enemySpawnMargin: { x: 40, y: 28 }
    },
    moscow01: {
      name: 'Moscow 01',
      region: 'moscow',
      background: 'assets/backgrounds/7/street01.png',
      music: 'levelTheme',
      waves: [{ trigger: 'onEnter', enemies: [{ type: 'dogRegime', count: 2, side: 'right' }] }],
      walkZone: { left: 0, right: 1280, top: 550, bottom: 710 },
      playerStart: { x: 195, y: 615 },
      enemySpawnMargin: { x: 40, y: 28 }
    },
    moscow02: {
      name: 'Moscow 02',
      region: 'moscow',
      background: 'assets/backgrounds/7/street02.png',
      music: 'levelTheme',
      waves: [{ trigger: 'onEnter', enemies: [{ type: 'dogRegime', count: 2, side: 'right' }] }],
      walkZone: { left: 0, right: 1280, top: 550, bottom: 710 },
      playerStart: { x: 195, y: 615 },
      enemySpawnMargin: { x: 40, y: 28 }
    },
    moscow03: {
      name: 'Moscow 03',
      region: 'moscow',
      background: 'assets/backgrounds/7/street03.png',
      music: 'bossTheme',
      waves: [{ trigger: 'onEnter', enemies: [{ type: 'sucker', count: 1, side: 'right' }] }],
      walkZone: { left: 0, right: 1280, top: 550, bottom: 710 },
      playerStart: { x: 195, y: 615 },
      enemySpawnMargin: { x: 40, y: 28 }
    }
  }
};

const DEFAULT_GAME_CONFIG = JSON.parse(JSON.stringify(GAME_CONFIG));
