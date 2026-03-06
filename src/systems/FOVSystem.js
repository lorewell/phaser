export default class FOVSystem{

 static compute(px,py,radius){

  const visible = new Set()

  for(let y=-radius;y<=radius;y++){
   for(let x=-radius;x<=radius;x++){

    const dx = px + x
    const dy = py + y

    const dist = Math.sqrt(x*x+y*y)

    if(dist<=radius){

     visible.add(`${dx},${dy}`)

    }

   }
  }

  return visible

 }

}