class GameScene extends Phaser.Scene {
    constructor() {
        super('GameScene');
        // 逻辑坐标与像素坐标的映射常量
        this.CELL_SIZE = 45;    // 格子大小
        this.OFFSET_X = 45;     // 棋盘留白
        this.OFFSET_Y = 50;     // 棋盘留白
        this.PIECE_SIZE = 20;   // 棋子生成时的原始像素大小（放大前）
        this.PIECE_SCALE = 2;   // 棋子在场景中的放大倍数
        this.piecesMap = {}; // 用于存放场景中的棋子实例，方便后续移动
    }

    preload() {
        // --- 核心步骤：直接生成像素纹理 ---
        // 我们不需要 this.load.image 了，直接在 preload 里画图
        this.generatePixelBoardTexture();
        this.generatePixelPieceTextures();
    }

    getInitialMap() {
        return [
            ['C', 'M', 'X', 'S', 'J', 'S', 'X', 'M', 'C'],
            [null, null, null, null, null, null, null, null, null],
            [null, 'P', null, null, null, null, null, 'P', null],
            ['Z', null, 'Z', null, 'Z', null, 'Z', null, 'Z'],
            [null, null, null, null, null, null, null, null, null],
            [null, null, null, null, null, null, null, null, null],
            ['z', null, 'z', null, 'z', null, 'z', null, 'z'],
            [null, 'p', null, null, null, null, null, 'p', null],
            [null, null, null, null, null, null, null, null, null],
            ['c', 'm', 'x', 's', 'j', 's', 'x', 'm', 'c']
        ];
    }

    create() {
        this.cameras.main.setBackgroundColor('#2c1e14');

        this.board = this.add.image(this.OFFSET_X - 22, this.OFFSET_Y - 25, 'pixel-board');
        this.board.setOrigin(0);
        this.board.setScale(3); // 放大棋盘原图
        this.board.setTint(0xcccccc); // 稍微调暗一点占位图

        this.initChessPieces();
    }

    initChessPieces() {
        const map = this.getInitialMap();
        
        for (let y = 0; y < map.length; y++) {
            for (let x = 0; x < map[y].length; x++) {
                const key = map[y][x];
                if (key) {
                    // 解析 key: 大写是蓝方(b)，小写是红方(r)
                    const isRed = key[0] === key[0].toLowerCase();
                    const side = isRed ? 'r' : 'b';
                    const type = key[0].toLowerCase(); // 取 c, m, x 等类型
                    
                    const textureKey = `${side}_${type}`;
                    this.createPiece(x, y, textureKey);
                }
            }
        }
    }

    // --- 过程生成：棋子纹理 ---
    generatePixelPieceTextures() {
        // 定义红蓝方颜色
        const redColor = '#cc0000';
        const blueColor = '#0000cc';
        const outlineColor = '#ffffff'; // 像素轮廓颜色
        const fontColor = '#ffffff';    // 汉字颜色

        // 定义要生成的棋子类型
        const piecesData = [
            { key: 'c', text: '车' }, { key: 'm', text: '马' }, { key: 'x', text: '相' },
            { key: 's', text: '仕' }, { key: 'j', text: '将' }, { key: 'p', text: '炮' }, { key: 'z', text: '兵' }
        ];

        // 简化版的 7x7 像素汉字点阵定义 (1表示有色，0表示无色)
        // 这些是像素象棋最迷人的地方：极简的表达
        const pixelFonts = {
            '车': [
                "0111110",
                "0100010",
                "0111110",
                "0010100",
                "0111110",
                "0100010",
                "0111110"
            ],
            '马': [
                "0111100",
                "0100010",
                "0111100",
                "0111110",
                "0100010",
                "0100010",
                "0000011"
            ],
            '相': [
                "0101010",
                "1010101",
                "0111110",
                "0001000",
                "0111110",
                "1010101",
                "0101010"
            ],
            '仕': [
                "0001000",
                "0011100",
                "0001000",
                "0111110",
                "0001000",
                "0001000",
                "0010100"
            ],
            '将': [
                "0111110",
                "0100010",
                "0111110",
                "0010100",
                "0111110",
                "0101010",
                "0111110"
            ],
            '炮': [
                "0111110",
                "1010101",
                "0111110",
                "0010100",
                "0111110",
                "0101010",
                "0111110"
            ],
            '兵': [
                "0011100",
                "0010100",
                "0111110",
                "0010100",
                "0111110",
                "1010101",
                "0111110"
            ]
        };

        // 为红蓝双方生成所有棋子
        piecesData.forEach(p => {
            // 红方 ('r_c', 'r_m'...)
            this.drawSinglePixelPiece(`r_${p.key}`, redColor, outlineColor, fontColor, pixelFonts[p.text]);
            // 蓝方 ('b_c', 'b_m'...)
            this.drawSinglePixelPiece(`b_${p.key}`, blueColor, outlineColor, fontColor, pixelFonts[p.text]);
        });
    }

    // 辅助函数：在内存 Canvas 上绘制单个像素棋子
    drawSinglePixelPiece(key, bgColor, outlineColor, fontColor, fontMap) {
        const size = this.PIECE_SIZE;
        // 1. 创建一个临时的 CanvasTexture
        const canvasTexture = this.textures.createCanvas(key, size, size);
        const ctx = canvasTexture.context; // 获取底层 Canvas 2D 上下文

        // 2. 绘制像素轮廓 (一个像素圆圈)
        ctx.fillStyle = outlineColor;
        this.fillPixelCircle(ctx, size / 2, size / 2, size / 2 - 1);

        // 3. 绘制填充背景 (一个像素内圆)
        ctx.fillStyle = bgColor;
        this.fillPixelCircle(ctx, size / 2, size / 2, size / 2 - 2);

        // 4. 绘制汉字像素点阵
        ctx.fillStyle = fontColor;
        const fontOffsetX = Math.floor((size - 7) / 2); // 居中
        const fontOffsetY = Math.floor((size - 7) / 2); // 居中

        for (let y = 0; y < 7; y++) {
            for (let x = 0; x < 7; x++) {
                if (fontMap[y][x] === "1") {
                    // 画一个“像素点”（通常是1x1，这里用1x1的矩形模拟）
                    ctx.fillRect(fontOffsetX + x, fontOffsetY + y, 1, 1);
                }
            }
        }

        // 核心：告诉 Phaser 纹理已经改变，需要重新加载到 GPU
        canvasTexture.refresh();
    }

    // 绘制过程生成的像素圆
    fillPixelCircle(ctx, x, y, radius) {
        for (let i = -radius; i <= radius; i++) {
            for (let j = -radius; j <= radius; j++) {
                if (i * i + j * j <= radius * radius) {
                    ctx.fillRect(x + i, y + j, 1, 1);
                }
            }
        }
    }

    // --- 过程生成：棋盘 (占位用，直到你有真正的像素图) ---
    generatePixelBoardTexture() {
        const size = 64; // 生成一个很小的原图
        const texture = this.textures.createCanvas('pixel-board', size, size);
        const ctx = texture.context;

        ctx.fillStyle = '#b58863'; // 木色
        ctx.fillRect(0, 0, size, size);

        ctx.fillStyle = '#f0d9b5'; // 格子色
        for (let y = 0; y < size; y += 8) {
            for (let x = 0; x < size; x += 8) {
                if ((x / 8 + y / 8) % 2 === 0) {
                    ctx.fillRect(x, y, 8, 8);
                }
            }
        }
        texture.refresh();
    }

    // 辅助函数：在场景中添加一颗棋子精灵
    createPiece(lx, ly, textureKey) {
        const x = this.OFFSET_X + lx * this.CELL_SIZE;
        const y = this.OFFSET_Y + ly * this.CELL_SIZE;
        
        // 添加 Sprite，并应用放大倍数以产生粗颗粒像素感
        const piece = this.add.sprite(x, y, textureKey);
        piece.setScale(this.PIECE_SCALE); // 放大过程生成的原图
        
        // 添加像素点击效果
        piece.setInteractive();
        piece.on('pointerdown', () => {
            this.tweens.add({
                targets: piece,
                y: y - 10,
                duration: 100,
                yoyo: true,
                ease: 'Power1'
            });
            console.log(`点击了棋子: ${textureKey} at (${lx}, ${ly})`);
        });
    }
}