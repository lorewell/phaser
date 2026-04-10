// =============================================
//  角色选择场景 - 格斗游戏风格
// =============================================

class CharacterSelectScene extends Phaser.Scene {
  constructor() {
    super({ key: 'CharacterSelectScene' });
  }

  init(data) {
    this.gameMode = data.mode || 'pve';
    this.selectedChar = null;
    this.hoveredChar = null;
  }

  create() {
    // 背景
    this.cameras.main.setBackgroundColor('#1a1a2e');

    // 标题
    this.add.text(300, 50, '选择你的角色', {
      fontSize: '32px',
      fontFamily: 'Arial, sans-serif',
      color: '#f5c518',
      fontStyle: 'bold',
    }).setOrigin(0.5, 0.5);

    // 角色列表
    this.charKeys = ['swift', 'tank', 'shadow', 'sniper'];
    this.charButtons = [];

    // 创建角色选择卡片（2x2 网格）
    const startX = 150;
    const startY = 140;
    const gapX = 200;
    const gapY = 180;

    this.charKeys.forEach((key, index) => {
      const col = index % 2;
      const row = Math.floor(index / 2);
      const x = startX + col * gapX;
      const y = startY + row * gapY;
      this.createCharCard(x, y, key);
    });

    // 角色详情面板（右侧）
    this.createDetailPanel();

    // 开始游戏按钮（初始禁用）
    this.createStartButton();

    // 返回按钮
    this.createBackButton();

    // 电脑选择提示
    this.cpuText = this.add.text(300, 620, '', {
      fontSize: '14px',
      fontFamily: 'Arial',
      color: '#888888',
    }).setOrigin(0.5, 0.5);
  }

  createCharCard(x, y, charId) {
    const char = CHARACTERS[charId];
    const container = this.add.container(x, y);

    // 卡片背景
    const bg = this.add.graphics();
    bg.fillStyle(0x2d2d44, 1);
    bg.fillRoundedRect(-70, -70, 140, 140, 10);
    bg.lineStyle(2, 0x444466, 1);
    bg.strokeRoundedRect(-70, -70, 140, 140, 10);

    // 角色颜色方块（代表角色形象）
    const avatar = this.add.graphics();
    avatar.fillStyle(char.fillColor, 1);
    avatar.fillRect(-35, -50, 70, 70);
    avatar.lineStyle(2, char.strokeColor, 1);
    avatar.strokeRect(-35, -50, 70, 70);

    // 角色名
    const nameText = this.add.text(0, 35, char.name, {
      fontSize: '16px',
      fontFamily: 'Arial',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5, 0.5);

    // 定位标签
    const roleText = this.add.text(0, 52, this.getRoleLabel(charId), {
      fontSize: '11px',
      fontFamily: 'Arial',
      color: '#aaaaaa',
    }).setOrigin(0.5, 0.5);

    container.add([bg, avatar, nameText, roleText]);

    // 交互
    const hitArea = new Phaser.Geom.Rectangle(-70, -70, 140, 140);
    container.setInteractive(hitArea, Phaser.Geom.Rectangle.Contains);

    container.on('pointerover', () => {
      this.hoveredChar = charId;
      this.updateDetailPanel(charId);
      bg.clear();
      bg.fillStyle(0x3d3d5c, 1);
      bg.fillRoundedRect(-70, -70, 140, 140, 10);
      bg.lineStyle(3, 0xf5c518, 1);
      bg.strokeRoundedRect(-70, -70, 140, 140, 10);
      this.game.canvas.style.cursor = 'pointer';
    });

    container.on('pointerout', () => {
      if (this.selectedChar !== charId) {
        bg.clear();
        bg.fillStyle(0x2d2d44, 1);
        bg.fillRoundedRect(-70, -70, 140, 140, 10);
        bg.lineStyle(2, this.selectedChar === charId ? 0x00ff00 : 0x444466, 1);
        bg.strokeRoundedRect(-70, -70, 140, 140, 10);
      }
      this.game.canvas.style.cursor = 'default';
    });

    container.on('pointerdown', () => {
      this.selectCharacter(charId);
    });

    this.charButtons.push({ id: charId, container, bg });
    return container;
  }

  getRoleLabel(charId) {
    const labels = {
      swift: '速度型',
      tank: '防御型',
      shadow: '爆发型',
      sniper: '远程型',
    };
    return labels[charId] || '';
  }

  createDetailPanel() {
    // 详情背景
    this.detailBg = this.add.graphics();
    this.detailBg.fillStyle(0x252538, 1);
    this.detailBg.fillRoundedRect(420, 110, 160, 320, 10);
    this.detailBg.lineStyle(2, 0x444466, 1);
    this.detailBg.strokeRoundedRect(420, 110, 160, 320, 10);

    // 详情文字
    this.detailTitle = this.add.text(500, 140, '角色详情', {
      fontSize: '16px',
      fontFamily: 'Arial',
      color: '#f5c518',
      fontStyle: 'bold',
    }).setOrigin(0.5, 0.5);

    this.detailName = this.add.text(500, 170, '请选择一个角色', {
      fontSize: '18px',
      fontFamily: 'Arial',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5, 0.5);

    this.detailDesc = this.add.text(500, 200, '', {
      fontSize: '11px',
      fontFamily: 'Arial',
      color: '#aaaaaa',
      align: 'center',
      wordWrap: { width: 140 },
    }).setOrigin(0.5, 0);

    // 属性条
    this.hpLabel = this.add.text(440, 250, '血量:', { fontSize: '12px', color: '#888888' });
    this.hpValue = this.add.text(550, 250, '-', { fontSize: '12px', color: '#ffffff' });

    this.speedLabel = this.add.text(440, 275, '速度:', { fontSize: '12px', color: '#888888' });
    this.speedValue = this.add.text(550, 275, '-', { fontSize: '12px', color: '#ffffff' });

    // 攻击信息
    this.attackTitle = this.add.text(500, 310, '攻击技能', {
      fontSize: '13px', color: '#f5c518', fontStyle: 'bold'
    }).setOrigin(0.5, 0.5);

    this.attackName = this.add.text(500, 335, '-', {
      fontSize: '12px', color: '#ffffff', fontStyle: 'bold'
    }).setOrigin(0.5, 0.5);

    this.attackDesc = this.add.text(500, 355, '', {
      fontSize: '10px', color: '#aaaaaa', align: 'center', wordWrap: { width: 140 }
    }).setOrigin(0.5, 0);

    this.attackType = this.add.text(500, 400, '', {
      fontSize: '11px', color: '#888888'
    }).setOrigin(0.5, 0.5);
  }

  updateDetailPanel(charId) {
    if (!charId) return;
    const char = CHARACTERS[charId];

    this.detailName.setText(char.name);
    this.detailDesc.setText(char.description);
    this.hpValue.setText(char.maxHp.toString());
    this.speedValue.setText(char.speed.toString());
    this.attackName.setText(char.attack.name);
    this.attackDesc.setText(char.attack.description);

    const typeLabels = {
      [ATTACK_TYPE.MELEE]: '⚔ 近战',
      [ATTACK_TYPE.RANGED]: '🏹 远程',
      [ATTACK_TYPE.AURA]: '✦ 光环',
      [ATTACK_TYPE.CHARGE]: '⚡ 冲锋',
    };
    this.attackType.setText(typeLabels[char.attack.type] || '');
  }

  selectCharacter(charId) {
    this.selectedChar = charId;

    // 更新所有卡片样式
    this.charButtons.forEach(btn => {
      const isSelected = btn.id === charId;
      btn.bg.clear();
      btn.bg.fillStyle(isSelected ? 0x3d5c3d : 0x2d2d44, 1);
      btn.bg.fillRoundedRect(-70, -70, 140, 140, 10);
      btn.bg.lineStyle(isSelected ? 3 : 2, isSelected ? 0x00ff00 : 0x444466, 1);
      btn.bg.strokeRoundedRect(-70, -70, 140, 140, 10);
    });

    // 更新详情
    this.updateDetailPanel(charId);

    // 启用开始按钮
    this.startButton.setVisible(true);
    this.startButton.setActive(true);

    // 显示电脑选择提示
    this.cpuText.setText('电脑将随机选择角色');
  }

  createStartButton() {
    this.startButton = this.add.container(500, 480);

    const bg = this.add.graphics();
    bg.fillStyle(0x22c55e, 1);
    bg.fillRoundedRect(-70, -25, 140, 50, 8);
    bg.lineStyle(2, 0x16a34a, 1);
    bg.strokeRoundedRect(-70, -25, 140, 50, 8);

    const text = this.add.text(0, 0, '开始游戏', {
      fontSize: '18px',
      fontFamily: 'Arial',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5, 0.5);

    this.startButton.add([bg, text]);

    const hitArea = new Phaser.Geom.Rectangle(-70, -25, 140, 50);
    this.startButton.setInteractive(hitArea, Phaser.Geom.Rectangle.Contains);

    this.startButton.on('pointerover', () => {
      bg.clear();
      bg.fillStyle(0x4ade80, 1);
      bg.fillRoundedRect(-70, -25, 140, 50, 8);
      this.game.canvas.style.cursor = 'pointer';
    });

    this.startButton.on('pointerout', () => {
      bg.clear();
      bg.fillStyle(0x22c55e, 1);
      bg.fillRoundedRect(-70, -25, 140, 50, 8);
      this.game.canvas.style.cursor = 'default';
    });

    this.startButton.on('pointerdown', () => {
      this.startGame();
    });

    // 初始隐藏
    this.startButton.setVisible(false);
    this.startButton.setActive(false);
  }

  createBackButton() {
    const button = this.add.container(60, 620);

    const text = this.add.text(0, 0, '← 返回', {
      fontSize: '14px',
      fontFamily: 'Arial',
      color: '#888888',
    }).setOrigin(0.5, 0.5);

    button.add(text);
    button.setSize(80, 30);
    button.setInteractive();

    button.on('pointerover', () => {
      text.setColor('#ffffff');
      this.game.canvas.style.cursor = 'pointer';
    });

    button.on('pointerout', () => {
      text.setColor('#888888');
      this.game.canvas.style.cursor = 'default';
    });

    button.on('pointerdown', () => {
      this.scene.start('MenuScene');
    });
  }

  startGame() {
    if (!this.selectedChar) return;

    // 电脑随机选择（不能和玩家相同）
    const availableChars = this.charKeys.filter(k => k !== this.selectedChar);
    const cpuChar = availableChars[Math.floor(Math.random() * availableChars.length)];

    // 切换到游戏场景，传递角色选择
    this.scene.start('GameScene', {
      playerChar: this.selectedChar,
      cpuChar: cpuChar,
      mode: this.gameMode,
    });
  }
}
