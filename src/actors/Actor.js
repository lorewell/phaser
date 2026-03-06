export default class Actor{

 constructor(scene,x,y,color){

  this.scene = scene

  this.x = x
  this.y = y

  this.sprite = scene.add.rectangle(
   x*scene.tileSize,
   y*scene.tileSize,
   scene.tileSize,
   scene.tileSize,
   color
  )

  this.sprite.setOrigin(0)

 }

 move(dx,dy){

  const nx = this.x + dx
  const ny = this.y + dy

  if(this.scene.isWalkable(nx,ny)){

   this.x = nx
   this.y = ny

   this.sprite.x = nx*this.scene.tileSize
   this.sprite.y = ny*this.scene.tileSize

  }

 }

}