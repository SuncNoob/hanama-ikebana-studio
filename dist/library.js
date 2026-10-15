// SPDX-FileCopyrightText: 2026 Marko Sun
// SPDX-License-Identifier: LicenseRef-Hanama-Proprietary
/**
 * The library's words (A15, B4): names and colours in zh/en/ja, botanical roles, true-size chips, vessel facts and one search
 * shared by the left library and the quick sheet. Pure and DOM-free (node tests cover it); app.js only renders the cards.
 */
import {ROLES,SEASONS,rolesOf,roleOf,hasRole,roleLabel,roleLabels,roleAliases,profiles,searchForm,seasonsOf,seasonLabel} from './botany.js?v=hn2';
import {materialColorGroups,matchesMaterialColor} from './material-colors.js?v=1';
import {vesselGeometry} from './geometry.js?v=organic3';
import {planSlot,itemCm,stemCm,drawsStem} from './scale.js?v=hn3';

const LANG_INDEX={zh:0,en:1,ja:2};
/** The [zh, en, ja] entry for a language (anything unknown reads zh, as app.js does). */
const pick=(lang,list)=>list[LANG_INDEX[lang]??0];

// ── Names, colours and poses (moved verbatim from app.js) ──
export const labelEN={
 '淡粉':'soft pink','象牙白':'ivory','赭橙':'ochre orange','松绿':'pine green','秋红':'autumn red','麦白':'wheat white','柔粉':'blush pink','暖白':'warm white','浅杏':'pale apricot','酒红':'burgundy','浅粉':'pale pink','白色':'white','淡紫':'pale lavender','紫色':'purple','浅蓝':'pale blue','自然红':'natural red','红色':'red','嫩绿':'fresh green','银绿':'silver green','自然绿':'natural green','深绿':'deep green','夏绿':'summer green','哑黑':'matte black','墨黑':'ink black','炭黑':'charcoal','浅青釉':'pale celadon','深蓝釉':'deep indigo glaze','暖沙色':'warm sand','铁锈深釉':'dark rust glaze','浅灰釉':'light gray glaze','深绿釉':'deep green glaze','窑变釉':'variegated glaze','褐釉':'brown glaze',
 '原版花枝':'original flowering branch','原版正面':'original front view','原版虬枝':'original gnarled branch','原版舒展':'original spreading branch','自然穗形':'natural plume','正面':'front view','侧面':'side view','斜侧面':'three-quarter view','直立枝':'upright branch','横逸枝':'lateral branch','自然弧枝':'natural arched branch','垂弧枝':'drooping arch','斜生枝':'oblique branch','弧形叶':'arched frond','疏枝':'sparse branch','自然斜枝':'natural oblique branch','舒展枝':'spreading branch'
};
export const assetJA={willow:'ヤナギ',eucalyptus:'ユーカリ',fern:'シダ',pine:'松',maple:'カエデ',sakura:'桜',calla:'カラー',chrysanthemum:'菊',tulip:'チューリップ',rose:'バラ',peony:'芍薬',iris:'アヤメ',camellia:'椿',quince:'ボケ',anemone:'アネモネ','lily-of-the-valley':'スズラン',freesia:'フリージア',fritillary:'バイモ',hellebore:'クリスマスローズ',magnolia:'モクレン',muscari:'ムスカリ',narcissus:'スイセン',pieris:'アセビ',ranunculus:'ラナンキュラス','pussy-willow':'ネコヤナギ',lilac:'ライラック',alchemilla:'アルケミラ',allium:'アリウム',alstroemeria:'アルストロメリア',ammi:'アミ',astrantia:'アストランティア',cornflower:'ヤグルマギク',clematis:'クレマチス',delphinium:'デルフィニウム','sweet-william':'ビジョナデシコ',foxglove:'ジギタリス',gypsophila:'カスミソウ','sweet-pea':'スイートピー',lavender:'ラベンダー',lily:'ユリ',stock:'ストック',nigella:'ニゲラ',poppy:'アイスランドポピー',viburnum:'ビバーナム',yarrow:'セイヨウノコギリソウ',amaranthus:'ヒモゲイトウ',snapdragon:'キンギョソウ',aster:'アスター',briza:'コバンソウ',cosmos:'コスモス',crocosmia:'モントブレチア',dahlia:'ダリア','sea-holly':'エリンジウム',sunflower:'ヒマワリ',hydrangea:'アジサイ',hypericum:'ヒペリカム',statice:'スターチス',phlox:'フロックス',scabious:'スカビオサ',sedum:'セダム',snowberry:'スノーベリー',strawflower:'ムギワラギク',zinnia:'ジニア',agapanthus:'アガパンサス',celosia:'ケイトウ',jasmine:'ジャスミン',pincushion:'ピンクッション',orchid:'コチョウラン',pampas:'パンパスグラス',lisianthus:'トルコギキョウ'};
export const vesselJA={
 'matte-black-long-neck':'黒の細首瓶','ivory-tall-cylinder':'象牙色の細筒','white-squat-round':'白の丸い低瓶','ink-black-low-bowl':'墨黒の浅鉢','white-square-column':'白の角筒','charcoal-square-basin':'炭黒の角鉢','celadon-shallow-suiban':'淡青磁の水盤','indigo-oval-suiban':'藍釉の楕円水盤','sand-wide-pottery-bowl':'砂色の広口陶鉢','rust-dark-cylinder':'錆釉の陶筒','gray-flat-round':'薄灰釉の平丸瓶','forest-green-shoulder':'深緑釉の肩張り瓶',
 'english-cream-pitcher':'英国風クリーム陶壺','english-pewter-compote':'英国風の錫脚鉢','english-stone-garden-urn':'砂岩の庭園壺','french-medicis-urn':'仏風アイボリーの脚鉢','french-charcoal-compote':'仏風炭黒の脚鉢','french-blue-cachepot':'仏風霧青の鉢','modern-smoked-glass-column':'煙色ガラスの柱瓶','modern-steel-loop-vessel':'スチールの輪形花器','modern-travertine-trough':'トラバーチンの長鉢',
 'book-vessel-turquoise-jug':'トルコ石色の陶壺','book-vessel-pink-green-pitcher':'葉模様の細首壺','book-vessel-low-patina-compote':'緑青の低脚鉢','book-vessel-copper-footed-bowl':'鎚目銅の脚鉢','book-vessel-fluted-silver-bowl':'銀色の脚鉢','book-vessel-dark-pedestal-urn':'深茶の高脚花器','book-vessel-teal-round-pitcher':'青釉の丸い壺','book-vessel-green-ribbed-vase':'緑釉の丸い花器','round':'窯変釉の丸瓶','bottle':'褐色釉の細首瓶'
};
export const colorJA={'淡粉':'淡いピンク','象牙白':'アイボリー','赭橙':'黄土色','松绿':'松葉色','秋红':'秋色の赤','麦白':'麦わら色','柔粉':'淡いピンク','暖白':'温かみのある白','浅杏':'淡いアプリコット','酒红':'ワインレッド','浅粉':'淡いピンク','白色':'白','淡紫':'淡い紫','紫色':'紫','浅蓝':'淡い青','自然红':'自然な赤','红色':'赤','嫩绿':'若葉色','银绿':'シルバーグリーン','自然绿':'自然な緑','深绿':'深緑','夏绿':'夏の緑','哑黑':'マットブラック','墨黑':'墨色','炭黑':'チャコール','浅青釉':'淡い青磁釉','深蓝釉':'濃紺の釉薬','暖沙色':'温かな砂色','铁锈深釉':'錆色の濃釉','浅灰釉':'淡い灰釉','深绿釉':'深緑の釉薬','窑变釉':'窯変釉','褐釉':'褐色の釉薬'};
export const poseJA={'原版花枝':'自然な花枝','原版正面':'正面','原版虬枝':'曲がり枝','原版舒展':'広がる枝','自然穗形':'自然な穂','正面':'正面','侧面':'側面','斜侧面':'斜め前','直立枝':'直立する枝','横逸枝':'横へ伸びる枝','自然弧枝':'自然な弧','垂弧枝':'垂れる弧','斜生枝':'斜めの枝','弧形叶':'弧を描く葉','疏枝':'まばらな枝','自然斜枝':'自然な斜め枝','舒展枝':'広がる枝'};
export const colorENtoJA={'apricot orange':'杏色のオレンジ','apricot-pink berries':'杏色のピンクの実','blue':'青','blue violet':'青紫','blush pink':'淡いピンク','burgundy':'ワインレッド','burgundy checks':'ワインレッドの市松模様','burgundy with white edges':'白縁のワインレッド','chartreuse':'黄緑','chocolate red':'チョコレート色の赤','coral red':'コーラルレッド','cornflower blue':'矢車菊色の青','cream and mauve':'クリーム色と薄紫','cream white':'クリームホワイト','crimson':'深紅','deep crimson':'濃い深紅','deep purple':'濃い紫','deep rose pink':'濃いローズピンク','dusty pink':'くすみピンク','golden orange':'黄金色のオレンジ','golden yellow':'黄金色の黄色','grass green':'草緑','green-white':'緑がかった白','ivory with burgundy speckles':'ワインレッドの斑点がある象牙色','ivory with green stripes':'緑の筋がある象牙色','lavender':'ラベンダー色','lilac':'ライラック色','magenta':'マゼンタ','mauve':'薄紫','mauve with yellow-white veins':'黄白の筋がある薄紫','orange red':'オレンジレッド','orchid purple':'蘭色の紫','pale blue':'淡い青','pale green':'淡い緑','pale pink':'淡いピンク','pale pink-white':'淡い桃白','pale violet blue':'淡い青紫','pale yellow':'淡い黄色','pink and white':'ピンクと白','pink-white berries':'桃白色の実','purple':'紫','red and yellow':'赤と黄色','rose pink':'ローズピンク','rose pink and cream':'ローズピンクとクリーム色','russet':'赤茶','scarlet':'朱色','silver gray':'銀灰色','silver green':'銀緑','violet blue':'青紫','violet with yellow veins':'黄色の筋がある紫','white':'白','white and orange':'白とオレンジ','white and purple':'白と紫','white and yellow':'白と黄色','yellow green':'黄緑'};
export const poseENtoJA={'Book photograph pose':'書籍写真の姿','Original grouped photograph':'原書の複数枝写真','Original photograph':'実物写真'};

/** Pose labels that say what a single photograph shows when its catalogue label would mislead: photo-sakura is a close-up of a
 blossom cluster, not a branch. [zh, en, ja] */
export const poseLabels={'photo-sakura':['花簇特写','Blossom cluster close-up','花房のアップ']};
export const nameOf=(a,lang)=>lang==='ja'?(a.ja||assetJA[a.family]||vesselJA[a.id]||a.en||a.name):lang==='en'?(a.en||a.name):a.name;
export const colorOf=(a,lang)=>lang==='ja'?(a.colorJa||colorJA[a.color]||colorENtoJA[a.colorEn]||a.colorEn||a.color):lang==='en'?(a.colorEn||labelEN[a.color]||a.color):a.color;
export const poseOf=(a,lang)=>Object.hasOwn(poseLabels,a.id)?pick(lang,poseLabels[a.id]):lang==='ja'?(a.poseJa||poseJA[a.pose]||poseENtoJA[a.poseEn]||a.poseEn||a.pose):lang==='en'?(a.poseEn||labelEN[a.pose]||a.pose):a.pose;
/**
 * The pose as a shape (B8), for the pose dialog, the panel and the recent strip; `pose` data and poseOf stay as they are
 * (search and the prompt read them). A flower-head photograph with a drawn stem says so, a grouped one that it is one layer;
 * generated poses keep their shape words without 新 / New, so a family's two generated poses stay distinguishable; everything
 * else reads as before, in sentence case in English.
 */
const SHAPE_POSES={'斜侧新姿':['斜侧','Three-quarter','斜め向き'],'另向舒展':['舒展','Branching','伸びやか']};
const SINGLE_HEAD=['单朵花头 · 自动接枝','Single head · stem drawn','一輪 · 茎を補う'],CLUSTER=['一组 · 一个图层','Cluster · one layer','数本まとめ · 1レイヤー'];
const sentenceCase=(text,lang)=>lang==='en'&&text?text[0].toUpperCase()+text.slice(1):text;
export function displayPose(a,lang){
 if(!a)return '';
 if(Object.hasOwn(poseLabels,a.id))return pick(lang,poseLabels[a.id]);
 if(a.source==='generated-pose')return Object.hasOwn(SHAPE_POSES,a.pose)?pick(lang,SHAPE_POSES[a.pose]):sentenceCase(poseOf(a,lang),lang);
 if(drawsStem(a))return pick(lang,a.bundle?CLUSTER:SINGLE_HEAD);
 return sentenceCase(poseOf(a,lang),lang);
}
/** Where a pose's picture comes from, as a small badge with a tooltip: photo (Flower Book photograph), book (adapted from a
 book plate), ai (a generated pose made from the original specimen), art (a rendered cutout, not a photograph); '' for the
 original library photographs. [[zh, en, ja] badge, [zh, en, ja] tooltip] */
export const provenanceLabels={
 photo:[['实拍','Photo','実写'],['《花之书》原书实拍照片','A photograph from the original Flower Book','原書『花の本』の実物写真']],
 book:[['书图','Book plate','書籍図版'],['依书中图版整理','Adapted from a plate in the book','書籍の図版から制作']],
 ai:[['AI 辅助','AI-assisted','AI補助'],['参考原素材、由 AI 辅助制作的新姿态','A new pose made with AI assistance from the original specimen','元の花材を参考にAIの補助で制作した新しい姿']],
 art:[['创作图','Rendered','制作画像'],['创作用图像，不是实物摄影','Rendered artwork, not a photograph','制作した画像で、実物写真ではありません']]
};
export const provenanceOf=a=>a?.source==='flower-book-photo'?'photo':a?.source==='flower-book'?'book':a?.source==='generated-pose'?'ai':/^generated-/.test(a?.source||'')?'art':'';
/** {key, label, title} for a pose's provenance badge, or null. */
export function provenance(a,lang){const key=provenanceOf(a);if(!key)return null;const [label,title]=provenanceLabels[key];return {key,label:pick(lang,label),title:pick(lang,title)}}

/** Short English card names for the catalogue vessels whose full names run to four or five words (moved from app.js). */
export const shortVesselEN={
 'matte-black-long-neck':'Matte black long-neck','ivory-tall-cylinder':'Ivory tall cylinder','white-squat-round':'White squat vase','ink-black-low-bowl':'Ink black bowl','white-square-column':'White square column','charcoal-square-basin':'Charcoal square basin','celadon-shallow-suiban':'Celadon suiban','indigo-oval-suiban':'Indigo oval suiban','sand-wide-pottery-bowl':'Sand pottery bowl','rust-dark-cylinder':'Rust stoneware cylinder','gray-flat-round':'Gray flattened vase','forest-green-shoulder':'Green shoulder vase','english-cream-pitcher':'Creamware pitcher','english-pewter-compote':'Pewter compote','english-stone-garden-urn':'Stone garden urn','french-medicis-urn':'Ivory Medici urn','french-charcoal-compote':'Charcoal compote','french-blue-cachepot':'Mist-blue cachepot','modern-smoked-glass-column':'Smoked-glass column','modern-steel-loop-vessel':'Steel loop vessel','modern-travertine-trough':'Travertine trough','round':'Bronze-blue round vase','bottle':'Brown long-neck vase'
};
/** A card's title: the short Chinese or English name where there is one (the full name stays in the aria-label), else the name. */
export const cardName=(a,lang)=>lang==='zh'?(a.shortName||a.name):lang==='en'?(a.shortNameEn||shortVesselEN[a.id]||nameOf(a,lang)):nameOf(a,lang);

// ── Covers ──
/** Card covers for families whose first photograph is not representative. Only the card renderers use this; the default
 canvas, the recent strip and specimenFor keep the first photograph. */
export const covers={sakura:'sakura'};
/** The pose a family card shows for a colour filter: its cover, else the first pose that does the family's main job, else the first. */
export function coverFor(family,poses,color='all'){
 const list=poses.filter(a=>a.family===family&&matchesMaterialColor(a,color)),main=roleOf({family});
 return list.find(a=>a.id===covers[family])||list.find(a=>roleOf(a)===main)||list[0]||null;
}

// ── Roles ──
/** Role chips, in the order the library lists them. */
export const ROLE_FILTERS=['all',...ROLES];
export const matchesRole=(a,filter)=>filter==='all'||hasRole(a,filter);
/** A card's kicker: its jobs (at most two), e.g. 线条 · 主花 for a lily. */
export const roleKicker=(a,lang)=>rolesOf(a).slice(0,2).map(role=>roleLabel(role,lang)).join(' · ');
/** Line first, then focal, supporting, filler and foliage; within a role the materials `first` picks (B8: those in season) come
 first, then the tallest, then catalogue order. */
export function sortByRole(list,heightOf=()=>0,first=()=>false){
 return list.map((a,index)=>({a,index,role:ROLES.indexOf(roleOf(a)),lead:first(a)?0:1,height:+heightOf(a)||0}))
  .sort((p,q)=>p.role-q.role||p.lead-q.lead||q.height-p.height||p.index-q.index).map(entry=>entry.a);
}
/** Runs of consecutive materials with the same main role (for the role headers under 全部). */
export function roleGroups(list){
 const groups=[];
 for(const a of list){const role=roleOf(a),last=groups.at(-1);if(last?.role===role)last.items.push(a);else groups.push({role,items:[a]})}
 return groups;
}

// ── Seasons (B8) ──
/** Time zones whose seasons run opposite to the northern hemisphere (a guess; the season chip can be cycled by hand). */
const SOUTHERN_ZONE=/^(Australia\/|Pacific\/Auckland$|Pacific\/Chatham$|America\/Santiago$|America\/Argentina\/|America\/Buenos_Aires$|America\/Sao_Paulo$|America\/Montevideo$|Africa\/Johannesburg$|Antarctica\/)/;
export const southernZone=tz=>SOUTHERN_ZONE.test(String(tz||''));
/** The garden season at `date` (its local month): Mar–May spring, Jun–Aug summer, Sep–Nov autumn, Dec–Feb winter, two seasons
 on in a southern time zone `tz`. */
export function currentSeason(date=new Date(),tz=''){
 const month=(date instanceof Date&&!Number.isNaN(date.getTime())?date:new Date()).getMonth();
 const north=Math.floor(((month+10)%12)/3);
 return SEASONS[(north+(southernZone(tz)?2:0))%4];
}
/** The season `shift` steps after `season` (the chip's manual override is stored as a shift, so it survives the year). */
export const shiftSeason=(season,shift=0)=>SEASONS[(((SEASONS.indexOf(season)+Math.trunc(+shift||0))%4)+4)%4];
/** A stored override: an integer shift 0–3, anything else 0. */
export const seasonShiftOf=value=>{const n=Number(value);return Number.isInteger(n)&&n>=0&&n<4?n:0};
export const allYear=a=>{const list=seasonsOf(a);return SEASONS.every(s=>list.includes(s))};
export const matchesSeason=(a,season)=>seasonsOf(a).includes(season);
/**
 * The season mark on a family card: the current season when the family is in it (now), 四季 / All year when it always is,
 * else its next season (a muted mark). `title` lists all its seasons. null for a family without season data.
 */
export function seasonMark(a,season,lang){
 const list=seasonsOf(a);if(!list.length)return null;
 const all=allYear(a),now=list.includes(season),start=Math.max(0,SEASONS.indexOf(season));
 const key=all?'all':now?season:[1,2,3].map(k=>SEASONS[(start+k)%4]).find(s=>list.includes(s));
 const names=SEASONS.filter(s=>list.includes(s)).map(s=>seasonLabel(s,lang));
 const title=all?pick(lang,['四季皆宜','In season all year','通年']):lang==='en'?`Season: ${names.join(', ').toLowerCase()}`:lang==='ja'?`季節：${names.join('・')}`:`花季：${names.join('、')}`;
 return {key,now:all||now,text:seasonLabel(key,lang),title};
}
/** The season chip: 当季 · 秋 / In season · Autumn / 旬 · 秋, and how to change it. */
export function seasonChip(season,lang){
 const name=seasonLabel(season,lang);
 return {label:pick(lang,['当季','In season','旬']),name,
  aria:lang==='en'?`In season: ${name}. Press again for another season`:lang==='ja'?`旬：${name}。もう一度押すと季節を変えます`:`当季：${name}。再点一次换季节`};
}

// ── True size ──
const round1=n=>Math.round(n*10)/10;
/**
 * A material's true size as the first stem in `vessel` (the slot planSlot gives it on an empty canvas): whole height in cm
 * (the same number as scale.js defaultCm), its drawn stem, and for a flower-head photograph the head above that stem.
 */
export function sizeOf(a,vessel){
 const plan=planSlot({items:[],vessel,id:'default'},a,{[vessel.id]:vessel}),{miss:_,...fit}=plan.fit,item={type:a.id,h:plan.h,flip:plan.flip,...fit};
 const cm=round1(itemCm(item,a)),stem=drawsStem(a)?round1(stemCm(item,a)):0;
 return {cm,stemCm:stem,headCm:drawsStem(a)?round1(cm-stem):null};
}
/** [shortest, tallest] whole height over a family's poses. */
export function sizeRange(poses,vessel,size=sizeOf){
 const cms=poses.map(a=>size(a,vessel)?.cm).filter(Number.isFinite);
 return cms.length?[Math.min(...cms),Math.max(...cms)]:null;
}
const APPROX=['≈','≈','≈'],APPROX_WORDS=['约\u00a0','about\u00a0','約'],HEAD=['花头','head','花'],NB='\u00a0';
/** Word joiners around a range dash, so a narrow card never breaks 3–7 or 47–65 after the dash. */
const DASH=['\u2060–\u2060','\u2060–\u2060','\u2060〜\u2060'];
/** The size chip: ≈16–45 cm for a family; ≈40 cm · 花头 10 cm for a flower-head photograph with a drawn stem; ≈58 cm otherwise.
 `words` spells ≈ out (约 / about / 約) for screen readers. No-break spaces keep a number with its unit when a card wraps. */
export function sizeText(size,lang,{words=false}={}){
 if(!size)return '';
 const approx=pick(lang,words?APPROX_WORDS:APPROX),to=pick(lang,DASH);
 if(size.range){const [lo,hi]=size.range.map(Math.round);return lo===hi?`${approx}${hi}${NB}cm`:`${approx}${lo}${to}${hi}${NB}cm`}
 const total=`${approx}${Math.round(size.cm)}${NB}cm`;
 return size.headCm!=null&&size.stemCm>=2?`${total} · ${pick(lang,HEAD)}${NB}${Math.round(size.headCm)}${NB}cm`:total;
}
/** Badge for a family with three or more poses. */
export const poseCount=(n,lang)=>lang==='ja'?`${n}姿`:lang==='en'?`${n} poses`:`${n} 款`;

// ── Vessels ──
export const SHAPES=['tall','low','shallow'];
/** [zh, en, ja] */
export const shapeLabels={tall:['高瓶','Tall','背の高い器'],low:['低器','Low','低い器'],shallow:['水盘','Shallow','水盤']};
/** Short support names for cards, by fixture kind. [zh, en, ja] */
export const supportLabels={neck:['瓶口','Neck','花器の口'],kenzan:['剑山','Kenzan','剣山'],'pin-frog-wire':['剑山','Pin frog','剣山'],'chicken-wire':['花艺网','Floral wire','ワイヤー'],'hidden-grid':['网格','Grid','格子'],crossbar:['十字撑','Crossbar','横棒'],'integrated-holes':['插口','Openings','器の穴'],foam:['花泥','Foam','フォーム']};
const supportJA={neck:'花器の口',kenzan:'剣山','integrated-holes':'器の穴','chicken-wire':'花留めのワイヤー','hidden-grid':'隠し格子',crossbar:'隠し横棒',foam:'隠したフォーム'};
/** The vessel's support as the editor names it (the vessel-switch toast): the catalogue's zh/en name, a ja name by kind. */
export const supportName=(v,lang)=>lang==='ja'?(supportJA[v?.fixture?.kind]||'花留め'):lang==='en'?(v?.fixture?.en||'Auto support'):(v?.fixture?.name||'自动固定');
/** Supports that hold stems wherever they go in the mouth. */
const HOLDS=new Set(['kenzan','pin-frog-wire','chicken-wire','hidden-grid','foam']);
/**
 * Facts for a vessel card, from its geometry (the catalogue `group` is unreliable: a 30 cm ribbed vase is 'low'):
 * shape  shallow when at most 16 cm tall or the mouth is ≥ 1.3× the height; tall from 24 cm; low otherwise
 * capacity [min, max, more] stems: a kenzan, wire, grid or foam (or a mouth ≥ 15 cm) 5–12+; a neck under 6 cm 1–3; else 3–7
 */
export function vesselFacts(v){
 const g=vesselGeometry(v),o=g.openings.find(p=>p.primary)||g.openings[0],h=g.height,mouth=o?2*o.radius[0]:g.width,support=g.fixture?.kind||'neck';
 const shape=h<=16||mouth>=1.3*h?'shallow':h>=24?'tall':'low';
 const capacity=HOLDS.has(support)||mouth>=15?[5,12,true]:mouth<6?[1,3,false]:[3,7,false];
 return {shape,heightCm:h,mouthCm:mouth,support,capacity};
}
/** Centimetres for a card: one decimal under 10 cm (3.6), whole above. */
const cmText=n=>n<9.95?String(round1(n)):String(Math.round(n));
export const capacityText=([lo,hi,more],lang)=>{const to=pick(lang,DASH);return lang==='ja'?`${lo}${to}${hi}本${more?'以上':''}`:lang==='en'?`${lo}${to}${hi}${more?'+':''}${NB}stems`:`宜插${NB}${lo}${to}${hi}${more?'+':''}${NB}枝`};
const BOOK_FORM=['书中器形','Book form','書籍の器'];
export const isVesselAsset=a=>!!a&&!a.family&&!!(a.fixture||a.openings||a.mouth);

// ── Card words ──
const choose=(name,lang)=>lang==='ja'?`${name}を選ぶ`:lang==='en'?`Choose ${name}`:`挑选${name}`;
/**
 * Everything a library card says, in one language: {kind, name, kicker, size, fit, badge, meta, label}.
 * Vessel        kicker = shape; size = 高 31 cm · 口 15 cm; fit = support · capacity; badge = 书中器形 for Flower Book forms.
 * Family card   (`poses` given) kicker = its roles; size = ≈min–max cm over its poses in `vessel`; badge = pose count when ≥ 3.
 * Single pose   kicker = its own role (photo-sakura is 配花); size = ≈40 cm · 花头 10 cm.
 * `meta` is the visible line as one string and `label` the button's aria-label. `size` sizes one pose (default sizeOf; app.js
 * passes a cached one). Sizes are left out when no vessel is given.
 */
export function cardMeta(a,lang,{vessel=null,poses=null,size=sizeOf}={}){
 const name=nameOf(a,lang);
 if(isVesselAsset(a)){
  const facts=vesselFacts(a),shape=pick(lang,shapeLabels[facts.shape]),h=cmText(facts.heightCm),w=cmText(facts.mouthCm);
  const dims=lang==='ja'?`高さ${h}${NB}cm · 口${w}${NB}cm`:lang==='en'?`${h}${NB}cm${NB}tall · mouth${NB}${w}${NB}cm`:`高${NB}${h}${NB}cm · 口${NB}${w}${NB}cm`;
  const capacity=capacityText(facts.capacity,lang),fit=`${pick(lang,supportLabels[facts.support]||supportLabels.neck)} · ${capacity}`;
  const badge=a.source==='flower-book-vessel'?pick(lang,BOOK_FORM):'';
  const label=[lang==='ja'?`${name}を選ぶ`:lang==='en'?`Select ${name}`:`选择${name}`,shape,dims,supportName(a,lang),capacity,badge].filter(Boolean).join(' · ');
  return {kind:'vessel',name,kicker:shape,size:dims,fit,badge,meta:`${shape} · ${dims}`,label,facts};
 }
 const family=Array.isArray(poses),kicker=roleKicker(a,lang);
 let sized=null;
 if(vessel){
  if(family){const range=sizeRange(poses,vessel,size);sized=range&&{range}}
  else sized=size(a,vessel);
 }
 const sizeLine=sizeText(sized,lang),badge=family&&poses.length>=3?poseCount(poses.length,lang):'';
 const label=[family?choose(name,lang):`${name} · ${colorOf(a,lang)} · ${poseOf(a,lang)}`,kicker,sizeText(sized,lang,{words:true}),badge].filter(Boolean).join(' · ');
 return {kind:family?'family':'pose',name,kicker,size:sizeLine,fit:'',badge,meta:[kicker,sizeLine].filter(Boolean).join(' · '),label};
}

// ── Search ──
/** The forms a query is tried in: as typed (NFKC, lowercase), then without a trailing 花/色 (up to twice, only while longer than
 one character), then English singulars (lilies → lily, irises → iris, roses → rose). */
export function queryForms(query){
 const q=searchForm(query);if(!q)return [];
 const forms=[q];let s=q;
 for(let k=0;k<2&&[...s].length>1&&/[花色]$/u.test(s);k++){s=[...s].slice(0,-1).join('');forms.push(s)}
 if(/^[a-z][a-z' ’-]*[a-z]$/.test(q)&&q.length>3){if(q.endsWith('ies'))forms.push(`${q.slice(0,-3)}y`);if(q.endsWith('es'))forms.push(q.slice(0,-2));if(q.endsWith('s'))forms.push(q.slice(0,-1))}
 return [...new Set(forms)];
}
/** Points per field: exact, prefix, substring. A query form shorter than two characters that is not the query itself only counts exact. */
const WEIGHTS={name:[100,80,60],alias:[95,70,50],role:[45,40,0],color:[40,30,25],extra:[40,30,20],pose:[20,15,10]};
const words=list=>[...new Set(list.flat(Infinity).filter(Boolean).map(searchForm).filter(Boolean))];
function score(entry,forms){
 let best=0;
 forms.forEach((form,k)=>{
  const strict=k>0&&[...form].length<2,penalty=k?5:0;
  for(const [field,[exact,prefix,inside]] of Object.entries(WEIGHTS))for(const word of entry[field]||[]){
   const points=word===form?exact:strict?0:word.startsWith(form)?prefix:inside&&word.includes(form)?inside:0;
   if(points)best=Math.max(best,points-penalty);
  }
 });
 return best;
}
/**
 * One search over the plant families and the vessels, in every language at once.
 * Families: names of every pose in zh/en/ja, botany aliases, role labels (and role aliases such as greenery), colours in three
 * languages plus the colour-chip words they match, pose labels. Vessels: names, colours, style, shape, support and 花之书.
 * match(query, 'flowers' | 'vessels') → Map(id → score), best first, or null for an empty query. When something matches a
 * name or alias exactly, colour and pose prefix/substring hits are dropped, so 'rose' lists roses, not every rose-pink flower.
 */
export function buildSearchIndex(families,vessels,poses=[]){
 const byFamily=new Map();for(const a of poses){if(!byFamily.has(a.family))byFamily.set(a.family,[]);byFamily.get(a.family).push(a)}
 const langs=['zh','en','ja'];
 const flowerEntries=families.map(f=>{
  const list=byFamily.get(f.family)||[f],roles=rolesOf(f);
  return {id:f.id,
   name:words([f.id,f.id.replaceAll('-',' '),list.map(a=>[a.name,a.shortName,a.en,a.ja,langs.map(l=>nameOf(a,l))]),langs.map(l=>nameOf(f,l))]),
   alias:words([profiles[f.family]?.aliases||[]]),
   role:words(roles.map(role=>[roleLabels[role],roleAliases[role]||[],role])),
   color:words([list.map(a=>[a.color,a.colorEn,colorOf(a,'ja')]),materialColorGroups.filter(g=>list.some(a=>matchesMaterialColor(a,g.id))).map(g=>[g.id,g.zh,g.en,g.ja])]),
   pose:words(list.map(a=>langs.map(l=>poseOf(a,l))))};
 });
 const styleWords={japanese:['日式','Japanese','和風','日本風'],english:['英式','English','英国風'],french:['法式','French','フランス風'],modern:['现代','Modern','モダン']};
 const vesselEntries=vessels.map(v=>{
  const facts=vesselFacts(v);
  return {id:v.id,
   name:words([v.id.replaceAll('-',' '),v.name,v.shortName,v.en,v.shortNameEn,langs.map(l=>nameOf(v,l))]),
   color:words([v.color,v.colorEn,colorOf(v,'ja')]),
   extra:words([styleWords[v.style||'japanese']||[],shapeLabels[facts.shape],supportLabels[facts.support]||[],langs.map(l=>supportName(v,l)),v.source==='flower-book-vessel'?[BOOK_FORM,'花之书','The Book','花の本']:[]])};
 });
 const run=(entries,query)=>{
  const forms=queryForms(query);if(!forms.length)return null;
  const hits=entries.map(entry=>[entry.id,score(entry,forms)]).filter(([,points])=>points>0);
  const floor=hits.some(([,points])=>points>=WEIGHTS.alias[0])?WEIGHTS.color[0]:1;
  return new Map(hits.filter(([,points])=>points>=floor).sort((p,q)=>q[1]-p[1]));
 };
 return {match:(query,kind='flowers')=>run(kind==='vessels'?vesselEntries:flowerEntries,query)};
}

// ── Empty results ──
/** 没有符合「叶材 · 粉」的花材 / No materials match Foliage · Pink: the active filters (and the query) by name, for flowers or vessels. */
export function emptyText(lang,{kind='flowers',filters=[],query=''}={}){
 const what=pick(lang,kind==='vessels'?['花器','vessels','花器']:['花材','materials','花材']),q=String(query||'').trim();
 // zh and ja already quote the whole list in 「」; English quotes the search words.
 const parts=[...filters.filter(Boolean),q?(lang==='en'?`“${q}”`:q):''].filter(Boolean);
 if(!parts.length)return lang==='ja'?`${what}が見つかりません。`:lang==='en'?`No ${what} found.`:`没有找到${what}。`;
 const list=parts.join(' · ');
 return lang==='ja'?`「${list}」に合う${what}がありません。`:lang==='en'?`No ${what} match ${list}.`:`没有符合「${list}」的${what}。`;
}
export const clearFiltersLabel=lang=>pick(lang,['清除筛选','Clear filters','絞り込みを解除']);
