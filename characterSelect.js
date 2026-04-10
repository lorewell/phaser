// =============================================
//  角色选择场景 - 格斗游戏风格
// =============================================

class CharacterSelectScene extends Phaser.Scene {
  constructor() {
    super({ key: 'CharacterSelectScene' });
  }

  init(data) {
    this.gameMode = data.mode || 'pve'; // 'pve' 或 'pvp'
    this.p1CharId = null;
    this.p2CharId = null;
    this.selectingPlayer = 1; // 当前正在选人的玩家
  }

  preload() {
    // 预加载 HTML 模板
    this.load.html('selectHTML', 'characterSelect.html');
  }

  create() {
    // 创建 DOM 元素
    const dom = this.add.dom(300, 340).createFromCache('selectHTML');
    
    // 获取 HTML 中的元素
    const title = dom.getChildByID('select-title');
    const cards = dom.node.querySelectorAll('.char-card');
    const startBtn = dom.getChildByID('start-btn');
    const detailPanel = dom.getChildByID('detail-content');
    const backBtn = dom.getChildByID('back-btn');

    // 默认标题
    if (this.gameMode === 'pvp') {
      title.innerText = "玩家 1 选择角色";
      startBtn.innerText = "下一步";
    }

    // 绑定角色卡片点击和悬停
    cards.forEach(card => {
      const charId = card.dataset.id;
      const char = CHARACTERS[charId];

      card.addEventListener('click', () => {
        // 如果该角色已被另一名玩家选择，则不可点击
        if (card.classList.contains('disabled')) return;

        if (this.selectingPlayer === 1) {
          // 选中 P1
          cards.forEach(c => {
            c.classList.remove('selected', 'selected-p1');
          });
          card.classList.add('selected', 'selected-p1');
          this.p1CharId = charId;
          startBtn.disabled = false;
        } else {
          // 选中 P2
          cards.forEach(c => {
            if (c.dataset.id !== this.p1CharId) {
              c.classList.remove('selected', 'selected-p2');
            }
          });
          card.classList.add('selected', 'selected-p2');
          this.p2CharId = charId;
          startBtn.disabled = false;
        }
        
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
        if (!card.classList.contains('disabled')) {
           detailPanel.innerHTML = `<p style="text-align:center;margin-top:50px">点击选择: ${char.name}</p>`;
        }
      });
    });

    // 返回按钮
    backBtn.addEventListener('click', () => {
      this.scene.start('MenuScene');
    });

    // 开始游戏逻辑
    startBtn.addEventListener('click', () => {
      if (this.gameMode === 'pvp') {
        if (this.selectingPlayer === 1 && this.p1CharId) {
          // P1 选完了，切换到 P2
          this.selectingPlayer = 2;
          title.innerText = "玩家 2 选择角色";
          title.style.color = "#e94f3d"; // P2 选人标题变红
          startBtn.innerText = "开始战斗";
          startBtn.disabled = true;

          // 禁用 P1 选中的角色
          cards.forEach(c => {
            if (c.dataset.id === this.p1CharId) {
              c.classList.add('disabled');
              c.classList.remove('selected'); // 移除黄金边框，保留 P1 标签
            }
          });
          
          detailPanel.innerHTML = `<p>请玩家 2 选择角色</p>`;
        } else if (this.selectingPlayer === 2 && this.p2CharId) {
          // P2 选完了，进入战斗
          this.scene.start('GameScene', { 
            playerChar: this.p1CharId,
            cpuChar: this.p2CharId,
            mode: 'pvp' 
          });
        }
      } else {
        // PVE 模式
        if (this.p1CharId) {
          const charKeys = Object.keys(CHARACTERS);
          const availableChars = charKeys.filter(k => k !== this.p1CharId);
          const cpuChar = availableChars[Math.floor(Math.random() * availableChars.length)];
          
          this.scene.start('GameScene', { 
            playerChar: this.p1CharId,
            cpuChar: cpuChar,
            mode: 'pve' 
          });
        }
      }
    });
  }
}
