// =============================================
//  角色配置 - 4个平衡角色 + 进攻手段系统
// =============================================

// 进攻手段类型
const ATTACK_TYPE = {
  MELEE: 'melee',      // 近战
  RANGED: 'ranged',    // 远程
  AURA: 'aura',        // 光环/范围
  CHARGE: 'charge',    // 冲锋
};

const CHARACTERS = {
  // ========== 角色1：疾风 ==========
  // 定位：高速游击，近战爆发
  swift: {
    id: 'swift',
    name: '疾风',
    description: '速度极快，来去如风，擅长贴身缠斗',
    // 外观
    fillColor: 0x3d9be9,   // 蓝色
    strokeColor: 0x1a5fa8,
    // 基础属性（平衡总分：速度+血量=420）
    maxHp: 90,             // 较低血量
    speed: 330,            // 最高速度
    size: 48,              // 较小体型
    // 进攻手段：快速连击
    attack: {
      type: ATTACK_TYPE.MELEE,
      name: '疾风连击',
      description: '贴身快速攻击，伤害较低但频率高',
      damage: 8,             // 单次伤害低
      cooldown: 0.4,         // 冷却短（高频）
      range: 60,             // 近战范围
      // 特殊：连续命中叠加伤害
      combo: {
        maxStacks: 3,
        bonusPerStack: 4,    // 每层+4伤害
      }
    }
  },

  // ========== 角色2：铁壁 ==========
  // 定位：肉盾坦克，近战反伤
  tank: {
    id: 'tank',
    name: '铁壁',
    description: '血量厚实，坚不可摧，擅长防守反击',
    // 外观
    fillColor: 0xe94f3d,   // 红色
    strokeColor: 0xa82010,
    // 基础属性（平衡总分：速度+血量=420）
    maxHp: 180,            // 最高血量
    speed: 140,            // 最慢速度
    size: 62,              // 最大体型
    // 进攻手段：反震冲击
    attack: {
      type: ATTACK_TYPE.AURA,
      name: '钢铁反震',
      description: '受到伤害时反弹伤害，主动释放造成范围伤害',
      damage: 12,            // 中等伤害
      cooldown: 1.2,         // 冷却较长
      range: 90,             // 范围伤害
      // 特殊：被动反伤
      passive: {
        reflectPercent: 0.25 // 反弹25%受到伤害
      }
    }
  },

  // ========== 角色3：影刃 ==========
  // 定位：刺客型，冲锋爆发
  shadow: {
    id: 'shadow',
    name: '影刃',
    description: '神出鬼没，一击必杀，擅长突袭',
    // 外观
    fillColor: 0x8b5cf6,   // 紫色
    strokeColor: 0x5b21b6,
    // 基础属性（平衡总分：速度+血量=420）
    maxHp: 110,            // 中等偏低血量
    speed: 280,            // 高速
    size: 50,              // 标准体型
    // 进攻手段：暗影冲锋
    attack: {
      type: ATTACK_TYPE.CHARGE,
      name: '暗影冲锋',
      description: '向目标方向快速冲锋，撞击造成高额伤害',
      damage: 25,            // 单次高伤害
      cooldown: 2.0,         // 冷却长
      range: 180,            // 冲锋距离
      // 特殊：冲锋期间无敌
      invincibleDuringCharge: true,
      // 冲锋速度倍率
      speedMultiplier: 2.5
    }
  },

  // ========== 角色4：神射 ==========
  // 定位：远程输出，保持距离
  sniper: {
    id: 'sniper',
    name: '神射',
    description: '百步穿杨，远程狙击，擅长风筝战术',
    // 外观
    fillColor: 0x22c55e,   // 绿色
    strokeColor: 0x15803d,
    // 基础属性（平衡总分：速度+血量=420）
    maxHp: 120,            // 中等血量
    speed: 200,            // 中等速度
    size: 52,              // 略大
    // 进攻手段：精准射击
    attack: {
      type: ATTACK_TYPE.RANGED,
      name: '精准射击',
      description: '发射远程投射物，距离越远伤害越高',
      damage: 15,            // 基础伤害
      cooldown: 0.8,         // 中等冷却
      range: 250,            // 射程
      // 特殊：距离加成
      distanceBonus: {
        maxBonus: 15,        // 最大额外伤害
        optimalDistance: 200 // 最佳距离
      },
      // 投射物速度
      projectileSpeed: 400
    }
  },
};

// 角色平衡性说明：
// 疾风: 90HP + 330速 = 420 | 高频低伤，需要持续贴身
// 铁壁: 180HP + 140速 = 420 | 低频反伤，站桩输出
// 影刃: 110HP + 280速 = 420 | 长CD爆发，需要找准时机
// 神射: 120HP + 200速 = 420 | 中频中伤，需要保持距离

// 默认角色选择
const DEFAULT_PLAYER1_CHAR = 'swift';
const DEFAULT_PLAYER2_CHAR = 'tank';

// 获取角色配置
function getCharacter(charId) {
  return CHARACTERS[charId] || CHARACTERS.swift;
}

// 导出
if (typeof window !== 'undefined') {
  window.ATTACK_TYPE = ATTACK_TYPE;
  window.CHARACTERS = CHARACTERS;
  window.DEFAULT_PLAYER1_CHAR = DEFAULT_PLAYER1_CHAR;
  window.DEFAULT_PLAYER2_CHAR = DEFAULT_PLAYER2_CHAR;
  window.getCharacter = getCharacter;
}
