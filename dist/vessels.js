// Original GPT Image vessel cutouts. Coordinates are normalized to each PNG.
// `mouth` remains the legacy insertion anchor. `openings` and `fixture` add
// physical construction without changing the saved composition schema.
const ellipse=(center,radius,frontRimY,extra={})=>({shape:'ellipse',center,radius,frontRimY,...extra});
const rect=(center,radius,frontRimY,extra={})=>({shape:'rect',center,radius,frontRimY,...extra});
const fixture=(kind,visibility,name,en,prompt,extra={})=>({kind,visibility,name,en,prompt,...extra});

export const newVessels=[
  {
    id:'matte-black-long-neck',name:'哑黑高颈细瓶',shortName:'哑黑细颈瓶',en:'Matte black long-neck vase',
    color:'哑黑',colorEn:'matte black',group:'tall',style:'japanese',height:32,width:192,heightPx:516,
    mouth:[0.484375,0.027131782945736434],
    openings:[ellipse([0.484375,0.0271],[0.15,0.016],0.048)],
    fixture:fixture('neck','hidden','瓶口支撑','Concealed neck support','The narrow ceramic neck itself supports the stems below the rim; no separate support is visible.')
  },
  {
    id:'ivory-tall-cylinder',name:'象牙白高细筒',shortName:'象牙高筒',en:'Ivory tall cylinder vase',
    color:'象牙白',colorEn:'ivory white',group:'tall',style:'japanese',height:31,width:147,heightPx:486,
    mouth:[0.5034013605442177,0.043209876543209874],
    openings:[ellipse([0.5034,0.0432],[0.42,0.038],0.09)],
    fixture:fixture('hidden-grid','hidden','隐形瓶口网格','Concealed opening grid','A fitted support grid sits completely below the cylindrical rim and secures every stem; the grid must remain invisible.')
  },
  {
    id:'white-squat-round',name:'白色矮胖圆瓶',shortName:'白瓷圆瓶',en:'White squat round vase',
    color:'白色',colorEn:'chalk white',group:'low',style:'japanese',height:22,width:331,heightPx:314,
    mouth:[0.4954682779456193,0.05732484076433121],
    openings:[ellipse([0.4955,0.0573],[0.12,0.03],0.098)],
    fixture:fixture('neck','hidden','瓶口支撑','Concealed neck support','The short narrow neck holds the stems below the rim; no tape, wire, foam or pin holder is visible.')
  },
  {
    id:'ink-black-low-bowl',name:'墨黑矮圆钵',shortName:'墨黑圆钵',en:'Ink black low round bowl',
    color:'墨黑',colorEn:'ink black',group:'low',style:'japanese',height:18,width:437,heightPx:258,
    mouth:[0.4988558352402746,0.21705426356589147],
    openings:[ellipse([0.4989,0.2171],[0.405,0.16],0.39)],
    fixture:fixture('kenzan','visible','黑化黄铜剑山','Blackened-brass kenzan','A low blackened-brass kenzan is centered inside the bowl and remains discreetly visible between the exact stem insertions.',{center:[0.499,0.235],radius:[0.135,0.042],material:'blackened-brass'})
  },
  {
    id:'white-square-column',name:'白色方形直筒',shortName:'白瓷方筒',en:'White square column vase',
    color:'暖白',colorEn:'warm white',group:'tall',style:'japanese',height:28,width:180,heightPx:436,
    mouth:[0.4888888888888889,0.06422018348623854],
    openings:[rect([0.4889,0.0642],[0.32,0.045],0.125)],
    fixture:fixture('hidden-grid','hidden','隐形方形网格','Concealed square grid','A fitted square support grid sits completely below the porcelain rim and holds the stems at their shown points; it is not visible.')
  },
  {
    id:'charcoal-square-basin',name:'炭黑方形矮器',shortName:'炭黑方器',en:'Charcoal square basin',
    color:'炭黑',colorEn:'charcoal black',group:'low',style:'japanese',height:18,width:380,heightPx:276,
    mouth:[0.5026315789473684,0.2246376811594203],
    openings:[rect([0.5026,0.2246],[0.33,0.13],0.39)],
    fixture:fixture('kenzan','visible','黑化黄铜剑山','Blackened-brass kenzan','A low blackened-brass kenzan is centered inside the square basin and remains subtly visible at the exact stem bases.',{center:[0.503,0.245],radius:[0.135,0.042],material:'blackened-brass'})
  },
  {
    id:'celadon-shallow-suiban',name:'浅青釉宽浅水盘',shortName:'浅青水盘',en:'Pale celadon shallow suiban',
    color:'浅青釉',colorEn:'pale celadon glaze',group:'shallow',style:'japanese',height:16,width:456,heightPx:238,
    mouth:[0.5021929824561403,0.35294117647058826],
    openings:[ellipse([0.5022,0.3529],[0.445,0.29],0.69)],
    fixture:fixture('kenzan','visible','黄铜剑山','Brass kenzan','A low brass kenzan is centered in the shallow water and remains naturally visible through the water between the exact stem insertions.',{center:[0.502,0.39],radius:[0.125,0.038],material:'brass',water:true})
  },
  {
    id:'indigo-oval-suiban',name:'深蓝釉浅椭圆盘',shortName:'深蓝椭圆盘',en:'Deep indigo oval suiban',
    color:'深蓝釉',colorEn:'deep indigo glaze',group:'shallow',style:'japanese',height:14,width:481,heightPx:210,
    mouth:[0.501039501039501,0.3333333333333333],
    openings:[ellipse([0.501,0.3333],[0.45,0.27],0.68)],
    fixture:fixture('kenzan','visible','黑化黄铜剑山','Blackened-brass kenzan','A low blackened-brass kenzan is centered in the shallow basin and remains naturally visible through the water at the exact stem bases.',{center:[0.501,0.37],radius:[0.125,0.038],material:'blackened-brass',water:true})
  },
  {
    id:'sand-wide-pottery-bowl',name:'暖沙色宽口陶盆',shortName:'暖沙陶盆',en:'Warm sand wide pottery bowl',
    color:'暖沙色',colorEn:'warm sand',group:'low',style:'japanese',height:20,width:460,heightPx:297,
    mouth:[0.49782608695652175,0.21548821548821548],
    openings:[ellipse([0.4978,0.2155],[0.445,0.18],0.43)],
    fixture:fixture('kenzan','partial','黑化黄铜剑山','Blackened-brass kenzan','A low blackened-brass kenzan is centered below the broad rim and is only partially visible between the exact stem insertions.',{center:[0.498,0.245],radius:[0.12,0.036],material:'blackened-brass'})
  },
  {
    id:'rust-dark-cylinder',name:'铁锈深釉粗陶筒',shortName:'铁锈陶筒',en:'Rust dark-glazed stoneware cylinder',
    color:'铁锈深釉',colorEn:'dark rust glaze',group:'tall',style:'japanese',height:26,width:266,heightPx:405,
    mouth:[0.49624060150375937,0.08148148148148149],
    openings:[ellipse([0.4962,0.0815],[0.39,0.055],0.15)],
    fixture:fixture('crossbar','hidden','内藏十字撑','Concealed crossbar support','A dark fitted crossbar support sits fully below the rough stoneware rim; it secures the stems but remains invisible.')
  },
  {
    id:'gray-flat-round',name:'浅灰釉小口扁圆瓶',shortName:'浅灰扁瓶',en:'Light gray flattened round vase',
    color:'浅灰釉',colorEn:'light gray glaze',group:'low',style:'japanese',height:20,width:456,heightPx:315,
    mouth:[0.5,0.06031746031746032],
    openings:[ellipse([0.5,0.0603],[0.11,0.03],0.105)],
    fixture:fixture('neck','hidden','瓶口支撑','Concealed neck support','The small ceramic neck holds the stems below the rim; no separate support is visible.')
  },
  {
    id:'forest-green-shoulder',name:'深绿釉高肩瓶',shortName:'深绿肩瓶',en:'Deep green high-shouldered vase',
    color:'深绿釉',colorEn:'deep forest-green glaze',group:'tall',style:'japanese',height:30,width:300,heightPx:492,
    mouth:[0.5033333333333333,0.034552845528455285],
    openings:[ellipse([0.5033,0.0346],[0.13,0.023],0.07)],
    fixture:fixture('neck','hidden','瓶口支撑','Concealed neck support','The narrow glazed neck supports the stems below the rim; no separate support is visible.')
  },

  // English garden and country-house vessels.
  {
    id:'english-cream-pitcher',name:'英式奶油白陶壶',shortName:'奶油陶壶',en:'English creamware pitcher',
    color:'奶油白',colorEn:'cream white',group:'tall',style:'english',height:28,width:541,heightPx:620,
    mouth:[0.356,0.067],openings:[ellipse([0.356,0.067],[0.285,0.04],0.12,{rotation:-0.025})],
    fixture:fixture('crossbar','hidden','内藏枝条十字撑','Concealed branch crossbar','A discreet natural crossbar is wedged below the pitcher rim and physically supports every stem at its exact shown insertion point; it remains hidden.')
  },
  {
    id:'english-pewter-compote',name:'英式旧银高脚盆',shortName:'旧银高脚盆',en:'English aged pewter footed compote',
    color:'旧银色',colorEn:'aged pewter',group:'low',style:'english',height:18,width:620,heightPx:382,
    mouth:[0.5,0.125],openings:[ellipse([0.5,0.125],[0.455,0.075],0.215)],
    fixture:fixture('chicken-wire','partial','深色花艺网','Dark floral wire mesh','A low hand-shaped dark floral wire mesh spans the compote below the rim. Only restrained fragments of the mesh remain visible between the exact stem bases.',{center:[0.5,0.135],radius:[0.37,0.058],material:'dark-wire'})
  },
  {
    id:'english-stone-garden-urn',name:'英式砂岩庭院瓮',shortName:'砂岩庭院瓮',en:'English weathered stone garden urn',
    color:'暖砂岩',colorEn:'weathered warm stone',group:'low',style:'english',height:21,width:620,heightPx:454,
    mouth:[0.5,0.115],openings:[ellipse([0.5,0.115],[0.43,0.075],0.225)],
    fixture:fixture('chicken-wire','hidden','内藏花艺网','Concealed floral wire','A reusable floral wire cage fits beneath the rim and supports stems inside the vessel.')
  },

  // French classical vessels.
  {
    id:'french-medicis-urn',name:'法式象牙美第奇杯',shortName:'美第奇杯',en:'French ivory Medici urn',
    color:'石灰象牙白',colorEn:'limewashed ivory',group:'tall',style:'french',height:27,width:620,heightPx:597,
    mouth:[0.5,0.075],openings:[ellipse([0.5,0.075],[0.42,0.045],0.14)],
    fixture:fixture('chicken-wire','hidden','内藏花艺网','Concealed floral wire','A reusable floral wire cage fits beneath the rim and supports stems inside the vessel.')
  },
  {
    id:'french-charcoal-compote',name:'法式炭黑高脚浅盆',shortName:'炭黑高脚盆',en:'French charcoal footed compote',
    color:'炭黑',colorEn:'charcoal black',group:'low',style:'french',height:16,width:620,heightPx:326,
    mouth:[0.5,0.14],openings:[ellipse([0.5,0.14],[0.45,0.09],0.26)],
    fixture:fixture('kenzan','visible','黄铜剑山','Brass kenzan','A low brass kenzan is centered in the charcoal compote and remains deliberately but discreetly visible between the exact stem bases.',{center:[0.5,0.15],radius:[0.13,0.036],material:'brass'})
  },
  {
    id:'french-blue-cachepot',name:'法式雾蓝竖纹瓷盆',shortName:'雾蓝瓷盆',en:'French mist-blue fluted cachepot',
    color:'雾蓝釉',colorEn:'mist-blue glaze',group:'low',style:'french',height:20,width:620,heightPx:462,
    mouth:[0.5,0.12],openings:[ellipse([0.5,0.12],[0.445,0.07],0.215)],
    fixture:fixture('chicken-wire','hidden','内藏花艺网','Concealed floral wire','A reusable floral wire cage fits beneath the rim and supports stems inside the vessel.')
  },

  // Contemporary popular forms.
  {
    id:'modern-smoked-glass-column',name:'现代烟灰玻璃柱瓶',shortName:'烟灰玻璃柱瓶',en:'Modern smoked-glass column vase',
    color:'烟灰透明',colorEn:'smoked transparent glass',group:'tall',style:'modern',height:31,width:238,heightPx:620,
    mouth:[0.5,0.045],openings:[ellipse([0.5,0.045],[0.275,0.018],0.075)],
    fixture:fixture('neck','hidden','瓶口支撑','Concealed neck support','The narrow smoked-glass neck itself supports the stems below the lip; do not add a visible grid, tape, foam or pin holder.')
  },
  {
    id:'modern-steel-loop-vessel',name:'现代拉丝钢环形器',shortName:'拉丝钢环形器',en:'Modern brushed-steel loop vessel',
    color:'拉丝银钢',colorEn:'brushed silver steel',group:'low',style:'modern',height:28,width:620,heightPx:595,
    mouth:[0.219,0.077],
    openings:[ellipse([0.219,0.077],[0.075,0.026],0.12,{rotation:0.38,primary:true}),ellipse([0.835,0.214],[0.07,0.024],0.255,{rotation:-0.28})],
    fixture:fixture('integrated-holes','hidden','一体式双插口','Integrated twin openings','The two sculpted steel neck openings are the complete integrated support. Stems may enter only through the two shown openings, with no visible auxiliary mechanics.')
  },
  {
    id:'modern-travertine-trough',name:'现代洞石长槽器',shortName:'洞石长槽器',en:'Modern travertine trough vessel',
    color:'浅洞石色',colorEn:'pale travertine',group:'shallow',style:'modern',height:12,width:620,heightPx:223,
    mouth:[0.5,0.198],openings:[rect([0.5,0.198],[0.415,0.078],0.315)],
    fixture:fixture('kenzan','partial','三枚黑化黄铜剑山','Three blackened-brass kenzan','Three low blackened-brass kenzan are aligned inside the long trough. They remain only partially visible and hold the exact existing stem insertion points without changing the composition.',{centers:[[0.29,0.205],[0.5,0.205],[0.71,0.205]],radius:[0.07,0.024],material:'blackened-brass'})
  }
];
