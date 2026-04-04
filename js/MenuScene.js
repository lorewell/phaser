class MenuScene extends Phaser.Scene {
    constructor() {
        super('MenuScene');
    }

    create() {
        this.cameras.main.setBackgroundColor('#2c1e14');

        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        const cx = width / 2;

        // 标题：距顶部 18%
        this.add.text(cx, height * 0.18, 'PIXEL CHESS', {
            fontSize: '48px',
            color: '#f0d9b5',
            fontStyle: 'bold',
            fontFamily: 'Zpix, monospace'
        }).setOrigin(0.5);

        // 菜单选项：从 40% 高度开始，每项间距 10%

        this.createMenuItem(cx, height * 0.40, '玩家对战电脑', () => {
            play.mode = 'player_vs_ai';
            this.scene.start('GameScene');
        });

        this.createMenuItem(cx, height * 0.50, '本地双人对战', () => {
            play.mode = 'player_vs_player';
            this.scene.start('GameScene');
        });


        this.createMenuItem(cx, height * 0.60, '游戏设置 (难度)', () => {
            this.toggleSettings();
        });

        // 设置面板 (初始隐藏)
        this.setupSettingsPanel();
    }

    createMenuItem(x, y, text, callback) {
        const bg = this.add.rectangle(x, y, 300, 54, 0x4a3728)
            .setInteractive({ useHandCursor: true })
            .on('pointerover', () => bg.setFillStyle(0x634a3a))
            .on('pointerout', () => bg.setFillStyle(0x4a3728))
            .on('pointerdown', callback);

        this.add.text(x, y, text, {
            fontSize: '24px',
            color: '#ffffff',
            fontFamily: 'Zpix, monospace'
        }).setOrigin(0.5);
    }

    setupSettingsPanel() {
        this.settingsGroup = this.add.group();
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        const cx = width / 2;
        const panelY = height * 0.73;

        const bg = this.add.rectangle(cx, panelY, 340, 70, 0x1a1a1a, 0.85);
        const text = this.add.text(cx, panelY - 14, '当前难度: ' + play.level.toUpperCase(), {
            fontSize: '16px',
            color: '#aaaaaa',
            fontFamily: 'Zpix, monospace'
        }).setOrigin(0.5);

        const btnEasy = this.add.text(cx - 90, panelY + 14, '[简单]', { fontSize: '18px', color: play.level === 'simple' ? '#ffdd00' : '#ffffff', fontFamily: 'Zpix, monospace' })
            .setOrigin(0.5).setInteractive().on('pointerdown', () => this.setLevel('simple'));
        const btnNormal = this.add.text(cx, panelY + 14, '[普通]', { fontSize: '18px', color: play.level === 'normal' ? '#ffdd00' : '#ffffff', fontFamily: 'Zpix, monospace' })
            .setOrigin(0.5).setInteractive().on('pointerdown', () => this.setLevel('normal'));
        const btnHard = this.add.text(cx + 90, panelY + 14, '[困难]', { fontSize: '18px', color: play.level === 'hard' ? '#ffdd00' : '#ffffff', fontFamily: 'Zpix, monospace' })
            .setOrigin(0.5).setInteractive().on('pointerdown', () => this.setLevel('hard'));

        this.settingsGroup.addMultiple([bg, text, btnEasy, btnNormal, btnHard]);
        this.settingsGroup.setVisible(false);
    }

    toggleSettings() {
        this.settingsGroup.setVisible(!this.settingsGroup.getChildren()[0].visible);
    }

    setLevel(level) {
        play.level = level;
        this.scene.restart();
    }
}
