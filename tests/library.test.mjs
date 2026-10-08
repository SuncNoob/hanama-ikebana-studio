// SPDX-FileCopyrightText: 2026 Marko Sun
// SPDX-License-Identifier: LicenseRef-Hanama-Proprietary
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {
 nameOf,colorOf,poseOf,cardName,coverFor,covers,ROLE_FILTERS,matchesRole,sortByRole,roleGroups,sizeOf,sizeRange,sizeText,
 vesselFacts,capacityText,supportName,cardMeta,queryForms,buildSearchIndex,emptyText,clearFiltersLabel
} from '../dist/library.js';
import {ROLES,roleOf,hasRole} from '../dist/botany.js';
import {defaultCm} from '../dist/scale.js?v=hn3';
import {matchesMaterialColor} from '../dist/material-colors.js';
import {assetById,vessels,browseSpecimens,familyOrder,specimenFor,dist} from './helpers/catalog.mjs';

const LANGS=['zh','en','ja'];
/** The family cards exactly as app.js builds them: the first browse pose's fields under the family id. */
const flowers=familyOrder.map(family=>{const list=browseSpecimens.filter(a=>a.family===family);return {...list[0],id:family,variants:list.length}});
const posesOf=family=>browseSpecimens.filter(a=>a.family===family);
const index=buildSearchIndex(flowers,vessels,browseSpecimens);
const ids=(query,kind)=>[...index.match(query,kind).keys()];
const withRole=role=>flowers.filter(f=>hasRole(f,role)).map(f=>f.id).sort();
const withColor=color=>flowers.filter(f=>posesOf(f.family).some(a=>matchesMaterialColor(a,color))).map(f=>f.id);
/** Visible text: no-break spaces read as spaces, and the word joiners around range dashes are dropped. */
const plain=text=>text.replace(/ /g,' ').replace(/⁠/g,'');
const latin=/[A-Za-z]/;

test('search: everyday zh/en/ja queries find the families a florist means',()=>{
 for(const query of ['白','白色','white']){
  const found=ids(query);
  for(const id of withColor('white'))assert.ok(found.includes(id),`${query}: misses white ${id}`);
 }
 assert.equal(ids('玫瑰花')[0],'rose');
 assert.equal(ids('roses')[0],'rose');
 assert.equal(ids('秋菊')[0],'chrysanthemum');
 assert.deepEqual(ids('主花').sort(),withRole('focal'));
 assert.deepEqual(ids('线条').sort(),withRole('line'));
 assert.deepEqual(ids('小花').sort(),withRole('filler'),'小花 is the filler role, not every name with 小 in it');
 assert.deepEqual(ids('filler').sort(),withRole('filler'));
 assert.deepEqual(ids('greenery').sort(),withRole('foliage'));
 assert.deepEqual(ids('sakura'),['sakura']);
 assert.equal(ids('桜')[0],'sakura');
 for(const query of ['尤加利','ユーカリ']){const found=ids(query);assert.equal(found[0],'eucalyptus',query);assert.ok(found.includes('lemon-eucalyptus'),query)}
 assert.equal(ids("baby's breath")[0],'gypsophila');
 assert.equal(ids('baby’s breath')[0],'gypsophila');
 assert.equal(ids('lilies')[0],'lily');
 assert.equal(ids('Tulips')[0],'tulip');
 for(const id of withRole('foliage'))assert.ok(ids('叶').includes(id),`叶 misses ${id} (eucalyptus and pieris used to be missed)`);
 assert.ok(ids('rose').indexOf('rose')===0&&!ids('rose').includes('peony'),'an exact name keeps rose-pink flowers out of “rose”');
 assert.equal(index.match('','flowers'),null);assert.equal(index.match('   ','vessels'),null);
});

test('search: vessels by name, colour, style, shape and support in three languages',()=>{
 assert.deepEqual(ids('glass','vessels'),['modern-smoked-glass-column']);
 const kenzan=vessels.filter(v=>['kenzan','pin-frog-wire'].includes(v.fixture?.kind)).map(v=>v.id).sort();
 assert.deepEqual(ids('剑山','vessels').sort(),kenzan);assert.deepEqual(ids('kenzan','vessels').sort(),kenzan);assert.deepEqual(ids('剣山','vessels').sort(),kenzan);
 assert.deepEqual(ids('花之书','vessels').sort(),vessels.filter(v=>v.source==='flower-book-vessel').map(v=>v.id).sort());
 assert.equal(ids('ターコイズ','vessels')[0],'book-vessel-turquoise-jug','ja colours are searchable');
 assert.ok(ids('水盘','vessels').includes('indigo-oval-suiban'));
 assert.ok(ids('French','vessels').includes('french-blue-cachepot'));
});

test('queryForms strips a trailing 花/色 only from longer queries, and English plurals',()=>{
 assert.deepEqual(queryForms(' 白色 '),['白色','白']);
 assert.deepEqual(queryForms('花'),['花']);
 assert.deepEqual(queryForms('色'),['色']);
 assert.deepEqual(queryForms('玫瑰花'),['玫瑰花','玫瑰']);
 assert.ok(queryForms('roses').includes('rose'));assert.ok(queryForms('lilies').includes('lily'));assert.ok(queryForms('irises').includes('iris'));
 assert.deepEqual(queryForms('ＲＯＳＥ'),['rose'],'NFKC and lowercase');
 assert.deepEqual(queryForms(''),[]);
});

test('every family sits under a role chip, and the library lists roles in order with the tallest first',()=>{
 assert.deepEqual(ROLE_FILTERS,['all',...ROLES]);
 for(const f of flowers){
  assert.ok(ROLES.some(role=>matchesRole(f,role)),`${f.id} has no role chip`);
  assert.ok(matchesRole(f,'all'));
 }
 const vessel=assetById.round,height=f=>Math.max(...posesOf(f.family).map(a=>sizeOf(a,vessel).cm));
 const sorted=sortByRole(flowers,height),groups=roleGroups(sorted);
 assert.deepEqual(groups.map(g=>g.role),ROLES,'one run per role, in chip order');
 assert.equal(groups.reduce((n,g)=>n+g.items.length,0),78);
 for(const g of groups)for(let k=1;k<g.items.length;k++)assert.ok(height(g.items[k-1])>=height(g.items[k]),`${g.role}: ${g.items[k-1].id} before ${g.items[k].id}`);
 assert.ok(groups.find(g=>g.role==='foliage').items.some(f=>f.id==='eucalyptus'),'叶材 shows eucalyptus');
 assert.ok(groups.find(g=>g.role==='foliage').items.some(f=>f.id==='fern'),'叶材 shows fern');
 assert.equal(roleOf(flowers.find(f=>f.id==='sakura')),'line','the sakura card is a branch even though its first pose is a cluster');
});

test('size chips: true size as the first stem in the vessel, the same number as defaultCm',()=>{
 for(const id of ['round','matte-black-long-neck','celadon-shallow-suiban']){
  const vessel=assetById[id];
  for(const a of browseSpecimens){
   const size=sizeOf(a,vessel);
   assert.equal(size.cm,defaultCm(a,vessel),`${a.id} in ${id}`);
   if(size.headCm!==null){assert.ok(size.headCm>0&&size.stemCm>=0,`${a.id}: head ${size.headCm}, stem ${size.stemCm}`);assert.ok(Math.abs(size.headCm+size.stemCm-size.cm)<.15)}
  }
 }
 const rose=assetById['photo-rose'],round=assetById.round;
 assert.match(plain(sizeText(sizeOf(rose,round),'zh')),/^≈\d+ cm · 花头 \d+ cm$/);
 assert.match(plain(sizeText(sizeOf(rose,round),'en')),/^≈\d+ cm · head \d+ cm$/);
 assert.match(plain(sizeText(sizeOf(rose,round),'ja')),/^≈\d+ cm · 花 \d+ cm$/);
 assert.match(plain(sizeText(sizeOf(assetById.pine,round),'en')),/^≈\d+ cm$/,'a photographed branch has no head chip');
 assert.equal(plain(sizeText({range:[15.6,45.2]},'zh')),'≈16–45 cm');
 assert.equal(plain(sizeText({range:[15.6,45.2]},'ja',{words:true})),'約16〜45 cm');
 assert.equal(plain(sizeText({range:[40,40.2]},'en',{words:true})),'about 40 cm');
 // Chips follow the vessel.
 const changed=flowers.filter(f=>JSON.stringify(sizeRange(posesOf(f.family),assetById.round))!==JSON.stringify(sizeRange(posesOf(f.family),assetById['indigo-oval-suiban'])));
 assert.ok(changed.length>20,`only ${changed.length} family chips change between a neck vase and a suiban`);
});

test('cardMeta: role and size for every family and pose, facts for every vessel, in zh, en and ja',()=>{
 const vessel=assetById.round;
 for(const f of flowers)for(const lang of LANGS){
  const m=cardMeta(f,lang,{vessel,poses:posesOf(f.family)});
  assert.equal(m.kind,'family');
  assert.ok(m.kicker&&m.size&&m.label&&m.name,`${f.id} ${lang}: ${JSON.stringify(m)}`);
  assert.ok(m.label.includes(m.name));
  if(lang!=='en')assert.doesNotMatch(m.kicker,latin,`${f.id}: ${m.kicker}`);
  assert.equal(!!m.badge,posesOf(f.family).length>=3,'a pose count only from three poses up');
  assert.doesNotMatch(m.meta,/· \d+$/,'no bare “· 2” count');
 }
 for(const a of browseSpecimens)for(const lang of LANGS){const m=cardMeta(a,lang,{vessel});assert.equal(m.kind,'pose');assert.ok(m.size&&m.kicker&&m.label,`${a.id} ${lang}`)}
 assert.equal(cardMeta(assetById['photo-sakura'],'zh',{vessel}).kicker,'配花');
 for(const v of vessels)for(const lang of LANGS){
  const m=cardMeta(v,lang);
  assert.equal(m.kind,'vessel');
  assert.ok(m.kicker&&m.size&&m.fit&&m.label&&m.name,`${v.id} ${lang}`);
  assert.equal(!!m.badge,v.source==='flower-book-vessel');
  if(lang==='ja'){
   for(const text of [m.kicker,m.fit,m.name,m.badge,colorOf(v,'ja')])assert.doesNotMatch(plain(text).replace(/\bcm\b/g,''),latin,`${v.id}: ja “${text}”`);
   assert.match(m.label,/を選ぶ/);
  }
 }
 const jug=cardMeta(assetById['book-vessel-turquoise-jug'],'zh');
 assert.equal(plain(jug.meta),'高瓶 · 高 31 cm · 口 15 cm');assert.equal(plain(jug.fit),'瓶口 · 宜插 3–7 枝');assert.equal(jug.badge,'书中器形');
 assert.equal(plain(cardMeta(assetById['matte-black-long-neck'],'en').meta),'Tall · 32 cm tall · mouth 3.6 cm');
 assert.equal(plain(cardMeta(assetById['indigo-oval-suiban'],'ja').fit),'剣山 · 5〜12本以上');
});

test('vessel facts come from geometry, not the catalogue group',()=>{
 for(const id of ['book-vessel-green-ribbed-vase','book-vessel-teal-round-pitcher','matte-black-long-neck','ivory-tall-cylinder'])assert.equal(vesselFacts(assetById[id]).shape,'tall',id);
 for(const id of ['indigo-oval-suiban','celadon-shallow-suiban','modern-travertine-trough','book-vessel-fluted-silver-bowl'])assert.equal(vesselFacts(assetById[id]).shape,'shallow',id);
 for(const id of ['white-squat-round','round','charcoal-square-basin'])assert.equal(vesselFacts(assetById[id]).shape,'low',id);
 for(const v of vessels){
  const f=vesselFacts(v);
  assert.ok(f.heightCm>=12&&f.heightCm<=33&&f.mouthCm>3&&f.mouthCm<31,`${v.id}: ${f.heightCm} × ${f.mouthCm}`);
  if(['kenzan','chicken-wire','hidden-grid'].includes(f.support))assert.deepEqual(f.capacity,[5,12,true],v.id);
  else if(f.mouthCm<6)assert.deepEqual(f.capacity,[1,3,false],v.id);
 }
 assert.equal(plain(capacityText([1,3,false],'en')),'1–3 stems');
 for(const lang of LANGS){assert.match(capacityText([3,7,false],lang),/3\u2060[–〜]\u20607/,`${lang}: a narrow card must not break 3–7 after the dash`);assert.match(sizeText({range:[47,65]},lang),/47\u2060[–〜]\u206065/)}
 assert.equal(supportName(assetById['ink-black-low-bowl'],'ja'),'剣山');
 assert.equal(supportName(assetById['ink-black-low-bowl'],'en'),'Blackened-brass kenzan');
});

test('names and colours: every vessel has a Japanese colour, and the sakura close-up is labelled as one',()=>{
 for(const v of vessels){assert.doesNotMatch(colorOf(v,'ja'),latin,`${v.id}: ${colorOf(v,'ja')}`);assert.ok(colorOf(v,'en')&&colorOf(v,'zh'))}
 assert.deepEqual(LANGS.map(lang=>poseOf(assetById['photo-sakura'],lang)),['花簇特写','Blossom cluster close-up','花房のアップ']);
 assert.equal(poseOf(assetById['photo-rose'],'en'),'Original photograph');
 assert.equal(nameOf(assetById.round,'ja'),'窯変釉の丸瓶');
 assert.equal(cardName(flowers.find(f=>f.id==='eucalyptus'),'ja'),'ユーカリ');
});

test('covers: the sakura card shows a branch; specimenFor keeps the first photograph',()=>{
 const poses=posesOf('sakura');
 assert.equal(coverFor('sakura',poses).id,covers.sakura);
 assert.equal(specimenFor('sakura').id,'photo-sakura','the default canvas and recent strip are unchanged');
 assert.notEqual(coverFor('sakura',poses,'white').id,'photo-sakura','a colour filter still prefers a branch');
 for(const f of flowers.filter(f=>f.id!=='sakura'))assert.equal(coverFor(f.family,posesOf(f.family)).id,posesOf(f.family)[0].id,f.id);
 assert.equal(coverFor('sakura',poses,'blue'),null);
});

test('empty results name the active filters, in three languages',()=>{
 assert.equal(emptyText('zh',{filters:['叶材','粉']}),'没有符合「叶材 · 粉」的花材。');
 assert.equal(emptyText('en',{filters:['Foliage'],query:'rose'}),'No materials match Foliage · “rose”.');
 assert.equal(emptyText('ja',{kind:'vessels',query:'zzz'}),'「zzz」に合う花器がありません。');
 assert.equal(emptyText('en',{kind:'vessels'}),'No vessels found.');
 assert.deepEqual(LANGS.map(clearFiltersLabel),['清除筛选','Clear filters','絞り込みを解除']);
});

test('app.js and index.html: one library renderer, role chips in both rows, a vessel mode in the sheet, no ja overwrite',()=>{
 const app=readFileSync(`${dist}app.js`,'utf8'),html=readFileSync(`${dist}index.html`,'utf8');
 assert.match(app,/from '\.\/library\.js\?v=hn3'/);
 assert.doesNotMatch(app,/const (labelEN|assetJA|vesselJA|colorJA|colorENtoJA)=/,'name tables live in library.js');
 assert.doesNotMatch(app,/button\.querySelector\('small'\)\.textContent=isFlower/,'the ja card overwrite block is gone');
 assert.doesNotMatch(html,/data-(quick-)?family-group="(bundle|bloom|branch|book)"/,'成组/花朵/枝叶 chips are gone; 花之书 is a toggle');
 for(const attr of ['data-family-group','data-quick-family-group'])for(const role of ROLE_FILTERS){
  const tag=html.match(new RegExp(`<button[^>]*${attr}="${role}"[^>]*>`))?.[0];
  assert.ok(tag,`${attr}=${role}`);assert.match(tag,/data-zh="[^"]+"[^>]*data-en="[^"]+"[^>]*data-ja="[^"]+"/,tag);assert.match(tag,/aria-pressed=/);
 }
 for(const attr of ['data-family-book','data-quick-book','data-quick-mode="flowers"','data-quick-mode="vessels"','data-quick-vessel-style="all"'])assert.ok(html.includes(attr),attr);
 for(const style of ['japanese','english','french'])assert.match(html,new RegExp(`data-vessel-style="${style}"[^>]*data-en="${style[0].toUpperCase()}${style.slice(1)}"`));
 assert.match(app,/openQuickMaterialDrawer\(\{filter:'line'\}\)/,'the start card still opens the sheet on lines');
 assert.match(app,/aria-valuetext/);
 assert.match(app,/\$\$\('button\[data-scene\]'\)\.forEach\(b=>\{const on=b\.dataset\.scene===state\.scene;b\.classList\.toggle\('active',on\);b\.setAttribute\('aria-pressed'/);
 assert.match(app,/function revealCanvas\(\)/);
});
