import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {photoSpecimens} from '../dist/photo-catalog.js';
import {newSpecimens} from '../dist/catalog.js';
import {foliageSpecimens} from '../dist/foliage-catalog.js';
import {studySpecimens} from '../dist/study-catalog.js';
import {poseSpecimens} from '../dist/pose-catalog.js';
import {additionalPoseSpecimens} from '../dist/additional-pose-catalog.js';

const legacy=['sakura','calla','chrysanthemum','pine','maple','pampas'].map(family=>({id:family,family}));
const catalog=[...photoSpecimens,...legacy,...newSpecimens,...foliageSpecimens,...studySpecimens,...poseSpecimens,...additionalPoseSpecimens];

test('every visible botanical family offers at least two poses',()=>{
 const families=new Map();
 for(const specimen of catalog)families.set(specimen.family,(families.get(specimen.family)||0)+1);
 assert.equal(families.size,78);
 assert.deepEqual([...families].filter(([,count])=>count<2),[]);
});

test('all new poses have distinct asset files and usable geometry',()=>{
 const ids=new Set();
 for(const pose of additionalPoseSpecimens){
  assert.ok(!ids.has(pose.id),`duplicate pose ID: ${pose.id}`);ids.add(pose.id);
  assert.ok(existsSync(fileURLToPath(new URL(`../dist/assets/${pose.id}.webp`,import.meta.url))),`missing ${pose.id}`);
  assert.ok(pose.width>0&&pose.heightPx>0&&pose.height>0,`invalid size: ${pose.id}`);
  assert.ok(pose.anchor>0&&pose.anchor<1,`invalid insertion point: ${pose.id}`);
  assert.ok(pose.stems?.length>0,`no visible stem: ${pose.id}`);
 }
 assert.equal(additionalPoseSpecimens.length,53);
});
