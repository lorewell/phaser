export default class Room{

 constructor(x,y,w,h){

  this.x = x
  this.y = y
  this.w = w
  this.h = h

 }

 center(){

  return {
   x: Math.floor(this.x + this.w/2),
   y: Math.floor(this.y + this.h/2)
  }

 }

}