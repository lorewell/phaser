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

        // 背景
        this.add.rectangle(W / 2, H / 2, W, H, 0x08081a);

        // 标题
        this.add.text(W / 2, 55, '设  置', {
            fontSize: '38px',
            color: '#ddeeff',
            fontStyle: 'bold',
        }).setOrigin(0.5);

        // 分隔线
        const g = this.add.graphics();
        g.lineStyle(1, 0x223366, 0.9);
        g.lineBetween(50, 92, W - 50, 92);

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
        this.createSmallButton(W / 2 - 85, H - 95, '重置默认', 0x2a1515, 0x552222, () => {
            Object.assign(this.settings, DEFAULTS);
            saveSettings(this.settings);
            this.scene.restart();
        });

        this.createSmallButton(W / 2 + 85, H - 95, '返回菜单', 0x151528, 0x223366, () => {
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
            color: '#99bbdd',
            fontStyle: 'bold',
        });

        // 说明文字
        this.add.text(50, rowY + 28, item.hint, {
            fontSize: '13px',
            color: '#445566',
        });

        // 选项按钮组
        const totalGap = 12;
        const optW = Math.floor((W - 100 - totalGap * (item.options.length - 1)) / item.options.length);

        item.options.forEach((opt, idx) => {
            const bx = 50 + idx * (optW + totalGap) + optW / 2;
            const by = rowY + 78;
            const isActive = this.settings[item.key] === opt;

            const btn = this.add.rectangle(bx, by, optW, 38,
                isActive ? 0x1e4488 : 0x111122)
                .setStrokeStyle(1, isActive ? 0x4499ff : 0x2a3355)
                .setInteractive({ useHandCursor: true });

            const txt = this.add.text(bx, by, item.display[opt], {
                fontSize: '16px',
                color: isActive ? '#ffffff' : '#556677',
                fontStyle: isActive ? 'bold' : 'normal',
            }).setOrigin(0.5);

            btn.on('pointerover', () => {
                if (!isActive) btn.setFillStyle(0x1a2840);
            });
            btn.on('pointerout', () => {
                if (!isActive) btn.setFillStyle(0x111122);
            });
            btn.on('pointerdown', () => {
                this.settings[item.key] = opt;
                saveSettings(this.settings);
                this.scene.restart();
            });
        });
    }

    createSmallButton(x, y, label, colorNormal, colorHover, onClick) {
        const bg = this.add.rectangle(x, y, 148, 50, colorNormal)
            .setStrokeStyle(1, 0x334466, 0.8)
            .setInteractive({ useHandCursor: true });

        const txt = this.add.text(x, y, label, {
            fontSize: '18px',
            color: '#aaccee',
        }).setOrigin(0.5);

        bg.on('pointerover', () => { bg.setFillStyle(colorHover); txt.setColor('#ffffff'); });
        bg.on('pointerout', () => { bg.setFillStyle(colorNormal); txt.setColor('#aaccee'); });
        bg.on('pointerdown', () => { bg.setFillStyle(0x080810); onClick(); });
    }
}
