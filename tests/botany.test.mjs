// SPDX-FileCopyrightText: 2026 Marko Sun
// SPDX-License-Identifier: LicenseRef-Hanama-Proprietary
import test from 'node:test';
import assert from 'node:assert/strict';
import {profiles,ROLES,HABITS,SEASONS,DEFAULT_STEM_MAX_CM,roleOf,rolesOf,hasRole,roleLabels,roleTips,seasonLabels,roleLabel,roleTip,stemMaxCm,stemMmOf,habitOf,seasonsOf,inSeason,unitNoun,aliasIndex,searchForm,roleAliases,variantRoles} from '../dist/botany.js';
import {MAX_STEM_CM,drawsStem,stemCm} from '../dist/scale.js?v=hn3';
import {assetById,specimens,familyOrder,studies,studyState} from './helpers/catalog.mjs';

const families=Object.keys(profiles);

test('all 78 library families have a profile and resolve a role',()=>{
 assert.equal(familyOrder.length,78);
 assert.deepEqual([...families].sort(),[...familyOrder].sort());
 for(const a of specimens){const roles=rolesOf(a);assert.ok(roles.length&&roles.every(r=>ROLES.includes(r)),`${a.id}: ${roles}`);assert.equal(roleOf(a),roles[0])}
 const counts=Object.fromEntries(ROLES.map(role=>[role,families.filter(f=>[profiles[f].role].flat()[0]===role).length]));
 assert.deepEqual(counts,{line:18,focal:18,secondary:21,filler:10,foliage:11});
 assert.deepEqual(families.filter(f=>Array.isArray(profiles[f].role)).sort(),['agapanthus','calla','iris','lily']);
});

test('roles follow the asset, then the pose override, then the family',()=>{
 assert.equal(roleOf(assetById['photo-sakura']),'secondary');
 assert.equal(roleOf(assetById['sakura-pink-arch']),'line');
 assert.ok(hasRole(assetById['photo-lily'],'focal')&&roleOf(assetById['photo-lily'])==='line');
 assert.equal(roleOf({family:'peony',role:'line'}),'line');
 for(const id of Object.keys(variantRoles))assert.ok(assetById[id],`${id} is not an asset`);
 assert.equal(roleOf({family:'unknown',group:'foliage'}),'foliage');
 assert.equal(roleOf({family:'unknown',group:'branch'}),'line');
 assert.equal(roleOf({family:'unknown',group:'bloom',bundle:true}),'secondary');
 assert.equal(roleOf({family:'unknown',group:'bloom'}),'focal');
 assert.equal(roleOf(null),'focal');
});

test('every profile has a valid habit, stem data and at least one garden season',()=>{
 for(const [family,p] of Object.entries(profiles)){
  assert.ok(HABITS.includes(p.habit),`${family}: habit ${p.habit}`);
  assert.ok(p.seasons.length>=1&&p.seasons.every(s=>SEASONS.includes(s)),`${family}: seasons`);
  assert.equal(new Set(p.seasons).size,p.seasons.length,`${family}: repeated season`);
  assert.ok(p.stemMaxCm>0&&p.stemMaxCm<=MAX_STEM_CM,`${family}: stemMaxCm`);
  if(p.stemMm!==null){assert.equal(p.stemMm.length,2);assert.ok(p.stemMm[0]>0&&p.stemMm[0]<=p.stemMm[1]&&p.stemMm[1]<=15,`${family}: stemMm`)}
  if(p.unit)assert.ok(['branch','plume','frond','stem of','leaf'].includes(p.unit),`${family}: unit`);
 }
 assert.equal(DEFAULT_STEM_MAX_CM,MAX_STEM_CM);
 assert.deepEqual(['bulb','grass','vine'].map(h=>families.filter(f=>profiles[f].habit===h).sort()),[
  ['allium','fritillary','iris','lily','lily-of-the-valley','muscari','narcissus','tulip'],['briza','pampas'],['clematis','jasmine','sweet-pea']]);
 assert.ok(habitOf(assetById['photo-pieris'])==='woody'&&habitOf(assetById['photo-hypericum'])==='woody');
 assert.ok(stemMmOf(assetById['photo-cosmos'])[0]<=2.06,'cosmos stays fine');
 assert.deepEqual(stemMmOf(assetById['photo-statice']),[8,8]);
 assert.equal(stemMmOf(assetById['photo-rose'])?.length,2);
 assert.equal(stemMmOf(assetById['photo-freesia']),null);
 assert.equal(stemMaxCm(assetById['photo-muscari']),22);
 assert.equal(stemMaxCm({family:'unknown'}),DEFAULT_STEM_MAX_CM);
 assert.equal(stemMaxCm({family:'muscari',stemMaxCm:30}),30);
 assert.equal(habitOf({family:'unknown'}),null);
 assert.deepEqual(seasonsOf({family:'unknown'}),[]);
 for(const f of ['alpine-fern','lemon-eucalyptus','snow-willow','silver-ragwort','gardenia-leaf','bird-nest-fern','fatsia-leaf','monstera-leaf'])assert.deepEqual(profiles[f].seasons,SEASONS,`${f} is all-year`);
});

test('every study uses at least one family in its own season',t=>{
 const offSeason=[];
 for(const study of studies){
  const used=study.items.map(i=>assetById[i.type]);
  assert.ok(used.some(a=>inSeason(a,study.season)),`${study.id} (${study.season}) has no in-season family`);
  for(const a of used)if(!inSeason(a,study.season))offSeason.push(`${study.id}:${a.family}`);
 }
 if(offSeason.length)t.diagnostic(`out-of-season materials: ${offSeason.join(', ')}`);
});

test('aliases are unique, never another family’s id, and resolve through the index',()=>{
 const seen=new Map();
 for(const [family,p] of Object.entries(profiles))for(const alias of p.aliases||[]){
  const key=searchForm(alias);assert.ok(key,`${family}: empty alias`);
  assert.ok(!seen.has(key),`alias ${alias} is used by ${seen.get(key)} and ${family}`);seen.set(key,family);
  assert.ok(!families.includes(key)||key===family,`alias ${alias} of ${family} is another family's id`);
 }
 assert.equal(aliasIndex.size,seen.size);
 for(const [alias,family] of [['玫瑰花','rose'],['秋菊','chrysanthemum'],['樱','sakura'],['桜','sakura'],['sakura','sakura'],['满天星','gypsophila'],["baby's breath",'gypsophila'],['尤加利','eucalyptus'],['ユーカリ','eucalyptus'],['Baby’s Breath','gypsophila']])
  assert.equal(aliasIndex.get(searchForm(alias)),family,alias);
 assert.ok(roleAliases.foliage.includes('greenery'));
 for(const role of Object.keys(roleAliases))assert.ok(ROLES.includes(role));
});

test('role and season labels exist in zh, en and ja',()=>{
 for(const role of ROLES){
  for(const table of [roleLabels,roleTips]){assert.equal(table[role].length,3);assert.ok(table[role].every(text=>typeof text==='string'&&text.trim()),`${role}`)}
  assert.equal(roleLabel(role,'zh'),roleLabels[role][0]);assert.equal(roleLabel(role,'en'),roleLabels[role][1]);assert.equal(roleLabel(role,'ja'),roleLabels[role][2]);
  assert.equal(roleTip(role,'ja'),roleTips[role][2]);
  assert.doesNotMatch(roleTips[role][1],/[぀-ヿ一-鿿]/,`${role}: English tip has CJK`);
 }
 assert.deepEqual(roleLabels.foliage,['叶材','Foliage','葉もの']);
 for(const season of [...SEASONS,'all'])assert.ok(seasonLabels[season].every(Boolean));
});

test('prompt units pluralise as florists count them',()=>{
 assert.deepEqual([1,2].map(n=>unitNoun('branch',n)),['branch','branches']);
 assert.deepEqual([1,3].map(n=>unitNoun('leaf',n)),['leaf','leaves']);
 assert.equal(unitNoun('stem of',2),'stems of');assert.equal(unitNoun('frond',2),'fronds');assert.equal(unitNoun('plume',2),'plumes');assert.equal(unitNoun(undefined,2),'');
 assert.deepEqual(['maple','willow','quince','sakura','eucalyptus'].map(f=>profiles[f].unit),Array(5).fill('branch'));
 assert.deepEqual(['fatsia-leaf','monstera-leaf'].map(f=>profiles[f].unit),['leaf','leaf']);
});

test('the soft stem cap leaves at least 10% headroom over every drawn stem the studies use',t=>{
 const longest=new Map();
 for(const study of studies)for(const item of studyState(study).items){const a=assetById[item.type];if(!drawsStem(a))continue;const cm=stemCm(item,a);if(cm>(longest.get(a.id)?.cm??-1))longest.set(a.id,{cm,study:study.id})}
 assert.ok(longest.size>20);
 for(const [id,{cm,study}] of longest){const a=assetById[id];assert.ok(stemMaxCm(a)>=1.1*cm,`${id} in ${study}: ${cm.toFixed(1)} cm drawn stem vs cap ${stemMaxCm(a)}`)}
 t.diagnostic(`tightest caps: ${[...longest].map(([id,{cm}])=>[id,cm/stemMaxCm(assetById[id])]).sort((p,q)=>q[1]-p[1]).slice(0,5).map(([id,r])=>`${id} ${Math.round(r*100)}%`).join(', ')}`);
});
