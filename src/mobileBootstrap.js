(function () {
  if (typeof GameApp === 'undefined' || typeof MobileApp === 'undefined') return;
  if (GameApp.prototype.mobileBootstrapPatched) return;

  GameApp.prototype.mobileBootstrapPatched = true;

  function loadHitboxEditorPatch() {
    if (window.__hitboxEditorPatchRequested) return;
    window.__hitboxEditorPatchRequested = true;
    var script = document.createElement('script');
    script.src = 'src/hitboxEditorPatch.js?v=anatomy-hitboxes-2';
    script.defer = true;
    document.body.appendChild(script);
  }

  function applySmartDogDefaults() {
    if (typeof GAME_CONFIG === 'undefined' || !GAME_CONFIG.enemies || !GAME_CONFIG.enemies.dogRegime) return;
    var dog = GAME_CONFIG.enemies.dogRegime;
    if (dog.smartAiVersion >= 4) return;
    Object.assign(dog, {
      smartAiVersion: 4,
      minDistanceX: 44,
      preferredDistanceX: 64,
      tooFarDistanceX: 150,
      attackMinDistanceX: 30,
      attackMaxDistanceX: 128,
      attackRangeX: 128,
      attackRangeY: 42,
      clubReachForward: 142,
      clubReachBack: 16,
      maxAttackers: 1,
      decisionMinMs: 120,
      decisionMaxMs: 280,
      strafeChance: 0.32,
      retreatChance: 0.16,
      attackChance: 0.86,
      closeRetreatChance: 0.32,
      playerAttackFearDistance: 86,
      postAttackRetreatMs: 220,
      attackCooldownMinMs: 300,
      attackCooldownMaxMs: 520,
      backstabChance: 0.78,
      flankDistanceX: 112,
      pressureDistanceX: 160
    });
  }

  function patchMobileEnemyRoster() {
    if (typeof HUD === 'undefined' || HUD.mobileEnemyRosterPatchApplied) return;

    HUD.getEnemyRosterLayout = function () {
      var isMobile = typeof Responsive !== 'undefined' && Responsive.isTouchDevice;
      if (isMobile) {
        return { maxVisible: 4, cardW: 166, cardH: 42, gap: 5, x: 18, y: 100, portrait: 32, font: 'bold 13px Arial', nameMax: 14 };
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

        ctx.save();
        ctx.fillStyle = 'rgba(0,0,0,0.78)';
        ctx.fillRect(layout.x, y, layout.cardW, layout.cardH);
        ctx.strokeStyle = 'rgba(255,255,255,0.56)';
        ctx.lineWidth = 2;
        ctx.strokeRect(layout.x, y, layout.cardW, layout.cardH);

        ctx.fillStyle = 'rgba(255,255,255,0.12)';
        ctx.fillRect(layout.x + pad, y + pad, layout.portrait, layout.portrait);
        if (portrait) this.drawEnemyPortrait(ctx, portrait, layout.x + pad, y + pad, layout.portrait);

        ctx.fillStyle = '#fff';
        ctx.font = layout.font;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 3;
        var label = this.shorten(name, layout.nameMax);
        var tx = layout.x + pad * 2 + layout.portrait;
        var ty = y + layout.cardH / 2 + 1;
        ctx.strokeText(label, tx, ty);
        ctx.fillText(label, tx, ty);
        ctx.restore();
      }

      if (enemies.length > layout.maxVisible) {
        var moreY = layout.y + layout.maxVisible * (layout.cardH + layout.gap);
        ctx.fillStyle = 'rgba(0,0,0,0.65)';
        ctx.fillRect(layout.x, moreY, layout.cardW, 22);
        ctx.fillStyle = '#ddd';
        ctx.font = 'bold 11px Arial';
        ctx.fillText('+' + String(enemies.length - layout.maxVisible) + ' ещё', layout.x + 10, moreY + 15);
      }
    };

    HUD.mobileEnemyRosterPatchApplied = true;
  }

  loadHitboxEditorPatch();
  applySmartDogDefaults();
  patchMobileEnemyRoster();

  var originalEnsureMenuMusic = GameApp.prototype.ensureMenuMusic;
  GameApp.prototype.ensureMenuMusic = function () {
    if (MobileApp && MobileApp.isMobile && MobileApp.isMobile() && this.state === 'splash') return;
    originalEnsureMenuMusic.call(this);
  };

  var originalInit = GameApp.prototype.init;
  GameApp.prototype.init = async function () {
    window.game = this;
    await originalInit.call(this);
    window.game = this;
    loadHitboxEditorPatch();
    applySmartDogDefaults();
    patchMobileEnemyRoster();
    if (MobileApp && MobileApp.attach) MobileApp.attach(this);
  };

  var originalDrawOverlay = MobileApp.drawOverlay;
  MobileApp.drawOverlay = function (ctx, game) {
    if (typeof originalDrawOverlay === 'function') originalDrawOverlay.call(this, ctx, game);
    if (game && game.state === 'level' && game.scene && typeof HUD !== 'undefined' && typeof HUD.drawEnemyRoster === 'function') {
      HUD.drawEnemyRoster(ctx, game.scene);
    }
  };
})();
