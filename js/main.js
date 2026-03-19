// ==========================================
// 【游戏入口 & Phaser 配置】
// ==========================================
import MenuScene    from './scenes/MenuScene.js';
import GameScene    from './scenes/GameScene.js';
import SettingsScene from './scenes/SettingsScene.js';

const config = {
    type: Phaser.AUTO,
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: 480,
        height: 800,
    },
    physics: {
        default: 'arcade',
        arcade: { gravity: { y: 0 }, debug: false },
    },
    // 场景列表：第一个为启动场景
    scene: [MenuScene, GameScene, SettingsScene],
};

new Phaser.Game(config);
