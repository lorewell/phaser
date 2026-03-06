import { MAP_WIDTH, MAP_HEIGHT, TILE } from "../utils/Constants.js"

export default class DungeonGenerator{

 static generate(){

  const map = []

  for(let y=0;y<MAP_HEIGHT;y++){

   map[y] = []

   for(let x=0;x<MAP_WIDTH;x++){

    if(
     x===0 ||
     y===0 ||
     x===MAP_WIDTH-1 ||
     y===MAP_HEIGHT-1
    ){
     map[y][x] = TILE.WALL
    }
    else{

     map[y][x] =
      Math.random()>0.2
      ? TILE.FLOOR
      : TILE.WALL

    }

   }

  }

  return map

 }

}