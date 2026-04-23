// =============================================
//  主菜单场景
// =============================================

class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MenuScene' });
  }

  preload() {
    // 预加载 HTML 模板
    this.load.html('menuHTML', 'menu.html');
  }

  create() {
    // 背景：设置 Canvas 背景图
    // 注意：确保你已经在 preload 中加载了 'menu_bg' 图片
    // if (this.textures.exists('menu_bg')) {
    //   this.add.image(300, 340, 'menu_bg');
    // }

    // 创建 DOM 元素，(0,0) 为左上角与 canvas 对齐
    const menu = this.add.dom(0, 0).createFromCache('menuHTML');
    menu.setSize(CANVAS_W, CANVAS_H);

    // 处理交互
    const pveBtn = menu.getChildByID('pve-btn');
    if (pveBtn) {
      pveBtn.addEventListener('click', () => {
        this.scene.start('CharacterSelectScene', { mode: 'pve' });
      });
    }

    const pvpBtn = menu.getChildByID('pvp-btn');
    if (pvpBtn) {
      pvpBtn.addEventListener('click', () => {
        this.scene.start('CharacterSelectScene', { mode: 'pvp' });
      });
    }
  }
}
