# 砖块幸存者 — 项目指引

## 项目概述

Roguelike + 动作打砖块游戏，使用 **Phaser 3**（本地 `phaser.min.js`）。
所有代码写在单个 `index.html` 内（内联 `<script>`），无构建工具、无 npm、无模块系统。

## 架构

- **入口**：`index.html` — 唯一源文件，包含全部游戏逻辑。
- **引擎**：Phaser 3 Arcade Physics，无重力（`gravity.y = 0`），画布 480×800（竖屏）。
- **场景结构**：单场景，`{ preload, create, update }` 三函数模式。
- **关键全局变量**：
  - `player` — `{ hp, maxHp, unitWidth }` 挡板生命与宽度
  - `ball`, `paddle`, `bricks`, `enemyBullets` — 核心物理对象
  - `ballLaunched`, `isLeftDown`, `isRightDown` — 状态标志

## 砖块类型

| 类型 | 颜色 | HP | 特殊行为 |
|------|------|----|----------|
| `normal` | 灰 `0x888888` | 1 | 无 |
| `armored` | 浅灰 `0xaaaaaa` + 白边 | 3 | 受击逐步丢失边框/变色 |
| `explosive` | 红 `0xff0000` | 1 | 死亡时向下发射子弹 |
| `ghost` | 虚线框 | 1 | 每 3 秒切换实体/虚幻，虚幻时物理禁用 |

## 输入规范

- **PC**：方向键 / `A`、`D` 移动；`SPACE` 发射球。
- **移动端**：检测 `device.input.touch` 后显示屏幕按钮，使用 `isLeftDown`/`isRightDown` 标志驱动。
- 不要直接在 `update()` 里区分平台——沿用现有的 `moveDirection` 统一处理模式。

## 挡板视觉规范

挡板宽度 = `player.hp × player.unitWidth`，每次 HP 变化后调用 `updatePaddleVisual()`。
HP ≤ 1 时挡板变红（`0xff4444`）。

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

- 所有代码保持在 `index.html` 单文件内，除非项目明确重构为多文件。
- 砖块数据用 Phaser 的 `setData` / `getData` API 存储（如 `brick.setData('hp', n)`）。
- 物理对象销毁前检查 `brick.active`，避免重复回调。
- 新增砖块类型：在 `createBrickByType()` 中添加新的 `else if` 分支，并更新上方类型表。
- 新增 Buff：在独立的 `BuffList` 数组中声明，字段包含 `{ id, name, desc, apply(playerConfig) }`。

## 运行方式

直接用浏览器打开 `index.html`（双击或 Live Server）。无需安装依赖或构建步骤。
