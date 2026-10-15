// SPDX-FileCopyrightText: 2026 Marko Sun
// SPDX-License-Identifier: LicenseRef-Hanama-Proprietary
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {normalizeFlex,hasFlex,createFlexChain,bendPoint,unbendPoint,flexGrid} from '../dist/flex.js?v=1';
import {dimensions,warpY,unwarpY,clamp,sourceToStage,stageToSource} from '../dist/geometry.js?v=organic3';
const close=(actual,expected,tolerance=1e-9)=>actual.forEach((n,i)=>assert.ok(Math.abs(n-expected[i])<tolerance,`${actual} differs from ${expected}`));
const asset={width:100,heightPx:240,anchor:.46,split:.55};
const base={x:52,y:79,h:48,trim:10,length:1.3,angle:0,flip:false,cropAnchorY:1};
const flex=[.01,.04,.08,.14,.20,.26,.31,.34];

test('saved flex is finite, bounded, eight segments, and absent/zero flex stays inactive',()=>{
 assert.deepEqual(normalizeFlex(null),[]);assert.deepEqual(normalizeFlex([]),[]);
 assert.deepEqual(normalizeFlex([Infinity,NaN,-2,2]),[0,0,-.6,.6,0,0,0,0]);
 assert.equal(hasFlex([]),false);assert.equal(hasFlex(Array(8).fill(0)),false);
 assert.equal(createFlexChain(flex,0).active,false);
});

test('eight forward segments preserve length, anchor the root and leave inserted stem pixels unchanged',()=>{
 const chain=createFlexChain(flex,.48);
 assert.equal(chain.points.length,9);close(chain.points[0],[0,0]);
 for(let i=0;i<8;i++)assert.ok(Math.abs(Math.hypot(chain.points[i+1][0]-chain.points[i][0],chain.points[i+1][1]-chain.points[i][1])-.06)<1e-12);
 close(bendPoint([0,0],chain),[0,0]);close(bendPoint([.02,-.1],chain),[.02,-.1]);close(bendPoint([-.02,0],chain),[-.02,0]);
 const top=bendPoint([.015,.48],chain),beyond=bendPoint([.015,.53],chain),d=chain.directions[7];
 close([beyond[0]-top[0],beyond[1]-top[1]],[d[0]*.05,d[1]*.05]);
});

test('nearest-segment inverse returns source coordinates along the stem and rigid tip',()=>{
 const chain=createFlexChain(flex,.48);
 for(const y of [-.03,0,.012,.07,.105,.165,.225,.285,.345,.405,.465,.52])for(const x of [-.003,0,.003])close(unbendPoint(bendPoint([x,y],chain),chain),[x,y]);
});

test('source, bend, mirror and rotation round-trip through one coordinate contract after crop and length edits',()=>{
 for(const angle of [0,-37,132])for(const flip of [false,true])for(const cropAnchorSourceY of [undefined,.82]){
  const item={...base,angle,flip,flex,cropAnchorSourceY};
  for(const point of [[asset.anchor,0],[asset.anchor,.13],[asset.anchor,.42],[asset.anchor,.71],[asset.anchor,.97],[asset.anchor+.01,.33]])close(stageToSource(sourceToStage(point,item,asset),item,asset),point,1e-8);
  const g=dimensions(item,asset),rootSourceY=cropAnchorSourceY??g.end;
  close(sourceToStage([asset.anchor,rootSourceY],item,asset),[item.x/100,item.y/100]);
 }
});

test('no flex and zero flex preserve the exact legacy floating-point transform',()=>{
 for(const item of [base,{...base,flip:true,angle:-51,cropAnchorSourceY:.84},{...base,cropAnchorY:.76}])for(const point of [[0,0],[.2,.8],[1,.92]]){
  const g=dimensions(item,asset),scale=item.h/100,dx=(point[0]-g.anchor)*g.ratio*scale*(item.flip?-1:1),dy=(warpY(point[1],g.split,g.length)-g.pivotY)*scale,a=item.angle*Math.PI/180;
  const expected=[item.x/100+dx*Math.cos(a)-dy*Math.sin(a),item.y/100+dx*Math.sin(a)+dy*Math.cos(a)];
  assert.deepEqual(sourceToStage(point,item,asset),expected);
  assert.deepEqual(sourceToStage(point,{...item,flex:[]},asset),expected);
  assert.deepEqual(sourceToStage(point,{...item,flex:Array(8).fill(0)},asset),expected);
 }
});

test('editorial blossoms remain rigid above their flexible stem, including mirrored picking coordinates',()=>{
 const rose={width:1024,heightPx:1536,anchor:.51,split:.94,bendLimit:.58};
 const points=[[.18,.16],[.82,.18],[.35,.47],[.68,.52]];
 for(const flip of [false,true]){
  const item={...base,h:42,trim:6,length:1,cropAnchorSourceY:.94,angle:31,flip};
  const straight=points.map(p=>sourceToStage(p,item,rose)),bent=points.map(p=>sourceToStage(p,{...item,flex},rose));
  for(let n=1;n<points.length;n++)assert.ok(Math.abs(Math.hypot(straight[n][0]-straight[0][0],straight[n][1]-straight[0][1])-Math.hypot(bent[n][0]-bent[0][0],bent[n][1]-bent[0][1]))<1e-10,'a petal surface must rotate without stretching');
  points.forEach((p,n)=>close(stageToSource(bent[n],{...item,flex},rose),p,1e-8));
 }
});

test('cutting a curved photographic stem anchors its actual cut end at the same vessel point',()=>{
 const curved={...asset,split:.94,stemAnchors:[[.5,.42],[.7,.53],[.94,.5]]};
 for(const [trim,sourceY,sourceX] of [[6,.94,.5],[30,.7,.53],[50,.5,.42]]){
  const item={...base,length:1,trim,flex,angle:-25,cropAnchorY:1};
  close(sourceToStage([sourceX,sourceY],item,curved),[item.x/100,item.y/100]);
 }
});

test('the actual DOM crop settlement preserves a curved flower position and uses its new measured anchor',()=>{
 const source=readFileSync(new URL('../dist/app.js',import.meta.url),'utf8'),body=source.match(/function stemStyle\(i\)\{([\s\S]*?)\n\}/)[1];
 const photo={width:100,heightPx:240,tip:[.52,.24],anchor:.5,split:.94,bendLimit:.5,stemAnchors:[[.5,.42],[.7,.59],[.94,.49]]};
 const canvas={width:100,height:168,crop:{x:0,y:0,width:100,height:168,fullWidth:100,fullHeight:168,bottom:1}};
 const style=Function('assetById','dimensions','specimenCanvas','clamp','unwarpY','warpY','sourceToStage',`return function(i){${body}}`)({photo},dimensions,()=>canvas,clamp,unwarpY,warpY,sourceToStage);
 for(const flip of [false,true])for(const curve of [[],flex]){
  const item={...base,type:'photo',length:1,trim:30,cropAnchorSourceY:.94,flip,flex:curve};
  const before=sourceToStage(photo.tip,item,photo),css=style(item),after=sourceToStage(photo.tip,item,photo);
  close(after,before);assert.equal(item.cropAnchorSourceY,.7);
  assert.ok(css.includes(`--anchor:${dimensions(item,photo).anchor*100}%`),'fallback uses the same newly settled anchor as native picking/export');
 }
});

test('cropped export mesh samples the same unbent source frame and chain extent as native rendering',()=>{
 const item={...base,flex,cropAnchorSourceY:.8},g=dimensions(item,asset),size=1000,fullW=item.h/100*size*g.ratio,fullH=item.h/100*size*g.height;
 const crop={x:20,y:30,width:60,height:180,fullWidth:100,fullHeight:240};
 const rect={left:-fullW*g.anchor+fullW*crop.x/crop.fullWidth,top:fullH*(crop.y/crop.fullHeight-g.pivotY/g.height),width:fullW*crop.width/crop.fullWidth,height:fullH*crop.height/crop.fullHeight};
 const chain=createFlexChain(flex,g.pivotY*item.h/100*size),mesh=flexGrid(rect,chain);
 assert.equal(mesh.vertices.length,85);assert.equal(mesh.triangles.length,128);
 for(const vertex of mesh.vertices){
  const [u,v]=vertex.uv,sourceU=(crop.x+u*crop.width)/crop.fullWidth;
  const warpedSourceY=(crop.y+v*crop.height)/crop.fullHeight*g.height;
  const sourceV=warpedSourceY<=g.split?warpedSourceY:g.split+(warpedSourceY-g.split)/g.length;
  const stage=sourceToStage([sourceU,sourceV],item,asset);
  close(vertex.point,[stage[0]*size-item.x/100*size,stage[1]*size-item.y/100*size],1e-8);
 }
});
