(function () {
  if (typeof GameApp === 'undefined' || typeof MobileApp === 'undefined') return;
  if (GameApp.prototype.mobileBootstrapPatched) return;

  GameApp.prototype.mobileBootstrapPatched = true;

  var originalEnsureMenuMusic = GameApp.prototype.ensureMenuMusic;
  GameApp.prototype.ensureMenuMusic = function () {
    if (MobileApp && MobileApp.isMobile && MobileApp.isMobile() && this.state === 'splash') return;
    originalEnsureMenuMusic.call(this);
  };

  var originalInit = GameApp.prototype.init;
  GameApp.prototype.init = async function () {
    await originalInit.call(this);
    if (MobileApp && MobileApp.attach) MobileApp.attach(this);
  };
})();