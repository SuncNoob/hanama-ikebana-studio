// Transparent botanical studies made for HANAMA. These are rendered cutouts, not book photographs.
export const foliageSpecimens = [
  {id:'leaf-alpine-fern',family:'alpine-fern',name:'高山羊齿',en:'Alpine fern',ja:'高山シダ',color:'自然绿',colorEn:'natural green',colorJa:'自然な緑',pose:'舒展叶枝',poseEn:'Open frond',poseJa:'広がる葉',swatch:'#61764f',height:42},
  {id:'leaf-lemon-eucalyptus',family:'lemon-eucalyptus',name:'柠檬尤加利',en:'Lemon eucalyptus',ja:'レモンユーカリ',color:'灰绿',colorEn:'gray green',colorJa:'灰緑',pose:'自然斜枝',poseEn:'Natural branch',poseJa:'自然な枝',swatch:'#7e977d',height:48},
  {id:'leaf-snow-willow',family:'snow-willow',name:'雪柳叶',en:'Snow willow foliage',ja:'ユキヤナギの葉',color:'嫩绿',colorEn:'fresh green',colorJa:'若葉色',pose:'细枝',poseEn:'Fine spray',poseJa:'細い枝',swatch:'#6d8b55',height:48},
  {id:'leaf-silver-ragwort',family:'silver-ragwort',name:'银叶菊',en:'Silver ragwort',ja:'シロタエギク',color:'银绿',colorEn:'silver green',colorJa:'銀緑',pose:'绒叶枝',poseEn:'Velvety leaves',poseJa:'銀色の葉',swatch:'#a3ada0',height:38},
  {id:'leaf-gardenia',family:'gardenia-leaf',name:'栀子叶',en:'Gardenia foliage',ja:'クチナシの葉',color:'深绿',colorEn:'deep green',colorJa:'深緑',pose:'光泽叶枝',poseEn:'Glossy branch',poseJa:'つやのある葉',swatch:'#315740',height:37},
  {id:'leaf-bird-nest-fern',family:'bird-nest-fern',name:'鸟巢叶',en:"Bird's-nest fern",ja:'オオタニワタリ',color:'自然绿',colorEn:'natural green',colorJa:'自然な緑',pose:'整片叶',poseEn:'Whole frond',poseJa:'一枚の葉',swatch:'#557d44',height:46},
  {id:'leaf-fatsia',family:'fatsia-leaf',name:'八角金盘',en:'Fatsia leaf',ja:'ヤツデ',color:'深绿',colorEn:'deep green',colorJa:'深緑',pose:'掌状叶',poseEn:'Palmate leaf',poseJa:'掌状の葉',swatch:'#345d41',height:48},
  {id:'leaf-monstera',family:'monstera-leaf',name:'龟背叶',en:'Monstera leaf',ja:'モンステラ',color:'深绿',colorEn:'deep green',colorJa:'深緑',pose:'开裂叶',poseEn:'Split leaf',poseJa:'切れ込みのある葉',swatch:'#416c49',height:43}
].map(a=>({...a,group:'foliage',source:'generated-foliage',format:'webp',thumbnail:true,width:683,heightPx:1024,anchor:.5,split:.65}));
