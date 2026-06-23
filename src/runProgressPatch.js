(function () {
  if (typeof GameApp === 'undefined' || typeof Menu === 'undefined') return;

  function inRect(point, rect) {
    return point && point.x >= rect.x && point.x <= rect.x + rect.w && point.y >= rect.y && point.y <= rect.y + rect.h;
  }

  function getCampaignProgress(game) {
    return game && game.campaignMap && Number.isFinite(game.campaignMap.activeIndex)
      ? game.campaignMap.activeIndex
      : 0;
  }

  function canContinue(game) {
    return !!(game && (game.runInProgress || game.scene || getCampaignProgress(game) > 0));
  }

  function getMenuItems(game) {
    const items = [];
    if (canContinue(game)) items.push({ key: 'continue', label: 'ПРОДОЛЖИТЬ' });
    items.push({ key: 'newGame', label: 'НОВАЯ ИГРА' });
    items.push({ key: 'bestiary', label: 'ТВАРИ' });
    items.push({ key: 'settings', label: 'НАСТРОЙКИ' });
    return items;
  }

  function setCharacterSelectForCampaign(game) {
    game.runInProgress = true;
    game.resumeTarget = 'campaignMap';
    game.characterSelectMode = 'campaignStart';
    if (typeof CharacterSelect !== 'undefined') {
      CharacterSelect.infoOpen = false;
      CharacterSelect.footerFocus = null;
      CharacterSelect.gameRef = game;
    }
    game.setState('characterSelect');
  }

  const previousSetState = GameApp.prototype.setState;
  GameApp.prototype.setState = function (nextState) {
    const previousState = this.state;

    if (nextState === 'mainMenu') {
      if (previousState === 'level' && this.scene) this.resumeTarget = 'level';
      if (previousState === 'campaignMap') this.resumeTarget = 'campaignMap';
    }

    previousSetState.call(this, nextState);
  };

  GameApp.prototype.startNewCampaign = function () {
    this.runInProgress = true;
    this.resumeTarget = 'campaignMap';
    this.scene = null;
    this.paused = false;
    this.characterSelectMode = null;
    this.casualtyRespawn = null;
    if (this.campaignMap && this.campaignMap.resetProgress) this.campaignMap.resetProgress();
    if (this.resetTeamRun) this.resetTeamRun();
    if (this.startIntro) this.startIntro();
    else this.setState('campaignMap');
  };

  GameApp.prototype.continueCampaignRun = function () {
    if (!canContinue(this)) return false;

    AudioManager.unlock();
    AudioManager.playSfx('menuSelect', 0.85);

    if (this.resumeTarget === 'campaignMap' || !this.scene) {
      this.paused = false;
      this.characterSelectMode = null;
      this.setState('campaignMap');
      this.ensureMenuMusic();
      return true;
    }

    this.paused = false;
    this.characterSelectMode = null;
    this.setState('level');
    const level = this.scene && this.scene.getLevelConfig ? this.scene.getLevelConfig() : null;
    AudioManager.playMusic((level && level.music) || (GAME_CONFIG.audio && GAME_CONFIG.audio.music && GAME_CONFIG.audio.music.level) || 'levelTheme');
    return true;
  };

  if (typeof CampaignMapScreen !== 'undefined') {
    const previousCompleteActiveRegion = CampaignMapScreen.completeActiveRegion;
    CampaignMapScreen.completeActiveRegion = function () {
      previousCompleteActiveRegion.call(this);
      if (window.game) {
        window.game.runInProgress = true;
        window.game.resumeTarget = 'campaignMap';
        window.game.scene = null;
      }
    };

    CampaignMapScreen.update = function (game) {
      const click = Input.consumePointer();
      if (Input.consume('escape')) {
        game.runInProgress = true;
        game.resumeTarget = 'campaignMap';
        game.setState('mainMenu');
        return;
      }

      const startButton = this.getDesktopStartButton ? this.getDesktopStartButton() : null;
      if (Input.consume('enter') || Input.consume('space') || click && (!startButton || inRect(click, startButton))) {
        AudioManager.unlock();
        AudioManager.playSfx('menuSelect', 0.85);
        setCharacterSelectForCampaign(game);
      }
    };
  }

  Menu.getRuntimeItems = function (game) {
    return getMenuItems(game);
  };

  Menu.getItemBox = function (index, game) {
    const count = getMenuItems(game || window.game).length;
    const startY = count >= 4 ? 256 : 300;
    return { x: 485, y: startY + index * 70, w: 310, h: 54 };
  };

  Menu.update = function (game) {
    const items = this.getRuntimeItems(game);
    if (this.selectedIndex >= items.length) this.selectedIndex = items.length - 1;
    if (this.selectedIndex < 0) this.selectedIndex = 0;

    if (!Responsive.isTouchDevice && Input.pointer) {
      for (let i = 0; i < items.length; i++) {
        if (inRect(Input.pointer, this.getItemBox(i, game))) {
          this.selectedIndex = i;
          break;
        }
      }
    }

    if (Input.consume('arrowup') || Input.consume('w')) {
      this.selectedIndex = (this.selectedIndex + items.length - 1) % items.length;
      AudioManager.playSfx('menuMove', 0.75);
    }
    if (Input.consume('arrowdown') || Input.consume('s')) {
      this.selectedIndex = (this.selectedIndex + 1) % items.length;
      AudioManager.playSfx('menuMove', 0.75);
    }

    const click = Input.consumePointer();
    if (click) {
      AudioManager.unlock();
      for (let i = 0; i < items.length; i++) {
        if (!inRect(click, this.getItemBox(i, game))) continue;
        this.selectedIndex = i;
        this.activate(game);
        return;
      }
    }

    if (Input.consume('enter') || Input.consume('space')) {
      AudioManager.unlock();
      this.activate(game);
    }
  };

  Menu.activate = function (game) {
    const items = this.getRuntimeItems(game);
    const item = items[this.selectedIndex];
    if (!item) return;

    if (item.key === 'continue') {
      game.continueCampaignRun();
      return;
    }

    AudioManager.playSfx('menuSelect', 0.85);

    if (item.key === 'newGame') {
      game.startNewCampaign();
      return;
    }

    if (item.key === 'settings') game.setState('settings');
  };

  Menu.draw = function (ctx, images) {
    ctx.drawImage(images.main, 0, 0, GAME_CONFIG.width, GAME_CONFIG.height);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.fillRect(0, 0, GAME_CONFIG.width, GAME_CONFIG.height);

    const items = this.getRuntimeItems(window.game);
    if (this.selectedIndex >= items.length) this.selectedIndex = items.length - 1;
    if (this.selectedIndex < 0) this.selectedIndex = 0;

    for (let i = 0; i < items.length; i++) {
      const box = this.getItemBox(i, window.game);
      const active = i === this.selectedIndex;
      ctx.fillStyle = active ? 'rgba(255,255,255,0.16)' : 'rgba(0,0,0,0.28)';
      ctx.strokeStyle = active ? '#ffffff' : 'rgba(255,255,255,0.45)';
      ctx.lineWidth = active ? 4 : 2;
      ctx.fillRect(box.x, box.y, box.w, box.h);
      ctx.strokeRect(box.x, box.y, box.w, box.h);
      ctx.font = 'bold 28px Arial';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 4;
      ctx.strokeText(items[i].label, box.x + box.w / 2, box.y + 36);
      ctx.fillText(items[i].label, box.x + box.w / 2, box.y + 36);
    }
    ctx.textAlign = 'left';
  };

  if (typeof CharacterSelect !== 'undefined') {
    function goBack(game) {
      AudioManager.playSfx('menuSelect', 0.65);
      const mode = game.characterSelectMode;
      game.characterSelectMode = null;

      if ((mode === 'casualty' || mode === 'switchHero') && game.scene) {
        game.setState('level');
        return;
      }

      if (mode === 'campaignStart') {
        game.resumeTarget = 'campaignMap';
        game.setState('campaignMap');
        return;
      }

      game.setState('mainMenu');
    }

    CharacterSelect.confirm = function (game) {
      const heroKey = this.heroes[this.selectedIndex];
      if (this.isHeroDisabled && this.isHeroDisabled(game, heroKey)) {
        AudioManager.playSfx('menuBack', 0.65);
        return;
      }

      game.selectedHero = heroKey;
      AudioManager.playSfx('menuSelect', 0.85);

      if ((game.characterSelectMode === 'casualty' || game.characterSelectMode === 'switchHero') && game.resumeAfterHeroDefeat) {
        game.resumeAfterHeroDefeat(heroKey);
        return;
      }

      if (game.characterSelectMode === 'retryRegion' && game.startRetryRegion) {
        game.startRetryRegion(heroKey);
        return;
      }

      game.characterSelectMode = null;
      game.runInProgress = true;
      game.resumeTarget = 'level';
      if (game.resetTeamRun) game.resetTeamRun();
      game.startLevel();
    };

    CharacterSelect.update = function (game) {
      this.gameRef = game;
      if (this.isHeroDisabled && this.isHeroDisabled(game, this.heroes[this.selectedIndex])) {
        this.selectedIndex = this.findFirstAvailableIndex ? this.findFirstAvailableIndex(game) : 0;
      }

      if (this.infoOpen) {
        if (Input.consume('escape') || Input.consume('i') || Input.consume('backspace') || Input.consume('enter') || Input.consume('space')) {
          this.closeInfo();
          return;
        }
        const infoClick = Input.consumePointer();
        if (infoClick) this.closeInfo();
        return;
      }

      if (Input.consume('arrowdown') || Input.consume('s')) {
        this.footerFocus = 'confirm';
        AudioManager.playSfx('menuMove', 0.65);
      }
      if (Input.consume('arrowup') || Input.consume('w')) {
        if (this.footerFocus) AudioManager.playSfx('menuMove', 0.65);
        this.footerFocus = null;
      }
      if (Input.consume('arrowleft') || Input.consume('a')) {
        if (this.footerFocus) this.moveFooterFocus(-1);
        else this.moveSelection(-1, game);
      }
      if (Input.consume('arrowright') || Input.consume('d')) {
        if (this.footerFocus) this.moveFooterFocus(1);
        else this.moveSelection(1, game);
      }

      if (Input.consume('i')) this.openInfo();
      if (Input.consume('escape')) {
        goBack(game);
        return;
      }

      const click = Input.consumePointer();
      if (click) {
        for (let i = 0; i < this.heroes.length; i++) {
          const info = this.getInfoButtonBox(i);
          if (this.isPointInCircle(click, info)) {
            this.selectedIndex = i;
            this.footerFocus = null;
            this.openInfo();
            return;
          }
          const box = this.getCardBox(i);
          if (this.isPointInBox(click, box)) {
            this.setSelection(i, game);
            this.footerFocus = null;
          }
        }

        if (this.isPointInBox(click, this.getBackBox())) {
          goBack(game);
          return;
        }
        if (this.isPointInBox(click, this.getConfirmBox())) {
          this.confirm(game);
          return;
        }
      }

      if (Input.consume('enter') || Input.consume('space')) {
        if (this.footerFocus === 'back') goBack(game);
        else this.confirm(game);
      }
    };
  }
})();
