const hashText=text=>{let h=2166136261;for(const c of String(text)){h^=c.charCodeAt(0);h=Math.imul(h,16777619)}return h>>>0};
const pick=(list,n,shift=0)=>list[(n+shift)%list.length];
const termEN={
 '淡粉':'soft pink','象牙白':'ivory','赭橙':'ochre orange','松绿':'pine green','秋红':'autumn red','麦白':'wheat white','柔粉':'blush pink','暖白':'warm white','浅杏':'pale apricot','酒红':'burgundy','浅粉':'pale pink','白色':'white','淡紫':'pale lavender','紫色':'purple','浅蓝':'pale blue','自然红':'natural red','红色':'red','嫩绿':'fresh green','银绿':'silver green','自然绿':'natural green','深绿':'deep green','夏绿':'summer green','哑黑':'matte black','墨黑':'ink black','炭黑':'charcoal','浅青釉':'pale celadon','深蓝釉':'deep indigo glaze','暖沙色':'warm sand','铁锈深釉':'dark rust glaze','浅灰釉':'light gray glaze','深绿釉':'deep green glaze','窑变釉':'variegated glaze','褐釉':'brown glaze',
 '原版花枝':'original flowering branch','原版正面':'original front view','原版虬枝':'original gnarled branch','原版舒展':'original spreading branch','自然穗形':'natural plume','正面':'front view','侧面':'side view','斜侧面':'three-quarter view','直立枝':'upright branch','横逸枝':'lateral branch','自然弧枝':'natural arched branch','垂弧枝':'drooping arch','斜生枝':'oblique branch','弧形叶':'arched frond','疏枝':'sparse branch','自然斜枝':'natural oblique branch','舒展枝':'spreading branch',
 '静寂':'Stillness','侘寂':'Wabi-sabi','春意':'Spring','野趣':'Wild spirit'
};
const en=value=>termEN[value]||value;
/** Mood as a photographic direction rather than a bare word. */
const moodEN={'静寂':'calm, soft diffuse side light, muted palette, generous empty space','侘寂':'low-key light, tactile surfaces, gentle imperfection','春意':'fresh morning light, airy and bright','野趣':'loose, just-gathered garden feeling'};
const lowerName=name=>/^(Japanese|Icelandic|Peruvian|English|French|Chinese|Dutch)\b/.test(name)?name:name.charAt(0).toLowerCase()+name.slice(1);
/** Simple English plural of a plant name. Latin -s/-x/-i names and mass nouns stay unchanged; "lily of the valley" pluralises its head. */
export function pluralName(name){
 const of=String(name).match(/^(.+?)( of .+)$/);if(of)return pluralName(of[1])+of[2];
 if(/(s|x|i|lavender|gypsophila|statice|jasmine|yarrow|grass|mantle|weed|bleeding)$/i.test(name))return name;
 if(/[^aeiou]y$/i.test(name))return name.slice(0,-1)+'ies';
 if(/(ch|sh)$/i.test(name))return name+'es';
 return name+'s';
}
/** "2 anemones, 1 ranunculus, 1 lavender bunch": items grouped by English name, in draft order. */
export function countedNames(items,assetById){
 const groups=new Map(),seen=new Set();
 for(const i of items){const a=assetById[i.type],origin=i.originId||i.id;if(!a||seen.has(origin))continue;seen.add(origin);const name=lowerName(a.en||a.name),key=`${name}|${a.bundle?1:0}`;const g=groups.get(key)||{name,bundle:!!a.bundle,n:0};g.n++;groups.set(key,g)}
 return [...groups.values()].map(({name,bundle,n})=>`${n} ${bundle?`${name} ${n===1?'bunch':'bunches'}`:n===1?name:pluralName(name)}`).join(', ');
}

/** Prompt text only; `extras.outOfScale` (optional) drops the true-scale claim for drafts whose sizes are outside real bounds. */
export function buildPrompt(s,assetById,scenes,extras={}){
 const vessel=assetById[s.vessel],counts=new Map(),items=s.items.filter(i=>assetById[i.type]),seen=new Set();
 for(const i of items){const origin=i.originId||i.id;if(seen.has(origin))continue;seen.add(origin);const a=assetById[i.type],color=a.colorEn||en(a.color),detail=[color,a.bundle&&'a natural bunch'].filter(Boolean).join(', '),key=`${a.en||a.name}${detail?` (${detail})`:''}`;counts.set(key,(counts.get(key)||0)+1)}
 const inventory=[...counts].map(([name,n])=>`${n} × ${name}`).join('; ');
 const front=items.filter(i=>i.aboveVessel),back=items.filter(i=>!i.aboveVessel),several=(vessel.openings?.length||0)>1,opening=several?'the openings':'the opening';
 const concealed=!vessel.fixture||vessel.fixture.visibility==='hidden';
 const stems=items.length?`Every stem rises continuously from ${several?'one of the vessel openings':'the vessel opening'}${concealed?'; the rim hides the cut ends':''}.`:'';
 const nearer=front.length?`Nearer the camera, crossing in front of the rim: ${countedNames(front,assetById)} (${front.length===1?`its stem still enters ${several?'one of the openings':opening}`:`their stems still enter ${opening}`}).`:'';
 const further=back.length?`Further back, partly hidden by the rim: ${countedNames(back,assetById)}.`:'';
 const refinement={natural:'Make a gentle florist refinement.',creative:'Gently refine the stem rhythm and depth within the same design.',faithful:'Make only the small corrections needed for physical realism.'}[s.generation]||'Make a gentle florist refinement.';
 const support={neck:'Let the neck support the stems.',kenzan:'Seat the stems in a discreet kenzan inside the basin.','integrated-holes':'Insert stems through the actual openings.','chicken-wire':'Support the stems with fitted floral wire inside the vessel.','hidden-grid':'Use a concealed grid below the rim.',crossbar:'Use a concealed crossbar below the rim.',foam:'Conceal the support inside the vessel.'}[vessel.fixture?.kind]||'Use discreet support suited to the vessel.';
 const n=hashText(`${s.id||''}-${s.generationVariation||0}`);
 const detail=pick(['uneven petal overlap and subtle pigment drift','relaxed petal folds and gently varied opening stages','slightly eccentric petals and soft color variation','small differences in petal curl and maturity'],n);
 const scaleNote=extras?.outOfScale?'Keep flower sizes as drawn relative to the vessel.':'The draft is drawn at true botanical scale; keep every flower head, leaf and branch at its real size relative to the vessel.';
 const mood=moodEN[s.mood]?`${en(s.mood)} — ${moodEN[s.mood]}`:en(s.mood),note=String(s.intention||'').trim();
 const scene=scenes[s.scene]||scenes.paper||[];
 return `Create an image from the attached draft image: a square professional photograph of a real floral arrangement. Keep the draft's recognizable composition, selected flowers and count, vessel and main negative spaces. ${refinement}

${['Treat the draft as design intent, not a tracing. Allow small shifts in flower facing, stem curves and depth for natural growth and gravity.',stems,support,nearer,further].filter(Boolean).join(' ')}

Keep the overall lighting and atmosphere; let local shadows and reflections follow the real forms. Give each bloom species-appropriate individuality through ${detail}, without exaggerated damage.

Materials: ${inventory||'as shown in the draft'}. Vessel: ${vessel.en||vessel.name}, about ${Math.round(vessel.height)} cm tall.
${scaleNote}
Setting: ${scene[3]||scene[2]||'as in the draft'}. Mood: ${mood}.${note?`\nCreative note: ${note}\nIf the creative note names a place, season or light, follow the note over the setting and the draft's lighting.`:''}
No added text or watermark.`;
}
