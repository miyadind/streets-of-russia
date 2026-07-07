# Streets of Russia — Asset Tracker

Last updated: 2026-07-07

This file tracks art/audio assets that exist, are partially designed, or still need production/integration.

## Asset Status Legend

| Status | Meaning |
|---|---|
| ✅ Ready | Final asset exists and is integrated or ready to integrate |
| 🟡 Partial | Concept or partial animation exists |
| ⬜ Missing | Needed but not made yet |
| 🔴 Problem | Existing asset has a known issue |

## Required Minimum Animation Set

For most beat ’em up characters:

| Animation | Required? | Notes |
|---|---|---|
| Idle | Yes | Base stance. |
| Walk | Yes | Usually 2–4 frames minimum. |
| Attack 1 | Yes | Basic strike. |
| Attack 2 | Recommended | Combo or variation. |
| Hurt | Yes | Hit reaction. |
| Knockdown / Fall | Yes | When knocked down. |
| Grounded / KO | Yes | Lying state. |
| Get Up | Recommended | Needed if character returns to fight. |
| Jump | Optional for enemies, yes for heroes | Depends on character role. |
| Special Attack | Boss/enemy dependent | Projectiles, whip, charge, etc. |

## Playable Heroes

| Character | Status | Ready | Missing / Needs Audit |
|---|---|---|---|
| Алексей | 🟡 Partial | Config/stats, revive ability | Full sprite animation audit, balancing pass, portrait/HUD audit |
| Анна | 🟡 Partial | Config/stats, no-knockdown ability | Full sprite animation audit, balancing pass, portrait/HUD audit |
| Борис | 🟡 Partial | Config/stats, ranged immunity | Full sprite animation audit, balancing pass, portrait/HUD audit |

## Current Configured Enemies

| Enemy | Status | Ready | Missing / Needs Audit |
|---|---|---|---|
| Пёс режима | 🟡 Partial | Config and AI parameters | Final sprite set audit, gameplay tuning |
| Зетник | 🟡 Partial | Config and AI parameters | Final sprite set audit, gameplay tuning |
| Sucker | 🟡 Partial | Config, slide/pin/bite parameters | Boss/mini-boss test, sprite audit |
| Bastard | 🟡 Partial | Config, wandering/falling behavior | Purpose in level, sprite audit |
| Horse enemy | 🟡 Partial | Patch is active | Need asset list and behavior test |
| Gundos | 🟡 Partial | Patch is active, used in Far East 03 | Boss victory flow and cleanup test |

## Designed Art Concepts Not Yet Fully Integrated

### TV-head citizen

| Item | Status | Notes |
|---|---|---|
| Visual design | ✅ Ready | 50–60 y/o citizen with TV head. |
| Walk concept | ✅ Ready | Needs final repo naming/integration. |
| Jump forward head-first | ✅ Ready | Arms along body. |
| Grounded/KO concept | ✅ Ready | Face-down and broken-TV variants discussed. |
| Attack | ⬜ Missing | Needed before enemy integration. |
| Hurt | ⬜ Missing | Needed before enemy integration. |
| Get up | ⬜ Missing | Needed if not one-hit/fallen-only enemy. |
| Gameplay role | ⬜ Missing | Decide: basic enemy, charger, jumper, or hazard. |

### Sobchak microphone-whip enemy/boss

| Item | Status | Notes |
|---|---|---|
| Visual design | ✅ Ready | Pixel/beat ’em up design with microphone cable whip. |
| Avatar concept | ✅ Ready | Needs final file integration. |
| Walk concept | 🟡 Partial | Leg consistency needed; final approved sheet required. |
| Whip attack frames | ⬜ Missing | Core gameplay identity. |
| Hurt/KO frames | ⬜ Missing | Needed for combat. |
| Hitbox plan | ⬜ Missing | Cable/whip needs special range logic. |
| Gameplay integration | ⬜ Missing | Enemy/boss class needed. |

### Patriarch / Demon boss

| Item | Status | Notes |
|---|---|---|
| Normal form | ✅ Ready | Orthodox patriarch boss concept. |
| Demon form | ✅ Ready | Red garnet skin, horns, demonic look. |
| Demon cross projectile | ✅ Ready | Separate flying asset concept. |
| Lying frame concept | ✅ Ready | Needs final repo integration. |
| Attack frames | ⬜ Missing | Staff/cross/projectile/phase attacks. |
| Boss phases | ⬜ Missing | Normal → demon transformation. |
| Boss class | ⬜ Missing | AI, health, phase triggers, victory. |
| Effects/audio | ⬜ Missing | Transformation, projectile, hit sounds. |

## Naming Convention Proposal

Use predictable folders:

```text
assets/characters/heroes/alexey/
assets/characters/heroes/anna/
assets/characters/heroes/boris/
assets/characters/enemies/tv-head/
assets/characters/enemies/sobchak/
assets/characters/bosses/patriarch/
assets/projectiles/demon-cross/
```

Use predictable file names:

```text
idle_01.png
walk_01.png
walk_02.png
attack_01.png
hurt_01.png
fall_01.png
ko_01.png
getup_01.png
special_01.png
```

## Next Asset Actions

1. Audit existing `assets/` folders.
2. Map every existing sprite to this tracker.
3. Decide which TV-head frames are final.
4. Finish TV-head attack/hurt/get-up or define him as a special one-way enemy.
5. Finish Sobchak whip attack sheet.
6. Create Patriarch boss attack list before drawing more frames.
