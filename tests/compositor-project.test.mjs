// SPDX-FileCopyrightText: 2026 Marko Sun
// SPDX-License-Identifier: LicenseRef-Hanama-Proprietary
import assert from 'node:assert/strict';
import test from 'node:test';
import {compositorLayerPlan,compositorManifest} from '../dist/compositor-project.js?v=hn3';

const ids=Array.from({length:5},(_,i)=>`00000000-0000-4000-8000-${String(i+1).padStart(12,'0')}`);

test('cut pieces stay independent and preserve their order around the vessel',()=>{
 const original={id:'stem',aboveVessel:false},piece={id:'cut-piece',aboveVessel:true};
 const plan=compositorLayerPlan({items:[original,piece]},item=>item.id);
 assert.deepEqual(plan.map(pass=>pass.kind),['background','botanical','vessel','botanical','finish']);
 assert.equal(plan[1].item,original);
 assert.equal(plan[3].item,piece);
 const manifest=compositorManifest(1600,plan.map((pass,i)=>({id:ids[i],name:pass.name})),ids[0]);
 assert.deepEqual(manifest.layers.map(layer=>layer.name),['01 · Scene','stem','Vessel & support','cut-piece','Light & atmosphere']);
 assert.deepEqual(manifest.layers.map(layer=>layer.imageFile),ids.map(id=>`${id}.png`));
 assert.equal(manifest.activeLayerID,ids[3]);
 assert.deepEqual(manifest.layers[3].transform,{origin:[0,0],size:[1600,1600],rotation:0,flipX:false,flipY:false,sampling:'High quality'});
});

test('duplicate IDs cannot produce an unreadable Compositor package',()=>{
 assert.throws(()=>compositorManifest(1600,[{id:ids[0],name:'a'},{id:ids[0],name:'b'}],ids[0]),/Duplicate/);
});

test('optional passes put the ground shadow, inserted stem ends and front rim where the flat draft paints them',()=>{
 const back={id:'back',aboveVessel:false},front={id:'front',aboveVessel:true};
 const plan=compositorLayerPlan({items:[back,front]},item=>item.id,{ground:true,interior:true,rim:true});
 assert.deepEqual(plan.map(pass=>pass.kind),['background','ground','botanical','vessel','interior','botanical','rim','finish']);
 assert.equal(plan[2].item,back);assert.equal(plan[5].item,front);
 assert.deepEqual(plan.filter(pass=>pass.kind!=='botanical').map(pass=>pass.name),['01 · Scene','Vessel shadow','Vessel','Inserted stem ends & support','Vessel front rim','Light & atmosphere']);
 assert.deepEqual(compositorLayerPlan({items:[back,front]},item=>item.id,{rim:true}).map(pass=>pass.kind),['background','botanical','vessel','botanical','rim','finish']);
 // On a kenzan, the pins and water over the front stems' bases come right after those stems, under the rim.
 const kenzan=compositorLayerPlan({items:[back,front]},item=>item.id,{ground:true,interior:true,water:true,rim:true});
 assert.deepEqual(kenzan.map(pass=>pass.kind),['background','ground','botanical','vessel','interior','botanical','water','rim','finish']);
 assert.equal(kenzan.find(pass=>pass.kind==='water').name,'Kenzan pins & water');
 assert.equal(compositorLayerPlan({items:[back]},item=>item.id,{}).find(pass=>pass.kind==='vessel').name,'Vessel & support');
 const ids8=Array.from({length:8},(_,i)=>`00000000-0000-4000-8000-${String(i+1).padStart(12,'0')}`);
 assert.equal(compositorManifest(1600,plan.map((pass,i)=>({id:ids8[i],name:pass.name})),ids8[0]).layers.length,8);
});
