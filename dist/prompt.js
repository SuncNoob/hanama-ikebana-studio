// SPDX-FileCopyrightText: 2026 Marko Sun
// SPDX-License-Identifier: LicenseRef-Hanama-Proprietary
/**
 * The generation prompt (A16): English text for ChatGPT built from a draft. Pure and DOM-free (tests/prompt.test.mjs covers
 * all 50 studies). One materials list counted by origin (a stem cut in two is one material), true-scale facts measured from
 * the draft, a camera line, the vessel's real support and a paragraph that depends on the refinement mode. Also the pack's
 * mode names, file names and readme (A17).
 */
import {arrangementMetrics,isKenzan} from './scale.js?v=hn3';
import {vesselGeometry} from './geometry.js?v=28';
import {profileOf,rolesOf,unitNoun} from './botany.js?v=hn2';

const hashText=text=>{let h=2166136261;for(const c of String(text)){h^=c.charCodeAt(0);h=Math.imul(h,16777619)}return h>>>0};
const pick=(list,n,shift=0)=>list[(n+shift)%list.length];
const termEN={
 '淡粉':'soft pink','象牙白':'ivory','赭橙':'ochre orange','松绿':'pine green','秋红':'autumn red','麦白':'wheat white','柔粉':'blush pink','暖白':'warm white','浅杏':'pale apricot','酒红':'burgundy','浅粉':'pale pink','白色':'white','淡紫':'pale lavender','紫色':'purple','浅蓝':'pale blue','自然红':'natural red','红色':'red','嫩绿':'fresh green','银绿':'silver green','自然绿':'natural green','深绿':'deep green','夏绿':'summer green','哑黑':'matte black','墨黑':'ink black','炭黑':'charcoal','浅青釉':'pale celadon','深蓝釉':'deep indigo glaze','暖沙色':'warm sand','铁锈深釉':'dark rust glaze','浅灰釉':'light gray glaze','深绿釉':'deep green glaze','窑变釉':'variegated glaze','褐釉':'brown glaze',
 '原版花枝':'original flowering branch','原版正面':'original front view','原版虬枝':'original gnarled branch','原版舒展':'original spreading branch','自然穗形':'natural plume','正面':'front view','侧面':'side view','斜侧面':'three-quarter view','直立枝':'upright branch','横逸枝':'lateral branch','自然弧枝':'natural arched branch','垂弧枝':'drooping arch','斜生枝':'oblique branch','弧形叶':'arched frond','疏枝':'sparse branch','自然斜枝':'natural oblique branch','舒展枝':'spreading branch',
 '静寂':'Stillness','侘寂':'Wabi-sabi','春意':'Spring','野趣':'Wild spirit'
};
const en=value=>termEN[value]||value;
/** Mood as a photographic direction rather than a bare word. Spring at night keeps the evening light (night scene + 春意). */
const moodEN={'静寂':'calm, soft diffuse side light, muted palette, generous empty space','侘寂':'low-key light, tactile surfaces, gentle imperfection','春意':'fresh morning light, airy and bright','野趣':'loose, just-gathered garden feeling'};
const moodAtNight={'春意':'fresh, delicate spring colour under quiet evening light'};
/** The same moods without their light words, for a draft with a window light (B10), whose Light sentence sets the light. */
const moodUnlit={'静寂':'calm, muted palette, generous empty space','侘寂':'tactile surfaces, gentle imperfection, quiet shadows','春意':'fresh, airy spring colour','野趣':'loose, just-gathered garden feeling'};
/** One soft Light sentence per window light (ambience.js LIGHTS keys); it replaces "Keep the draft's overall lighting". The
 directions follow the draft: the shadow falls away from the light. */
export const LIGHT_PROMPT=Object.freeze({
 morning:'Light: soft early-morning sun from the upper left through a mullioned window; a pale warm patch of window light on the wall, with the arrangement\'s soft shadow falling inside it a little to the right.',
 noon:'Light: bright, high midday daylight through a window; a neutral patch of window light high on the wall, with short soft shadows just below the stems.',
 dusk:'Light: low, warm evening sun from the left through a window; a long amber patch of window light across the wall, with the arrangement\'s long soft shadow stretched to the right inside it.',
 moon:'Light: cool moonlight from the upper right through a window in a dim, quiet room; a pale blue patch of window light on the wall, with the arrangement\'s soft shadow falling to the left; low-key, gentle exposure.'
});
const lowerName=name=>/^(Japanese|Icelandic|Peruvian|English|French|Chinese|Dutch)\b/.test(name)?name:name.charAt(0).toLowerCase()+name.slice(1);
/** Simple English plural of a plant name. Latin -s/-x/-i names and mass nouns stay unchanged; "lily of the valley" pluralises its head. */
export function pluralName(name){
 const of=String(name).match(/^(.+?)( of .+)$/);if(of)return pluralName(of[1])+of[2];
 if(/iris$/i.test(name))return name+'es';
 if(/(s|x|i|lavender|gypsophila|statice|jasmine|yarrow|grass|mantle|weed|bleeding|stonecrop|hypericum)$/i.test(name))return name;
 if(/[^aeiou]y$/i.test(name))return name.slice(0,-1)+'ies';
 if(/(ch|sh)$/i.test(name))return name+'es';
 return name+'s';
}
const NUMBER_WORDS=['no','one','two','three','four','five','six','seven','eight'];
const numberWord=n=>NUMBER_WORDS[n]||String(n);
/**
 * `n` pieces of a material as a florist counts them: "2 branches of Japanese maple", "1 plume of pampas grass",
 * "3 fronds of fern", "2 stems of snow willow", "2 fatsia leaves", "a bunch of narcissus", "2 irises". The count never
 * sits right before a branch's name, so a cut branch never reads as a whole tree ("2 willows"). Bunches count as bunches.
 */
export function materialNoun(a,n=1){
 const name=lowerName(a.en||a.name),unit=profileOf(a)?.unit;
 if(a.bundle)return `${n===1?'a bunch':`${n} bunches`} of ${pluralName(name)}`;
 if(unit==='leaf')return `${n} ${name.replace(/\s+leaf$/i,'')} ${unitNoun(unit,n)}`;
 if(unit)return `${n} ${unitNoun(unit,n)}${unit==='stem of'?'':' of'} ${name.replace(/\s+foliage$/i,'')}`;
 return `${n} ${n===1?name:pluralName(name)}`;
}
/** One piece's noun without its count ("branch of willow", "bunch of narcissus"), for the scale line. */
const singleNoun=a=>materialNoun(a,1).replace(/^(1|a) /,'');

/** "pale blue", "pale blue and white", "pale blue, purple and white"; "warm white / red and yellow" when a colour has its own "and". */
const listText=list=>list.some(c=>/ and /.test(c))?list.join(' / '):list.length<3?list.join(' and '):`${list.slice(0,-1).join(', ')} and ${list.at(-1)}`;
/**
 * The draft's materials counted once per origin (the pieces of a stem cut with scissors share `originId`): one group per
 * material name, {asset, colors, n, front, pieces}, where `front` counts the origins with a piece crossing in front of the
 * rim (aboveVessel) and `pieces` is how many pieces each origin was cut into. Groups with front stems come first, then draft order.
 */
export function materialGroups(items,assetById){
 const origins=new Map();
 for(const item of items){const a=assetById[item.type];if(!a)continue;const key=item.originId||item.id,o=origins.get(key)||{a,front:false,pieces:0};o.front||=!!item.aboveVessel;o.pieces++;origins.set(key,o)}
 const groups=new Map();
 for(const {a,front,pieces} of origins.values()){
  const color=a.colorEn||en(a.color),key=[a.en||a.name,a.bundle?1:0,pieces].join('|'),g=groups.get(key)||{asset:a,colors:[],n:0,front:0,pieces};
  g.n++;if(front)g.front++;if(color&&!g.colors.includes(color))g.colors.push(color);groups.set(key,g);
 }
 return [...groups.values()].sort((x,y)=>Number(y.front>0)-Number(x.front>0));
}

/** Families shown by leaves, needles, bark, catkins, berries or plumes rather than petals (they choose the detail phrase). */
const PETAL_FREE=new Set(['pine','maple','willow','pussy-willow','pampas','briza','snowberry','hypericum']);
const hasPetals=a=>!PETAL_FREE.has(a.family)&&!rolesOf(a).every(role=>role==='foliage');
const round5=cm=>Math.max(5,Math.round(cm/5)*5);

/** The paragraph that sets how freely the model may depart from the draft (state.generation). */
const MODES={
 faithful:'Stay as close to the draft as physics allows: keep each flower\'s position, facing and stem angle; fix only floating, crossing or disconnected stems.',
 creative:'Keep the same materials, count and silhouette; refine facing, stem rhythm and depth more freely, as a skilled florist would.',
 natural:'Treat the draft as design intent, not a tracing. Allow small shifts in flower facing, stem curves and depth for natural growth and gravity.'
};
/** The vessel's curated support (vesselGeometry normalises one centre or several), or null. */
const fixtureOf=vessel=>{try{return vesselGeometry(vessel).fixture}catch{return null}};
const holderNoun=f=>f?.kind==='kenzan'?'kenzan':'pin frog';
/** How the vessel holds the stems. A kenzan always stands in water, so its sentence says so. */
function supportSentence(vessel){
 const f=fixtureOf(vessel);
 if(f&&isKenzan(vessel)){
  const noun=holderNoun(f),material=f.material?`${String(f.material).replace(/-/g,' ')} `:'',count=f.centers?.length||1,water='calm, shallow, clear water';
  if(count>1)return `${numberWord(count).replace(/^./,c=>c.toUpperCase())} low ${material}${noun}${noun==='kenzan'?'':'s'} along the ${/trough/i.test(vessel.en||'')?'trough':'vessel'} sit in ${water}, ${f.visibility==='partial'?'only partly visible':'naturally visible'} at the stem bases.`;
  return `A low ${material}${noun} sits in ${water} and ${f.visibility==='partial'?'shows only partly':'stays naturally visible'} at the stem bases.`;
 }
 if(f?.kind==='chicken-wire'&&f.visibility==='partial')return `Support the stems with ${lowerName(f.en||'dark floral wire mesh')} that shows only slightly inside the rim.`;
 return {neck:'Let the neck support the stems.','integrated-holes':'Insert stems through the actual openings.','chicken-wire':'Hidden floral wire inside holds the stems.','hidden-grid':'Use a concealed grid below the rim.',crossbar:'Use a concealed crossbar below the rim.',foam:'Conceal the support inside the vessel.'}[f?.kind]||'Use discreet support suited to the vessel.';
}

/** The true-scale sentence, or null when the draft has nothing to measure. */
function scaleSentence(assetById,vessel,metrics){
 const top=metrics?.tallest,a=top&&assetById[top.type];
 if(!a||!(top.cmAboveTable>0)||!(metrics.vesselCm>0))return null;
 const line=rolesOf(a).includes('line')?'line':'stem';
 return `True scale: ${vessel.en||vessel.name}, about ${Math.round(metrics.vesselCm)} cm tall; the tallest ${line} (${singleNoun(a)}) rises about ${round5(top.cmAboveTable)} cm above the table. Keep flowers and foliage life-size against the vessel.`;
}

/** Target canvas for the generated photo. The square draft remains an unaltered reference. */
export const OUTPUT_FORMATS=Object.freeze({
 phone:Object.freeze({ratio:'9:16',width:1440,height:2560,names:['手机壁纸','Phone wallpaper','スマホ壁紙']}),
 macbook:Object.freeze({ratio:'16:10',width:2880,height:1800,names:['MacBook 壁纸','MacBook wallpaper','MacBook壁紙']}),
 square:Object.freeze({ratio:'1:1',width:2048,height:2048,names:['方形照片','Square photo','正方形の写真']})
});
export const OUTPUT_FORMAT_ORDER=['phone','macbook','square'];
export const outputFormat=id=>OUTPUT_FORMATS[id]||OUTPUT_FORMATS.square;
const formatDirection=id=>{
 const f=outputFormat(id),target=`${f.ratio}, target ${f.width} × ${f.height} px`;
 if(id==='phone')return `Output: portrait phone wallpaper (${target}). Expand the scene vertically around the arrangement; keep every flower and the full vase visible, with quiet, uncluttered space toward the upper third for a lock-screen clock.`;
 if(id==='macbook')return `Output: landscape MacBook wallpaper (${target}). Expand the room naturally to both sides; keep the arrangement's proportions, with calm negative space that works behind desktop icons.`;
 return `Output: square editorial photograph (${target}). Keep the whole arrangement and its breathing room in frame.`;
};

/**
 * Prompt text only. `extras` (all optional):
 *  - outOfScale: some stem is outside its real size range, so the prompt makes no centimetre claims;
 *  - presetNote: the creative note is the untouched preset (true, or its English text): it becomes a mood cue, not an instruction;
 *  - guide: the pack also carries composition-guide.png, so one sentence says how to use it;
 *  - format: phone, macbook, or square output canvas; the square draft is never stretched;
 *  - metrics: arrangementMetrics() result to use instead of measuring here (null: unknown, keep the plain wording).
 */
export function buildPrompt(s,assetById,scenes,extras={}){
 const vessel=assetById[s.vessel],items=(s.items||[]).filter(i=>assetById[i.type]),groups=materialGroups(items,assetById);
 const several=(vessel.openings?.length||0)>1,kenzan=isKenzan(vessel),glass=/glass/i.test(`${vessel.id} ${vessel.en||''}`);
 const concealed=!vessel.fixture||vessel.fixture.visibility==='hidden';
 const fixture=kenzan?fixtureOf(vessel):null,holder=holderNoun(fixture),holders=(fixture?.centers?.length||1)>1;
 const hides=glass?`stems show faintly through the ${/smoked/i.test(vessel.en||vessel.id)?'smoked ':''}glass below the waterline`:concealed?'the rim hides the cut ends':'';
 const stems=!items.length?'':kenzan?`Every stem rises continuously from ${holders?`one of the ${holder}${holder==='kenzan'?'':'s'}`:`the ${holder}`}.`:`Every stem rises continuously from ${several?'one of the vessel openings':'the vessel opening'}${hides?`; ${hides}`:''}.`;
 const mode=MODES[s.generation]||MODES.natural;
 const n=hashText(`${s.id||''}-${s.generationVariation||0}`),petals=items.some(i=>hasPetals(assetById[i.type]));
 const detail=petals?pick(['uneven petal overlap and subtle pigment drift','relaxed petal folds and gently varied opening stages','slightly eccentric petals and soft colour variation','small differences in petal curl and maturity'],n)
  :pick(['natural leaf texture, needle density and bark grain','slightly uneven leaf edges and natural bark detail','varied leaf angles, needle clusters and fine bark texture','gentle differences in leaf colour, needle and bark texture'],n);
 const materials=groups.map(g=>{
  const cut=g.pieces>1?`, ${g.n>1?'each ':''}cut into ${numberWord(g.pieces)} pieces`:'';
  const depth=g.front&&!kenzan?`, ${g.front<g.n?`${numberWord(g.front)} `:''}crossing in front of the rim`:'';
  return `${materialNoun(g.asset,g.n)}${g.colors.length?` (${listText(g.colors)})`:''}${depth}${cut}`;
 }).join('; ');
 let metrics=extras?.metrics;
 if(metrics===undefined)try{metrics=arrangementMetrics({...s,items},assetById)}catch{metrics=null}
 const vesselName=vessel.en||vessel.name;
 const scale=extras?.outOfScale?`Vessel: ${vesselName}.\nKeep flower sizes as drawn relative to the vessel.`
  :scaleSentence(assetById,vessel,metrics)||`Vessel: ${vesselName}, about ${Math.round(vessel.height)} cm tall.\nThe draft is drawn at true botanical scale; keep every flower head, leaf and branch at its real size relative to the vessel.`;
 const night=s.scene==='night',light=typeof s.light==='string'&&Object.hasOwn(LIGHT_PROMPT,s.light)?LIGHT_PROMPT[s.light]:'',moodWords=light?moodUnlit[s.mood]:(night&&moodAtNight[s.mood])||moodEN[s.mood];
 const mood=moodWords?`${en(s.mood)} — ${moodWords}`:en(s.mood),note=String(s.intention||'').trim(),title=String(s.title||'').trim(),subtitle=String(s.subtitle||'').trim();
 const preset=!!note&&!!extras?.presetNote,cue=typeof extras?.presetNote==='string'&&extras.presetNote.trim()?extras.presetNote.trim():note;
 const namedTitle=['未命名作品','Untitled Arrangement','タイトルなしの作品'].includes(title)?'':title;
 const theme=[namedTitle,subtitle].filter(Boolean).join(' — ').replace(/\s+/g,' ').slice(0,140);
 const scene=scenes[s.scene]||scenes.paper||[];
 const ownNote=note&&!preset;
 return `Create an image from the attached draft: an exceptional wallpaper-worthy editorial photograph of a real floral arrangement. Keep the flower types and count, vessel and main rhythm; make the stems physically believable.

${formatDirection(extras?.format)} The draft is a collage, not a frame to trace. Extend the setting without stretching or repeating the flowers. Show the whole vessel and its base. Capture natural colour, tactile botanical and ceramic detail, gentle depth and coherent light; never a pasted collage.${extras?.guide?' A faded layout image, if attached, only shows which stems pass in front of the rim; don\'t copy its colours or lines.':''}

${[mode,stems,supportSentence(vessel)].filter(Boolean).join(' ')}

${light?`${light} Preserve that light direction${ownNote?' unless the creative note describes another light':''}; let shadows and reflections follow the real forms.`:`Preserve the draft's overall light${ownNote?' unless the creative note describes another light':''}; let shadows and reflections follow the real forms.`} Give each ${petals?'bloom':'branch and leaf'} species-true individuality: ${detail}, without exaggerated damage.

Materials: ${materials||'as shown in the draft'}.
${scale}
Setting: ${scene[3]||scene[2]||'as in the draft'}. Mood: ${mood}.${theme?`\nTheme (an atmosphere cue, not text to print): ${theme}.`:''}${preset?`\nMood cue: ${cue}`:ownNote?`\nCreative note: ${note}\nIf the creative note explicitly describes a different setting or light, follow it.`:''}
No added text or watermark.`;
}

// ── The pack around the prompt (A17) ──
/** The refinement modes, in the order the dialog offers them. */
export const PACK_MODES=['natural','creative','faithful'];
/** Each mode's full name and the pack's file name, [zh, en, ja]. */
export const MODE_NAMES={natural:['小幅自然重整','Gentle natural refinement','自然に少し整える'],creative:['适度花艺润色','Moderate florist refinement','ほどよく花を整える'],faithful:['最小修正','Minimal correction','最小限の修正']};
export const PACK_NAMES={natural:['自然重整创作包','natural-refinement-pack','自然な仕上げの生成パック'],creative:['花艺润色创作包','florist-refinement-pack','花を整える生成パック'],faithful:['最小修正创作包','minimal-correction-pack','最小限の修正の生成パック']};
/** Image tools available for the manual draft + prompt handoff; neither is called by this site. */
export const GENERATOR_PROVIDERS=Object.freeze({
 chatgpt:Object.freeze({url:'https://chatgpt.com/',names:['ChatGPT','ChatGPT','ChatGPT']}),
 gemini:Object.freeze({url:'https://gemini.google.com/',names:['Gemini · Nano Banana','Gemini · Nano Banana','Gemini · Nano Banana']})
});
/** readme.txt of the pack: steps for a person (not instructions for the model), in `lang` first and then the other two. */
export function packReadme(mode,lang='zh',format='square',provider='chatgpt'){
 const [zh,en,ja]=MODE_NAMES[mode]||MODE_NAMES.natural;
 const sections={
  zh:['中文',`花间 · ${zh}创作包`,'1. 打开 ChatGPT（https://chatgpt.com/），新建一个对话。','2. 上传 draft.png。前后关系不清楚时，可再附上 composition-guide.png：它只说明哪些花枝在瓶口前面，不必照描。','3. 粘贴 prompt.txt 的全部文字并发送。','4. 不满意时，可以请它“让枝条更自然”，或重新生成。','5. 回到花间，在「我的作品」点「导入作品照片」，照片会和草稿一起保存。','recipe.png 和 recipe.txt 是配方：要买的花材、每枝剪多长、插在哪里，照着就能插出真实的作品。','composition.json 可以恢复这份可编辑草稿；生成不会改动你的画布。','本网站不调用任何生成接口，创作包里也没有 API 密钥。'],
  en:['ENGLISH',`HANAMA · ${en.toUpperCase()} PACK`,'1. Open ChatGPT (https://chatgpt.com/) and start a new chat.','2. Attach draft.png. If the layering is unclear, also attach composition-guide.png: it only shows which stems pass in front of the rim, so it need not be traced.','3. Paste all of prompt.txt and send it.','4. Not quite right? Ask for “more natural stems”, or regenerate.','5. Back in HANAMA, open My Works and choose Import a photo; it is kept with its draft.','recipe.png and recipe.txt are the recipe: what to buy, and how long to cut and where to place each stem to make it for real.','composition.json restores this editable draft; generating never changes your canvas.','The website calls no generation API, and the pack contains no API key.'],
  ja:['日本語',`花間 · ${ja}の生成用パック`,'1. ChatGPT（https://chatgpt.com/）を開き、新しいチャットを始めます。','2. draft.png を添付します。前後関係が分かりにくいときは composition-guide.png も添えてください。花器の口の前を通る枝を示すだけで、なぞる必要はありません。','3. prompt.txt の全文を貼り付けて送信します。','4. イメージと違うときは「枝をもっと自然に」と頼むか、再生成します。','5. HANAMA に戻り、「マイ作品」の「写真を読み込む」から保存すると、下書きと一緒に残ります。','recipe.png と recipe.txt はレシピです。用意する花材と、一本ずつ切る長さ・挿す位置を記しています。','composition.json でこの下書きを編集できる状態に戻せます。生成してもキャンバスは変わりません。','このサイトは生成APIを呼び出さず、パックにAPIキーは含まれていません。']
 };
 if(provider==='gemini'){
  sections.zh[2]='1. 打开 Gemini（https://gemini.google.com/），进入「图片」功能；有 Nano Banana 选项时可使用它。';
  sections.en[2]='1. Open Gemini (https://gemini.google.com/) and choose Images; use Nano Banana when offered.';
  sections.ja[2]='1. Gemini（https://gemini.google.com/）を開き、「画像」を選びます。Nano Banana が表示されれば使用できます。';
 }
 const f=outputFormat(format),size=`${f.ratio} · ${f.width} × ${f.height} px`;
 sections.zh.push(`成品目标：${f.names[0]}（${size}）。draft.png 只是构图参考；生图工具实际输出像素可能不同。`);
 sections.en.push(`Target image: ${f.names[1]} (${size}). draft.png is a composition reference; the generator's actual pixel dimensions may differ.`);
 sections.ja.push(`仕上がりの目安：${f.names[2]}（${size}）。draft.png は構図の参考です。実際の生成サイズは使用するツールにより異なります。`);
 const first=Object.hasOwn(sections,lang)?lang:'zh';
 return [first,...['zh','en','ja'].filter(l=>l!==first)].map(l=>sections[l].join('\n')).join('\n\n')+'\n';
}
