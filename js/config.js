// 棋盘宽度 = (9-1)*46 + 46(边距) + 60(左右各30px边距) = 474
const BASE_WIDTH = 500;
const BASE_HEIGHT = 700;

const config = {
    type: Phaser.AUTO,
    width: BASE_WIDTH,
    height: BASE_HEIGHT,
    parent: 'game-container',
    pixelArt: true,
    audio: {
        disableWebAudio: false
    },
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        expandParent: false
    },
    scene: [MenuScene, GameScene]
};

const game = new Phaser.Game(config);
