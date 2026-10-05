// SPDX-FileCopyrightText: 2026 Marko Sun
// SPDX-License-Identifier: LicenseRef-Hanama-Proprietary
/** Botanical profile for every family in the library: what a stem does in an arrangement, how it grows, and how it is sold.
 Typical florist-market figures, not limits; nothing here clamps a saved draft.
 role      line | focal | secondary | filler | foliage (an array when a family does two jobs; the first is its main job)
 habit     woody (trees and shrubs whose cut stems are wood) | bulb | grass | vine | herb
 stemMm    [top, base] drawn-stem diameter in mm, or null to keep the drawn-stem formula
 stemMaxCm soft cap for the drawn stem below a flower-head photograph (scale.js MAX_STEM_CM stays the hard limit)
 seasons   garden seasons: every season a study uses the family in, plus its main garden season where the studies miss it
 unit      optional prompt noun for one piece (branch, plume, frond, 'stem of', leaf); omitted where the name already says it
 aliases   optional extra search words (zh / en / ja), unique across families */

export const ROLES=['line','focal','secondary','filler','foliage'];
export const HABITS=['woody','bulb','grass','vine','herb'];
export const SEASONS=['spring','summer','autumn','winter'];
/** Same value as scale.js MAX_STEM_CM: every family not listed with a shorter natural stem may grow this much drawn stem. */
export const DEFAULT_STEM_MAX_CM=60;
const ALL=SEASONS;

export const profiles={
 // ── Line: woody branches and tall spikes that set height and direction ──
 pine:{role:'line',habit:'woody',stemMm:null,stemMaxCm:60,seasons:['winter'],aliases:['松','まつ','matsu']},
 maple:{role:'line',habit:'woody',stemMm:null,stemMaxCm:60,seasons:['summer','autumn'],unit:'branch',aliases:['红叶','紅葉','もみじ','momiji']},
 quince:{role:'line',habit:'woody',stemMm:null,stemMaxCm:60,seasons:['spring','winter'],unit:'branch',aliases:['chaenomeles']},
 willow:{role:'line',habit:'woody',stemMm:[6,8],stemMaxCm:60,seasons:['spring'],unit:'branch',aliases:['柳','やなぎ']},
 sakura:{role:'line',habit:'woody',stemMm:null,stemMaxCm:60,seasons:['spring'],unit:'branch',aliases:['樱','桜','さくら','sakura','cherry']},
 magnolia:{role:'line',habit:'woody',stemMm:null,stemMaxCm:60,seasons:['spring'],aliases:['玉兰','木蓮']},
 'pussy-willow':{role:'line',habit:'woody',stemMm:null,stemMaxCm:60,seasons:['spring','winter'],aliases:['猫柳']},
 delphinium:{role:'line',habit:'herb',stemMm:[6,8],stemMaxCm:60,seasons:['summer'],aliases:['大飞燕草']},
 foxglove:{role:'line',habit:'herb',stemMm:[7,9],stemMaxCm:60,seasons:['spring','summer'],aliases:['digitalis']},
 snapdragon:{role:'line',habit:'herb',stemMm:null,stemMaxCm:60,seasons:['spring','summer'],aliases:['antirrhinum']},
 amaranthus:{role:'line',habit:'herb',stemMm:null,stemMaxCm:60,seasons:['autumn'],aliases:['love-lies-bleeding','千穗谷']},
 crocosmia:{role:'line',habit:'herb',stemMm:null,stemMaxCm:60,seasons:['summer','autumn'],aliases:['montbretia']},
 lavender:{role:'line',habit:'herb',stemMm:[2,2.5],stemMaxCm:60,seasons:['summer'],aliases:['lavandula']},
 pampas:{role:'line',habit:'grass',stemMm:[8,9],stemMaxCm:60,seasons:['autumn'],unit:'plume',aliases:['芦苇','すすき']},
 // ── Line and focal: a flower that is also a line ──
 lily:{role:['line','focal'],habit:'bulb',stemMm:[8,9],stemMaxCm:60,seasons:['summer'],aliases:['百合花','lilium']},
 iris:{role:['line','focal'],habit:'bulb',stemMm:null,stemMaxCm:60,seasons:['summer'],aliases:['菖蒲','花菖蒲','あやめ']},
 calla:{role:['line','focal'],habit:'herb',stemMm:null,stemMaxCm:60,seasons:['spring','summer','winter'],aliases:['海芋','zantedeschia']},
 agapanthus:{role:['line','focal'],habit:'herb',stemMm:null,stemMaxCm:60,seasons:['summer'],aliases:['紫君子兰']},
 // ── Focal: the flowers the eye lands on ──
 peony:{role:'focal',habit:'herb',stemMm:[6,7],stemMaxCm:60,seasons:['spring','summer'],aliases:['paeonia']},
 rose:{role:'focal',habit:'woody',stemMm:[5,6],stemMaxCm:60,seasons:['spring','summer','autumn','winter'],aliases:['玫瑰花','月季','薔薇','ばら']},
 dahlia:{role:'focal',habit:'herb',stemMm:[7,9],stemMaxCm:60,seasons:['summer','autumn'],aliases:['天竺牡丹']},
 hydrangea:{role:'focal',habit:'woody',stemMm:[7,8],stemMaxCm:60,seasons:['summer'],aliases:['紫阳花','紫陽花','八仙花','あじさい']},
 chrysanthemum:{role:'focal',habit:'herb',stemMm:[5,6],stemMaxCm:60,seasons:['autumn','winter'],aliases:['秋菊','菊','きく','mum']},
 sunflower:{role:'focal',habit:'herb',stemMm:[10,12],stemMaxCm:60,seasons:['summer'],aliases:['葵花','helianthus']},
 camellia:{role:'focal',habit:'woody',stemMm:null,stemMaxCm:60,seasons:['spring','winter'],aliases:['茶花','山茶花','つばき']},
 tulip:{role:'focal',habit:'bulb',stemMm:[6,7],stemMaxCm:60,seasons:['spring'],aliases:['tulipa']},
 ranunculus:{role:'focal',habit:'herb',stemMm:null,stemMaxCm:45,seasons:['spring','winter'],aliases:['洋牡丹','buttercup']},
 anemone:{role:'focal',habit:'herb',stemMm:[4,4.5],stemMaxCm:40,seasons:['spring','winter'],aliases:['windflower']},
 hellebore:{role:'focal',habit:'herb',stemMm:null,stemMaxCm:40,seasons:['spring','winter'],aliases:['圣诞玫瑰','christmas rose','helleborus']},
 poppy:{role:'focal',habit:'herb',stemMm:null,stemMaxCm:45,seasons:['spring','summer'],aliases:['虞美人','ポピー']},
 lisianthus:{role:'focal',habit:'herb',stemMm:null,stemMaxCm:60,seasons:['summer','winter'],aliases:['eustoma','トルコキキョウ']},
 orchid:{role:'focal',habit:'herb',stemMm:null,stemMaxCm:60,seasons:['winter'],aliases:['phalaenopsis','胡蝶蘭','洋兰']},
 celosia:{role:'focal',habit:'herb',stemMm:[9,10],stemMaxCm:60,seasons:['summer','autumn'],aliases:['cockscomb']},
 allium:{role:'focal',habit:'bulb',stemMm:null,stemMaxCm:60,seasons:['spring','summer'],aliases:['花葱']},
 zinnia:{role:'focal',habit:'herb',stemMm:[7,8],stemMaxCm:60,seasons:['summer','autumn'],aliases:['百日草']},
 pincushion:{role:'focal',habit:'woody',stemMm:null,stemMaxCm:60,seasons:['autumn'],aliases:['leucospermum','针垫']},
 // ── Secondary: supporting flowers between the line and the focal flowers ──
 freesia:{role:'secondary',habit:'herb',stemMm:null,stemMaxCm:40,seasons:['spring'],aliases:['香雪兰']},
 fritillary:{role:'secondary',habit:'bulb',stemMm:null,stemMaxCm:35,seasons:['spring'],aliases:['fritillaria']},
 narcissus:{role:'secondary',habit:'bulb',stemMm:[7,8],stemMaxCm:35,seasons:['spring','winter'],aliases:['水仙花','daffodil']},
 lilac:{role:'secondary',habit:'woody',stemMm:null,stemMaxCm:60,seasons:['spring'],aliases:['紫丁香','syringa']},
 stock:{role:'secondary',habit:'herb',stemMm:null,stemMaxCm:60,seasons:['spring','summer'],aliases:['matthiola']},
 alstroemeria:{role:'secondary',habit:'herb',stemMm:null,stemMaxCm:60,seasons:['spring','summer'],aliases:['百合水仙']},
 clematis:{role:'secondary',habit:'vine',stemMm:null,stemMaxCm:60,seasons:['spring','summer'],aliases:['テッセン']},
 'sweet-william':{role:'secondary',habit:'herb',stemMm:null,stemMaxCm:60,seasons:['spring','summer'],aliases:['美国石竹','dianthus']},
 'sweet-pea':{role:'secondary',habit:'vine',stemMm:null,stemMaxCm:45,seasons:['spring','summer'],aliases:['lathyrus']},
 nigella:{role:'secondary',habit:'herb',stemMm:null,stemMaxCm:45,seasons:['summer'],aliases:['love-in-a-mist']},
 scabious:{role:'secondary',habit:'herb',stemMm:null,stemMaxCm:55,seasons:['summer','autumn'],aliases:['scabiosa','松虫草']},
 cosmos:{role:'secondary',habit:'herb',stemMm:[2,2],stemMaxCm:60,seasons:['autumn'],aliases:['秋英','格桑花']},
 aster:{role:'secondary',habit:'herb',stemMm:null,stemMaxCm:60,seasons:['autumn'],aliases:['翠菊']},
 phlox:{role:'secondary',habit:'herb',stemMm:null,stemMaxCm:60,seasons:['summer'],aliases:['宿根福禄考']},
 strawflower:{role:'secondary',habit:'herb',stemMm:null,stemMaxCm:60,seasons:['summer','autumn'],aliases:['麦秆菊','helichrysum']},
 astrantia:{role:'secondary',habit:'herb',stemMm:null,stemMaxCm:60,seasons:['spring','summer'],aliases:['masterwort']},
 cornflower:{role:'secondary',habit:'herb',stemMm:null,stemMaxCm:45,seasons:['spring','summer'],aliases:['centaurea','蓝芙蓉']},
 'sea-holly':{role:'secondary',habit:'herb',stemMm:null,stemMaxCm:60,seasons:['summer','autumn','winter'],aliases:['eryngium']},
 viburnum:{role:'secondary',habit:'woody',stemMm:null,stemMaxCm:60,seasons:['spring','summer'],aliases:['绣球荚蒾','snowball']},
 muscari:{role:'secondary',habit:'bulb',stemMm:[4,5],stemMaxCm:22,seasons:['spring'],aliases:['grape hyacinth']},
 'lily-of-the-valley':{role:'secondary',habit:'bulb',stemMm:null,stemMaxCm:20,seasons:['spring'],aliases:['君影草','muguet']},
 // ── Filler: small flowers, seed heads and berries that soften and fill ──
 gypsophila:{role:'filler',habit:'herb',stemMm:[2,2.5],stemMaxCm:60,seasons:['spring','summer'],aliases:['满天星',"baby's breath",'baby’s breath','かすみ草']},
 alchemilla:{role:'filler',habit:'herb',stemMm:null,stemMaxCm:60,seasons:['spring','summer'],aliases:["lady's mantle"]},
 ammi:{role:'filler',habit:'herb',stemMm:null,stemMaxCm:60,seasons:['summer','winter'],aliases:['蕾丝花',"queen anne's lace"]},
 yarrow:{role:'filler',habit:'herb',stemMm:null,stemMaxCm:60,seasons:['summer'],aliases:['achillea','蓍草']},
 briza:{role:'filler',habit:'grass',stemMm:[1.2,1.6],stemMaxCm:45,seasons:['spring','summer','autumn'],aliases:['凌风草']},
 hypericum:{role:'filler',habit:'woody',stemMm:null,stemMaxCm:60,seasons:['summer','autumn','winter'],aliases:["st john's wort"]},
 sedum:{role:'filler',habit:'herb',stemMm:null,stemMaxCm:60,seasons:['autumn'],aliases:['八宝景天']},
 snowberry:{role:'filler',habit:'woody',stemMm:[3,4],stemMaxCm:60,seasons:['autumn','winter'],aliases:['symphoricarpos']},
 statice:{role:'filler',habit:'herb',stemMm:[8,8],stemMaxCm:60,seasons:['summer','autumn'],aliases:['勿忘我','limonium']},
 jasmine:{role:'filler',habit:'vine',stemMm:[1.5,2],stemMaxCm:60,seasons:['spring','summer'],aliases:['茉莉花','jasminum']},
 // ── Foliage: leaves that frame the flowers and screen the mouth ──
 eucalyptus:{role:'foliage',habit:'woody',stemMm:null,stemMaxCm:60,seasons:ALL,unit:'branch',aliases:['尤加利','ユーカリ','桉树','eucalypt']},
 fern:{role:'foliage',habit:'herb',stemMm:null,stemMaxCm:60,seasons:ALL,unit:'frond',aliases:['羊齿']},
 'alpine-fern':{role:'foliage',habit:'herb',stemMm:null,stemMaxCm:60,seasons:ALL,unit:'frond'},
 'lemon-eucalyptus':{role:'foliage',habit:'woody',stemMm:null,stemMaxCm:60,seasons:ALL,unit:'stem of'},
 'snow-willow':{role:'foliage',habit:'woody',stemMm:null,stemMaxCm:60,seasons:ALL,unit:'stem of',aliases:['雪柳','spiraea']},
 'silver-ragwort':{role:'foliage',habit:'herb',stemMm:null,stemMaxCm:60,seasons:ALL,unit:'stem of',aliases:['dusty miller']},
 'gardenia-leaf':{role:'foliage',habit:'woody',stemMm:null,stemMaxCm:60,seasons:ALL,unit:'stem of',aliases:['栀子']},
 'bird-nest-fern':{role:'foliage',habit:'herb',stemMm:null,stemMaxCm:60,seasons:ALL,unit:'frond',aliases:['巢蕨']},
 'fatsia-leaf':{role:'foliage',habit:'herb',stemMm:null,stemMaxCm:60,seasons:ALL,unit:'leaf'},
 'monstera-leaf':{role:'foliage',habit:'herb',stemMm:null,stemMaxCm:60,seasons:ALL,unit:'leaf'},
 pieris:{role:'foliage',habit:'woody',stemMm:null,stemMaxCm:60,seasons:['spring'],aliases:['馬酔木','andromeda']}
};
/** A pose whose job differs from its family's: the photo-sakura close-up is a blossom cluster, not a branch. */
export const variantRoles={'photo-sakura':'secondary'};
/** Search words for a whole role (A15 search). */
export const roleAliases={foliage:['greenery','greens','绿叶','葉物','グリーン']};

/** [zh, en, ja] */
export const roleLabels={line:['线条','Line','線'],focal:['主花','Focal','主役'],secondary:['配花','Supporting','添え'],filler:['小花','Filler','小花'],foliage:['叶材','Foliage','葉もの']};
/** One sentence per role, [zh, en, ja]; the fallback where floristry.js botanicalNotes has no note for a family. */
export const roleTips={
 line:['先用它定出高度与方向，其余花材顺着它的线条安排。','Use it to set the height and direction; let the other stems follow its line.','まず高さと流れを決める花材です。ほかの花はその線に沿わせます。'],
 focal:['作品的视觉重心：放得略低一些，周围留一点空隙。','The visual centre of the design: set it a little low and leave space around it.','作品の見どころです。やや低めに置き、まわりに少し余白を残します。'],
 secondary:['连接主花与线条，高低错落，不抢主花的位置。','It links the focal flowers and the line; vary its heights without crowding the focal flower.','主役と線をつなぐ花です。高さに変化をつけ、主役の邪魔をしないように。'],
 filler:['细碎小花填补空隙、柔化轮廓，少量更显轻盈。','Small flowers that fill gaps and soften the outline; a little keeps it light.','小さな花で隙間を埋め、輪郭をやわらげます。少なめにすると軽やかです。'],
 foliage:['用叶色与叶形衬托花朵，也能遮住瓶口。','Leaves frame the flowers with colour and shape, and can screen the vessel mouth.','葉の色と形で花を引き立て、器の口元も整えます。']
};
/** [zh, en, ja]; `all` labels a family that is in season all year. */
export const seasonLabels={spring:['春','Spring','春'],summer:['夏','Summer','夏'],autumn:['秋','Autumn','秋'],winter:['冬','Winter','冬'],all:['四季','All year','通年']};

const localeIndex=lang=>lang==='zh'?0:lang==='en'?1:2;
const asList=role=>Array.isArray(role)?role:role?[role]:[];
export const profileOf=a=>(a&&Object.hasOwn(profiles,a.family)?profiles[a.family]:null);
/** Every job the asset does, main job first. Unknown future families fall back to a guess from the catalogue group. */
export function rolesOf(a){
 const own=asList(a?.role);if(own.length)return own;
 if(a&&Object.hasOwn(variantRoles,a.id))return asList(variantRoles[a.id]);
 const listed=asList(profileOf(a)?.role);if(listed.length)return listed;
 return [a?.group==='foliage'?'foliage':a?.group==='branch'?'line':a?.bundle?'secondary':'focal'];
}
export const roleOf=a=>rolesOf(a)[0];
export const hasRole=(a,role)=>rolesOf(a).includes(role);
export const roleLabel=(role,lang)=>roleLabels[role]?.[localeIndex(lang)]||'';
export const roleTip=(role,lang)=>roleTips[role]?.[localeIndex(lang)]||'';
export const seasonLabel=(season,lang)=>seasonLabels[season]?.[localeIndex(lang)]||'';
/** Soft cap (cm) on the drawn stem below a flower-head photograph. */
export const stemMaxCm=a=>Number.isFinite(a?.stemMaxCm)?a.stemMaxCm:profileOf(a)?.stemMaxCm??DEFAULT_STEM_MAX_CM;
export const stemMmOf=a=>profileOf(a)?.stemMm||null;
export const habitOf=a=>profileOf(a)?.habit||null;
export const seasonsOf=a=>profileOf(a)?.seasons||[];
export const inSeason=(a,season)=>seasonsOf(a).includes(season);
/** English noun for `count` pieces of a unit: branch → branches, leaf → leaves, 'stem of' → 'stems of'. */
export function unitNoun(unit,count=1){
 if(!unit)return '';
 if(count===1)return unit;
 return unit==='leaf'?'leaves':unit==='branch'?'branches':unit==='stem of'?'stems of':`${unit}s`;
}
/** NFKC + lowercase, the form aliases are compared in. */
export const searchForm=text=>String(text||'').normalize('NFKC').toLowerCase().trim();
/** alias → family (exact, in searchForm). */
export const aliasIndex=new Map(Object.entries(profiles).flatMap(([family,p])=>(p.aliases||[]).map(alias=>[searchForm(alias),family])));
