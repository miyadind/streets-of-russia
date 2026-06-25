(function () {
  if (typeof GameApp === 'undefined') return;

  const previousInit = GameApp.prototype.init;
  GameApp.prototype.init = async function () {
    window.game = this;
    return previousInit.call(this);
  };
})();
