(function () {
  window.addEventListener('load', function () {
    setTimeout(function () {
      if (typeof GameApp === 'undefined' || typeof AudioManager === 'undefined') return;

      function loadMobileBootstrap() {
        if (document.querySelector('script[data-mobile-bootstrap="true"]')) return;
        var script = document.createElement('script');
        script.src = 'src/mobileBootstrap.js?v=scaffold';
        script.setAttribute('data-mobile-bootstrap', 'true');
        document.body.appendChild(script);
      }

      GameApp.prototype.handleSpeakerClick = function (point) {
        var r = this.getSpeakerRect();
        if (!point || point.x < r.x || point.x > r.x + r.w || point.y < r.y || point.y > r.y + r.h) return false;
        AudioManager.unlock();
        if (AudioManager.toggleSound) AudioManager.toggleSound();
        else AudioManager.toggleMusic();
        AudioManager.playSfx('menuSelect', 0.7);
        return true;
      };

      var oldEnsureMenuMusic = GameApp.prototype.ensureMenuMusic;
      GameApp.prototype.ensureMenuMusic = function () {
        if (this.state === 'splash') return;
        oldEnsureMenuMusic.call(this);
      };

      loadMobileBootstrap();
    }, 0);
  });
})();