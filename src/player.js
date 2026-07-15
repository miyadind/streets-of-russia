class Player {
  constructor(heroKey, images) {
    const hero = GAME_CONFIG.heroes[heroKey];
    this.heroKey = heroKey;
    this.name = hero.name;
    this.maxHp = hero.hp;
    this.hp = hero.hp;
    this.speed = hero.speed;
    this.damage = hero.damage;
    this.scale = hero.scale || GAME_CONFIG.playerScale;
    this.abilities = hero.abilities || {};
    this.reviveUsed = false;
    this.images = images;

    this.x = 220;
    this.y = 620;
    this.facing = 1;
    this.state = 'idle';

    this.walkCycle = [0, 1, 2, 1];
    this.walkIndex = 1;
    this.walkFrame = 1;
    this.walkTimer = 0;

    this.comboStep = 0;
    this.comboTimer = 0;
    this.attackTimer = 0;
    this.attackHasHit = false;
    this.hitStunTimer = 0;
    this.invulnerableTimer = 0;
    this.flash = 0;
    this.knockdownTimer = 0;
    this.knockdownFacing = 1;
    this.pinnedBy = null;
    this.reviveTextTimer = 0;
    this.reviveText = '';
  }

  update(dt, scene) {
    if (this.reviveTextTimer > 0) this.reviveTextTimer = Math.max(0, this.reviveTextTimer - dt);
    if (this.invulnerableTimer > 0) this.invulnerableTimer = Math.max(0, this.invulnerableTimer - dt);
    if (this.flash > 0) this.flash = Math.max(0, this.flash - dt);

    if (this.state === 'hurt') {
      this.hitStunTimer -= dt;
      if (this.hitStunTimer <= 0) {
        this.hitStunTimer = 0;
        this.state = 'idle';
      }
      return;
    }

    if (this.state === 'knockdown') {
      this.knockdownTimer -= dt;
      if (this.knockdownTimer <= 0) this.releaseFromPin();
      return;
    }

    if (this.state === 'pinned') {
      this.knockdownTimer -= dt;
      if (this.knockdownTimer <= 0) this.releaseFromPin();
      return;
    }

    if (this.comboTimer > 0) this.comboTimer -= dt;
    else this.comboStep = 0;

    if (Input.consume('space')) this.startAttack();

    if (this.state === 'attack') {
      if (typeof Responsive !== 'undefined' && Responsive.isTouchDevice) {
        this.updateMovement(dt, false);
      }
      this.updateAttack(dt, scene);
      return;
    }

    this.updateMovement(dt, true);
  }

  updateMovement(dt, updateState) {
    let dx = 0;
    let dy = 0;
    if (Input.pressed('a') || Input.pressed('arrowleft')) dx -= 1;
    if (Input.pressed('d') || Input.pressed('arrowright')) dx += 1;
    if (Input.pressed('w') || Input.pressed('arrowup')) dy -= 1;
    if (Input.pressed('s') || Input.pressed('arrowdown')) dy += 1;

    const moving = dx !== 0 || dy !== 0;
    if (moving) {
      const len = Math.hypot(dx, dy);
      dx /= len;
      dy /= len;
      this.x += dx * this.speed;
      this.y += dy * this.speed * GAME_CONFIG.ySpeedMultiplier;
      if (dx !== 0) this.facing = Math.sign(dx);

      if (updateState) {
        if (Input.consume('a') || Input.consume('d') || Input.consume('w') || Input.consume('s') ||
            Input.consume('arrowleft') || Input.consume('arrowright') || Input.consume('arrowup') || Input.consume('arrowdown')) {
          this.nextWalkFrame();
          this.walkTimer = 0;
        }

        this.walkTimer += dt;
        if (this.walkTimer >= GAME_CONFIG.walkFrameMs) {
          this.walkTimer -= GAME_CONFIG.walkFrameMs;
          this.nextWalkFrame();
        }
        this.state = 'walk';
      }
    } else if (updateState) {
      this.state = 'idle';
      this.walkTimer = 0;
    }

    this.x = Math.max(70, Math.min(GAME_CONFIG.width - 70, this.x));
    this.y = Math.max(GAME_CONFIG.laneTop, Math.min(GAME_CONFIG.laneBottom, this.y));
  }

  receiveDamage(amount, options = {}) {
    if (this.hp <= 0) return false;
    if (this.invulnerableTimer > 0 && !options.ignoreInvulnerability) return false;

    const source = options.source || 'melee';
    let damageAmount = Math.max(0, amount || 0);
    if (source === 'ranged' && Number.isFinite(this.abilities.rangedDamageMultiplier)) {
      damageAmount *= Math.max(0, this.abilities.rangedDamageMultiplier);
    } else if (source === 'ranged' && this.abilities.rangedImmune) {
      AudioManager.playSfx('menuMove', 0.45, { playbackRate: 0.72 });
      return false;
    }

    this.hp = Math.max(0, this.hp - damageAmount);

    if (options.knockbackX) {
      const knockbackMultiplier = source === 'melee' ? 2.1 : 1;
      this.x += options.knockbackX * knockbackMultiplier;
      this.x = Math.max(70, Math.min(GAME_CONFIG.width - 70, this.x));
    }

    if (this.hp <= 0 && this.tryRevive()) return true;

    if (this.hp > 0 && options.knockdownMs) {
      this.knockDown(options.knockdownMs, {
        force: options.forceKnockdown,
        facing: options.knockdownFacing || (options.knockbackX ? -Math.sign(options.knockbackX) : this.facing)
      });
    } else if (this.hp > 0 && this.state !== 'pinned' && this.state !== 'knockdown') {
      this.startHitStun(options.hitStunMs, options.invulnerableMs);
    }

    return true;
  }

  startHitStun(durationMs, invulnerableMs) {
    const stunMs = Math.max(0, durationMs == null ? GAME_CONFIG.playerHitStunMs : Number(durationMs) || 0);
    const guardMs = Math.max(stunMs, invulnerableMs == null ? GAME_CONFIG.playerInvulnerableMs : Number(invulnerableMs) || 0);

    this.hitStunTimer = stunMs;
    this.invulnerableTimer = guardMs;
    this.flash = Math.max(this.flash || 0, Math.min(220, guardMs));
    this.state = stunMs > 0 ? 'hurt' : 'idle';
    this.attackTimer = 0;
    this.attackHasHit = false;
    this.comboStep = 0;
    this.comboTimer = 0;
    this.walkTimer = 0;
  }

  tryRevive() {
    if (!this.abilities.reviveOnce || this.reviveUsed) return false;
    this.reviveUsed = true;
    const restoredHp = Math.max(1, Math.round(this.maxHp * 0.5));
    this.hp = restoredHp;
    this.state = 'knockdown';
    this.hitStunTimer = 0;
    this.invulnerableTimer = Math.max(GAME_CONFIG.playerInvulnerableMs, GAME_CONFIG.playerReviveKnockdownMs || 950);
    this.flash = this.invulnerableTimer;
    this.knockdownTimer = GAME_CONFIG.playerReviveKnockdownMs || 950;
    this.pinnedBy = null;
    this.attackTimer = 0;
    this.attackHasHit = false;
    this.comboStep = 0;
    this.comboTimer = 0;
    this.reviveText = '+' + restoredHp + ' HP';
    this.reviveTextTimer = GAME_CONFIG.playerReviveTextMs || 1250;
    AudioManager.playSfx('waveClear', 0.75, { playbackRate: 1.12 });
    return true;
  }

  canBeKnockedDown() {
    return !this.abilities.noKnockdown;
  }

  startAttack() {
    if (this.state === 'attack' || this.state === 'hurt' || this.state === 'knockdown' || this.state === 'pinned') return;

    this.comboStep += 1;
    if (this.comboStep > 3) this.comboStep = 1;

    this.playAttackSwingSound();
    this.comboTimer = GAME_CONFIG.comboResetMs;
    this.state = 'attack';
    this.attackTimer = 0;
    this.attackHasHit = false;
  }

  playAttackSwingSound() {
    AudioManager.playSfx('punch', 0.42, { playbackRate: 1.12, startAt: 0.01 });
  }

  playComboHitSound() {
    const key = this.comboStep === 3 ? 'punch3' : this.comboStep === 2 ? 'punch2' : 'punch1';
    const hasCustomSound = AudioManager.sfx && AudioManager.sfx[key];
    AudioManager.playSfx(hasCustomSound ? key : 'hit', this.comboStep === 3 ? 0.98 : 0.88, {
      playbackRate: this.comboStep === 3 ? 1.12 : 1.16,
      startAt: 0.018
    });
  }

  updateAttack(dt, scene) {
    this.attackTimer += dt;
    const data = this.getAttackData();

    if (!this.attackHasHit && this.attackTimer >= data.activeStart && this.attackTimer <= data.activeEnd) {
      if (scene.tryCollectPickup && scene.tryCollectPickup(this)) {
        this.attackHasHit = true;
        scene.hitStop = Math.max(scene.hitStop || 0, 20);
        return;
      }

      const hitbox = this.getHitbox();
      for (const enemy of scene.enemies) {
        if (!enemy.alive) continue;
        if (enemy.enemyType === 'sucker' && (enemy.state === 'windup' || enemy.state === 'slide') && this.canCounterSlide(enemy)) {
          this.attackHasHit = true;
          enemy.interruptSlide(this);
          scene.hitStop = GAME_CONFIG.playerHitStopMs;
          break;
        }
        if (enemy.enemyType === 'zetnik' && enemy.gundosMinion && !enemy.redirectedToBoss) {
          const target = enemy.getHurtbox();
          const pad = 34;
          const expandedTarget = {
            x: target.x - pad,
            y: target.y - pad,
            w: target.w + pad * 2,
            h: target.h + pad * 2
          };
          if (Combat.canMeleeHit(this, enemy, {
            attackBox: hitbox,
            targetBox: expandedTarget,
            laneTolerance: GAME_CONFIG.yHitTolerance
          })) {
            this.attackHasHit = true;
            if (enemy.gundosGuarding && enemy.holdGundosGuard) {
              enemy.holdGundosGuard(this);
            } else {
              enemy.redirectToGundos(this);
            }
            scene.hitStop = GAME_CONFIG.playerHitStopMs;
            break;
          }
        }
        if (Combat.canMeleeHit(this, enemy, {
          attackBox: hitbox,
          targetBox: enemy.getHurtbox(),
          laneTolerance: GAME_CONFIG.yHitTolerance
        })) {
          this.attackHasHit = true;
          this.playComboHitSound();
          const wasAlive = enemy.alive;
          enemy.takeHit(data.damage, this.facing, data.knockback);
          if (wasAlive && !enemy.alive && scene.maybeDropPickup) scene.maybeDropPickup(enemy, { source: 'player' });
          if (enemy.enemyType === 'bastard') {
            if (enemy.grantGundosMedicHeal) {
              enemy.grantGundosMedicHeal(this, scene);
            } else {
              const healAmount = 5;
              this.hp = Math.min(this.maxHp, this.hp + healAmount);
              if (scene.addGundosFloatText) scene.addGundosFloatText('+5 HP', enemy.x, enemy.y - 150, '#6dff8d');
            }
            AudioManager.playSfx('enemyDown', 0.75, { playbackRate: 1.08, startAt: 0.01 });
          }
          scene.hitStop = GAME_CONFIG.playerHitStopMs;
          break;
        }
      }
    }

    if (this.attackTimer >= data.duration) {
      this.state = 'idle';
      this.attackTimer = 0;
      this.attackHasHit = false;
    }
  }

  getAttackData() {
    if (this.comboStep === 1) return { duration: 170, activeStart: 25, activeEnd: 120, damage: this.damage, knockback: 24, range: 46 };
    if (this.comboStep === 2) return { duration: 190, activeStart: 30, activeEnd: 135, damage: this.damage + 5, knockback: 32, range: 52 };
    return { duration: 240, activeStart: 34, activeEnd: 160, damage: this.damage + 14, knockback: 68, range: 62 };
  }

  getHitbox() {
    const data = this.getAttackData();
    return {
      x: this.x + (this.facing === 1 ? 22 : -22 - data.range),
      y: this.y - 118,
      w: data.range,
      h: 40
    };
  }

  getBodyBox() {
    const hero = GAME_CONFIG.heroes[this.heroKey] || {};
    const knockdownBody = (this.state === 'knockdown' || this.state === 'pinned') ? hero.knockdownBody : null;
    if (knockdownBody) {
      const w = Math.max(1, knockdownBody.w || 160);
      const h = Math.max(1, knockdownBody.h || 44);
      const bodyOffset = Math.max(0, knockdownBody.bodyOffsetX || 0);
      const bottomOffset = Math.max(0, knockdownBody.bottomOffsetY || 0);
      const localLeft = this.facing === 1 ? bodyOffset : -bodyOffset - w;
      return {
        x: this.x + localLeft,
        y: this.y - h - bottomOffset,
        w,
        h
      };
    }
    return { x: this.x - 34, y: this.y - 132, w: 68, h: 132 };
  }

  canCounterSlide(enemy) {
    if (this.state !== 'attack' || !enemy) return false;
    if (Combat.laneCanConnect && !Combat.laneCanConnect(this, enemy, {
      laneTolerance: (GAME_CONFIG.enemies.sucker && GAME_CONFIG.enemies.sucker.counterRangeY) || GAME_CONFIG.yHitTolerance
    })) return false;

    const data = this.getAttackData();
    if (this.attackTimer < data.activeStart || this.attackTimer > data.activeEnd) return false;

    const config = (GAME_CONFIG.enemies && GAME_CONFIG.enemies.sucker) || {};
    const rangeX = config.counterRangeX || 150;
    const rangeY = config.counterRangeY || GAME_CONFIG.enemyAttackRangeY || 58;
    const counterZone = {
      x: this.facing === 1 ? this.x : this.x - rangeX,
      y: this.y - rangeY,
      w: rangeX,
      h: rangeY * 2
    };
    const forgiveness = 26;
    const targets = [];
    if (enemy.state === 'slide' && typeof enemy.getSlideHitbox === 'function') targets.push(enemy.getSlideHitbox());
    if (typeof enemy.getHurtbox === 'function') targets.push(enemy.getHurtbox());

    return targets.some(target => target && Combat.canMeleeHit(this, enemy, {
      attackBox: counterZone,
      targetBox: {
      x: target.x - forgiveness,
      y: target.y - forgiveness,
      w: target.w + forgiveness * 2,
      h: target.h + forgiveness * 2
      },
      laneTolerance: rangeY
    }));
  }

  knockDown(durationMs = 900, options = {}) {
    if (!options.force && !this.canBeKnockedDown()) return false;
    if (this.state === 'pinned') return false;
    AudioManager.playSfx('playerDown', 0.85);
    this.state = 'knockdown';
    this.knockdownFacing = options.facing ? Math.sign(options.facing) || this.facing || 1 : this.facing || 1;
    this.facing = this.knockdownFacing;
    this.hitStunTimer = 0;
    this.invulnerableTimer = GAME_CONFIG.playerInvulnerableMs;
    this.flash = GAME_CONFIG.playerInvulnerableMs;
    this.knockdownTimer = durationMs;
    this.pinnedBy = null;
    this.attackTimer = 0;
    this.attackHasHit = false;
    this.comboStep = 0;
    return true;
  }

  pinBy(enemy, durationMs, options = {}) {
    if (!options.force && !this.canBeKnockedDown()) return false;
    AudioManager.playSfx('playerDown', 0.85);
    this.state = 'pinned';
    this.hitStunTimer = 0;
    this.invulnerableTimer = 0;
    this.flash = 0;
    this.knockdownTimer = durationMs;
    this.pinnedBy = enemy;
    this.attackTimer = 0;
    this.attackHasHit = false;
    this.comboStep = 0;
    return true;
  }

  releaseFromPin() {
    this.state = 'idle';
    this.hitStunTimer = 0;
    this.knockdownTimer = 0;
    this.pinnedBy = null;
  }

  nextWalkFrame() {
    this.walkIndex = (this.walkIndex + 1) % this.walkCycle.length;
    this.walkFrame = this.walkCycle[this.walkIndex];
  }

  getHeroImages() {
    return (this.images.heroes && this.images.heroes[this.heroKey]) || this.images.heroes.boris;
  }

  getImage() {
    const heroImages = this.getHeroImages();
    if (this.state === 'knockdown' || this.state === 'pinned') return heroImages.knockdown || heroImages.idle;
    if (this.state === 'hurt') return heroImages.hurt || heroImages.idle;
    if (this.state === 'attack') return heroImages.punch[this.comboStep - 1] || heroImages.punch[0] || heroImages.idle;
    if (this.state === 'walk') return heroImages.walk[this.walkFrame] || heroImages.idle;
    return heroImages.idle;
  }

  draw(ctx, debug = false) {
    const img = this.getImage();
    if (!img) return;
    const hero = GAME_CONFIG.heroes[this.heroKey] || {};
    const scale = hero.scale || this.scale || GAME_CONFIG.playerScale;
    const w = img.width * scale;
    const h = img.height * scale;
    const isKnockdown = this.state === 'knockdown' || this.state === 'pinned';
    const knockdownDraw = isKnockdown ? hero.knockdownDraw : null;
    const drawFacing = knockdownDraw && knockdownDraw.facingMultiplier ? this.facing * knockdownDraw.facingMultiplier : this.facing;
    const drawX = knockdownDraw ? -(knockdownDraw.alphaCenterX || img.width / 2) * scale : -w / 2;
    const drawY = knockdownDraw ? -(knockdownDraw.alphaBottomY || img.height) * scale : -h;

    ctx.save();
    ctx.translate(this.x, this.y);
    if (drawFacing === -1) ctx.scale(-1, 1);
    if (this.flash > 0 && Math.floor(this.flash / 55) % 2 === 0) ctx.globalAlpha = 0.48;
    ctx.drawImage(img, drawX, drawY, w, h);
    ctx.restore();

    if (this.reviveTextTimer > 0) {
      const ratio = Math.max(0, Math.min(1, this.reviveTextTimer / (GAME_CONFIG.playerReviveTextMs || 1250)));
      const rise = (1 - ratio) * 32;
      ctx.save();
      ctx.globalAlpha = Math.min(1, ratio * 1.5);
      ctx.font = 'bold 24px Arial';
      ctx.textAlign = 'center';
      ctx.lineWidth = 5;
      ctx.strokeStyle = 'rgba(0,0,0,0.85)';
      ctx.fillStyle = '#76ff8f';
      ctx.strokeText(this.reviveText, this.x, this.y - h - 22 - rise);
      ctx.fillText(this.reviveText, this.x, this.y - h - 22 - rise);
      ctx.restore();
    }

    if (this.state === 'pinned' && this.pinnedBy && this.pinnedBy.canEscapePin && this.pinnedBy.canEscapePin()) {
      const pulse = 0.72 + Math.sin(performance.now() / 95) * 0.28;
      ctx.save();
      ctx.globalAlpha = Math.max(0.35, pulse);
      ctx.font = 'bold 22px Arial';
      ctx.textAlign = 'center';
      ctx.lineWidth = 5;
      ctx.strokeStyle = 'rgba(0,0,0,0.86)';
      ctx.fillStyle = '#ffef6f';
      ctx.strokeText('PRESS ATTACK', this.x, this.y - h - 54);
      ctx.fillText('PRESS ATTACK', this.x, this.y - h - 54);
      ctx.restore();
    }

    if (debug && this.state === 'attack') {
      const hb = this.getHitbox();
      ctx.strokeStyle = 'lime';
      ctx.lineWidth = 2;
      ctx.strokeRect(hb.x, hb.y, hb.w, hb.h);

      const counterRangeX = (GAME_CONFIG.enemies.sucker && GAME_CONFIG.enemies.sucker.counterRangeX) || 120;
      const counterRangeY = (GAME_CONFIG.enemies.sucker && GAME_CONFIG.enemies.sucker.counterRangeY) || GAME_CONFIG.enemyAttackRangeY;
      ctx.strokeStyle = 'rgba(0,255,255,0.75)';
      ctx.strokeRect(this.x + (this.facing === 1 ? 0 : -counterRangeX), this.y - counterRangeY, counterRangeX, counterRangeY * 2);
    }

    if (debug) {
      ctx.strokeStyle = 'rgba(80,255,120,0.85)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(this.x - 36, this.y);
      ctx.lineTo(this.x + 36, this.y);
      ctx.stroke();
    }
  }
}
