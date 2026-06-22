(function () {
  if (typeof GameApp === 'undefined' || typeof MobileApp === 'undefined') return;
  if (GameApp.prototype.mobileBootstrapPatched) return;

  GameApp.prototype.mobileBootstrapPatched = true;

  function applySmartDogDefaults() {
    if (typeof GAME_CONFIG === 'undefined' || !GAME_CONFIG.enemies || !GAME_CONFIG.enemies.dogRegime) return;
    var dog = GAME_CONFIG.enemies.dogRegime;
    if (dog.smartAiVersion >= 2) return;
    Object.assign(dog, {
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
    });
  }

  function patchMobileEnemyRoster() {
    if (typeof HUD === 'undefined' || HUD.mobileEnemyRosterPatchApplied) return;

    HUD.getEnemyRosterLayout = function () {
      var isMobile = typeof Responsive !== 'undefined' && Responsive.isTouchDevice;
      if (isMobile) {
        return { maxVisible: 4, cardW: 154, cardH: 40, gap: 5, x: 18, y: 96, portrait: 30, font: 'bold 12px Arial', nameMax: 13 };
      }
      return { maxVisible: 6, cardW: 170, cardH: 46, gap: 6, x: GAME_CONFIG.width - 188, y: 96, portrait: 36, font: 'bold 13px Arial', nameMax: 15 };
    };

    HUD.drawEnemyRoster = function (ctx, scene) {
      var enemies = (scene.enemies || []).filter(function (enemy) { return enemy && enemy.alive && !enemy.remove; });
      if (enemies.length === 0) return;

      var layout = this.getEnemyRosterLayout();
      var visibleEnemies = enemies.slice(0, layout.maxVisible);

      for (var i = 0; i < visibleEnemies.length; i++) {
        var enemy = visibleEnemies[i];
        var y = layout.y + i * (layout.cardH + layout.gap);
        var config = (GAME_CONFIG.enemies && GAME_CONFIG.enemies[enemy.enemyType]) || {};
        var name = config.name || enemy.enemyType || 'Враг';
        var portrait = this.getEnemyPortraitImage(scene, enemy);
        var pad = Math.max(4, Math.round((layout.cardH - layout.portrait) / 2));

        ctx.fillStyle = 'rgba(0,0,0,0.62)';
        ctx.fillRect(layout.x, y, layout.cardW, layout.cardH);
        ctx.strokeStyle = 'rgba(255,255,255,0.28)';
        ctx.strokeRect(layout.x, y, layout.cardW, layout.cardH);

        ctx.fillStyle = 'rgba(255,255,255,0.09)';
        ctx.fillRect(layout.x + pad, y + pad, layout.portrait, layout.portrait);
        if (portrait) this.drawEnemyPortrait(ctx, portrait, layout.x + pad, y + pad, layout.portrait);

        ctx.fillStyle = '#fff';
        ctx.font = layout.font;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.shorten(name, layout.nameMax), layout.x + pad * 2 + layout.portrait, y + layout.cardH / 2 + 1);
        ctx.textBaseline = 'alphabetic';
      }

      if (enemies.length > layout.maxVisible) {
        var moreY = layout.y + layout.maxVisible * (layout.cardH + layout.gap);
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillRect(layout.x, moreY, layout.cardW, 22);
        ctx.fillStyle = '#ddd';
        ctx.font = 'bold 11px Arial';
        ctx.fillText('+' + String(enemies.length - layout.maxVisible) + ' ещё', layout.x + 10, moreY + 15);
      }
    };

    HUD.mobileEnemyRosterPatchApplied = true;
  }

  applySmartDogDefaults();
  patchMobileEnemyRoster();

  var originalEnsureMenuMusic = GameApp.prototype.ensureMenuMusic;
  GameApp.prototype.ensureMenuMusic = function () {
    if (MobileApp && MobileApp.isMobile && MobileApp.isMobile() && this.state === 'splash') return;
    originalEnsureMenuMusic.call(this);
  };

  var originalInit = GameApp.prototype.init;
  GameApp.prototype.init = async function () {
    await originalInit.call(this);
    applySmartDogDefaults();
    patchMobileEnemyRoster();
    if (MobileApp && MobileApp.attach) MobileApp.attach(this);
  };
})();