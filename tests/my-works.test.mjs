// SPDX-FileCopyrightText: 2026 Marko Sun
// SPDX-License-Identifier: LicenseRef-Hanama-Proprietary
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {deflateRawSync} from 'node:zlib';
import {crc32,zipFiles,readZip,unzipEntry,imageType,backupFiles,backupName,readBackup,keepIncoming,withTimeout,failedIds,BackupError,MAX_BACKUP_IMAGE} from '../dist/my-works.js?v=hn3';
import {initial,dist} from './helpers/catalog.mjs';

const JPEG=new Uint8Array([0xff,0xd8,0xff,0xe0,1,2,3,4,5,6]),PNG=new Uint8Array([0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a,0,0,0,13]),WEBP=new Uint8Array([0x52,0x49,0x46,0x46,0,0,0,0,0x57,0x45,0x42,0x50,0x56]);
const bytesOf=async blob=>new Uint8Array(await blob.arrayBuffer());
/** A strict validate() stand-in: a draft needs version 1–2 and an items array; returns a copy. */
const validate=v=>{if(!v||![1,2].includes(v.version)||!Array.isArray(v.items))throw Error('invalid');return structuredClone(v)};
const draft=(id,extra={})=>({...structuredClone(initial()),id,...extra});

test('crc32 matches the standard check value',()=>{
 assert.equal(crc32(new TextEncoder().encode('123456789')),0xcbf43926);
 assert.equal(crc32(new Uint8Array()),0);
});

test('zipFiles and readZip round-trip names (UTF-8), bytes and CRCs; empty and non-zip input is refused',async()=>{
 const files=[['manifest.json',new Blob(['{"a":1}'])],['works/草稿.json',new Blob(['{}'])],['works/x.art.jpg',new Blob([JPEG])]];
 const zip=await bytesOf(await zipFiles(files)),entries=readZip(zip);
 assert.deepEqual(entries.map(e=>e.name),files.map(f=>f[0]));
 for(const [i,entry] of entries.entries()){
  assert.equal(entry.method,0);
  assert.deepEqual(await unzipEntry(entry),await bytesOf(files[i][1]));
 }
 assert.throws(()=>readZip(new TextEncoder().encode('not a zip at all, just text')),e=>e instanceof BackupError&&e.code==='zip');
 assert.throws(()=>readZip(new Uint8Array(10)),BackupError);
 const broken=zip.slice();broken[broken.length-6]^=0xff;// central directory offset now points nowhere
 assert.throws(()=>readZip(broken),BackupError);
 const damaged=zip.slice(),at=entries[0].data.byteOffset;damaged[at]^=0x01;
 await assert.rejects(unzipEntry(readZip(damaged)[0]),/damaged/,'a changed byte fails the CRC');
 await assert.rejects(unzipEntry(entries[2],{max:4}),e=>e.code==='size');
});

test('a backup re-zipped with deflate (as desktop zip tools do) still reads',async()=>{
 const zip=await bytesOf(await zipFiles([['a.txt',new Blob(['hello hello hello hello'])]])),[entry]=readZip(zip);
 const packed=deflateRawSync(Buffer.from(entry.data));
 const restored=await unzipEntry({...entry,method:8,data:new Uint8Array(packed)});
 assert.equal(new TextDecoder().decode(restored),'hello hello hello hello');
 await assert.rejects(unzipEntry({...entry,method:12}),e=>e.code==='zip','other methods are refused');
});

test('a backup unzipped and zipped again under its folder (Finder, Explorer) restores too',async()=>{
 const records=[{id:'w-1',state:draft('w-1',{light:'moon'}),title:'Folder',updated:5,preview:new Blob([JPEG],{type:'image/jpeg'}),art:new Blob([PNG],{type:'image/png'}),artKind:'real'}];
 const files=backupFiles(records,{now:0}),folder='hanama-backup-2026-10-09/';
 const nested=[[folder,new Blob([])],...files.map(([name,blob])=>[folder+name,blob]),...files.map(([name])=>[`__MACOSX/${folder}._${name.split('/').pop()}`,new Blob([new Uint8Array([0,5,22,7])])])];
 const {records:back,skipped,total}=await readBackup(await bytesOf(await zipFiles(nested)),{validate});
 assert.deepEqual([back.length,skipped,total],[1,0,1]);
 assert.equal(back[0].state.light,'moon');assert.deepEqual(await bytesOf(back[0].art),PNG);assert.deepEqual(await bytesOf(back[0].preview),JPEG);
 const deeper=await zipFiles(files.map(([name,blob])=>[`a/b/${name}`,blob]));
 await assert.rejects(readBackup(await bytesOf(deeper),{validate}),e=>e.code==='manifest','only one folder level is looked into');
});

test('imageType sniffs JPEG, PNG and WebP and nothing else',()=>{
 assert.equal(imageType(JPEG),'image/jpeg');assert.equal(imageType(PNG),'image/png');assert.equal(imageType(WEBP),'image/webp');
 assert.equal(imageType(new TextEncoder().encode('<svg xmlns="http://www.w3.org/2000/svg"/>')),null);
 assert.equal(imageType(new Uint8Array()),null);
});

test('backup → restore keeps every work, its fields and its images byte for byte',async()=>{
 const records=[
  {id:'draft-1',state:draft('draft-1',{light:'dusk'}),title:'Morning pine',updated:1000,preview:new Blob([JPEG],{type:'image/jpeg'}),art:null},
  {id:'art-2',state:draft('art-2'),title:'A photo',updated:2000,preview:new Blob([JPEG],{type:'image/jpeg'}),art:new Blob([PNG],{type:'image/png'}),sourceId:'draft-1',generation:'creative',artKind:'real',prompt:'Create an image…'},
  {id:'bad id!',state:draft('x'),title:'skipped at backup',updated:1,preview:new Blob([JPEG])}
 ];
 const files=backupFiles(records,{now:Date.UTC(2026,9,9)});
 assert.deepEqual(files.map(f=>f[0]),['manifest.json','works/draft-1.json','works/draft-1.preview.jpg','works/art-2.json','works/art-2.preview.jpg','works/art-2.art.png']);
 const manifest=JSON.parse(await files[0][1].text());
 assert.deepEqual({app:manifest.app,version:manifest.version,works:manifest.works},{app:'hanama',version:1,works:2});
 const zip=await bytesOf(await zipFiles(files)),{records:back,skipped,total}=await readBackup(zip,{validate});
 assert.equal(skipped,0);assert.equal(total,2);
 assert.deepEqual(back.map(r=>r.id),['draft-1','art-2']);
 assert.equal(back[0].state.light,'dusk','optional state fields travel with the work');
 assert.equal(back[0].art,null);assert.equal(back[0].title,'Morning pine');assert.equal(back[0].updated,1000);
 assert.deepEqual(await bytesOf(back[1].art),PNG);assert.equal(back[1].art.type,'image/png');
 assert.deepEqual(await bytesOf(back[1].preview),JPEG);
 assert.deepEqual([back[1].sourceId,back[1].generation,back[1].artKind,back[1].prompt],['draft-1','creative','real','Create an image…']);
 assert.equal(back[1].state.id,'art-2','the state carries the record id');
});

test('restore is strict: invalid drafts, odd ids, foreign images and oversize images are skipped; a bad preview only loses the preview',async()=>{
 const json=v=>new Blob([JSON.stringify(v)]);
 const files=[
  ['manifest.json',json({app:'hanama',version:1})],
  ['works/ok.json',json({id:'ok',title:'ok',updated:5,state:draft('ok'),preview:'works/ok.preview.jpg'})],['works/ok.preview.jpg',new Blob([JPEG])],
  ['works/invalid.json',json({id:'invalid',updated:5,state:{version:9,items:[]}})],
  ['works/odd.json',json({id:'../odd',updated:5,state:draft('odd')})],
  ['works/svg.json',json({id:'svg',updated:5,state:draft('svg'),art:'works/svg.art.png'})],['works/svg.art.png',new Blob(['<svg/>'])],
  ['works/missing.json',json({id:'missing',updated:5,state:draft('missing'),art:'works/nowhere.jpg'})],
  ['works/nopreview.json',json({id:'nopreview',updated:5,state:draft('nopreview'),preview:'works/nopreview.preview.jpg'})],['works/nopreview.preview.jpg',new Blob(['GIF89a'])],
  ['works/garbage.json',new Blob(['{not json'])],
  ['works/ok-dup.json',json({id:'ok',updated:9,state:draft('ok')})],
  ['works/fields.json',json({id:'fields',title:'x'.repeat(500),updated:-3,state:draft('fields'),sourceId:'no good',generation:'wild',artKind:'real',prompt:'p'.repeat(5000)})]
 ];
 const {records,skipped,total}=await readBackup(await bytesOf(await zipFiles(files)),{validate});
 assert.deepEqual(records.map(r=>r.id),['ok','nopreview','fields']);
 assert.equal(total,9);assert.equal(skipped,7,'invalid, odd, svg, missing, garbage, duplicate id, and the lost preview count');
 assert.equal(records[1].preview,null,'the app draws a new preview');
 const f=records[2];
 assert.equal(f.title.length,120);assert.equal(f.updated,0);assert.equal(f.prompt.length,4000);
 assert.ok(!('sourceId' in f)&&!('generation' in f)&&!('artKind' in f),'unknown values are dropped; artKind needs an artwork');
 const big=[['manifest.json',json({app:'hanama',version:1})],['works/big.json',json({id:'big',updated:1,state:draft('big'),art:'works/big.art.jpg'})],['works/big.art.jpg',new Blob([JPEG,new Uint8Array(64)])]];
 const capped=await readBackup(await bytesOf(await zipFiles(big)),{validate,maxImage:32});
 assert.equal(capped.records.length,0);assert.equal(capped.skipped,1,'an artwork over the cap drops the work');
 assert.equal(MAX_BACKUP_IMAGE,15*1024*1024);
});

test('only a Hanama backup of a known version is read',async()=>{
 const zipOf=async manifest=>bytesOf(await zipFiles(manifest===undefined?[['a.txt',new Blob(['x'])]]:[['manifest.json',new Blob([JSON.stringify(manifest)])]]));
 for(const manifest of [undefined,{app:'other',version:1},{app:'hanama',version:2},{app:'hanama',version:0},{app:'hanama'}])
  await assert.rejects(readBackup(await zipOf(manifest),{validate}),e=>e instanceof BackupError&&e.code==='manifest',JSON.stringify(manifest));
 const empty=await readBackup(await zipOf({app:'hanama',version:1}),{validate});
 assert.deepEqual([empty.records.length,empty.skipped,empty.total],[0,0,0]);
});

test('restore keeps whichever copy is newer, so a second restore changes nothing',()=>{
 assert.equal(keepIncoming(undefined,{updated:1}),true);
 assert.equal(keepIncoming({updated:5},{updated:6}),true);
 assert.equal(keepIncoming({updated:6},{updated:6}),false);
 assert.equal(keepIncoming({updated:7},{updated:6}),false);
 assert.equal(keepIncoming({updated:7},{updated:0}),false,'a work without a time never replaces one');
 assert.equal(keepIncoming({},{updated:3}),true,'a stored work without a time gives way');
});

test('backupName is a dated .zip, and the loading helpers time out and list failures',async()=>{
 assert.match(backupName(Date.UTC(2026,9,9,12)),/^hanama-backup-2026-10-(09|10)\.zip$/);
 let stopped=false;
 await assert.rejects(withTimeout(new Promise(()=>{}),10,()=>Error('slow'),()=>{stopped=true}),/slow/);
 assert.ok(stopped,'the stalled work is stopped');
 assert.equal(await withTimeout(Promise.resolve(4),1000),4);
 const ids=['a','b','c'],results=await Promise.allSettled([Promise.resolve(1),Promise.reject(Error('x')),Promise.reject(Error('y'))]);
 assert.deepEqual(failedIds(ids,results),['b','c']);
});

test('app.js: one zip writer, image timeouts, settled loading, the save-failure choice and backup buttons in three languages',()=>{
 const app=readFileSync(`${dist}app.js`,'utf8'),html=readFileSync(`${dist}index.html`,'utf8');
 assert.doesNotMatch(app,/function crc32|async function zipFiles/,'the zip writer lives in my-works.js only');
 assert.match(app,/withTimeout\(loaded\.then\(async\(\)=>\{try\{await Promise\.race\(\[img\.decode\?\.\(\),new Promise\(resolve=>setTimeout\(resolve,\d+\)\)\]\)\}catch\{\}return img\}\),IMAGE_TIMEOUT_MS/,
  'decode() waits for a rendered frame (never in a background tab), so it is only waited for briefly');
 assert.doesNotMatch(app,/await img\.decode\?\.\(\)\}/,'a bare decode() would time every image out in a background tab');
 assert.match(app,/const IMAGE_TIMEOUT_MS=20000;/);
 assert.match(app,/async function activateCanvas[^\n]*Promise\.allSettled[^\n]*askSaveFailed/);
 assert.match(app,/async function draftCanvas[^]*?Promise\.allSettled/);
 assert.doesNotMatch(app,/await Promise\.all\(\[\.\.\.new Set\(\[\.\.\.candidate\.items/,'opening a study never waits on every image succeeding');
 assert.match(app,/\$\('#save-button'\)\.onclick=async e=>\{e\.currentTarget\.disabled=true;askPersistentStorage\(\);/,'persist() is asked inside the save tap');
 for(const [zh,en,ja] of [['备份全部作品','Back up all works','すべての作品をバックアップ'],['从备份恢复','Restore from backup','バックアップから復元'],['直接打开','Open anyway','そのまま開く']])
  assert.ok(app.includes(`L('${zh}','${en}','${ja}')`),zh);
 assert.match(html,/<input type="file" id="backup-upload" accept="\.zip,application\/zip" hidden>/);
});
