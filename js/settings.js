// ==========================================
// 【设置管理】
// ==========================================
const SETTING_KEY = 'brickSurvivorSettings';

export const DEFAULTS = {
    ballSpeed:  'normal', // slow | normal | fast
    difficulty: 'normal', // easy | normal | hard
    sound:      'on',     // on | off（预留，功能待实现）
    debug:      'off',    // on | off
};

export function loadSettings() {
    try {
        const saved = localStorage.getItem(SETTING_KEY);
        return saved ? { ...DEFAULTS, ...JSON.parse(saved) } : { ...DEFAULTS };
    } catch {
        return { ...DEFAULTS };
    }
}

export function saveSettings(settings) {
    localStorage.setItem(SETTING_KEY, JSON.stringify(settings));
}

// 球速初始速度向量
export const BALL_SPEED = {
    slow:   { vx: -150, vy: -300 },
    normal: { vx: -200, vy: -400 },
    fast:   { vx: -260, vy: -520 },
};

// 难度参数
export const DIFFICULTY = {
    easy:   { bulletSpeed: 150, hpMultiplier: 1 },
    normal: { bulletSpeed: 300, hpMultiplier: 1 },
    hard:   { bulletSpeed: 420, hpMultiplier: 2 },
};
