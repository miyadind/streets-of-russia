(function () {
  if (typeof GameApp === 'undefined') return;

  function loadAnalyticsPatch() {
    if (document.querySelector('script[data-local-analytics="true"]')) return;
    const script = document.createElement('script');
    script.src = 'src/analyticsPatch.js?v=45d601f';
    script.async = false;
    script.dataset.localAnalytics = 'true';
    document.body.appendChild(script);
  }

  loadAnalyticsPatch();

  const previousInit = GameApp.prototype.init;
  GameApp.prototype.init = async function () {
    window.game = this;
    return previousInit.call(this);
  };
})();