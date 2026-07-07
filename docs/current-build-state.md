# Streets of Russia — Current Build State

Last updated: 2026-07-07
Build version: `0.4.18`

## Purpose

This file describes what the current build appears to contain right now. It is not a dream design document. It is a snapshot of the actual project state plus known art/design work that still needs integration.

## Repository / Build

- Repository: `miyadind/streets-of-russia`
- Default branch: `main`
- Public repo: yes
- Current build version in config: `0.4.18`
- Browser entry point: `index.html`
- Runtime bundle loaded by browser: `src/game.bundle.js?v=0.4.18`
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

## Important Save/Continue Reality

Current campaign run saves are session-only. The current run may be continued while the same browser session is open, but a fresh visit starts from New Game.

This explains the observed mobile issue: after playing several screens, leaving, and returning to the main menu / app later, only New Game is available and there is no visible progress/statistics.

This should be treated as a real product issue, not user error.

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

`Main Menu → New Game → Character Select → Far East 01 → Far East 02 → Far East 03 → Gundos fight → Victory/Progress Saved → Continue works after reopening`

## Immediate Risks

1. Progress is not persistent after leaving/reopening.
2. Too many patch files are still active.
3. Some art assets exist outside the repo workflow and need naming/integration.
4. Boss victory and campaign completion flow need verification.
5. Mobile experience needs testing because the user already observed save/progress confusion there.
