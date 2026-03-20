// ==========================================
// 【游戏主场景】
// ==========================================
import { loadSettings, BALL_SPEED, DIFFICULTY } from '../settings.js';

export default class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
    }

    init() {
        this.player       = { hp: 2, maxHp: 5, unitWidth: 60 };
        this.isLeftDown   = false;
        this.isRightDown  = false;
        this.ballLaunched = false;

        // 读取设置并转换为运行时参数
        const s = loadSettings();
        this.ballSpeedCfg = BALL_SPEED[s.ballSpeed]   || BALL_SPEED.normal;
        const diff        = DIFFICULTY[s.difficulty]  || DIFFICULTY.normal;
        this.bulletSpeed  = diff.bulletSpeed;
        this.hpMultiplier = diff.hpMultiplier;
        this.debugMode    = s.debug === 'on';
    }

    preload() {
        // 像素风格使用几何图形，无需加载外部图片资源
    }

    create() {
        this.physics.world.setBoundsCollision(true, true, true, false);

        this.addBackground();
        this.initPaddle();
        this.initBricks();
        this.initBall();
        this.enemyBullets = this.physics.add.group();

        // 调试模式
        if (this.debugMode) {
            this.physics.world.createDebugGraphic();
            this.physics.world.drawDebug = true;
        }

        // 输入
        if (this.sys.game.device.input.touch) {
            this.createMobileControls();
        } else {
            this.cursors = this.input.keyboard.createCursorKeys();
            this.keys    = this.input.keyboard.addKeys('A,D,SPACE');
        }

        // 碰撞
        this.physics.add.collider(this.ball, this.paddle, this.handlePaddleHit, null, this);
        this.physics.add.collider(this.ball, this.bricks, this.handleBrickHit, null, this);
        this.physics.add.overlap(this.paddle, this.enemyBullets, (p, bullet) => {
            bullet.destroy();
            this.damagePlayer();
        }, null, this);

        // ESC 返回菜单
        this.input.keyboard.on('keydown-ESC', () => this.scene.start('MenuScene'));

        this.add.text(8, 8, 'ESC 返回', { fontSize: '12px', color: '#00ffcc' });
        this.addScanlines();
    }

    // ==========================================    // 》像素风背景与特效《
    // ==========================================

    addBackground() {
        const W = this.scale.width;
        const H = this.scale.height;
        this.add.rectangle(W / 2, H / 2, W, H, 0x000000);
        const g = this.add.graphics();
        g.lineStyle(1, 0x0a0a22, 0.5);
        for (let x = 0; x <= W; x += 16) g.lineBetween(x, 0, x, H * 0.68);
        for (let y = 0; y <= H * 0.68; y += 16) g.lineBetween(0, y, W, y);
    }

    addScanlines() {
        const W = this.scale.width;
        const H = this.scale.height;
        const g = this.add.graphics();
        for (let y = 0; y < H; y += 4) {
            g.fillStyle(0x000000, 0.12);
            g.fillRect(0, y, W, 2);
        }
    }

    // ==========================================    // 【挡板 (Paddle) 逻辑】
    // ==========================================

    initPaddle() {
        this.paddle = this.add.rectangle(240, 650, this.player.hp * this.player.unitWidth, 20, 0x00ddcc);
        this.physics.add.existing(this.paddle);
        this.paddle.body.setImmovable(true);
        this.paddle.body.setCollideWorldBounds(true);
        this.updatePaddleVisual();
    }

    updatePaddleVisual() {
        const newWidth = this.player.hp * this.player.unitWidth;
        this.paddle.width = newWidth;
        this.paddle.body.setSize(newWidth, 20);
        this.paddle.setFillStyle(this.player.hp <= 1 ? 0xff2244 : 0x00ddcc);
    }

    damagePlayer() {
        this.player.hp--;
        if (this.player.hp <= 0) {
            this.physics.pause();
            this.showGameOver();
        } else {
            this.cameras.main.shake(200, 0.02);
            this.updatePaddleVisual();
        }
    }

    showGameOver() {
        const W = this.scale.width;
        // 像素风 Game Over 面板
        this.add.rectangle(W / 2 + 5, 405, 320, 140, 0x000000, 1);
        this.add.rectangle(W / 2, 400, 320, 140, 0x000000, 1)
            .setStrokeStyle(3, 0xff2244, 1);
        this.add.text(W / 2, 378, '游 戏 结 束', {
            fontSize: '34px', color: '#ff2244', fontStyle: 'bold',
            shadow: { x: 3, y: 3, color: '#660000', blur: 0, fill: true },
        }).setOrigin(0.5);
        this.add.text(W / 2, 425, '点击或按任意键返回菜单', {
            fontSize: '14px', color: '#00ffcc',
        }).setOrigin(0.5);
        this.input.once('pointerdown', () => this.scene.start('MenuScene'));
        this.input.keyboard.once('keydown', () => this.scene.start('MenuScene'));
    }

    // ==========================================
    // 【砖块 (Brick) 逻辑】
    // ==========================================

    initBricks() {
        this.bricks = this.physics.add.staticGroup();
        const types = ['normal', 'armored', 'explosive', 'ghost', 'normal'];
        for (let row = 0; row < 5; row++) {
            for (let col = 0; col < 6; col++) {
                this.createBrickByType(65 + col * 70, 100 + row * 40, types[row]);
            }
        }
    }

    createBrickByType(x, y, type) {
        const brick = this.add.rectangle(x, y, 60, 25, 0x000000);
        this.physics.add.existing(brick, true);
        brick.setData('type', type);

        if (type === 'normal') {
            brick.setData('hp', 1 * this.hpMultiplier);
            brick.setFillStyle(0x2255bb);
            brick.setStrokeStyle(1, 0x4488ff, 1);
        } else if (type === 'armored') {
            brick.setData('hp', 3 * this.hpMultiplier);
            brick.setStrokeStyle(2, 0x00ffcc);
            brick.setFillStyle(0x446688);
        } else if (type === 'explosive') {
            brick.setData('hp', 1 * this.hpMultiplier);
            brick.setFillStyle(0xff2244);
            brick.setStrokeStyle(1, 0xff8800, 1);
        } else if (type === 'ghost') {
            brick.setData('hp', 1 * this.hpMultiplier);
            brick.setData('isGhost', false);
            brick.setFillStyle(0x220044, 0.6);
            brick.setStrokeStyle(2, 0xaa44ff, 1);
            this.time.addEvent({
                delay: 3000,
                callback: () => this.toggleGhost(brick),
                loop: true,
            });
        }

        this.bricks.add(brick);
    }

    toggleGhost(brick) {
        if (!brick.active) return;
        const isGhost = !brick.getData('isGhost');
        brick.setData('isGhost', isGhost);
        if (isGhost) {
            brick.setFillStyle(0xaa44ff, 0.15);
            brick.setStrokeStyle(1, 0x660088, 0.4);
            brick.body.enable = false;
        } else {
            brick.setFillStyle(0x220044, 0.6);
            brick.setStrokeStyle(2, 0xaa44ff, 1);
            brick.body.enable = true;
        }
    }

    handleBrickHit(ball, brick) {
        if (!brick.active) return;
        const type = brick.getData('type');
        const hp   = brick.getData('hp') - 1;
        brick.setData('hp', hp);

        if (hp > 0) {
            if (type === 'armored') {
                if (hp === 2) brick.setStrokeStyle(1, 0x004433, 1);
                if (hp === 1) brick.setFillStyle(0x223344);
            }
        } else {
            if (type === 'explosive') this.spawnBullet(brick.x, brick.y);
            brick.destroy();
        }

        if (this.bricks.countActive() === 0) {
            // TODO: 波次清除 → 进入升级选择，暂时返回菜单占位
            this.scene.start('MenuScene');
        }
    }

    spawnBullet(x, y) {
        const bullet = this.add.rectangle(x, y, 8, 16, 0xff6600);
        this.physics.add.existing(bullet);
        bullet.setStrokeStyle(1, 0xffaa00, 1);
        this.enemyBullets.add(bullet);
        bullet.body.setVelocityY(this.bulletSpeed);
    }

    // ==========================================
    // 【球 (Ball) 逻辑】
    // ==========================================

    initBall() {
        this.ball = this.add.rectangle(240, 620, 12, 12, 0xffee00);
        this.physics.add.existing(this.ball);
        this.ball.body.setCollideWorldBounds(true).setBounce(1, 1);
    }

    handlePaddleHit(ball, paddle) {
        ball.body.setVelocityX(10 * (ball.x - paddle.x));
    }

    launchBall() {
        if (!this.ballLaunched) {
            this.ballLaunched = true;
            this.ball.body.setVelocity(this.ballSpeedCfg.vx, this.ballSpeedCfg.vy);
        }
    }

    resetBall() {
        this.ballLaunched = false;
        this.ball.setPosition(this.paddle.x, 620);
        this.ball.body.setVelocity(0, 0);
    }

    // ==========================================
    // 【Update 循环】
    // ==========================================

    update() {
        const paddleSpeed = 500;
        let moveDirection = 0;

        if (this.sys.game.device.input.touch) {
            if (this.isLeftDown)       moveDirection = -1;
            else if (this.isRightDown) moveDirection =  1;
        } else {
            if (this.cursors.left.isDown  || this.keys.A.isDown) moveDirection = -1;
            else if (this.cursors.right.isDown || this.keys.D.isDown) moveDirection = 1;

            if (Phaser.Input.Keyboard.JustDown(this.keys.SPACE)) this.launchBall();
        }

        this.paddle.body.setVelocityX(moveDirection * paddleSpeed);

        if (moveDirection !== 0 && !this.ballLaunched) this.launchBall();

        // 球落底
        if (this.ball.y > 800) {
            this.damagePlayer();
            this.resetBall();
        }

        // 清理越界子弹
        this.enemyBullets.children.iterate(child => {
            if (child && child.y > 800) child.destroy();
        });
    }

    // ==========================================
    // 【移动端控制】
    // ==========================================

    createMobileControls() {
        const btnY = 740;
        const lBtn = this.add.rectangle(120, btnY, 200, 80, 0x000000, 0.75)
            .setStrokeStyle(2, 0x00ffcc, 1)
            .setInteractive();
        lBtn.on('pointerdown', () => { this.isLeftDown = true;  lBtn.setFillStyle(0x003322, 0.9); });
        lBtn.on('pointerup',   () => { this.isLeftDown = false; lBtn.setFillStyle(0x000000, 0.75); });
        lBtn.on('pointerout',  () => { this.isLeftDown = false; lBtn.setFillStyle(0x000000, 0.75); });

        const rBtn = this.add.rectangle(360, btnY, 200, 80, 0x000000, 0.75)
            .setStrokeStyle(2, 0x00ffcc, 1)
            .setInteractive();
        rBtn.on('pointerdown', () => { this.isRightDown = true;  rBtn.setFillStyle(0x003322, 0.9); });
        rBtn.on('pointerup',   () => { this.isRightDown = false; rBtn.setFillStyle(0x000000, 0.75); });
        rBtn.on('pointerout',  () => { this.isRightDown = false; rBtn.setFillStyle(0x000000, 0.75); });

        this.add.text(120, btnY, '◄◄', { fontSize: '30px', color: '#00ffcc' }).setOrigin(0.5);
        this.add.text(360, btnY, '►►', { fontSize: '30px', color: '#00ffcc' }).setOrigin(0.5);
    }
}
