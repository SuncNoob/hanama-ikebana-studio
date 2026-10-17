// SPDX-FileCopyrightText: 2026 Marko Sun
// SPDX-License-Identifier: LicenseRef-Hanama-Proprietary
/** DOM-free core of the editable studies and the first-run draft, shared by app.js, node tests and dev scripts.
 Callers pass their asset map and item factory, so ids and language stay with the caller. */
import {mouthBase,solveTo,drawsStem,isKenzan,autoFront,angleCap,baseOffset,sizeRatioBounds,defaultStemGeometry} from './scale.js?v=scale4';
import {vesselGeometry} from './geometry.js?v=soft2';

const clamp=(n,a,b)=>Math.min(b,Math.max(a,n));
const localeIndex=lang=>lang==='zh'?0:lang==='en'?1:2;

/** A fresh item with every field the editor and validate() expect; `options` override the defaults. New items draw stems with renderer v2. */
export function createItem(a,type,id,options={}){const cutout=['generated-atelier','generated-editorial'].includes(a.source);return {id,type,x:50,y:65,h:a.height||48,angle:0,trim:cutout?6:0,flip:false,length:a.stemLength||1,cuts:[],segments:[],localCuts:[],pieceLabel:'',aboveVessel:false,cropAnchorY:1,cropAnchorSourceY:cutout?.94:null,sv:2,...options}}
/**
 * Drawn-stem renderer for an item (compositor.js composeSpecimen): 2, except for an item saved before renderer 2 existed
 * (no `sv`) that carries cuts, segments or local cuts. Those were made on renderer 1's pixels, so it keeps renderer 1.
 */
export const stemVersion=item=>item?.sv===2||!(item?.cuts?.length||item?.segments?.length||item?.localCuts?.length)?2:1;

/**
 * Place study-style specs ({type,to,s,flip,front,base}) in a vessel: each stem keeps its natural size (s within sizeBounds),
 * stands at the mouth (or on the kenzan pins), and is solved toward its `to` focus, [cm right, cm up] from the insertion point.
 * Low stems spread out along the mouth while tall ones gather toward its centre; photographed stems are cut rather than squashed;
 * drawn stems stay within their species' length and never tip more than angleCap(a). `front` defaults to the visible kenzan.
 */
export function placeSpecs(vessel,specs,{assetById,makeItem}){
 const insertion=vesselGeometry(vessel).insertion,kenzan=isKenzan(vessel);
 return specs.map(({type,to=[0,20],s=1,flip=false,front,base})=>{
  const a=assetById[type],above=front??kenzan,item=makeItem(type,{h:Math.round(a.height*clamp(s,...sizeRatioBounds(a))*10)/10,flip,aboveVessel:above});
  Object.assign(item,defaultStemGeometry(a,item));
  const stemBase=mouthBase(vessel,insertion[0]+(base??baseOffset(to[0],to[1])),.8,{front:above});
  const {miss,...fit}=solveTo(item,a,stemBase,[insertion[0]+to[0],insertion[1]-to[1]]);
  if(drawsStem(a))fit.angle=clamp(fit.angle,-angleCap(a),angleCap(a));
  return Object.assign(item,fit);
 });
}

/** Study items, back to front. */
export function buildStudyItems(study,{assetById,makeItem}){
 return placeSpecs(assetById[study.vessel],study.items,{assetById,makeItem});
}

/** A study as an editable draft: the caller's initial() supplies version, id and defaults; the study supplies the rest. */
export function buildStudyState(study,{assetById,lang='zh',makeItem,initial}){
 const items=buildStudyItems(study,{assetById,makeItem});
 return {...initial(),title:study.title[localeIndex(lang)],intention:'',vessel:study.vessel,scene:study.scene,light:study.light||undefined,subtitle:'',mood:study.mood,items};
}

/** First-run contemporary study: two ivory callas, low silver foliage, open space. */
export const demoVessel='editorial-aubergine';
export const demoSpecs=[{family:'calla',to:[-12,42]},{family:'eucalyptus',to:[-24,22],s:.9},{family:'calla',to:[14,28],s:.9,flip:true}];
/** The welcome composition is built like an editable study. */
export function buildDemoItems({assetById,makeItem,specimenFor}){
 const vessel=assetById[demoVessel],front=autoFront(vessel);
 return placeSpecs(vessel,demoSpecs.map(({family,type,...spec})=>({type:type||specimenFor(family).id,front,...spec})),{assetById,makeItem});
}
