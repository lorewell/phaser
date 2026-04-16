class MenuScene extends Phaser.Scene {
    constructor() {
        super('MenuScene');
    }

    preload() {
        this.load.audio('bgm', 'music/bg.mp3');
    }

    create() {
        this.cameras.main.setBackgroundColor('#1a1208');

        // 计算缩放比例
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        const scaleFactor = Math.min(width / BASE_WIDTH, height / BASE_HEIGHT);
        const isMobile = width < 450;

        // 绘制像素风格背景
        this.drawPixelBackground();

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

        const cx = width / 2;

        // 响应式尺寸
        const fontSize = Math.round(isMobile ? 20 : 24 * scaleFactor);
        const titleSize = Math.round(isMobile ? 28 : 36 * scaleFactor);
        const btnWidth = Math.min(width * 0.85, isMobile ? 260 : 280);
        const btnHeight = isMobile ? 48 : 50;
        const btnGap = isMobile ? height * 0.13 : height * 0.12;

        // 装饰性分隔线
        const lineY = isMobile ? height * 0.28 : height * 0.26;
        this.add.rectangle(cx, lineY, btnWidth * 0.9, 3, 0x8b7355).setAlpha(0.6);
        
        // 小装饰方块
        for (let i = 0; i < 3; i++) {
            this.add.rectangle(cx - 8 + i * 8, lineY, 4, 4, 0xd4a355);
        }

        // 标题
        this.add.text(cx, isMobile ? height * 0.16 : height * 0.18, 'PIXEL CHESS', {
            fontSize: titleSize + 'px',
            color: '#f0d9b5',
            fontStyle: 'bold',
            fontFamily: 'Zpix, monospace',
            stroke: '#5c3d2e',
            strokeThickness: 3
        }).setOrigin(0.5).setShadow(2, 2, '#000000', 2);

        // 菜单选项
        const menuStartY = isMobile ? height * 0.38 : height * 0.40;
        
        this.createMenuItem(cx, menuStartY, btnWidth, btnHeight, '玩家对战电脑', () => {
            play.mode = 'player_vs_ai';
            this.scene.start('GameScene');
        });

        this.createMenuItem(cx, menuStartY + btnGap, btnWidth, btnHeight, '本地双人对战', () => {
            play.mode = 'player_vs_player';
            this.scene.start('GameScene');
        });

        this.createMenuItem(cx, menuStartY + btnGap * 2, btnWidth, btnHeight, '游戏设置', () => {
            this.toggleSettings();
        });

        // 设置面板 (初始隐藏)
        this.setupSettingsPanel(isMobile, scaleFactor);
    }

    drawPixelBackground() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        const isMobile = width < 450;

        // 绘制棋盘格背景
        const graphics = this.add.graphics();
        const tileSize = isMobile ? 16 : 20;
        
        // 深色木纹底
        graphics.fillStyle(0x2c1e14, 1);
        graphics.fillRect(0, 0, width, height);
        
        // 棋盘格纹理
        for (let y = 0; y < height; y += tileSize) {
            for (let x = 0; x < width; x += tileSize) {
                const isEven = ((x / tileSize) + (y / tileSize)) % 2 === 0;
                graphics.fillStyle(isEven ? 0x3d2a1a : 0x352417, 1);
                graphics.fillRect(x, y, tileSize, tileSize);
            }
        }
        
        // 顶部渐变（柔和过渡）
        const topFade = this.add.graphics();
        for (let i = 0; i < 60; i++) {
            topFade.fillStyle(0x1a1208, 1 - i / 60);
            topFade.fillRect(0, i, width, 1);
        }

        // 底部渐变（柔和过渡）
        const bottomFade = this.add.graphics();
        for (let i = 0; i < 60; i++) {
            bottomFade.fillStyle(0x1a1208, i / 60);
            bottomFade.fillRect(0, height - 60 + i, width, 1);
        }
    }

    createMenuItem(x, y, w, h, text, callback) {
        const bg = this.add.rectangle(x, y, w, h, 0x4a3728)
            .setInteractive({ useHandCursor: true })
            .on('pointerover', () => {
                bg.setFillStyle(0x634a3a);
                bg.setStrokeStyle(2, 0xd4a355);
            })
            .on('pointerout', () => {
                bg.setFillStyle(0x4a3728);
                bg.setStrokeStyle(0);
            })
            .on('pointerdown', () => {
                bg.setFillStyle(0x8b7355);
                callback();
            });

        this.add.text(x, y, text, {
            fontSize: '22px',
            color: '#f0d9b5',
            fontFamily: 'Zpix, monospace'
        }).setOrigin(0.5);
    }

    setupSettingsPanel(isMobile, scaleFactor) {
        this.settingsGroup = this.add.group();
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        const cx = width / 2;

        const panelW = Math.min(width * 0.9, isMobile ? 300 : 340);
        const panelH = isMobile ? 110 : 120;
        const panelY = isMobile ? height * 0.68 : height * 0.73;

        const bg = this.add.rectangle(cx, panelY, panelW, panelH, 0x1a1a1a, 0.9);

        const fontSize = isMobile ? '14px' : '16px';
        const btnFontSize = isMobile ? '16px' : '18px';
        const diffY = panelY - panelH * 0.3;
        const btnY = panelY - panelH * 0.08;
        const volY = panelY + panelH * 0.25;

        // 难度设置
        const diffText = this.add.text(cx, diffY, '难度: ' + play.level.toUpperCase(), {
            fontSize: fontSize, color: '#aaaaaa', fontFamily: 'Zpix, monospace'
        }).setOrigin(0.5);

        const btnGap = isMobile ? 70 : 80;
        const btnEasy   = this.add.text(cx - btnGap, btnY, '[简单]', { fontSize: btnFontSize, color: play.level === 'simple' ? '#ffdd00' : '#ffffff', fontFamily: 'Zpix, monospace' })
            .setOrigin(0.5).setInteractive().on('pointerdown', () => this.setLevel('simple'));
        const btnNormal = this.add.text(cx, btnY, '[普通]', { fontSize: btnFontSize, color: play.level === 'normal' ? '#ffdd00' : '#ffffff', fontFamily: 'Zpix, monospace' })
            .setOrigin(0.5).setInteractive().on('pointerdown', () => this.setLevel('normal'));
        const btnHard   = this.add.text(cx + btnGap, btnY, '[困难]', { fontSize: btnFontSize, color: play.level === 'hard' ? '#ffdd00' : '#ffffff', fontFamily: 'Zpix, monospace' })
            .setOrigin(0.5).setInteractive().on('pointerdown', () => this.setLevel('hard'));

        if (isMobile) {
            // 手机端隐藏音量设置
            bg.setSize(panelW, panelH * 0.5);
        } else {
            // 音量设置标签
            const volLabel = this.add.text(cx - 120, volY, '音乐音量:', {
                fontSize: fontSize, color: '#aaaaaa', fontFamily: 'Zpix, monospace'
            }).setOrigin(0, 0.5);

            // 滑条轨道
            const trackW = 140, trackX = cx - 10, trackY = volY;
            const track = this.add.rectangle(trackX, trackY, trackW, 4, 0x555555).setOrigin(0, 0.5);

            // 滑条填充
            const fill = this.add.rectangle(trackX, trackY, trackW * audioConfig.bgmVolume, 4, 0xd4a355).setOrigin(0, 0.5);

            // 滑块手柄
            const knobX = trackX + trackW * audioConfig.bgmVolume;
            const knob = this.add.circle(knobX, trackY, 8, 0xf0d9b5)
                .setInteractive({ useHandCursor: true, draggable: true });
            this.input.setDraggable(knob);

            // 音量百分比
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
                const bgm = this.sound.get('bgm');
                if (bgm) bgm.setVolume(vol);
            });

            this.settingsGroup.addMultiple([volLabel, track, fill, knob, volNum]);
        }

        this.settingsGroup.addMultiple([bg, diffText, btnEasy, btnNormal, btnHard]);
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
