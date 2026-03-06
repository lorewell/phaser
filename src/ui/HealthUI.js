export default class HealthUI{

 constructor(scene,hero){

  this.text = scene.add.text(
   10,10,
   "HP:"+hero.hp,
   {fontSize:"16px"}
  )

 }

 update(hero){

  this.text.setText("HP:"+hero.hp)

 }

}