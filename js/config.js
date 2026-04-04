const config = {
    type: Phaser.AUTO,
    width: 500,
    height: 700,
    parent: 'game-container',
    pixelArt: true,
    audio: {
        disableWebAudio: false
    },
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    scene: [MenuScene, GameScene]
};

const game = new Phaser.Game(config);