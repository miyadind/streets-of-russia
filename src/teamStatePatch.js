(function () {
  if (typeof GameApp === 'undefined') return;

  const TEAM_HEROES = ['alexey', 'anna', 'boris'];

  function getHeroMaxHp(heroKey) {
    const hero = GAME_CONFIG.heroes && GAME_CONFIG.heroes[heroKey];
    return hero && Number(hero.hp) ? Number(hero.hp) : 100;
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function defaultHeroHp() {
    return {
      alexey: getHeroMaxHp('alexey'),
      anna: getHeroMaxHp('anna'),
      boris: getHeroMaxHp('boris')
    };
  }

  GameApp.prototype.ensureTeamHpState = function () {
    if (!this.heroHp) this.heroHp = defaultHeroHp();
    for (const key of TEAM_HEROES) {
      const maxHp = getHeroMaxHp(key);
      if (this.heroHp[key] == null || Number.isNaN(Number(this.heroHp[key]))) this.heroHp[key] = maxHp;
      this.heroHp[key] = clamp(Number(this.heroHp[key]), 0, maxHp);
    }
  };

  GameApp.prototype.saveCurrentHeroHp = function () {
    if (!this.scene || !this.scene.player) return;
    this.ensureTeamHpState();
    const key = this.scene.player.heroKey || this.selectedHero;
    if (!key || !TEAM_HEROES.includes(key)) return;
    this.heroHp[key] = clamp(Number(this.scene.player.hp) || 0, 0, getHeroMaxHp(key));
  };

  GameApp.prototype.applySavedHeroHp = function (player, heroKey) {
    this.ensureTeamHpState();
    const maxHp = getHeroMaxHp(heroKey);
    player.hp = clamp(this.heroHp[heroKey] == null ? maxHp : Number(this.heroHp[heroKey]), 1, maxHp);
  };

  const previousEnsureRunState = GameApp.prototype.ensureRunState;
  GameApp.prototype.ensureRunState = function () {
    if (previousEnsureRunState) previousEnsureRunState.call(this);
    this.ensureTeamHpState();
  };

  const previousResetTeamRun = GameApp.prototype.resetTeamRun;
  GameApp.prototype.resetTeamRun = function () {
    if (previousResetTeamRun) previousResetTeamRun.call(this);
    this.heroHp = defaultHeroHp();
  };

  const previousSendHeroToTeamSelect = GameApp.prototype.sendHeroToTeamSelect;
  GameApp.prototype.sendHeroToTeamSelect = function (scene, fallenHero) {
    this.ensureTeamHpState();
    if (fallenHero && TEAM_HEROES.includes(fallenHero)) this.heroHp[fallenHero] = 0;
    return previousSendHeroToTeamSelect.call(this, scene, fallenHero);
  };

  const previousHandleHeroDefeat = GameApp.prototype.handleHeroDefeat;
  GameApp.prototype.handleHeroDefeat = function (scene) {
    if (scene && scene.player) {
      this.ensureTeamHpState();
      const fallenHero = scene.player.heroKey || this.selectedHero;
      if (fallenHero && TEAM_HEROES.includes(fallenHero)) this.heroHp[fallenHero] = 0;
    }
    return previousHandleHeroDefeat.call(this, scene);
  };

  const previousResumeAfterHeroDefeat = GameApp.prototype.resumeAfterHeroDefeat;
  GameApp.prototype.resumeAfterHeroDefeat = function (heroKey) {
    const previousHero = this.scene && this.scene.player ? this.scene.player.heroKey : null;
    const switchingWithoutDeath = this.characterSelectMode === 'switchHero';
    if (switchingWithoutDeath && previousHero && previousHero !== heroKey) this.saveCurrentHeroHp();

    previousResumeAfterHeroDefeat.call(this, heroKey);

    if (this.scene && this.scene.player && this.scene.player.heroKey === heroKey) {
      this.applySavedHeroHp(this.scene.player, heroKey);
    }
  };

  const previousStartRetryRegion = GameApp.prototype.startRetryRegion;
  GameApp.prototype.startRetryRegion = function (heroKey) {
    this.heroHp = defaultHeroHp();
    previousStartRetryRegion.call(this, heroKey);
    if (this.scene && this.scene.player && this.scene.player.heroKey === heroKey) {
      this.applySavedHeroHp(this.scene.player, heroKey);
    }
  };

  const previousStartLevel = GameApp.prototype.startLevel;
  GameApp.prototype.startLevel = function () {
    // A region transition creates a new scene, but it is still the same run.
    // Keep the active hero's current HP before the old scene is replaced.
    this.ensureTeamHpState();
    this.saveCurrentHeroHp();
    previousStartLevel.call(this);
    if (this.scene && this.campaignMap && Number.isFinite(this.campaignMap.activeIndex)) {
      const targetIndex = window.CampaignRuntime
        ? window.CampaignRuntime.getActiveRegionStartIndex(this)
        : Math.max(0, Math.min(this.scene.images.streets.length - 1, this.campaignMap.activeIndex * 3));
      if (this.scene.screenIndex !== targetIndex) {
        if (window.CampaignRuntime) window.CampaignRuntime.setSceneScreen(this.scene, targetIndex);
        else {
          this.scene.screenIndex = targetIndex;
          if (this.scene.spawnInitialWave) this.scene.spawnInitialWave();
        }
      }
    }
    if (this.scene && this.scene.player) {
      this.applySavedHeroHp(this.scene.player, this.scene.player.heroKey || this.selectedHero);
    }
  };

  if (typeof HUD !== 'undefined') {
    HUD.draw = function (ctx, scene) {
      const game = scene.game;
      if (game && game.ensureRunState) game.ensureRunState();

      ctx.fillStyle = 'rgba(0,0,0,0.66)';
      ctx.fillRect(0, 0, GAME_CONFIG.width, 92);

      for (let i = 0; i < TEAM_HEROES.length; i++) {
        const key = TEAM_HEROES[i];
        const hero = GAME_CONFIG.heroes[key];
        const x = 122 + i * 205;
        const active = scene.player.heroKey === key;
        const defeated = !!(game && game.defeatedHeroes && game.defeatedHeroes[key]);
        const savedHp = game && game.heroHp ? game.heroHp[key] : getHeroMaxHp(key);
        const hp = defeated ? 0 : (active ? scene.player.hp : savedHp);
        const pct = Math.max(0, Math.min(1, hp / getHeroMaxHp(key)));

        ctx.fillStyle = active ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.04)';
        ctx.fillRect(x, 12, 180, 60);

        ctx.fillStyle = defeated ? '#555' : hero.color;
        ctx.fillRect(x + 8, 18, 42, 42);
        ctx.fillStyle = '#111';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(hero.name[0], x + 29, 44);
        ctx.textAlign = 'left';

        ctx.fillStyle = defeated ? 'rgba(255,255,255,0.42)' : '#fff';
        ctx.font = 'bold 14px Arial';
        ctx.fillText(hero.name, x + 58, 28);

        ctx.fillStyle = '#222';
        ctx.fillRect(x + 58, 38, 108, 12);
        ctx.fillStyle = defeated ? '#666' : (pct > 0.55 ? 'lime' : pct > 0.25 ? 'yellow' : 'red');
        ctx.fillRect(x + 58, 38, 108 * pct, 12);
        ctx.strokeStyle = defeated ? '#555' : '#777';
        ctx.strokeRect(x + 58, 38, 108, 12);

        if (defeated) {
          ctx.font = 'bold 11px Arial';
          ctx.fillStyle = 'rgba(255,255,255,0.55)';
          ctx.fillText('ВЫБЫЛ', x + 58, 64);
        }
      }

      if (this.drawSupportButtons) {
        this.drawSupportButtons(ctx, scene, 755, 22);
      }
      if (this.drawLowHpSwitchHint) {
        this.drawLowHpSwitchHint(ctx, scene);
      }
      if (this.drawSuckerPinHint) {
        this.drawSuckerPinHint(ctx, scene);
      }
    };
  }
})();
