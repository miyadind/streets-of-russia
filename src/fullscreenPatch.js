(function () {
  const FullscreenPatch = {
    button: null,
    hint: null,

    isMobile() {
      return window.matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    },

    isFullscreen() {
      return document.fullscreenElement || document.webkitFullscreenElement || document.msFullscreenElement;
    },

    async requestFullscreen() {
      const root = document.documentElement;
      try {
        if (root.requestFullscreen) await root.requestFullscreen();
        else if (root.webkitRequestFullscreen) root.webkitRequestFullscreen();
        else if (root.msRequestFullscreen) root.msRequestFullscreen();
      } catch (error) {
        console.warn('Fullscreen request failed:', error);
      }

      try {
        if (screen.orientation && screen.orientation.lock) await screen.orientation.lock('landscape');
      } catch (error) {
        // Browsers may reject orientation lock unless fullscreen is supported. The game still works.
      }

      setTimeout(() => {
        if (typeof Responsive !== 'undefined' && Responsive.resize) Responsive.resize();
        this.updateVisibility();
      }, 120);
    },

    async exitFullscreen() {
      try {
        if (document.exitFullscreen) await document.exitFullscreen();
        else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
        else if (document.msExitFullscreen) document.msExitFullscreen();
      } catch (error) {
        console.warn('Exit fullscreen failed:', error);
      }
      setTimeout(() => this.updateVisibility(), 120);
    },

    createButton() {
      const button = document.createElement('button');
      button.type = 'button';
      button.id = 'fullscreenButton';
      button.textContent = 'НА ВЕСЬ ЭКРАН';
      button.setAttribute('aria-label', 'Включить полноэкранный режим');
      button.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        this.requestFullscreen();
      });
      document.body.appendChild(button);
      this.button = button;
    },

    createHint() {
      const hint = document.createElement('div');
      hint.id = 'rotateHint';
      hint.textContent = 'Поверните телефон горизонтально';
      document.body.appendChild(hint);
      this.hint = hint;
    },

    updateVisibility() {
      const mobile = this.isMobile();
      const fullscreen = !!this.isFullscreen();
      const portrait = window.innerHeight > window.innerWidth && window.innerWidth < 900;

      document.body.classList.toggle('is-fullscreen', fullscreen);
      document.body.classList.toggle('is-mobile-device', mobile);
      document.body.classList.toggle('is-portrait-mobile', mobile && portrait);

      if (this.button) {
        this.button.style.display = mobile && !fullscreen ? 'block' : 'none';
      }

      if (this.hint) {
        this.hint.style.display = mobile && portrait ? 'block' : 'none';
      }

      if (typeof Responsive !== 'undefined' && Responsive.resize) Responsive.resize();
    },

    init() {
      this.createButton();
      this.createHint();
      this.updateVisibility();
      window.addEventListener('resize', () => this.updateVisibility());
      window.addEventListener('orientationchange', () => setTimeout(() => this.updateVisibility(), 180));
      document.addEventListener('fullscreenchange', () => this.updateVisibility());
      document.addEventListener('webkitfullscreenchange', () => this.updateVisibility());
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => FullscreenPatch.init());
  } else {
    FullscreenPatch.init();
  }

  window.FullscreenPatch = FullscreenPatch;
})();
