// SPDX-FileCopyrightText: 2026 Marko Sun
// SPDX-License-Identifier: LicenseRef-Hanama-Proprietary
import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {naturalStemRoutes,naturalStemRoutesV1,stemRoots,stemSpecs,stemPath,routeGap,swayShare,swayProfile,isWoody,expectedStemCm,MERGED_RATIO,BUNDLE_HALF_CM} from '../dist/natural-stems.js?v=hn2';
import {stemFix} from '../dist/real-scale.js?v=hn2';
import {specimenMetrics} from '../dist/asset-metrics.js?v=hn2';
import {createItem,stemVersion} from '../dist/study-state.js?v=hn3';
import {assetById,dist} from './helpers/catalog.mjs';

const asset={anchor:.5,height:12,group:'bloom'};

/** The drawn-stem router exactly as it shipped before renderer v2 (git 72a296c): the oracle for sv 1. */
function legacyRoutes(asset,roots,width,sourceHeight,bottom){
 const ordered=[...roots].sort((a,b)=>a.x-b.x),anchor=(asset.anchor??.5)*width;
 const cmPixels=sourceHeight/Math.max(1,asset.height);
 const cap=asset.group==='branch'?.85:asset.family==='sunflower'?.6:asset.family==='cosmos'?.24:.42;
 return ordered.map((root,index)=>{
  const x0=root.x,x1=anchor+(x0-anchor)*.48;
  const left=index?x0-ordered[index-1].x:Infinity,right=index<ordered.length-1?ordered[index+1].x-x0:Infinity;
  const room=Math.max(0,Math.min(left,right)),length=Math.max(0,bottom-root.y);
  const phase=Math.sin((x0/Math.max(1,width))*37+asset.height*1.71);
  const sway=phase*Math.min(width*.025,length*.048,room*.16);
  const dx=x1-x0;
  const p0=[x0,root.y],p1=[x0+dx*.13+sway,root.y+length*.28],p2=[x1-dx*.16+sway*.48,root.y+length*.72],p3=[x1,bottom];
  const sourceWidth=Math.max(.9,root.width||0),w0=Math.max(1.2,Math.min(sourceWidth,Math.min(root.startCm,cap)*cmPixels));
  const w1=Math.max(1,Math.min(root.endCm,cap*.86)*cmPixels);
  return {p0,p1,p2,p3,w0,w1,color:root.color};
 });
}

const bundle=[
 {x:160,y:300,width:24,startCm:.6,endCm:.5,color:'#63804b'},
 {x:55,y:315,width:18,startCm:.5,endCm:.4,color:'#698452'},
 {x:105,y:305,width:20,startCm:.6,endCm:.4,color:'#5d7844'}
];

test('v1 routes are exactly the routes that shipped before v2 (sv 1 sprites stay pixel-identical)',()=>{
 const fixtures=[
  [asset,bundle,220,400,1000],
  [{...asset,family:'cosmos'},[{x:65,y:170,width:90,startCm:1.2,endCm:.9,color:'#66794a'}],150,300,850],
  [{anchor:.62,height:25,group:'branch',family:'pussy-willow'},[{x:110,y:996,width:22,startCm:.5,endCm:.43,color:'#5c4b3b'},{x:313,y:998,width:18,startCm:.44,endCm:.37,color:'#736454'},{x:511,y:998,width:16,startCm:.42,endCm:.35,color:'#896f61'}],806,1000,1800],
  [{height:17,group:'bloom',family:'sunflower'},[{x:300,y:700,startCm:.77,endCm:.61,color:'#858c46'}],600,710,1500],
  [{anchor:.07,height:9,group:'bloom',family:'tulip'},[{x:40,y:640,width:30,startCm:.68,endCm:.58,color:'#919d56'}],560,640,640]
 ];
 for(const args of fixtures)assert.deepEqual(naturalStemRoutesV1(...args),legacyRoutes(...args));
});

test('v1: several visible cut ends keep their order and taper toward the vase',()=>{
 const routes=naturalStemRoutesV1(asset,bundle,220,400,1000);
 assert.deepEqual(routes.map(route=>route.p0[0]),[55,105,160]);
 for(const key of ['p0','p1','p2','p3'])for(let index=1;index<routes.length;index++)assert.ok(routes[index-1][key][0]<routes[index][key][0],`${key} crosses its neighbor`);
 for(const route of routes){assert.ok(route.w1<route.w0);assert.ok(route.p0[1]<route.p1[1]&&route.p1[1]<route.p2[1]&&route.p2[1]<route.p3[1]);assert.ok(Math.abs(route.p1[0]-route.p0[0])>0.01)}
});

test('fine cosmos stems remain fine even with an oversized catalogue width (v1 and v2)',()=>{
 for(const routes of [naturalStemRoutesV1,naturalStemRoutes]){
  const [route]=routes({...asset,family:'cosmos'},[{x:65,y:170,width:90,startCm:1.2,endCm:.9,color:'#66794a'}],150,300,850);
  assert.ok(route.w0<=.24*300/12+.001);
  assert.ok(route.w1<=.24*.86*300/12+.001);
 }
});

/** Every adjacent pair's centrelines, compared with the same routes without sway and with straight starts. */
const plainRoute=route=>({...route,sway:0,p1:[route.p0[0],route.p0[1]+Math.hypot(route.p1[0]-route.p0[0],route.p1[1]-route.p0[1])]});

test('v2 bundles gather within 1.4 cm in strict order, and sway or tangents never make neighbours touch',()=>{
 const cases=[
  {a:{...asset,id:'test-bundle'},roots:bundle,width:220,height:400,bottom:1000},
  {a:{id:'test-statice',family:'statice',group:'bloom',anchor:.465,height:25},width:1300,height:1150,bottom:2070,
   roots:[[.163,6.1],[.446,10.5],[.491,8.3],[.813,5.5]].map(([u,mm],i)=>({x:u*1300,y:1148,width:mm*4.6,startCm:.6,endCm:.5,color:'#7f9448',index:i,dir:[[.3,1],[.4,1],[-.15,1],[-.44,1]][i]}))},
  {a:{id:'test-lavender',family:'lavender',group:'branch',anchor:.54,height:20},width:1500,height:1300,bottom:2600,
   roots:[.235,.349,.499,.593,.72,.838].map((u,i)=>({x:u*1500,y:1299,width:2.5*6.5,startCm:.3,endCm:.25,color:'#9eb181',index:i,dir:[.3,1]}))}
 ];
 for(const {a,roots,width,height,bottom} of cases){
  const routes=naturalStemRoutes(a,roots,width,height,bottom),cmPixels=height/a.height,ends=routes.map(r=>r.p3[0]);
  for(let i=1;i<routes.length;i++){
   assert.ok(ends[i-1]<ends[i],`${a.id}: ends ${i-1} and ${i} tie or cross`);
   assert.ok(routes[i-1].p0[0]<routes[i].p0[0]);
   const gap=routeGap(routes[i-1],routes[i]),reference=routeGap(plainRoute(routes[i-1]),plainRoute(routes[i]));
   if(reference>0)assert.ok(gap>reference*.3-1e-9,`${a.id}: stems ${i-1} and ${i} touch (${gap} of ${reference})`);
  }
  assert.ok(Math.max(...ends)-Math.min(...ends)<=2*BUNDLE_HALF_CM*cmPixels+1e-6,`${a.id}: bundle spread`);
  for(const route of routes){
   assert.ok(route.p0[1]<route.p1[1]&&route.p1[1]<route.p2[1]&&route.p2[1]<route.p3[1],`${a.id}: route runs downward`);
   assert.ok(stemPath(route).every(p=>p.x-p.w/2>=-.5&&p.x+p.w/2<=width+.5),`${a.id}: stem stays inside the sprite`);
  }
 }
});

test('v2 widths start at the photographed stub, fall back to the species width for merged runs, and never swell',()=>{
 const cm=40,route=(a,root)=>naturalStemRoutes({anchor:.5,height:10,...a},[{x:200,y:399,startCm:.5,endCm:.42,color:'#6f8446',...root}],400,400,1200)[0];
 const lily=route({id:'t-lily',family:'lily',group:'bloom'},{width:.8*cm});
 assert.ok(Math.abs(lily.w0-.8*cm)<1e-9,'the stub sets the join width');assert.ok(lily.w1<lily.w0&&lily.w1>=lily.w0*.95,'herbs stay nearly uniform');
 const narcissus=route({id:'t-narcissus',family:'narcissus',group:'bloom'},{width:1.26*cm});
 assert.ok(Math.abs(narcissus.w0-1.26*cm)<1e-9,'a plausible stub wider than the profile still joins without a step');
 const anemone=route({id:'t-anemone',family:'anemone',group:'bloom'},{width:2.6*cm});
 assert.ok(2.6>MERGED_RATIO*expectedStemCm({family:'anemone'})&&Math.abs(anemone.w0-expectedStemCm({family:'anemone'})*cm)<1e-9,'a stub merged with its leaf ruff gets the species width');
 const merged=route({id:'t-lily2',family:'lily',group:'bloom'},{width:.5*cm,merged:true});
 assert.ok(Math.abs(merged.w0-.8*cm)<1e-9,'a merged run gets the expected width whatever it measured');
 for(const [family,mm] of [['jasmine',.15],['gypsophila',.2],['briza',.12]]){
  const thin=route({id:`t-${family}`,family,group:'branch'},{width:mm*cm});
  assert.ok(Math.abs(thin.w0-mm*cm)<1e-9&&thin.w1<=thin.w0,`${family} stays as fine as its stub`);
 }
 const rose=route({id:'t-rose',family:'rose',group:'bloom'},{width:.4*cm});
 assert.ok(isWoody({family:'rose'})&&rose.w1>rose.w0&&rose.w1<=.6*cm+1e-9,'woody stems thicken slightly toward the vase, up to the species base');
 const thickRose=route({id:'t-rose2',family:'rose',group:'bloom'},{width:.7*cm});
 assert.ok(thickRose.w1>=thickRose.w0-1e-9&&thickRose.w1<=thickRose.w0*1.12+1e-9);
 const freesia=route({id:'t-freesia',family:'freesia',group:'bloom'},{width:.32*cm,startCm:.3});
 assert.ok(Math.abs(freesia.w0-.32*cm)<1e-9,'families without a diameter follow a plausible stub too');
 const wide=route({id:'t-freesia2',family:'freesia',group:'bloom'},{width:.9*cm,startCm:.3});
 assert.ok(Math.abs(wide.w0-.3*cm)<1e-9,'and fall back to the catalogue width when the run is implausibly wide');
 const fixed=route({id:'t-magnolia',family:'magnolia',group:'branch'},{width:.7*cm,merged:true,fixed:true});
 assert.ok(Math.abs(fixed.w0-.7*cm)<1e-9,'a stemFix width is used as given');
});

test('v2 sway is a gentle S, deterministic per asset and stem index, whatever the item',()=>{
 assert.equal(swayProfile(0),0);assert.ok(Math.abs(swayProfile(1))<1e-12);
 assert.ok(Math.abs(swayProfile(.001))<1e-4,'leaves the stub tangentially');
 assert.ok(Math.abs(swayProfile(.326)-1)<.01&&Math.abs(swayProfile(.674)+1)<.01);
 for(let t=0;t<=1;t+=.05)assert.ok(Math.abs(swayProfile(t)+swayProfile(1-t))<1e-9);
 const ranges=[[{id:'photo-sakura',family:'sakura',group:'branch'},.02,.02],[{id:'photo-tulip',family:'tulip'},.05,.08],[{id:'photo-lily',family:'lily'},.03,.07]];
 for(const [a,low,high] of ranges)for(let i=0;i<6;i++){const share=swayShare(a,i);assert.equal(share,swayShare({...a},i));assert.ok(Math.abs(share)>=low-1e-12&&Math.abs(share)<=high+1e-12,`${a.id} #${i}: ${share}`)}
 const signs=new Set([0,1,2,3,4,5,6,7].map(i=>Math.sign(swayShare({id:'photo-lavender',family:'lavender'},i))));
 assert.equal(signs.size,2,'neighbouring stems sway both ways');
 // Split halves and duplicates get new item ids but share asset and stem index, so their stems match exactly.
 const a={id:'photo-lily',family:'lily',group:'bloom',anchor:.46,height:28},roots=[{x:300,y:399,width:20,startCm:.78,endCm:.61,color:'#82874a',index:0,dir:[0,1]}];
 assert.deepEqual(naturalStemRoutes(a,roots,600,400,1600),naturalStemRoutes({...a},roots.map(r=>({...r})),600,400,1600));
 assert.notDeepEqual(naturalStemRoutes(a,roots,600,400,1600)[0].sway,naturalStemRoutes({...a,id:'photo-lily-2'},roots,600,400,1600)[0].sway);
});

test('v2 stems leave their stub along its direction',()=>{
 const a={id:'t-tulip',family:'tulip',group:'bloom',anchor:.5,height:9};
 for(const dir of [[-.5,1],[0,1],[.35,1]]){
  const [route]=naturalStemRoutes(a,[{x:280,y:600,width:24,startCm:.68,endCm:.58,color:'#919d56',index:0,dir}],560,640,1600);
  const n=Math.hypot(...dir),hx=route.p1[0]-route.p0[0],hy=route.p1[1]-route.p0[1];
  assert.ok(Math.abs(hx*dir[1]/n-hy*dir[0]/n)<1e-6,'handle is parallel to the stub');
  const [p,q]=stemPath(route,400),len=Math.hypot(q.x-p.x,q.y-p.y);
  assert.ok(Math.abs((q.x-p.x)/len-dir[0]/n)<.02&&Math.abs((q.y-p.y)/len-dir[1]/n)<.02,'first segment follows the stub');
 }
});

/** A synthetic RGBA probe: transparent, with filled spans [y,x0,x1,[r,g,b]] (x1 exclusive). */
function probeOf(width,height,spans){
 const data=new Uint8ClampedArray(width*height*4);
 for(const [y,x0,x1,[r,g,b]] of spans)for(let x=Math.max(0,Math.round(x0));x<Math.min(width,Math.round(x1));x++){const i=(y*width+x)*4;data[i]=r;data[i+1]=g;data[i+2]=b;data[i+3]=255}
 return {data,width,height};
}
const STEM=[90,130,60],LEAF=[40,160,40],PETAL=[230,200,40];
const rows=(from,to,fn)=>{const out=[];for(let y=from;y<=to;y++)out.push(...fn(y));return out};

test('stemRoots measures a stub: centre, width, direction, colour, slanted cut faces, collars and touching petals',()=>{
 const tulip={id:'t',family:'tulip',group:'bloom',anchor:.46,height:20,stems:[[.46,.6,.5,'#919d56']]};
 const opts={bottom:200,scale:1,cmPixels:10};
 // A plain vertical stub, 12 px wide (1.2 cm at 10 px/cm; the tulip's 6 mm × 2.2 makes it plausible).
 let [root]=stemRoots(probeOf(100,200,rows(100,199,y=>[[y,40,52,STEM]])),tulip,opts);
 assert.equal(root.x,46);assert.equal(root.width,12);assert.deepEqual(root.dir,[0,1]);assert.equal(root.stub,'#5a823c');assert.equal(root.merged,false);
 // A stub leaning 0.3 px right per row downward: its direction follows, and its width is the true diameter.
 [root]=stemRoots(probeOf(100,200,rows(100,199,y=>[[y,26+(y-100)*.3,38+(y-100)*.3,STEM]])),{...tulip,stems:[[.6,.6,.5,'#919d56']]},opts);
 assert.ok(Math.abs(root.dir[0]/root.dir[1]-.3)<.05,`slope ${root.dir}`);
 assert.ok(Math.abs(root.width-12*root.dir[1])<1.01&&root.width<12);
 // A slanted cut face: the lowest 8 rows narrow to a point; the drawn stem starts where the stub is full width.
 [root]=stemRoots(probeOf(100,200,[...rows(100,191,y=>[[y,40,52,STEM]]),...rows(192,199,y=>[[y,40,52-(y-191)*1.5,STEM]])]),tulip,opts);
 assert.ok(root.y<=192.5&&root.y>=185,`root at ${root.y}`);assert.ok(Math.abs(root.width-12)<.1,`width ${root.width}`);
 // A wide leaf collar at the bottom: merged, so the catalogue u, the expected width and no stub colour.
 [root]=stemRoots(probeOf(100,200,[...rows(100,185,y=>[[y,40,52,STEM]]),...rows(186,199,y=>[[y,10,90,LEAF]])]),tulip,opts);
 assert.equal(root.merged,true);assert.equal(root.width,expectedStemCm(tulip)*10);assert.equal(root.stub,null);assert.ok(Math.abs(root.x-46)<1.01);
 // A petal touching the stub's right side above the cut: the centre keeps to the steady left edge and the colour stays green.
 [root]=stemRoots(probeOf(100,200,[...rows(100,199,y=>[[y,40,52,STEM]]),...rows(100,180,y=>[[y,52,52+Math.min(30,(181-y)*.8),PETAL]])]),tulip,opts);
 assert.ok(Math.abs(root.x-46)<.01&&root.width===12);assert.equal(root.stub,'#5a823c');
 // Nothing near u: no root, and no invented connector.
 assert.deepEqual(stemRoots(probeOf(100,200,rows(150,199,y=>[[y,90,99,STEM]])),tulip,opts),[]);
});

test('stemFix moves the search, steers, recolours, sets a width or adds a cut end, for v2 only',()=>{
 // Two 8 px stubs (0.8 cm at 10 px/cm, plausible for a 4 mm catalogue width): one the catalogue knows, one it misses.
 const probe=probeOf(100,200,[...rows(100,199,y=>[[y,20,28,STEM]]),...rows(120,199,y=>[[y,70,78,STEM]])]);
 const base={id:'t2',family:'freesia',group:'bloom',anchor:.5,height:20,stems:[[.24,.4,.35,'#486130']]};
 const opts={bottom:200,scale:1,cmPixels:10};
 const plainRoots=stemRoots(probe,base,opts);
 assert.equal(plainRoots.length,1);assert.equal(plainRoots[0].x,24);assert.equal(plainRoots[0].merged,false);assert.equal(plainRoots[0].steered,undefined);
 const roots=stemRoots(probe,{...base,stemFix:[{color:'#112233',dir:[.4,1]},{u:.74,startCm:.4,endCm:.35,color:'#445566'}]},opts);
 assert.equal(roots.length,2);assert.equal(roots[0].color,'#112233');assert.ok(roots[0].steered);assert.ok(Math.abs(roots[0].dir[0]/roots[0].dir[1]-.4)<1e-9);
 assert.equal(roots[1].index,1);assert.equal(roots[1].x,74);assert.equal(roots[1].color,'#445566');
 const [moved]=stemRoots(probe,{...base,stemFix:[{u:.72}]},opts);assert.equal(moved.x,74,'u moves the cut-end search');
 const [root]=stemRoots(probe,{...base,stemFix:[{mm:7}]},opts);assert.ok(root.fixed&&root.merged&&root.width===7);assert.equal(root.x,24);
 // Malformed entries are ignored; an added end needs u, both widths and a colour.
 assert.deepEqual(stemSpecs({stems:[[.3,.4,.35,'#486130']],stemFix:[{color:'green',dir:[1,0],u:'x',mm:-1},{u:.6,color:'#123456'},null]}),[{u:.3,startCm:.4,endCm:.35,color:'#486130',index:0}]);
});

test('the shipped stem fixes are well formed: the plan’s colour corrections, real cut ends, and the fourth pussy-willow twig',()=>{
 for(const [id,fixes] of Object.entries(stemFix)){
  const a=assetById[id];assert.ok(a?.stems,`${id} draws no stem`);assert.equal(a.stemFix,fixes,`${id}: applyRealScale attaches the fixes`);
  fixes.forEach((fix,index)=>{
   if(!fix)return;
   if(fix.color)assert.match(fix.color,/^#[0-9a-f]{6}$/i);
   if(index>=a.stems.length){
    assert.ok(Number.isFinite(fix.u)&&fix.startCm>0&&fix.endCm>0&&fix.color,`${id}: added cut end ${index} is incomplete`);
    assert.ok(specimenMetrics[id].bottomRuns.some(([u0,u1])=>fix.u>=u0&&fix.u<=u1),`${id}: added cut end ${index} is not on an opaque bottom run`);
   }
  });
 }
 const color=(id,i=0)=>stemSpecs(assetById[id])[i].color;
 assert.deepEqual([color('photo-hydrangea'),color('photo-peony'),color('photo-magnolia'),color('pose-pampas-alternate'),color('pose-muscari-alternate',1),color('pose-lilac-alternate'),color('photo-cosmos'),color('cosmos-burgundy-oblique')],
  ['#6b3f45','#7d6033','#8f866c','#8f7b4c','#71842b','#7b6c5a','#a88a45','#8f6a33']);
 assert.equal(stemSpecs(assetById['photo-pussy-willow']).length,4);
 assert.equal(assetById['photo-pussy-willow'].stems.length,3,'the catalogue (and v1) keep three stems');
 for(const id of ['photo-sweet-pea','photo-astrantia'])assert.notEqual(stemSpecs(assetById[id])[0].u,assetById[id].stems[0][0],`${id}: the cut end moved off the petal or leaf`);
});

test('renderer versions: new items use v2; items whose cuts were made on v1 pixels keep v1',()=>{
 assert.equal(createItem({height:20},'photo-lily','i1').sv,2);
 assert.equal(stemVersion({}),2);
 assert.equal(stemVersion({sv:1}),2,'nothing was cut, so nothing can misalign');
 for(const cut of [{cuts:[{}]},{segments:[{}]},{localCuts:[{}]}]){assert.equal(stemVersion(cut),1);assert.equal(stemVersion({...cut,sv:1}),1);assert.equal(stemVersion({...cut,sv:2}),2)}
 const app=readFileSync(`${dist}app.js`,'utf8'),compositor=readFileSync(`${dist}compositor.js`,'utf8');
 assert.match(app,/sv:stemVersion\(\{sv:i\.sv,cuts,segments,localCuts\}\)/,'validate() keeps or derives sv');
 assert.match(app,/\$\{k\}\|\$\{item\.sv\}\|/,'the sprite cache key includes sv');
 assert.match(app,/i\.localCuts=\[\];i\.segments=\[\];i\.pieceLabel='';i\.sv=2;/,'a pose swap drops the cuts and moves to v2');
 assert.match(app,/current\(\)\.cuts=\[\];current\(\)\.sv=stemVersion\(current\(\)\)/,'restoring brushwork re-derives sv');
 assert.match(app,/i\.sv===undefined\?\{\.\.\.i,sv:stemVersion\(i\)\}:i/,'stored works without sv render as the studio would open them');
 assert.match(compositor,/v2=item\.sv===2/,'composeSpecimen picks the renderer by item.sv');
});
