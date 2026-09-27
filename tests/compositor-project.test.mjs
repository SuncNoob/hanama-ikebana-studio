import assert from 'node:assert/strict';
import test from 'node:test';
import {compositorLayerPlan,compositorManifest} from '../dist/compositor-project.js';

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
