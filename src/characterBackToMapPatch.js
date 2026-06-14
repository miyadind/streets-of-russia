(function () {
  if (typeof CharacterSelect === 'undefined') return;

  function goBack(game) {
    AudioManager.playSfx('menuSelect', 0.65);
    game.setState('campaignMap');
  }

  CharacterSelect.update = function (game) {
    if (this.infoOpen) {
      if (Input.consume('escape') || Input.consume('i') || Input.consume('backspace') || Input.consume('enter') || Input.consume('space')) {
        this.closeInfo();
        return;
      }

      const infoClick = Input.consumePointer();
      if (infoClick) {
        this.closeInfo();
        return;
      }
      return;
    }

    if (Input.consume('arrowdown') || Input.consume('s')) {
      this.footerFocus = 'confirm';
      AudioManager.playSfx('menuMove', 0.65);
    }

    if (Input.consume('arrowup') || Input.consume('w')) {
      if (this.footerFocus) AudioManager.playSfx('menuMove', 0.65);
      this.footerFocus = null;
    }

    if (Input.consume('arrowleft') || Input.consume('a')) {
      if (this.footerFocus) this.moveFooterFocus(-1);
      else this.moveSelection(-1);
    }

    if (Input.consume('arrowright') || Input.consume('d')) {
      if (this.footerFocus) this.moveFooterFocus(1);
      else this.moveSelection(1);
    }

    if (Input.consume('i')) this.openInfo();
    if (Input.consume('escape')) {
      goBack(game);
      return;
    }

    const click = Input.consumePointer();
    if (click) {
      for (let i = 0; i < this.heroes.length; i++) {
        const info = this.getInfoButtonBox(i);
        if (this.isPointInCircle(click, info)) {
          this.setSelection(i);
          this.footerFocus = null;
          this.openInfo();
          return;
        }

        const box = this.getCardBox(i);
        if (this.isPointInBox(click, box)) {
          this.setSelection(i);
          this.footerFocus = null;
        }
      }

      if (this.isPointInBox(click, this.getBackBox())) {
        goBack(game);
        return;
      }

      if (this.isPointInBox(click, this.getConfirmBox())) {
        this.confirm(game);
        return;
      }
    }

    if (Input.consume('enter') || Input.consume('space')) {
      if (this.footerFocus === 'back') goBack(game);
      else this.confirm(game);
    }
  };
})();