# Streets of Russia — Production Board

Last updated: 2026-07-07
Build tracked: `0.4.21`

This is the main human-readable project board. Keep it updated after every meaningful game, art, audio, or documentation change.

## Status Legend

| Status | Meaning |
|---|---|
| ✅ Done | Complete enough for the current build |
| 🟡 In Progress | Partly implemented or partly designed |
| ⬜ Not Started | Planned but not implemented |
| 🔴 Broken / Bug | Exists but needs repair |
| ⚪ Backlog | Idea or future candidate, not required for current slice |

## Core Design Rule

The game is run-based and tab-only.

- Continue may exist only during the currently open tab.
- After closing the tab, refreshing the page, or reopening the game, Continue should not be available.
- A fresh visit should start from New Game.
- Persistent campaign position saving is intentionally not part of the design. Closing or refreshing the tab ends the run.

## Current Priority

The project should now focus on a playable vertical slice:

1. Main menu → New Game.
2. Character selection.
3. First region / Far East screens.
4. First boss encounter.
5. Victory / results screen.
6. Clear restart behavior: fresh visit starts from New Game.

## Summary

| Area | Done | In Progress | Not Started | Broken / Bug |
|---|---:|---:|---:|---:|
| Documentation | 1 | 2 | 3 | 0 |
| Core Game Flow | 6 | 4 | 3 | 0 |
| Heroes | 3 | 6 | 9 | 0 |
| Enemies | 9 | 8 | 13 | 0 |
| Bosses | 2 | 4 | 8 | 0 |
| Levels | 7 | 7 | 7 | 0 |
| UI / HUD | 2 | 4 | 4 | 0 |
| Run / Progress | 2 | 2 | 1 | 0 |
| Audio | 2 | 3 | 5 | 0 |
| Polish | 0 | 2 | 7 | 0 |

## Documentation

| Task | Status | Notes |
|---|---|---|
| Architecture document | ✅ Done | Existing `ARCHITECTURE.md` explains bundle ownership, campaign runtime, campaign flow, audio ownership, and high-risk patch areas. |
| Production board | 🟡 In Progress | This file is the master board. Needs regular updates. |
| Current build state | 🟡 In Progress | See `docs/current-build-state.md`. |
| Full GDD | ⬜ Not Started | Needs story, mechanics, controls, levels, enemies, UI, audio, and publishing notes if needed. |
| Characters catalog | ⬜ Not Started | Should list playable heroes, enemies, bosses, sprite sheets, animations, and missing frames. |
| Levels catalog | ⬜ Not Started | Should describe every region, screen, background, waves, interactives, and boss. |

## Core Game Flow

| Task | Status | Notes |
|---|---|---|
| Single bundled browser build | ✅ Done | `index.html` loads `src/game.bundle.js`. Source order is controlled by `tools/source-scripts.json`. |
| Main menu exists | ✅ Done | Menu flow exists in current build. |
| Settings exist | 🟡 In Progress | Basic settings exist in config: sound, music, SFX, difficulty, volumes. Needs full UI validation. |
| Bestiary / “Твари” | 🟡 In Progress | `bestiaryPatch.js` is included in active manifest. Needs content completion and UI check. |
| Character select exists | ✅ Done | Core file exists and campaign flow references character select. |
| Campaign map exists | ✅ Done | Campaign map and patch files are active. |
| Level scene exists | ✅ Done | Core `scene.js` and level config exist. |
| Tab-only run design | ✅ Done | Fresh page loads should start from New Game; persistent campaign Continue is intentionally excluded. |
| Pause menu | 🟡 In Progress | `pauseMenuPatch.js` is active. Needs mobile/desktop testing. |
| Victory/results screen | ⬜ Not Started | Needs explicit completion/results screen after region/boss. |
| Game Over screen | 🟡 In Progress | Retry/fallen hero flow is called out as high-risk in architecture. |
| Credits | ⬜ Not Started | Not needed for vertical slice. |
| Loading screen | ⬜ Not Started | Optional; useful later for polish. |

## Playable Heroes

Current configured heroes: Алексей, Анна, Борис.

| Hero | Task | Status | Notes |
|---|---|---|---|
| Алексей | Config/stats | ✅ Done | Balanced hero with revive-once ability. |
| Алексей | Core control/combat | 🟡 In Progress | Needs full animation and balancing pass. |
| Алексей | Complete sprite animation set | ⬜ Not Started | Need confirmed idle, walk, jump, attacks, hurt, knockdown, get up, KO. |
| Анна | Config/stats | ✅ Done | Fast hero with no-knockdown ability. |
| Анна | Core control/combat | 🟡 In Progress | Needs full animation and balancing pass. |
| Анна | Complete sprite animation set | ⬜ Not Started | Need confirmed idle, walk, jump, attacks, hurt, knockdown, get up, KO. |
| Борис | Config/stats | ✅ Done | Tank hero with ranged immunity. |
| Борис | Core control/combat | 🟡 In Progress | Needs full animation and balancing pass. |
| Борис | Complete sprite animation set | ⬜ Not Started | Need confirmed idle, walk, jump, attacks, hurt, knockdown, get up, KO. |
| Team state during current run | 🟡 In Progress | `teamStatePatch.js` is active. Needs testing across screens and retry flow. |
| Hero selection UX | 🟡 In Progress | Character select exists; needs mobile usability check. |
| Hero portraits/HUD identity | ⬜ Not Started | Needs final portraits and UI integration. |

## Enemies

Configured/active enemies and patches include: Пёс режима, Зетник, Sucker, Bastard, horse patch, Gundos patch. Recently designed external art concepts include TV-head, Sobchak, patriarch/demon form.

| Enemy | Task | Status | Notes |
|---|---|---|---|
| Пёс режима | Config | ✅ Done | Present in `GAME_CONFIG.enemies`. |
| Пёс режима | AI/combat | 🟡 In Progress | Smart AI parameters exist. Needs gameplay test. |
| Пёс режима | Final sprite set | ⬜ Not Started | Needs audit against required animation list. |
| Зетник | Config | ✅ Done | Present in `GAME_CONFIG.enemies`. |
| Зетник | AI/combat | 🟡 In Progress | Parameters exist. Needs gameplay test. |
| Зетник | Final sprite set | ⬜ Not Started | Needs audit against required animation list. |
| Sucker | Config | ✅ Done | Present in `GAME_CONFIG.enemies`, boss music enabled. |
| Sucker | Special attack behavior | 🟡 In Progress | Slide/pin/bite parameters exist. Needs boss/mini-boss test. |
| Sucker | Final sprite set | ⬜ Not Started | Needs audit against required animation list. |
| Bastard | Config | ✅ Done | Non-lethal/wandering behavior configured. |
| Bastard | Behavior | 🟡 In Progress | Can wander/fall/idles; needs purpose in level. |
| Horse enemy | Patch included | 🟡 In Progress | `horseEnemyPatch.js` and asset fix patch active. Needs board detail later. |
| Gundos | Patch included | 🟡 In Progress | Used in `street03`; finale cleanup noted in architecture. |
| TV-head citizen | Visual design | ✅ Done | Designed in art workflow. Needs integration into repo/assets. |
| TV-head citizen | Walk/jump/knockdown art | ✅ Done | Needs file audit and naming. |
| TV-head citizen | Attack/hurt/get-up art | ⬜ Not Started | Required before gameplay integration. |
| TV-head citizen | Gameplay behavior | ⬜ Not Started | Decide enemy role: basic, charger, jumper, or environmental hazard. |
| Sobchak boss/enemy | Visual design | ✅ Done | Designed with microphone cable/whip concept. |
| Sobchak boss/enemy | Walk art | 🟡 In Progress | Needs final approved frame set. |
| Sobchak boss/enemy | Whip attack gameplay | ⬜ Not Started | Needs hitbox, windup, recovery, audio. |
| Sobchak boss/enemy | Hurt/KO art | ⬜ Not Started | Missing. |
| Patriarch enemy/boss | Normal visual form | ✅ Done | Art concept exists. |
| Patriarch enemy/boss | Demon form | ✅ Done | Art concept exists. |
| Patriarch enemy/boss | Demon cross projectile | ✅ Done | Separate asset concept exists. |
| Patriarch enemy/boss | Gameplay integration | ⬜ Not Started | Needs boss class, attacks, phases. |

## Bosses

| Boss / Encounter | Status | Notes |
|---|---|---|
| First region boss / Gundos | 🟡 In Progress | `street03` spawns `gundos`; patch is active. Needs test and completion rules. |
| Sucker boss/mini-boss | 🟡 In Progress | Has boss music and special behavior parameters. |
| Sobchak boss | ⬜ Not Started | Visual concept exists, but gameplay not implemented. |
| Patriarch boss | ⬜ Not Started | Visual forms exist, gameplay not implemented. |
| Demon phase | ⬜ Not Started | Needs transformation trigger, special attacks, effects. |
| Final Kremlin boss | ⬜ Not Started | Needs design and mechanics. |
| Boss health UI | ⬜ Not Started | Needed for readable encounters. |
| Boss victory flow | ⬜ Not Started | Needed for vertical slice completion. |

## Levels / Campaign

Current campaign route has 7 regions × 3 screens = 21 configured screens.

| Region | Screens | Status | Notes |
|---|---:|---|---|
| Far East | 3 | 🟡 In Progress | Most detailed. `street01` has breakable Shaman poster. `street03` has Gundos. |
| Siberia | 3 | 🟡 In Progress | Configured backgrounds/waves. Needs unique content pass. |
| Ural | 3 | 🟡 In Progress | Configured backgrounds/waves. Needs unique content pass. |
| Northwest / Petersburg | 3 | 🟡 In Progress | Configured backgrounds/waves. Needs unique content pass. |
| Volga | 3 | 🟡 In Progress | Configured backgrounds/waves. Needs unique content pass. |
| South / Sochi | 3 | 🟡 In Progress | Configured backgrounds/waves. Needs unique content pass. |
| Moscow | 3 | 🟡 In Progress | Configured; `moscow03` uses boss music. Needs final boss design. |

## UI / HUD

| Task | Status | Notes |
|---|---|---|
| Canvas game shell | ✅ Done | `index.html` contains game canvas. |
| HUD module | ✅ Done | `src/hud.js` is active. |
| HP display | 🟡 In Progress | Exists but needs test across heroes/enemies/bosses. |
| Mobile controls | 🟡 In Progress | Mobile control/bootstrap/safe UX patches are active. |
| Desktop UX | 🟡 In Progress | Desktop UX/refinement patches are active. |
| Dev panel | 🟡 In Progress | `devPanel.js` and repair patches active. |
| Boss HP bar | ⬜ Not Started | Needed for bosses. |
| Current-run results display | ⬜ Not Started | Useful at the end of a run; should not imply persistent campaign saving. |
| Tab-only run messaging | ⬜ Not Started | Menu/help text should make fresh restart behavior clear. |
| Credits/about screen | ⬜ Not Started | Later polish. |

## Run / Progress

| Task | Status | Notes |
|---|---|---|
| Session continue | ✅ Done | Current run may continue while same open tab is open. |
| Fresh visit starts from New Game | ✅ Done | This is intended design, not a bug. |
| Run progress patch | 🟡 In Progress | `runProgressPatch.js` is active. Needs audit for tab-only behavior. |
| Save system patch | 🟡 In Progress | `saveSystemPatch.js` is active. Should not create long-lived campaign Continue. |
| Current-session results | ⬜ Not Started | Optional but useful for score, completed screens, defeated enemies, time. |

## Audio

| Task | Status | Notes |
|---|---|---|
| Audio ownership cleanup | ✅ Done | Architecture states `GameApp.setState`, `updateMusicForState`, and `ensureMenuMusic` own cleanup. |
| Menu music | 🟡 In Progress | Configured as `menuTheme`; needs real asset/test. |
| Level music | 🟡 In Progress | Configured as `levelTheme`. |
| Boss music | 🟡 In Progress | Configured as `bossTheme`, used by Sucker and Moscow03. |
| SFX keys | ✅ Done | Config includes punch/hit/down/wave/boss SFX keys. |
| Final SFX assets | ⬜ Not Started | Need complete audio asset audit. |
| Region-specific music | ⬜ Not Started | Later. |
| Boss-specific music | ⬜ Not Started | Later. |
| UI sound polish | ⬜ Not Started | Later. |
| Audio settings UX | ⬜ Not Started | Needs tested toggles/sliders. |

## Polish / Stability

| Task | Status | Notes |
|---|---|---|
| Camera shake | ⬜ Not Started | Useful for hits/bosses. |
| Hit flashes | 🟡 In Progress | Needs audit in combat visuals. |
| Particles | ⬜ Not Started | Later. |
| Screen transitions | 🟡 In Progress | Existing flow has multiple patches; needs consolidation. |
| Loading/error handling | ⬜ Not Started | Later. |
| Performance pass | ⬜ Not Started | Later. |
| Patch consolidation | ⬜ Not Started | High priority after vertical slice. |
| Asset naming convention | ⬜ Not Started | Needed before adding many new sprites. |
| QA checklist | ⬜ Not Started | Needed for every release. |

## Next Concrete Work Queue

1. Make `street01 → street02 → street03 → Gundos → victory/results` a clean playable slice.
2. Verify tab-only Continue: available only while the current tab is open and loaded.
3. Verify fresh visit behavior: after tab close, page refresh, or reopening, only New Game should be available.
4. Add/verify first boss victory condition.
5. Add optional current-run results screen.
6. Audit asset folders and map each sprite to board items.
7. Integrate TV-head as one real enemy with complete minimum animation set.
8. Start patch consolidation only after the first playable slice is stable.
