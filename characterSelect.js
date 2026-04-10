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
  }

  preload() {
    // 预加载 HTML 模板
    this.load.html('selectHTML', 'characterSelect.html');
  }

  create() {
    // 创建 DOM 元素
    const dom = this.add.dom(300, 340).createFromCache('selectHTML');
    
    // 获取 HTML 中的元素
    const cards = dom.node.querySelectorAll('.char-card');
    const startBtn = dom.getChildByID('start-btn');
    const detailPanel = dom.getChildByID('detail-content');
    const backBtn = dom.getChildByID('back-btn');

    // 绑定角色卡片点击和悬停
    cards.forEach(card => {
      const charId = card.dataset.id;
      const char = CHARACTERS[charId];

      card.addEventListener('click', () => {
        // 更新 UI 样式
        cards.forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        
        this.selectedChar = charId;
        startBtn.disabled = false;
        
        // 更新详情面板内容
        detailPanel.innerHTML = `
          <h3 style="color:#f5c518;margin-bottom:10px">${char.name}</h3>
          <p>❤️ 生命值: ${char.maxHp}</p>
          <p>⚡ 速度: ${char.speed}</p>
          <hr style="margin:10px 0; border:0; border-top:1px solid #444">
          <p style="font-weight:bold;color:#f5c518">战斗技能:</p>
          <p>${char.attack.name}</p>
          <p style="font-size:11px;color:#aaa">${char.attack.description}</p>
          <p style="margin-top:15px;font-style:italic">${char.description}</p>
        `;
      });
      
      card.addEventListener('mouseenter', () => {
        if (!this.selectedChar) {
           detailPanel.innerHTML = `<p style="text-align:center;margin-top:50px">点击选择: ${char.name}</p>`;
        }
      });
    });

    // 返回按钮
    backBtn.addEventListener('click', () => {
      this.scene.start('MenuScene');
    });

    // 开始游戏
    startBtn.addEventListener('click', () => {
      if (this.selectedChar) {
        // 电脑随机选择
        const charKeys = ['swift', 'tank', 'shadow', 'sniper'];
        const availableChars = charKeys.filter(k => k !== this.selectedChar);
        const cpuChar = availableChars[Math.floor(Math.random() * availableChars.length)];
        
        this.scene.start('GameScene', { 
          playerChar: this.selectedChar,
          cpuChar: cpuChar,
          mode: this.gameMode 
        });
      }
    });
  }
}
