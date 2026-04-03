const config = {
    type: Phaser.AUTO,
    width: 450,  // 根据像素放大后的实际宽度
    height: 550, // 根据像素放大后的实际高度
    parent: 'game-container',
    pixelArt: true, // 核心：禁用平滑缩放，保持像素颗粒感
    scene: [GameScene]
};

const game = new Phaser.Game(config);