class MenuScene extends Phaser.Scene {
    constructor() {
        super('MenuScene');
    }

    create() {
        this.cameras.main.setBackgroundColor('#2c1e14');
        
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        // 标题
        this.add.text(width / 2, 100, 'PIXEL CHESS', {
            fontSize: '40px',
            color: '#f0d9b5',
            fontStyle: 'bold',
            fontFamily: 'monospace'
        }).setOrigin(0.5);

        // 菜单选项
        this.createMenuItem(width / 2, 250, '本地双人对战', () => {
            play.mode = 'player_vs_player';
            this.scene.start('GameScene');
        });

        this.createMenuItem(width / 2, 320, '玩家对奏电脑', () => {
            play.mode = 'player_vs_ai';
            this.scene.start('GameScene');
        });

        this.createMenuItem(width / 2, 390, '游戏设置 (难度)', () => {
            this.toggleSettings();
        });

        // 设置面板 (初始隐藏)
        this.setupSettingsPanel();
    }

    createMenuItem(x, y, text, callback) {
        const bg = this.add.rectangle(x, y, 280, 50, 0x4a3728)
            .setInteractive({ useHandCursor: true })
            .on('pointerover', () => bg.setFillStyle(0x634a3a))
            .on('pointerout', () => bg.setFillStyle(0x4a3728))
            .on('pointerdown', callback);

        this.add.text(x, y, text, {
            fontSize: '20px',
            color: '#ffffff',
            fontFamily: 'monospace'
        }).setOrigin(0.5);
    }

    setupSettingsPanel() {
        this.settingsGroup = this.add.group();
        const width = this.cameras.main.width;
        
        const bg = this.add.rectangle(width / 2, 480, 320, 60, 0x1a1a1a, 0.8);
        const text = this.add.text(width / 2, 460, '当前难度: ' + play.level.toUpperCase(), {
            fontSize: '14px',
            color: '#aaaaaa'
        }).setOrigin(0.5);

        const btnEasy = this.add.text(width/2 - 80, 490, '[简单]', { color: play.level === 'simple' ? '#ff0000' : '#ffffff' })
            .setInteractive().on('pointerdown', () => this.setLevel('simple'));
        const btnNormal = this.add.text(width/2, 490, '[普通]', { color: play.level === 'normal' ? '#ff0000' : '#ffffff' })
            .setInteractive().on('pointerdown', () => this.setLevel('normal'));
        const btnHard = this.add.text(width/2 + 80, 490, '[困难]', { color: play.level === 'hard' ? '#ff0000' : '#ffffff' })
            .setInteractive().on('pointerdown', () => this.setLevel('hard'));

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
