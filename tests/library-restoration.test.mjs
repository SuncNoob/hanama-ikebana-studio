import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync,readFileSync} from 'node:fs';
import vm from 'node:vm';
import {specimens,vessels,assetById,assetFile,dist} from './helpers/catalog.mjs';
import {buildSearchIndex,sizeOf,seasonShiftOf,currentSeason,shiftSeason,matchesSeason,sortByRole,matchesRole} from '../dist/library.js';
import {matchesMaterialColor} from '../dist/material-colors.js';

const source=readFileSync(`${dist}app.js`,'utf8');
const section=source.slice(source.indexOf('let familyBook='),source.indexOf('/** A family card:'));
const context=vm.createContext({specimens,vessels,assetById,state:{vessel:'editorial-aubergine'},familyFilter:'atelier',sizeOf,buildSearchIndex,seasonShiftOf,currentSeason,shiftSeason,matchesSeason,sortByRole,matchesRole,matchesMaterialColor,localStorage:{getItem:()=>null},L:(zh)=>zh,lang:'zh'});
vm.runInContext(section+';globalThis.library={librarySpecimens,libraryVesselCatalog,libraryFamilies,familyPoses,libraryFlowers,libraryVessels,libraryCount};',context);
const library=context.library;
const poses=rows=>rows.flatMap(row=>row.libraryPoses);

test('the default browser exposes all distinct catalogued plant poses and vessels',()=>{
 const rows=library.libraryFlowers('all',false,'all','');
 assert.equal(rows.length,78);
 assert.equal(poses(rows).length,198);
 assert.equal(new Set(poses(rows).map(a=>a.id)).size,198);
 assert.deepEqual([...poses(rows).map(a=>a.id)].sort(),specimens.map(a=>a.id).sort());
 assert.equal(library.libraryCount(rows),'78 类 · 198 姿态');
 assert.equal(library.libraryVessels('all','').length,35);
 for(const a of [...library.librarySpecimens,...library.libraryVesselCatalog]){
  assert.ok(existsSync(assetFile(a.id)),`missing source image: ${a.id}`);
  if(a.thumbnail||a.source==='flower-book'||!a.family)assert.ok(existsSync(`${dist}assets/thumbs/${a.id}.webp`),`missing card image: ${a.id}`);
 }
});

test('foliage, all roles, colors and vessel styles remain reachable without a scope switch',()=>{
 const leaves=library.libraryFlowers('foliage',false,'all','');
 assert.equal(leaves.length,11);assert.equal(poses(leaves).length,23);
 for(const role of ['line','focal','supporting','filler','foliage']){
  const expected=new Set(specimens.filter(a=>matchesRole(a,role)).map(a=>a.family));
  assert.deepEqual([...library.libraryFlowers(role,false,'all','').map(a=>a.family)].sort(),[...expected].sort());
 }
 for(const color of ['white','pink','red','warm','purple','blue','green','silver']){
  const result=poses(library.libraryFlowers('all',false,color,''));
  assert.ok(result.length>0,color);assert.ok(result.every(a=>matchesMaterialColor(a,color)),color);
 }
 for(const [style,total] of [['japanese',18],['english',6],['french',6],['modern',5]])assert.equal(library.libraryVessels(style,'').length,total,style);
 const book=poses(library.libraryFlowers('all',true,'all',''));
 assert.equal(book.length,66);assert.ok(book.some(a=>a.id==='book-iris'));
 assert.ok(library.libraryFlowers('all',false,'all','尤加利').some(a=>a.family==='eucalyptus'));
});

test('family picker uses the complete deduplicated catalog and has no collapsed older poses',()=>{
 const picker=source.slice(source.indexOf('function variantPicker('),source.indexOf("$('#change-variant').onclick"));
 assert.match(picker,/librarySpecimens\.filter\(a=>a\.family===family\)/);
 assert.match(picker,/options\.map\(variantCard\)/);
 assert.doesNotMatch(picker,/archived-poses|archived\.map|primary\.map/);
 assert.doesNotMatch(source,/libraryExpanded|curatedLibraryIndex/);
 assert.match(source,/button\.hidden=true;button\.onclick=null/);
});
