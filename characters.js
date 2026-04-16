// =============================================
//  角色配置 - 4个平衡角色 + 进攻手段 + 大招系统
// =============================================

// 进攻手段类型
const ATTACK_TYPE = {
  MELEE: 'melee',      // 近战
  RANGED: 'ranged',    // 远程
  AURA: 'aura',        // 光环/范围
  CHARGE: 'charge',    // 冲锋
};

const CHARACTERS = {
  // ========== 角色1：妇人科 ==========
  // 定位：高速游击，近战爆发
  furenke: {
    id: 'furenke',
    name: '妇人科',
    description: '速度极快，来去如风，擅长贴身缠斗',
    // 外观
    image: './assets/characters/furenke.png',
    fillColor: 0x3d9be9,   // 蓝色
    strokeColor: 0x1a5fa8,
    // 基础属性（平衡总分：速度+血量=420）
    maxHp: 220,             // 较低血量
    speed: 330,            // 最高速度
    size: 80,             // 增大体型
    // 进攻手段：快速连击
    attack: {
      type: ATTACK_TYPE.MELEE,
      name: '疾风连击',
      description: '贴身快速攻击，伤害较低但频率高',
      damage: 30,             // 单次伤害低
      cooldown: 0.4,         // 冷却短（高频）
      range: 60,             // 近战范围
      // 特殊：连续命中叠加伤害
      combo: {
        maxStacks: 3,
        bonusPerStack: 5,    // 每层+5伤害
      }
    },
    // 大招：时间断裂
    ultimate: {
      name: '时间断裂',
      description: '进入子弹时间，自身速度翻倍，敌人速度减半，持续3秒',
      // 蓄力需求
      maxEnergy: 100,
      // 被动充能（每秒）
      passiveCharge: 3,
      // 造成伤害充能比例（造成伤害的X%转化为能量）
      damageDealtCharge: 0.8,  // 造成100伤害充能80
      // 受到伤害充能比例（受到伤害的X%转化为能量）
      damageTakenCharge: 1.2,  // 受到100伤害充能120（挨打充能更快）
      // 效果
      duration: 3000,          // 持续3秒
      selfSpeedMultiplier: 2.0,  // 自身加速
      enemySpeedMultiplier: 0.5  // 敌人减速
    }
  },

  // ========== 角色2：吴猪猪==========
  // 定位：法师，远程麻将攻击
  wuzhuzhu: {
    id: 'wuzhuzhu',
    name: '吴猪猪',
    description: '操控麻将攻击，旋转的麻将牌是她的致命武器',
    // 外观
    image: './assets/characters/wuzhuzhu.png',
    fillColor: 0xe94f3d,   // 红色
    strokeColor: 0xa82010,
    // 基础属性（平衡总分：速度+血量=420）
    maxHp: 240,            // 中等血量
    speed: 160,            // 较慢速度
    size: 85,             // 较大体型
    // 进攻手段：麻将飞射
    attack: {
      type: ATTACK_TYPE.RANGED,
      name: '飞牌绝技',
      description: '发射旋转的麻将牌攻击敌人',
      damage: 18,            // 中等伤害
      cooldown: 1.0,         // 中等冷却
      range: 300,           // 远程射程
      // 特殊：距离加成
      distanceBonus: {
        maxBonus: 12,        // 最大额外伤害
        optimalDistance: 200 // 最佳距离
      },
      // 投射物速度
      projectileSpeed: 350
    },
    // 大招：麻将风暴
    ultimate: {
      name: '麻将风暴',
      description: '召唤麻将雨，对全擂台持续造成伤害',
      // 蓄力需求
      maxEnergy: 100,
      // 被动充能（每秒）
      passiveCharge: 2.5,
      // 造成伤害充能比例
      damageDealtCharge: 0.8,
      // 受到伤害充能比例
      damageTakenCharge: 1.0,
      // 效果
      duration: 3000,
      damagePerMahjong: 15,
      mahjongCount: 12
    }
  },

  // ========== 角色3：承太郎 ==========
  // 定位：刺客，高爆发，能够瞬间突进
  chengtailang: {
    id: 'chengtailang',
    name: '承太郎',
    description: '潜伏在阴影中，擅长瞬间接近对手并造成致命打击',
    // 外观
    image: './assets/characters/chengtailang.png',
    fillColor: 0x9b3de9,   // 紫色
    strokeColor: 0x5b21b6,
    // 基础属性（平衡总分：速度+血量=420）
    maxHp: 230,            // 中等偏低血量
    speed: 280,            // 高速
    size: 80,              // 增大体型
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
    },
    // 大招：暗影分身
    ultimate: {
      name: '暗影分身',
      description: '召唤2个分身，分身会模仿本体攻击，持续5秒',
      // 蓄力需求
      maxEnergy: 100,
      // 被动充能（每秒）
      passiveCharge: 2.5,
      // 造成伤害充能比例（刺客靠输出充能）
      damageDealtCharge: 1.0,  // 造成100伤害充能100
      // 受到伤害充能比例
      damageTakenCharge: 0.8,
      // 效果
      duration: 5000,
      cloneCount: 2,           // 2个分身
      cloneDamagePercent: 0.4, // 分身造成40%伤害
      cloneHpPercent: 0.3      // 分身有30%血量（被摸一下就死）
    }
  },

  // ========== 角色4：哥布林 ==========
  // 定位：射手，远程牵制，距离越远伤害越高
  gebulin: {
    id: 'gebulin',
    name: '哥布林',
    description: '精通远程攻击，能够通过拉开距离消磨对手生命',
    // 外观
    image: './assets/characters/gebulin.png',
    fillColor: 0x3de97a,   // 绿色
    strokeColor: 0x15803d,
    // 基础属性（平衡总分：速度+血量=420）
    maxHp: 230,            // 中等血量
    speed: 200,            // 中等速度
    size: 80,             // 增大体型
    // 进攻手段：精准射击
    attack: {
      type: ATTACK_TYPE.RANGED,
      name: '精准射击',
      description: '发射远程投射物，距离越远伤害越高',
      damage: 15,            // 基础伤害
      cooldown: 1,         // 中等冷却
      range: 250,            // 射程
      // 特殊：距离加成
      distanceBonus: {
        maxBonus: 15,        // 最大额外伤害
        optimalDistance: 200 // 最佳距离
      },
      // 投射物速度
      projectileSpeed: 400
    },
    // 大招：箭雨风暴
    ultimate: {
      name: '箭雨风暴',
      description: '向天空发射箭雨，3秒内持续对全擂台随机位置造成范围伤害',
      // 蓄力需求
      maxEnergy: 100,
      // 被动充能（每秒）
      passiveCharge: 2,
      // 造成伤害充能比例
      damageDealtCharge: 0.9,
      // 受到伤害充能比例
      damageTakenCharge: 1.0,
      // 效果
      duration: 3000,          // 3秒持续
      arrowCount: 15,          // 总共15支箭
      damagePerArrow: 20,      // 每支箭伤害
      explosionRadius: 60      // 爆炸范围
    }
  },
};

// 角色平衡性说明：
// 疾风: 90HP + 330速 = 420 | 高频低伤，需要持续贴身
// 铁壁: 180HP + 140速 = 420 | 低频反伤，站桩输出
// 影刃: 110HP + 280速 = 420 | 长CD爆发，需要找准时机
// 神射: 120HP + 200速 = 420 | 中频中伤，需要保持距离

// 大招充能平衡：
// 疾风：时间断裂 - 控制型，需要频繁使用，充能较快（挨打1.2倍）
// 铁壁：绝对防御 - 保命型，需要较多能量但挨打充能快（1.5倍）
// 影刃：暗影分身 - 爆发型，靠输出充能（1.0倍）
// 神射：箭雨风暴 - 范围型，平衡充能

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
