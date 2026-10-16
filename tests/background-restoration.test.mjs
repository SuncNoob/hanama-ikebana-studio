import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {scenes} from '../dist/legacy-catalog.js?v=quiet2';
import {organicRoomLook,isNightScene,isPhotographicScene,paintOrganicRoom} from '../dist/organic-room.js?v=quiet2';

test('all nine backgrounds stay distinct under each light and survive the scene validation catalog',()=>{
 const keys=Object.keys(scenes);assert.equal(keys.length,9);
 for(const light of ['', 'morning','noon','dusk','moon']){
  const looks=keys.map(scene=>organicRoomLook({scene,light}).key);
  assert.equal(new Set(looks).size,9,`${light}: selecting a light must not replace the background`);
 }
 const html=readFileSync(new URL('../dist/index.html',import.meta.url),'utf8');
 for(const key of keys)assert.ok(html.includes(`data-scene="${key}"`),`${key} has a visible choice`);
 for(const file of ['iris-light','smoke-grey','charcoal','warm-plaster','rain-grey','earth-taupe','quiet-print','paper-relief','silver-grey']){
  const path=`assets/quiet/${file}.webp`;
  assert.ok(existsSync(new URL(`../dist/${path}`,import.meta.url)),path);
  assert.ok(html.includes(path),`${file} has a matching photographic thumbnail`);
 }
});

test('all nine photographic scenes have a safe undecoded fallback and only charcoal uses night treatment',()=>{
 let fills=0;const ctx={save(){},restore(){},createLinearGradient:()=>({addColorStop(){}}),fillRect(){fills++}};
 for(const scene of Object.keys(scenes)){
  assert.equal(isPhotographicScene(scene),true);
  assert.equal(paintOrganicRoom(ctx,200,{scene}),false);
  assert.equal(isNightScene(scene),scene==='night');
 }
 assert.equal(fills,9);
});
