// Compositor's documented .comp package has PNG layers in bottom-to-top order.
// Format reference: https://github.com/robbietilton/Compositor/blob/main/docs/writing-comp-files.md
export function compositorLayerPlan(state,nameOf){
 const back=state.items.filter(item=>!item.aboveVessel);
 const front=state.items.filter(item=>item.aboveVessel);
 const botanical=item=>({kind:'botanical',item,name:nameOf(item)});
 return [
  {kind:'background',name:'01 · Scene'},
  ...back.map(botanical),
  {kind:'vessel',name:'Vessel & support'},
  ...front.map(botanical),
  {kind:'finish',name:'Light & atmosphere'}
 ];
}

export function compositorManifest(size,layers,documentID){
 if(!Number.isInteger(size)||size<1||size>30000)throw Error('Invalid Compositor canvas size');
 if(!layers.length||!layers.every(layer=>/^[A-F0-9-]{36}$/.test(layer.id)))throw Error('Invalid Compositor layer ID');
 const seen=new Set(layers.map(layer=>layer.id));if(seen.size!==layers.length)throw Error('Duplicate Compositor layer ID');
 return {
  format:'com.compositor.project',version:11,colorSpace:'sRGB',documentID,
  width:size,height:size,resolution:72,activeLayerID:layers.at(-2)?.id||layers[0].id,
  layers:layers.map(layer=>({
   id:layer.id,name:layer.name,imageFile:`${layer.id}.png`,isVisible:true,isGroup:false,
   opacity:1,blendMode:'Normal',
   transform:{origin:[0,0],size:[size,size],rotation:0,flipX:false,flipY:false,sampling:'High quality'}
  }))
 };
}
