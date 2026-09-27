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
