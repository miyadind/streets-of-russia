(() => {
  if (!window.DevPanel && typeof DevPanel === 'undefined') return;
  const panel = window.DevPanel || DevPanel;
  if (!panel.fieldGroups || !panel.fieldGroups.DOG) return;

  const existing = new Set(panel.fieldGroups.DOG.map(field => field.path));
  const add = field => {
    if (!existing.has(field.path)) {
      panel.fieldGroups.DOG.push(field);
      existing.add(field.path);
    }
  };

  add({ label: 'Min dist X', path: 'enemies.dogRegime.minDistanceX', min: 20, max: 160, step: 2 });
  add({ label: 'Preferred dist X', path: 'enemies.dogRegime.preferredDistanceX', min: 40, max: 240, step: 2 });
  add({ label: 'Attack range X', path: 'enemies.dogRegime.attackRangeX', min: 30, max: 180, step: 2 });
  add({ label: 'Attack range Y', path: 'enemies.dogRegime.attackRangeY', min: 14, max: 90, step: 2 });
  add({ label: 'Max attackers', path: 'enemies.dogRegime.maxAttackers', min: 1, max: 4, step: 1 });
  add({ label: 'Decision min ms', path: 'enemies.dogRegime.decisionMinMs', min: 120, max: 1200, step: 20 });
  add({ label: 'Decision max ms', path: 'enemies.dogRegime.decisionMaxMs', min: 200, max: 2000, step: 20 });
  add({ label: 'Strafe chance', path: 'enemies.dogRegime.strafeChance', min: 0, max: 1, step: 0.05 });
  add({ label: 'Retreat chance', path: 'enemies.dogRegime.retreatChance', min: 0, max: 1, step: 0.05 });
  add({ label: 'Attack chance', path: 'enemies.dogRegime.attackChance', min: 0, max: 1, step: 0.05 });
  add({ label: 'Slot spacing X', path: 'enemies.dogRegime.slotSpacingX', min: 0, max: 180, step: 4 });
  add({ label: 'Slot spacing Y', path: 'enemies.dogRegime.slotSpacingY', min: 0, max: 120, step: 4 });
})();