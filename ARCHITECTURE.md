# Streets of Russia Architecture

## Current Build

The browser loads one generated script:

- `src/game.bundle.js`

The bundle is generated from the ordered source manifest:

- `tools/source-scripts.json`

Only files listed in that manifest are active in the deployed game. Other
`.js` files in `src/` are legacy or experimental candidates until they are
added to the manifest or moved out of `src/`.

Retired patch files should be deleted after their behavior is either moved
into the owning module or confirmed obsolete.

Run:

```bash
npm run build
```

or:

```bash
node tools/build-single.js
```

Do not edit `src/game.bundle.js` directly. Edit the source files listed in the manifest, then rebuild.

## Stabilization Direction

The project started as a prototype with many late-loaded patch files. The safe cleanup path is:

1. Keep source files separate while using the single bundle in production.
2. Move campaign flow into one owner module instead of spreading it across map, save, story and team patches.
3. Move level transitions into `LevelScene` and `GameApp` core methods.
4. Move enemy-specific behavior into enemy classes or small enemy modules.
5. Retire patch files only after their behavior is covered by the core files.

## Campaign Runtime

`src/campaignRuntime.js` is the central owner for campaign screen math:

- active region id and index
- first and last screen of a region
- local screen index for saves
- absolute screen index when loading a save
- placing the player at the current level start
- clearing Gundos finale state when a scene changes screens

New region, save, continue, retry and story code should use `window.CampaignRuntime`
instead of repeating `activeIndex * 3` or custom region scans.

The official campaign route lives in `GAME_CONFIG.campaignRegions`. Each entry
connects the map id to the level region id and the exact screen keys. This is
the source of truth for sequential level progression.

## Campaign Flow

`src/campaignFlow.js` is the central owner for player-facing campaign flow:

- Continue availability and main menu campaign items
- Opening character select from the campaign map
- Back behavior from character select
- Confirm behavior in character select
- Baseline New Game and Continue behavior

Save and story patches may still wrap these actions for persistence or special screens,
but they should delegate the shared flow rules to `window.CampaignFlow`.

## Audio State

`GameApp.setState`, `GameApp.updateMusicForState` and `GameApp.ensureMenuMusic`
own cross-state music cleanup. They prevent menu music, intro music and level
music from overlapping when screens change.

The old `introPatch.js` has been retired. Intro rendering and flow are owned by
`campaignMapPatch.js` and `introAudioFlowPatch.js` until that block is moved
fully into core.

## High-Risk Patch Areas

These are the first areas to consolidate:

- Campaign start, continue, map progress and region story flow
- `LevelScene.nextScreen`, `spawnInitialWave` and active region selection
- `CharacterSelect.confirm` and Back behavior
- Game over, fallen hero and retry-region flow
- Gundos finale state cleanup

## Rule For New Code

New gameplay behavior should be added to the core owner file when possible. A patch file is still acceptable for a quick experiment, but it should be moved into the owner module before the next release build.
