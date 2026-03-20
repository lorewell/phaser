// ==========================================
// 【主菜单场景】
// ==========================================
export default class MenuScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MenuScene' });
    }

    create() {
        const W = this.scale.width;
        const H = this.scale.height;

        // 像素风背景：纯黑 + 像素网格
        this.add.rectangle(W / 2, H / 2, W, H, 0x000000);
        const gridG = this.add.graphics();
        gridG.lineStyle(1, 0x0a0a22, 0.7);
        for (let gx = 0; gx <= W; gx += 16) gridG.lineBetween(gx, 0, gx, H);
        for (let gy = 0; gy <= H; gy += 16) gridG.lineBetween(0, gy, W, gy);

        // 像素星点（方块）
        const starColors = [0xffee00, 0x00ffcc, 0xffffff, 0x00ff88, 0xcc44ff];
        for (let i = 0; i < 70; i++) {
            const sx = Phaser.Math.Between(0, W);
            const sy = Phaser.Math.Between(0, H * 0.78);
            const sz = Phaser.Math.RND.pick([1, 1, 1, 2, 2]);
            const sc = Phaser.Math.RND.pick(starColors);
            const sa = Phaser.Math.FloatBetween(0.4, 1.0);
            this.add.rectangle(sx, sy, sz, sz, sc, sa);
        }

        // CRT 扫描线
        const scanG = this.add.graphics();
        for (let sy2 = 0; sy2 < H; sy2 += 4) {
            scanG.fillStyle(0x000000, 0.15);
            scanG.fillRect(0, sy2, W, 2);
        }

        // 标题
        this.add.text(W / 2, 160, '砖块幸存者', {
            fontSize: '44px',
            color: '#ffee00',
            fontStyle: 'bold',
            stroke: '#ff6600',
            strokeThickness: 4,
            shadow: { x: 4, y: 4, color: '#330000', blur: 0, fill: true },
        }).setOrigin(0.5);

        this.add.text(W / 2, 222, 'BRICK SURVIVOR', {
            fontSize: '11px',
            fontFamily: '"Press Start 2P", monospace',
            color: '#00ffcc',
            letterSpacing: 4,
        }).setOrigin(0.5);

        // 像素分隔线
        const g = this.add.graphics();
        g.fillStyle(0xffee00, 1);
        g.fillRect(W / 2 - 130, 252, 260, 3);
        g.fillStyle(0x00ffcc, 0.5);
        g.fillRect(W / 2 - 130, 256, 260, 1);

        // 按钮
        this.createButton(W / 2, 395, '开 始 游 戏', 0x001100, 0x002a00, () => {
            this.scene.start('GameScene');
        });

        this.createButton(W / 2, 500, '设    置', 0x000011, 0x00001f, () => {
            this.scene.start('SettingsScene');
        });

        // 操作提示
        this.add.text(W / 2, H - 50, '方向键 / A D  移动    空格  发球', {
            fontSize: '12px',
            color: '#336644',
        }).setOrigin(0.5);

        this.add.text(W / 2, H - 28, 'v0.1.0', {
            fontSize: '9px',
            fontFamily: '"Press Start 2P", monospace',
            color: '#224433',
        }).setOrigin(0.5);
    }

    createButton(x, y, label, colorNormal, colorHover, onClick) {
        const w = 260, h = 64;

        // 像素风错位阴影
        this.add.rectangle(x + 5, y + 5, w, h, 0x000000, 1);

        const bg = this.add.rectangle(x, y, w, h, colorNormal)
            .setStrokeStyle(2, 0x00ffcc, 1)
            .setInteractive({ useHandCursor: true });

        // 双边框像素效果
        const inner = this.add.rectangle(x, y, w - 8, h - 8, 0x000000, 0)
            .setStrokeStyle(1, 0x00ffcc, 0.3);

        const txt = this.add.text(x, y, label, {
            fontSize: '22px',
            color: '#00ffcc',
            fontStyle: 'bold',
        }).setOrigin(0.5);

        bg.on('pointerover', () => {
            bg.setFillStyle(colorHover);
            bg.setStrokeStyle(2, 0xffee00, 1);
            inner.setStrokeStyle(1, 0xffee00, 0.5);
            txt.setColor('#ffee00');
            txt.setScale(1.04);
        });
        bg.on('pointerout', () => {
            bg.setFillStyle(colorNormal);
            bg.setStrokeStyle(2, 0x00ffcc, 1);
            inner.setStrokeStyle(1, 0x00ffcc, 0.3);
            txt.setColor('#00ffcc');
            txt.setScale(1);
        });
        bg.on('pointerdown', () => {
            bg.setFillStyle(0x00ffcc);
            txt.setColor('#000000');
            this.cameras.main.shake(70, 0.006);
            this.time.delayedCall(120, onClick);
        });
    }
}
