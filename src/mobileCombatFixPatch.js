(function () {
  const SMART_DOG_DEFAULTS = {
    smartAiVersion: 2,
    minDistanceX: 58,
    preferredDistanceX: 86,
    tooFarDistanceX: 150,
    attackMinDistanceX: 50,
    attackMaxDistanceX: 88,
    attackRangeX: 74,
    attackRangeY: 34,
    maxAttackers: 1,
    decisionMinMs: 220,
    decisionMaxMs: 520,
    strafeChance: 0.52,
    retreatChance: 0.22,
    attackChance: 0.46,
    closeRetreatChance: 0.78,
    playerAttackFearDistance: 126,
    postAttackRetreatMs: 320,
    flankDistanceX: 116,
    pressureDistanceX: 160
  };

  function applySmartDogDefaults() {
    if (typeof GAME_CONFIG === 'undefined' || !GAME_CONFIG.enemies || !GAME_CONFIG.enemies.dogRegime) return;
    const dog = GAME_CONFIG.enemies.dogRegime;
    if (dog.smartAiVersion >= SMART_DOG_DEFAULTS.smartAiVersion) return;
    Object.assign(dog, SMART_DOG_DEFAULTS);
  }

  if (typeof DevPanel !== 'undefined' && !DevPanel.mobileCombatFixPatchApplied) {
    const originalLoad = DevPanel.load;
    DevPanel.load = function () {
      if (typeof originalLoad === 'function') originalLoad.call(this);
      applySmartDogDefaults();
      if (window.game && window.game.scene && typeof this.applyToCurrentScene === 'function') {
        this.applyToCurrentScene(window.game);
      }
    };

    const originalMigrateConfig = DevPanel.migrateConfig;
    DevPanel.migrateConfig = function () {
      if (typeof originalMigrateConfig === 'function') originalMigrateConfig.call(this);
      applySmartDogDefaults();
    };

    DevPanel.mobileCombatFixPatchApplied = true;
  }

  applySmartDogDefaults();

  if (typeof HUD !== 'undefined' && !HUD.mobileEnemyRosterPatchApplied) {
    HUD.getEnemyRosterLayout = function () {
      const isMobile = typeof Responsive !== 'undefined' && Responsive.isTouchDevice;
      if (isMobile) {
        return {
          maxVisible: 4,
          cardW: 154,
          cardH: 40,
          gap: 5,
          x: 18,
          y: 96,
          portrait: 30,
          font: 'bold 12px Arial',
          nameMax: 13
        };
      }

      return {
        maxVisible: 6,
        cardW: 170,
        cardH: 46,
        gap: 6,
        x: GAME_CONFIG.width - 170 - 18,
        y: 96,
        portrait: 36,
        font: 'bold 13px Arial',
        nameMax: 15
      };
    };

    HUD.drawEnemyRoster = function (ctx, scene) {
      const enemies = (scene.enemies || []).filter(enemy => enemy && enemy.alive && !enemy.remove);
      if (enemies.length === 0) return;

      const layout = this.getEnemyRosterLayout();
      const visibleEnemies = enemies.slice(0, layout.maxVisible);

      for (let i = 0; i < visibleEnemies.length; i++) {
        const enemy = visibleEnemies[i];
        const y = layout.y + i * (layout.cardH + layout.gap);
        const config = (GAME_CONFIG.enemies && GAME_CONFIG.enemies[enemy.enemyType]) || {};
        const name = config.name || enemy.enemyType || 'Враг';
        const portrait = this.getEnemyPortraitImage(scene, enemy);
        const portraitPad = Math.max(4, Math.round((layout.cardH - layout.portrait) / 2));

        ctx.fillStyle = 'rgba(0,0,0,0.62)';
        ctx.fillRect(layout.x, y, layout.cardW, layout.cardH);
        ctx.strokeStyle = 'rgba(255,255,255,0.28)';
        ctx.strokeRect(layout.x, y, layout.cardW, layout.cardH);

        ctx.fillStyle = 'rgba(255,255,255,0.09)';
        ctx.fillRect(layout.x + portraitPad, y + portraitPad, layout.portrait, layout.portrait);
        if (portrait) this.drawEnemyPortrait(ctx, portrait, layout.x + portraitPad, y + portraitPad, layout.portrait);

        ctx.fillStyle = '#fff';
        ctx.font = layout.font;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.shorten(name, layout.nameMax), layout.x + portraitPad * 2 + layout.portrait, y + layout.cardH / 2 + 1);
        ctx.textBaseline = 'alphabetic';
      }

      if (enemies.length > layout.maxVisible) {
        const moreY = layout.y + layout.maxVisible * (layout.cardH + layout.gap);
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillRect(layout.x, moreY, layout.cardW, 22);
        ctx.fillStyle = '#ddd';
        ctx.font = 'bold 11px Arial';
        ctx.fillText(`+${enemies.length - layout.maxVisible} ещё`, layout.x + 10, moreY + 15);
      }
    };

    HUD.mobileEnemyRosterPatchApplied = true;
  }
})();