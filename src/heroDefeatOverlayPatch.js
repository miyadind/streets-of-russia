(function () {
  if (typeof GameApp === 'undefined' || typeof LevelScene === 'undefined' || typeof CharacterSelect === 'undefined') return;

  const originalHandleHeroDefeat = GameApp.prototype.handleHeroDefeat;
  const originalGameUpdate = GameApp.prototype.update;
  const originalGameDraw = GameApp.prototype.draw;
  const originalSceneUpdate = LevelScene.prototype.update;
  const previousCharacterUpdate = CharacterSelect.update;
  const previousCharacterDraw = CharacterSelect.draw;
  const previousDrawCard = CharacterSelect.drawCard;

  function isCasualtyOverlay(game) {
    return !!(game && game.state === 'characterSelect' && game.characterSelectMode === 'casualty' && game.scene);
  }

  function finishPendingDefeat(game) {
    const pending = game.heroDefeatOverlay;
    if (!pending || pending.completed) return;
    pending.completed = true;
    game.heroDefeatOverlay = null;
    if (pending.scene) pending.scene.heroDefeatPending = false;
    game.__forceHeroDefeatNow = true;
    originalHandleHeroDefeat.call(game, pending.scene);
    game.__forceHeroDefeatNow = false;
    game.characterSelectOverlayOnLevel = game.state === 'characterSelect' && game.characterSelectMode === 'casualty';
  }

  function getOverlayConfirmBox() {
    return { x: GAME_CONFIG.width / 2 - 130, y: 628, w: 260, h: 46 };
  }

  GameApp.prototype.handleHeroDefeat = function (scene) {
    if (this.__forceHeroDefeatNow || !scene || !scene.player) {
      return originalHandleHeroDefeat.call(this, scene);
    }

    if (this.heroDefeatOverlay && this.heroDefeatOverlay.scene === scene) return;
    const holdMs = GAME_CONFIG.heroDefeatHoldMs || 1150;
    const fallenHero = scene.player.heroKey || this.selectedHero || 'boris';
    scene.player.hp = 0;
    scene.player.state = 'knockdown';
    scene.player.knockdownTimer = Math.max(scene.player.knockdownTimer || 0, holdMs);
    scene.player.invulnerableTimer = Math.max(scene.player.invulnerableTimer || 0, holdMs);
    scene.player.flash = 0;
    scene.player.attackTimer = 0;
    scene.player.attackHasHit = false;
    scene.player.comboStep = 0;
    scene.player.pinnedBy = null;
    scene.heroDefeatPending = true;
    this.heroDefeatOverlay = { scene, fallenHero, timer: holdMs, completed: false };
    AudioManager.playSfx('playerDown', 0.8);
  };

  LevelScene.prototype.update = function (dt) {
    if (this.heroDefeatPending) return;
    originalSceneUpdate.call(this, dt);
  };

  GameApp.prototype.update = function (dt) {
    if (this.heroDefeatOverlay && !this.heroDefeatOverlay.completed) {
      DevPanel.update(this);
      const click = Input.consumePointer();
      if (click && this.handleSpeakerClick(click)) return;
      if (DevPanel.open) return;
      this.heroDefeatOverlay.timer -= dt;
      if (this.heroDefeatOverlay.timer <= 0) finishPendingDefeat(this);
      return;
    }
    originalGameUpdate.call(this, dt);
  };

  GameApp.prototype.draw = function () {
    if (isCasualtyOverlay(this)) {
      const ctx = this.ctx;
      ctx.clearRect(0, 0, GAME_CONFIG.width, GAME_CONFIG.height);
      this.scene.draw(ctx);
      ctx.fillStyle = 'rgba(0,0,0,0.62)';
      ctx.fillRect(0, 0, GAME_CONFIG.width, GAME_CONFIG.height);
      CharacterSelect.gameRef = this;
      CharacterSelect.draw(ctx, this.images);
      this.drawSpeaker(ctx);
      DevPanel.draw(ctx);
      return;
    }
    originalGameDraw.call(this);
  };

  CharacterSelect.update = function (game) {
    const overlay = game && game.characterSelectOverlayOnLevel && game.characterSelectMode === 'casualty';
    if (!overlay) return previousCharacterUpdate.call(this, game);

    this.gameRef = game;
    this.footerFocus = 'confirm';
    if (this.isHeroDisabled(game, this.heroes[this.selectedIndex])) {
      this.selectedIndex = this.findFirstAvailableIndex(game);
    }

    if (this.infoOpen) {
      if (Input.consume('escape') || Input.consume('i') || Input.consume('backspace') || Input.consume('enter') || Input.consume('space')) {
        this.closeInfo();
        return;
      }
      if (Input.consumePointer()) this.closeInfo();
      return;
    }

    if (Input.consume('arrowleft') || Input.consume('a')) this.moveSelection(-1, game);
    if (Input.consume('arrowright') || Input.consume('d')) this.moveSelection(1, game);
    Input.consume('arrowup');
    Input.consume('arrowdown');
    Input.consume('w');
    Input.consume('s');

    if (Input.consume('i')) this.openInfo();
    if (Input.consume('escape') || Input.consume('backspace')) {
      AudioManager.playSfx('menuBack', 0.45);
      return;
    }

    const click = Input.consumePointer();
    if (click) {
      for (let i = 0; i < this.heroes.length; i++) {
        const info = this.getInfoButtonBox(i);
        if (this.isPointInCircle(click, info)) {
          if (!this.isHeroDisabled(game, this.heroes[i])) this.selectedIndex = i;
          this.openInfo();
          return;
        }

        const box = this.getCardBox(i);
        if (this.isPointInBox(click, box)) {
          this.setSelection(i, game);
          return;
        }
      }

      if (this.isPointInBox(click, getOverlayConfirmBox())) {
        this.confirm(game);
        return;
      }
    }

    if (Input.consume('enter') || Input.consume('space')) this.confirm(game);
  };

  CharacterSelect.draw = function (ctx, images) {
    const overlay = this.gameRef && this.gameRef.characterSelectOverlayOnLevel && this.gameRef.characterSelectMode === 'casualty';
    if (!overlay) return previousCharacterDraw.call(this, ctx, images);

    this.drawTitle(ctx, 'ВЫБЕРИТЕ, КТО ПРОДОЛЖИТ БОРЬБУ', 104);
    for (let i = 0; i < this.heroes.length; i++) {
      const disabled = this.isHeroDisabled(this.gameRef, this.heroes[i]);
      this.drawCard(ctx, images, this.heroes[i], i, i === this.selectedIndex && !disabled);
    }

    const back = { x: -1000, y: -1000, w: 1, h: 1 };
    const confirm = getOverlayConfirmBox();
    this.drawButton(ctx, back.x, back.y, back.w, back.h, 'НАЗАД', this.footerFocus === 'back');
    this.drawButton(ctx, confirm.x, confirm.y, confirm.w, confirm.h, 'ПРОДОЛЖИТЬ', this.footerFocus === 'confirm' || !this.footerFocus);

    ctx.font = '18px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = 'rgba(255,255,255,0.72)';
    ctx.fillText('<-/-> или A/D - выбрать   Enter - подтвердить', GAME_CONFIG.width / 2, 704);
    ctx.textAlign = 'left';
    if (this.infoOpen) this.drawInfoModal(ctx, images);
  };

  CharacterSelect.drawCard = function (ctx, images, heroKey, index, selected) {
    previousDrawCard.call(this, ctx, images, heroKey, index, selected);
    if (!this.isHeroDisabled || !this.isHeroDisabled(this.gameRef, heroKey)) return;
    const box = this.getCardBox(index);
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.82)';
    ctx.fillRect(box.x, box.y, box.w, box.h);
    ctx.strokeStyle = 'rgba(120,120,120,0.82)';
    ctx.lineWidth = 4;
    ctx.strokeRect(box.x, box.y, box.w, box.h);
    ctx.restore();
  };
})();
