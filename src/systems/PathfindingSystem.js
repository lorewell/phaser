export default class PathfindingSystem{

 static stepToward(monster,hero){

  const dx = hero.x - monster.x
  const dy = hero.y - monster.y

  if(Math.abs(dx) > Math.abs(dy))
   monster.move(Math.sign(dx),0)
  else
   monster.move(0,Math.sign(dy))

 }

}