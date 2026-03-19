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

        // 背景
        this.add.rectangle(W / 2, H / 2, W, H, 0x08081a);

        // 装饰星点
        for (let i = 0; i < 70; i++) {
            const x = Phaser.Math.Between(0, W);
            const y = Phaser.Math.Between(0, H * 0.72);
            const r = Phaser.Math.FloatBetween(0.5, 2);
            const a = Phaser.Math.FloatBetween(0.25, 0.85);
            this.add.circle(x, y, r, 0xffffff, a);
        }

        // 标题
        this.add.text(W / 2, 165, '砖块幸存者', {
            fontSize: '52px',
            color: '#ffffff',
            fontStyle: 'bold',
            stroke: '#2244cc',
            strokeThickness: 5,
        }).setOrigin(0.5);

        this.add.text(W / 2, 230, 'BRICK  SURVIVOR', {
            fontSize: '15px',
            color: '#5577bb',
            letterSpacing: 8,
        }).setOrigin(0.5);

        // 分隔线
        const g = this.add.graphics();
        g.lineStyle(1, 0x223366, 0.9);
        g.lineBetween(W / 2 - 110, 260, W / 2 + 110, 260);

        // 按钮
        this.createButton(W / 2, 390, '开 始 游 戏', 0x1a2d5a, 0x2a4d9a, () => {
            this.scene.start('GameScene');
        });

        this.createButton(W / 2, 490, '设    置', 0x1a3322, 0x2a5540, () => {
            this.scene.start('SettingsScene');
        });

        // 操作提示
        this.add.text(W / 2, H - 50, '方向键 / A D  移动    空格  发球', {
            fontSize: '13px',
            color: '#334466',
        }).setOrigin(0.5);

        this.add.text(W / 2, H - 28, 'v0.1.0', {
            fontSize: '12px',
            color: '#222244',
        }).setOrigin(0.5);
    }

    createButton(x, y, label, colorNormal, colorHover, onClick) {
        const w = 260, h = 64;

        // 阴影
        this.add.rectangle(x + 4, y + 5, w, h, 0x000000, 0.35);

        const bg = this.add.rectangle(x, y, w, h, colorNormal)
            .setStrokeStyle(1, 0x4466aa, 0.7)
            .setInteractive({ useHandCursor: true });

        const txt = this.add.text(x, y, label, {
            fontSize: '24px',
            color: '#ddeeff',
            fontStyle: 'bold',
        }).setOrigin(0.5);

        bg.on('pointerover', () => {
            bg.setFillStyle(colorHover);
            txt.setScale(1.04);
        });
        bg.on('pointerout', () => {
            bg.setFillStyle(colorNormal);
            txt.setScale(1);
        });
        bg.on('pointerdown', () => {
            bg.setFillStyle(0x0a1428);
            this.cameras.main.shake(70, 0.006);
            this.time.delayedCall(120, onClick);
        });
    }
}
