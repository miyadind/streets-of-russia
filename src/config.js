const GAME_CONFIG = {
  "buildVersion": "0.4.267",
  "width": 1280,
  "height": 720,
  "targetFPS": 60,
  "adminTuningEnabled": true,
  "settings": {
    "difficulty": "normal",
    "soundEnabled": true,
    "musicEnabled": true,
    "sfxEnabled": true,
    "sfxVolume": 0.85,
    "musicVolume": 0.45
  },
  "laneTop": 515,
  "laneBottom": 675,
  "playerScale": 0.115,
  "enemyScale": 0.105,
  "walkFrameMs": 220,
  "enemyWalkFrameMs": 260,
  "ySpeedMultiplier": 0.65,
  "comboResetMs": 2000,
  "playerHitStopMs": 55,
  "playerHitStunMs": 380,
  "playerHurtFreezeMs": 280,
  "playerInvulnerableMs": 520,
  "playerReviveKnockdownMs": 950,
  "playerReviveTextMs": 1700,
  "playerReviveBurstMs": 1000,
  "playerReviveBurstRangeX": 235,
  "playerReviveBurstRangeY": 96,
  "heroDefeatHoldMs": 1150,
  "enemyBodyRadiusX": 42,
  "enemyBodyRadiusY": 20,
  "enemySeparationStrength": 0.55,
  "enemySeparationIterations": 2,
  "enemyAttackSlotRadiusX": 46,
  "enemyAttackSlotRadiusY": 24,
  "enemyOffscreenMargin": 180,
  "zetnikEscapeMargin": 80,
  "pushboxLaneTolerance": 12,
  "yHitTolerance": 28,
  "combatLaneCount": 3,
  "discreteCombatLanes": true,
  "enemyAttackRangeX": 76,
  "enemyAttackRangeY": 36,
  "enemyWindupMs": 260,
  "enemyActiveMs": 140,
  "enemyRecoveryMs": 520,
  "enemyHitStunMs": 380,
  "enemyDeathFadeMs": 18000,
  "heroes": {
    "alexey": {
      "name": "Алексей",
      "role": "balanced",
      "hp": 120,
      "speed": 2.6,
      "damage": 16,
      "scale": 0.185,
      "knockdownDraw": {
        "alphaCenterX": 800,
        "alphaBottomY": 834,
        "facingMultiplier": -1
      },
      "knockdownBody": {
        "footX": 1308,
        "bottomY": 834,
        "w": 190,
        "h": 58
      },
      "strength": 5,
      "speedStat": 5,
      "health": 5,
      "color": "#4f9cff",
      "abilities": {
        "reviveOnce": true
      },
      "ability": "Второе дыхание: один раз после поражения возвращается в бой с половиной здоровья."
    },
    "anna": {
      "name": "Анна",
      "role": "fast",
      "hp": 100,
      "speed": 3.15,
      "damage": 12,
      "scale": 0.11,
      "knockdownDraw": {
        "alphaCenterX": 756,
        "alphaBottomY": 688
      },
      "knockdownBody": {
        "footX": 108,
        "bottomY": 688,
        "w": 155,
        "h": 36
      },
      "strength": 3,
      "speedStat": 7,
      "health": 5,
      "color": "#c163ff",
      "abilities": {
        "noKnockdown": true,
        "combo3Damage": 45
      },
      "ability": "Несгибаемость: её нельзя сбить с ног."
    },
    "boris": {
      "name": "Борис",
      "role": "tank",
      "hp": 160,
      "speed": 2.25,
      "damage": 22,
      "scale": 0.16,
      "knockdownDraw": {
        "alphaCenterX": 730,
        "alphaBottomY": 634
      },
      "knockdownBody": {
        "footX": 155,
        "bottomY": 634,
        "w": 210,
        "h": 50
      },
      "strength": 7,
      "speedStat": 3,
      "health": 8,
      "color": "#5fd65f",
      "abilities": {
        "rangedDamageMultiplier": 0.5
      },
      "ability": "Стальная выдержка: дальние атаки наносят на 50% меньше урона."
    }
  },
  "audio": {
    "music": {
      "menu": "menuTheme",
      "map": "mapTheme",
      "level": "levelTheme",
      "boss": "bossTheme"
    },
    "sfx": {
      "menuMove": "menuMove",
      "menuSelect": "menuSelect",
      "punch": "punch",
      "punch1": "punch1",
      "punch2": "punch2",
      "punch3": "punch3",
      "hit": "hit",
      "enemyDown": "enemyDown",
      "playerDown": "playerDown",
      "waveStart": "waveStart",
      "waveClear": "waveClear",
      "bossAppear": "bossAppear"
    }
  },
  "regionMusic": {
    "far-east": "farEastTheme",
    "siberia": "siberiaTheme"
  },
  "bossMatchups": {
    "farEastRoc": {
      "heroKey": "boris",
      "incomingDamageMultiplier": 0.5,
      "outgoingDamageMultiplier": 1.4285714285714286
    },
    "kadyrov": {
      "heroKey": "anna",
      "incomingDamageMultiplier": 0.5,
      "outgoingDamageMultiplier": 1.3
    },
    "siberiaBoss": {
      "heroKey": "alexey",
      "incomingDamageMultiplier": 0.5,
      "outgoingDamageMultiplier": 1.3
    }
  },
  "enemies": {
    "dogRegime": {
      "name": "Пёс режима",
      "hp": 90,
      "speed": 1.35,
      "damage": 10,
      "scale": 0.105,
      "attackScale": 1.11,
      "smartAiVersion": 4,
      "bossMusic": false,
      "bossMusicKey": "bossTheme",
      "minDistanceX": 44,
      "preferredDistanceX": 64,
      "tooFarDistanceX": 150,
      "attackMinDistanceX": 30,
      "attackMaxDistanceX": 128,
      "attackRangeX": 128,
      "attackRangeY": 42,
      "clubContactTolerance": 10,
      "maxAttackers": 1,
      "decisionMinMs": 120,
      "decisionMaxMs": 280,
      "strafeChance": 0.32,
      "retreatChance": 0.16,
      "attackChance": 0.86,
      "closeRetreatChance": 0.32,
      "playerAttackFearDistance": 86,
      "postAttackRetreatMs": 220,
      "attackCooldownMinMs": 300,
      "attackCooldownMaxMs": 520,
      "backstabChance": 0.78,
      "slotSpacingX": 46,
      "slotSpacingY": 32,
      "flankDistanceX": 112,
      "pressureDistanceX": 160,
      "clubReachForward": 142,
      "clubReachBack": 16
    },
    "zetnik": {
      "name": "Зетник",
      "hp": 110,
      "speed": 3.875,
      "damage": 12,
      "scale": 0.105,
      "bossMusic": false,
      "bossMusicKey": "bossTheme",
      "minDistanceX": 38,
      "preferredDistanceX": 70,
      "attackRangeX": 78,
      "attackRangeY": 36,
      "maxAttackers": 1,
      "decisionMinMs": 220,
      "decisionMaxMs": 560,
      "strafeChance": 0.32,
      "retreatChance": 0.06,
      "attackChance": 0.78,
      "slotSpacingX": 46,
      "slotSpacingY": 32,
      "flankDistanceX": 105,
      "pressureDistanceX": 155,
      "selfRemoveDelayMs": 18000
    },
    "sucker": {
      "name": "Sucker",
      "hp": 180,
      "speed": 1.15,
      "damage": 12,
      "scale": 0.13,
      "bossMusic": false,
      "bossMusicKey": "bossTheme",
      "attackStartDistance": 420,
      "minDistance": 220,
      "alignToleranceY": 30,
      "slideSpeed": 7.25,
      "slideRange": 520,
      "windupMs": 560,
      "slideRecoveryMs": 650,
      "interruptedRecoveryMs": 1100,
      "fastRetreatSpeed": 9.666666666666666,
      "fastRetreatMs": 620,
      "hitsBeforeFastRetreat": 2,
      "counterRangeX": 74,
      "counterRangeY": 58,
      "counterForgiveness": 2,
      "pinDurationMs": 1700,
      "pinEscapeMinBites": 3,
      "pinHoldMs": 120000,
      "biteTickMs": 450,
      "biteDamage": 6,
      "otherEnemyScatterDistance": 120,
      "bodyRadiusX": 52,
      "bodyRadiusY": 24
    },
    "bastard": {
      "name": "Bastard",
      "hp": 9999,
      "speed": 0.75,
      "damage": 0,
      "scale": 0.12,
      "bossMusic": false,
      "bossMusicKey": "bossTheme",
      "canAttack": false,
      "canDie": false,
      "blocksWaveClear": false,
      "wanderMinMs": 700,
      "wanderMaxMs": 1900,
      "idleMinMs": 900,
      "idleMaxMs": 2200,
      "fallenMinMs": 1300,
      "fallenMaxMs": 2600,
      "idleChance": 0.32,
      "fallChance": 0.04,
      "turnChance": 0.3,
      "knockbackX": 34,
      "bodyRadiusX": 44,
      "bodyRadiusY": 20
    },
    "horse": {
      "name": "Horse",
      "hp": 125,
      "speed": 1.35,
      "damage": 28,
      "attackDamageSource": "ranged",
      "scale": 0.13,
      "walkScale": 0.95,
      "visibleHeight": 0,
      "attackScale": 1,
      "finalAttackScale": 1.31,
      "finalAttackFootAlign": 0.5,
      "attackWindupMs": 680,
      "attackActiveMs": 430,
      "attackRecoveryMs": 320,
      "whiplashFinalSfxLeadMs": 80,
      "whiplashFinalSfxStartAt": 0.24,
      "bossMusic": false,
      "bossMusicKey": "bossTheme",
      "minDistanceX": 120,
      "preferredDistanceX": 190,
      "tooFarDistanceX": 310,
      "attackMinDistanceX": 115,
      "attackMaxDistanceX": 255,
      "attackRangeX": 265,
      "attackRangeY": 38,
      "clubReachForward": 310,
      "clubReachBack": 18,
      "maxAttackers": 1,
      "decisionMinMs": 340,
      "decisionMaxMs": 920,
      "strafeChance": 0.5,
      "retreatChance": 0.26,
      "attackChance": 0.46,
      "closeRetreatChance": 0.78,
      "postAttackRetreatMs": 760,
      "slotSpacingX": 50,
      "slotSpacingY": 44,
      "flankDistanceX": 190,
      "pressureDistanceX": 225
    },
    "goydenish": {
      "name": "Goydenish",
      "hp": 105,
      "speed": 1.8,
      "damage": 16,
      "scale": 0.115,
      "mirrorSprite": false,
      "attackIdleMs": 360,
      "attackWindupMs": 880,
      "attackActiveMs": 90,
      "attackRecoveryMs": 360,
      "projectileDamage": 16,
      "projectileSpeed": 7.2,
      "projectileScale": 0.0375,
      "projectileHitboxSize": 64,
      "aimTrackSpeed": 7.5,
      "keepOnScreen": true,
      "screenMarginX": 122,
      "fleeDistanceX": 380,
      "fleeSpeedMultiplier": 3.5,
      "attackDamageSource": "ranged",
      "minDistanceX": 150,
      "preferredDistanceX": 235,
      "tooFarDistanceX": 330,
      "attackMinDistanceX": 120,
      "attackMaxDistanceX": 300,
      "attackRangeX": 300,
      "attackRangeY": 42,
      "maxAttackers": 1,
      "decisionMinMs": 240,
      "decisionMaxMs": 540,
      "strafeChance": 0.42,
      "retreatChance": 0.28,
      "attackChance": 0.68,
      "closeRetreatChance": 0.8,
      "postAttackRetreatMs": 460,
      "attackCooldownMinMs": 1100,
      "attackCooldownMaxMs": 1550,
      "bodyRadiusX": 44,
      "bodyRadiusY": 21
    },
    "negay": {
      "name": "NEgay",
      "hp": 130,
      "speed": 2.2,
      "damage": 32,
      "appearSoundPath": "assets/enemies/NEgay/appear.mp3?v=negay-appear-2",
      "scale": 0.12,
      "finalAttackScale": 1.07,
      "attackDamageSource": "ranged",
      "minDistanceX": 105,
      "preferredDistanceX": 175,
      "tooFarDistanceX": 265,
      "attackMinDistanceX": 90,
      "attackMaxDistanceX": 240,
      "attackRangeX": 240,
      "attackRangeY": 40,
      "maxAttackers": 1,
      "decisionMinMs": 260,
      "decisionMaxMs": 620,
      "strafeChance": 0.48,
      "retreatChance": 0.3,
      "attackChance": 0.56,
      "closeRetreatChance": 0.72,
      "postAttackRetreatMs": 520,
      "attackCooldownMinMs": 620,
      "attackCooldownMaxMs": 940,
      "bodyRadiusX": 48,
      "bodyRadiusY": 22
    },
    "gundos": {
      "name": "gundos",
      "bossId": "farEastRoc",
      "hp": 666,
      "speed": 1.25,
      "scale": 0.266,
      "damage": 0,
      "bossMusic": true,
      "bossMusicKey": "bossTheme",
      "blocksWaveClear": true,
      "canAttack": false,
      "canDie": true,
      "introDurationMs": 56425,
      "devilLeadMs": 2000,
      "entranceTargetX": 1040,
      "entranceY": 720,
      "zetnikSpawnMinMs": 1450,
      "zetnikSpawnMaxMs": 2450,
      "zetnikSpeedMultiplier": 0.6,
      "maxZetniks": 3,
      "guardZetniks": 3,
      "medicSpawnMs": 1200,
      "medicRespawnMs": 12500,
      "fireballSpawnMinMs": 1250,
      "fireballSpawnMaxMs": 2350,
      "fireballDamage": 24,
      "fireballLaneTolerance": 34,
      "fireWallDamage": 10,
      "fireWallDamageIntervalMs": 360,
      "zetnikHitDamage": 35,
      "arenaMoveSpeed": 0,
      "arenaTop": 540,
      "arenaBottom": 720,
      "deathHoldMs": 5000,
      "victoryDelayMs": 4800,
      "introSequenceVersion": 8
    }
  },
  "pickups": {
    "medkit": {
      "image": "medkit",
      "heal": 1,
      "fullHeal": true,
      "dropChance": 1,
      "scale": 0.09,
      "label": "100% ЗДОРОВЬЯ"
    },
    "pirozhok": {
      "image": "pirozhok",
      "healPercent": 0.2,
      "dropChance": 1,
      "scale": 0.065,
      "label": "+20% ЗДОРОВЬЯ"
    },
    "tea": {
      "image": "tea",
      "healPercent": 0.5,
      "dropChance": 1,
      "scale": 0.075,
      "label": "+50% ЗДОРОВЬЯ"
    },
    "supportFigure": {
      "support": true,
      "scale": 0.34,
      "label": "ПОДДЕРЖКА ПОЛУЧЕНА"
    }
  },
  "levelOrder": [
    "street01",
    "street02",
    "street03",
    "siberia01",
    "siberia02",
    "siberia03",
    "ural01",
    "ural02",
    "ural03",
    "northwest01",
    "northwest02",
    "northwest03",
    "volga01",
    "volga02",
    "volga03",
    "south01",
    "south02",
    "south03",
    "moscow01",
    "moscow02",
    "moscow03"
  ],
  "campaignRegions": [
    {
      "mapId": "farEast",
      "levelRegion": "far-east",
      "levels": [
        "street01",
        "street02",
        "street03"
      ]
    },
    {
      "mapId": "siberia",
      "levelRegion": "siberia",
      "levels": [
        "siberia01",
        "siberia02",
        "siberia03"
      ]
    },
    {
      "mapId": "ural",
      "levelRegion": "ural",
      "levels": [
        "ural01",
        "ural02",
        "ural03"
      ]
    },
    {
      "mapId": "northwestPiter",
      "levelRegion": "northwest",
      "levels": [
        "northwest01",
        "northwest02",
        "northwest03"
      ]
    },
    {
      "mapId": "volga",
      "levelRegion": "volga",
      "levels": [
        "volga01",
        "volga02",
        "volga03"
      ]
    },
    {
      "mapId": "southSochi",
      "levelRegion": "south",
      "levels": [
        "south01",
        "south02",
        "south03"
      ]
    },
    {
      "mapId": "centralMoscow",
      "levelRegion": "moscow",
      "levels": [
        "moscow01",
        "moscow02",
        "moscow03"
      ]
    }
  ],
  "levels": {
    "street01": {
      "name": "Far East 01",
      "region": "far-east",
      "background": "assets/backgrounds/1/street01.png",
      "interactives": [
        {
          "id": "shamanPoster",
          "type": "breakablePoster",
          "hitsToReplace": 3,
          "altBackground": "assets/backgrounds/1/street01_1.png",
          "laneY": 533,
          "laneTolerance": 38,
          "hitbox": {
            "x": 362,
            "y": 320,
            "w": 68,
            "h": 150
          },
          "effectRect": {
            "x": 360,
            "y": 322,
            "w": 72,
            "h": 150
          },
          "dropPickup": "supportFigure",
          "dropX": 406,
          "dropY": 620
        }
      ],
      "music": "farEastTheme",
      "waves": [
        {
          "trigger": "onEnter",
          "enemies": [
            {
              "type": "dogRegime",
              "count": 1,
              "side": "right",
              "delayMs": 0
            },
            {
              "type": "dogRegime",
              "count": 1,
              "side": "left",
              "delayMs": 5000
            }
          ]
        },
        {
          "trigger": "afterWaveCleared",
          "enemies": [
            {
              "type": "horse",
              "count": 1,
              "side": "right",
              "delayMs": 0
            },
            {
              "type": "zetnik",
              "count": 1,
              "side": "left",
              "delayMs": 5000
            }
          ]
        }
      ],
      "walkZone": {
        "left": 0,
        "right": 1280,
        "top": 550,
        "bottom": 725
      },
      "playerStart": {
        "x": 195,
        "y": 615
      },
      "enemySpawnMargin": {
        "x": 40,
        "y": 28
      }
    },
    "street02": {
      "name": "Far East 02",
      "region": "far-east",
      "background": "assets/backgrounds/1/street02.png",
      "music": "farEastTheme",
      "waves": [
        {
          "trigger": "onEnter",
          "enemies": [
            {
              "type": "dogRegime",
              "count": 2,
              "side": "right",
              "delayMs": 0
            }
          ]
        },
        {
          "trigger": "afterWaveCleared",
          "enemies": [
            {
              "type": "dogRegime",
              "count": 1,
              "side": "left",
              "delayMs": 0
            },
            {
              "type": "zetnik",
              "count": 1,
              "side": "right",
              "delayMs": 0
            }
          ]
        },
        {
          "trigger": "afterWaveCleared",
          "enemies": [
            {
              "type": "sucker",
              "count": 1,
              "side": "right",
              "delayMs": 0
            }
          ]
        }
      ],
      "walkZone": {
        "left": 0,
        "right": 1280,
        "top": 585,
        "bottom": 710
      },
      "playerStart": {
        "x": 1120,
        "y": 620
      },
      "enemySpawnMargin": {
        "x": 40,
        "y": 28
      }
    },
    "street03": {
      "name": "Far East 03",
      "region": "far-east",
      "background": "assets/backgrounds/1/street03.png",
      "music": "bossTheme",
      "musicMode": "boss",
      "interactives": [
        {
          "id": "fruitKiosk",
          "type": "breakableObject",
          "hitsToReplace": 3,
          "requiresBossDefeat": true,
          "damageEffect": "fruitBurst",
          "laneY": 625,
          "laneTolerance": 60,
          "hitbox": {
            "x": 780,
            "y": 375,
            "w": 240,
            "h": 180
          },
          "effectRect": {
            "x": 800,
            "y": 445,
            "w": 200,
            "h": 110
          },
          "dropPickup": "supportFigure",
          "dropX": 900,
          "dropY": 650
        }
      ],
      "bossFireWall": {
        "x": 520,
        "y": 588,
        "w": 486,
        "h": 149
      },
      "waves": [
        {
          "trigger": "onEnter",
          "enemies": [
            {
              "type": "gundos",
              "count": 1,
              "side": "right",
              "delayMs": 0
            }
          ]
        }
      ],
      "walkZone": {
        "left": 0,
        "right": 1280,
        "top": 600,
        "bottom": 725
      },
      "playerStart": {
        "x": 1165,
        "y": 635
      },
      "enemySpawnMargin": {
        "x": 40,
        "y": 28
      }
    },
    "siberia01": {
      "name": "Siberia 01",
      "region": "siberia",
      "background": "assets/backgrounds/2/street01.png",
      "music": "siberiaTheme",
      "waves": [
        {
          "trigger": "onEnter",
          "enemies": [
            {
              "type": "dogRegime",
              "count": 2,
              "side": "right",
              "delayMs": 0
            }
          ]
        }
      ],
      "walkZone": {
        "left": 0,
        "right": 1280,
        "top": 550,
        "bottom": 710
      },
      "playerStart": {
        "x": 195,
        "y": 615
      },
      "enemySpawnMargin": {
        "x": 40,
        "y": 28
      }
    },
    "siberia02": {
      "name": "Siberia 02",
      "region": "siberia",
      "background": "assets/backgrounds/2/street02.png",
      "music": "siberiaTheme",
      "interactives": [
        {
          "id": "siberiaGarageGate",
          "type": "breakableObject",
          "hitsToReplace": 3,
          "altBackground": "assets/backgrounds/2/street02_1.png",
          "strictHitbox": true,
          "showDamageEffect": false,
          "silentImpact": true,
          "impactSfx": "garageGateMetal",
          "dropPickup": "supportFigure",
          "dropAtHitbox": true,
          "laneY": 620,
          "laneTolerance": 65,
          "hitbox": {
            "x": 966,
            "y": 390,
            "w": 47,
            "h": 52
          }
        }
      ],
      "waves": [
        {
          "trigger": "onEnter",
          "enemies": [
            {
              "type": "dogRegime",
              "count": 2,
              "side": "right",
              "delayMs": 0
            }
          ]
        },
        {
          "trigger": "afterWaveCleared",
          "enemies": [
            {
              "type": "zetnik",
              "count": 1,
              "side": "right",
              "delayMs": 0
            }
          ]
        }
      ],
      "walkZone": {
        "left": 0,
        "right": 1280,
        "top": 550,
        "bottom": 710
      },
      "playerStart": {
        "x": 195,
        "y": 615
      },
      "enemySpawnMargin": {
        "x": 40,
        "y": 28
      }
    },
    "siberia03": {
      "name": "Siberia 03",
      "region": "siberia",
      "background": "assets/backgrounds/2/street03.png",
      "music": "siberiaTheme",
      "waves": [
        {
          "trigger": "onEnter",
          "enemies": [
            {
              "type": "dogRegime",
              "count": 2,
              "side": "right",
              "delayMs": 0
            }
          ]
        },
        {
          "trigger": "afterWaveCleared",
          "enemies": [
            {
              "type": "sucker",
              "count": 1,
              "side": "right",
              "delayMs": 0
            }
          ]
        }
      ],
      "walkZone": {
        "left": 0,
        "right": 1280,
        "top": 575,
        "bottom": 730
      },
      "playerStart": {
        "x": 195,
        "y": 615
      },
      "enemySpawnMargin": {
        "x": 40,
        "y": 28
      }
    },
    "ural01": {
      "name": "Ural 01",
      "region": "ural",
      "background": "assets/backgrounds/3/street01.png",
      "music": "levelTheme",
      "waves": [
        {
          "trigger": "onEnter",
          "enemies": [
            {
              "type": "dogRegime",
              "count": 2,
              "side": "right",
              "delayMs": 0
            }
          ]
        }
      ],
      "walkZone": {
        "left": 0,
        "right": 1280,
        "top": 550,
        "bottom": 710
      },
      "playerStart": {
        "x": 195,
        "y": 615
      },
      "enemySpawnMargin": {
        "x": 40,
        "y": 28
      }
    },
    "ural02": {
      "name": "Ural 02",
      "region": "ural",
      "background": "assets/backgrounds/3/street02.png",
      "music": "levelTheme",
      "waves": [
        {
          "trigger": "onEnter",
          "enemies": [
            {
              "type": "dogRegime",
              "count": 2,
              "side": "right",
              "delayMs": 0
            }
          ]
        }
      ],
      "walkZone": {
        "left": 0,
        "right": 1280,
        "top": 550,
        "bottom": 710
      },
      "playerStart": {
        "x": 195,
        "y": 615
      },
      "enemySpawnMargin": {
        "x": 40,
        "y": 28
      }
    },
    "ural03": {
      "name": "Ural 03",
      "region": "ural",
      "background": "assets/backgrounds/3/street03.png",
      "music": "levelTheme",
      "waves": [
        {
          "trigger": "onEnter",
          "enemies": [
            {
              "type": "sucker",
              "count": 1,
              "side": "right",
              "delayMs": 0
            }
          ]
        }
      ],
      "walkZone": {
        "left": 0,
        "right": 1280,
        "top": 550,
        "bottom": 710
      },
      "playerStart": {
        "x": 195,
        "y": 615
      },
      "enemySpawnMargin": {
        "x": 40,
        "y": 28
      }
    },
    "northwest01": {
      "name": "Northwest 01",
      "region": "northwest",
      "background": "assets/backgrounds/4/street01.png",
      "music": "levelTheme",
      "waves": [
        {
          "trigger": "onEnter",
          "enemies": [
            {
              "type": "dogRegime",
              "count": 2,
              "side": "right",
              "delayMs": 0
            }
          ]
        }
      ],
      "walkZone": {
        "left": 0,
        "right": 1280,
        "top": 550,
        "bottom": 710
      },
      "playerStart": {
        "x": 195,
        "y": 615
      },
      "enemySpawnMargin": {
        "x": 40,
        "y": 28
      }
    },
    "northwest02": {
      "name": "Northwest 02",
      "region": "northwest",
      "background": "assets/backgrounds/4/street02.png",
      "music": "levelTheme",
      "waves": [
        {
          "trigger": "onEnter",
          "enemies": [
            {
              "type": "dogRegime",
              "count": 2,
              "side": "right",
              "delayMs": 0
            }
          ]
        }
      ],
      "walkZone": {
        "left": 0,
        "right": 1280,
        "top": 550,
        "bottom": 710
      },
      "playerStart": {
        "x": 195,
        "y": 615
      },
      "enemySpawnMargin": {
        "x": 40,
        "y": 28
      }
    },
    "northwest03": {
      "name": "Northwest 03",
      "region": "northwest",
      "background": "assets/backgrounds/4/street03.png",
      "music": "levelTheme",
      "waves": [
        {
          "trigger": "onEnter",
          "enemies": [
            {
              "type": "sucker",
              "count": 1,
              "side": "right",
              "delayMs": 0
            }
          ]
        }
      ],
      "walkZone": {
        "left": 0,
        "right": 1280,
        "top": 550,
        "bottom": 710
      },
      "playerStart": {
        "x": 195,
        "y": 615
      },
      "enemySpawnMargin": {
        "x": 40,
        "y": 28
      }
    },
    "volga01": {
      "name": "Volga 01",
      "region": "volga",
      "background": "assets/backgrounds/5/street01.png",
      "music": "levelTheme",
      "waves": [
        {
          "trigger": "onEnter",
          "enemies": [
            {
              "type": "dogRegime",
              "count": 2,
              "side": "right",
              "delayMs": 0
            }
          ]
        }
      ],
      "walkZone": {
        "left": 0,
        "right": 1280,
        "top": 550,
        "bottom": 710
      },
      "playerStart": {
        "x": 195,
        "y": 615
      },
      "enemySpawnMargin": {
        "x": 40,
        "y": 28
      }
    },
    "volga02": {
      "name": "Volga 02",
      "region": "volga",
      "background": "assets/backgrounds/5/street02.png",
      "music": "levelTheme",
      "waves": [
        {
          "trigger": "onEnter",
          "enemies": [
            {
              "type": "dogRegime",
              "count": 2,
              "side": "right",
              "delayMs": 0
            }
          ]
        }
      ],
      "walkZone": {
        "left": 0,
        "right": 1280,
        "top": 550,
        "bottom": 710
      },
      "playerStart": {
        "x": 195,
        "y": 615
      },
      "enemySpawnMargin": {
        "x": 40,
        "y": 28
      }
    },
    "volga03": {
      "name": "Volga 03",
      "region": "volga",
      "background": "assets/backgrounds/5/street03.png",
      "music": "levelTheme",
      "waves": [
        {
          "trigger": "onEnter",
          "enemies": [
            {
              "type": "sucker",
              "count": 1,
              "side": "right",
              "delayMs": 0
            }
          ]
        }
      ],
      "walkZone": {
        "left": 0,
        "right": 1280,
        "top": 550,
        "bottom": 710
      },
      "playerStart": {
        "x": 195,
        "y": 615
      },
      "enemySpawnMargin": {
        "x": 40,
        "y": 28
      }
    },
    "south01": {
      "name": "South 01",
      "region": "south",
      "background": "assets/backgrounds/6/street01.png",
      "music": "levelTheme",
      "waves": [
        {
          "trigger": "onEnter",
          "enemies": [
            {
              "type": "dogRegime",
              "count": 2,
              "side": "right",
              "delayMs": 0
            }
          ]
        }
      ],
      "walkZone": {
        "left": 0,
        "right": 1280,
        "top": 550,
        "bottom": 710
      },
      "playerStart": {
        "x": 195,
        "y": 615
      },
      "enemySpawnMargin": {
        "x": 40,
        "y": 28
      }
    },
    "south02": {
      "name": "South 02",
      "region": "south",
      "background": "assets/backgrounds/6/street02.png",
      "music": "levelTheme",
      "waves": [
        {
          "trigger": "onEnter",
          "enemies": [
            {
              "type": "dogRegime",
              "count": 2,
              "side": "right",
              "delayMs": 0
            }
          ]
        }
      ],
      "walkZone": {
        "left": 0,
        "right": 1280,
        "top": 550,
        "bottom": 710
      },
      "playerStart": {
        "x": 195,
        "y": 615
      },
      "enemySpawnMargin": {
        "x": 40,
        "y": 28
      }
    },
    "south03": {
      "name": "South 03",
      "region": "south",
      "background": "assets/backgrounds/6/street03.png",
      "music": "levelTheme",
      "waves": [
        {
          "trigger": "onEnter",
          "enemies": [
            {
              "type": "sucker",
              "count": 1,
              "side": "right",
              "delayMs": 0
            }
          ]
        }
      ],
      "walkZone": {
        "left": 0,
        "right": 1280,
        "top": 550,
        "bottom": 710
      },
      "playerStart": {
        "x": 195,
        "y": 615
      },
      "enemySpawnMargin": {
        "x": 40,
        "y": 28
      }
    },
    "moscow01": {
      "name": "Moscow 01",
      "region": "moscow",
      "background": "assets/backgrounds/7/street01.png",
      "music": "levelTheme",
      "waves": [
        {
          "trigger": "onEnter",
          "enemies": [
            {
              "type": "dogRegime",
              "count": 2,
              "side": "right",
              "delayMs": 0
            }
          ]
        }
      ],
      "walkZone": {
        "left": 0,
        "right": 1280,
        "top": 550,
        "bottom": 710
      },
      "playerStart": {
        "x": 195,
        "y": 615
      },
      "enemySpawnMargin": {
        "x": 40,
        "y": 28
      }
    },
    "moscow02": {
      "name": "Moscow 02",
      "region": "moscow",
      "background": "assets/backgrounds/7/street02.png",
      "music": "levelTheme",
      "waves": [
        {
          "trigger": "onEnter",
          "enemies": [
            {
              "type": "dogRegime",
              "count": 2,
              "side": "right",
              "delayMs": 0
            }
          ]
        }
      ],
      "walkZone": {
        "left": 0,
        "right": 1280,
        "top": 550,
        "bottom": 710
      },
      "playerStart": {
        "x": 195,
        "y": 615
      },
      "enemySpawnMargin": {
        "x": 40,
        "y": 28
      }
    },
    "moscow03": {
      "name": "Moscow 03",
      "region": "moscow",
      "background": "assets/backgrounds/7/street03.png",
      "music": "bossTheme",
      "waves": [
        {
          "trigger": "onEnter",
          "enemies": [
            {
              "type": "sucker",
              "count": 1,
              "side": "right",
              "delayMs": 0
            }
          ]
        }
      ],
      "walkZone": {
        "left": 0,
        "right": 1280,
        "top": 550,
        "bottom": 710
      },
      "playerStart": {
        "x": 195,
        "y": 615
      },
      "enemySpawnMargin": {
        "x": 40,
        "y": 28
      }
    }
  }
};

const DEFAULT_GAME_CONFIG = JSON.parse(JSON.stringify(GAME_CONFIG));
