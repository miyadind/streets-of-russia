(function () {
  if (typeof GameApp === 'undefined' || typeof AudioManager === 'undefined') return;

  GameApp.prototype.handleSpeakerClick = function (point) {
    const r = this.getSpeakerRect();
    if (point.x < r.x || point.x > r.x + r.w || point.y < r.y || point.y > r.y + r.h) return false;

    AudioManager.unlock();
    if (AudioManager.toggleSound) AudioManager.toggleSound();
    else AudioManager.toggleMusic();

    AudioManager.playSfx('menuSelect', 0.7);
    return true;
  };

  const originalDrawSpeaker = GameApp.prototype.drawSpeaker;
  GameApp.prototype.drawSpeaker = function (ctx) {
    const previousMusicEnabled = GAME_CONFIG.settings.musicEnabled;
    const soundOn = AudioManager.isSoundOn ? AudioManager.isSoundOn() : previousMusicEnabled !== false;

    GAME_CONFIG.settings.musicEnabled = soundOn;
    originalDrawSpeaker.call(this, ctx);
    GAME_CONFIG.settings.musicEnabled = previousMusicEnabled;
  };
})();