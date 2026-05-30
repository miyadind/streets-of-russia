const GAME_CONFIG = {
  width: 1280,
  height: 720,
  targetFPS: 60,

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
    alexey: { name: 'Алексей', role: 'balanced', hp: 120, speed: 4.1, damage: 20, strength: 5, speedStat: 5, health: 5, color: '#4f9cff' },
    anna: { name: 'Анна', role: 'fast', hp: 85, speed: 4.85, damage: 14, strength: 3, speedStat: 7, health: 4, color: '#c163ff' },
    boris: { name: 'Борис', role: 'tank', hp: 160, speed: 3.55, damage: 28, strength: 7, speedStat: 3, health: 8, color: '#5fd65f' }
  }
};
