// Adds Sucker-specific balance controls without changing the main DevPanel layout logic.
(function patchDevPanelForSucker() {
  if (typeof DevPanel === 'undefined') return;

  const originalInit = DevPanel.init.bind(DevPanel);
  DevPanel.init = function patchedInit() {
    originalInit();

    const suckerFields = [
      { label: 'Sucker speed', path: 'enemies.sucker.speed', min: 0.3, max: 4, step: 0.05 },
      { label: 'Sucker HP', path: 'enemies.sucker.hp', min: 20, max: 500, step: 5 },
      { label: 'Sucker damage', path: 'enemies.sucker.damage', min: 1, max: 60, step: 1 },
      { label: 'Sucker scale', path: 'enemies.sucker.scale', min: 0.05, max: 0.25, step: 0.005 },
      { label: 'Sucker slide speed', path: 'enemies.sucker.slideSpeed', min: 2, max: 18, step: 0.25 },
      { label: 'Sucker slide range', path: 'enemies.sucker.slideRange', min: 120, max: 900, step: 20 },
      { label: 'Sucker preferred dist', path: 'enemies.sucker.preferredDistance', min: 120, max: 700, step: 10 },
      { label: 'Sucker min dist', path: 'enemies.sucker.minDistance', min: 60, max: 500, step: 10 },
      { label: 'Sucker align Y', path: 'enemies.sucker.alignToleranceY', min: 8, max: 90, step: 2 },
      { label: 'Sucker windup ms', path: 'enemies.sucker.windupMs', min: 80, max: 1200, step: 20 },
      { label: 'Sucker recovery ms', path: 'enemies.sucker.slideRecoveryMs', min: 100, max: 1400, step: 20 },
      { label: 'Sucker pin ms', path: 'enemies.sucker.pinDurationMs', min: 400, max: 3500, step: 50 },
      { label: 'Sucker bite tick', path: 'enemies.sucker.biteTickMs', min: 150, max: 1200, step: 25 },
      { label: 'Sucker bite dmg', path: 'enemies.sucker.biteDamage', min: 1, max: 40, step: 1 },
      { label: 'Enemy scatter', path: 'enemies.sucker.otherEnemyScatterDistance', min: 0, max: 300, step: 10 }
    ];

    for (const field of suckerFields) {
      if (!this.fields.some(existing => existing.path === field.path)) this.fields.push(field);
    }
  };
})();