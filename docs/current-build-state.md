# Streets of Russia — Current Build State

Last updated: 2026-07-07
Build version: `0.4.21`

## Purpose

This file describes what the current build appears to contain right now. It is not a dream design document. It is a snapshot of the actual project state plus known art/design work that still needs integration.

## Repository / Build

- Repository: `miyadind/streets-of-russia`
- Default branch: `main`
- Public repo: yes
- Current build version in config: `0.4.21`
- Browser entry point: `index.html`
- Runtime bundle loaded by browser: `src/game.bundle.js?v=0.4.21&t=<timestamp>`
- Source manifest: `tools/source-scripts.json`
- Rule: do not edit `src/game.bundle.js` directly. Edit source files from the manifest and rebuild.

## Current Architecture Notes

The project has moved from many loose patches toward a more controlled architecture.

Important owner modules:

- `src/campaignRuntime.js` — campaign screen math, active region, save/load positioning, screen index logic.
- `src/campaignFlow.js` — Continue availability, campaign menu flow, character select flow, New Game/Continue behavior.
- `src/audio.js`, `GameApp.setState`, `GameApp.updateMusicForState`, `GameApp.ensureMenuMusic` — cross-state music cleanup.

High-risk areas from architecture:

- Campaign start, Continue, map progress, region story flow.
- `LevelScene.nextScreen`, `spawnInitialWave`, active region selection.
- Character select confirm/back behavior.
- Game over, fallen hero, retry-region flow.
- Gundos finale cleanup.

## Save / Continue Design Decision

The game is intentionally run-based and tab-only.

Correct behavior:

- The player may continue only while the current open tab is still open.
- If the tab is closed, refreshed, or the game is opened again, the run is over.
- Every fresh page load should start from New Game.
- Long-lived campaign position saving is intentionally not part of the design.

Therefore, the absence of Continue after closing the tab, refreshing the page, or reopening the game is not a bug. It is the intended structure.

What still needs work:

- The UI should make this clear enough that the player understands this is a new run, not a broken save.
- Current-tab Continue should still work correctly before the page is closed or refreshed.
- End-of-run results may exist for the current tab run, but campaign position should not persist across fresh page loads.

## Current Game Content

### Heroes

Configured playable heroes:

1. Алексей — balanced hero.
   - HP: 120
   - Speed: 2.6
   - Damage: 16
   - Ability: revive once with half HP.

2. Анна — fast hero.
   - HP: 85
   - Speed: 3.15
   - Damage: 12
   - Ability: cannot be knocked down.

3. Борис — tank hero.
   - HP: 160
   - Speed: 2.25
   - Damage: 22
   - Ability: immune to ranged attacks.

### Configured Enemy Types

- Пёс режима / `dogRegime`
- Зетник / `zetnik`
- Sucker / `sucker`
- Bastard / `bastard`
- Horse enemy patch is active.
- Gundos enemy patch is active.

### Designed But Not Fully Integrated Art Concepts

These have been worked on as art/design assets in conversation, but need repo asset audit and gameplay integration:

- TV-head citizen enemy.
- Sobchak enemy/boss with microphone cable/whip.
- Orthodox patriarch boss.
- Demon patriarch form.
- Demon cross projectile.

## Campaign Structure

The configured campaign route has 7 regions, each with 3 screens.

Total configured screens: 21.

1. Far East
   - `street01`
   - `street02`
   - `street03`

2. Siberia
   - `siberia01`
   - `siberia02`
   - `siberia03`

3. Ural
   - `ural01`
   - `ural02`
   - `ural03`

4. Northwest / Petersburg
   - `northwest01`
   - `northwest02`
   - `northwest03`

5. Volga
   - `volga01`
   - `volga02`
   - `volga03`

6. South / Sochi
   - `south01`
   - `south02`
   - `south03`

7. Moscow
   - `moscow01`
   - `moscow02`
   - `moscow03`

## Most Complete Region

Far East appears to be the most specific and important region right now.

### `street01`

- Background: `assets/backgrounds/1/street01.png`
- Interactive: breakable Shaman poster.
- One initial wave: 2 `dogRegime` enemies.

### `street02`

- Background: `assets/backgrounds/1/street02.png`
- Waves:
  - 2 `dogRegime`
  - 1 `dogRegime` + 1 `zetnik`
  - 1 `sucker`

### `street03`

- Background: `assets/backgrounds/1/street03.png`
- Wave:
  - 1 `gundos`

This should become the first vertical slice target.

## Current Recommended Goal

Do not expand the game sideways yet.

The next milestone should be:

`Main Menu → New Game → Character Select → Far East 01 → Far East 02 → Far East 03 → Gundos fight → Victory/Results → Fresh visit starts from New Game`

## Immediate Risks

1. First-region victory/results flow needs verification.
2. Too many patch files are still active.
3. Some art assets exist outside the repo workflow and need naming/integration.
4. Boss victory and campaign completion flow need verification.
5. Mobile UX needs testing so the tab-only run design is clear and not perceived as broken progress.
