export default class TurnSystem{

 constructor(scene){

  this.scene = scene

 }

 nextTurn(){

  this.scene.monsters.forEach(m=>{
   m.takeTurn(this.scene.hero)
  })

 }

}