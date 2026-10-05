// SPDX-FileCopyrightText: 2026 Marko Sun
// SPDX-License-Identifier: LicenseRef-Hanama-Proprietary
// Compositor's documented .comp package has PNG layers in bottom-to-top order.
// Format reference: https://github.com/robbietilton/Compositor/blob/main/docs/writing-comp-files.md
/**
 * Bottom-to-top passes of a layered export. Without options this is the original five-kind plan. Options add the passes
 * the flat draft paints, so the layers composite to it pixel for pixel:
 * - `ground`: the vessel's floor and wall shadows get their own layer under the stems behind the vessel (the vessel pass
 *   then leaves them out);
 * - `interior`: stems behind the vessel that enter its openings, plus the visible support, go above the vessel (the vessel
 *   pass then leaves the support out);
 * - `water`: on a kenzan, the pins and water over the bases of the stems in front (paintKenzanPass), under the rim;
 * - `rim`: the vessel's front rim over the ends of stems in front of it.
 */
export function compositorLayerPlan(state,nameOf,{ground=false,interior=false,water=false,rim=false}={}){
 const back=state.items.filter(item=>!item.aboveVessel);
 const front=state.items.filter(item=>item.aboveVessel);
 const botanical=item=>({kind:'botanical',item,name:nameOf(item)});
 return [
  {kind:'background',name:'01 · Scene'},
  ...(ground?[{kind:'ground',name:'Vessel shadow'}]:[]),
  ...back.map(botanical),
  {kind:'vessel',name:interior?'Vessel':'Vessel & support'},
  ...(interior?[{kind:'interior',name:'Inserted stem ends & support'}]:[]),
  ...front.map(botanical),
  ...(water?[{kind:'water',name:'Kenzan pins & water'}]:[]),
  ...(rim?[{kind:'rim',name:'Vessel front rim'}]:[]),
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
