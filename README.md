# 格斗游戏 - 开发文档

基于 Phaser 3 的 2D 格斗游戏，支持双人对战。

## 项目结构

```
src/
├── main.js              # 入口文件
├── constants.js         # 游戏配置与常量
├── entities/
│   └── Fighter.js       # 角色类
├── scenes/
│   └── FightScene.js    # 主战斗场景
├── managers/
│   ├── InputManager.js  # 输入管理
│   ├── UIManager.js     # UI 管理
│   ├── EffectsManager.js # 特效管理
│   └── RoundManager.js  # 回合管理
└── config/
    └── GameConfig.js    # 游戏配置
```

## 核心架构

### 角色系统 (Fighter.js)

角色使用容器组织多个精灵部件，支持动作镜像翻转。

**核心属性：**
```javascript
health: 100        // 生命值
rage: 0            // 怒气值
facing: 1/-1       // 朝向 (1=右, -1=左)
attackState        // 攻击状态 (idle/startup/active/recovery)
attackType         // 当前攻击类型
```

**身体部件：**
- `legsImg` - 双腿（站立图）
- `torso` - 身体
- `head` - 头部
- `armContainer` + `armImg` - 手臂（出拳时使用 `scaleX` 横向伸展）
- `kickLeg` + `kickLegImg` - 踢腿（隐藏，踢腿时显示）

**关键方法：**
| 方法 | 说明 |
|------|------|
| `updateFacing(facing)` | 更新角色朝向，自动镜像翻转所有部件 |
| `resetPose()` | 重置手臂/腿到待机状态 |
| `setBlockVisual(blocking)` | 设置防御状态变色 |
| `showHitFlash()` | 显示受击闪光效果 |

### 战斗系统 (FightScene.js)

采用帧状态机管理攻击：STARTUP（前摇）→ ACTIVE（判定）→ RECOVERY（收招）。

**攻击流程：**
```
triggerAttack() → _playStartup() → _playActive() → _playRecovery() → IDLE
```

**动画实现：**
- 前摇：设置 `armImg.scaleX = 0.1` 收缩
- 激活：`tweens.scaleX: 1` 横向伸展
- 恢复：`scaleX` 恢复正常

**命中判定：**
```javascript
_checkHit(attacker, target)
  - 检查距离范围 (range/rangeY)
  - 检查朝向一致性
  - 应用伤害、击退、受击僵直
```

### 输入系统 (InputManager.js)

支持键盘/游戏手柄，自动处理移动、跳跃、防御、攻击指令。

**核心方法：**
| 方法 | 说明 |
|------|------|
| `processMovement(fighter, keys)` | 处理前后移动、跳跃 |
| `resolveAttack(fighter, type, keys)` | 解析攻击输入，返回攻击类型 |
| `getP1Keys() / getP2Keys()` | 获取各玩家按键状态 |

### 回合管理 (RoundManager.js)

管理比赛回合流程、胜负判定、KO 触发。

**核心方法：**
| 方法 | 说明 |
|------|------|
| `init(config)` | 初始化，配置回调 |
| `showRoundStart()` | 显示回合开始提示 |
| `triggerKO(target, attacker)` | 触发 KO |
| `isGameOver() / isRoundActive()` | 状态查询 |

### 特效系统 (EffectsManager.js)

封装常用特效生成方法。

**特效类型：**
| 特效 | 方法 | 说明 |
|------|------|------|
| 受击火花 | `spawnHitSpark(x, y, color)` | 命中时闪烁 |
| 升龙火焰 | `spawnRisingFlame(fighter)` | 升龙拳火焰拖尾 |
| 防御特效 | `spawnBlockEffect(target)` | 防御成功时触发 |
| 击飞特效 | `spawnLaunchParticles(target)` | 空中命中粒子 |

## 游戏配置 (constants.js)

### 攻击参数表

```javascript
attack: {
    punch: { damage: 7, knockback: 80, range: 65, rangeY: 65, ... },
    kick: { damage: 13, knockback: 150, range: 85, rangeY: 80, ... },
    rising: { damage: 18, knockback: 60, range: 70, rangeY: 160, riseVY: -600, ... },
    airpunch: { ... },
    airkick: { damage: 16, knockback: 100, range: 70, rangeY: 120, ... }
}
```

**参数说明：**
| 参数 | 说明 |
|------|------|
| `damage` | 基础伤害 |
| `knockback` | 击退力度 |
| `range` | 水平攻击范围 |
| `rangeY` | 垂直攻击范围 |
| `startup` | 前摇帧数 |
| `activeFrames` | 判定帧数 |
| `cooldown` | 冷却时间 |
| `hitstun` | 命中僵直时间 |

### 常量定义

```javascript
ATTACK_TYPES = { PUNCH, KICK, RISING, AIR_PUNCH, AIR_KICK }
ATTACK_STATES = { IDLE, STARTUP, ACTIVE, RECOVERY }
PLAYER_IDS = { P1, P2 }
```

## 精灵资源

角色使用 SVG 矢量图，加载时放大 2 倍保证清晰度：

| 部件 | 文件名 | 尺寸 |
|------|--------|------|
| 头部 | `head.svg` | 80x80 |
| 身体 | `torso.svg` | 80x90 |
| 手臂 | `arm.svg` | 40x90 |
| 站立腿 | `legs.svg` | 80x80 |
| 踢腿 | `kick_leg.svg` | 60x100 |

资源路径：`assets/p1/` 和 `assets/p2/` 分别存放两名玩家的素材。

## 运行方式

```bash
# 直接打开 index.html（需要本地服务器）
npx serve .
# 或
python -m http.server 8080
```

## 扩展指南

### 添加新攻击

1. 在 `constants.js` 的 `attack` 对象添加配置
2. 在 `ATTACK_TYPES` 添加类型常量
3. 在 `FightScene._playStartup/_playActive/_playRecovery` 添加对应动画

### 添加新特效

在 `EffectsManager.js` 添加新方法，使用 `this.add.graphics()` 或粒子系统实现。

### 修改平衡性

调整 `constants.js` 中的：
- `GAME_CONFIG.attack` - 伤害、范围、冷却
- `GAME_CONFIG.gravity` / `jumpForce` - 重力/跳跃手感
- `blockReduction` - 防御减伤比例
