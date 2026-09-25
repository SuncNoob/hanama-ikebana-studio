const hashText=text=>{let h=2166136261;for(const c of String(text)){h^=c.charCodeAt(0);h=Math.imul(h,16777619)}return h>>>0};
const pick=(list,n,shift=0)=>list[(n+shift)%list.length];
const zone=x=>x<38?'left side':x>62?'right side':'near the visual center';
const lean=angle=>angle<-8?`leaning ${Math.abs(Math.round(angle))}° to the left`:angle>8?`leaning ${Math.round(angle)}° to the right`:'rising almost upright';
const floweringFamilies=new Set(['calla','sakura','chrysanthemum','lisianthus','iris','camellia','quince']);
const termEN={
 '淡粉':'soft pink','象牙白':'ivory','赭橙':'ochre orange','松绿':'pine green','秋红':'autumn red','麦白':'wheat white','柔粉':'blush pink','暖白':'warm white','浅杏':'pale apricot','酒红':'burgundy','浅粉':'pale pink','白色':'white','淡紫':'pale lavender','紫色':'purple','浅蓝':'pale blue','自然红':'natural red','红色':'red','嫩绿':'fresh green','银绿':'silver green','自然绿':'natural green','深绿':'deep green','夏绿':'summer green','哑黑':'matte black','墨黑':'ink black','炭黑':'charcoal','浅青釉':'pale celadon','深蓝釉':'deep indigo glaze','暖沙色':'warm sand','铁锈深釉':'dark rust glaze','浅灰釉':'light gray glaze','深绿釉':'deep green glaze','窑变釉':'variegated glaze','褐釉':'brown glaze',
 '原版花枝':'original flowering branch','原版正面':'original front view','原版虬枝':'original gnarled branch','原版舒展':'original spreading branch','自然穗形':'natural plume','正面':'front view','侧面':'side view','斜侧面':'three-quarter view','直立枝':'upright branch','横逸枝':'lateral branch','自然弧枝':'natural arched branch','垂弧枝':'drooping arch','斜生枝':'oblique branch','弧形叶':'arched frond','疏枝':'sparse branch','自然斜枝':'natural oblique branch','舒展枝':'spreading branch',
 '静寂':'Stillness','侘寂':'Wabi-sabi','春意':'Spring','野趣':'Wild spirit'
};
const en=value=>termEN[value]||value;

function flowerFactor(item,asset,index,variation){
 const n=hashText(`${item.id||`${item.type}-${index}`}-${variation}`);
 const bias=['slightly fuller on the upper-left quadrant','slightly fuller on the upper-right quadrant','slightly fuller on the lower-left quadrant','slightly fuller on the lower-right quadrant','quietly off-axis around the corolla center'];
 const rhythm=['one narrower petal beside a broader petal','unequal petal overlap with one edge receding','a mildly irregular inner whorl','one petal curling inward while its neighbor relaxes outward','a small interruption in the otherwise natural petal rhythm'];
 const pigment=['a faintly deeper pigment near one petal base','a subtle warm-to-cool drift across adjacent petals','one softly faded outer petal','tiny natural speckling confined to one or two petals','a restrained translucent edge variation'];
 const flaw=['one minute edge nick','one lightly creased outer petal','one slightly weathered tip','one tiny insect nibble','one gently bruised color spot'];
 const stage=['freshly open','slightly younger than peak','mature but still fresh','just past peak at one outer edge','partly open with a tighter center'];
 const code=(n%46656).toString(36).toUpperCase().padStart(3,'0');
 return `Petal variation factor PV-${code}: keep every visible blossom center, facing direction and outer footprint fixed, and keep the total visible blossom count unchanged. Within each locked footprint, make the corolla ${pick(bias,n)} with ${pick(rhythm,n,2)}; add ${pick(pigment,n,4)} and ${pick(flaw,n,1)}; maturity is ${pick(stage,n,3)}. Keep these differences botanical and subtle, never decorative or diseased.`;
}

function instancePlan(s,assetById){
 const variation=Number(s.generationVariation||0);
 return s.items.map((item,index)=>{
  const a=assetById[item.type],depth=index===0?'rear plane':index===s.items.length-1?'front plane':'middle plane',scale=Math.round(item.h/(a.height||48)*100),length=Math.round((item.length||1)*100);
  const flowering=floweringFamilies.has(a.family)||a.group==='bloom';
  const surface=flowering?flowerFactor(item,a,index,variation):'Outside flower heads, preserve the branch and every visible leaf exactly: count, spacing, outline, pruning, color, markings and surface appearance. Do not invent variation on stems or leaves.';
  const edits=[item.flip?'keep the mirrored orientation shown':'keep the shown lateral orientation',item.trim?`keep the ${Math.round(item.trim)}% base shortening`:null,item.cuts?.length?'keep every deliberately pruned opening exactly where shown':null].filter(Boolean).join('; ');
  return `${index+1}. ${a.en||a.name}, natural ${en(a.color)}, ${en(a.pose)}; ${depth}, ${zone(item.x)}, ${lean(item.angle)}, ${scale}% relative presence, ${length}% stem extension. STRUCTURE LOCK: keep its base point, endpoint, angle, length, scale, curvature, overlaps and layer order exactly as shown. ${edits}. ${surface}`;
 }).join('\n');
}

export function buildPrompt(s,assetById,scenes){
 const mode=s.generation||'natural';
 const counts=new Map();for(const i of s.items){const a=assetById[i.type],key=`${a.en||a.name}, natural ${en(a.color)}`;counts.set(key,(counts.get(key)||0)+1)}
 const palette=[...counts].map(([name,count])=>`- ${name}; exactly ${count} selected stem${count>1?'s':''}`).join('\n');
 const treatment={
  natural:'Render a natural professional photograph while changing only petal-level individuality. Preserve every other material exactly and do not redesign the arrangement.',
  creative:'Use a slightly more noticeable range of petal overlap, maturity, edge wear and pigment drift, but keep every compositional and lighting coordinate locked.',
  faithful:'Use the most restrained petal-level variation. Preserve the reference almost exactly while removing only clone-like perfection inside each flower head.'
 };
 return `Produce a photorealistic rendering of this exact ikebana arrangement from the two attached references.

HOW TO READ THE REFERENCES
- draft.png is the authoritative reference for every selected material, every visible flower and leaf, the vessel, exact composition, crop, background and lighting.
- composition-guide.png is a secondary silhouette and layer-order aid. It does not authorize any new endpoint, curve, angle or proportion. If composition-guide.png differs from draft.png in any way, draft.png wins.
- Render the locked arrangement photographically without tracing cutout seams. Outside existing flower heads, preserve all visible color, markings, contours and surface character; do not invent variation.

INTENTION
Title: ${s.title||'Untitled'}
Mood: ${en(s.mood)}
Artist's note: ${s.intention||'Quiet, natural and alive.'}

RENDERING TREATMENT
${treatment[mode]}

BOTANICAL INVENTORY — COUNT IS LOCKED
${palette||'- Use every botanical element visible in draft.png.'}
Keep every selected stem, every visible blossom and every visible leaf shown in draft.png. Do not remove, hide, merge, substitute, crop away or add stems, flower heads, buds or leaves. A flower that turns partly away must still remain clearly present in the same place.

COMPOSITION LOCK — NON-NEGOTIABLE
Preserve the arrangement exactly: same number of stems and flowers; same base/insertion points; same flower-head centers; same endpoints; same positions, angles, lengths, scale hierarchy, curvature, pruning, front-to-back layer order, overlaps, vessel relationship, crop and negative spaces. Do not make the silhouette more asymmetric, more symmetric, fuller, sparser or more balanced. Do not shift visual weight or reinterpret the ikebana structure.

INDIVIDUAL MATERIAL PLAN — STRUCTURE FIXED, FLOWER SURFACES MAY VARY
${instancePlan(s,assetById)||'Keep the reference structure exactly and vary only subtle petal-level details.'}

PETAL-LEVEL NATURALISM
Repeated flowers must remain in their exact original locations and orientations. Their difference comes only from internal corolla construction: slightly unequal petal widths and overlaps, a mildly eccentric inner whorl, restrained edge curl, different but plausible opening stages, and tiny localized pigment or weather marks. Treat each PV code as a variation palette and permute its traits independently across every existing visible blossom; never stamp the same defect or pigment shift onto all blossoms. Preserve each flower head's center, facing, overall footprint and species identity. Never delete a flower to create negative space. Never deform stems, leaves or the overall silhouette in order to make the flowers feel less perfect.

VESSEL & PHYSICAL CONSTRUCTION
Use ${assetById[s.vessel].en||assetById[s.vessel].name} with the exact material, tone, size, surface appearance and placement shown. Setting: ${scenes[s.scene][3]||scenes[s.scene][2]}. Keep every insertion point, occlusion, contact edge and overlap unchanged.

LIGHTING LOCK — NON-NEGOTIABLE
Match draft.png exactly. Preserve the same key-light direction, intensity, softness, color temperature, exposure, background brightness and gradient, highlight placement, contact shadow, cast-shadow direction and shadow density. Do not relight, dramatize, brighten, darken, add rim light, move the window, change the time of day or alter the atmosphere. Petal pigment variation must read as local botanical color, never as different illumination.

CAMERA & MATERIAL REALISM
Keep the exact camera position, square crop, perspective, focal relationship and depth ordering of draft.png. Remove pasted or haloed edges while preserving every contour, overlap and non-flower surface appearance. Add fine petal veins and restrained translucency only inside the locked flower-head footprints; do not alter leaf or vessel color, markings or texture, and do not change the lighting design.

AVOID
Any compositional change; missing flowers; fewer flowers; added flowers; shifted flower centers; changed stem angles or lengths; changed branch curves; changed layer order; changed negative space; relighting; a new shadow direction; exposure change; bouquet redesign; clone-like identical corollas; mathematically even petals; perfect circular flower heads; identical pigment on every petal; excessive decay; torn flowers; disease; plastic shine; oversaturation; illustration; 3D-render appearance; text; borders; watermarks.

Priority: exact structure, complete flower count and unchanged lighting > subtle petal-level individuality > photographic surface realism.`;
}
