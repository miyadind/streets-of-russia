# Patch Audit

This file tracks patch files that should be folded into stable game systems.

## Audio

- `audioPauseGuardPatch.js`: pause/resume music for game pause, developer panel, tab blur/focus.
- `globalQualityPatch.js`: optional enemy appear audio, hero hit audio, and some combat tuning.
- `horseAssetsFixPatch.js`: horse custom sounds and late asset registration.
- `pauseMenuPatch.js`: pause menu voices and menu SFX.
- `runtimeRevisionPatch.js`: folded into core in `0.4.86` and removed.

Target system: `audio.js`, plus scene-level calls in `scene.js` for enemy appear events.

## Level Flow And Campaign

- `campaignMapPatch.js`: intro/campaign map flow, generated intro audio/image helpers.
- `campaignFlow.js`: campaign transitions and level start.
- `exitArrowPatch.js`: exit arrow and screen transitions.
- `runProgressPatch.js`: run progress menu behavior.
- `saveSystemPatch.js`: old persistent save system.
- `sessionOnlyRunPatch.js`: session-only save behavior.
- `storyFlowPatch.js`: region story screen after boss victory.
- `campaignMapDevChapterPatch.js`: developer chapter picker on map.

Target system: `campaignRuntime.js`, `campaignFlow.js`, `campaignMap.js`, `game.js`.

## Level Objects

- `levelInteractives.js`: breakable posters, vehicles, object editor.
- `walkZonePatch.js`: walk zones, spawn points, level restart/next screen.
- `street02PosterEasterEgg.js`: not currently bundled.

Target system: `scene.js`, `game.js`, plus level data in `config.js`.

## Combat And Hitboxes

- `hitboxEditorPatch.js`: anatomy profiles, hitboxes, line/lane checks, dev editor.
- `devPanelDogAiPatch.js`: dog attack reach and tuning.
- `dogClubRangePatch.js`: not currently bundled.
- `globalQualityPatch.js`: attack range binding and player hurt freeze.

Target system: `combat.js`, `player.js`, `enemy.js`, enemy subclasses.

## Enemies

- `horseEnemyPatch.js`: Horse AI, attack states, sprites, knockdown.
- `horseAssetsFixPatch.js`: Horse asset overrides.
- `gundosEnemyPatch.js`: Gundos boss scene, minions, fire, finale.
- `bastardEnemy.js`: already core enemy class, but healing behavior is tied to scene rules.

Target system: enemy classes and data-driven enemy config.

## UI And Developer Tools

- `desktopUXPatch.js`, `desktopRefinementPatch.js`: menu/HUD refinements.
- `mobileSafeUxPatch.js`, `mobileBootstrap.js`: mobile behavior fixes.
- `pauseMenuPatch.js`: pause menu.
- `bestiaryPatch.js`: bestiary.
- `heroDefeatOverlayPatch.js`: death overlay character select.
- `devPanelRepairPatch.js`, `devCacheBustPatch.js`: dev panel repair/export/cache bust.
- `fullscreenPatch.js`, `speakerMutePatch.js`, `analyticsPatch.js`: not all are currently bundled.

Target system: `menu.js`, `hud.js`, `devPanel.js`, `game.js`, `mobileControls.js`.
