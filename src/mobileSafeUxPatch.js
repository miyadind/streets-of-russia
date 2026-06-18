(function () {
  if (typeof MobileApp === 'undefined') return;

  const mobile = MobileApp;
  mobile.introTouchDrag = null;
  mobile.wakeLock = null;

  mobile.requestGameWakeLock = async function () {
    if (!('wakeLock' in navigator)) return;
    if (this.wakeLock) return;
    try {
      this.wakeLock = await navigator.wakeLock.request('screen');
      this.wakeLock.addEventListener('release', () => {
        this.wakeLock = null;
      });
    } catch (error) {
      this.wakeLock = null;
    }
  };

  mobile.releaseGameWakeLock = async function () {
    if (!this.wakeLock) return;
    try {
      await this.wakeLock.release();
    } catch (error) {}
    this.wakeLock = null;
  };

  mobile.syncGameWakeLock = function (game) {
    const activeStates = ['intro', 'campaignMap', 'characterSelect', 'level'];
    if (game && activeStates.includes(game.state)) this.requestGameWakeLock();
    else this.releaseGameWakeLock();
  };

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && window.game && MobileApp.enabled) {
      MobileApp.syncGameWakeLock(window.game);
    }
  });

  mobile.handleIntroTouchScroll = function (game) {
    if (!game || !game.intro || !game.intro.readyToContinue || !Input.pointer) return false;

    if (Input.pointer.down) {
      const p = Input.pointer;
      if (!this.introTouchDrag) {
        this.introTouchDrag = { y: p.y, moved: false };
        return false;
      }

      const dy = p.y - this.introTouchDrag.y;
      if (Math.abs(dy) >= 4) {
        const direction = dy < 0 ? 1 : -1;
        const steps = Math.max(1, Math.round(Math.abs(dy) / 32));
        if (game.scrollIntroReader) game.scrollIntroReader(direction * steps);
        this.introTouchDrag.y = p.y;
        this.introTouchDrag.moved = true;
        return true;
      }
      return false;
    }

    this.introTouchDrag = null;
    return false;
  };

  const originalUpdateStandalone = mobile.updateStandalone;
  mobile.updateStandalone = function (game, dt) {
    if (this.enabled) this.syncGameWakeLock(game);

    if (this.enabled && game && game.state === 'intro') {
      this.handleIntroTouchScroll(game);
    }

    return originalUpdateStandalone.call(this, game, dt);
  };

  const originalDrawMobileIntro = mobile.drawMobileIntro;
  mobile.drawMobileIntro = function (ctx, game) {
    if (game && game.drawIntro) game.drawIntro(ctx);
    game.drawSpeaker(ctx);
  };

  const originalDrawMobileCampaignMap = mobile.drawMobileCampaignMap;
  mobile.drawMobileCampaignMap = function (ctx, game) {
    if (game.campaignMap && game.campaignMap.draw) game.campaignMap.draw(ctx);
    game.drawSpeaker(ctx);
  };
})();