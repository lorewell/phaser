// ============================================
// 格斗游戏 - 常量与配置
// ============================================

const GAME_CONFIG = {
    width: 1024,
    height: 576,
    roundTime: 60,
    maxRounds: 3,
    winsNeeded: 2,
    gravity: 900,
    playerSpeed: 220,
    jumpForce: -480,

    // 攻击参数表
    attack: {
        // ── 地面 ──────────────────────────────────
        punch: {                    // 普通拳
            damage: 7,   knockback: 80,
            range: 65,   rangeY: 65,
            cooldown: 280, activeFrames: 120, startup: 60,
            hitstun: 250,
            hitColor: 0xffee22,
        },
        kick: {                     // 普通踢
            damage: 13,  knockback: 150,
            range: 85,   rangeY: 80,
            cooldown: 480, activeFrames: 140, startup: 100,
            hitstun: 380,
            hitColor: 0xff6633,
        },
        rising: {                   // 升龙拳
            damage: 18,  knockback: 60,
            range: 70,   rangeY: 160,   // 纵向范围大
            cooldown: 600, activeFrames: 280, startup: 70,
            hitstun: 500,
            hitColor: 0xff9900,
            riseVY: -600,            // 向上冲击力
        },
        // ── 空中 ──────────────────────────────────
        airpunch: {                 // 飞拳
            damage: 10,  knockback: 200,
            range: 80,   rangeY: 70,
            cooldown: 300, activeFrames: 130, startup: 55,
            hitstun: 300,
            hitColor: 0x88ffee,
        },
        airkick: {                  // 飞脚（下踹）
            damage: 16,  knockback: 100,
            range: 70,   rangeY: 120,   // 向下范围大
            cooldown: 420, activeFrames: 150, startup: 80,
            hitstun: 450,
            hitColor: 0xff44aa,
            downwardKB: true,        // 向下击退
        },
    },

    blockReduction: 0.15,
    rage: {
        onHit: 5, onGetHit: 9, onBlock: 4,
        onKick: 7, onRising: 12, onAirHit: 8,
    }
};

// 技能显示名
const ATTACK_NAMES = {
    punch:    '拳击',
    kick:     '踢击',
    rising:   '升龙拳!!',
    airpunch: '飞拳',
    airkick:  '飞脚',
};

// 攻击类型常量
const ATTACK_TYPES = {
    PUNCH: 'punch',
    KICK: 'kick',
    RISING: 'rising',
    AIR_PUNCH: 'airpunch',
    AIR_KICK: 'airkick'
};

// 攻击状态常量
const ATTACK_STATES = {
    IDLE: 'idle',
    STARTUP: '_startup',
    ACTIVE: '_active',
    RECOVERY: '_recovery'
};

// 玩家ID常量
const PLAYER_IDS = {
    P1: 'p1',
    P2: 'p2'
};

// 颜色配置
const COLORS = {
    P1: 0xff3355,
    P2: 0x3388ff,
    BLOCK_TINT: 0x8888aa,
    NORMAL_TINT: 0xffffff
};
