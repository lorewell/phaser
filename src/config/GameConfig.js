import BootScene from "../scenes/BootScene.js"
import DungeonScene from "../scenes/DungeonScene.js"

export default {

 type: Phaser.AUTO,

 parent: "game",

 width: 800,
 height: 600,

 pixelArt: true,

 backgroundColor: "#000000",

 scene: [
  BootScene,
  DungeonScene
 ]

}