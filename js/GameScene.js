class GameScene extends Phaser.Scene {
    constructor() {
        super("GameScene");

        //  棋盘布局常量 ─
        // 格子大小（正方形，单位 px）
        this.CS = 46;
        // 外边距 = 格子的一半
        this.PAD = Math.floor(this.CS / 2); // 23
        // 棋盘交叉点列数 9、行数 10
        this.COLS = 9;
        this.ROWS = 10;
        // 游戏逻辑分辨率
        this.SCENE_W = 500;
        this.SCENE_H = 700;

        // 以下在 create() 中计算
        this.OFFSET_X = 0;
        this.OFFSET_Y = 0;
        this.PIECE_SIZE = this.CS - 4;

        this.piecesMap = {};
    }

    preload() {
        this.load.image("chess-piece", "image/chess.png");
    }

    getInitialMap() {
        return [
            ["C","M","X","S","J","S","X","M","C"],
            [null,null,null,null,null,null,null,null,null],
            [null,"P",null,null,null,null,null,"P",null],
            ["Z",null,"Z",null,"Z",null,"Z",null,"Z"],
            [null,null,null,null,null,null,null,null,null],
            [null,null,null,null,null,null,null,null,null],
            ["z",null,"z",null,"z",null,"z",null,"z"],
            [null,"p",null,null,null,null,null,"p",null],
            [null,null,null,null,null,null,null,null,null],
            ["c","m","x","s","j","s","x","m","c"]
        ];
    }

    create() {
        this.cameras.main.setBackgroundColor("#1a1008");

        const CS   = this.CS;
        const PAD  = this.PAD;
        const COLS = this.COLS;
        const ROWS = this.ROWS;

        const boardW = (COLS - 1) * CS;  // 8 * 46 = 368
        const boardH = (ROWS - 1) * CS;  // 9 * 46 = 414
        const totalW = boardW + PAD * 2; // 368 + 46 = 414
        const totalH = boardH + PAD * 2; // 414 + 46 = 460

        const boardX = Math.floor((this.SCENE_W - totalW) / 2); // 43
        const boardY = Math.floor((this.SCENE_H - totalH) / 2); // 120

        this.OFFSET_X = boardX + PAD; // 66
        this.OFFSET_Y = boardY + PAD; // 143

        this.drawBoard(boardX, boardY, boardW, boardH);

        this.selectedPiece = null;
        this.dots = [];

        this.initChessData();
        this.initChessPieces();
        this.createUndoButton();
    }

    drawBoard(boardX, boardY, boardW, boardH) {
        const { CS, PAD, COLS, ROWS, OFFSET_X, OFFSET_Y } = this;
        const LINE_W = 4;
        const g = this.add.graphics();

        // 1. 棋盘底色（棕色，含 padding）
        g.fillStyle(0xC89448, 1);
        g.fillRect(boardX, boardY, boardW + PAD * 2, boardH + PAD * 2);

        // 2. 外边框
        g.lineStyle(LINE_W, 0x5c3010, 1);
        g.strokeRect(OFFSET_X, OFFSET_Y, boardW, boardH);

        // 3. 横线 10 根
        for (let r = 0; r < ROWS; r++) {
            const y = OFFSET_Y + r * CS;
            g.beginPath();
            g.moveTo(OFFSET_X, y);
            g.lineTo(OFFSET_X + boardW, y);
            g.strokePath();
        }

        // 4. 竖线 9 根，中间 7 根楚河汉界处断开
        for (let c = 0; c < COLS; c++) {
            const x = OFFSET_X + c * CS;
            if (c === 0 || c === COLS - 1) {
                g.beginPath();
                g.moveTo(x, OFFSET_Y);
                g.lineTo(x, OFFSET_Y + boardH);
                g.strokePath();
            } else {
                g.beginPath();
                g.moveTo(x, OFFSET_Y);
                g.lineTo(x, OFFSET_Y + 4 * CS);
                g.strokePath();
                g.beginPath();
                g.moveTo(x, OFFSET_Y + 5 * CS);
                g.lineTo(x, OFFSET_Y + boardH);
                g.strokePath();
            }
        }

        // 5. 楚河汉界文字（行 4~5 之间，高度 = CS）
        const riverStyle = {
            fontSize   : Math.floor(CS * 0.50) + "px",
            color      : "#5c3010",
            fontFamily : "'Zpix', monospace",
            resolution : 2
        };
        const riverY = OFFSET_Y + 4 * CS;
        const halfW  = Math.floor(boardW / 2);

        this.add.text(
            OFFSET_X + halfW * 0.5,
            riverY + CS / 2,
            "楚  河",
            riverStyle
        ).setOrigin(0.5, 0.5);

        this.add.text(
            OFFSET_X + halfW + halfW * 0.5,
            riverY + CS / 2,
            "汉  界",
            riverStyle
        ).setOrigin(0.5, 0.5);

        // 6. 九宫斜线
        g.lineStyle(LINE_W, 0x5c3010, 1);
        this._drawDiag(g, 3, 5, 0, 2);
        this._drawDiag(g, 5, 3, 0, 2);
        this._drawDiag(g, 3, 5, 7, 9);
        this._drawDiag(g, 5, 3, 7, 9);

        // 7. 炮位 & 兵卒位标记
        [[1,2],[7,2],[1,7],[7,7]].forEach(([c,r]) => this._drawMark(g, c, r));
        [[0,3],[2,3],[4,3],[6,3],[8,3],
         [0,6],[2,6],[4,6],[6,6],[8,6]].forEach(([c,r]) => this._drawMark(g, c, r));
    }

    _drawDiag(g, c1, c2, r1, r2) {
        g.beginPath();
        g.moveTo(this.OFFSET_X + c1 * this.CS, this.OFFSET_Y + r1 * this.CS);
        g.lineTo(this.OFFSET_X + c2 * this.CS, this.OFFSET_Y + r2 * this.CS);
        g.strokePath();
    }

    _drawMark(g, col, row) {
        const { CS, OFFSET_X, OFFSET_Y, COLS, ROWS } = this;
        const mx = OFFSET_X + col * CS;
        const my = OFFSET_Y + row * CS;
        const len = 7, gap = 4;
        g.lineStyle(2, 0x5c3010, 1);
        const segs = [];
        if (col > 0)        segs.push([mx - gap - len, my,        mx - gap,        my       ]);
        if (col < COLS - 1) segs.push([mx + gap,        my,        mx + gap + len,  my       ]);
        if (row > 0)        segs.push([mx,        my - gap - len, mx,        my - gap       ]);
        if (row < ROWS - 1) segs.push([mx,        my + gap,        mx,        my + gap + len]);
        segs.forEach(([x1,y1,x2,y2]) => {
            g.beginPath(); g.moveTo(x1,y1); g.lineTo(x2,y2); g.strokePath();
        });
    }

    createUndoButton() {
        const x = this.SCENE_W / 2;
        const y = this.SCENE_H - 36;

        const btnBg = this.add.rectangle(x, y, 120, 40, 0x5c3010)
            .setStrokeStyle(3, 0xd4a355)
            .setInteractive({ useHandCursor: true });

        this.add.text(x, y, "悔  棋", {
            fontSize   : "20px",
            color      : "#f0d9b5",
            fontFamily : "'Zpix', monospace",
            resolution : 2
        }).setOrigin(0.5);

        btnBg.on("pointerover", () => btnBg.setFillStyle(0x8a4a1a));
        btnBg.on("pointerout",  () => btnBg.setFillStyle(0x5c3010));
        btnBg.on("pointerdown", () => this.undo());
    }

    undo() {
        if (play.history.length === 0) return;
        const steps = (play.mode === "player_vs_ai" && play.history.length >= 2) ? 2 : 1;
        for (let i = 0; i < steps; i++) {
            if (play.history.length === 0) break;
            this.executeUndo(play.history.pop());
        }
    }

    executeUndo(move) {
        const { key, from, to, eaten } = move;
        const man = play.mans[key];

        play.map[to.y][to.x]    = eaten ? eaten.key : null;
        play.map[from.y][from.x] = key;
        man.x = from.x;
        man.y = from.y;

        const piece = this.piecesMap[key];
        piece.setData("lx", from.x);
        piece.setData("ly", from.y);
        piece.setPosition(
            this.OFFSET_X + from.x * this.CS,
            this.OFFSET_Y + from.y * this.CS
        );

        if (eaten) this.addPieceToBoard(to.x, to.y, eaten.key);

        play.my = -play.my;
        if (this.selectedPiece) this.clearPieceTint(this.selectedPiece);
        this.selectedPiece = null;
        this.dots.forEach(d => d.destroy());
        this.dots = [];
    }

    initChessData() {
        play.map = this.getInitialMap();
        const counts = {};
        for (let y = 0; y < 10; y++) {
            for (let x = 0; x < 9; x++) {
                const char = play.map[y][x];
                if (char) {
                    play.map[y][x] = char + (counts[char] || 0);
                    counts[char] = (counts[char] || 0) + 1;
                }
            }
        }
        play.initMans(play.map);
        play.my = 1;
    }

    initChessPieces() {
        if (this.piecesMap) Object.values(this.piecesMap).forEach(p => p.destroy());
        this.piecesMap = {};
        const map = play.map;
        for (let y = 0; y < map.length; y++)
            for (let x = 0; x < map[y].length; x++)
                if (map[y][x]) this.addPieceToBoard(x, y, map[y][x]);
    }

    addPieceToBoard(lx, ly, key) {
        const x   = this.OFFSET_X + lx * this.CS;
        const y   = this.OFFSET_Y + ly * this.CS;
        const sz  = this.PIECE_SIZE;
        const isRed = key === key.toLowerCase();

        const img = this.add.image(0, 0, "chess-piece")
            .setDisplaySize(sz, sz);

        const charMap = {
            c: { red: "车", black: "車" },
            m: { red: "马", black: "馬" },
            x: { red: "相", black: "象" },
            s: { red: "仕", black: "士" },
            j: { red: "帅", black: "将" },
            p: { red: "炮", black: "砲" },
            z: { red: "兵", black: "卒" }
        };
        const type  = key[0].toLowerCase();
        const label = charMap[type] ? (isRed ? charMap[type].red : charMap[type].black) : type;

        const txt = this.add.text(0, -2, label, {
            fontSize        : Math.floor(sz * 0.46) + "px",
            color           : isRed ? "#ff0000" : "#000000",
            fontFamily      : "'Zpix', monospace",
            fontStyle       : "bold",
            stroke          : isRed ? "#ff0000" : "#000000",
            strokeThickness : 1,
            resolution      : 2
        }).setOrigin(0.5, 0.5);

        const container = this.add.container(x, y, [img, txt]);
        container.setSize(sz, sz).setInteractive();
        container.setData("lx", lx).setData("ly", ly).setData("key", key);
        container.on("pointerdown", () => this.onPieceClicked(container));
        this.piecesMap[key] = container;
    }

    onPieceClicked(piece) {
        const key   = piece.getData("key");
        const isRed = key === key.toLowerCase();
        if (play.my === 1) {
            isRed ? this.selectPiece(piece)
                  : (this.selectedPiece && this.attemptMove(this.selectedPiece, piece.getData("lx"), piece.getData("ly")));
        } else {
            !isRed ? this.selectPiece(piece)
                   : (this.selectedPiece && this.attemptMove(this.selectedPiece, piece.getData("lx"), piece.getData("ly")));
        }
    }

    setPieceTint(c, tint) {
        const img = c && c.getAt(0);
        if (img) img.setTint(tint);
    }

    clearPieceTint(c) {
        if (!c) return;
        const img   = c.getAt(0);
        if (img) img.clearTint();
    }

    selectPiece(piece) {
        if (this.selectedPiece) this.clearPieceTint(this.selectedPiece);
        this.selectedPiece = piece;
        this.setPieceTint(piece, 0xffdd00);
        this.showDots(piece);
    }

    showDots(piece) {
        this.dots.forEach(d => d.destroy());
        this.dots = [];
        const moves = play.mans[piece.getData("key")].bl(play.map);
        moves.forEach(([lx, ly]) => {
            const dot = this.add.circle(
                this.OFFSET_X + lx * this.CS,
                this.OFFSET_Y + ly * this.CS,
                5, 0x00e000, 0.4
            );
            dot.setInteractive();
            dot.on("pointerdown", () => this.attemptMove(this.selectedPiece, lx, ly));
            this.dots.push(dot);
        });
    }

    attemptMove(piece, nlx, nly) {
        const key   = piece.getData("key");
        const moves = play.mans[key].bl(play.map);
        if (moves.some(([x, y]) => x === nlx && y === nly)) this.movePiece(key, nlx, nly);
    }

    movePiece(key, nlx, nly) {
        const man = play.mans[key];
        const olx = man.x, oly = man.y;
        const targetKey = play.map[nly][nlx];

        play.history.push({ key, from: { x: olx, y: oly }, to: { x: nlx, y: nly },
                            eaten: targetKey ? { key: targetKey } : null });

        if (targetKey) {
            this.piecesMap[targetKey].destroy();
            delete this.piecesMap[targetKey];
            if (targetKey.toLowerCase().startsWith("j")) {
                alert(play.my === 1 ? "红方获胜！" : "黑方获胜！");
                location.reload();
            }
        }

        play.map[oly][olx] = null;
        play.map[nly][nlx] = key;
        man.x = nlx; man.y = nly;

        const piece = this.piecesMap[key];
        piece.setData("lx", nlx).setData("ly", nly);
        this.tweens.add({
            targets: piece,
            x: this.OFFSET_X + nlx * this.CS,
            y: this.OFFSET_Y + nly * this.CS,
            duration: 200, ease: "Power2",
            onComplete: () => this.endTurn()
        });

        if (this.selectedPiece) this.clearPieceTint(this.selectedPiece);
        this.selectedPiece = null;
        this.dots.forEach(d => d.destroy());
        this.dots = [];
    }

    endTurn() {
        play.my = -play.my;
        if (play.mode === "player_vs_ai" && play.my === -1)
            this.time.delayedCall(500, () => this.aiTurn());
    }

    aiTurn() {
        if (play.mode !== "player_vs_ai") return;
        const move = AI.init("");
        if (move) {
            const [ox, oy, nx, ny] = move;
            this.movePiece(play.map[oy][ox], nx, ny);
        } else {
            alert("AI 认输，红方获胜！");
            this.scene.start("MenuScene");
        }
    }
}
