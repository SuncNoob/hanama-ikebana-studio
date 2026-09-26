// Original editorial interpretations; source notes are in docs/flower-book-study.md.
export const botanicalNotes={
 anemone:['主花','Focal flower','单一种类也很出彩，花面周围留一点空隙。','A single variety can shine; leave space around its flower faces.'],
 hellebore:['低垂花面','Nodding flower','让花面微微低垂，用低器承接柔软枝势。','Let the flower nod gently over a low vessel.'],
 ranunculus:['层叠主花','Layered flower','花头偏重，放低一些，让器沿或枝叶承接。','Keep the heavy head lower, supported by the rim or foliage.'],
 tulip:['流动主花','Flowing flower','顺着弯向光的枝势，给舒展留出空间。','Follow the curve toward the light and leave room to unfold.'],
 peony:['丰盈主花','Generous flower','用低宽器承接花头，细叶能衬出松软层次。','A low wide vessel holds the full head; fine foliage softens the outline.'],
 calla:['线条','Line','顺着弧线，让花面稍稍转开。','Follow the curve; turn the flower face slightly away.'],
 sakura:['花枝','Flowering branch','让木质线条露出来，配一只稳重的陶壶。','Reveal the woody line; pair with a substantial ceramic pitcher.'],
 chrysanthemum:['主花','Focal flower','大花头落低一些，用细叶衬出轻重。','Place large heads lower, with fine foliage for balance.'],
 lisianthus:['柔软花面','Soft flowers','让花面朝向有变化，柔软层次自然展开。','Vary the facing so soft layers can unfold.'],
 iris:['线条与花面','Line & flower','错落高低，留出枝间空隙。','Vary the heights and leave space between stems.'],
 camellia:['主花','Focal flower','让一朵成为重心，深绿叶衬出花色。','Let one bloom anchor the design against deep green leaves.'],
 quince:['花枝','Flowering branch','保留枝条转折，花器选简净的轮廓。','Keep the branching angles; choose a simple vessel outline.'],
 pine:['骨架','Framework','顺着枝势定方向，不急着填满。','Follow the branch to establish direction; leave room.'],
 maple:['色叶','Colored foliage','用叶色呼应一朵花，让枝梢向外舒展。','Echo a flower with leaf color; let the tip reach outward.'],
 willow:['流动线条','Flowing line','高脚器能给垂弧留出空间。','A footed vessel leaves room for the arch to fall.'],
 eucalyptus:['陪衬','Foliage','银绿与暖色花朵相衬，疏密不必均匀。','Silver green offsets warm flowers; vary the spacing.'],
 fern:['弧形叶','Arching foliage','沿叶片原有的弧度，轻轻托住主花。','Follow the frond’s curve to cradle the focal flower.'],
 pampas:['轻盈收尾','Airy accent','留一束轻线条，别遮住主花。','Let a light plume finish the outline without covering the focal flower.']
};

export function vesselNote(a,lang='zh'){
 if(lang==='ja'){
  const notes={
   'english-cream-pitcher':'クリーム色の陶器 · 広がる枝','english-pewter-compote':'古い錫色 · 垂れる枝','english-stone-garden-urn':'砂岩 · 豊かな花','french-medicis-urn':'象牙色の釉薬 · 柔らかな花','french-charcoal-compote':'炭黒 · 明るい花色','french-blue-cachepot':'霧青の磁器 · 暖色の花','modern-smoked-glass-column':'煙色ガラス · 軽やかな線','modern-steel-loop-vessel':'磨いた鋼 · 余白と曲線','modern-travertine-trough':'石の質感 · 横へ広がる線'
  };
  return notes[a.id]||(a.group==='tall'?'細い口 · 上へ伸びる線':a.group==='shallow'?'浅い器 · 水面と線':'低い器 · 花を支える形');
 }
 const notes={
  'english-cream-pitcher':['奶油陶 · 舒展花枝','Creamware · arching branches'],
  'english-pewter-compote':['旧银 · 托起垂枝','Pewter · falling stems'],
  'english-stone-garden-urn':['砂岩 · 饱满主花','Stone · generous flowers'],
  'french-medicis-urn':['象牙釉 · 柔软花面','Ivory glaze · soft flowers'],
  'french-charcoal-compote':['炭黑 · 映衬明亮花色','Charcoal · luminous color'],
  'french-blue-cachepot':['雾蓝瓷 · 冷暖相衬','Mist blue · warm contrast'],
  'modern-smoked-glass-column':['烟灰玻璃 · 轻透线条','Smoked glass · light lines'],
  'modern-steel-loop-vessel':['拉丝钢 · 留白与弧线','Brushed steel · open curves'],
  'modern-travertine-trough':['洞石 · 横向展开','Travertine · wide gestures']
 };
 const fallback=a.group==='tall'?['高窄口 · 向上生长','Tall & narrow · rising lines']:a.group==='shallow'?['宽浅口 · 线条与水面','Wide & shallow · line & water']:['低重心 · 承接花面','Low & grounded · focal flowers'];
 return (notes[a.id]||fallback)[lang==='en'?1:0];
}

export const studies=[
 {id:'cherry',school:'ikenobo',title:['一枝成景','A Branch, a Landscape','一枝で景色をつくる'],caption:['樱枝 × 奶油陶壶','Cherry × creamware','桜の枝 × クリーム色の陶器'],note:['以一枝的弧线定方向。柔粉呼应奶油陶，空处也留在作品里。','Let one arch set the direction. Blush meets creamware, with room around the branch.','一枝の弧で方向をつくります。淡いピンクと陶器の色を合わせ、余白も残します。'],vessel:'english-cream-pitcher',scene:'paper',mood:'春意',items:[{type:'sakura-pink-arch',h:54,angle:17,length:1.12}]},
 {id:'iris',school:'ohara',title:['线条与水面','Lines above Water','水面に浮かぶ線'],caption:['鸢尾 × 浅青水盘','Iris × celadon','アヤメ × 青磁の水盤'],note:['同一种花，也可以有不同的高低与朝向。让水面从枝间透出来。','One flower, different heights and faces. Leave glimpses of water between the stems.','同じ花でも高さや向きを変えられます。枝の間から水面をのぞかせます。'],vessel:'celadon-shallow-suiban',scene:'paper',mood:'静寂',items:[{type:'book-iris',h:44,angle:-9,dx:-1,length:1.7},{type:'iris-blue-oblique',h:40,angle:23,dx:1},{type:'iris-white-side',h:29,angle:-26,dx:-1.5}]},
 {id:'warm',school:'sogetsu',title:['暖花与冷叶','Warm Flowers, Cool Leaves','暖かな花と銀緑の葉'],caption:['秋菊 × 银绿叶 × 砂陶','Chrysanthemum × silver green × stoneware','菊 × 銀緑の葉 × 砂色の陶器'],note:['主花落在低处，银绿叶向外伸展。用质感与冷暖形成层次。','Keep focal flowers low and let silver foliage reach outward. Build depth with texture and temperature.','主役の花を低く配し、銀緑の葉を外へ伸ばします。質感と色の温度で奥行きをつくります。'],vessel:'sand-wide-pottery-bowl',scene:'stone',mood:'野趣',items:[{type:'eucalyptus-silver-oblique',h:37,angle:-37,dx:-1},{type:'eucalyptus-silver-oblique',h:32,angle:44,flip:true,dx:1.5},{type:'chrysanthemum-apricot-side',h:29,angle:-20},{type:'chrysanthemum-burgundy-oblique',h:23,angle:26,dx:1},{type:'chrysanthemum-white-front',h:24,angle:3,dx:-.5}]},
 {id:'pine',school:'ikenobo',title:['松影与山茶','Pine and Camellia','松影と椿'],caption:['松枝 × 山茶 × 黑陶','Pine × camellia × black ceramic','松 × 椿 × 黒い陶器'],note:['让木质枝条成为骨架，低处以两朵山茶承接，留出不对称的呼吸。','Let a woody branch give structure, with two low camellias and an open, uneven outline.','木質の枝を骨格に、低い位置の椿二輪で受けます。非対称の余白を残します。'],vessel:'ink-black-low-bowl',scene:'paper',mood:'静寂',items:[{type:'pine-green-sparse',h:53,angle:-30,dx:-3,length:1.2},{type:'camellia-red-front',h:31,angle:20,dx:4},{type:'camellia-ivory-side',h:25,angle:-9,dx:-1}]},
 {id:'maple',school:'ohara',title:['青枝越过水面','Green Branch over Water','水面を渡る青枝'],caption:['青枫 × 白花 × 深蓝水盘','Green maple × white blooms × indigo basin','青楓 × 白い花 × 藍の水盤'],note:['宽浅器留出可见水面。枝梢向外展开，花面在水边形成轻重。','Show the water in a shallow basin. Let the branch reach outward and the flowers settle near its edge.','浅い器の水面を見せます。枝先を外へ伸ばし、花を水際に配します。'],vessel:'indigo-oval-suiban',scene:'stone',mood:'野趣',items:[{type:'maple-green-summer',h:48,angle:35,dx:4,length:1.14},{type:'iris-white-side',h:36,angle:-19,dx:-2},{type:'chrysanthemum-white-front',h:25,angle:-5,dx:-4}]},
 {id:'abundant',school:'sogetsu',title:['繁花与粗枝','Full Blooms, Bold Branches','豊かな花と太い枝'],caption:['松枝 × 绣球 × 芍药 × 石瓮','Pine × hydrangea × peonies × stone urn','松 × アジサイ × 芍薬 × 石の器'],note:['以粗枝撑起轮廓，让多朵大花错开高度和朝向；宽口重器稳稳承托花量。','A bold branch holds the silhouette. Give many large blooms varied heights and faces in a broad, grounded vessel.','太い枝で輪郭をつくり、大きな花の高さと向きをずらします。広い器で花量を受け止めます。'],vessel:'english-stone-garden-urn',scene:'paper',mood:'野趣',items:[{type:'pine-green-sparse',h:49,angle:-25,dx:-3,length:1.12},{type:'fern-green-arch',h:37,angle:-44,dx:-9},{type:'eucalyptus-silver-oblique',h:38,angle:34,dx:9},{type:'photo-hydrangea',h:37,angle:-14,dx:-5},{type:'book-peony',h:38,angle:13,dx:5,dy:-2},{type:'photo-peony',h:31,angle:-4,dx:1,dy:2}]}
];
