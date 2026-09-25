const hashText=text=>{let h=2166136261;for(const c of String(text)){h^=c.charCodeAt(0);h=Math.imul(h,16777619)}return h>>>0};
const pick=(list,n,shift=0)=>list[(n+shift)%list.length];
const termEN={
 '淡粉':'soft pink','象牙白':'ivory','赭橙':'ochre orange','松绿':'pine green','秋红':'autumn red','麦白':'wheat white','柔粉':'blush pink','暖白':'warm white','浅杏':'pale apricot','酒红':'burgundy','浅粉':'pale pink','白色':'white','淡紫':'pale lavender','紫色':'purple','浅蓝':'pale blue','自然红':'natural red','红色':'red','嫩绿':'fresh green','银绿':'silver green','自然绿':'natural green','深绿':'deep green','夏绿':'summer green','哑黑':'matte black','墨黑':'ink black','炭黑':'charcoal','浅青釉':'pale celadon','深蓝釉':'deep indigo glaze','暖沙色':'warm sand','铁锈深釉':'dark rust glaze','浅灰釉':'light gray glaze','深绿釉':'deep green glaze','窑变釉':'variegated glaze','褐釉':'brown glaze',
 '原版花枝':'original flowering branch','原版正面':'original front view','原版虬枝':'original gnarled branch','原版舒展':'original spreading branch','自然穗形':'natural plume','正面':'front view','侧面':'side view','斜侧面':'three-quarter view','直立枝':'upright branch','横逸枝':'lateral branch','自然弧枝':'natural arched branch','垂弧枝':'drooping arch','斜生枝':'oblique branch','弧形叶':'arched frond','疏枝':'sparse branch','自然斜枝':'natural oblique branch','舒展枝':'spreading branch',
 '静寂':'Stillness','侘寂':'Wabi-sabi','春意':'Spring','野趣':'Wild spirit'
};
const en=value=>termEN[value]||value;

export function buildPrompt(s,assetById,scenes){
 const vessel=assetById[s.vessel],counts=new Map();
 for(const i of s.items){const a=assetById[i.type],key=`${a.en||a.name} (${a.colorEn||en(a.color)})`;counts.set(key,(counts.get(key)||0)+1)}
 const inventory=[...counts].map(([name,n])=>`${n} × ${name}`).join('; ');
 const refinement={natural:'Make a gentle florist refinement.',creative:'Gently refine the stem rhythm and depth within the same design.',faithful:'Make only the small corrections needed for physical realism.'}[s.generation]||'Make a gentle florist refinement.';
 const support={neck:'Let the neck support the stems.',kenzan:'Seat the stems in a discreet kenzan inside the basin.','integrated-holes':'Insert stems through the actual openings.','chicken-wire':'Support the stems with fitted floral wire inside the vessel.','hidden-grid':'Use a concealed grid below the rim.',crossbar:'Use a concealed crossbar below the rim.',foam:'Conceal the support inside the vessel.'}[vessel.fixture?.kind]||'Use discreet support suited to the vessel.';
 const n=hashText(`${s.id||''}-${s.generationVariation||0}`);
 const detail=pick(['uneven petal overlap and subtle pigment drift','relaxed petal folds and gently varied opening stages','slightly eccentric petals and soft color variation','small differences in petal curl and maturity'],n);
 return `Realize this collage sketch as a professional photograph of a real floral arrangement. Keep its recognizable composition, selected flowers and count, vessel and main negative spaces. ${refinement}

Treat the draft as design intent, not a tracing. Allow small shifts in flower facing, stem curves and depth for natural growth, gravity and continuous stems entering the vessel. ${support}

Keep the overall lighting and atmosphere; let local shadows and reflections follow the real forms. Give each bloom species-appropriate individuality through ${detail}, without exaggerated damage.

Materials: ${inventory||'as shown in the draft'}. Vessel: ${vessel.en||vessel.name}.
Setting: ${scenes[s.scene][3]||scenes[s.scene][2]}. Mood: ${en(s.mood)}.${s.intention?`\nCreative note: ${s.intention}`:''}
No added text or watermark.`;
}
