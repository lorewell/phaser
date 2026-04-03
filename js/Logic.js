/**
 * 象棋游戏的公共逻辑与工具方法
 */
var com = com || {};

com.arr2Clone = function (arr) {
    const newArr = [];
    for (let i = 0; i < arr.length; i++) {
        newArr[i] = arr[i] ? [...arr[i]] : [];
    }
    return newArr;
};

com.gambit = [];

com.createMove = function(map, x1, y1, x2, y2) {
    return `(${x1},${y1}) -> (${x2},${y2})`;
};

com.get = function(id) {
    return document.getElementById(id) || { set innerHTML(v) { console.log("UI Update:", v) } };
};

/**
 * 核心游戏逻辑控制
 */
var play = play || {
    map: [],
    mans: {},
    my: 1, // 1 为红方(玩家)，-1 为蓝方(AI)
    level: 'normal', // 默认难度: simple, normal, hard
    mode: 'player_vs_ai', // 默认模式: player_vs_ai, ai_vs_ai
    depth: 3,
    isFoul: [],
    history: [] // 用于存储走法历史供悔棋使用
};

// 棋子基础类
class Man {
    constructor(key, x, y) {
        this.key = key;
        this.x = x;
        this.y = y;
        this.isRed = key === key.toLowerCase();
        this.my = this.isRed ? 1 : -1;
        this.type = key[0].toLowerCase();
        this.value = this.getValueTable();
    }

    // 获取走法 (子类实现)
    bl(map) { return []; }

    getValueTable() {
        // 简化权重表 (9x10)
        const table = Array(10).fill(0).map(() => Array(9).fill(10));
        const baseValues = { 'j': 1000, 'c': 100, 'm': 40, 'p': 45, 'x': 20, 's': 20, 'z': 10 };
        const val = baseValues[this.type] || 10;
        return table.map(row => row.map(v => v + val));
    }
}

// 具体棋子规则实现
class J extends Man { // 将/帅
    bl(map) {
        const moves = [];
        const range = this.isRed ? [7, 8, 9] : [0, 1, 2];
        [[0,1],[0,-1],[1,0],[-1,0]].forEach(([dx, dy]) => {
            const nx = this.x + dx, ny = this.y + dy;
            if (nx >= 3 && nx <= 5 && range.includes(ny)) {
                const target = map[ny][nx];
                if (!target || (target === target.toLowerCase()) !== this.isRed) moves.push([nx, ny]);
            }
        });
        return moves;
    }
}

class C extends Man { // 车
    bl(map) {
        const moves = [];
        [[0,1],[0,-1],[1,0],[-1,0]].forEach(([dx, dy]) => {
            for (let i = 1; i < 10; i++) {
                const nx = this.x + dx * i, ny = this.y + dy * i;
                if (nx < 0 || nx > 8 || ny < 0 || ny > 9) break;
                const target = map[ny][nx];
                if (!target) moves.push([nx, ny]);
                else {
                    if ((target === target.toLowerCase()) !== this.isRed) moves.push([nx, ny]);
                    break;
                }
            }
        });
        return moves;
    }
}

class M extends Man { // 马
    bl(map) {
        const moves = [];
        [[1,2,0,1],[-1,2,0,1],[1,-2,0,-1],[-1,-2,0,-1],[2,1,1,0],[2,-1,1,0],[-2,1,-1,0],[-2,-1,-1,0]].forEach(([dx, dy, bx, by]) => {
            const nx = this.x + dx, ny = this.y + dy;
            if (nx >= 0 && nx <= 8 && ny >= 0 && ny <= 9 && !map[this.y+by][this.x+bx]) {
                const target = map[ny][nx];
                if (!target || (target === target.toLowerCase()) !== this.isRed) moves.push([nx, ny]);
            }
        });
        return moves;
    }
}

class P extends Man { // 炮
    bl(map) {
        const moves = [];
        [[0,1],[0,-1],[1,0],[-1,0]].forEach(([dx, dy]) => {
            let jumped = false;
            for (let i = 1; i < 10; i++) {
                const nx = this.x + dx * i, ny = this.y + dy * i;
                if (nx < 0 || nx > 8 || ny < 0 || ny > 9) break;
                const target = map[ny][nx];
                if (!jumped) {
                    if (!target) moves.push([nx, ny]);
                    else jumped = true;
                } else if (target) {
                    if ((target === target.toLowerCase()) !== this.isRed) moves.push([nx, ny]);
                    break;
                }
            }
        });
        return moves;
    }
}

class Z extends Man { // 兵/卒
    bl(map) {
        const moves = [];
        const dy = this.isRed ? -1 : 1;
        const ny = this.y + dy;
        if (ny >= 0 && ny <= 9) {
            const target = map[ny][this.x];
            if (!target || (target === target.toLowerCase()) !== this.isRed) moves.push([this.x, ny]);
        }
        const overRiver = this.isRed ? this.y <= 4 : this.y >= 5;
        if (overRiver) {
            [1, -1].forEach(dx => {
                const nx = this.x + dx;
                if (nx >= 0 && nx <= 8) {
                    const target = map[this.y][nx];
                    if (!target || (target === target.toLowerCase()) !== this.isRed) moves.push([nx, this.y]);
                }
            });
        }
        return moves;
    }
}

class X extends Man { // 相/象
    bl(map) {
        const moves = [];
        const range = this.isRed ? [5, 7, 9] : [0, 2, 4];
        [[2,2,1,1],[2,-2,1,-1],[-2,2,-1,1],[-2,-2,-1,-1]].forEach(([dx, dy, bx, by]) => {
            const nx = this.x + dx, ny = this.y + dy;
            if (nx >= 0 && nx <= 8 && range.includes(ny) && !map[this.y+by][this.x+bx]) {
                const target = map[ny][nx];
                if (!target || (target === target.toLowerCase()) !== this.isRed) moves.push([nx, ny]);
            }
        });
        return moves;
    }
}

class S extends Man { // 仕/士
    bl(map) {
        const moves = [];
        const range = this.isRed ? [7, 8, 9] : [0, 1, 2];
        [[1,1],[1,-1],[-1,1],[-1,-1]].forEach(([dx, dy]) => {
            const nx = this.x + dx, ny = this.y + dy;
            if (nx >= 3 && nx <= 5 && range.includes(ny)) {
                const target = map[ny][nx];
                if (!target || (target === target.toLowerCase()) !== this.isRed) moves.push([nx, ny]);
            }
        });
        return moves;
    }
}

play.initMans = function(map) {
    const classes = { 'j': J, 'c': C, 'm': M, 'p': P, 'z': Z, 'x': X, 's': S };
    play.mans = {};
    for (let y = 0; y < 10; y++) {
        for (let x = 0; x < 9; x++) {
            const key = map[y][x];
            if (key) {
                const type = key[0].toLowerCase();
                const Cls = classes[type] || Man;
                play.mans[key] = new Cls(key, x, y);
            }
        }
    }
};

