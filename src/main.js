// =============================================
// 格斗游戏 - 入口文件
// =============================================

const config = {
    type: Phaser.AUTO,
    width: GAME_CONFIG.width,
    height: GAME_CONFIG.height,
    parent: 'game-container',
    backgroundColor: '#0a0020',
    physics: {
        default: 'arcade',
        arcade: { 
            gravity: { y: GAME_CONFIG.gravity }, 
            debug: false 
        }
    },
    scene: FightScene
};

// 启动游戏
const game = new Phaser.Game(config);
