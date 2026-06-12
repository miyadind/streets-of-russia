(function () {
  window.addEventListener('load', () => {
    setTimeout(() => {
      if (typeof GameApp === 'undefined' || typeof AudioManager === 'undefined') return;
      GameApp.prototype.handleSpeakerClick = function (point) {
        const r = this.getSpeakerRect();
        if (!point || point.x < r.x || point.x > r.x + r.w || point.y < r.y || point.y > r.y + r.h) return false;
        AudioManager.unlock();
        if (AudioManager.toggleSound) AudioManager.toggleSound();
        else AudioManager.toggleMusic();
        AudioManager.playSfx('menuSelect', 0.7);
        return true;
      };
    }, 0);
  });
})();