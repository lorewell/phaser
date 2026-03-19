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
        this.load.image('ball', 'https://labs.phaser.io/assets/sprites/shinyball.png');
    }

    create() {
        this.physics.world.setBoundsCollision(true, true, true, false);

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

        this.add.text(8, 8, 'ESC 返回', { fontSize: '13px', color: '#333355' });
    }

    // ==========================================
    // 【挡板 (Paddle) 逻辑】
    // ==========================================

    initPaddle() {
        this.paddle = this.add.rectangle(240, 650, this.player.hp * this.player.unitWidth, 20, 0xffffff);
        this.physics.add.existing(this.paddle);
        this.paddle.body.setImmovable(true);
        this.paddle.body.setCollideWorldBounds(true);
        this.updatePaddleVisual();
    }

    updatePaddleVisual() {
        const newWidth = this.player.hp * this.player.unitWidth;
        this.paddle.width = newWidth;
        this.paddle.body.setSize(newWidth, 20);
        this.paddle.setFillStyle(this.player.hp <= 1 ? 0xff4444 : 0xffffff);
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
        this.add.rectangle(W / 2, 400, 320, 130, 0x000000, 0.82);
        this.add.text(W / 2, 380, '游 戏 结 束', {
            fontSize: '34px', color: '#ff4444', fontStyle: 'bold',
        }).setOrigin(0.5);
        this.add.text(W / 2, 425, '点击或按任意键返回菜单', {
            fontSize: '16px', color: '#778899',
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
        const brick = this.add.rectangle(x, y, 60, 25, 0x999999);
        this.physics.add.existing(brick, true);
        brick.setData('type', type);

        if (type === 'normal') {
            brick.setData('hp', 1 * this.hpMultiplier);
            brick.setFillStyle(0x888888);
        } else if (type === 'armored') {
            brick.setData('hp', 3 * this.hpMultiplier);
            brick.setStrokeStyle(2, 0xffffff);
            brick.setFillStyle(0xaaaaaa);
        } else if (type === 'explosive') {
            brick.setData('hp', 1 * this.hpMultiplier);
            brick.setFillStyle(0xff0000);
        } else if (type === 'ghost') {
            brick.setData('hp', 1 * this.hpMultiplier);
            brick.setData('isGhost', false);
            brick.setStrokeStyle(2, 0xffffff, 1);
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
            brick.setFillStyle(0x888888, 0);
            brick.body.enable = false;
        } else {
            brick.setFillStyle(0x888888, 1);
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
                if (hp === 2) brick.setStrokeStyle(0);
                if (hp === 1) brick.setFillStyle(0x888888);
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
        const bullet = this.add.rectangle(x, y, 10, 20, 0xff5500);
        this.physics.add.existing(bullet);
        this.enemyBullets.add(bullet);
        bullet.body.setVelocityY(this.bulletSpeed);
    }

    // ==========================================
    // 【球 (Ball) 逻辑】
    // ==========================================

    initBall() {
        this.ball = this.add.circle(240, 620, 10, 0xffffff);
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
        this.add.rectangle(120, btnY, 200, 80, 0x555555, 0.45)
            .setInteractive()
            .on('pointerdown', () => { this.isLeftDown = true; })
            .on('pointerup',   () => { this.isLeftDown = false; });

        this.add.rectangle(360, btnY, 200, 80, 0x555555, 0.45)
            .setInteractive()
            .on('pointerdown', () => { this.isRightDown = true; })
            .on('pointerup',   () => { this.isRightDown = false; });

        this.add.text(120, btnY, '<<<', { fontSize: '32px' }).setOrigin(0.5);
        this.add.text(360, btnY, '>>>', { fontSize: '32px' }).setOrigin(0.5);
    }
}
