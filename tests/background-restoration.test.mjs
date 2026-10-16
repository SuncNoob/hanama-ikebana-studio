import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {scenes} from '../dist/legacy-catalog.js?v=xia1';
import {organicRoomLook,isNightScene,paintOrganicRoom} from '../dist/organic-room.js?v=xia1';

test('all nine backgrounds stay distinct under each light and survive the scene validation catalog',()=>{
 const keys=Object.keys(scenes);assert.equal(keys.length,9);
 for(const light of ['', 'morning','noon','dusk','moon']){
  const looks=keys.map(scene=>organicRoomLook({scene,light}).key);
  assert.equal(new Set(looks).size,9,`${light}: selecting a light must not replace the background`);
 }
 const html=readFileSync(new URL('../dist/index.html',import.meta.url),'utf8');
 for(const key of keys)assert.ok(html.includes(`data-scene="${key}"`),`${key} has a visible choice`);
 for(const path of ['editorial/room-blush','editorial/room-ivory','editorial/room-plum','atelier/room-milk','atelier/room-sage','atelier/room-moon'])assert.ok(existsSync(new URL(`../dist/assets/${path}.webp`,import.meta.url)),path);
});

test('original three painted backgrounds render without image decoding and preserve dark-room treatment',()=>{
 const gradient=()=>({addColorStop(){}}),ctx={createLinearGradient:gradient,createRadialGradient:gradient,fillRect(){}};
 for(const scene of ['classic-paper','classic-stone','classic-night'])assert.equal(paintOrganicRoom(ctx,200,{scene}),true);
 for(const scene of Object.keys(scenes))assert.equal(isNightScene(scene),['night','atelier-moon','classic-night'].includes(scene));
});
