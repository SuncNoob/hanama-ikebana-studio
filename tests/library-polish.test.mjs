// SPDX-FileCopyrightText: 2026 Marko Sun
// SPDX-License-Identifier: LicenseRef-Hanama-Proprietary
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const readSource=(file,encoding)=>readFileSync(file,encoding).replace(/\r\n/g,'\n');
import {
 displayPose,poseOf,provenance,provenanceOf,currentSeason,southernZone,shiftSeason,seasonShiftOf,matchesSeason,allYear,seasonMark,
 seasonChip,sortByRole,roleGroups
} from '../dist/library.js';
import {SEASONS,ROLES,seasonsOf,roleOf} from '../dist/botany.js';
import {drawsStem} from '../dist/scale.js?v=hn3';
import {assetById,browseSpecimens,familyOrder,dist} from './helpers/catalog.mjs';

const LANGS=['zh','en','ja'];
const flowers=familyOrder.map(family=>{const list=browseSpecimens.filter(a=>a.family===family);return {...list[0],id:family,variants:list.length}});
const at=(iso)=>new Date(`${iso}T12:00:00`);

test('displayPose: shape first — drawn-stem photographs say so, generated poses drop 新/New, the rest read as before',()=>{
 const single=browseSpecimens.find(a=>a.source==='flower-book-photo'&&!a.bundle&&drawsStem(a));
 const bundle=browseSpecimens.find(a=>a.source==='flower-book-photo'&&a.bundle&&a.id!=='photo-sakura');
 assert.deepEqual(LANGS.map(l=>displayPose(single,l)),['单朵花头 · 自动接枝','Single head · stem drawn','一輪 · 茎を補う']);
 assert.deepEqual(LANGS.map(l=>displayPose(bundle,l)),['一组 · 一个图层','Cluster · one layer','数本まとめ · 1レイヤー']);
 assert.equal(displayPose(assetById['photo-sakura'],'en'),'Blossom cluster close-up','the close-up keeps its own label');
 for(const a of browseSpecimens.filter(a=>a.source==='generated-pose'))for(const l of LANGS){
  const text=displayPose(a,l);assert.ok(text&&!/新|\bnew\b|新しい/i.test(text),`${a.id} ${l}: ${text}`);
 }
 // A family's poses stay distinguishable wherever they were before (same words, minus provenance).
 for(const family of familyOrder){
  const poses=browseSpecimens.filter(a=>a.family===family&&a.source==='generated-pose');
  for(const l of LANGS){const before=new Set(poses.map(a=>poseOf(a,l))),after=new Set(poses.map(a=>displayPose(a,l)));assert.equal(after.size,before.size,`${family} ${l}`)}
 }
 const legacy=browseSpecimens.find(a=>!a.source&&a.pose==='侧面');
 assert.equal(displayPose(legacy,'en'),'Side view','sentence case in English');assert.equal(displayPose(legacy,'zh'),'侧面');
 for(const a of browseSpecimens)for(const l of LANGS)assert.ok(displayPose(a,l),`${a.id} ${l}`);
 assert.equal(displayPose(null,'en'),'');
});

test('provenance: a badge with a tooltip in three languages, none for the original library photographs',()=>{
 assert.equal(provenanceOf({source:'flower-book-photo'}),'photo');
 assert.equal(provenanceOf({source:'flower-book'}),'book');
 assert.equal(provenanceOf({source:'generated-pose'}),'ai');
 assert.equal(provenanceOf({source:'generated-foliage'}),'art');
 assert.equal(provenanceOf({source:'generated-botanical-study'}),'art');
 assert.equal(provenance({},'en'),null);
 for(const a of browseSpecimens){const keys=LANGS.map(l=>provenance(a,l));if(!a.source){assert.ok(keys.every(k=>k===null));continue}
  for(const p of keys){assert.ok(p.label&&p.title)}
  assert.notEqual(keys[0].label,keys[1].label);
 }
});

test('currentSeason: month to garden season, flipped for southern time zones',()=>{
 assert.deepEqual(['2026-03-01','2026-05-31','2026-06-01','2026-08-31','2026-09-01','2026-11-30','2026-12-01','2027-02-28'].map(d=>currentSeason(at(d))),
  ['spring','spring','summer','summer','autumn','autumn','winter','winter']);
 for(const tz of ['Australia/Sydney','Australia/Perth','Pacific/Auckland','America/Santiago','America/Argentina/Buenos_Aires','America/Sao_Paulo','Africa/Johannesburg']){
  assert.ok(southernZone(tz),tz);assert.equal(currentSeason(at('2026-10-08'),tz),'spring',tz);assert.equal(currentSeason(at('2026-01-15'),tz),'summer',tz);
 }
 for(const tz of ['Asia/Shanghai','Asia/Tokyo','Europe/London','America/New_York','Pacific/Honolulu','','Africa/Nairobi'])assert.ok(!southernZone(tz),tz);
 assert.equal(currentSeason(at('2026-10-08'),'Asia/Shanghai'),'autumn');
 assert.ok(SEASONS.includes(currentSeason(new Date('nonsense'))),'an invalid date falls back to now');
});

test('the season override is a shift 0–3 that cycles',()=>{
 assert.equal(shiftSeason('autumn',0),'autumn');assert.equal(shiftSeason('autumn',1),'winter');assert.equal(shiftSeason('autumn',2),'spring');
 assert.equal(shiftSeason('winter',3),'autumn');assert.equal(shiftSeason('spring',-1),'winter');
 for(const raw of [null,'','x','4','-1','1.5',undefined])assert.equal(seasonShiftOf(raw),0,String(raw));
 assert.equal(seasonShiftOf('2'),2);assert.equal(seasonShiftOf(3),3);
});

test('every family has a season, every season has a choice in every role, and all-year families match every season',()=>{
 for(const f of flowers)assert.ok(seasonsOf(f).length,`${f.id} has no season`);
 for(const season of SEASONS){
  const list=flowers.filter(f=>matchesSeason(f,season));assert.ok(list.length>=10,`${season}: ${list.length}`);
  for(const role of ['line','focal','foliage'])assert.ok(list.some(f=>roleOf(f)===role),`${season} has a ${role}`);
 }
 for(const f of flowers.filter(allYear))for(const season of SEASONS)assert.ok(matchesSeason(f,season));
});

test('seasonMark: the current season when in season, else the next one, muted; titles in three languages',()=>{
 const sakura=flowers.find(f=>f.id==='sakura'),pampas=flowers.find(f=>f.id==='pampas'),always=flowers.find(allYear);
 assert.deepEqual(seasonMark(sakura,'spring','zh'),{key:'spring',now:true,text:'春',title:'花季：春'});
 const off=seasonMark(sakura,'autumn','en');assert.equal(off.key,'spring');assert.equal(off.now,false);assert.equal(off.text,'Spring');
 assert.equal(seasonMark(pampas,'summer','ja').key,'autumn','the next season the family is in');
 assert.equal(seasonMark(pampas,'autumn','ja').text,'秋');
 if(always){const m=seasonMark(always,'winter','en');assert.equal(m.key,'all');assert.ok(m.now);assert.equal(m.text,'All year')}
 assert.equal(seasonMark({family:'no-such-family'},'spring','en'),null);
 assert.deepEqual(LANGS.map(l=>seasonChip('autumn',l).label),['当季','In season','旬']);
 assert.deepEqual(LANGS.map(l=>seasonChip('autumn',l).name),['秋','Autumn','秋']);
 for(const l of LANGS)assert.ok(seasonChip('winter',l).aria.length>4);
});

test('sortByRole puts in-season families first within each role and keeps one run per role',()=>{
 const season='autumn',sorted=sortByRole(flowers,()=>0,f=>matchesSeason(f,season));
 assert.deepEqual(roleGroups(sorted).map(g=>g.role),ROLES);
 for(const group of roleGroups(sorted)){
  const flags=group.items.map(f=>matchesSeason(f,season)),firstOff=flags.indexOf(false);
  if(firstOff>=0)assert.ok(flags.slice(firstOff).every(x=>!x),`${group.role}: in-season first`);
 }
 assert.deepEqual(sortByRole(flowers).map(f=>f.id),sortByRole(flowers,()=>0,()=>false).map(f=>f.id),'the old two-argument call is unchanged');
});

test('app.js, index.html and the stylesheets: season chips, the recent strip by pose, layer thumbnails, the tablet grid, panel context',()=>{
 const app=readSource(`${dist}app.js`,'utf8'),html=readSource(`${dist}index.html`,'utf8'),css=readSource(`${dist}ui-polish.css`,'utf8'),style=readSource(`${dist}style.css`,'utf8');
 assert.match(html,/data-family-group="season"[^>]*><span data-zh="当季" data-en="In season" data-ja="旬">/);
 assert.match(html,/data-quick-family-group="season"[^>]*><span data-zh="当季" data-en="In season" data-ja="旬">/);
 assert.match(app,/try\{seasonShift=seasonShiftOf\(localStorage\.getItem\(SEASON_STORE\)\)\}catch\{\}/);
 assert.match(app,/try\{if\(seasonShift\)localStorage\.setItem\(SEASON_STORE,String\(seasonShift\)\);else localStorage\.removeItem\(SEASON_STORE\)\}catch\{\}/);
 assert.ok(app.includes("SEASON_STORE='hanama-season'"));
 assert.ok(app.includes("RECENT_POSES='hanama-recent-materials-v2'"));
 assert.match(app,/try\{localStorage\.setItem\(RECENT_POSES,JSON\.stringify\(quickRecent\)\)\}catch\{\}/);
 assert.match(app,/rememberMaterial\(type\);closeQuickMaterialDrawer\(\)/,'the strip remembers the exact pose');
 assert.match(app,/if\(button&&recentPose\(button\.dataset\.quickRecent\)\)addSpecimen\(button\.dataset\.quickRecent\)/,'a tap re-adds it with auto placement');
 for(const k of [0,1,2])assert.match(html,new RegExp(`data-recent-slot="${k}" hidden><button[^>]*data-quick-recent[^>]*></button><button[^>]*data-recent-more`));
 assert.ok(app.includes('`再添一枝${name} · ${pose}`')&&app.includes('`Add another ${name} · ${pose}`')&&app.includes('`${name}（${pose}）をもう一本`'));
 assert.match(app,/function layerThumb\(item\)\{\n const sprite=spriteCache\.get\(item\.id\)/,'layer rows draw the cached sprite');
 assert.ok(app.includes("`正在调整：${name} · 去调整 ↗`")&&app.includes("`Editing: ${name} · Adjust ↗`")&&app.includes("`編集中：${name} · 調整へ ↗`"));
 assert.match(html,/<button type="button" id="editing-chip" class="editing-chip" hidden><\/button>/);
 assert.match(app,/selectItem\(id\);revealStemPanel\(\)/);
 assert.ok(app.includes("L('关于素材','About this material','素材について')"));
 // Tablet portrait: the inspector is a grid, no longer CSS columns.
 assert.match(css,/@media \(min-width: 601px\) and \(max-width: 900px\) and \(orientation: portrait\) \{[\s\S]*?#selection-controls:not\(\[hidden\]\) \{ display: grid; grid-template-columns: minmax\(0, 1fr\) minmax\(0, 1fr\)/);
 assert.match(css,/#selection-controls > \.range-control:has\(#angle\) \{ grid-column: 2; grid-row: 1; \}/);
 assert.doesNotMatch(style,/[{;]columns:2/,'no CSS columns on the inspector');
});
