// =============================================
// 主场景 - 格斗场景
// =============================================

class FightScene extends Phaser.Scene {
    constructor() { 
        super({ key: 'FightScene' }); 
    }

    preload() {
        // SVG 精灵图加载配置（scale 用于放大渲染质量）
        const svgParts = [
            { key: 'head',      w: 80,  h: 80  },
            { key: 'torso',     w: 80,  h: 90  },
            { key: 'arm',       w: 40,  h: 90  },
            { key: 'arm_punch', w: 90,  h: 40  },
            { key: 'legs',      w: 80,  h: 80  },
            { key: 'kick_leg',  w: 60,  h: 100 },
        ];
        for (const p of svgParts) {
            this.load.svg(`p1_${p.key}`, `assets/p1/${p.key}.svg`, { width: p.w * 2, height: p.h * 2 });
            this.load.svg(`p2_${p.key}`, `assets/p2/${p.key}.svg`, { width: p.w * 2, height: p.h * 2 });
        }
    }

    create() {
        // 初始化管理器
        this.inputManager = new InputManager(this);
        this.uiManager = new UIManager(this);
        this.effectsManager = new EffectsManager(this);
        this.roundManager = new RoundManager(this);

        // 创建游戏元素
        this.createBackground();
        this.createGround();
        this.createPlayers();
        this.setupCollisions();
        this.inputManager.init();
        this.setupInputCallbacks();
        this.uiManager.create();

        // 初始化回合管理器
        this.roundManager.init({
            onRoundStart: () => this.onRoundStart(),
            onRoundEnd: (reason, data) => this.onRoundEnd(reason, data),
            onGameEnd: (winner) => this.onGameEnd(winner)
        });

        this.roundManager.showRoundStart();
    }

    // ───────── 背景 ─────────
    createBackground() {
        const g = this.add.graphics();
        g.fillGradientStyle(0x1a0a3a, 0x1a0a3a, 0x0a0020, 0x0a0020, 1);
        g.fillRect(0, 0, GAME_CONFIG.width, GAME_CONFIG.height);

        const grid = this.add.graphics();
        grid.lineStyle(1, 0x330066, 0.35);
        for (let i = 0; i <= GAME_CONFIG.width;  i += 48) { grid.moveTo(i, 0); grid.lineTo(i, GAME_CONFIG.height); }
        for (let i = 0; i <= GAME_CONFIG.height; i += 48) { grid.moveTo(0, i); grid.lineTo(GAME_CONFIG.width, i); }
        grid.strokePath();

        const sp = this.add.graphics();
        sp.fillStyle(0x4400aa, 0.12);
        sp.fillEllipse(GAME_CONFIG.width / 2, GAME_CONFIG.height - 60, 700, 200);
    }

    // ───────── 地面 ─────────
    createGround() {
        const gY = GAME_CONFIG.height - 70;
        const deco = this.add.graphics();
        deco.fillStyle(0x2a1a4a, 1);
        deco.fillRect(0, gY, GAME_CONFIG.width, GAME_CONFIG.height - gY);
        deco.lineStyle(3, 0x8844ff, 0.8);
        deco.moveTo(0, gY); deco.lineTo(GAME_CONFIG.width, gY);
        deco.strokePath();

        for (let i = 0; i < GAME_CONFIG.width; i += 80) {
            const l = this.add.graphics();
            l.lineStyle(1, 0x6622cc, 0.3);
            l.moveTo(i, gY + 5); l.lineTo(i + 40, gY + 5);
            l.strokePath();
        }

        const ground = this.add.rectangle(
            GAME_CONFIG.width / 2, gY + 35, GAME_CONFIG.width, 70, 0x2a1a4a, 0
        );
        this.physics.add.existing(ground, true);
        this.ground = ground;
    }

    // ───────── 玩家 ─────────
    createPlayers() {
        const spawnY = GAME_CONFIG.height - 70;
        this.fighter1 = new Fighter(this, 200, spawnY, COLORS.P1, PLAYER_IDS.P1);
        this.fighter2 = new Fighter(this, GAME_CONFIG.width - 200, spawnY, COLORS.P2, PLAYER_IDS.P2);
        this.fighter1.updateFacing(1);
        this.fighter2.updateFacing(-1);
    }

    setupCollisions() {
        this.physics.add.collider(this.fighter1.container, this.ground);
        this.physics.add.collider(this.fighter2.container, this.ground);
        this.physics.add.collider(this.fighter1.container, this.fighter2.container);
    }

    // ───────── 输入回调 ─────────
    setupInputCallbacks() {
        this.inputManager.onAttack({
            onP1Punch: () => {
                if (!this.roundManager.isRoundActive()) return;
                const type = this.inputManager.resolveAttack(this.fighter1, ATTACK_TYPES.PUNCH, this.inputManager.getP1Keys());
                if (type) this.triggerAttack(this.fighter1, type);
            },
            onP1Kick: () => {
                if (!this.roundManager.isRoundActive()) return;
                const type = this.inputManager.resolveAttack(this.fighter1, ATTACK_TYPES.KICK, this.inputManager.getP1Keys());
                if (type) this.triggerAttack(this.fighter1, type);
            },
            onP2Punch: () => {
                if (!this.roundManager.isRoundActive()) return;
                const type = this.inputManager.resolveAttack(this.fighter2, ATTACK_TYPES.PUNCH, this.inputManager.getP2Keys());
                if (type) this.triggerAttack(this.fighter2, type);
            },
            onP2Kick: () => {
                if (!this.roundManager.isRoundActive()) return;
                const type = this.inputManager.resolveAttack(this.fighter2, ATTACK_TYPES.KICK, this.inputManager.getP2Keys());
                if (type) this.triggerAttack(this.fighter2, type);
            }
        });
    }

    // ───────── 触发攻击（状态机） ─────────
    triggerAttack(fighter, type) {
        const cfg = GAME_CONFIG.attack[type];
        fighter.attackState   = type + ATTACK_STATES.STARTUP;
        fighter.attackType    = type;
        fighter.hitRegistered = false;

        // 显示技名浮字
        this.effectsManager.spawnSkillName(fighter.x, fighter.y - 110, type);

        // 播前摇
        this._playStartup(fighter, type);

        this.time.delayedCall(cfg.startup, () => {
            if (fighter.attackState !== type + ATTACK_STATES.STARTUP) return;
            fighter.attackState = type + ATTACK_STATES.ACTIVE;
            this._playActive(fighter, type);

            this.time.delayedCall(cfg.activeFrames, () => {
                if (fighter.attackState !== type + ATTACK_STATES.ACTIVE) return;
                fighter.attackState = type + ATTACK_STATES.RECOVERY;
                this._playRecovery(fighter, type);

                const recTime = Math.max(50, cfg.cooldown - cfg.startup - cfg.activeFrames);
                this.time.delayedCall(recTime, () => {
                    fighter.attackState = ATTACK_STATES.IDLE;
                    fighter.resetPose();
                });
            });
        });
    }

    // ─── 前摇动画 ───
    _playStartup(fighter, type) {
        switch (type) {
            case ATTACK_TYPES.PUNCH:
                // 切换到水平出拳手臂，缩回准备
                fighter.armContainer.setVisible(false);
                fighter.armPunch.setVisible(true);
                fighter.armPunchImg.setScale(0.1, 1);
                break;

            case ATTACK_TYPES.KICK:
                fighter.kickLeg.setVisible(true);
                fighter.legsImg.setVisible(false);
                // 腿缩回准备
                fighter.kickLegImg.setScale(0.1, 1);
                break;

            case ATTACK_TYPES.RISING:
                // 升龙：使用垂直手臂缩回准备
                fighter.armImg.setScale(0.1, 1);
                break;

            case ATTACK_TYPES.AIR_PUNCH:
                // 空中出拳：切换到水平出拳手臂缩回
                fighter.armContainer.setVisible(false);
                fighter.armPunch.setVisible(true);
                fighter.armPunchImg.setScale(0.1, 1);
                break;

            case ATTACK_TYPES.AIR_KICK:
                // 空中踢腿：腿缩回
                fighter.kickLeg.setVisible(true);
                fighter.legsImg.setVisible(false);
                fighter.kickLegImg.setScale(0.1, 1);
                break;
        }
    }

    // ─── 激活帧动画 ───
    _playActive(fighter, type) {
        switch (type) {
            case ATTACK_TYPES.PUNCH:
                // 横向伸展水平出拳手臂（从0到1）
                this.tweens.add({
                    targets: fighter.armPunchImg,
                    scaleX: 1,
                    duration: GAME_CONFIG.attack.punch.activeFrames * 0.5,
                    ease: 'Power3'
                });
                break;

            case ATTACK_TYPES.KICK:
                // 横向伸展踢腿（从0到1）
                this.tweens.add({
                    targets: fighter.kickLegImg,
                    scaleX: 1,
                    duration: GAME_CONFIG.attack.kick.activeFrames * 0.5,
                    ease: 'Power3'
                });
                break;

            case ATTACK_TYPES.RISING:
                // 向上冲拳 + 身体上升
                fighter.body.setVelocityY(GAME_CONFIG.attack.rising.riseVY);
                fighter.body.setVelocityX(60 * fighter.facing);
                // 升龙手臂横向伸展
                this.tweens.add({
                    targets: fighter.armImg,
                    scaleX: 1,
                    duration: 200,
                    ease: 'Power3'
                });
                // 升龙火焰特效
                this.effectsManager.spawnRisingFlame(fighter);
                break;

            case ATTACK_TYPES.AIR_PUNCH:
                // 向前猛冲拳
                fighter.body.setVelocityX(fighter.body.velocity.x + 120 * fighter.facing);
                this.tweens.add({
                    targets: fighter.armPunchImg,
                    scaleX: 1,
                    duration: GAME_CONFIG.attack.airpunch.activeFrames * 0.45,
                    ease: 'Power3'
                });
                break;

            case ATTACK_TYPES.AIR_KICK:
                // 腿向下猛踹
                fighter.body.setVelocityY(200); // 下压加速
                this.tweens.add({
                    targets: fighter.kickLegImg,
                    scaleX: 1,
                    duration: GAME_CONFIG.attack.airkick.activeFrames * 0.45,
                    ease: 'Power3'
                });
                break;
        }
    }

    // ─── 收招动画 ───
    _playRecovery(fighter, type) {
        switch (type) {
            case ATTACK_TYPES.PUNCH:
            case ATTACK_TYPES.AIR_PUNCH:
                this.tweens.add({
                    targets: fighter.armPunchImg,
                    scaleX: 1,
                    duration: 130, ease: 'Power1',
                    onComplete: () => {
                        fighter.armPunch.setVisible(false);
                        fighter.armContainer.setVisible(true);
                    }
                });
                break;

            case ATTACK_TYPES.KICK:
            case ATTACK_TYPES.AIR_KICK:
                this.tweens.add({
                    targets: fighter.kickLegImg,
                    scaleX: 1,
                    duration: 160, ease: 'Power1',
                    onComplete: () => {
                        fighter.kickLeg.setVisible(false);
                        fighter.legsImg.setVisible(true);
                    }
                });
                break;

            case ATTACK_TYPES.RISING:
                this.tweens.add({
                    targets: fighter.armImg,
                    scaleX: 1,
                    duration: 200, ease: 'Power1'
                });
                break;
        }
    }

    // ───────── 主循环 ─────────
    update() {
        if (this.roundManager.isGameOver() || !this.roundManager.isRoundActive()) return;
        
        this.inputManager.processMovement(this.fighter1, this.inputManager.getP1Keys());
        this.inputManager.processMovement(this.fighter2, this.inputManager.getP2Keys());
        this.autoFacing();
        this.checkAllAttacks();
        this.uiManager.refresh(this.fighter1, this.fighter2);
    }

    autoFacing() {
        const f1dir = this.fighter1.x < this.fighter2.x ? 1 : -1;
        if (this.fighter1.attackState === ATTACK_STATES.IDLE) this.fighter1.updateFacing(f1dir);
        if (this.fighter2.attackState === ATTACK_STATES.IDLE) this.fighter2.updateFacing(-f1dir);
    }

    // ───────── 攻击判定 ─────────
    checkAllAttacks() {
        this._checkHit(this.fighter1, this.fighter2);
        this._checkHit(this.fighter2, this.fighter1);
    }

    _checkHit(attacker, target) {
        const type = attacker.attackType;
        if (!type || attacker.attackState !== type + ATTACK_STATES.ACTIVE) return;
        if (attacker.hitRegistered || target.isDead) return;

        const cfg = GAME_CONFIG.attack[type];
        const dx  = Math.abs(attacker.x - target.x);
        const dy  = attacker.y - target.y; // 正值=攻击者比目标低

        if (dx > cfg.range) return;

        // 飞脚向下攻击：攻击者需要在目标上方（dy < 0）
        if (type === ATTACK_TYPES.AIR_KICK) {
            if (dy > 20)  return; // 攻击者不能比目标低太多
            if (dy < -cfg.rangeY) return;
        } else if (type === ATTACK_TYPES.RISING) {
            // 升龙纵向大范围：目标可以在下方
            if (Math.abs(dy) > cfg.rangeY) return;
        } else {
            if (Math.abs(dy) > cfg.rangeY) return;
        }

        // 朝向检测
        const f = attacker.facing;
        if (!((f === 1 && attacker.x < target.x) || (f === -1 && attacker.x > target.x))) return;

        attacker.hitRegistered = true;
        this.applyHit(attacker, target, cfg, type);
    }

    applyHit(attacker, target, cfg, type) {
        let dmg = cfg.damage;

        if (target.isBlocking && target.isOnGround()) {
            dmg = Math.max(1, Math.floor(dmg * GAME_CONFIG.blockReduction));
            this.addRage(target, GAME_CONFIG.rage.onBlock);
            this.effectsManager.spawnBlockEffect(target.x, target.y - 50);
        } else {
            target.isHit = true;
            target.attackState  = ATTACK_STATES.IDLE;
            target.hitRegistered = false;

            // 击退方向
            const kbX = cfg.knockback * attacker.facing;
            let   kbY = -120;
            if (type === ATTACK_TYPES.AIR_KICK)  kbY = 250;   // 飞脚向下砸
            if (type === ATTACK_TYPES.KICK)     kbY = -200;
            if (type === ATTACK_TYPES.RISING)   kbY = -350;
            if (type === ATTACK_TYPES.AIR_PUNCH) kbY = -80;

            target.body.setVelocityX(kbX);
            target.body.setVelocityY(kbY);

            target.showHitFlash();
            this.effectsManager.playHitstunAnim(target, type);

            // 命中特效
            this.effectsManager.spawnHitSpark(target.x, target.y - 50, cfg.hitColor, type);

            this.time.delayedCall(cfg.hitstun, () => {
                target.isHit = false;
                if (target.health <= 0 && !target.isDead) {
                    this.roundManager.triggerKO(target, attacker);
                }
            });
        }

        target.health = Math.max(0, target.health - dmg);

        // 怒气
        const rageAmt = (type === ATTACK_TYPES.RISING) ? GAME_CONFIG.rage.onRising
                      : (type.startsWith('air')) ? GAME_CONFIG.rage.onAirHit
                      : (type === ATTACK_TYPES.KICK) ? GAME_CONFIG.rage.onKick
                      : GAME_CONFIG.rage.onHit;
        this.addRage(attacker, rageAmt);
        this.addRage(target, GAME_CONFIG.rage.onGetHit);

        this.effectsManager.spawnDamageNumber(target.x, target.y - 95, dmg, type, target.isBlocking && target.isOnGround());
    }

    addRage(fighter, amt) {
        fighter.rage = Math.min(100, fighter.rage + amt);
    }

    // ───────── 回合回调 ─────────
    onRoundStart(reason) {
        if (reason === 'reset') {
            this.uiManager.resetTimerColor();
            this.uiManager.updateRound(this.roundManager.getState().round);
        }
    }

    onRoundEnd(reason, data) {
        if (reason === 'timer') {
            this.uiManager.updateTimer(data);
        } else if (reason === 'timeup' || reason === 'ko') {
            const state = this.roundManager.getState();
            this.uiManager.updateWinMarks(state.scores);
        }
    }

    onGameEnd(winner) {
        // 游戏结束处理
    }

    // ───────── 重置角色 ─────────
    resetFighter(fighter, x) {
        fighter.reset(x, GAME_CONFIG.height - 70);
        fighter.resetPose();
    }
}
