// ==========================================
// 【设置场景】
// ==========================================
import { loadSettings, saveSettings, DEFAULTS } from '../settings.js';

export default class SettingsScene extends Phaser.Scene {
    constructor() {
        super({ key: 'SettingsScene' });
    }

    create() {
        this.settings = loadSettings();
        const W = this.scale.width;
        const H = this.scale.height;

        // 像素风背景
        this.add.rectangle(W / 2, H / 2, W, H, 0x000000);
        const gridG = this.add.graphics();
        gridG.lineStyle(1, 0x0a0a22, 0.6);
        for (let gx = 0; gx <= W; gx += 16) gridG.lineBetween(gx, 0, gx, H);
        for (let gy = 0; gy <= H; gy += 16) gridG.lineBetween(0, gy, W, gy);
        // CRT 扫描线
        const scanG = this.add.graphics();
        for (let sy = 0; sy < H; sy += 4) {
            scanG.fillStyle(0x000000, 0.12);
            scanG.fillRect(0, sy, W, 2);
        }

        // 标题
        this.add.text(W / 2, 55, '设  置', {
            fontSize: '36px',
            color: '#ffee00',
            fontStyle: 'bold',
            stroke: '#ff6600',
            strokeThickness: 3,
            shadow: { x: 3, y: 3, color: '#330000', blur: 0, fill: true },
        }).setOrigin(0.5);

        // 像素分隔线
        const g = this.add.graphics();
        g.fillStyle(0xffee00, 1);
        g.fillRect(50, 92, W - 100, 2);
        g.fillStyle(0x00ffcc, 0.5);
        g.fillRect(50, 95, W - 100, 1);

        // 设置项定义
        const items = [
            {
                label: '球  速',
                hint: '影响球的初始飞行速度',
                key: 'ballSpeed',
                options: ['slow', 'normal', 'fast'],
                display: { slow: '慢速', normal: '正常', fast: '快速' },
            },
            {
                label: '难  度',
                hint: '影响砖块血量与子弹速度',
                key: 'difficulty',
                options: ['easy', 'normal', 'hard'],
                display: { easy: '简单', normal: '普通', hard: '困难' },
            },
            {
                label: '音  效',
                hint: '背景音乐与音效（功能待开放）',
                key: 'sound',
                options: ['on', 'off'],
                display: { on: '开启', off: '关闭' },
            },
            {
                label: '调试模式',
                hint: '显示物理碰撞体边框',
                key: 'debug',
                options: ['on', 'off'],
                display: { on: '开启', off: '关闭' },
            },
        ];

        items.forEach((item, i) => {
            this.createSettingRow(item, 150 + i * 130, W);
        });

        // 底部按钮行
        this.createSmallButton(W / 2 - 85, H - 95, '重置默认', 0x110000, 0x220000, () => {
            Object.assign(this.settings, DEFAULTS);
            saveSettings(this.settings);
            this.scene.restart();
        });

        this.createSmallButton(W / 2 + 85, H - 95, '返回菜单', 0x000011, 0x000022, () => {
            saveSettings(this.settings);
            this.scene.start('MenuScene');
        });

        // ESC 快捷返回
        this.input.keyboard.once('keydown-ESC', () => {
            saveSettings(this.settings);
            this.scene.start('MenuScene');
        });
    }

    createSettingRow(item, rowY, W) {
        // 行标签
        this.add.text(50, rowY, item.label, {
            fontSize: '21px',
            color: '#ffee00',
            fontStyle: 'bold',
        });

        // 说明文字
        this.add.text(50, rowY + 28, item.hint, {
            fontSize: '13px',
            color: '#336644',
        });

        // 选项按钮组
        const totalGap = 12;
        const optW = Math.floor((W - 100 - totalGap * (item.options.length - 1)) / item.options.length);

        item.options.forEach((opt, idx) => {
            const bx = 50 + idx * (optW + totalGap) + optW / 2;
            const by = rowY + 78;
            const isActive = this.settings[item.key] === opt;

            const btn = this.add.rectangle(bx, by, optW, 38,
                isActive ? 0x003300 : 0x000000)
                .setStrokeStyle(2, isActive ? 0x00ffcc : 0x224433)
                .setInteractive({ useHandCursor: true });

            const txt = this.add.text(bx, by, item.display[opt], {
                fontSize: '16px',
                color: isActive ? '#00ffcc' : '#335544',
                fontStyle: isActive ? 'bold' : 'normal',
            }).setOrigin(0.5);

            btn.on('pointerover', () => {
                if (!isActive) btn.setFillStyle(0x001100);
                if (!isActive) btn.setStrokeStyle(2, 0x00aa88);
            });
            btn.on('pointerout', () => {
                if (!isActive) btn.setFillStyle(0x000000);
                if (!isActive) btn.setStrokeStyle(2, 0x224433);
            });
            btn.on('pointerdown', () => {
                this.settings[item.key] = opt;
                saveSettings(this.settings);
                this.scene.restart();
            });
        });
    }

    createSmallButton(x, y, label, colorNormal, colorHover, onClick) {
        this.add.rectangle(x + 4, y + 4, 148, 50, 0x000000, 1);
        const bg = this.add.rectangle(x, y, 148, 50, colorNormal)
            .setStrokeStyle(2, 0x00ffcc, 1)
            .setInteractive({ useHandCursor: true });

        const txt = this.add.text(x, y, label, {
            fontSize: '17px',
            color: '#00ffcc',
            fontStyle: 'bold',
        }).setOrigin(0.5);

        bg.on('pointerover', () => { bg.setFillStyle(colorHover); bg.setStrokeStyle(2, 0xffee00); txt.setColor('#ffee00'); });
        bg.on('pointerout',  () => { bg.setFillStyle(colorNormal); bg.setStrokeStyle(2, 0x00ffcc); txt.setColor('#00ffcc'); });
        bg.on('pointerdown', () => { bg.setFillStyle(0x00ffcc); txt.setColor('#000000'); onClick(); });
    }
}
