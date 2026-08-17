(function () {
  if (typeof CampaignMapScreen === 'undefined') return;

  const previousUpdate = CampaignMapScreen.update;

  CampaignMapScreen.update = function (game, dt) {
    if (this.isDevMode && this.isDevMode() && this.handleDevInput && this.handleDevInput(game)) return;
    return previousUpdate.call(this, game, dt);
  };
})();
