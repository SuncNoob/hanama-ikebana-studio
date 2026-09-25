const hashText=text=>{let h=2166136261;for(const c of String(text)){h^=c.charCodeAt(0);h=Math.imul(h,16777619)}return h>>>0};
const pick=(list,n,shift=0)=>list[(n+shift)%list.length];
const zone=x=>x<38?'left side':x>62?'right side':'near the visual center';
const lean=angle=>angle<-8?`leaning ${Math.abs(Math.round(angle))}° to the left`:angle>8?`leaning ${Math.round(angle)}° to the right`:'rising almost upright';

function instancePlan(s,assetById){
 const curves=['a long relaxed arc','a gentle S-curve','a subtle counter-curve near the tip','an irregular natural bend through the lower third','a straighter lower stem with a softly wandering tip'];
 const faces=['turn the main flower face three-quarter left','turn the main flower face three-quarter right','let the main flower face meet the light','let the main flower face turn slightly away from camera','vary the flower face between forward and profile'];
 const stages=['slightly more open and mature','a little younger with restrained opening','naturally imperfect with one asymmetrical edge','fresh but not uniform or florist-perfect'];
 const foliage=['keep the foliage airy and sparse','cluster a few leaves near one node and leave the next node open','use uneven leaf spacing with small size variation','let one leaf turn away and another catch the light'];
 return s.items.map((item,index)=>{
  const a=assetById[item.type],n=hashText(item.id||`${item.type}-${index}`),depth=index===0?'rear plane':index===s.items.length-1?'front plane':'middle plane';
  const scale=Math.round(item.h/(a.height||48)*100),length=Math.round((item.length||1)*100);
  const detail=a.group==='bloom'?`${pick(faces,n,1)}; ${pick(stages,n,3)}`:`${pick(foliage,n,2)}; preserve believable branch joints`;
  const edits=[item.flip?'mirrored gesture':'original lateral gesture',item.trim?`${Math.round(item.trim)}% shortened at the base`:null,item.cuts?.length?'retain the deliberately pruned open areas':null].filter(Boolean).join(', ');
  return `${index+1}. ${a.name} / ${a.en}, natural ${a.color}, ${a.pose}; ${depth}, ${zone(item.x)}, ${lean(item.angle)}, about ${scale}% relative presence and ${length}% stem extension. Re-grow it with ${pick(curves,n)}; ${detail}. ${edits}.`;
 }).join('\n');
}

export function buildPrompt(s,assetById,scenes){
 const mode=s.generation||'natural';
 const counts=new Map();for(const i of s.items){const a=assetById[i.type],key=`${a.name} (${a.en}), natural ${a.color}`;counts.set(key,(counts.get(key)||0)+1)}
 const palette=[...counts].map(([name,count])=>`- ${name}; ${count} selected stem${count>1?'s':''}`).join('\n');
 const freedom={
  natural:'Reconstruct the arrangement as a senior ikebana artist would build it with fresh living material. Preserve the chosen species, broad gesture, scale hierarchy, asymmetry and important negative space. You may adjust every local curve, internode, flower face, overlap and depth relationship until the result feels physically arranged rather than assembled from cutouts.',
  creative:'Treat the references as art direction rather than a layout to follow. Preserve the botanical families, dominant palette, vessel character and emotional intention, then confidently redesign curves, spacing, heights, flower faces and depth. Keep the restrained ikebana character and negative space; avoid the density and symmetry of a commercial bouquet.',
  faithful:'Keep the principal directions, scale hierarchy, insertion area and large zones of negative space recognizably close to the composition guide. Rebuild all living details from scratch: correct rigid joints, collisions, cloned flower faces, pasted edges and implausible proportions. Faithful means faithful to the design logic, never to the pixels.'
 };
 const repeated=[...counts.values()].some(n=>n>1);
 return `Create one original, professional photographic ikebana still life from the two attached references.

HOW TO READ THE REFERENCES
- draft.png communicates the chosen plant species, natural color families, pruning decisions, vessel material and the artist's rough spatial intention.
- composition-guide.png is an abstract gesture map. Use it for the main directions, front-to-back order and negative space only.
- Neither image is a photograph to imitate. Do not trace, inpaint, collage, preserve cutout edges or copy any specimen silhouette pixel for pixel.

INTENTION
Title: ${s.title||'Untitled'}
Mood: ${s.mood}
Artist's note: ${s.intention||'Quiet, asymmetrical and alive.'}

CREATIVE FREEDOM
${freedom[mode]}

BOTANICAL PALETTE
${palette||'- Use the botanical selection visible in draft.png.'}
The quantities describe selected stems, not a rigid count of visible blossoms or leaves. Preserve each species and color family. Buds, leaves and secondary growth may vary when botanically plausible. Keep intentionally pruned openings open.

INDIVIDUAL STEM PLAN — EVERY STEM MUST BECOME A DIFFERENT LIVING SPECIMEN
${instancePlan(s,assetById)||'Build a small, asymmetrical selection of individually grown stems.'}

${repeated?'CRITICAL REPEATED-MATERIAL RULE\nWhen the same species appears more than once, do not duplicate, mirror or rotate one reconstructed stem. Give every instance a different main-stem curvature, internode spacing, flower-head orientation, bloom openness, leaf size, leaf rotation, small imperfections and depth plane. They must look cut from different parts of the same plant on the same morning.\n\n':''}VESSEL & PHYSICAL CONSTRUCTION
Use ${assetById[s.vessel].name} (${assetById[s.vessel].en}) with its recognizable material, tone and broad silhouette. Setting: ${scenes[s.scene][2]}. All stems must enter through one believable kenzan or vessel-mouth area, overlap convincingly at the insertion point and obey gravity. Build real front, middle and rear planes. No floating stems, impossible intersections or branches emerging through ceramic walls.

ONE COHERENT LIGHTING SETUP
Photograph beside one large diffused window placed upper-left and slightly in front of the arrangement. Use a weak neutral bounce from camera-right at roughly one-quarter of the key-light intensity; no second key light. The vessel casts one soft-edged shadow toward the lower-right, darkest exactly where its base touches the table and softer with distance. Petals transmit a little light at thin edges; leaves show restrained subsurface glow and varied matte or waxy response. Shadows from stems are delicate and appear only where a nearby wall or leaf could physically receive them. Keep every highlight and cast shadow consistent with this single light direction.

CAMERA & MATERIAL REALISM
Calm square editorial still life, eye-level to slightly low camera, natural 65–85 mm perspective, about f/8. Keep the vessel mouth and principal flower faces crisp; let rear twigs fall only slightly softer. Neutral daylight white balance, accurate botanical pigmentation, restrained saturation, subtle hue and value variation within each petal, fine veins, occasional curled or imperfect edges, real ceramic texture and a gentle background falloff. Preserve detail in both highlights and shadows without HDR gloss.

AVOID
Identical repeated flowers; cloned leaf clusters; traced silhouettes; rigid straight stems; evenly spaced nodes; all blooms facing camera; flat front-facing layers; pasted or haloed edges; drop shadows around every cutout; multiple shadow directions; plastic shine; oversaturation; floating stems; illustration; 3D-render appearance; ornamental clutter; text; borders; watermarks.

Priority: living botanical individuality and physically coherent light > the artist's composition and mood > literal similarity to either reference.`;
}
