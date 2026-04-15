// ==========================================
// 【游戏主场景】v0.4 - Combo + 道具系统 + 粘球瞄准 + 视觉增强
// ==========================================
import { loadSettings, BALL_SPEED, DIFFICULTY } from '../settings.js';

// ──────────────────────────────────────────
// 道具库（击杀砖块概率掉落，时效性buff）
// ──────────────────────────────────────────
const POWERUPS = [
    {
        id: 'expand',
        name: '扩展',
        icon: '⇔',
        color: 0x00ff88,
        duration: 12000,
        apply(scene) {
            scene.player.unitWidth = Math.min(scene.player.unitWidth + 60, 200);
            scene.updatePaddleVisual();
            scene.hudPowerupIcon = scene.add.text(scene.scale.width / 2 - 40, 20, POWERUPS[0].icon, {
                fontSize: '20px', color: '#00ff88'
            }).setDepth(25);
        },
        remove(scene) {
            scene.player.unitWidth = Math.max(scene.player.unitWidth - 60, 80);
            scene.updatePaddleVisual();
        }
    },
    {
        id: 'multiball',
        name: '多球',
        icon: '◉◉',
        color: 0xaa44ff,
        duration: 0, // 永久到球丢失
        apply(scene) {
            if (scene.ballLaunched && scene.mainBall) {
                for (let i = 0; i < 2; i++) {
                    scene.spawnExtraBall(scene.mainBall);
                }
            }
            scene.hudPowerupIcon = scene.add.text(scene.scale.width / 2 - 40, 20, POWERUPS[1].icon, {
                fontSize: '20px', color: '#aa44ff'
            }).setDepth(25);
        },
        remove(scene) {}
    },
    {
        id: 'slow',
        name: '减速',
        icon: '◷',
        color: 0x44aaff,
        duration: 10000,
        apply(scene) {
            scene.applyBallSpeedMult(0.5);
            scene.hudPowerupIcon = scene.add.text(scene.scale.width / 2 - 40, 20, POWERUPS[2].icon, {
                fontSize: '20px', color: '#44aaff'
            }).setDepth(25);
        },
        remove(scene) {
            scene.applyBallSpeedMult(2);
        }
    },
    {
        id: 'fireball',
        name: '火球',
        icon: '🔥',
        color: 0xff4400,
        duration: 8000,
        apply(scene) {
            scene.buffs.fireball = true;
            if (scene.mainBall) {
                scene.mainBall.setFillStyle(0xff4400);
            }
            scene.hudPowerupIcon = scene.add.text(scene.scale.width / 2 - 40, 20, POWERUPS[3].icon, {
                fontSize: '20px', color: '#ff4400'
            }).setDepth(25);
        },
        remove(scene) {
            scene.buffs.fireball = false;
            if (scene.mainBall) {
                scene.mainBall.setFillStyle(0xffee00);
            }
        }
    },
];

// ──────────────────────────────────────────
// 圣遗物库（从砖块小概率掉落，永久生效）
// ──────────────────────────────────────────
const RELICS = [
    {
        id: 'time_shard',
        name: '时间碎片',
        icon: '⏱',
        color: 0x44aaff,
        desc: '漏球时球以50%速度弹回（每波一次）',
    },
    {
        id: 'energy_core',
        name: '能量核心',
        icon: '⚡',
        color: 0xffee00,
        desc: '每波开始时随机炸掉2块砖',
    },
    {
        id: 'void_rift',
        name: '虚空裂隙',
        icon: '🌀',
        color: 0xaa44ff,
        desc: '球穿过砖块时15%概率无视碰撞',
    },
    {
        id: 'death_pact',
        name: '死亡契约',
        icon: '💀',
        color: 0xff2244,
        desc: '初始血-1，但每波三选四',
    },
    {
        id: 'gravity_lens',
        name: '引力透镜',
        icon: '🧲',
        color: 0xff8800,
        desc: '球靠近挡板时轻微被吸引',
    },
];

// ──────────────────────────────────────────
// Buff 库（12个永久强化，3条隐性流派联动）
// ──────────────────────────────────────────
// 流派标签：MULTI=多球系  LASER=激光系  POWER=强击系  GENERAL=通用
const BUFF_POOL = [
    // ── 多球系 ──────────────────────────────
    {
        id: 'chaos_core',
        tag: 'MULTI',
        name: '混沌核心',
        desc: '撞挡板时25%概率分裂新球（可叠，最多5球）',
        icon: '◉', color: 0xaa44ff,
        stackable: true,
        maxStacks: 3,
        apply(scene) {
            scene.buffs.chaosCore = (scene.buffs.chaosCore || 0) + 1;
        },
    },
    {
        id: 'wormhole',
        tag: 'MULTI',
        name: '虫洞弹射',
        desc: '新球速度比母球快20%',
        icon: '◎', color: 0x8844ff,
        stackable: false,
        apply(scene) {
            scene.buffs.wormhole = true;
        },
    },
    {
        id: 'resonance',
        tag: 'MULTI',
        name: '磁场共振',
        desc: '场上球数≥3时伤害翻倍',
        icon: '⊕', color: 0xdd66ff,
        stackable: false,
        apply(scene) {
            scene.buffs.resonance = true;
        },
    },
    // ── 激光系 ──────────────────────────────
    {
        id: 'laser_mount',
        tag: 'LASER',
        name: '激光炮台',
        desc: '每4s自动发射激光（可叠，叠一次缩到2.5s）',
        icon: '▲', color: 0xff6600,
        stackable: true,
        maxStacks: 3,
        apply(scene) {
            scene.buffs.laserMount = (scene.buffs.laserMount || 0) + 1;
            if (!scene.laserTimer || !scene.laserTimer.active) {
                scene.startLaserTimer();
            }
        },
    },
    {
        id: 'plasma_pierce',
        tag: 'LASER',
        name: '等离子穿透',
        desc: '激光穿透第一个砖块继续前进（需激光炮台）',
        icon: '▬', color: 0xff4400,
        stackable: false,
        requires: 'laserMount',
        apply(scene) {
            scene.buffs.plasmaPierce = true;
        },
    },
    {
        id: 'overload_splash',
        tag: 'LASER',
        name: '超载放电',
        desc: '激光命中时对周围1格内砖块溅射1点伤害',
        icon: '✦', color: 0xff9900,
        stackable: false,
        requires: 'laserMount',
        apply(scene) {
            scene.buffs.overloadSplash = true;
        },
    },
    // ── 强击系 ──────────────────────────────
    {
        id: 'armor_pierce',
        tag: 'POWER',
        name: '穿甲弹头',
        desc: '球伤害+1（可叠到5）',
        icon: '★', color: 0xff8800,
        stackable: true,
        maxStacks: 5,
        apply(scene) {
            scene.buffs.armorPierce = Math.min((scene.buffs.armorPierce || 0) + 1, 5);
        },
    },
    {
        id: 'overclock',
        tag: 'POWER',
        name: '超频驱动',
        desc: '球速×1.25（可叠，每次+15%，上限×2）',
        icon: '⚡', color: 0xffee00,
        stackable: true,
        maxStacks: 4,
        apply(scene) {
            scene.buffs.overclock = Math.min((scene.buffs.overclock || 1) + 1, 4);
            const mult = 1 + scene.buffs.overclock * 0.15;
            scene.applyBallSpeedMult(mult);
        },
    },
    {
        id: 'bounce_accel',
        tag: 'POWER',
        name: '反弹加速',
        desc: '每次弹板球速再+8%（本局累积）',
        icon: '↗', color: 0xffcc00,
        stackable: true,
        maxStacks: 8,
        apply(scene) {
            scene.buffs.bounceAccel = (scene.buffs.bounceAccel || 0) + 1;
        },
    },
    {
        id: 'paddle_grow',
        tag: 'POWER',
        name: '磁力延展',
        desc: '挡板宽度+50（上限180）',
        icon: '↔', color: 0x00ffcc,
        stackable: true,
        maxStacks: 3,
        apply(scene) {
            scene.player.unitWidth = Math.min(scene.player.unitWidth + 50, 180);
            scene.updatePaddleVisual();
        },
    },
    // ── 通用 ────────────────────────────────
    {
        id: 'chain_burst',
        tag: 'GENERAL',
        name: '爆裂连锁',
        desc: '自爆砖块爆炸范围扩大，波及周围砖块各扣1血',
        icon: '💥', color: 0xff3300,
        stackable: false,
        apply(scene) {
            scene.buffs.chainBurst = true;
        },
    },
    {
        id: 'overdrive',
        tag: 'GENERAL',
        name: '过载协议',
        desc: '每清除20块砖额外获得一次小Buff抽取',
        icon: '⊗', color: 0x44ffaa,
        stackable: false,
        apply(scene) {
            scene.buffs.overdrive = true;
        },
    },
];

// 流派显示配置
const TAG_CONFIG = {
    MULTI:   { label: '多球系', color: '#aa44ff' },
    LASER:   { label: '激光系', color: '#ff6600' },
    POWER:   { label: '强击系', color: '#ff8800' },
    GENERAL: { label: '通用',   color: '#44ffaa' },
};

// ──────────────────────────────────────────
// 游戏主场景
// ──────────────────────────────────────────
export default class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
    }

    init() {
        // 玩家状态
        this.player = {
            hp:        3,
            maxHp:     5,
            unitWidth: 80,
        };
        // Buff 状态
        this.buffs = {};
        // 圣遗物状态
        this.relics = {};
        // 游戏进程
        this.wave          = 1;
        this.score         = 0;
        this.bricksKilled  = 0;
        this.extraPick     = 0;
        this.isLeftDown    = false;
        this.isRightDown   = false;
        this.ballLaunched  = false;
        this.gameState     = 'PLAYING';
        this.timeShardUsed = false;

        // 激光定时器
        this.laserTimer = null;

        // 读取设置
        const s = loadSettings();
        this.ballSpeedCfg = BALL_SPEED[s.ballSpeed]   || BALL_SPEED.normal;
        const diff         = DIFFICULTY[s.difficulty] || DIFFICULTY.normal;
        this.bulletSpeed   = diff.bulletSpeed;
        this.hpMultiplier  = diff.hpMultiplier;
        this.debugMode     = s.debug === 'on';

        // 连击系统
        this.combo = 0;
        this.comboTimer = null;
        this.maxCombo = 0;

        // 道具状态
        this.activePowerups = {};
        this.hudPowerupIcon = null;
        this.powerupTimers = [];

        // 粘球瞄准
        this.isStickyHold = false;
        this.aimAngle = -Math.PI / 2;

        // 死亡契约
        if (this.relics.death_pact) this.player.hp = Math.max(1, this.player.hp - 1);
    }

    preload() {}

    create() {
        this.physics.world.setBoundsCollision(true, true, true, false);

        this.addBackground();
        this.initPaddle();
        this.initBricks();
        this.balls        = this.physics.add.group();
        this.enemyBullets = this.physics.add.group();
        this.lasers       = this.physics.add.group();
        this.relicDrops   = this.physics.add.group();
        this.powerups     = this.physics.add.group();

        this.initBall();

        // 创建瞄准线
        this.aimLine = this.add.graphics().setDepth(5);
        this.aimLine.setVisible(false);

        if (this.debugMode) {
            this.physics.world.createDebugGraphic();
            this.physics.world.drawDebug = true;
        }

        if (this.sys.game.device.input.touch) {
            this.createMobileControls();
            // 移动端点击发射
            this.input.on('pointerdown', () => {
                if (this.gameState === 'PLAYING' && !this.ballLaunched) {
                    this.launchBall();
                }
            });
        } else {
            this.cursors = this.input.keyboard.createCursorKeys();
            this.keys    = this.input.keyboard.addKeys('A,D,SPACE,Q');
        }

        // 碰撞
        this.physics.add.collider(this.balls, this.paddle, this.handlePaddleHit, null, this);
        this.physics.add.collider(this.balls, this.bricks, this.handleBrickHit,  null, this);
        this.physics.add.overlap(this.paddle, this.enemyBullets, this.handleBulletHit, null, this);
        this.physics.add.overlap(this.lasers, this.bricks,      this.handleLaserHit,  null, this);
        this.physics.add.overlap(this.paddle, this.relicDrops, this.handleRelicPickup, null, this);
        this.physics.add.overlap(this.paddle, this.powerups,   this.handlePowerupPickup, null, this);

        this.input.keyboard.on('keydown-ESC', () => this.scene.start('MenuScene'));

        this.createHUD();
        this.addScanlines();
        this.showStartTip();

        // 能量核心
        if (this.relics.energy_core) {
            this.time.delayedCall(600, () => {
                this.blowRandomBricks(2);
            });
        }

        // 启动激光
        if (this.buffs.laserMount) this.startLaserTimer();
    }

    // ──────────────────────────────────────────
    // 开始提示
    // ──────────────────────────────────────────
    showStartTip() {
        const W = this.scale.width;
        this.tipText = this.add.text(W / 2, 620, '← → 移动  |  按住空格瞄准  |  松开发射', {
            fontSize: '11px', color: '#666688', fontFamily: '"Press Start 2P", monospace'
        }).setOrigin(0.5).setDepth(25);
        this.tweens.add({
            targets: this.tipText, alpha: 0,
            duration: 3000, delay: 2000,
            onComplete: () => this.tipText.destroy()
        });
    }

    // ──────────────────────────────────────────
    // HUD
    // ──────────────────────────────────────────
    createHUD() {
        const W = this.scale.width;
        const H = this.scale.height;

        this.add.rectangle(W / 2, H - 32, W, 64, 0x000000, 0.88).setDepth(10);
        this.add.rectangle(W / 2, H - 62, W, 2, 0x00ffcc, 0.35).setDepth(10);

        this.hudWave   = this.add.text(12, H - 52, `波次 ${this.wave}`, { fontSize: '12px', color: '#ffee00', fontFamily: '"Press Start 2P", monospace' }).setDepth(11);
        this.hudScore  = this.add.text(W / 2, H - 52, `${this.score}`, { fontSize: '12px', color: '#00ffcc', fontFamily: '"Press Start 2P", monospace' }).setOrigin(0.5, 0).setDepth(11);
        this.hudHp     = this.add.text(W - 12, H - 52, '', { fontSize: '12px', color: '#ff4466', fontFamily: '"Press Start 2P", monospace' }).setOrigin(1, 0).setDepth(11);
        this.hudTags   = this.add.text(12, H - 34, '', { fontSize: '10px', color: '#aaaaaa' }).setDepth(11);
        this.hudEsc   = this.add.text(W - 12, H - 34, 'ESC', { fontSize: '10px', color: '#224433' }).setOrigin(1, 0).setDepth(11);

        // 连击显示
        this.hudCombo = this.add.text(W / 2, 380, '', {
            fontSize: '24px', color: '#ff6600', fontFamily: '"Press Start 2P", monospace',
            stroke: '#000', strokeThickness: 4
        }).setOrigin(0.5).setDepth(25).setAlpha(0);

        this.updateHUD();
    }

    updateHUD() {
        if (!this.hudWave) return;
        this.hudWave.setText(`波次 ${this.wave}`);
        this.hudScore.setText(`${this.score}`);
        this.hudHp.setText('♥'.repeat(this.player.hp) + '♡'.repeat(Math.max(0, this.player.maxHp - this.player.hp)));
        this.hudTags.setText(this.getActiveTags());
    }

    getActiveTags() {
        const tags = [];
        if (this.buffs.chaosCore)   tags.push({ tag: 'MULTI',   count: this.buffs.chaosCore });
        if (this.buffs.laserMount)  tags.push({ tag: 'LASER',   count: this.buffs.laserMount });
        if (this.buffs.armorPierce) tags.push({ tag: 'POWER',   count: this.buffs.armorPierce });
        if (this.buffs.overclock)   tags.push({ tag: 'POWER',   count: this.buffs.overclock });
        if (this.buffs.resonance)   tags.push({ tag: 'MULTI',   count: 1 });
        if (this.buffs.chainBurst)  tags.push({ tag: 'GENERAL', count: 1 });
        if (tags.length === 0) return '';
        return tags.map(t => `[${TAG_CONFIG[t.tag].label}×${t.count}]`).join(' ');
    }

    // ──────────────────────────────────────────
    // 连击系统
    // ──────────────────────────────────────────
    incrementCombo() {
        this.combo++;
        this.maxCombo = Math.max(this.maxCombo, this.combo);

        // 重置计时器
        if (this.comboTimer) this.comboTimer.remove();
        this.comboTimer = this.time.delayedCall(1500, () => {
            this.combo = 0;
            this.hudCombo.setAlpha(0);
        });

        // 连击显示
        if (this.combo >= 2) {
            const multiplier = Math.min(this.combo, 10);
            const colors = ['', '#ffff00', '#ff9900', '#ff4400', '#ff0044'];
            const color = colors[Math.min(multiplier - 1, colors.length - 1)];
            this.hudCombo.setText(`${this.combo} COMBO! ×${multiplier}`);
            this.hudCombo.setColor(color);
            this.hudCombo.setAlpha(1);
            this.hudCombo.setScale(1.2);
            this.tweens.add({
                targets: this.hudCombo, scaleX: 1, scaleY: 1,
                duration: 200, ease: 'Back.easeOut'
            });
        }
    }

    getComboMultiplier() {
        return Math.min(this.combo, 10);
    }

    // ──────────────────────────────────────────
    // 背景
    // ──────────────────────────────────────────
    addBackground() {
        const W = this.scale.width, H = this.scale.height;
        this.add.rectangle(W / 2, H / 2, W, H, 0x000000);
        const g = this.add.graphics();
        g.lineStyle(1, 0x0a0a22, 0.5);
        for (let x = 0; x <= W; x += 16) g.lineBetween(x, 0, x, H * 0.84);
        for (let y = 0; y <= H * 0.84; y += 16) g.lineBetween(0, y, W, y);
    }

    addScanlines() {
        const W = this.scale.width, H = this.scale.height;
        const g = this.add.graphics().setDepth(20);
        for (let y = 0; y < H; y += 4) {
            g.fillStyle(0x000000, 0.09);
            g.fillRect(0, y, W, 2);
        }
    }

    // ──────────────────────────────────────────
    // 挡板
    // ──────────────────────────────────────────
    initPaddle() {
        this.paddle = this.add.rectangle(240, 680, this.player.unitWidth, 16, 0x00ddcc);
        this.physics.add.existing(this.paddle);
        this.paddle.body.setImmovable(true);
        this.paddle.body.setCollideWorldBounds(true);
        this.updatePaddleVisual();
    }

    updatePaddleVisual() {
        const w = this.player.unitWidth;
        this.paddle.width = w;
        this.paddle.body.setSize(w, 16);
        this.paddle.setFillStyle(this.player.hp <= 1 ? 0xff2244 : 0x00ddcc);
    }

    damagePlayer() {
        if (this.relics.time_shard && !this.timeShardUsed) {
            this.timeShardUsed = true;
            this.cameras.main.shake(80, 0.006);
            this.flashText(this.scale.width / 2, 680, '时间碎片！', '#44aaff');
            this.resetBall();
            return;
        }

        this.player.hp--;
        this.updateHUD();
        if (this.player.hp <= 0) {
            this.gameState = 'GAMEOVER';
            this.physics.pause();
            this.showGameOver();
        } else {
            this.cameras.main.shake(200, 0.022);
            this.updatePaddleVisual();
        }
    }

    showGameOver() {
        const W = this.scale.width, H = this.scale.height;
        const panel = this.add.container(0, 0).setDepth(50);
        panel.add(this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.75));
        panel.add(this.add.rectangle(W / 2 + 5, H / 2 + 5, 340, 240, 0x000000));
        panel.add(this.add.rectangle(W / 2, H / 2, 340, 240, 0x000000).setStrokeStyle(3, 0xff2244));
        panel.add(this.add.text(W / 2, H / 2 - 75, 'GAME OVER', {
            fontSize: '26px', fontFamily: '"Press Start 2P", monospace',
            color: '#ff2244', shadow: { x: 3, y: 3, color: '#660000', blur: 0, fill: true },
        }).setOrigin(0.5));
        panel.add(this.add.text(W / 2, H / 2 - 30, `波次 ${this.wave}   得分 ${this.score}`, { fontSize: '13px', color: '#ffee00' }).setOrigin(0.5));
        panel.add(this.add.text(W / 2, H / 2 - 5, `最高连击 ${this.maxCombo}`, { fontSize: '12px', color: '#ff9900' }).setOrigin(0.5));
        panel.add(this.add.text(W / 2, H / 2 + 18, this.getActiveTags() || '无流派激活', { fontSize: '12px', color: '#aaaaaa' }).setOrigin(0.5));
        panel.add(this.add.text(W / 2, H / 2 + 50, '点击或按任意键重新开始', { fontSize: '12px', color: '#00ffcc' }).setOrigin(0.5));
        panel.add(this.add.text(W / 2, H / 2 + 75, 'ESC → 返回菜单', { fontSize: '10px', color: '#224433' }).setOrigin(0.5));
        this.input.once('pointerdown', () => this.scene.restart());
        this.input.keyboard.once('keydown', (e) => {
            if (e.keyCode === 27) this.scene.start('MenuScene');
            else this.scene.restart();
        });
    }

    // ──────────────────────────────────────────
    // 砖块
    // ──────────────────────────────────────────
    initBricks() {
        this.bricks = this.physics.add.staticGroup();
        this.spawnWave(this.wave);
    }

    spawnWave(wave) {
        if (wave === 5)  { this.spawnEliteWave(); return; }
        if (wave === 10) { this.spawnBossWave();  return; }

        const cols   = 6;
        const rows   = Math.min(3 + Math.floor(wave / 2), 8);
        const hpBase = Math.floor(wave / 3);

        const typePool = ['normal', 'normal', 'normal'];
        if (wave >= 2) typePool.push('armored');
        if (wave >= 3) typePool.push('explosive');
        if (wave >= 4) typePool.push('ghost');
        if (wave >= 6) typePool.push('armored', 'explosive', 'ghost');

        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                const type = Phaser.Math.RND.pick(typePool);
                this.createBrickByType(50 + col * 64, 70 + row * 38, type, hpBase);
            }
        }
    }

    spawnEliteWave() {
        const msg = this.add.text(this.scale.width / 2, 300, '⚔ 精英波 ⚔', {
            fontSize: '24px', fontFamily: '"Press Start 2P", monospace',
            color: '#ff3300', stroke: '#000', strokeThickness: 3,
        }).setOrigin(0.5).setDepth(30);
        this.tweens.add({ targets: msg, alpha: 0, y: 280, duration: 1200, delay: 1000, onComplete: () => msg.destroy() });

        for (let row = 0; row < 6; row++) {
            for (let col = 0; col < 6; col++) {
                const type = Phaser.Math.RND.pick(['armored', 'armored', 'explosive', 'ghost', 'normal']);
                this.createBrickByType(50 + col * 64, 70 + row * 38, type, 2);
            }
        }
    }

    spawnBossWave() {
        const msg = this.add.text(this.scale.width / 2, 300, '💀 Boss波 💀', {
            fontSize: '24px', fontFamily: '"Press Start 2P", monospace',
            color: '#ff0000', stroke: '#000', strokeThickness: 3,
        }).setOrigin(0.5).setDepth(30);
        this.tweens.add({ targets: msg, alpha: 0, y: 280, duration: 1200, delay: 1000, onComplete: () => msg.destroy() });

        const typePool = ['normal', 'normal', 'armored', 'explosive'];
        for (let row = 0; row < 7; row++) {
            for (let col = 0; col < 6; col++) {
                if (row === 3 && (col === 2 || col === 3)) continue;
                const type = Phaser.Math.RND.pick(typePool);
                this.createBrickByType(50 + col * 64, 70 + row * 38, type, 1);
            }
        }

        const boss = this.add.rectangle(240, 200, 90, 40, 0x220000);
        this.physics.add.existing(boss, true);
        boss.setData('type', 'boss');
        boss.setData('hp', 40 * this.hpMultiplier);
        boss.setData('maxHp', 40 * this.hpMultiplier);
        boss.setFillStyle(0x550000);
        boss.setStrokeStyle(3, 0xff0000, 1);
        this.bricks.add(boss);

        this.tweens.add({
            targets: boss,
            x: { from: 120, to: 360 },
            duration: 2200,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut',
        });
    }

    createBrickByType(x, y, type, hpBonus = 0) {
        const brick = this.add.rectangle(x, y, 58, 24, 0x000000);
        this.physics.add.existing(brick, true);
        brick.setData('type', type);

        if (type === 'normal') {
            const hp = (1 + hpBonus) * this.hpMultiplier;
            brick.setData('hp', hp); brick.setData('maxHp', hp);
            brick.setFillStyle(0x1144aa);
            brick.setStrokeStyle(1, 0x3377ff, 1);
        } else if (type === 'armored') {
            const hp = (3 + hpBonus) * this.hpMultiplier;
            brick.setData('hp', hp); brick.setData('maxHp', hp);
            brick.setFillStyle(0x334455);
            brick.setStrokeStyle(2, 0x88ccff, 1);
        } else if (type === 'explosive') {
            const hp = (1 + hpBonus) * this.hpMultiplier;
            brick.setData('hp', hp); brick.setData('maxHp', hp);
            brick.setFillStyle(0x882200);
            brick.setStrokeStyle(1, 0xff4400, 1);
        } else if (type === 'ghost') {
            const hp = (1 + hpBonus) * this.hpMultiplier;
            brick.setData('hp', hp); brick.setData('maxHp', hp);
            brick.setData('isGhost', false);
            brick.setFillStyle(0x1a0033, 0.8);
            brick.setStrokeStyle(2, 0xaa44ff, 1);
            this.time.addEvent({
                delay: 2000 + Math.random() * 1000,
                callback: () => this.toggleGhost(brick),
                loop: true,
            });
        } else if (type === 'boss') {
            // Boss 由 spawnBossWave 处理
        }

        this.bricks.add(brick);
        return brick;
    }

    toggleGhost(brick) {
        if (!brick || !brick.active) return;
        const isGhost = !brick.getData('isGhost');
        brick.setData('isGhost', isGhost);
        if (isGhost) {
            brick.setFillStyle(0xaa44ff, 0.1);
            brick.setStrokeStyle(1, 0x550066, 0.2);
            brick.body.enable = false;
        } else {
            brick.setFillStyle(0x1a0033, 0.8);
            brick.setStrokeStyle(2, 0xaa44ff, 1);
            brick.body.enable = true;
        }
    }

    getBallDamage() {
        let dmg = 1 + (this.buffs.armorPierce || 0);
        if (this.buffs.resonance && this.balls.countActive() >= 3) dmg *= 2;
        return dmg;
    }

    handleBrickHit(ball, brick) {
        if (!brick || !brick.active) return;

        // 虚空裂隙
        if (this.relics.void_rift && Math.random() < 0.15) return;

        const type  = brick.getData('type');
        const power = this.getBallDamage();
        const hp    = brick.getData('hp') - power;
        brick.setData('hp', hp);

        // 火球穿透
        const isFireball = this.buffs.fireball && ball === this.mainBall;
        const destroyed = hp <= 0;

        if (!isFireball || !destroyed) {
            this.hitStop(45);
        }

        this.cameras.main.shake(55, 0.005);
        this.spawnBrickParticles(brick.x, brick.y, brick.fillColor || 0x3377ff);

        // 增加连击
        this.incrementCombo();

        if (hp > 0) {
            if (type === 'armored') {
                const maxHp = brick.getData('maxHp');
                const ratio  = hp / maxHp;
                if (ratio > 0.6)      brick.setFillStyle(0x334455);
                else if (ratio > 0.3) brick.setFillStyle(0x221122);
                else                  brick.setFillStyle(0x110011);
            }
            if (type === 'boss') {
                const maxHp = brick.getData('maxHp');
                const ratio  = hp / maxHp;
                if (ratio > 0.7)      brick.setFillStyle(0x550000);
                else if (ratio > 0.4) brick.setFillStyle(0x441100);
                else                  brick.setFillStyle(0x330000);
                this.tweens.killTweensOf(brick);
                this.tweens.add({
                    targets: brick, x: brick.x + (Math.random() > 0.5 ? 12 : -12),
                    duration: 80, yoyo: true, ease: 'Quad.easeOut',
                });
            }
        } else {
            if (type === 'explosive') {
                this.spawnBullet(brick.x, brick.y);
                if (this.buffs.chainBurst) this.chainExplosion(brick.x, brick.y);
            }

            // 圣遗物掉落
            const dropRate = (type === 'boss' || this.wave === 5) ? 1.0 : 0.08;
            if (Math.random() < dropRate) this.spawnRelicDrop(brick.x, brick.y);

            // 道具掉落（15%概率）
            if (Math.random() < 0.15) this.spawnPowerupDrop(brick.x, brick.y);

            brick.destroy();
            this.bricksKilled++;
            const baseScore = type === 'armored' ? 30 : type === 'ghost' ? 25 : type === 'boss' ? 200 : 10;
            const comboMult = this.getComboMultiplier();
            this.score += baseScore * this.wave * comboMult;
            this.updateHUD();
        }

        if (this.bricks.countActive() === 0) {
            this.onWaveClear();
        }
    }

    chainExplosion(x, y) {
        this.bricks.children.iterate(brick => {
            if (!brick || !brick.active) return;
            const dx = Math.abs(brick.x - x);
            const dy = Math.abs(brick.y - y);
            if (dx <= 80 && dy <= 60 && dx + dy > 0) {
                const hp = brick.getData('hp') - 1;
                brick.setData('hp', hp);
                this.spawnBrickParticles(brick.x, brick.y, 0xff6600);
                if (hp <= 0) {
                    if (brick.getData('type') === 'explosive') this.spawnBullet(brick.x, brick.y);
                    brick.destroy();
                }
            }
        });
    }

    spawnBullet(x, y) {
        const bullet = this.add.rectangle(x, y, 8, 18, 0xff4400);
        this.physics.add.existing(bullet);
        bullet.setStrokeStyle(1, 0xff8800, 1);
        this.enemyBullets.add(bullet);
        bullet.body.setVelocityY(this.bulletSpeed + this.wave * 8);
    }

    // ──────────────────────────────────────────
    // 道具系统
    // ──────────────────────────────────────────
    spawnPowerupDrop(x, y) {
        const powerup = Phaser.Math.RND.pick(POWERUPS);
        const icon = this.add.text(x, y, powerup.icon, { fontSize: '20px' }).setOrigin(0.5).setDepth(18);
        const glow = this.add.rectangle(x, y, 26, 26, powerup.color, 0.3)
            .setStrokeStyle(2, powerup.color, 1).setDepth(17);

        this.tweens.add({ targets: icon, y: y - 6, duration: 500, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
        this.tweens.add({ targets: glow, alpha: 0.5, duration: 500, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

        const drop = this.add.rectangle(x, y, 26, 26, 0x000000, 0).setDepth(16);
        drop.setData('powerupId', powerup.id);
        this.physics.add.existing(drop, true);
        this.powerups.add(drop);

        // 5秒后自动消失
        this.time.delayedCall(5000, () => {
            if (drop.active) {
                icon.destroy();
                glow.destroy();
                drop.destroy();
            }
        });
    }

    handlePowerupPickup(paddle, drop) {
        const powerupId = drop.getData('powerupId');
        const powerup = POWERUPS.find(p => p.id === powerupId);
        if (!powerup) return;

        const x = drop.x, y = drop.y;

        // 清除同类型旧道具
        if (this.activePowerups[powerupId]) {
            if (powerup.remove) powerup.remove(this);
            if (this.powerupTimers[powerupId]) {
                this.powerupTimers[powerupId].remove();
                this.powerupTimers[powerupId] = null;
            }
        }

        // 激活新道具
        powerup.apply(this);
        this.activePowerups[powerupId] = true;

        // 掉落物特效
        this.powerups.getChildren().forEach(c => { if (c.x === x && c.y === y) c.destroy(); });
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            const p = this.add.rectangle(x, y, 4, 4, powerup.color).setDepth(22);
            this.tweens.add({
                targets: p,
                x: x + Math.cos(angle) * 30,
                y: y + Math.sin(angle) * 30,
                alpha: 0, duration: 400, ease: 'Quad.easeOut',
                onComplete: () => p.destroy(),
            });
        }

        this.flashText(x, y - 15, `${powerup.icon} ${powerup.name}！`, '#' + powerup.color.toString(16).padStart(6, '0'), 14);

        // 定时移除
        if (powerup.duration > 0) {
            this.powerupTimers[powerupId] = this.time.delayedCall(powerup.duration, () => {
                if (powerup.remove) powerup.remove(this);
                this.activePowerups[powerupId] = false;
                if (this.hudPowerupIcon) this.hudPowerupIcon.destroy();
                this.hudPowerupIcon = null;
                this.powerupTimers[powerupId] = null;
            });
        }
    }

    // ──────────────────────────────────────────
    // 圣遗物掉落与拾取
    // ──────────────────────────────────────────
    spawnRelicDrop(x, y) {
        const ownedIds = Object.keys(this.relics);
        const available = RELICS.filter(r => !this.relics[r.id]);
        if (available.length === 0) return;

        const relic = Phaser.Math.RND.pick(available);
        const icon  = this.add.text(x, y, relic.icon, { fontSize: '22px' }).setOrigin(0.5).setDepth(18);
        const glow  = this.add.rectangle(x, y, 28, 28, relic.color, 0.25)
            .setStrokeStyle(1, relic.color, 0.8).setDepth(17);

        this.tweens.add({ targets: icon, y: y - 8, duration: 600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
        this.tweens.add({ targets: glow, alpha: 0.6, duration: 600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

        const drop = this.add.rectangle(x, y, 28, 28, 0x000000, 0).setDepth(16);
        drop.setData('relicId', relic.id);
        this.physics.add.existing(drop, true);
        this.relicDrops.add(drop);
    }

    handleRelicPickup(paddle, drop) {
        const relicId = drop.getData('relicId');
        const relic   = RELICS.find(r => r.id === relicId);
        if (!relic) return;

        this.relics[relicId] = true;

        const x = drop.x, y = drop.y;
        this.relicDrops.getChildren().forEach(c => { if (c.x === x && c.y === y) c.destroy(); });
        for (let i = 0; i < 12; i++) {
            const angle = (i / 12) * Math.PI * 2;
            const p = this.add.rectangle(x, y, 4, 4, relic.color).setDepth(22);
            this.tweens.add({
                targets: p,
                x: x + Math.cos(angle) * 40,
                y: y + Math.sin(angle) * 40,
                alpha: 0, duration: 500, ease: 'Quad.easeOut',
                onComplete: () => p.destroy(),
            });
        }
        this.flashText(x, y - 20, `${relic.icon} ${relic.name}`, '#' + relic.color.toString(16).padStart(6, '0'), 14);

        if (relicId === 'energy_core') this.blowRandomBricks(2);
    }

    blowRandomBricks(count) {
        const alive = this.bricks.getChildren().filter(b => b && b.active);
        for (let i = 0; i < Math.min(count, alive.length); i++) {
            const b = Phaser.Math.RND.pick(alive);
            if (!b) continue;
            this.spawnBrickParticles(b.x, b.y, 0xffee00);
            b.destroy();
        }
    }

    // ──────────────────────────────────────────
    // 球
    // ──────────────────────────────────────────
    initBall() {
        const ball = this.add.rectangle(240, 650, 12, 12, 0xffee00);
        this.physics.add.existing(ball);
        ball.body.setCollideWorldBounds(true).setBounce(1, 1);
        this.balls.add(ball);
        this.mainBall = ball;
        this.applyBallSpeedMult(1);
    }

    applyBallSpeedMult(baseMult) {
        const overclockMult = 1 + (this.buffs.overclock || 0) * 0.15;
        const final = baseMult * overclockMult;
        this.balls.children.iterate(b => {
            if (!b || !b.body) return;
            const vx = b.body.velocity.x, vy = b.body.velocity.y;
            const spd = Math.sqrt(vx * vx + vy * vy);
            if (spd > 0) b.body.setVelocity(vx / spd * spd * final, vy / spd * spd * final);
        });
    }

    handlePaddleHit(ball, paddle) {
        const diff    = ball.x - paddle.x;
        const speed   = Math.sqrt(ball.body.velocity.x ** 2 + ball.body.velocity.y ** 2) || 400;
        const angle   = Phaser.Math.Clamp(diff / (paddle.width / 2), -0.85, 0.85);
        ball.body.setVelocityX(speed * angle);
        if (ball.body.velocity.y > 0) ball.body.setVelocityY(-Math.abs(ball.body.velocity.y));

        if (this.buffs.bounceAccel) {
            const extra = 1 + this.buffs.bounceAccel * 0.08;
            const vx = ball.body.velocity.x, vy = ball.body.velocity.y;
            const spd = Math.sqrt(vx * vx + vy * vy);
            if (spd > 0) b.body.setVelocity(vx / spd * spd * extra, vy / spd * spd * extra);
        }

        if (this.buffs.chaosCore) {
            const chance = Math.min(this.buffs.chaosCore * 0.25, 0.75);
            if (Math.random() < chance && this.balls.countActive() < 5) {
                this.spawnExtraBall(ball);
            }
        }
    }

    // 粘球瞄准
    stickBall() {
        if (this.ballLaunched || !this.mainBall) return;
        this.isStickyHold = true;
        this.mainBall.setPosition(this.paddle.x, 650);
        this.mainBall.body.setVelocity(0, 0);
        this.aimLine.setVisible(true);
    }

    releaseBall() {
        if (!this.isStickyHold) return;
        this.isStickyHold = false;
        this.aimLine.setVisible(false);
        this.launchBallFromAngle();
    }

    launchBallFromAngle() {
        if (!this.mainBall) return;
        const speed = Math.sqrt(this.ballSpeedCfg.vx ** 2 + this.ballSpeedCfg.vy ** 2);
        const mult = 1 + (this.buffs.overclock || 0) * 0.15;
        this.mainBall.body.setVelocity(
            Math.cos(this.aimAngle) * speed * mult,
            Math.sin(this.aimAngle) * speed * mult
        );
        this.ballLaunched = true;
    }

    launchBall() {
        if (!this.ballLaunched) {
            this.ballLaunched = true;
            const mult = 1 + (this.buffs.overclock || 0) * 0.15;
            this.mainBall.body.setVelocity(
                this.ballSpeedCfg.vx * mult,
                this.ballSpeedCfg.vy * mult
            );
        }
    }

    resetBall() {
        this.ballLaunched = false;
        this.balls.children.iterate(b => { if (b && b !== this.mainBall) b.destroy(); });
        this.mainBall.setPosition(this.paddle.x, 650);
        this.mainBall.body.setVelocity(0, 0);
        // 重置火球效果
        if (this.buffs.fireball) {
            this.mainBall.setFillStyle(0xff4400);
        } else {
            this.mainBall.setFillStyle(0xffee00);
        }
        // 连击清零
        this.combo = 0;
        this.hudCombo.setAlpha(0);
    }

    spawnExtraBall(fromBall) {
        const vx = fromBall.body.velocity.x, vy = fromBall.body.velocity.y;
        const spd = Math.sqrt(vx * vx + vy * vy);
        const extraSpd = this.buffs.wormhole ? spd * 1.2 : spd;
        const color = this.buffs.wormhole ? 0x8844ff : 0xaa44ff;

        const b = this.add.rectangle(fromBall.x + 8, fromBall.y, 11, 11, color);
        this.physics.add.existing(b);
        b.body.setCollideWorldBounds(true).setBounce(1, 1);
        b.body.setVelocity(-vx * (extraSpd / spd), vy * (extraSpd / spd) - 30);
        this.balls.add(b);
        this.physics.add.collider(b, this.paddle, this.handlePaddleHit, null, this);
        this.physics.add.collider(b, this.bricks, this.handleBrickHit, null, this);
    }

    // ──────────────────────────────────────────
    // 激光
    // ──────────────────────────────────────────
    startLaserTimer() {
        if (this.laserTimer) this.laserTimer.destroy();
        const delay = Math.max(1500, 4000 - (this.buffs.laserMount - 1) * 1250);
        this.laserTimer = this.time.addEvent({
            delay,
            callback: this.fireLaser,
            callbackScope: this,
            loop: true,
        });
    }

    fireLaser() {
        if (this.gameState !== 'PLAYING') return;
        const laser = this.add.rectangle(this.paddle.x, this.paddle.y - 20, 4, 22, 0xff6600);
        this.physics.add.existing(laser);
        laser.setStrokeStyle(1, 0xffee00, 1);
        laser.setData('pierced', false);
        this.lasers.add(laser);
        laser.body.setVelocityY(-700);
        this.physics.add.collider(laser, this.paddle);
        this.cameras.main.shake(35, 0.003);
    }

    handleLaserHit(laser, brick) {
        if (!brick || !brick.active) return;
        const hp    = brick.getData('hp') - 1;
        brick.setData('hp', hp);
        this.spawnBrickParticles(brick.x, brick.y, 0xff6600);

        if (this.buffs.overloadSplash) {
            this.bricks.children.iterate(b => {
                if (!b || !b.active || b === brick) return;
                const dx = Math.abs(b.x - brick.x), dy = Math.abs(b.y - brick.y);
                if (dx <= 80 && dy <= 60) {
                    b.setData('hp', b.getData('hp') - 1);
                    this.spawnBrickParticles(b.x, b.y, 0xff9900);
                    if (b.getData('hp') <= 0) {
                        if (b.getData('type') === 'explosive') this.spawnBullet(b.x, b.y);
                        b.destroy();
                    }
                }
            });
        }

        if (hp <= 0) {
            if (brick.getData('type') === 'explosive') this.spawnBullet(brick.x, brick.y);
            brick.destroy();
        }

        if (!this.buffs.plasmaPierce || laser.getData('pierced')) {
            laser.destroy();
        } else {
            laser.setData('pierced', true);
            this.tweens.add({
                targets: laser,
                alpha: { from: 1, to: 0.3 },
                duration: 80,
                yoyo: true,
            });
        }

        if (this.bricks.countActive() === 0) this.onWaveClear();
    }

    // ──────────────────────────────────────────
    // 波次清除 → 升级选择
    // ──────────────────────────────────────────
    onWaveClear() {
        if (this.gameState !== 'PLAYING') return;
        this.gameState = 'UPGRADING';
        this.physics.pause();

        if (this.buffs.overdrive) {
            this.extraPick = Math.floor(this.bricksKilled / 20);
            this.bricksKilled = this.bricksKilled % 20;
        }

        if (this.wave === 5 || this.wave === 10) {
            const msg = this.add.text(this.scale.width / 2, 200, `${this.wave === 5 ? '⚔' : '💀'} 完成！圣遗物奖励！`, {
                fontSize: '16px', fontFamily: '"Press Start 2P", monospace', color: '#ffee00',
            }).setOrigin(0.5).setDepth(30);
            this.tweens.add({ targets: msg, alpha: 0, duration: 2000, delay: 500, onComplete: () => msg.destroy() });
        }

        this.time.delayedCall(500, () => {
            this.resetBall();
            this.timeShardUsed = false;
            this.showUpgradeUI();
        });
    }

    showUpgradeUI() {
        const W = this.scale.width, H = this.scale.height;
        this.upgradeContainer = this.add.container(0, 0).setDepth(40);
        this.upgradeContainer.add(this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.78));

        this.upgradeContainer.add(
            this.add.text(W / 2, 70, `波次 ${this.wave} 完成！`, {
                fontSize: '18px', fontFamily: '"Press Start 2P", monospace', color: '#ffee00',
            }).setOrigin(0.5)
        );
        this.upgradeContainer.add(
            this.add.text(W / 2, 110, '选择一项永久强化', { fontSize: '13px', color: '#00ffcc' }).setOrigin(0.5)
        );

        const pickCount = (this.relics.death_pact ? 4 : 3) + this.extraPick;
        this.extraPick = 0;

        const shuffled = Phaser.Math.RND.shuffle([...BUFF_POOL]);
        const choices  = shuffled.slice(0, Math.min(pickCount, BUFF_POOL.length));

        choices.forEach((buff, i) => {
            this.createBuffCard(W / 2, 170 + i * 155, buff, i);
        });
    }

    createBuffCard(x, y, buff, idx) {
        const w = 340, h = 130;
        const container = this.upgradeContainer;
        const tagCfg    = TAG_CONFIG[buff.tag];
        const txtColor  = '#' + buff.color.toString(16).padStart(6, '0');

        container.add(this.add.rectangle(x - 110, y - 30, 48, 18, 0x000000, 0.8)
            .setStrokeStyle(1, buff.color, 1));

        container.add(this.add.rectangle(x + 5, y + 5, w, h, 0x000000, 1));
        const bg = this.add.rectangle(x, y, w, h, 0x000c0c)
            .setStrokeStyle(2, buff.color, 0.9)
            .setInteractive({ useHandCursor: true })
            .setDepth(41);
        container.add(bg);

        container.add(this.add.text(x - 110, y - 30, tagCfg.label, {
            fontSize: '8px', fontFamily: '"Press Start 2P", monospace',
            color: txtColor,
        }).setOrigin(0.5).setDepth(42));

        container.add(this.add.text(x - 130, y - 10, buff.icon, { fontSize: '32px', color: txtColor }).setOrigin(0.5).setDepth(42));

        container.add(this.add.text(x - 90, y - 28, buff.name, {
            fontSize: '17px', fontStyle: 'bold', color: '#ffffff',
        }).setOrigin(0, 0.5).setDepth(42));

        container.add(this.add.text(x - 90, y + 5, buff.desc, {
            fontSize: '12px', color: '#aaaaaa',
        }).setOrigin(0, 0.5).setDepth(42));

        if (buff.stackable) {
            container.add(this.add.text(x - 90, y + 26, `[可叠加 ×${buff.maxStacks}]`, {
                fontSize: '10px', color: '#666666',
            }).setOrigin(0, 0.5).setDepth(42));
        }

        container.add(this.add.text(x + 140, y + 42, `[${idx + 1}]`, {
            fontSize: '10px', fontFamily: '"Press Start 2P", monospace', color: txtColor,
        }).setOrigin(1, 0.5).setDepth(42));

        bg.on('pointerover', () => { bg.setFillStyle(0x001a1a); bg.setStrokeStyle(3, buff.color, 1); });
        bg.on('pointerout',  () => { bg.setFillStyle(0x000c0c); bg.setStrokeStyle(2, buff.color, 0.9); });
        bg.on('pointerdown', () => this.selectBuff(buff));

        const keyCode = ['ONE', 'TWO', 'THREE', 'FOUR'][idx];
        if (keyCode) this.input.keyboard.once(`keydown-${keyCode}`, () => this.selectBuff(buff));
    }

    selectBuff(buff) {
        if (this.gameState !== 'UPGRADING') return;
        buff.apply(this);

        const tag = TAG_CONFIG[buff.tag];
        this.flashText(this.scale.width / 2, 360, `${buff.icon} ${buff.name}`, '#' + buff.color.toString(16).padStart(6, '0'), 18);

        this.upgradeContainer.destroy();
        this.upgradeContainer = null;
        ['ONE', 'TWO', 'THREE', 'FOUR'].forEach(k => this.input.keyboard.removeAllListeners(`keydown-${k}`));

        this.wave++;
        this.ballLaunched = false;
        this.bricks.clear(true, true);
        this.spawnWave(this.wave);

        this.physics.add.collider(this.balls,        this.bricks, this.handleBrickHit, null, this);
        this.physics.add.overlap(this.lasers,         this.bricks, this.handleLaserHit, null, this);

        if (this.relics.energy_core) {
            this.time.delayedCall(600, () => this.blowRandomBricks(2));
        }

        this.gameState = 'PLAYING';
        this.physics.resume();
        this.updateHUD();

        this.flashText(this.scale.width / 2, 420, `波次 ${this.wave}`, '#ffee00', 20);
    }

    // ──────────────────────────────────────────
    // 粒子 & 特效
    // ──────────────────────────────────────────
    spawnBrickParticles(x, y, color) {
        for (let i = 0; i < 9; i++) {
            const size = Phaser.Math.Between(3, 8);
            const p = this.add.rectangle(
                x + Phaser.Math.Between(-12, 12),
                y + Phaser.Math.Between(-6, 6),
                size, size, color
            ).setDepth(15);
            const vx = Phaser.Math.Between(-200, 200);
            const vy = Phaser.Math.Between(-240, 10);
            this.tweens.add({
                targets: p,
                x: p.x + vx * 0.45,
                y: p.y + vy * 0.45,
                alpha: 0, scaleX: 0, scaleY: 0,
                duration: 360 + Math.random() * 220,
                ease: 'Quad.easeOut',
                onComplete: () => p.destroy(),
            });
        }
    }

    hitStop(duration) {
        this.physics.pause();
        this.time.delayedCall(duration, () => {
            if (this.gameState === 'PLAYING') this.physics.resume();
        });
    }

    flashText(x, y, text, color = '#ffee00', size = 20) {
        const t = this.add.text(x, y, text, {
            fontSize: `${size}px`, fontStyle: 'bold', color,
            stroke: '#000000', strokeThickness: 3,
        }).setOrigin(0.5).setDepth(30);
        this.tweens.add({
            targets: t, y: y - 50,
            alpha: 0, duration: 900,
            ease: 'Quad.easeOut',
            onComplete: () => t.destroy(),
        });
    }

    // ──────────────────────────────────────────
    // Update
    // ──────────────────────────────────────────
    update() {
        if (this.gameState !== 'PLAYING') return;

        const paddleSpeed = 520;
        let dir = 0;
        if (this.sys.game.device.input.touch) {
            if (this.isLeftDown)       dir = -1;
            else if (this.isRightDown) dir =  1;
        } else {
            if (this.cursors.left.isDown  || this.keys.A.isDown) dir = -1;
            else if (this.cursors.right.isDown || this.keys.D.isDown) dir = 1;
        }

        // 粘球瞄准控制
        if (!this.sys.game.device.input.touch) {
            if (Phaser.Input.Keyboard.JustDown(this.keys.SPACE)) {
                this.stickBall();
            }
            if (this.keys.SPACE.isDown && this.isStickyHold) {
                // 根据挡板位置更新瞄准
                if (this.mainBall) {
                    this.mainBall.x = this.paddle.x;
                    this.mainBall.y = 650;
                }
                // 画瞄准线
                this.aimLine.clear();
                this.aimLine.lineStyle(2, 0x00ffcc, 0.6);
                const startX = this.paddle.x;
                const startY = 640;
                this.aimLine.lineBetween(startX, startY, startX, 100);
                // 瞄准点
                this.aimLine.fillStyle(0x00ffcc, 0.8);
                this.aimLine.fillCircle(startX, 100, 4);
            }
            if (Phaser.Input.Keyboard.JustUp(this.keys.SPACE)) {
                this.releaseBall();
            }
        }

        this.paddle.body.setVelocityX(dir * paddleSpeed);

        // 移动挡板时球跟随（未发射时）
        if (!this.ballLaunched && this.mainBall && !this.isStickyHold) {
            this.mainBall.x = this.paddle.x;
        }

        // 引力透镜
        if (this.relics.gravity_lens && !this.ballLaunched) {
            // 仅未发射时自动追随
        }

        // 激光跟随挡板
        this.lasers.children.iterate(l => {
            if (!l || !l.active) return;
            l.x = this.paddle.x;
            if (l.y < -20) l.destroy();
        });

        // 球落底
        this.balls.children.iterate(b => {
            if (!b || !b.active) return;
            if (b.y > 780) {
                if (b === this.mainBall) {
                    this.damagePlayer();
                    this.resetBall();
                } else {
                    b.destroy();
                }
            }
        });

        // 引力透镜：发射状态下轻微吸引
        if (this.relics.gravity_lens && this.ballLaunched) {
            this.balls.children.iterate(b => {
                if (!b || !b.active || b === this.mainBall) return;
                const dx = this.paddle.x - b.x;
                const dy = this.paddle.y - b.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < 150 && dist > 10) {
                    const force = 25 * (1 - dist / 150);
                    b.body.velocity.x += (dx / dist) * force;
                }
            });
        }

        // 子弹越界
        this.enemyBullets.children.iterate(b => { if (b && b.y > 800) b.destroy(); });
    }

    // ──────────────────────────────────────────
    // 移动端控制
    // ──────────────────────────────────────────
    createMobileControls() {
        const W = this.scale.width, btnY = 740;
        const lBtn = this.add.rectangle(W * 0.27, btnY, 210, 78, 0x000000, 0.75)
            .setStrokeStyle(2, 0x00ffcc, 1).setInteractive().setDepth(15);
        lBtn.on('pointerdown', () => { this.isLeftDown = true;  lBtn.setFillStyle(0x003322, 0.9); });
        lBtn.on('pointerup',   () => { this.isLeftDown = false; lBtn.setFillStyle(0x000000, 0.75); });
        lBtn.on('pointerout',  () => { this.isLeftDown = false; lBtn.setFillStyle(0x000000, 0.75); });

        const rBtn = this.add.rectangle(W * 0.73, btnY, 210, 78, 0x000000, 0.75)
            .setStrokeStyle(2, 0x00ffcc, 1).setInteractive().setDepth(15);
        rBtn.on('pointerdown', () => { this.isRightDown = true;  rBtn.setFillStyle(0x003322, 0.9); });
        rBtn.on('pointerup',   () => { this.isRightDown = false; rBtn.setFillStyle(0x000000, 0.75); });
        rBtn.on('pointerout',  () => { this.isRightDown = false; rBtn.setFillStyle(0x000000, 0.75); });

        this.add.text(W * 0.27, btnY, '◄◄', { fontSize: '28px', color: '#00ffcc' }).setOrigin(0.5).setDepth(16);
        this.add.text(W * 0.73, btnY, '►►', { fontSize: '28px', color: '#00ffcc' }).setOrigin(0.5).setDepth(16);
    }
}
