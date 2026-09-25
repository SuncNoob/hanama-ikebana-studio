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
 {id:'cherry',title:['一枝成景','A Branch, a Landscape'],caption:['樱枝 × 奶油陶壶','Cherry × creamware'],note:['以一枝的弧线定方向。柔粉呼应奶油陶，空处也留在作品里。','Let one arch set the direction. Blush meets creamware, with room around the branch.'],vessel:'english-cream-pitcher',scene:'paper',mood:'春意',items:[{type:'sakura-pink-arch',h:54,angle:17,length:1.12}]},
 {id:'iris',title:['线条与水面','Lines above Water'],caption:['鸢尾 × 浅青水盘','Iris × celadon'],note:['同一种花，也可以有不同的高低与朝向。让水面从枝间透出来。','One flower, different heights and faces. Leave glimpses of water between the stems.'],vessel:'celadon-shallow-suiban',scene:'paper',mood:'静寂',items:[{type:'book-iris',h:44,angle:-9,dx:-1,length:1.7},{type:'iris-blue-oblique',h:40,angle:23,dx:1},{type:'iris-white-side',h:29,angle:-26,dx:-1.5}]},
 {id:'warm',title:['暖花与冷叶','Warm Flowers, Cool Leaves'],caption:['秋菊 × 银绿叶 × 砂陶','Chrysanthemum × silver green × stoneware'],note:['主花落在低处，银绿叶向外伸展。用质感与冷暖形成层次。','Keep focal flowers low and let silver foliage reach outward. Build depth with texture and temperature.'],vessel:'sand-wide-pottery-bowl',scene:'stone',mood:'野趣',items:[{type:'eucalyptus-silver-oblique',h:37,angle:-37,dx:-1},{type:'eucalyptus-silver-oblique',h:32,angle:44,flip:true,dx:1.5},{type:'chrysanthemum-apricot-side',h:29,angle:-20},{type:'chrysanthemum-burgundy-oblique',h:23,angle:26,dx:1},{type:'chrysanthemum-white-front',h:24,angle:3,dx:-.5}]}
];
