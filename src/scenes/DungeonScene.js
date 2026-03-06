import Phaser from "phaser"

import DungeonGenerator from "../dungeon/DungeonGenerator.js"

import Hero from "../actors/Hero.js"
import Monster from "../actors/Monster.js"

import {
 TILE_SIZE,
 TILE
} from "../utils/Constants.js"

export default class DungeonScene extends Phaser.Scene{

 constructor(){
  super("dungeon")
 }

 create(){

  this.tileSize = TILE_SIZE

  this.map =
   DungeonGenerator.generate()

  this.drawMap()

  this.hero = new Hero(this,2,2)

  this.monsters = [

   new Monster(this,10,10),
   new Monster(this,15,8)

  ]

  this.cursors =
   this.input.keyboard.createCursorKeys()

 }

 update(){

  if(Phaser.Input.Keyboard.JustDown(this.cursors.left)){
   this.playerMove(-1,0)
  }

  if(Phaser.Input.Keyboard.JustDown(this.cursors.right)){
   this.playerMove(1,0)
  }

  if(Phaser.Input.Keyboard.JustDown(this.cursors.up)){
   this.playerMove(0,-1)
  }

  if(Phaser.Input.Keyboard.JustDown(this.cursors.down)){
   this.playerMove(0,1)
  }

 }

 playerMove(dx,dy){

  this.hero.move(dx,dy)

  this.monsters.forEach(m=>{
   m.takeTurn()
  })

 }

 drawMap(){

  for(let y=0;y<this.map.length;y++){

   for(let x=0;x<this.map[0].length;x++){

    const tile = this.map[y][x]

    const color =
     tile===TILE.WALL
     ? 0x333333
     : 0x777777

    const rect = this.add.rectangle(
     x*this.tileSize,
     y*this.tileSize,
     this.tileSize,
     this.tileSize,
     color
    )

    rect.setOrigin(0)

   }

  }

 }

 isWalkable(x,y){

  if(x<0||y<0)return false

  if(y>=this.map.length)return false
  if(x>=this.map[0].length)return false

  return this.map[y][x]===TILE.FLOOR

 }

}