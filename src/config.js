const GAME_CONFIG = {
  width: 1280,
  height: 720,
  targetFPS: 60,

  adminTuningEnabled: true,

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
  enemyDeathFadeMs: 1200,

  heroes: {
    alexey: { name: 'Алексей', role: 'balanced', hp: 120, speed: 2.6, damage: 16, strength: 5, speedStat: 5, health: 5, color: '#4f9cff' },
    anna: { name: 'Анна', role: 'fast', hp: 85, speed: 3.15, damage: 12, strength: 3, speedStat: 7, health: 4, color: '#c163ff' },
    boris: { name: 'Борис', role: 'tank', hp: 160, speed: 2.25, damage: 22, strength: 7, speedStat: 3, health: 8, color: '#5fd65f' }
  },

  enemies: {
    dogRegime: {
      name: 'Пёс режима',
      hp: 90,
      speed: 1.35,
      damage: 10
    }
  }
};

const DEFAULT_GAME_CONFIG = JSON.parse(JSON.stringify(GAME_CONFIG));
