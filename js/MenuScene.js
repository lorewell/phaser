class MenuScene extends Phaser.Scene {
    constructor() {
        super('MenuScene');
    }

    preload() {
        this.load.audio('bgm', 'music/bg.mp3');
    }

    create() {
        this.cameras.main.setBackgroundColor('#2c1e14');

        // 背景音乐：全局唯一，场景切换后继续播放
        if (!this.sound.get('bgm')) {
            this.bgm = this.sound.add('bgm', {
                loop  : true,
                volume: audioConfig.muted ? 0 : audioConfig.bgmVolume
            });
            this.bgm.play();
        } else {
            this.bgm = this.sound.get('bgm');
            this.bgm.setVolume(audioConfig.muted ? 0 : audioConfig.bgmVolume);
        }

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

        const bg = this.add.rectangle(cx, panelY, 340, 120, 0x1a1a1a, 0.85);

        // 难度设置
        const diffText = this.add.text(cx, panelY - 38, '当前难度: ' + play.level.toUpperCase(), {
            fontSize: '16px', color: '#aaaaaa', fontFamily: 'Zpix, monospace'
        }).setOrigin(0.5);

        const btnEasy   = this.add.text(cx - 90, panelY - 16, '[简单]', { fontSize: '18px', color: play.level === 'simple' ? '#ffdd00' : '#ffffff', fontFamily: 'Zpix, monospace' })
            .setOrigin(0.5).setInteractive().on('pointerdown', () => this.setLevel('simple'));
        const btnNormal = this.add.text(cx,       panelY - 16, '[普通]', { fontSize: '18px', color: play.level === 'normal' ? '#ffdd00' : '#ffffff', fontFamily: 'Zpix, monospace' })
            .setOrigin(0.5).setInteractive().on('pointerdown', () => this.setLevel('normal'));
        const btnHard   = this.add.text(cx + 90,  panelY - 16, '[困难]', { fontSize: '18px', color: play.level === 'hard'   ? '#ffdd00' : '#ffffff', fontFamily: 'Zpix, monospace' })
            .setOrigin(0.5).setInteractive().on('pointerdown', () => this.setLevel('hard'));

        // 音量设置标签
        const volLabel = this.add.text(cx - 120, panelY + 16, '音乐音量:', {
            fontSize: '16px', color: '#aaaaaa', fontFamily: 'Zpix, monospace'
        }).setOrigin(0, 0.5);

        // 滑条轨道
        const trackW = 140, trackX = cx - 10, trackY = panelY + 16;
        const track = this.add.rectangle(trackX, trackY, trackW, 4, 0x555555).setOrigin(0, 0.5);

        // 滑条填充（随音量变化）
        const fill = this.add.rectangle(trackX, trackY, trackW * audioConfig.bgmVolume, 4, 0xd4a355).setOrigin(0, 0.5);

        // 滑块手柄
        const knobX = trackX + trackW * audioConfig.bgmVolume;
        const knob = this.add.circle(knobX, trackY, 8, 0xf0d9b5)
            .setInteractive({ useHandCursor: true, draggable: true });
        this.input.setDraggable(knob);

        // 音量百分比文字
        const volNum = this.add.text(trackX + trackW + 14, trackY, Math.round(audioConfig.bgmVolume * 100) + '%', {
            fontSize: '14px', color: '#ffffff', fontFamily: 'Zpix, monospace'
        }).setOrigin(0, 0.5);

        knob.on('drag', (pointer, dragX) => {
            const clampedX = Phaser.Math.Clamp(dragX, trackX, trackX + trackW);
            const vol = (clampedX - trackX) / trackW;
            knob.setPosition(clampedX, trackY);
            fill.setSize(clampedX - trackX, 4);
            audioConfig.bgmVolume = vol;
            audioConfig.muted = false;
            volNum.setText(Math.round(vol * 100) + '%');
            // 实时更新音乐音量
            const bgm = this.sound.get('bgm');
            if (bgm) bgm.setVolume(vol);
        });

        this.settingsGroup.addMultiple([bg, diffText, btnEasy, btnNormal, btnHard, volLabel, track, fill, knob, volNum]);
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
