# Streets of Russia — QA Checklist

Last updated: 2026-07-07

Use this before every playable test build.

## Status Legend

| Status | Meaning |
|---|---|
| ✅ Pass | Works in current test |
| 🟡 Needs Retest | Exists but needs confirmation |
| ⬜ Not Tested | Not tested yet |
| 🔴 Fail | Broken or missing |

## Vertical Slice 0.5 QA

| Check | Status | Notes |
|---|---|---|
| Main menu loads | ✅ Pass | Existing build loads through `index.html`. |
| New Game opens character select | ✅ Pass | Flow exists; needs full user-path retest. |
| Character select confirms team | 🟡 Needs Retest | Confirm hero state carries into level. |
| Far East 01 playable | 🟡 Needs Retest | Contains initial wave and poster interactive. |
| Far East 02 playable | 🟡 Needs Retest | Contains multiple waves. |
| Far East 03 / first boss playable | 🟡 Needs Retest | Contains Gundos encounter. |
| First boss victory state | ⬜ Not Tested | Required for milestone. |
| Return to menu after progress | ⬜ Not Tested | Needs clear flow. |
| Continue visible after returning to menu | 🔴 Fail | Reported issue / current session-only design. |
| Continue survives app/browser close | 🔴 Fail | Must become persistent. |
| Statistics visible after progress | ⬜ Not Tested | Not clearly implemented. |
| Android mobile smoke test | 🔴 Fail | Save/progress confusion reported. |
| Desktop smoke test | ⬜ Not Tested | Needs full pass after dashboard update. |
| Music does not overlap | 🟡 Needs Retest | Architecture says ownership improved. |
| SFX play on hits/menu | ⬜ Not Tested | Needs audio pass. |

## Save / Continue Test Script

1. Open game.
2. Press New Game.
3. Select team.
4. Complete at least one screen.
5. Return to main menu.
6. Confirm Continue is visible.
7. Close browser/app completely.
8. Reopen game.
9. Confirm Continue is still visible.
10. Continue and verify correct region, screen, team, HP, and progress.

## First Region Test Script

1. Start from main menu.
2. New Game.
3. Character select.
4. Enter Far East 01.
5. Defeat first wave.
6. Use/verify poster interactive.
7. Advance to Far East 02.
8. Clear all waves.
9. Advance to Far East 03.
10. Defeat first boss.
11. Reach victory/progress screen.
12. Return to menu.
13. Confirm progress is saved.

## Audio Test Script

1. Main menu music starts.
2. New Game / intro does not overlap with menu music.
3. Character select uses correct audio state.
4. Level music starts when entering level.
5. Pause/unpause does not duplicate tracks.
6. Boss music starts only during boss encounter.
7. Victory/game-over state cleans up previous track.
