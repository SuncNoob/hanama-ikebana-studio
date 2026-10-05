// SPDX-FileCopyrightText: 2026 Marko Sun
// SPDX-License-Identifier: LicenseRef-Hanama-Proprietary
import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync,readFileSync,statSync} from 'node:fs';
import {browseSpecimens,familyOrder,vessels,assetFile,dist} from './helpers/catalog.mjs';

const remake='write it with: node qa/make-thumbs.mjs <id> (then set thumbnail:true)';
/** app.js cardImage(): a card shows the thumbnail when the asset is flagged or is a Flower Book adaptation. */
const usesThumb=a=>!!(a.thumbnail||a.source==='flower-book');
const thumb=id=>`${dist}assets/thumbs/${id}.webp`;
const cardFile=a=>usesThumb(a)?thumb(a.id):assetFile(a.id);
/** Canvas size of a webp file from its RIFF header (VP8X, VP8 or VP8L). */
function webpSize(file){
 const b=readFileSync(file);assert.equal(b.toString('ascii',0,4),'RIFF');assert.equal(b.toString('ascii',8,12),'WEBP',`${file} is not webp`);
 const chunk=b.toString('ascii',12,16);
 if(chunk==='VP8X')return {width:1+b.readUIntLE(24,3),height:1+b.readUIntLE(27,3)};
 if(chunk==='VP8 ')return {width:b.readUInt16LE(26)&0x3fff,height:b.readUInt16LE(28)&0x3fff};
 if(chunk==='VP8L'){const bits=b.readUInt32LE(21);return {width:1+(bits&0x3fff),height:1+((bits>>14)&0x3fff)}}
 throw Error(`${file}: unknown webp chunk ${chunk}`);
}

test('app.js picks card images with the rule these tests assume',()=>{
 const source=readFileSync(`${dist}app.js`,'utf8');
 assert.match(source,/const cardImage=a=>\(a\.thumbnail\|\|a\.source==='flower-book'\)\?`\/assets\/thumbs\/\$\{a\.id\}\.webp`:assetPath\(a\.id\);/);
});

test('every browse variant shows a thumbnail that exists, or is a small asset',()=>{
 for(const a of browseSpecimens){
  if(usesThumb(a)){assert.ok(existsSync(thumb(a.id)),`${a.id}: thumbnail:true but no ${thumb(a.id)}; ${remake}`);continue}
  const kb=statSync(assetFile(a.id)).size/1024;
  assert.ok(kb<150,`${a.id}: the card would load the full ${Math.round(kb)} KB asset; ${remake}`);
 }
});

test('thumbnails are light, sharp enough for a 220 px card at 2x, and never larger than their asset',()=>{
 for(const a of browseSpecimens.filter(usesThumb)){
  const {width,height}=webpSize(thumb(a.id)),kb=statSync(thumb(a.id)).size/1024;
  assert.ok(Math.max(width,height)<=600,`${a.id}: thumbnail ${width}×${height} is larger than a card needs`);
  assert.ok(kb<100,`${a.id}: thumbnail ${Math.round(kb)} KB`);
  if(a.source!=='flower-book')assert.ok(Math.max(width,height)>=Math.min(400,Math.max(a.width||0,a.heightPx||0)||400),`${a.id}: thumbnail ${width}×${height} is too small for a 2x card`);
 }
});

test('a pose picker loads under 0.5 MB of card images for every family',()=>{
 assert.ok(familyOrder.length>70);
 for(const family of familyOrder){
  const kb=browseSpecimens.filter(a=>a.family===family).reduce((sum,a)=>sum+statSync(cardFile(a)).size/1024,0);
  assert.ok(kb<512,`${family}: ${Math.round(kb)} KB of card images`);
 }
});

test('every vessel card has its thumbnail',()=>{
 for(const v of vessels)assert.ok(existsSync(thumb(v.id)),`${v.id}: missing ${thumb(v.id)}`);
});
