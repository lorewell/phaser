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
        const fontSize = Math.round(isMobile ? 18 : 22 * scaleFactor);
        const titleSize = Math.round(isMobile ? 26 : 34 * scaleFactor);
        const btnWidth = Math.min(width * 0.85, isMobile ? 240 : 280);
        const btnHeight = isMobile ? 46 : 50;
        const btnGap = isMobile ? height * 0.12 : height * 0.11;

        // === 装饰性像素元素 ===
        
        // 角落装饰 L 形
        this.drawCornerDecor(width, height, isMobile ? 12 : 20);
        
        // 标题区域背景
        const titleBgY = isMobile ? height * 0.14 : height * 0.16;
        const titleBgH = isMobile ? 60 : 70;
        const titleBg = this.add.rectangle(cx, titleBgY, btnWidth * 1.2, titleBgH, 0x1a1208, 0.6);
        
        // 装饰性分隔线（像素风格）
        const lineY = isMobile ? height * 0.28 : height * 0.26;
        this.drawPixelDivider(cx, lineY, btnWidth);

        // 标题
        this.add.text(cx, titleBgY, 'PIXEL CHESS', {
            fontSize: titleSize + 'px',
            color: '#f0d9b5',
            fontStyle: 'bold',
            fontFamily: 'Zpix, monospace',
            stroke: '#3d2510',
            strokeThickness: 4
        }).setOrigin(0.5);

        // 标题下方小装饰
        this.drawTitleDecor(cx, titleBgY + titleBgH/2 + 8, isMobile);

        // 菜单选项
        const menuStartY = isMobile ? height * 0.40 : height * 0.42;
        
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

    drawCornerDecor(width, height, size) {
        const decor = this.add.graphics();
        const color = 0x5c3d2e;
        
        // 四个角落 L 形装饰
        const corners = [
            { x: 0, y: 0, flip: 1 },           // 左上
            { x: width, y: 0, flip: 2 },       // 右上
            { x: 0, y: height, flip: 3 },      // 左下
            { x: width, y: height, flip: 4 }   // 右下
        ];
        
        corners.forEach(c => {
            const offsetX = c.x === 0 ? 10 : -10;
            const offsetY = c.y === 0 ? 10 : -10;
            
            for (let i = 0; i < size; i++) {
                // 横线
                decor.fillStyle(color, 0.3 - i * 0.015);
                decor.fillRect(c.x + (c.x === 0 ? 0 : -i - 4), c.y + offsetY, i + 4, 2);
                // 竖线
                decor.fillRect(c.x + offsetX, c.y + (c.y === 0 ? 0 : -i - 4), 2, i + 4);
            }
        });
    }

    drawPixelDivider(x, y, width) {
        const g = this.add.graphics();
        const lineW = Math.min(width * 0.85, 260);
        const color = 0x8b7355;
        
        // 主线条
        g.fillStyle(color, 0.5);
        g.fillRect(x - lineW/2, y - 1, lineW, 2);
        
        // 两端小方块装饰
        for (let i = 0; i < 3; i++) {
            g.fillStyle(0xd4a355, 0.8);
            g.fillRect(x - lineW/2 - 8 + i * 4, y - 3, 3, 6);
            g.fillRect(x + lineW/2 + 5 - i * 4, y - 3, 3, 6);
        }
    }

    drawTitleDecor(x, y, isMobile) {
        const g = this.add.graphics();
        const spacing = isMobile ? 6 : 8;
        const dotSize = isMobile ? 2 : 3;
        
        // 中间菱形
        g.fillStyle(0xd4a355, 0.7);
        g.fillRect(x - dotSize, y - dotSize, dotSize * 2, dotSize * 2);
        
        // 左右各三个点
        for (let i = 1; i <= 3; i++) {
            const alpha = 0.6 - i * 0.15;
            g.fillStyle(0x8b7355, alpha);
            g.fillRect(x - spacing * (i + 1), y - 1, dotSize, dotSize * 2);
            g.fillRect(x + spacing * (i + 1) - dotSize, y - 1, dotSize, dotSize * 2);
        }
    }

    drawPixelBackground() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        const isMobile = width < 450;

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
        
        // 顶部渐变
        const topFade = this.add.graphics();
        for (let i = 0; i < 60; i++) {
            topFade.fillStyle(0x1a1208, 1 - i / 60);
            topFade.fillRect(0, i, width, 1);
        }

        // 底部渐变
        const bottomFade = this.add.graphics();
        for (let i = 0; i < 60; i++) {
            bottomFade.fillStyle(0x1a1208, i / 60);
            bottomFade.fillRect(0, height - 60 + i, width, 1);
        }
    }

    createMenuItem(x, y, w, h, text, callback) {
        const bg = this.add.rectangle(x, y, w, h, 0x4a3728)
            .setInteractive({ useHandCursor: true });

        // 像素边框效果（初始隐藏）
        const borderG = this.add.graphics();
        borderG.lineStyle(2, 0xd4a355, 0);
        borderG.strokeRect(x - w/2 + 2, y - h/2 + 2, w - 4, h - 4);
        borderG.setDepth(1);

        // 按钮上的像素高光
        const highlight = this.add.graphics();
        highlight.fillStyle(0xf0d9b5, 0.05);
        highlight.fillRect(x - w/2 + 4, y - h/2 + 4, w - 8, 4);
        highlight.setDepth(1);

        bg.on('pointerover', () => {
            bg.setFillStyle(0x5c4a38);
            borderG.clear();
            borderG.lineStyle(2, 0xd4a355, 0.8);
            borderG.strokeRect(x - w/2 + 2, y - h/2 + 2, w - 4, h - 4);
        });

        bg.on('pointerout', () => {
            bg.setFillStyle(0x4a3728);
            borderG.clear();
            borderG.lineStyle(2, 0xd4a355, 0);
            borderG.strokeRect(x - w/2 + 2, y - h/2 + 2, w - 4, h - 4);
        });

        bg.on('pointerdown', () => {
            bg.setFillStyle(0x6b5a48);
            highlight.clear();
            highlight.fillStyle(0xf0d9b5, 0.1);
            highlight.fillRect(x - w/2 + 4, y - h/2 + 4, w - 8, 4);
            callback();
        });

        this.add.text(x, y, text, {
            fontSize: '20px',
            color: '#f0d9b5',
            fontFamily: 'Zpix, monospace'
        }).setOrigin(0.5).setDepth(2);
    }

    setupSettingsPanel(isMobile, scaleFactor) {
        this.settingsGroup = this.add.group();
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        const cx = width / 2;

        const panelW = Math.min(width * 0.9, isMobile ? 280 : 320);
        const panelH = isMobile ? 100 : 120;
        const panelY = isMobile ? height * 0.68 : height * 0.72;

        // 面板背景（带像素边框）
        const bg = this.add.rectangle(cx, panelY, panelW, panelH, 0x1a1a1a, 0.95);
        const panelBorder = this.add.graphics();
        panelBorder.lineStyle(2, 0x5c3d2e, 0.6);
        panelBorder.strokeRect(cx - panelW/2, panelY - panelH/2, panelW, panelH);

        const fontSize = isMobile ? '14px' : '16px';
        const btnFontSize = isMobile ? '14px' : '16px';
        const diffY = panelY - panelH * 0.28;
        const btnY = panelY - panelH * 0.05;
        const volY = panelY + panelH * 0.28;

        // 难度设置
        const diffText = this.add.text(cx, diffY, '难度: ' + play.level.toUpperCase(), {
            fontSize: fontSize, color: '#aaaaaa', fontFamily: 'Zpix, monospace'
        }).setOrigin(0.5);

        const btnGap = isMobile ? 55 : 70;
        const btnEasy   = this.add.text(cx - btnGap, btnY, '[简单]', { fontSize: btnFontSize, color: play.level === 'simple' ? '#ffdd00' : '#888888', fontFamily: 'Zpix, monospace' })
            .setOrigin(0.5).setInteractive().on('pointerdown', () => this.setLevel('simple'));
        const btnNormal = this.add.text(cx, btnY, '[普通]', { fontSize: btnFontSize, color: play.level === 'normal' ? '#ffdd00' : '#888888', fontFamily: 'Zpix, monospace' })
            .setOrigin(0.5).setInteractive().on('pointerdown', () => this.setLevel('normal'));
        const btnHard   = this.add.text(cx + btnGap, btnY, '[困难]', { fontSize: btnFontSize, color: play.level === 'hard' ? '#ffdd00' : '#888888', fontFamily: 'Zpix, monospace' })
            .setOrigin(0.5).setInteractive().on('pointerdown', () => this.setLevel('hard'));

        if (isMobile) {
            bg.setSize(panelW, panelH * 0.55);
        } else {
            // 音量设置标签
            const volLabel = this.add.text(cx - 100, volY, '音量:', {
                fontSize: fontSize, color: '#888888', fontFamily: 'Zpix, monospace'
            }).setOrigin(0, 0.5);

            // 滑条轨道（像素风格）
            const trackW = 120, trackX = cx - 30, trackY = volY;
            const track = this.add.rectangle(trackX, trackY, trackW, 6, 0x3d2a1a).setOrigin(0, 0.5);

            // 滑条填充
            const fill = this.add.rectangle(trackX, trackY, trackW * audioConfig.bgmVolume, 6, 0xd4a355).setOrigin(0, 0.5);

            // 滑块手柄（像素方块）
            const knobX = trackX + trackW * audioConfig.bgmVolume;
            const knob = this.add.rectangle(knobX, trackY, 14, 14, 0xf0d9b5)
                .setInteractive({ useHandCursor: true, draggable: true });

            // 音量百分比
            const volNum = this.add.text(trackX + trackW + 16, trackY, Math.round(audioConfig.bgmVolume * 100) + '%', {
                fontSize: '14px', color: '#cccccc', fontFamily: 'Zpix, monospace'
            }).setOrigin(0, 0.5);

            knob.on('drag', (pointer, dragX) => {
                const clampedX = Phaser.Math.Clamp(dragX, trackX, trackX + trackW);
                const vol = (clampedX - trackX) / trackW;
                knob.setPosition(clampedX, trackY);
                fill.setSize(clampedX - trackX, 6);
                audioConfig.bgmVolume = vol;
                audioConfig.muted = false;
                volNum.setText(Math.round(vol * 100) + '%');
                const bgm = this.sound.get('bgm');
                if (bgm) bgm.setVolume(vol);
            });

            this.settingsGroup.addMultiple([volLabel, track, fill, knob, volNum]);
        }

        this.settingsGroup.addMultiple([bg, panelBorder, diffText, btnEasy, btnNormal, btnHard]);
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
