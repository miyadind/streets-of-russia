(function () {
  function loadScript(src, done) {
    if (document.querySelector('script[src^="' + src + '"]')) {
      if (done) done();
      return;
    }
    var script = document.createElement('script');
    script.src = src + '?v=mobile-scaffold';
    script.onload = function () { if (done) done(); };
    document.body.appendChild(script);
  }

  window.addEventListener('load', function () {
    setTimeout(function () {
      loadScript('src/mobileApp.js', function () {
        if (typeof MobileApp === 'undefined' || typeof GameApp === 'undefined') return;

        var originalInit = GameApp.prototype.init;
        if (GameApp.prototype.mobileBootstrapPatched) return;
        GameApp.prototype.mobileBootstrapPatched = true;

        GameApp.prototype.init = async function () {
          await originalInit.call(this);
          if (MobileApp && MobileApp.attach) MobileApp.attach(this);
        };
      });
    }, 0);
  });
})();