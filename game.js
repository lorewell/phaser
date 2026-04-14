// ============================================
// 格斗游戏 - Fighting Game
// Phaser 3  v3.0 - 跳跃攻击系统
// 地面：拳 / 踢 / 升龙拳(W+J)
// 空中：飞拳 / 飞脚
// ============================================

const GAME_CONFIG = {
    width: 1024,
    height: 576,
    roundTime: 60,
    maxRounds: 3,
    winsNeeded: 2,
    gravity: 900,
    playerSpeed: 220,
    jumpForce: -480,

    // 攻击参数表
    attack: {
        // ── 地面 ──────────────────────────────────
        punch: {                    // 普通拳
            damage: 7,   knockback: 80,
            range: 65,   rangeY: 65,
            cooldown: 280, activeFrames: 120, startup: 60,
            hitstun: 250,
            hitColor: 0xffee22,
        },
        kick: {                     // 普通踢
            damage: 13,  knockback: 150,
            range: 85,   rangeY: 80,
            cooldown: 480, activeFrames: 140, startup: 100,
            hitstun: 380,
            hitColor: 0xff6633,
        },
        rising: {                   // 升龙拳
            damage: 18,  knockback: 60,
            range: 70,   rangeY: 160,   // 纵向范围大
            cooldown: 600, activeFrames: 280, startup: 70,
            hitstun: 500,
            hitColor: 0xff9900,
            riseVY: -600,            // 向上冲击力
        },
        // ── 空中 ──────────────────────────────────
        airpunch: {                 // 飞拳
            damage: 10,  knockback: 200,
            range: 80,   rangeY: 70,
            cooldown: 300, activeFrames: 130, startup: 55,
            hitstun: 300,
            hitColor: 0x88ffee,
        },
        airkick: {                  // 飞脚（下踹）
            damage: 16,  knockback: 100,
            range: 70,   rangeY: 120,   // 向下范围大
            cooldown: 420, activeFrames: 150, startup: 80,
            hitstun: 450,
            hitColor: 0xff44aa,
            downwardKB: true,        // 向下击退
        },
    },

    blockReduction: 0.15,
    rage: {
        onHit: 5, onGetHit: 9, onBlock: 4,
        onKick: 7, onRising: 12, onAirHit: 8,
    }
};

// 技能显示名
const ATTACK_NAMES = {
    punch:    '拳击',
    kick:     '踢击',
    rising:   '升龙拳!!',
    airpunch: '飞拳',
    airkick:  '飞脚',
};

// =============================================
// Fighter 角色类
// =============================================
class Fighter {
    constructor(scene, x, y, color, playerId) {
        this.scene    = scene;
        this.color    = color;
        this.playerId = playerId;
        this.facing   = playerId === 'p1' ? 1 : -1;

        this.health       = 100;
        this.rage         = 0;
        this.isHit        = false;
        this.isDead       = false;
        this.isBlocking   = false;
        this.attackState  = 'idle';
        this.attackType   = null;
        this.hitRegistered = false;

        // 创建物理容器
        this.container = scene.add.container(x, y);
        scene.physics.world.enable(this.container);
        this.container.body.setSize(40, 80);
        this.container.body.setOffset(-20, -80);
        this.container.body.setCollideWorldBounds(true);
        this.container.fighter = this;

        this._buildParts();
    }

    _buildParts() {
        const c = this.color;
        const skin = 0xf5c5a3;

        // 腿部（默认可见）
        this.legLeft  = this.scene.add.rectangle(-8, -12, 13, 35, c);
        this.legRight = this.scene.add.rectangle( 8, -12, 13, 35, c);

        // 身体
        this.torso = this.scene.add.rectangle(0, -52, 36, 40, c);
        this.torso.setStrokeStyle(2, this._darken(c));

        // 头
        this.head = this.scene.add.circle(0, -80, 17, skin);
        this.head.setStrokeStyle(2, 0x333333);

        // 眼睛
        this.eyeL = this.scene.add.circle(-5, -83, 3.5, 0x222222);
        this.eyeR = this.scene.add.circle( 5, -83, 3.5, 0x222222);

        // 手臂容器
        this.armContainer = this.scene.add.container(22 * this.facing, -55);
        this.upperArm = this.scene.add.rectangle(0, 0, 10, 20, skin);
        this.foreArm  = this.scene.add.rectangle(0, 18, 9, 18, skin);
        this.fist     = this.scene.add.circle(0, 32, 7, 0xffcc88);
        this.fist.setStrokeStyle(2, 0x333333);
        this.armContainer.add([this.upperArm, this.foreArm, this.fist]);

        // 踢腿容器
        this.kickLeg = this.scene.add.container(14 * this.facing, -15);
        this.thigh   = this.scene.add.rectangle(0, 0,  13, 24, c);
        this.shin    = this.scene.add.rectangle(0, 22, 11, 22, c);
        this.foot    = this.scene.add.ellipse(0, 38, 20, 10, c);
        this.foot.setStrokeStyle(2, this._darken(c));
        this.kickLeg.add([this.thigh, this.shin, this.foot]);
        this.kickLeg.setVisible(false);

        // 受击闪光
        this.hitFlash = this.scene.add.rectangle(0, -40, 44, 88, 0xffffff, 0);

        this.container.add([
            this.legLeft, this.legRight,
            this.torso,
            this.hitFlash,
            this.kickLeg,
            this.armContainer,
            this.head, this.eyeL, this.eyeR,
        ]);
    }

    _darken(color) {
        const r = ((color >> 16) & 0xff) * 0.6 | 0;
        const g = ((color >> 8)  & 0xff) * 0.6 | 0;
        const b = (color         & 0xff) * 0.6 | 0;
        return (r << 16) | (g << 8) | b;
    }

    updateFacing(facing) {
        this.facing = facing;
        this.armContainer.x = 22 * facing;
        this.kickLeg.x      = 14 * facing;
        this.eyeL.x = -3.5 * facing;
        this.eyeR.x =  3.5 * facing;
    }

    setBlockVisual(blocking) {
        this.isBlocking = blocking;
        const col = blocking ? 0x888888 : this.color;
        this.torso.setFillStyle(col);
        this.legLeft.setFillStyle(col);
        this.legRight.setFillStyle(col);
    }

    showHitFlash() {
        this.hitFlash.setFillStyle(0xffffff, 0.75);
        this.scene.time.delayedCall(80, () => this.hitFlash.setFillStyle(0xffffff, 0));
    }

    get x()    { return this.container.x; }
    get y()    { return this.container.y; }
    get body() { return this.container.body; }

    isOnGround() { return this.body.touching.down; }
}

// =============================================
// 主场景
// =============================================
class FightScene extends Phaser.Scene {
    constructor() { super({ key: 'FightScene' }); }

    create() {
        this.gameState = {
            round: 1,
            scores: { p1: 0, p2: 0 },
            timeLeft: GAME_CONFIG.roundTime,
            isRoundActive: false,
            isGameOver: false
        };

        this.createBackground();
        this.createGround();
        this.createPlayers();
        this.setupCollisions();
        this.setupInput();
        this.createUI();
        this.showRoundStart();
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
        this.fighter1 = new Fighter(this, 200, spawnY, 0xff3355, 'p1');
        this.fighter2 = new Fighter(this, GAME_CONFIG.width - 200, spawnY, 0x3388ff, 'p2');
        this.fighter1.updateFacing(1);
        this.fighter2.updateFacing(-1);
    }

    setupCollisions() {
        this.physics.add.collider(this.fighter1.container, this.ground);
        this.physics.add.collider(this.fighter2.container, this.ground);
        this.physics.add.collider(this.fighter1.container, this.fighter2.container);
    }

    // ───────── 输入 ─────────
    setupInput() {
        this.keysP1 = {
            left:  this.input.keyboard.addKey('A'),
            right: this.input.keyboard.addKey('D'),
            up:    this.input.keyboard.addKey('W'),
            down:  this.input.keyboard.addKey('S'),
            punch: this.input.keyboard.addKey('J'),
            kick:  this.input.keyboard.addKey('K'),
            block: this.input.keyboard.addKey('F'),
        };
        this.keysP2 = {
            left:  this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT),
            right: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT),
            up:    this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.UP),
            down:  this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.DOWN),
            punch: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.NUMPAD_ONE),
            kick:  this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.NUMPAD_TWO),
            block: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.NUMPAD_ZERO),
        };

        // P1 攻击键
        this.input.keyboard.on('keydown-J', () => {
            if (!this.gameState.isRoundActive) return;
            this._resolveAttack(this.fighter1, 'punch', this.keysP1);
        });
        this.input.keyboard.on('keydown-K', () => {
            if (!this.gameState.isRoundActive) return;
            this._resolveAttack(this.fighter1, 'kick', this.keysP1);
        });

        // P2 攻击键
        this.input.keyboard.on('keydown-NUMPAD_ONE', () => {
            if (!this.gameState.isRoundActive) return;
            this._resolveAttack(this.fighter2, 'punch', this.keysP2);
        });
        this.input.keyboard.on('keydown-NUMPAD_TWO', () => {
            if (!this.gameState.isRoundActive) return;
            this._resolveAttack(this.fighter2, 'kick', this.keysP2);
        });
    }

    /**
     * 根据当前状态决定实际触发的技能：
     *  - 地面 + 拳键 + 上键 → 升龙拳
     *  - 地面 + 拳键         → 普通拳
     *  - 地面 + 踢键         → 普通踢
     *  - 空中 + 拳键         → 飞拳
     *  - 空中 + 踢键         → 飞脚
     */
    _resolveAttack(fighter, key, keys) {
        if (fighter.attackState !== 'idle' || fighter.isHit) return;
        const onGround = fighter.isOnGround();

        let type;
        if (key === 'punch') {
            if (onGround && keys.up.isDown) {
                type = 'rising';      // 升龙拳
            } else if (onGround) {
                type = 'punch';       // 普通拳
            } else {
                type = 'airpunch';    // 飞拳
            }
        } else { // kick
            if (onGround) {
                type = 'kick';        // 普通踢
            } else {
                type = 'airkick';     // 飞脚
            }
        }
        this.triggerAttack(fighter, type);
    }

    // ───────── 触发攻击（状态机） ─────────
    triggerAttack(fighter, type) {
        const cfg = GAME_CONFIG.attack[type];
        fighter.attackState   = type + '_startup';
        fighter.attackType    = type;
        fighter.hitRegistered = false;

        // 显示技名浮字
        this.spawnSkillName(fighter.x, fighter.y - 110, type);

        // 播前摇
        this._playStartup(fighter, type);

        this.time.delayedCall(cfg.startup, () => {
            if (fighter.attackState !== type + '_startup') return;
            fighter.attackState = type + '_active';
            this._playActive(fighter, type);

            this.time.delayedCall(cfg.activeFrames, () => {
                if (fighter.attackState !== type + '_active') return;
                fighter.attackState = type + '_recovery';
                this._playRecovery(fighter, type);

                const recTime = Math.max(50, cfg.cooldown - cfg.startup - cfg.activeFrames);
                this.time.delayedCall(recTime, () => {
                    fighter.attackState = 'idle';
                    this._resetPose(fighter);
                });
            });
        });
    }

    // ─── 前摇动画 ───
    _playStartup(fighter, type) {
        switch (type) {
            case 'punch':
                this.tweens.add({
                    targets: fighter.armContainer,
                    x: -18 * fighter.facing,
                    duration: GAME_CONFIG.attack.punch.startup * 0.8,
                    ease: 'Power1'
                });
                break;

            case 'kick':
                fighter.kickLeg.setVisible(true);
                fighter.legLeft.setVisible(false);
                this.tweens.add({
                    targets: fighter.kickLeg,
                    x: -10 * fighter.facing,
                    angle: -30 * fighter.facing,
                    duration: GAME_CONFIG.attack.kick.startup * 0.8,
                    ease: 'Power1'
                });
                break;

            case 'rising':
                // 手臂抬高，身体下蹲准备
                this.tweens.add({
                    targets: fighter.armContainer,
                    x: -5 * fighter.facing,
                    y: -70,
                    angle: -40 * fighter.facing,
                    duration: GAME_CONFIG.attack.rising.startup * 0.9,
                    ease: 'Power2'
                });
                break;

            case 'airpunch':
                // 空中向前伸拳
                this.tweens.add({
                    targets: fighter.armContainer,
                    x: -15 * fighter.facing,
                    y: -50,
                    duration: GAME_CONFIG.attack.airpunch.startup * 0.7,
                    ease: 'Power1'
                });
                break;

            case 'airkick':
                // 收腿准备下踹
                fighter.kickLeg.setVisible(true);
                fighter.legLeft.setVisible(false);
                this.tweens.add({
                    targets: fighter.kickLeg,
                    x: 5 * fighter.facing,
                    y: -40,
                    angle: 0,
                    duration: GAME_CONFIG.attack.airkick.startup * 0.7,
                    ease: 'Power2'
                });
                break;
        }
    }

    // ─── 激活帧动画 ───
    _playActive(fighter, type) {
        switch (type) {
            case 'punch':
                this.tweens.add({
                    targets: fighter.armContainer,
                    x: 52 * fighter.facing,
                    duration: GAME_CONFIG.attack.punch.activeFrames * 0.5,
                    ease: 'Power3'
                });
                break;

            case 'kick':
                this.tweens.add({
                    targets: fighter.kickLeg,
                    x: 60 * fighter.facing,
                    angle: 30 * fighter.facing,
                    duration: GAME_CONFIG.attack.kick.activeFrames * 0.5,
                    ease: 'Power3'
                });
                break;

            case 'rising':
                // 向上冲拳 + 身体上升
                fighter.body.setVelocityY(GAME_CONFIG.attack.rising.riseVY);
                fighter.body.setVelocityX(60 * fighter.facing);
                this.tweens.add({
                    targets: fighter.armContainer,
                    x: 30 * fighter.facing,
                    y: -100,
                    angle: 30 * fighter.facing,
                    duration: 200,
                    ease: 'Power3'
                });
                // 升龙火焰特效
                this._spawnRisingFlame(fighter);
                break;

            case 'airpunch':
                // 向前猛冲拳
                fighter.body.setVelocityX(fighter.body.velocity.x + 120 * fighter.facing);
                this.tweens.add({
                    targets: fighter.armContainer,
                    x: 60 * fighter.facing,
                    y: -52,
                    duration: GAME_CONFIG.attack.airpunch.activeFrames * 0.45,
                    ease: 'Power3'
                });
                break;

            case 'airkick':
                // 腿向下猛踹
                fighter.body.setVelocityY(200); // 下压加速
                this.tweens.add({
                    targets: fighter.kickLeg,
                    y: 20,
                    angle: 15 * fighter.facing,
                    duration: GAME_CONFIG.attack.airkick.activeFrames * 0.45,
                    ease: 'Power3'
                });
                break;
        }
    }

    // ─── 收招动画 ───
    _playRecovery(fighter, type) {
        switch (type) {
            case 'punch':
            case 'airpunch':
                this.tweens.add({
                    targets: fighter.armContainer,
                    x: 22 * fighter.facing, y: -55, angle: 0,
                    duration: 130, ease: 'Power1'
                });
                break;

            case 'kick':
            case 'airkick':
                this.tweens.add({
                    targets: fighter.kickLeg,
                    x: 14 * fighter.facing, y: -15, angle: 0,
                    duration: 160, ease: 'Power1',
                    onComplete: () => {
                        fighter.kickLeg.setVisible(false);
                        fighter.legLeft.setVisible(true);
                    }
                });
                break;

            case 'rising':
                this.tweens.add({
                    targets: fighter.armContainer,
                    x: 22 * fighter.facing, y: -55, angle: 0,
                    duration: 200, ease: 'Power1'
                });
                break;
        }
    }

    // ─── 重置姿势 ───
    _resetPose(fighter) {
        fighter.armContainer.x = 22 * fighter.facing;
        fighter.armContainer.y = -55;
        fighter.armContainer.angle = 0;
        fighter.kickLeg.x = 14 * fighter.facing;
        fighter.kickLeg.y = -15;
        fighter.kickLeg.angle = 0;
        fighter.kickLeg.setVisible(false);
        fighter.legLeft.setVisible(true);
    }

    // ───────── 主循环 ─────────
    update() {
        if (this.gameState.isGameOver || !this.gameState.isRoundActive) return;
        this.processMovement(this.fighter1, this.keysP1);
        this.processMovement(this.fighter2, this.keysP2);
        this.autoFacing();
        this.checkAllAttacks();
        this.refreshUI();
    }

    processMovement(fighter, keys) {
        const body     = fighter.body;
        const onGround = fighter.isOnGround();
        const canMove  = fighter.attackState === 'idle' && !fighter.isHit;

        if (keys.left.isDown && canMove) {
            body.setVelocityX(-GAME_CONFIG.playerSpeed);
        } else if (keys.right.isDown && canMove) {
            body.setVelocityX(GAME_CONFIG.playerSpeed);
        } else if (!fighter.isHit && fighter.attackType !== 'rising') {
            body.setVelocityX(body.velocity.x * 0.78);
        }

        if (keys.up.isDown && onGround && canMove) {
            body.setVelocityY(GAME_CONFIG.jumpForce);
        }

        // 防御只在地面
        const wantBlock = keys.block.isDown && onGround && canMove;
        fighter.setBlockVisual(wantBlock);
    }

    autoFacing() {
        const f1dir = this.fighter1.x < this.fighter2.x ? 1 : -1;
        if (this.fighter1.attackState === 'idle') this.fighter1.updateFacing(f1dir);
        if (this.fighter2.attackState === 'idle') this.fighter2.updateFacing(-f1dir);
    }

    // ───────── 攻击判定 ─────────
    checkAllAttacks() {
        this._checkHit(this.fighter1, this.fighter2);
        this._checkHit(this.fighter2, this.fighter1);
    }

    _checkHit(attacker, target) {
        const type = attacker.attackType;
        if (!type || attacker.attackState !== type + '_active') return;
        if (attacker.hitRegistered || target.isDead) return;

        const cfg = GAME_CONFIG.attack[type];
        const dx  = Math.abs(attacker.x - target.x);
        const dy  = attacker.y - target.y; // 正值=攻击者比目标低

        if (dx > cfg.range) return;

        // 飞脚向下攻击：攻击者需要在目标上方（dy < 0）
        if (type === 'airkick') {
            // dy < 0 表示 attacker.y < target.y，即攻击者在目标上方
            if (dy > 20)  return; // 攻击者不能比目标低太多
            if (dy < -cfg.rangeY) return;
        } else if (type === 'rising') {
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
            this.spawnBlockEffect(target.x, target.y - 50);
        } else {
            target.isHit = true;
            target.attackState  = 'idle';
            target.hitRegistered = false;

            // 击退方向
            const kbX = cfg.knockback * attacker.facing;
            let   kbY = -120;
            if (type === 'airkick')  kbY = 250;   // 飞脚向下砸
            if (type === 'kick')     kbY = -200;
            if (type === 'rising')   kbY = -350;
            if (type === 'airpunch') kbY = -80;

            target.body.setVelocityX(kbX);
            target.body.setVelocityY(kbY);

            target.showHitFlash();
            this.playHitstunAnim(target, type);

            // 命中特效
            this.spawnHitSpark(target.x, target.y - 50, cfg.hitColor, type);

            this.time.delayedCall(cfg.hitstun, () => {
                target.isHit = false;
                if (target.health <= 0 && !target.isDead) {
                    this.triggerKO(target, attacker);
                }
            });
        }

        target.health = Math.max(0, target.health - dmg);

        // 怒气
        const rageAmt = (type === 'rising') ? GAME_CONFIG.rage.onRising
                      : (type.startsWith('air')) ? GAME_CONFIG.rage.onAirHit
                      : (type === 'kick') ? GAME_CONFIG.rage.onKick
                      : GAME_CONFIG.rage.onHit;
        this.addRage(attacker, rageAmt);
        this.addRage(target, GAME_CONFIG.rage.onGetHit);

        this.spawnDamageNumber(target.x, target.y - 95, dmg, type, target.isBlocking && target.isOnGround());
    }

    playHitstunAnim(target, type) {
        const angle = type === 'rising' ? target.facing * -25 : target.facing * -12;
        this.tweens.add({
            targets: [target.torso, target.head],
            angle,
            duration: 80,
            yoyo: true,
            ease: 'Power2'
        });
    }

    // ───────── 特效 ─────────

    // 升龙火焰
    _spawnRisingFlame(fighter) {
        for (let i = 0; i < 10; i++) {
            this.time.delayedCall(i * 30, () => {
                if (!fighter || fighter.isDead) return;
                const fx = fighter.x + Phaser.Math.Between(-12, 12);
                const fy = fighter.y - Phaser.Math.Between(0, 60);
                const flame = this.add.circle(fx, fy, Phaser.Math.Between(6, 16), 0xff7700, 0.85);
                this.tweens.add({
                    targets: flame,
                    y: fy - 40,
                    alpha: 0,
                    scaleX: 1.5, scaleY: 1.5,
                    duration: 280,
                    onComplete: () => flame.destroy()
                });
            });
        }
    }

    spawnHitSpark(x, y, color, type) {
        const size = (type === 'rising' || type === 'airkick') ? 28 : 18;
        const spark = this.add.circle(x, y, size, color, 0.9);
        this.tweens.add({
            targets: spark,
            scale: 2.5, alpha: 0,
            duration: 220,
            ease: 'Power2',
            onComplete: () => spark.destroy()
        });

        // 星射线
        const count = (type === 'rising') ? 8 : 5;
        for (let i = 0; i < count; i++) {
            const angle = (i / count) * Math.PI * 2;
            const dist  = Phaser.Math.Between(25, 50);
            const star  = this.add.circle(x, y, 3, color, 0.8);
            this.tweens.add({
                targets: star,
                x: x + Math.cos(angle) * dist,
                y: y + Math.sin(angle) * dist,
                alpha: 0, scale: 0,
                duration: 280,
                onComplete: () => star.destroy()
            });
        }
    }

    spawnBlockEffect(x, y) {
        for (let i = 0; i < 5; i++) {
            const angle = Phaser.Math.DegToRad(Phaser.Math.Between(0, 360));
            const dist  = Phaser.Math.Between(20, 45);
            const star  = this.add.circle(x, y, 4, 0x88ccff, 0.9);
            this.tweens.add({
                targets: star,
                x: x + Math.cos(angle) * dist,
                y: y + Math.sin(angle) * dist,
                alpha: 0, scale: 0,
                duration: 280,
                onComplete: () => star.destroy()
            });
        }
    }

    spawnDamageNumber(x, y, dmg, type, blocked) {
        const colorMap = {
            punch: '#ffdd44', kick: '#ff6633',
            rising: '#ff9900', airpunch: '#88ffee', airkick: '#ff44aa',
        };
        const sizeMap  = {
            punch: '22px', kick: '28px',
            rising: '34px', airpunch: '24px', airkick: '30px',
        };
        const color  = blocked ? '#aaaaaa' : (colorMap[type] || '#ffffff');
        const size   = blocked ? '18px' : (sizeMap[type] || '22px');
        const suffix = type === 'rising' ? '!!!' : (type === 'airkick' ? '!!' : (type === 'kick' ? '!' : ''));
        const label  = blocked ? `${dmg} BLOCK` : `${dmg}${suffix}`;

        const txt = this.add.text(
            x + Phaser.Math.Between(-12, 12), y, label, {
                fontSize: size, fontStyle: 'bold',
                color, stroke: '#000000', strokeThickness: 4
            }
        ).setOrigin(0.5);

        this.tweens.add({
            targets: txt,
            y: y - 60, alpha: 0,
            scaleX: 1.4, scaleY: 1.4,
            duration: 750, ease: 'Power2',
            onComplete: () => txt.destroy()
        });
    }

    spawnSkillName(x, y, type) {
        const name = ATTACK_NAMES[type];
        if (!name || type === 'punch' || type === 'kick') return; // 普通技不显示
        const colorMap = { rising: '#ff9900', airpunch: '#88ffee', airkick: '#ff44aa' };
        const txt = this.add.text(x, y, name, {
            fontSize: '20px', fontStyle: 'bold',
            color: colorMap[type] || '#ffffff',
            stroke: '#000000', strokeThickness: 3,
        }).setOrigin(0.5);

        this.tweens.add({
            targets: txt,
            y: y - 30, alpha: 0,
            duration: 700, ease: 'Power2',
            onComplete: () => txt.destroy()
        });
    }

    // ───────── KO ─────────
    triggerKO(loser, winner) {
        if (loser.isDead) return;
        loser.isDead = true;
        this.gameState.isRoundActive = false;

        this.tweens.add({
            targets: loser.container,
            angle: loser.facing * -90,
            y: loser.y + 10,
            duration: 350, ease: 'Power2'
        });

        this.gameState.scores[winner.playerId]++;
        this.updateWinMarks();
        this.showRoundResult(`${winner.playerId === 'p1' ? 'P1' : 'P2'} KO WIN!`, true);
    }

    // ───────── UI ─────────
    createUI() {
        const cx   = GAME_CONFIG.width / 2;
        const barW = 340, barH = 26, gap = 55;

        this.ui_p1hp = this._makeBar(cx - gap - barW, 18, barW, barH, 0xff3355, 'left');
        this.ui_p2hp = this._makeBar(cx + gap,        18, barW, barH, 0x3388ff, 'right');

        this.add.text(cx - gap - barW - 8, 18 + barH / 2, 'P1', { fontSize: '20px', fontStyle: 'bold', color: '#ff3355' }).setOrigin(1, 0.5);
        this.add.text(cx + gap + barW + 8, 18 + barH / 2, 'P2', { fontSize: '20px', fontStyle: 'bold', color: '#3388ff' }).setOrigin(0, 0.5);

        this.timerText = this.add.text(cx, 22, '60', {
            fontSize: '38px', fontStyle: 'bold',
            color: '#ffffff', stroke: '#000000', strokeThickness: 5
        }).setOrigin(0.5, 0);

        this.scoreText = this.add.text(cx, 8, '0  -  0', {
            fontSize: '18px', fontStyle: 'bold',
            color: '#ffcc00', stroke: '#000000', strokeThickness: 3
        }).setOrigin(0.5, 0);

        this.roundText = this.add.text(cx, 64, `ROUND ${this.gameState.round}`, {
            fontSize: '15px', color: '#aaaaaa'
        }).setOrigin(0.5, 0);

        this.p1marks = this._makeWinMarks(28,                      18, 'left',  0xff3355);
        this.p2marks = this._makeWinMarks(GAME_CONFIG.width - 28,  18, 'right', 0x3388ff);

        const rageY = GAME_CONFIG.height - 38;
        this.ui_p1rage = this._makeRageBar(28,                            rageY, 280, 16, 0xffaa00, 'P1 怒气', 'left');
        this.ui_p2rage = this._makeRageBar(GAME_CONFIG.width - 28 - 280,  rageY, 280, 16, 0xffaa00, 'P2 怒气', 'right');

        this.add.text(cx, GAME_CONFIG.height - 18,
            'P1: WASD移动 · J拳 · W+J升龙拳 · K踢 · F防御 · 空中J飞拳 · 空中K飞脚    P2: 方向键 · Num1拳 · ↑+Num1升龙 · Num2踢 · Num0防御', {
            fontSize: '10px', color: '#665588', align: 'center'
        }).setOrigin(0.5, 1);
    }

    _makeBar(x, y, w, h, color, align) {
        const con = this.add.container(x, y);
        const bg  = this.add.graphics();
        bg.fillStyle(0x111111, 0.85);
        bg.fillRoundedRect(0, 0, w, h, 4);
        bg.lineStyle(2, 0x444444, 0.9);
        bg.strokeRoundedRect(0, 0, w, h, 4);
        con.add(bg);

        const warnFill = this.add.graphics();
        con.add(warnFill);
        const fill = this.add.graphics();
        fill.fillStyle(color, 1);
        fill.fillRoundedRect(2, 2, w - 4, h - 4, 2);
        con.add(fill);

        const txt = this.add.text(
            align === 'left' ? 8 : w - 8, h / 2, '100',
            { fontSize: '13px', fontStyle: 'bold', color: '#ffffff' }
        ).setOrigin(align === 'left' ? 0 : 1, 0.5);
        con.add(txt);

        return { con, fill, warnFill, txt, w, h, color, align, val: 100 };
    }

    _makeRageBar(x, y, w, h, color, label, align) {
        const con = this.add.container(x, y);
        const bg  = this.add.graphics();
        bg.fillStyle(0x111111, 0.7);
        bg.fillRoundedRect(0, 0, w, h, 3);
        con.add(bg);
        const fill = this.add.graphics();
        con.add(fill);
        const lbl = this.add.text(align === 'left' ? 0 : w, -14, label, {
            fontSize: '12px', color: '#ffcc00'
        }).setOrigin(align === 'left' ? 0 : 1, 1);
        con.add(lbl);
        return { con, fill, w, h, color, val: 0 };
    }

    _makeWinMarks(x, y, align, color) {
        const marks = [];
        for (let i = 0; i < 2; i++) {
            const mx = align === 'left' ? x + i * 22 : x - i * 22;
            const m  = this.add.circle(mx, y + 42, 7, 0x222222);
            m.setStrokeStyle(2, 0x555555);
            marks.push({ circle: m, color });
        }
        return marks;
    }

    refreshUI() {
        this._updateBar(this.ui_p1hp,   this.fighter1.health);
        this._updateBar(this.ui_p2hp,   this.fighter2.health);
        this._updateRageBar(this.ui_p1rage, this.fighter1.rage);
        this._updateRageBar(this.ui_p2rage, this.fighter2.rage);
    }

    _updateBar(bar, val) {
        const pct = val / 100;
        const fw  = Math.max(0, (bar.w - 4) * pct);
        bar.fill.clear(); bar.warnFill.clear();
        bar.fill.fillStyle(pct > 0.3 ? bar.color : 0xff2200, 1);
        if (bar.align === 'right') bar.fill.fillRoundedRect(bar.w - 2 - fw, 2, fw, bar.h - 4, 2);
        else                       bar.fill.fillRoundedRect(2, 2, fw, bar.h - 4, 2);
        bar.txt.setText(Math.ceil(val).toString());
    }

    _updateRageBar(bar, val) {
        const fw = Math.max(0, (bar.w - 4) * (val / 100));
        bar.fill.clear();
        bar.fill.fillStyle(val >= 100 ? 0xffffff : bar.color, val >= 100 ? 0.85 : 1);
        bar.fill.fillRoundedRect(2, 2, fw, bar.h - 4, 2);
    }

    updateWinMarks() {
        const s = this.gameState.scores;
        this.p1marks.forEach((m, i) => m.circle.setFillStyle(i < s.p1 ? m.color : 0x222222));
        this.p2marks.forEach((m, i) => m.circle.setFillStyle(i < s.p2 ? m.color : 0x222222));
        this.scoreText.setText(`${s.p1}  -  ${s.p2}`);
    }

    addRage(fighter, amt) {
        fighter.rage = Math.min(100, fighter.rage + amt);
    }

    // ───────── 回合控制 ─────────
    showRoundStart() {
        const cx = GAME_CONFIG.width / 2, cy = GAME_CONFIG.height / 2;

        const roundBanner = this.add.text(cx, cy - 40, `ROUND  ${this.gameState.round}`, {
            fontSize: '40px', fontStyle: 'bold',
            color: '#ffffff', stroke: '#000000', strokeThickness: 5
        }).setOrigin(0.5).setAlpha(0);

        const fightText = this.add.text(cx, cy + 30, 'FIGHT!', {
            fontSize: '72px', fontStyle: 'bold',
            color: '#ff0000', stroke: '#ffffff', strokeThickness: 5
        }).setOrigin(0.5).setAlpha(0).setScale(0.4);

        this.tweens.add({
            targets: roundBanner, alpha: 1, duration: 300,
            onComplete: () => {
                this.time.delayedCall(500, () => {
                    this.tweens.add({
                        targets: fightText, alpha: 1, scale: 1, duration: 250, ease: 'Back.Out',
                        onComplete: () => {
                            this.time.delayedCall(600, () => {
                                this.tweens.add({
                                    targets: [roundBanner, fightText], alpha: 0, duration: 300,
                                    onComplete: () => {
                                        roundBanner.destroy(); fightText.destroy();
                                        this.gameState.isRoundActive = true;
                                        this.startTimer();
                                    }
                                });
                            });
                        }
                    });
                });
            }
        });
    }

    startTimer() {
        if (this.timerEvent) this.timerEvent.remove();
        this.timerEvent = this.time.addEvent({
            delay: 1000, callback: this.tickTimer, callbackScope: this, loop: true
        });
    }

    tickTimer() {
        if (!this.gameState.isRoundActive || this.gameState.isGameOver) return;
        this.gameState.timeLeft--;
        this.timerText.setText(this.gameState.timeLeft.toString());
        if (this.gameState.timeLeft <= 10) this.timerText.setColor('#ff4444');
        if (this.gameState.timeLeft <= 0)  this.endRoundByTime();
    }

    endRoundByTime() {
        this.gameState.isRoundActive = false;
        const hp1 = this.fighter1.health, hp2 = this.fighter2.health;
        if      (hp1 > hp2) { this.gameState.scores.p1++; this.updateWinMarks(); this.showRoundResult('P1 WIN!', false); }
        else if (hp2 > hp1) { this.gameState.scores.p2++; this.updateWinMarks(); this.showRoundResult('P2 WIN!', false); }
        else                  this.showRoundResult('DRAW!', false);
    }

    showRoundResult(text, isKO) {
        const cx = GAME_CONFIG.width / 2, cy = GAME_CONFIG.height / 2;
        if (isKO) {
            const ko = this.add.text(cx, cy - 30, 'K.O.', {
                fontSize: '90px', fontStyle: 'bold',
                color: '#ff0000', stroke: '#ffffff', strokeThickness: 6
            }).setOrigin(0.5).setScale(0.3);
            this.tweens.add({ targets: ko, scale: 1, duration: 220, ease: 'Back.Out' });
        }
        const result = this.add.text(cx, cy + (isKO ? 50 : 0), text, {
            fontSize: isKO ? '42px' : '64px', fontStyle: 'bold',
            color: '#ffff00', stroke: '#000000', strokeThickness: 6
        }).setOrigin(0.5).setAlpha(0);

        this.tweens.add({
            targets: result, alpha: 1, duration: 200,
            onComplete: () => {
                this.time.delayedCall(1800, () => { result.destroy(); this.checkNextStep(); });
            }
        });
    }

    checkNextStep() {
        const s = this.gameState.scores;
        if      (s.p1 >= GAME_CONFIG.winsNeeded) this.endGame('P1 VICTORY!');
        else if (s.p2 >= GAME_CONFIG.winsNeeded) this.endGame('P2 VICTORY!');
        else                                      this.nextRound();
    }

    nextRound() {
        this.gameState.round++;
        this.gameState.timeLeft = GAME_CONFIG.roundTime;
        if (this.timerEvent) this.timerEvent.remove();
        this.timerText.setText('60').setColor('#ffffff');
        this.roundText.setText(`ROUND ${this.gameState.round}`);
        this._resetFighter(this.fighter1, 200);
        this._resetFighter(this.fighter2, GAME_CONFIG.width - 200);
        this.showRoundStart();
    }

    _resetFighter(fighter, x) {
        fighter.container.x = x;
        fighter.container.y = GAME_CONFIG.height - 70;
        fighter.container.angle = 0;
        fighter.body.setVelocity(0, 0);
        fighter.health = 100;
        fighter.rage   = 0;
        fighter.isHit  = false;
        fighter.isDead = false;
        fighter.isBlocking = false;
        fighter.attackState  = 'idle';
        fighter.attackType   = null;
        fighter.hitRegistered = false;
        this._resetPose(fighter);
        fighter.torso.setFillStyle(fighter.color);
        fighter.legLeft.setFillStyle(fighter.color);
        fighter.legRight.setFillStyle(fighter.color);
    }

    endGame(winnerText) {
        this.gameState.isGameOver = true;
        if (this.timerEvent) this.timerEvent.remove();

        const cx = GAME_CONFIG.width / 2, cy = GAME_CONFIG.height / 2;
        this.add.rectangle(cx, cy, GAME_CONFIG.width, GAME_CONFIG.height, 0x000000, 0.82);

        const victory = this.add.text(cx, cy - 60, winnerText, {
            fontSize: '72px', fontStyle: 'bold',
            color: '#ffff00', stroke: '#ff0000', strokeThickness: 7
        }).setOrigin(0.5).setAlpha(0);
        this.tweens.add({ targets: victory, alpha: 1, scale: 1.05, yoyo: true, duration: 400, repeat: -1 });

        const restart = this.add.text(cx, cy + 60, '按  R  重新开始', {
            fontSize: '30px', color: '#ffffff', stroke: '#000000', strokeThickness: 4
        }).setOrigin(0.5);
        this.tweens.add({ targets: restart, alpha: 0.3, duration: 500, yoyo: true, repeat: -1 });

        this.input.keyboard.once('keydown-R', () => this.scene.restart());
    }
}

// =============================================
// Phaser 启动
// =============================================
const config = {
    type: Phaser.AUTO,
    width: GAME_CONFIG.width,
    height: GAME_CONFIG.height,
    parent: 'game-container',
    backgroundColor: '#0a0020',
    physics: {
        default: 'arcade',
        arcade: { gravity: { y: GAME_CONFIG.gravity }, debug: false }
    },
    scene: FightScene
};

const game = new Phaser.Game(config);
