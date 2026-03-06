import Actor from "./Actor.js"

export default class Monster extends Actor{

 constructor(scene,x,y){

  super(scene,x,y,0xff0000)

 }

 takeTurn(){

  const dirs = [
   [1,0],
   [-1,0],
   [0,1],
   [0,-1]
  ]

  const dir = Phaser.Math.RND.pick(dirs)

  this.move(dir[0],dir[1])

 }

}