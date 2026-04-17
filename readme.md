# Phaser 擂台对战

一个基于 Phaser 3 的 2D 格斗游戏，支持角色选择、多人模式和 AI 对战。

## 游戏特色

- **4 个独特角色** — 各有不同属性和攻击方式
- **麻将攻击系统** — 吴猪猪专属的翻牌攻击，牌型影响伤害倍率
- **大招能量系统** — 通过战斗充能，释放强力技能
- **AI 对战** — 智能敌人，根据角色类型调整行为
- **角色平衡设计** — 速度+血量总和固定，确保公平性

## 角色介绍

| 角色 | 定位 | 攻击类型 | 特色 |
|------|------|----------|------|
| 妇人科 | 高速游击 | 近战连击 | 连击叠加伤害 |
| 吴猪猪 | 法师 | 麻将飞牌 | 翻牌判定牌型倍率 |
| 承太郎 | 刺客 | 冲锋爆发 | 冲锋无敌+高爆发 |
| 哥布林 | 射手 | 远程射击 | 距离越远伤害越高 |

## 快速开始

### 本地运行

1. 克隆项目
```bash
git clone <仓库地址>
cd phaser
```

2. 使用任意 HTTP 服务器启动（如 Python）
```bash
python -m http.server 8080
```

3. 打开浏览器访问 `http://localhost:8080`

### 或直接打开

双击 `index.html` 即可在浏览器中运行游戏。

## 操作说明

- **进入游戏** — 选择角色后点击开始
- **PVE 模式** — 与 AI 对战
- **PVP 模式** — 双人本地对战

## 项目结构

```
phaser/
├── index.html          # 游戏入口
├── menu.html           # 菜单页面
├── characterSelect.html # 角色选择页面
├── game.js             # 主游戏逻辑
├── characters.js       # 角色配置
├── attacks.js          # 攻击系统（麻将翻牌）
├── menu.js             # 菜单逻辑
├── characterSelect.js  # 角色选择逻辑
├── phaser.min.js       # Phaser 3 库
└── assets/             # 资源文件
    └── characters/     # 角色图片
```

## 技术栈

- **Phaser 3** — 游戏引擎
- **原生 JavaScript** — 游戏逻辑
- **HTML5 Canvas** — 渲染

## 开发说明

### 添加新角色

在 `characters.js` 中添加角色配置：

```javascript
newChar: {
  id: 'newchar',
  name: '新角色',
  description: '角色描述',
  image: './assets/characters/newchar.png',
  fillColor: 0xFFFFFF,
  maxHp: 200,
  speed: 200,
  size: 80,
  attack: {
    type: ATTACK_TYPE.MELEE, // 或 RANGED/AURA/CHARGE
    name: '技能名',
    damage: 20,
    cooldown: 1.0,
    range: 50
  },
  ultimate: {
    name: '大招名',
    description: '效果描述',
    maxEnergy: 100,
    duration: 3000,
    // ... 其他大招参数
  }
}
```

### 麻将攻击系统

麻将翻牌攻击系统为吴猪猪专属，包含：

- **68 张麻将牌** — 万子、筒子、条子、风牌、箭牌
- **牌型判定** — 单张、对子、顺子、刻子等
- **伤害倍率** — 根据牌型计算（1x ~ 12x）
- **连击系统** — 连续命中提升倍率
- **宝牌加成** — 翻到宝牌额外伤害

## License

MIT
