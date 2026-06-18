(function () {
  if (typeof MobileApp === 'undefined') return;

  const mobile = MobileApp;
  mobile.introManualScroll = 0;
  mobile.introTouch = null;
  mobile.introWasComplete = false;

  mobile.mobileIntroStartBox = function () {
    return this.rect(430, 620, 420, 70);
  };

  mobile.mobileIntroScrollBounds = function () {
    return { x: 120, y: 78, w: 1040, h: 520 };
  };

  mobile.isIntroComplete = function () {
    if (typeof Intro === 'undefined') return false;
    return Intro.loaded && Intro.typedCharacters >= Intro.getTotalCharacterCount();
  };

  mobile.finishIntroTyping = function () {
    if (typeof Intro === 'undefined' || !Intro.loaded) return;
    Intro.typedCharacters = Intro.getTotalCharacterCount();
    Intro.voiceStarted = false;
    try {
      if (Intro.voice) Intro.voice.pause();
    } catch (error) {}
  };

  mobile.clampIntroScroll = function (value) {
    if (typeof Intro === 'undefined') return 0;
    const max = Math.max(0, (Intro.totalScrollDistance || 0) + 80);
    return Math.max(0, Math.min(max, value));
  };

  mobile.updateMobileIntro = function (game, dt) {
    const click = Input.consumePointer();
    const complete = this.isIntroComplete();

    if (complete && !this.introWasComplete) {
      this.introManualScroll = Intro.scrollY || 0;
      this.introWasComplete = true;
    }
    if (!complete) this.introWasComplete = false;

    if (Input.consume('escape')) {
      if (Intro.stopVoice) Intro.stopVoice();
      AudioManager.playSfx('menuSelect', 0.75);
      game.setState('mainMenu');
      if (Intro.resumeMenuMusic) Intro.resumeMenuMusic(game);
      return true;
    }

    if (Input.consumeAnyKey()) {
      if (complete) {
        if (Intro.finish) Intro.finish(game);
      } else {
        this.finishIntroTyping();
      }
      return true;
    }

    if (complete && Input.pointer && Input.pointer.down) {
      const p = Input.pointer;
      if (!this.introTouch) {
        this.introTouch = { x: p.x, y: p.y, lastY: p.y, moved: false };
      } else {
        const dy = p.y - this.introTouch.lastY;
        if (Math.abs(p.y - this.introTouch.y) > 8) this.introTouch.moved = true;
        this.introManualScroll = this.clampIntroScroll(this.introManualScroll - dy);
        this.introTouch.lastY = p.y;
      }
    } else if (this.introTouch && !(Input.pointer && Input.pointer.down)) {
      this.introTouch = null;
    }

    if (click) {
      if (game.handleSpeakerClick && game.handleSpeakerClick(click)) return true;

      if (complete) {
        if (this.inRect(click, this.mobileIntroStartBox())) {
          if (Intro.finish) Intro.finish(game);
          return true;
        }
        return true;
      }

      this.finishIntroTyping();
      return true;
    }

    if (!complete && Intro.update) Intro.update(game, dt);
    return true;
  };

  mobile.drawMobileIntroText = function (ctx, game) {
    if (typeof Intro === 'undefined') return;

    const bg = game.images && game.images.main;
    if (bg) ctx.drawImage(bg, 0, 0, GAME_CONFIG.width, GAME_CONFIG.height);
    else { ctx.fillStyle = '#050508'; ctx.fillRect(0, 0, GAME_CONFIG.width, GAME_CONFIG.height); }

    ctx.fillStyle = 'rgba(0,0,0,0.80)';
    ctx.fillRect(0, 0, GAME_CONFIG.width, GAME_CONFIG.height);

    const gradient = ctx.createLinearGradient(0, 0, 0, GAME_CONFIG.height);
    gradient.addColorStop(0, 'rgba(0,0,0,0.96)');
    gradient.addColorStop(0.16, 'rgba(0,0,0,0.16)');
    gradient.addColorStop(0.82, 'rgba(0,0,0,0.10)');
    gradient.addColorStop(1, 'rgba(0,0,0,0.95)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, GAME_CONFIG.width, GAME_CONFIG.height);

    if (!Intro.loaded) {
      if (Intro.drawLoadingMessage) Intro.drawLoadingMessage(ctx, Intro.loadError ? 'НЕ УДАЛОСЬ ЗАГРУЗИТЬ ИНТРО' : 'ЗАГРУЗКА ИНТРО...');
      return;
    }

    const complete = this.isIntroComplete();
    const bounds = this.mobileIntroScrollBounds();

    ctx.save();
    ctx.beginPath();
    ctx.rect(bounds.x, bounds.y, bounds.w, bounds.h);
    ctx.clip();

    ctx.font = '26px Arial';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#f1f1f1';
    ctx.strokeStyle = 'rgba(0,0,0,0.8)';
    ctx.lineWidth = 4;

    const lines = Intro.getWrappedLines(ctx);
    const lineHeight = 34;
    Intro.totalScrollDistance = Intro.calculateTotalScrollDistance(lines, lineHeight);

    if (!complete) {
      Intro.updateScrollForTypedText(lines, lineHeight);
      this.introManualScroll = Intro.scrollY || 0;
    } else {
      Intro.scrollY = this.clampIntroScroll(this.introManualScroll);
    }

    let y = 130 - Intro.scrollY;
    let remainingCharacters = complete ? Intro.getTotalCharacterCount() : Intro.typedCharacters;

    lines.forEach((line) => {
      const lineBudget = line.length + 1;
      const visibleCount = Math.max(0, Math.min(line.length, remainingCharacters));
      const visibleLine = line.slice(0, visibleCount);

      if (visibleLine && y > 48 && y < 630) {
        if (line === 'Россия. 2026 год.' || line === 'Это Streets of Russia!') {
          ctx.font = 'bold 34px Arial';
          ctx.fillStyle = '#ffffff';
        } else {
          ctx.font = '26px Arial';
          ctx.fillStyle = '#f1f1f1';
        }
        ctx.strokeText(visibleLine, GAME_CONFIG.width / 2, y);
        ctx.fillText(visibleLine, GAME_CONFIG.width / 2, y);
      }

      remainingCharacters -= lineBudget;
      y += Intro.getLineHeight(lineHeight, line);
    });

    ctx.restore();

    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.56)';
    ctx.fillRect(260, 638, 760, 44);
    ctx.strokeStyle = 'rgba(255,255,255,0.46)';
    ctx.lineWidth = 2;
    ctx.strokeRect(260, 638, 760, 44);
    ctx.font = 'bold 19px Arial';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffffff';

    if (complete) {
      ctx.fillText('ЛИСТАЙТЕ ТЕКСТ ПАЛЬЦЕМ ВВЕРХ И ВНИЗ', GAME_CONFIG.width / 2, 666);
      this.drawButton(ctx, this.mobileIntroStartBox(), 'НАЧАТЬ', true, 28);
    } else {
      ctx.fillText('КОСНИТЕСЬ ЭКРАНА ИЛИ НАЖМИТЕ КЛАВИШУ, ЧТОБЫ УСКОРИТЬ ИНТРО', GAME_CONFIG.width / 2, 666);
    }
    ctx.restore();
  };

  const originalUpdateStandalone = mobile.updateStandalone;
  mobile.updateStandalone = function (game, dt) {
    if (this.enabled && game.state === 'intro') {
      return this.updateMobileIntro(game, dt);
    }

    if (this.enabled && game.state === 'campaignMap') {
      const click = Input.consumePointer();
      if (click && game.handleSpeakerClick && game.handleSpeakerClick(click)) return true;
      if (click) Input.restorePointer(click);
      if (game.campaignMap && game.campaignMap.update) game.campaignMap.update(game, dt);
      return true;
    }

    return originalUpdateStandalone.call(this, game, dt);
  };

  mobile.drawMobileIntro = function (ctx, game) {
    this.drawMobileIntroText(ctx, game);
    game.drawSpeaker(ctx);
  };

  mobile.drawMobileCampaignMap = function (ctx, game) {
    if (game.campaignMap && game.campaignMap.draw) game.campaignMap.draw(ctx);
    game.drawSpeaker(ctx);
  };
})();