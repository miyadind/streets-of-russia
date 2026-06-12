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

      function mainBox(index) {
        return { x: 240, y: 245 + index * 96, w: 800, h: 92 };
      }

      function settingsBox(index) {
        return { x: 150, y: 160 + index * 82, w: 980, h: 78 };
      }

      function heroBox(index) {
        return { x: 45 + index * 405, y: 90, w: 390, h: 525 };
      }

      function confirmBox() {
        return { x: 240, y: 585, w: 500, h: 115 };
      }

      function backBox() {
        return { x: 750, y: 585, w: 360, h: 115 };
      }

      function activateMainMenu(game, index) {
        Menu.selectedIndex = index;
        AudioManager.unlock();
        AudioManager.playSfx('menuSelect', 0.85);
        if (index === 0) game.setState('characterSelect');
        else if (index === 2) game.setState('settings');
      }

      function activateSettings(game, index) {
        Menu.settingsIndex = index;
        AudioManager.unlock();
        Menu.changeSetting(index, game, 1);
      }

      function activateCharacter(game, click) {
        if (typeof CharacterSelect === 'undefined') return false;
        if (CharacterSelect.infoOpen) return false;
        for (var i = 0; i < CharacterSelect.heroes.length; i++) {
          if (inBox(click, heroBox(i))) {
            CharacterSelect.setSelection(i);
            CharacterSelect.footerFocus = null;
            return true;
          }
        }
        if (inBox(click, confirmBox())) {
          CharacterSelect.confirm(game);
          return true;
        }
        if (inBox(click, backBox())) {
          AudioManager.playSfx('menuSelect', 0.65);
          game.setState('mainMenu');
          return true;
        }
        return false;
      }

      var oldEnsureMenuMusic = GameApp.prototype.ensureMenuMusic;
      GameApp.prototype.ensureMenuMusic = function () {
        if (this.state === 'splash') return;
        oldEnsureMenuMusic.call(this);
      };

      var oldUpdate = GameApp.prototype.update;
      GameApp.prototype.update = function (dt) {
        var click = Input.consumePointer();
        if (click) {
          if (this.handleSpeakerClick(click)) return;

          if (Responsive.isTouchDevice && this.state === 'mainMenu') {
            for (var i = 0; i < Menu.items.length; i++) {
              if (inBox(click, mainBox(i))) {
                activateMainMenu(this, i);
                return;
              }
            }
          }

          if (Responsive.isTouchDevice && this.state === 'settings') {
            for (var j = 0; j < Menu.settingsItems.length; j++) {
              if (inBox(click, settingsBox(j))) {
                activateSettings(this, j);
                return;
              }
            }
          }

          if (Responsive.isTouchDevice && this.state === 'characterSelect') {
            if (activateCharacter(this, click)) return;
          }

          Input.restorePointer(click);
        }

        oldUpdate.call(this, dt);
      };
    }, 0);
  });
})();