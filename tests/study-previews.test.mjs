import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync,readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {studies} from '../dist/studies.js';

const dist=fileURLToPath(new URL('../dist/',import.meta.url));
const asset=id=>['png','webp','jpg'].some(ext=>existsSync(`${dist}assets/${id}.${ext}`));

test('every editable study has its materials, vessel, and a ready-to-display preview',()=>{
 assert.equal(studies.length,50);
 assert.equal(new Set(studies.map(study=>study.id)).size,studies.length);
 for(const study of studies){
  assert.ok(asset(study.vessel),`${study.id}: missing vessel ${study.vessel}`);
  for(const item of study.items)assert.ok(asset(item.type),`${study.id}: missing ${item.type}`);
  const preview=readFileSync(`${dist}previews/${study.id}.webp`);
  assert.ok(preview.length>4000,`${study.id}: empty preview`);
  assert.equal(preview.toString('ascii',0,4),'RIFF');
  assert.equal(preview.toString('ascii',8,12),'WEBP');
 }
});
