export default class CombatSystem{

 static attack(attacker,defender){

  const damage =
   attacker.attack -
   defender.defense +
   Phaser.Math.Between(0,2)

  defender.hp -= Math.max(1,damage)

  if(defender.hp <=0){

   defender.sprite.destroy()

  }

 }

}