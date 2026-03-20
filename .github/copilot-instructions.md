# 砖块幸存者 — 项目指引

## 项目概述

Roguelike + 动作打砖块游戏，使用 **Phaser 3**（本地 `phaser.min.js`）。
代码已重构为多文件模块结构，需通过本地服务器（如 VSCode Live Server）运行。

## 架构

- **入口**：`index.html` — 加载 Phaser 并通过 `<script type="module">` 引入 `js/main.js`。
- **多文件结构**：`js/main.js`（配置入口）、`js/settings.js`（设置读写）、`js/scenes/`（各场景）。
- **引擎**：Phaser 3 Arcade Physics，无重力（`gravity.y = 0`），画布 480×800（竖屏）。
- **场景结构**：单场景，`{ preload, create, update }` 三函数模式。
- **关键全局变量**：
  - `player` — `{ hp, maxHp, unitWidth }` 挡板生命与宽度
  - `ball`, `paddle`, `bricks`, `enemyBullets` — 核心物理对象
  - `ballLaunched`, `isLeftDown`, `isRightDown` — 状态标志

## 画面风格（像素风 Pixel Art）

游戏采用**复古街机像素风**，所有 UI 和游戏元素须遵循以下规范：

### 调色板
| 用途 | 颜色值 |
|------|--------|
| 背景 | `0x000000`（纯黑）|
| 像素网格线 | `0x0a0a22`（暗蓝黑）|
| 高亮/标题 | `0xffee00`（霓虹黄）|
| 边框/按钮 | `0x00ffcc`（霓虹青）|
| Hover 高亮 | `0xffee00`（霓虹黄）|
| 挡板（正常） | `0x00ddcc`（青色）|
| 挡板（危险 HP≤1）| `0xff2244`（霓虹红）|
| 球 | `0xffee00`（霓虹黄，12×12 方形）|
| 普通砖块 | `0x2255bb` + 蓝色描边 `0x4488ff` |
| 装甲砖块 | `0x446688` + 青色描边 `0x00ffcc` |
| 爆炸砖块 | `0xff2244` + 橙色描边 `0xff8800` |
| 幽灵砖块 | `0x220044` + 紫色描边 `0xaa44ff` |
| 敌方子弹 | `0xff6600` + `0xffaa00` 描边 |

### 关键视觉规则
- **背景**：纯黑 + 16px 暗蓝网格线（仅砖块区域）+ CRT 扫描线覆盖层。
- **字体**：英文/版本号使用 `"Press Start 2P"` 像素字体（Google Fonts）；中文用加粗系统字体。
- **按钮**：2px 霓虹青边框 + 像素错位阴影（右下偏移 5px 纯黑矩形）+ 双边框内边框。
- **球**：`add.rectangle(12, 12)` 方形，不使用圆形。
- **元素边框**：所有 UI 面板使用实心边框，不使用半透明描边。
- **CSS**：`canvas` 需设置 `image-rendering: pixelated` 防止模糊。

### 扫描线实现
```js
// 在 create() 末尾调用 addScanlines()
addScanlines() {
    const g = this.add.graphics();
    for (let y = 0; y < H; y += 4) {
        g.fillStyle(0x000000, 0.12);
        g.fillRect(0, y, W, 2);
    }
}
```

## 砖块类型

| 类型 | 颜色 | HP | 特殊行为 |
|------|------|----|----------|
| `normal` | 蓝 `0x2255bb` + 蓝边 | 1 | 无 |
| `armored` | 钢蓝 `0x446688` + 青边 | 3 | 受击逐步丢失边框/变色 |
| `explosive` | 霓虹红 `0xff2244` + 橙边 | 1 | 死亡时向下发射子弹 |
| `ghost` | 深紫 `0x220044` + 紫边 | 1 | 每 3 秒切换实体/虚幻，虚幻时物理禁用 |

## 输入规范

- **PC**：方向键 / `A`、`D` 移动；`SPACE` 发射球。
- **移动端**：检测 `device.input.touch` 后显示屏幕按钮，使用 `isLeftDown`/`isRightDown` 标志驱动。
- 不要直接在 `update()` 里区分平台——沿用现有的 `moveDirection` 统一处理模式。

## 挡板视觉规范

挡板宽度 = `player.hp × player.unitWidth`，每次 HP 变化后调用 `updatePaddleVisual()`。
HP ≤ 1 时挡板变霓虹红（`0xff2244`）；正常时为霓虹青（`0x00ddcc`）。

## 游戏循环状态机

计划中的状态：`PLAYING` → `UPGRADING`（三选一升级 UI）→ `PLAYING` / `GAMEOVER`。
新增状态管理时，通过 `this.physics.pause()` / `resume()` 切换，不要用 `location.reload()` 作为正式逻辑（目前仅用于原型占位）。

## 数值缩放规范

每波结束后通过 `waveCount` 全局变量调整难度：
```js
brickHealth = 1 + Math.floor(waveCount / 5);
enemyBulletSpeed = 150 + waveCount * 5;
```

## 编码约定

- 代码分布在 `js/` 目录的多文件模块结构中（`main.js`、`settings.js`、`scenes/`）。
- 新增场景时在 `js/scenes/` 下创建文件，并在 `js/main.js` 中注册。
- 砖块数据用 Phaser 的 `setData` / `getData` API 存储（如 `brick.setData('hp', n)`）。
- 物理对象销毁前检查 `brick.active`，避免重复回调。
- 新增砖块类型：在 `createBrickByType()` 中添加新的 `else if` 分支，并更新上方类型表。
- 新增 Buff：在独立的 `BuffList` 数组中声明，字段包含 `{ id, name, desc, apply(playerConfig) }`。

## 运行方式

直接用浏览器打开 `index.html`（双击或 Live Server）。无需安装依赖或构建步骤。
