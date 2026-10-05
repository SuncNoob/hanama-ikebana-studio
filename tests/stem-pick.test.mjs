// SPDX-FileCopyrightText: 2026 Marko Sun
// SPDX-License-Identifier: LicenseRef-Hanama-Proprietary
import test from 'node:test';
import assert from 'node:assert/strict';
import {PICK_ALPHA,pickOrder,stemDistance,stemHits,choosePick,cycleOrder,nextInCycle,strokeTouches} from '../dist/stem-pick.js?v=hn2';
import {sourceToStage} from '../dist/geometry.js?v=28';

/** A 100×200 px specimen (ratio 0.5) standing 40% of the stage tall with its base at (50%, 80%). */
const asset={width:100,heightPx:200,anchor:.5,split:.5};
const item=(over={})=>({id:'a',type:'t',x:50,y:80,h:40,angle:0,trim:0,flip:false,length:1,cropAnchorY:1,cropAnchorSourceY:null,aboveVessel:false,...over});
/** A 10×20 alpha mask: a one-pixel stem in column 5 and a 4×4 head in the top-left corner. */
function mask(){
 const w=10,h=20,data=new Uint8Array(w*h);
 for(let y=0;y<h;y++)data[y*w+5]=255;
 for(let y=0;y<4;y++)for(let x=0;x<4;x++)data[y*w+x]=200;
 return {w,h,data};
}
const sprite=()=>({mask:mask(),crop:{x:0,y:0,width:100,height:200,fullWidth:100,fullHeight:200,bottom:1}});
/** Stage point of mask pixel centre (px, py). */
const at=(it,px,py,m=mask())=>sourceToStage([(px+.5)/m.w,(py+.5)/m.h],it,asset);
const stagePx=500;// unit = 500 × 0.4 = 200 CSS px per item height; 10 CSS px per mask px on both axes

test('a point on a visible mask pixel is distance 0, transparent paper inside the box is not a hit',()=>{
 const it=item(),sp=sprite();
 assert.equal(stemDistance(at(it,5,12),it,asset,sp,{stagePx,radius:0}),0);
 assert.equal(stemDistance(at(it,1,1),it,asset,sp,{stagePx,radius:0}),0,'the head');
 assert.equal(stemDistance(at(it,8,12),it,asset,sp,{stagePx,radius:6}),null,'inside the box, 2.5 mask px (25 CSS px) from the stem');
 assert.equal(Math.round(stemDistance(at(it,8,12),it,asset,sp,{stagePx,radius:30})),25,'distance runs to the pixel edge: 2.5 mask px × 10 CSS px');
});

test('the tolerance is in on-screen CSS px, so zooming in narrows it in stage terms',()=>{
 const it=item(),sp=sprite(),p=at(it,6,12);// centre of the pixel right of the stem: half a mask px from its edge
 assert.equal(Math.round(stemDistance(p,it,asset,sp,{stagePx,radius:6})),5,'5 CSS px away at 1×: a hit');
 assert.equal(stemDistance(p,it,asset,sp,{stagePx:stagePx*2,radius:6}),null,'10 CSS px away at 2× zoom: paper');
});

test('rotation and mirroring map through the same transform the stage uses',()=>{
 for(const over of [{angle:90},{angle:-37},{flip:true},{flip:true,angle:150}]){
  const it=item(over),sp=sprite();
  assert.equal(stemDistance(at(it,5,15),it,asset,sp,{stagePx,radius:0}),0,JSON.stringify(over));
  assert.equal(stemDistance(at(it,2,2),it,asset,sp,{stagePx,radius:0}),0,`${JSON.stringify(over)} head`);
  assert.equal(stemDistance(at(it,8,15),it,asset,sp,{stagePx,radius:6}),null,`${JSON.stringify(over)} paper`);
 }
});

test('alpha at or below the threshold is paper',()=>{
 const it=item(),sp=sprite();sp.mask.data.fill(PICK_ALPHA);
 assert.equal(stemDistance(at(it,5,12),it,asset,sp,{stagePx,radius:12}),null);
});

test('without a mask the crop rectangle stands in (evicted or missing sprite), and with no sprite the whole frame',()=>{
 const it=item(),crop={x:20,y:0,width:60,height:200,fullWidth:100,fullHeight:200,bottom:1};
 assert.equal(stemDistance(at(it,8,12),it,asset,{crop},{stagePx,radius:0}),null,'u 0.85 is right of the crop');
 assert.equal(stemDistance(at(it,7,12),it,asset,{crop},{stagePx,radius:0}),0);
 assert.equal(stemDistance(at(it,9,1),it,asset,null,{stagePx,radius:0}),0,'whole frame');
 assert.equal(stemDistance([.9,.6],it,asset,null,{stagePx,radius:6}),null,'outside the frame');
});

test('pickOrder lists stems in front of the vessel first, each group from the last drawn',()=>{
 const items=[{id:'b1'},{id:'f1',aboveVessel:true},{id:'b2'},{id:'f2',aboveVessel:true}];
 assert.deepEqual(pickOrder(items).map(i=>i.id),['f2','f1','b2','b1']);
});

test('stemHits reports every stem within the radius, top-most first, with its rank',()=>{
 const back=item({id:'back'}),front=item({id:'front',aboveVessel:true}),far=item({id:'far',x:20});
 const sprites={back:sprite(),front:sprite(),far:sprite()};
 const hits=stemHits(at(back,5,12),[back,front,far],{assetOf:()=>asset,spriteOf:i=>sprites[i.id],stagePx,radius:6});
 assert.deepEqual(hits,[{id:'front',d:0,z:0},{id:'back',d:0,z:2}],'far (z 1) is out of reach');
});

test('choosePick: what is seen under the point, the selected stem near it, else the nearest',()=>{
 const hits=[{id:'top',d:0,z:0},{id:'mid',d:3,z:1},{id:'low',d:0,z:2}];
 assert.equal(choosePick(hits,null,{radius:6}),'top','the top-most stem under the point');
 assert.equal(choosePick(hits,'low',{radius:6}),'top','a stem drawn above the selected one and under the point wins');
 assert.equal(choosePick([{id:'near',d:4,z:0},{id:'sel',d:0,z:1}],'sel',{radius:6}),'sel');
 assert.equal(choosePick([{id:'under',d:0,z:1},{id:'sel',d:5,z:0}],'sel',{radius:6}),'sel','the selected stem above wins inside its tolerance');
 assert.equal(choosePick([{id:'under',d:0,z:1},{id:'sel',d:5,z:0}],'sel',{radius:6,keep:4}),'under','outside keep it does not');
 assert.equal(choosePick([{id:'over',d:0,z:0},{id:'sel',d:5,z:1}],'sel',{radius:6,keep:24,selectedFirst:true}),'sel','cut/erase keep their target');
 assert.equal(choosePick([{id:'a',d:4,z:0},{id:'b',d:2,z:1}],null,{radius:6}),'b','nearest when nothing is directly under');
 assert.equal(choosePick([{id:'a',d:2,z:0},{id:'b',d:2,z:1}],null,{radius:6}),'a','ties go to the higher stem');
 assert.equal(choosePick([{id:'a',d:9,z:0}],null,{radius:6}),null,'beyond the radius is paper');
 assert.equal(choosePick([],'sel',{radius:6}),null);
});

test('repeat taps walk down the stack and wrap',()=>{
 const order=cycleOrder([{id:'top',d:0,z:0},{id:'near',d:4,z:1},{id:'low',d:0,z:3},{id:'nearer',d:1,z:2}]);
 assert.deepEqual(order,['top','low','nearer','near']);
 assert.equal(nextInCycle(order,'top'),'low');
 assert.equal(nextInCycle(order,'near'),'top');
 assert.equal(nextInCycle(order,'gone'),'top');
 assert.equal(nextInCycle([],'x'),null);
});

test('strokeTouches: an erase stroke over paper is not a cut; one crossing the plant is, even between samples',()=>{
 const it=item(),m=mask(),src=(px,py)=>[(px+.5)/m.w,(py+.5)/m.h],r=.2/m.h;// 0.2 mask px
 assert.equal(strokeTouches(m,{points:[src(8,12),src(8,16)],radius:r},it,asset),false,'paper beside the stem');
 assert.equal(strokeTouches(m,{points:[src(5,12)],radius:r},it,asset),true,'a dab on the stem');
 assert.equal(strokeTouches(m,{points:[src(3,12),src(8,12)],radius:r},it,asset),true,'samples on both sides of the one-pixel stem');
 assert.equal(strokeTouches(m,{points:[src(8,12)],radius:2.6/m.h},it,asset),true,'the brush radius reaches the stem');
 assert.equal(strokeTouches(null,{points:[src(8,12)],radius:r},it,asset),true,'no mask: keep the old behaviour');
 assert.equal(strokeTouches(m,{points:[],radius:r},it,asset),false);
});
