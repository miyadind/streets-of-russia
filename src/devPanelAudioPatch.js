(function () {
  window.addEventListener('load', function () {
    setTimeout(function () {
      if (typeof GameApp === 'undefined' || typeof AudioManager === 'undefined') return;

      GameApp.prototype.handleSpeakerClick = function (point) {
        var r = this.getSpeakerRect();
        if (!point || point.x < r.x || point.x > r.x + r.w || point.y < r.y || point.y > r.y + r.h) return false;
        AudioManager.unlock();
        if (AudioManager.toggleSound) AudioManager.toggleSound();
        else AudioManager.toggleMusic();
        AudioManager.playSfx('menuSelect', 0.7);
        return true;
      };

      function inBox(p, b) {
        return p && p.x >= b.x && p.x <= b.x + b.w && p.y >= b.y && p.y <= b.y + b.h;
      }

      function mobileMainMenuBox(index) {
        return { x: 300, y: 260 + index * 86, w: 680, h: 74 };
      }

      function mobileSettingsBox(index) {
        return { x: 220, y: 180 + index * 78, w: 840, h: 66 };
      }

      var oldMenuUpdate = Menu.update;
      Menu.update = function (game) {
        var click = Input.consumePointer();
        if (click) {
          AudioManager.unlock();
          for (var i = 0; i < this.items.length; i++) {
            var box = Responsive.isTouchDevice ? mobileMainMenuBox(i) : this.getItemBox(i);
            if (inBox(click, box)) {
              this.selectedIndex = i;
              this.activate(game);
              return;
            }
          }
        }
        if (click) Input.restorePointer(click);
        oldMenuUpdate.call(this, game);
      };

      var oldSettingsUpdate = Menu.updateSettings;
      Menu.updateSettings = function (game) {
        var click = Input.consumePointer();
        if (click) {
          AudioManager.unlock();
          for (var i = 0; i < this.settingsItems.length; i++) {
            var box = Responsive.isTouchDevice ? mobileSettingsBox(i) : this.getSettingsBox(i);
            if (inBox(click, box)) {
              this.settingsIndex = i;
              this.changeSetting(i, game, 1);
              return;
            }
          }
        }
        if (click) Input.restorePointer(click);
        oldSettingsUpdate.call(this, game);
      };
    }, 0);
  });
})();