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
        return { x: 300, y: 250 + index * 92, w: 680, h: 84 };
      }

      function mobileSettingsBox(index) {
        return { x: 190, y: 170 + index * 80, w: 900, h: 72 };
      }

      function mobileHeroBox(index) {
        return { x: 60 + index * 400, y: 100, w: 365, h: 510 };
      }

      function mobileConfirmBox() {
        return { x: 270, y: 600, w: 430, h: 90 };
      }

      function mobileBackBox() {
        return { x: 720, y: 600, w: 290, h: 90 };
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

      if (typeof CharacterSelect !== 'undefined') {
        var oldCharacterUpdate = CharacterSelect.update;
        CharacterSelect.update = function (game) {
          var click = Input.consumePointer();
          if (click && Responsive.isTouchDevice && !this.infoOpen) {
            AudioManager.unlock();
            for (var i = 0; i < this.heroes.length; i++) {
              if (inBox(click, mobileHeroBox(i))) {
                this.setSelection(i);
                this.footerFocus = null;
                return;
              }
            }
            if (inBox(click, mobileConfirmBox())) {
              this.confirm(game);
              return;
            }
            if (inBox(click, mobileBackBox())) {
              AudioManager.playSfx('menuSelect', 0.65);
              game.setState('mainMenu');
              return;
            }
          }
          if (click) Input.restorePointer(click);
          oldCharacterUpdate.call(this, game);
        };
      }
    }, 0);
  });
})();