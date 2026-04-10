// =============================================
//  主菜单场景
// =============================================

class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MenuScene' });
  }

  create() {
    // 背景
    this.cameras.main.setBackgroundColor('#1a1a2e');

    // 标题
    this.add.text(300, 120, '⚔ 擂台对战 ⚔', {
      fontSize: '42px',
      fontFamily: 'Arial, sans-serif',
      color: '#f5c518',
      fontStyle: 'bold',
    }).setOrigin(0.5, 0.5);

    // 副标题
    this.add.text(300, 180, '选择游戏模式', {
      fontSize: '18px',
      fontFamily: 'Arial, sans-serif',
      color: '#888888',
    }).setOrigin(0.5, 0.5);

    // 菜单按钮
    this.createButton(300, 280, '🎮 玩家对战电脑', () => {
      this.scene.start('CharacterSelectScene', { mode: 'pve' });
    });

    // 装饰元素
    this.createDecorations();
  }

  createButton(x, y, text, onClick) {
    const button = this.add.container(x, y);

    // 按钮背景
    const bg = this.add.graphics();
    bg.fillStyle(0x2d2d44, 1);
    bg.fillRoundedRect(-140, -30, 280, 60, 8);
    bg.lineStyle(2, 0xf5c518, 1);
    bg.strokeRoundedRect(-140, -30, 280, 60, 8);

    // 按钮文字
    const label = this.add.text(0, 0, text, {
      fontSize: '20px',
      fontFamily: 'Arial, sans-serif',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5, 0.5);

    button.add([bg, label]);

    // 交互
    const hitArea = new Phaser.Geom.Rectangle(-140, -30, 280, 60);
    button.setInteractive(hitArea, Phaser.Geom.Rectangle.Contains);

    button.on('pointerover', () => {
      bg.clear();
      bg.fillStyle(0x3d3d5c, 1);
      bg.fillRoundedRect(-140, -30, 280, 60, 8);
      bg.lineStyle(3, 0xffd700, 1);
      bg.strokeRoundedRect(-140, -30, 280, 60, 8);
      this.game.canvas.style.cursor = 'pointer';
    });

    button.on('pointerout', () => {
      bg.clear();
      bg.fillStyle(0x2d2d44, 1);
      bg.fillRoundedRect(-140, -30, 280, 60, 8);
      bg.lineStyle(2, 0xf5c518, 1);
      bg.strokeRoundedRect(-140, -30, 280, 60, 8);
      this.game.canvas.style.cursor = 'default';
    });

    button.on('pointerdown', () => {
      bg.clear();
      bg.fillStyle(0x4d4d6c, 1);
      bg.fillRoundedRect(-140, -30, 280, 60, 8);
    });

    button.on('pointerup', () => {
      onClick();
    });

    return button;
  }

  createDecorations() {
    // 四角装饰
    const corners = [
      { x: 40, y: 40, rot: 0 },
      { x: 560, y: 40, rot: 90 },
      { x: 560, y: 560, rot: 180 },
      { x: 40, y: 560, rot: 270 },
    ];

    corners.forEach(c => {
      const g = this.add.graphics();
      g.lineStyle(2, 0xf5c518, 0.5);
      g.beginPath();
      g.moveTo(0, 20);
      g.lineTo(0, 0);
      g.lineTo(20, 0);
      g.strokePath();
      g.x = c.x;
      g.y = c.y;
      g.rotation = Phaser.Math.DegToRad(c.rot);
    });

    // 版本号
    this.add.text(580, 620, 'v1.0', {
      fontSize: '12px',
      fontFamily: 'Arial',
      color: '#666666',
    }).setOrigin(1, 0.5);
  }
}
