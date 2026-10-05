// SPDX-FileCopyrightText: 2026 Marko Sun
// SPDX-License-Identifier: LicenseRef-Hanama-Proprietary
/** DOM-free core of the editable studies and the first-run draft, shared by app.js, node tests and dev scripts.
 Callers pass their asset map and item factory, so ids and language stay with the caller. */
import {mouthBase,solveTo,drawsStem,isKenzan,autoFront,angleCap,baseOffset,sizeRatioBounds} from './scale.js?v=hn2';
import {vesselGeometry} from './geometry.js?v=28';

const clamp=(n,a,b)=>Math.min(b,Math.max(a,n));
const localeIndex=lang=>lang==='zh'?0:lang==='en'?1:2;

/** A fresh item with every field the editor and validate() expect; `options` override the defaults. New items draw stems with renderer v2. */
export function createItem(a,type,id,options={}){return {id,type,x:50,y:65,h:a.height||48,angle:0,trim:0,flip:false,length:a.stemLength||1,cuts:[],segments:[],localCuts:[],pieceLabel:'',aboveVessel:false,cropAnchorY:1,cropAnchorSourceY:null,sv:2,...options}}
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
 return {...initial(),title:study.title[localeIndex(lang)],intention:'',vessel:study.vessel,scene:study.scene,mood:study.mood,items};
}

/** The first-run draft ("Where the Wind Passed"): pine as the main line, calla as the second, a chrysanthemum low on the far side. */
export const demoVessel='round';
export const demoSpecs=[{family:'pine',to:[-9,46]},{family:'calla',to:[-17,31]},{family:'chrysanthemum',to:[11,9],s:1.1}];
/** The demo's three stems in the round vase, built like a study; whether they sit before the vessel follows autoFront. */
export function buildDemoItems({assetById,makeItem,specimenFor}){
 const vessel=assetById[demoVessel],front=autoFront(vessel);
 return placeSpecs(vessel,demoSpecs.map(({family,...spec})=>({type:specimenFor(family).id,front,...spec})),{assetById,makeItem});
}
