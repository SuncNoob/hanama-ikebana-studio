// SPDX-FileCopyrightText: 2026 Marko Sun
// SPDX-License-Identifier: LicenseRef-Hanama-Proprietary
import test from 'node:test';
import assert from 'node:assert/strict';
import {assetById,vessels} from './helpers/catalog.mjs';
import {mouthTargets} from '../dist/mouth-targets.js';
import {vesselGeometry} from '../dist/geometry.js?v=soft2';
import {isKenzan,seatState} from '../dist/scale.js?v=hn3';

const close=(actual,expected,message)=>assert.ok(Math.abs(actual-expected)<1e-9,`${message}: ${actual} != ${expected}`);
const project=(span,x)=>Math.max(span.left,Math.min(span.right,x));

test('all 35 vessels expose finite support spans whose full width is seated, in both layers',()=>{
 assert.equal(vessels.length,35);
 for(const vessel of vessels){
  const geometry=vesselGeometry(vessel),targets=mouthTargets(vessel);
  assert.equal(targets.length,isKenzan(vessel)?geometry.fixture.centers.length:geometry.openings.length,vessel.id);
  for(const target of targets){
   assert.ok(target.left<target.right,`${vessel.id}: nonempty support span`);
   assert.ok(Object.values(target).every(n=>Number.isFinite(n)&&n>=0&&n<=100),`${vessel.id}: bounded stage coordinates`);
   for(const y of [target.y,target.frontY])for(const fraction of [0,.25,.5,.75,1]){
    const x=target.left+(target.right-target.left)*fraction;
    assert.ok(seatState({x,y,angle:0},null,vessel).seated,`${vessel.id}: unseated support ${x}, ${y}`);
   }
  }
 }
});

test('the steel loop keeps distinct left and right insertion openings',()=>{
 const vessel=assetById['modern-steel-loop-vessel'],g=vesselGeometry(vessel),targets=mouthTargets(vessel);
 assert.equal(targets.length,2);
 assert.ok(targets[0].right<targets[1].left,'the solid gap between the holes is not a support span');
 assert.ok(targets[1].left-g.insertion[0]>15,'right opening remains independent of the legacy left anchor');
 assert.ok(targets[1].y>targets[0].y,'different insertion depths are retained');
 for(let n=0;n<2;n++)close(targets[n].right-targets[n].left,g.openings[n].radius[0]*2*.82,'opening width');
});

test('the long trough exposes three separate kenzan spans and preserves front/back seating',()=>{
 const vessel=assetById['modern-travertine-trough'],g=vesselGeometry(vessel),targets=mouthTargets(vessel);
 assert.equal(targets.length,3);
 for(let n=0;n<3;n++){
  const target=targets[n],center=g.fixture.centers[n];
  close((target.left+target.right)/2,center[0],'holder center');
  close(target.right-target.left,g.fixture.radius[0]*1.5,'three-quarter holder radius');
  assert.ok(target.frontY>target.y,'front stems stand in front of the holder center');
  for(const y of [target.y,target.frontY])for(const x of [target.left,target.right]){
   const ellipse=((x-center[0])/g.fixture.radius[0])**2+((y-center[1])/g.fixture.radius[1])**2;
   assert.ok(ellipse<=1,'both support ends are on the holder');
  }
 }
 assert.ok(targets[0].right<targets[1].left&&targets[1].right<targets[2].left,'spaces between holders remain free');
});

test('wide openings retain off-center drop positions instead of collapsing them to the center',()=>{
 const vessel=assetById['english-pewter-compote'],target=mouthTargets(vessel)[0];
 assert.ok(target.right-target.left>20,'a wide bowl has a broad insertion span');
 for(const x of [target.left+1,target.right-1])close(project(target,x),x,'in-mouth X is preserved');
 close(project(target,target.right+2),target.right,'outside drop projects to the nearest span end');
 close(target.frontY,target.y,'a hidden support does not invent a front layer offset');
});

test('narrow necks remain narrow and source vessel geometry is not changed',()=>{
 const vessel=assetById['matte-black-long-neck'],before=JSON.stringify(vessel),g=vesselGeometry(vessel),target=mouthTargets(vessel)[0];
 assert.ok(target.right-target.left<3,'the neck is not expanded to a global magnet circle');
 close((target.left+target.right)/2,g.insertion[0],'legacy insertion X');
 close(target.y,g.insertion[1],'legacy insertion depth');
 assert.equal(JSON.stringify(vessel),before);
 assert.deepEqual(mouthTargets(null),[]);
});
