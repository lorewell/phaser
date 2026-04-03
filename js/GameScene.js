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

        this.selectedPiece = null;
        this.dots = []; // 用于显示可行走点的点阵
        
        this.initChessData();
        this.initChessPieces();
        this.createUndoButton();
    }

    createUndoButton() {
        const x = 400;
        const y = 500;
        
        // 绘制像素圆形按钮背景
        const btnBg = this.add.circle(x, y, 25, 0x4a3728);
        btnBg.setStrokeStyle(2, 0xffffff);
        btnBg.setInteractive({ useHandCursor: true });
        
        const btnText = this.add.text(x, y, '悔', {
            fontSize: '24px',
            color: '#ffffff',
            fontFamily: 'monospace'
        }).setOrigin(0.5);

        btnBg.on('pointerover', () => btnBg.setFillStyle(0x634a3a));
        btnBg.on('pointerout', () => btnBg.setFillStyle(0x4a3728));
        btnBg.on('pointerdown', () => this.undo());
    }

    undo() {
        if (play.history.length === 0) return;
        
        // 如果是 PVE 模式且当前是玩家回合，点击悔棋需要连退两步（AI 的一步和玩家的一步）
        // 如果只有一步（AI还没走），则退一步
        const stepsToUndo = (play.mode === 'player_vs_ai' && play.history.length >= 2) ? 2 : 1;
        
        for (let i = 0; i < stepsToUndo; i++) {
            if (play.history.length === 0) break;
            const lastMove = play.history.pop();
            this.executeUndo(lastMove);
        }
    }

    executeUndo(move) {
        const { key, from, to, eaten } = move;
        const man = play.mans[key];
        
        // 1. 逻辑回退
        play.map[to.y][to.x] = eaten ? eaten.key : null;
        play.map[from.y][from.x] = key;
        man.x = from.x;
        man.y = from.y;
        
        // 2. 视觉回退
        const piece = this.piecesMap[key];
        piece.setData('lx', from.x);
        piece.setData('ly', from.y);
        piece.setPosition(
            this.OFFSET_X + from.x * this.CELL_SIZE,
            this.OFFSET_Y + from.y * this.CELL_SIZE
        );
        
        // 3. 恢复被吃的棋子
        if (eaten) {
            const side = eaten.key === eaten.key.toLowerCase() ? 'r' : 'b';
            const type = eaten.key[0].toLowerCase();
            this.addPieceToBoard(to.x, to.y, `${side}_${type}`, eaten.key);
        }
        
        play.my = -play.my; // 切换回上一步的行动方
        
        // 清理状态
        if (this.selectedPiece) this.selectedPiece.clearTint();
        this.selectedPiece = null;
        this.dots.forEach(d => d.destroy());
        this.dots = [];
    }

    initChessData() {
        play.map = this.getInitialMap();
        // 为每个位置分配唯一 ID 方案 (c0, m0, etc)
        const counts = {};
        for (let y = 0; y < 10; y++) {
            for (let x = 0; x < 9; x++) {
                let char = play.map[y][x];
                if (char) {
                    let id = char + (counts[char] || 0);
                    play.map[y][x] = id;
                    counts[char] = (counts[char] || 0) + 1;
                }
            }
        }
        play.initMans(play.map);
        play.my = 1; // 红方先手
    }

    initChessPieces() {
        const map = play.map;
        // 清理旧棋子
        if (this.piecesMap) {
            Object.values(this.piecesMap).forEach(p => p.destroy());
        }
        this.piecesMap = {};
        
        for (let y = 0; y < map.length; y++) {
            for (let x = 0; x < map[y].length; x++) {
                const key = map[y][x];
                if (key) {
                    const isRed = key === key.toLowerCase();
                    const side = isRed ? 'r' : 'b';
                    const type = key[0].toLowerCase();
                    const textureKey = `${side}_${type}`;
                    this.addPieceToBoard(x, y, textureKey, key);
                }
            }
        }
    }

    addPieceToBoard(lx, ly, textureKey, key) {
        const x = this.OFFSET_X + lx * this.CELL_SIZE;
        const y = this.OFFSET_Y + ly * this.CELL_SIZE;
        const piece = this.add.sprite(x, y, textureKey);
        piece.setScale(this.PIECE_SCALE);
        piece.setInteractive();
        piece.setData('lx', lx);
        piece.setData('ly', ly);
        piece.setData('key', key);
        
        piece.on('pointerdown', () => this.onPieceClicked(piece));
        this.piecesMap[key] = piece;
    }

    onPieceClicked(piece) {
        if (play.my === 1) {
            // 当前是红方回合
            const isRed = piece.getData('key') === piece.getData('key').toLowerCase();
            if (isRed) {
                this.selectPiece(piece);
            } else if (this.selectedPiece) {
                this.attemptMove(this.selectedPiece, piece.getData('lx'), piece.getData('ly'));
            }
        } else {
            // 当前是蓝方回合
            const isBlue = piece.getData('key') === piece.getData('key').toUpperCase();
            if (isBlue) {
                this.selectPiece(piece);
            } else if (this.selectedPiece) {
                this.attemptMove(this.selectedPiece, piece.getData('lx'), piece.getData('ly'));
            }
        }
    }

    selectPiece(piece) {
        if (this.selectedPiece) this.selectedPiece.clearTint();
        this.selectedPiece = piece;
        piece.setTint(0xffff00);
        this.showDots(piece);
    }

    showDots(piece) {
        this.dots.forEach(d => d.destroy());
        this.dots = [];
        const man = play.mans[piece.getData('key')];
        const moves = man.bl(play.map);
        moves.forEach(([lx, ly]) => {
            const x = this.OFFSET_X + lx * this.CELL_SIZE;
            const y = this.OFFSET_Y + ly * this.CELL_SIZE;
            const dot = this.add.circle(x, y, 5, 0x00ff00, 0.5);
            dot.setInteractive();
            dot.on('pointerdown', () => this.attemptMove(this.selectedPiece, lx, ly));
            this.dots.push(dot);
        });
    }

    attemptMove(piece, nlx, nly) {
        const key = piece.getData('key');
        const man = play.mans[key];
        const moves = man.bl(play.map);
        
        const isLegal = moves.some(([x, y]) => x === nlx && y === nly);
        if (isLegal) {
            this.movePiece(key, nlx, nly);
        }
    }

    movePiece(key, nlx, nly) {
        const man = play.mans[key];
        const olx = man.x;
        const oly = man.y;
        
        const targetKey = play.map[nly][nlx];
        
        // 记录历史记录以便悔棋
        play.history.push({
            key: key,
            from: { x: olx, y: oly },
            to: { x: nlx, y: nly },
            eaten: targetKey ? { key: targetKey } : null
        });

        if (targetKey) {
            this.piecesMap[targetKey].destroy();
            delete this.piecesMap[targetKey];
            if (targetKey.toLowerCase().indexOf('j') === 0) {
                alert(play.my === 1 ? "红方获胜！" : "蓝方获胜！");
                location.reload();
            }
        }
        
        play.map[oly][olx] = null;
        play.map[nly][nlx] = key;
        man.x = nlx;
        man.y = nly;
        
        const piece = this.piecesMap[key];
        piece.setData('lx', nlx);
        piece.setData('ly', nly);
        this.tweens.add({
            targets: piece,
            x: this.OFFSET_X + nlx * this.CELL_SIZE,
            y: this.OFFSET_Y + nly * this.CELL_SIZE,
            duration: 250,
            ease: 'Power2',
            onComplete: () => {
                this.endTurn();
            }
        });

        if (this.selectedPiece) this.selectedPiece.clearTint();
        this.selectedPiece = null;
        this.dots.forEach(d => d.destroy());
        this.dots = [];
    }

    endTurn() {
        play.my = -play.my;
        if (play.mode === 'player_vs_ai' && play.my === -1) {
            this.time.delayedCall(500, () => this.aiTurn());
        }
    }

    aiTurn() {
        if (play.mode !== 'player_vs_ai') return;
        const move = AI.init("");
        if (move) {
            const [ox, oy, nx, ny] = move;
            const key = play.map[oy][ox];
            this.movePiece(key, nx, ny);
        } else {
            alert("AI 认输，红方获胜！");
            this.scene.start('MenuScene');
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
        const canvasTexture = this.textures.createCanvas(key, size, size);
        const ctx = canvasTexture.context;

        ctx.fillStyle = outlineColor;
        this.fillPixelCircle(ctx, size / 2, size / 2, size / 2 - 1);

        ctx.fillStyle = bgColor;
        this.fillPixelCircle(ctx, size / 2, size / 2, size / 2 - 2);

        ctx.fillStyle = fontColor;
        const fontOffsetX = Math.floor((size - 7) / 2);
        const fontOffsetY = Math.floor((size - 7) / 2);

        for (let y = 0; y < 7; y++) {
            for (let x = 0; x < 7; x++) {
                if (fontMap[y][x] === "1") {
                    ctx.fillRect(fontOffsetX + x, fontOffsetY + y, 1, 1);
                }
            }
        }
        canvasTexture.refresh();
    }

    fillPixelCircle(ctx, x, y, radius) {
        for (let i = -radius; i <= radius; i++) {
            for (let j = -radius; j <= radius; j++) {
                if (i * i + j * j <= radius * radius) {
                    ctx.fillRect(x + i, y + j, 1, 1);
                }
            }
        }
    }

    generatePixelBoardTexture() {
        const size = 64;
        const texture = this.textures.createCanvas('pixel-board', size, size);
        const ctx = texture.context;

        ctx.fillStyle = '#b58863';
        ctx.fillRect(0, 0, size, size);

        ctx.fillStyle = '#f0d9b5';
        for (let y = 0; y < size; y += 8) {
            for (let x = 0; x < size; x += 8) {
                if ((x / 8 + y / 8) % 2 === 0) {
                    ctx.fillRect(x, y, 8, 8);
                }
            }
        }
        texture.refresh();
    }
}