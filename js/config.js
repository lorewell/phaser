const config = {
    type: Phaser.AUTO,
    // 游戏内部逻辑分辨率固定为 500×700（所有坐标、棋盘、棋子都基于此尺寸计算）
    width: 500,
    height: 700,
    parent: 'game-container',
    pixelArt: true, // 禁用平滑缩放，保持像素颗粒感
    scale: {
        mode: Phaser.Scale.FIT,          // 等比缩放，保持宽高比，不裁剪不拉伸
        autoCenter: Phaser.Scale.CENTER_BOTH, // 水平+垂直居中
        width: 500,
        height: 700,
        min: {
            width: 500,   // 最小宽度
            height: 700   // 最小高度
        }
    },
    scene: [MenuScene, GameScene]
};

const game = new Phaser.Game(config);