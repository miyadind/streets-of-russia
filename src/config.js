const GAME_CONFIG = {
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
  yHitTolerance: 34,

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
      speed: 2.6,
      damage: 16,
      scale: 0.185,
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
      speed: 3.15,
      damage: 12,
      scale: 0.11,
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
      speed: 2.25,
      damage: 22,
      scale: 0.16,
      strength: 7,
      speedStat: 3,
      health: 8,
      color: '#5fd65f',
      abilities: { rangedImmune: true },
      tagline: 'Тяжёлый боец с большим запасом здоровья',
      bio: 'Политик старой школы, который не отступает, когда улица становится опасной. В игре Борис медленнее остальных, но зато выдерживает больше ударов и бьёт тяжелее.',
      ability: 'Стальная выдержка: Борис не получает урон от дальних атак. Прыжковые и разгонные атаки врагов по нему не проходят.'
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
      speed: 1.35,
      damage: 10,
      scale: 0.105,
      bossMusic: false,
      bossMusicKey: 'bossTheme',
      minDistanceX: 42,
      preferredDistanceX: 76,
      attackRangeX: 74,
      attackRangeY: 34,
      maxAttackers: 1,
      decisionMinMs: 260,
      decisionMaxMs: 620,
      strafeChance: 0.38,
      retreatChance: 0.08,
      attackChance: 0.72,
      slotSpacingX: 46,
      slotSpacingY: 32,
      flankDistanceX: 105,
      pressureDistanceX: 150
    },
    zetnik: {
      name: 'Зетник',
      hp: 110,
      speed: 1.55,
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
      speed: 1.15,
      damage: 12,
      scale: 0.13,
      bossMusic: true,
      bossMusicKey: 'bossTheme',
      attackStartDistance: 420,
      minDistance: 220,
      alignToleranceY: 30,
      slideSpeed: 7.25,
      slideRange: 520,
      windupMs: 560,
      slideRecoveryMs: 650,
      interruptedRecoveryMs: 1100,
      counterRangeX: 150,
      counterRangeY: 58,
      pinDurationMs: 1700,
      biteTickMs: 450,
      biteDamage: 6,
      otherEnemyScatterDistance: 120
    },
    bastard: {
      name: 'Bastard',
      hp: 9999,
      speed: 0.75,
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
      knockbackX: 34
    }
  },

  levelOrder: ['street01', 'street02', 'street03'],

  levels: {
    street01: {
      name: 'Street 01',
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
      name: 'Street 02',
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
            { type: 'dogRegime', count: 2, side: 'left' }
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
      name: 'Street 03',
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
            { type: 'sucker', count: 1, side: 'right' }
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
    }
  }
};

const DEFAULT_GAME_CONFIG = JSON.parse(JSON.stringify(GAME_CONFIG));