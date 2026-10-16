// SPDX-FileCopyrightText: 2026 Marko Sun
// SPDX-License-Identifier: LicenseRef-Hanama-Proprietary
import {composeSpecimen,paintArrangement,paintCompositionGuide,paintFixture,paintSceneBackground,paintBotanicalLayer,paintVesselLayer,paintSceneFinish,paintGroundPass,paintInteriorPass,paintRimPass,paintInsertedPass,paintKenzanPass,kenzanSeats,seatedClips,lightShadow,paintLightPass,paintLightSilhouette} from './compositor.js?v=soft2';
import {LIGHTS,lightOf,lightPatch,lightWorkSize,paintLightAmbient} from './ambience.js?v=hn3';
import {zipFiles,backupFiles,backupName,readBackup,keepIncoming,withTimeout,failedIds,BackupError,MAX_BACKUP_FILE} from './my-works.js?v=hn3';
import {compositorLayerPlan,compositorManifest} from './compositor-project.js?v=hn3';
import {buildPrompt,PACK_MODES,MODE_NAMES,PACK_NAMES,packReadme,OUTPUT_FORMATS,OUTPUT_FORMAT_ORDER,GENERATOR_PROVIDERS} from './prompt.js?v=hn4';
import {newSpecimens} from './catalog.js?v=hn2';
import {atelierSpecimens,atelierVessels} from './editorial-catalog.js?v=1';
import {atelierSpecimens as legacyAtelierSpecimens,atelierVessels as legacyAtelierVessels} from './atelier-catalog.js?v=1';
import {photoSpecimens} from './photo-catalog.js?v=25';
import {bookSpecimens} from './book-catalog.js?v=25';
import {foliageSpecimens} from './foliage-catalog.js?v=hn2';
import {studySpecimens} from './study-catalog.js?v=hn2';
import {poseSpecimens} from './pose-catalog.js?v=hn2';
import {additionalPoseSpecimens} from './additional-pose-catalog.js?v=hn2';
import {matchesMaterialColor,materialColorGroups} from './material-colors.js?v=1';
import {bookVessels} from './book-vessels.js?v=hn3';
import {newVessels} from './vessels.js?v=hn3';
import {botanicalNotes} from './floristry.js?v=25';
import {studies,studySeasons} from './studies.js?v=hn3';
import {applyRealScale,sizeBounds,sizeRatioBounds,outOfScale,drawsStem,lengthBounds,stemCm,lengthForStem,itemCm,mouthBase,besideBase,tipPoint,reach,stemUnit,stemTrimmed,spriteScale,stageCanvasSize,isKenzan,seatState,seatPoint,solveTo,slideBase,remapSeated,isDetachedPiece,cutEndSource,anchorAt,pieceHead,reseatPiece,companionClear,planSlot,slotState,guideRays,guideReading,fitToSlot,insertIndex} from './scale.js?v=hn3';
import {stemMaxCm,roleOf,rolesOf,roleTip,roleLabel} from './botany.js?v=hn2';
import {nameOf,colorOf,poseOf,displayPose,provenance,cardName,supportName,coverFor,matchesRole,sortByRole,roleGroups,sizeOf,sizeText,cardMeta,buildSearchIndex,emptyText,clearFiltersLabel,currentSeason,shiftSeason,seasonShiftOf,matchesSeason,seasonMark,seasonChip} from './library.js?v=hn3';
import {dimensions, vesselGeometry, warpY, unwarpY, sourceToStage, stageToSource, simplifyPoints,flexExtent} from './geometry.js?v=soft2';
import {analyzeLocalCut,decodeCutMask} from './local-cut.js?v=31';
import {legacyFlowers,legacyVessels,scenes,applyTone} from './legacy-catalog.js?v=restore1';
import {lightScenes} from './light-scenes.js';
import {atelierCase} from './atelier-cases.js';
import {createItem,stemVersion,buildStudyState,buildDemoItems} from './study-state.js?v=hn3';
import {stemHits,choosePick,cycleOrder,nextInCycle,strokeTouches} from './stem-pick.js?v=hn2';
import {keyAction,needsCheckpoint,wheelAction,zoomAbout,isDoubleTap,tolerant,repairDraftShell,canvasSignature,readStash,addToStash,cleanLineage,extendLineage} from './editor-state.js?v=hn3';
import {arrangementRecipe,recipeLines,recipeText,recipeLabel,groupText,vesselText} from './recipe.js?v=hn3';
import {paintRecipeCard,recipeFrame,cardFonts} from './share-cards.js?v=hn3';
import {mountUnityGame} from './atelier.js?v=6';
import {normalizeFlex} from './flex.js?v=2';
import {stemLengthRatio,setStemLength,normalizeStemSplit,supportsStemStretch,stemStretchSplit} from './stem-length.js';
import {paintOrganicRoom,paintOrganicGround,botanicalFlexibility,preloadOrganicRooms,isNightScene} from './organic-room.js?v=restore1';
let gameBridge=null;
const $ = (s,root=document) => root.querySelector(s);
const $$ = (s,root=document) => [...root.querySelectorAll(s)];
const LANGUAGE_STORE='hanama-language';
/** Visitors whose first visit had no saved language and no saved draft follow the browser's first language (ja/zh/en, anything else en).
 Only the picker writes LANGUAGE_STORE; LANGUAGE_AUTO just marks "follow the browser" so the second visit (which now has a draft) doesn't fall back to zh.
 Older visitors with a draft but no language key keep zh. */
const LANGUAGE_AUTO='hanama-language-auto';
const browserLanguage=()=>{try{const first=String((navigator.languages&&navigator.languages[0])||navigator.language||'');return /^ja/i.test(first)?'ja':/^zh/i.test(first)?'zh':'en'}catch{return 'zh'}};
let lang='zh';try{const savedLanguage=localStorage.getItem(LANGUAGE_STORE);if(['zh','en','ja'].includes(savedLanguage))lang=savedLanguage;else if(savedLanguage===null&&(localStorage.getItem(LANGUAGE_AUTO)==='1'||localStorage.getItem('hanama-draft-v1')===null)){lang=browserLanguage();try{localStorage.setItem(LANGUAGE_AUTO,'1')}catch{}}}catch{lang=browserLanguage()}
const jaUI={
 '花间 HANAMA · 氛围插花':'花間 HANAMA · 空気感のある花あしらい','在花间挑选花材、修剪枝叶，亲手创作有氛围的插花作品。保存草稿与 ChatGPT 生图提示词，让灵感自然成形。':'HANAMAで花材を選び、枝葉を整えて、空気感のある花あしらいを。下書きとChatGPT用の画像プロンプトを保存できます。',
 '插花工房':'アトリエ','灵感手帖':'インスピレーション','我的作品':'マイ作品','新建画布':'新しいキャンバス','怎么玩':'使い方','保存草稿':'下書きを保存','花材库':'花材ライブラリ','一枝一叶':'花材','一器一境':'花器','花与枝':'花と枝もの','花器':'花器','全部':'すべて','花之书':'花の本','成组':'ブーケ','花朵':'花','枝叶':'枝葉','搜索花材、花器':'花材・花器を検索','点选花材，再挑姿态与花色。':'花材を選び、姿や色を選択します。','枝梗可以单独拉长，也可以剪。':'茎の長さを調整したり、剪定したりできます。','从一组搭配开始':'組み合わせから始める','素材与花道参考':'素材といけばなの参考','作品名称':'作品名','草稿仅保存在本机':'下書きはこの端末に保存されます',
 '插花画布':'いけばなキャンバス','方向键微调，Delete 删除。':'矢印キーで微調整、Deleteで削除。','移动花材':'花材を移動','圈选剪枝':'囲んで剪定','花材图层':'花材レイヤー','打开花材图层':'花材レイヤーを開く','关闭花材图层':'花材レイヤーを閉じる','撤销':'元に戻す','重做':'やり直す','构图辅助线':'構図ガイド','插花比例辅助线':'いけばなの比率ガイド','清空花材':'花材をすべて削除','拖动花材调整顺序；箭头可跨过花器。':'ドラッグで順序を変更。矢印で花器の前後も移動できます。','花器也是前后层次的分界':'花器を境に前後を分けます。','点选一枝花材，调整它的姿态。':'花材を選んで姿を調整します。','正在调整':'調整中','姿态与真实花色':'姿と自然な色','更换 ↗':'変更 ↗','整枝倾斜':'枝全体の角度','花材大小':'花材の大きさ','修剪与枝梗':'剪定と茎','枝梗长度':'茎の長さ','剪短根部':'根元を短くする','修剪枝叶':'枝葉を剪定','恢复剪枝':'剪定を戻す','圈选剪掉':'囲んで切る','细部擦除':'細部を消す','剪口大小':'ブラシサイズ','翻转':'反転','复制图层':'レイヤーを複製','移到最前':'最前面へ','移到最后':'最後面へ','加入画布的位置':'追加する位置','最前层':'最前面','盖在现有花材前':'既存の花材より前','最后层':'最後面','放在现有花材后':'既存の花材より後',
 '光与景':'光と背景','素纸背景':'和紙の背景','青灰背景':'青灰色の背景','墨夜背景':'墨色の背景','拖动移动 · 双指旋转缩放 · 右键调层次':'ドラッグで移動 · 2本指で回転・拡大縮小 · 右クリックでレイヤー','草稿图':'下書き画像','创作意境':'作品のイメージ','让想象继续':'想像を広げる','静寂':'静けさ','侘寂':'わびさび','春意':'春','野趣':'自然の趣','创作想法':'創作メモ','生成整理程度':'仕上げの度合い','小幅自然重整 · 推荐':'自然に少し整える · おすすめ','适度花艺润色':'ほどよく花を整える','最小修正':'最小限の修正','生成创作包':'生成用パックを作成','保留你的设计，小幅整理成真实插花。':'デザインを保ちながら、自然ないけばなに整えます。','草稿参考 · 物理修正 · 自然花瓣':'下書きを参照 · 自然な形 · 花びらの表情','让灵感，成为作品':'ひらめきを作品に','不必填满。':'すべてを埋めなくて大丈夫。','空白，也是作品的一部分。':'余白も作品の一部です。','让枝条伸向留白':'枝を余白へ伸ばす','日式':'日本風','英式':'英国風','法式':'フランス風','现代':'モダン',
 '先添入花材，再安排层次。':'まず花材を追加して、レイヤーを整えましょう。','先选中要修剪的那一枝。':'剪定する花材を選んでください。','已移到最前层':'花器の前面へ移動しました','已移到最后层':'最後面へ移動しました','已复制花材，剪口与长度也已保留。':'花材を複製しました。剪定と長さも引き継がれます。','已向前移动一层':'一つ前のレイヤーへ移動しました','已向后移动一层':'一つ後ろのレイヤーへ移動しました','花材层次已调整':'花材の順序を変更しました','已剪去选中的枝叶，可撤销。':'選択した枝葉を剪定しました。元に戻せます。','这枝已恢复到修剪前。':'剪定前の状態に戻しました。',
 '保留用花、主次和整体光感，小幅整理枝条、花面与瓶口连接，让作品更真实。':'花材、主役と光を保ち、枝の曲線や花の向き、器とのつながりを自然に整えます。','保持原设计，在花面朝向、枝条节奏和前后空间上多做一点整理，不减花。':'花材を減らさず、花の向き、枝のリズムと奥行きを少し整えます。','尽量贴近原稿，仍修正悬空、穿插和不合理连接。':'下書きに沿いながら、浮きや不自然な交差、接続を整えます。',
 '先选中一枝，再圈住不要的枝叶。':'花材を選び、不要な枝葉を囲んでください。','圈住不要的枝叶，松手剪掉 · Esc 退出':'不要な枝葉を囲んで離すと剪定 · Escで終了','涂抹剪掉细节 · Esc 退出':'なぞって細部を削除 · Escで終了','拖动移动 · 双指旋转缩放 · 右键调层次':'ドラッグで移動 · 2本指で回転・拡大縮小 · 右クリックでレイヤー','在画布上围着多余的枝叶画一圈。只修剪当前选中的一枝。':'不要な枝葉を囲んでください。選択中の花材だけを剪定します。','在枝叶上涂抹去除细节。只修剪当前选中的一枝。':'枝葉をなぞって細部を消します。選択中の花材だけを剪定します。',
 '点选左侧花材和花器。挑选自然花色与姿态，新花材会自动插到空着的主枝、副枝或客枝位置。单指拖动调整位置，双指旋转和缩放；右键画布或点击图层按钮可以调整前后顺序。花材大小和枝梗长度可分别调整，也可以圈选剪枝或细部擦除。':'左側で花材と花器を選び、色や姿を決めます。新しい花材は空いている主・副・客の位置に自動で入ります。ドラッグで移動し、2本指で回転・拡大縮小。レイヤーから花器の前後も調整できます。大きさと茎の長さは別々に調整でき、囲み剪定や細部消去も行えます。','生成された作品':'生成作品','插花草稿':'いけばなの下書き','继续创作':'創作を続ける','分享作品 ↗':'作品を共有 ↗','删除':'削除','导入生成作品':'生成作品を読み込む','回到插花台':'アトリエへ戻る','导入草稿文件':'下書きファイルを読み込む','开始这一枝':'創作を始める','保留作品':'作品を残す','删除作品':'作品を削除','取消':'キャンセル','确认':'確認','草稿已保存到「我的作品」':'下書きを「マイ作品」に保存しました','本机保存不可用，请导出草稿':'端末への保存ができません。下書きを書き出してください','已自动保存到本机':'この端末に自動保存しました','草稿仅保存在本机':'下書きはこの端末に保存されます','你控制导出和分享':'書き出しと共有はご自身で管理できます','风经过的地方':'風が通り過ぎた場所','未命名作品':'タイトルなしの作品','从形态、质感和留白开始。三组搭配，都可以亲手改写。':'形、質感、余白から始めましょう。3つの組み合わせを自由に整えられます。','先看一枝，再想一器。':'まず一枝、そして花器。','阅读与素材来源 ↗':'読みものと素材の出典 ↗','正在铺开花枝…':'枝を配置しています…','以此开始':'この組み合わせで始める','阅读 Rachel Siegfried《The Flower Book》（DK）后创作的练习：陶壶与花枝、浅器与线条、暖花与银绿叶。画面为可编辑草稿，其中鸢尾使用书图整理花材，并非生成成品。':'Rachel Siegfried著『The Flower Book』（DK）から着想した練習です。陶器と枝、浅い器と線、暖色の花と銀緑の葉。編集可能な下書きで、完成画像ではありません。','开始这一枝':'創作を始める','草稿图已下载':'下書き画像をダウンロードしました','创作包已下载，上传草稿图并粘贴 Prompt 即可。':'生成用パックを保存しました。下書き画像をアップロードしてプロンプトを貼り付けてください。','花器前':'花器の前','花器后':'花器の後ろ','已换成':'花器を変更しました：'
};
Object.assign(jaUI,{
 '一花一记':'花を一輪ずつ記録','这里珍藏你的草稿与成品，仅保存在当前浏览器。':'下書きと完成作品をこの端末に保存します。','留住你的第一枝。':'最初の一枝を残しましょう。','在工房保存草稿，或把生成的成品导入这里。':'下書きを保存するか、生成した作品を読み込んでください。','一枝一记':'一枝の記録','先添入一枝花，再让灵感开花。':'まず花材を一つ加えて、創作を始めましょう。','草稿分享链接':'下書きの共有リンク','删除作品':'作品を削除','删除':'削除','保留作品':'作品を残す','已复制':'コピーしました','已复制，':'コピーしました。','草稿已保存到「我的作品」':'下書きを「マイ作品」に保存しました','原草稿已保存，新画布已打开。':'下書きを保存し、新しいキャンバスを開きました。','新画布已打开。':'新しいキャンバスを開きました。','自然重整创作包':'自然な仕上げの生成パック','草稿已恢复，可以继续创作。':'下書きを復元しました。創作を続けられます。','已打开分享草稿，你可以继续创作。':'共有された下書きを開きました。創作を続けられます。','部分花材未载入；已载入的花材仍可使用。':'一部の花材を読み込めませんでした。読み込み済みの素材は使用できます。','这枝花材暂时无法载入。':'この花材を読み込めませんでした。','请选择不超过 15 MB 的 PNG、JPG 或 WebP 图片。':'15MB以下のPNG、JPGまたはWebP画像を選択してください。','文件无法读取，请选择花间导出的 composition.json。':'ファイルを読み込めません。HANAMAから書き出したcomposition.jsonを選択してください。','无法导出图片，请重试':'画像を書き出せません。もう一度お試しください。','剪枝信息不完整':'剪定データが不完全です','剪枝坐标无效':'剪定位置が無効です','这不是有效的花间草稿':'HANAMAの下書きファイルではありません','花材信息不完整':'花材データが不完全です','该画布最多放置 24 组花材。':'キャンバスには最大24点まで配置できます。'
});
Object.assign(jaUI,{'叶材':'葉もの','灰绿':'灰緑','细枝':'細い枝','舒展叶枝':'広がる葉','绒叶枝':'銀色の葉','光泽叶枝':'つやのある葉','整片叶':'一枚の葉','掌状叶':'掌状の葉','开裂叶':'切れ込みのある葉','季节':'季節','四季':'四季','全部流派':'すべての流派'});
Object.assign(jaUI,{
 '间':'間','HANAMA':'HANAMA','花间首页':'花間ホーム','主导航':'メインナビゲーション','界面语言':'表示言語','搜索素材':'素材を検索','素材类型':'素材の種類','花器风格':'花器のスタイル','作品设计':'作品のデザイン','枝间的分寸':'枝のバランス',
 '插花画布。拖动花材调整位置，双指旋转和缩放；右键打开花材图层；方向键微调，Delete 删除。':'いけばなキャンバス。ドラッグで移動、2本指で回転・拡大縮小、右クリックでレイヤーを開きます。矢印キーで微調整、Deleteで削除します。',
 '一 花 一 世 界':'一輪の花、一つの世界','花材图层顺序':'花材のレイヤー順','背景':'背景','素纸':'和紙','青灰':'青灰','墨夜':'墨色の夜','移除选中花材':'選択した花材を削除','移除花材':'花材を削除','关闭':'閉じる',
 '移到花器前':'花器の前面へ移動','移到花器后':'花器の後ろへ移動','复制图层':'複製','移到最前':'最前面','移到最后':'最後面','生成创作包':'生成パック','小幅自然重整 · 推荐':'自然に整える · 推奨','适度花艺润色':'もう少し整える',
 '想象它放在哪里，光从哪里来……':'どこに飾り、光はどこから差しますか…','像清晨的风掠过庭院，安静、自然，留一点不完美。':'朝の庭を風が通り抜けるように。静かで自然に、少しの不揃いを残す。','花间 · 让每一枝，都有自己的方向。':'花間 · どの枝にも、それぞれの向きを。',
 '六组搭配，都可以亲手改写。':'6つの組み合わせを自由に整えられます。','从花材、器形与留白出发。六组搭配，都可以亲手改写。':'花材、器の形、余白から始めましょう。6つの組み合わせを自由に整えられます。','派系灵感':'流派からの発想','全部流派':'すべて','池坊':'池坊','小原流':'小原流','草月流':'草月流',
 '这不是有效的花间草稿':'HANAMAの下書きファイルではありません','花材信息不完整':'花材データが不完全です','剪枝信息不完整':'剪定データが不完全です','剪枝信息过多':'剪定データが多すぎます','剪枝坐标无效':'剪定位置が無効です','草稿过大':'下書きが大きすぎます','草稿链接过长':'下書きリンクが長すぎます','请通过草稿文件导入':'下書きファイルから読み込んでください','草稿链接无法打开，请用导出的 JSON 文件恢复。':'下書きリンクを開けません。書き出したJSONファイルから復元してください。',
 '先让这 24 组花材找到自己的位置，再添加。':'花材は24点まで配置できます。','这枝花材暂时无法载入。':'この花材を読み込めませんでした。','保留自然姿态，也可以整组入画。':'自然な姿を保ち、束のまま配置できます。','原书实拍：保留花瓣、色彩和多枝组合。成组花材作为一个图层，可圈选修剪。':'書籍の実物写真です。花びらや色、複数の枝を残し、束を一つのレイヤーとして剪定できます。',' · 书图整理':' · 書籍写真から制作','换姿态会恢复这枝的剪口，便于重新修剪；可以撤销恢复。':'姿を変えると剪定は戻ります。元に戻す操作で復元できます。',
 '单指移动 · 双指旋转与缩放':'ドラッグで移動 · 2本指で回転・拡大縮小','这枝已有 24 处剪口；可恢复剪枝后重剪。':'この花材は24か所まで剪定済みです。剪定を戻してからやり直せます。','剪枝细节已很多，请先恢复部分剪口。':'剪定箇所が多いため、一部を戻してから続けてください。','画布最多放置 24 组花材。':'キャンバスには最大24点まで配置できます。','花器已留空，随时可以撤销。':'花材をすべて削除しました。元に戻せます。',
 '图片暂时无法载入，请稍后重试':'画像を読み込めません。少し待ってからお試しください','部分花材未载入；已载入的花材仍可使用。':'一部の花材を読み込めませんでした。読み込み済みの素材は使用できます。','无法导出图片，请重试':'画像を書き出せません。もう一度お試しください','已复制':'コピーしました','请长按或选中文字后手动复制':'文字を選択してコピーしてください','先添入一枝花，再让灵感开花。':'まず花材を一枝追加してください。',
 '自然重整创作包':'自然な仕上げの生成パック','-草稿.png':'-下書き.png','本机存储空间不足或不可用，请导出文件保存。':'端末の保存領域を使えません。ファイルを書き出してください。','保存未完成，请导出文件备份。':'保存できませんでした。ファイルを書き出して保管してください。','草稿已收进「我的作品」':'下書きを「マイ作品」に保存しました。','原草稿已保存，新画布已打开。':'元の下書きを保存し、新しいキャンバスを開きました。','新画布已打开。':'新しいキャンバスを開きました。','预览暂时无法载入，可点击重试。':'プレビューを読み込めません。作品を選んで再試行できます。','搭配已打开，原草稿已保存在「我的作品」。':'組み合わせを開きました。元の下書きは「マイ作品」に保存しました。',
 '生成成品':'生成作品','一花一记':'花を一輪ずつ記録','这里珍藏你的草稿与成品，仅保存在当前浏览器。':'下書きと完成作品を、このブラウザに保存します。','留住你的第一枝。':'最初の一枝を残しましょう。','在工房保存草稿，或把生成的成品导入这里。':'アトリエで下書きを保存するか、生成作品をここに読み込んでください。','这会删除本机作品集中的草稿和成品，已下载的图片仍然保留。':'このブラウザの下書きと作品を削除します。ダウンロード済みの画像は残ります。','已移除作品':'作品を削除しました。',
 '由手作草稿延展的生成作品':'手作りの下書きから生成した作品','亲手设计的插花草稿':'自分でデザインしたいけばなの下書き','剪枝细节较多，请下载草稿文件分享。':'剪定の情報が多いため、下書きファイルをダウンロードして共有してください。','-成品':'-完成作品','-草稿':'-下書き','-分享卡.png':'-共有カード.png','分享卡已下载，可以发送给朋友。':'共有カードをダウンロードしました。','设备分享不可用，请下载分享卡。':'この端末から共有できません。共有カードをダウンロードしてください。','请选择不超过 15 MB 的 PNG、JPG 或 WebP 图片。':'15MB以下のPNG、JPGまたはWebP画像を選択してください。','成品已收藏，可以分享了。':'作品を保存しました。共有できます。','草稿文件过大，请选择花间导出的 JSON 文件。':'下書きファイルが大きすぎます。HANAMAから書き出したJSONファイルを選んでください。','文件无法读取，请选择花间导出的 composition.json。':'ファイルを読み込めません。HANAMAから書き出したcomposition.jsonを選んでください。','草稿已恢复，可以继续创作。':'下書きを復元しました。創作を続けられます。','已打开分享草稿，你可以继续创作。':'共有された下書きを開きました。創作を続けられます。','已打开分享草稿，剪枝与花色也一并保留。':'共有された下書きを開きました。剪定や花の色も保持されています。'
});
/** zh/en/ja text. The optional third argument wins for Japanese; otherwise jaUI[zh], then English. */
const L=(zh,en,ja)=>lang==='ja'?(ja||jaUI[zh]||en):lang==='en'?en:zh;
Object.assign(jaUI,{'花材大小 · 真实比例':'大きさ · 実寸比','插回花器':'花器に挿し直す','保持花头位置，把枝梗接回花器口':'花の位置を保ったまま、茎を花器の口へつなぎます','这枝超出了真实比例。':'この花材は実物の大きさを超えています。','恢复真实比例':'実寸に戻す','修剪枝叶与根部':'枝葉と根元の剪定','枝梗已插回花器口，花头位置尽量保持不变。':'花の位置を保ったまま、茎を花器の口へ挿し直しました。','已恢复真实比例。':'実物の大きさに戻しました。'});
Object.assign(jaUI,{'分享这件作品':'この作品を共有','配方：买什么、剪多长':'レシピ：用意する花材と切る長さ'});
Object.assign(jaUI,{'画布旁的创作工具':'キャンバスの創作ツール','选择剪开的部分':'切り分けた部分を選択','造型':'形を整える','意境':'イメージ','剪成两段':'二つに切る','这一剪，分成两段':'二つに分かれました','删除选中段':'選んだ部分を削除','两段都保留':'両方を残す','一剪两段':'二つに切る','圈选移除':'囲んで取り除く'});
function translateTextNodes(root,translations){const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);let node;while((node=walker.nextNode()))for(const [from,to] of Object.entries(translations))if(node.nodeValue.includes(from))node.nodeValue=node.nodeValue.replaceAll(from,to)}
function applyLanguage(){
 document.documentElement.lang=lang==='en'?'en':lang==='ja'?'ja':'zh-CN';
 document.title=L('光影插花 · HANAMA','Light & Flowers · HANAMA','光と花 · HANAMA');
 $('meta[name="description"]').content=L('在花间挑选花材、修剪枝叶，亲手创作有氛围的插花作品。保存草稿与 ChatGPT 生图提示词，让灵感自然成形。','Choose flowers, shape stems, and create atmospheric floral arrangements. Save your draft and a ChatGPT image prompt.');
 $$('[data-zh][data-en]').forEach(el=>el.textContent=lang==='ja'?(el.dataset.ja||jaUI[el.dataset.zh]||el.dataset.en):el.dataset[lang]);
 $$('[data-aria-zh][data-aria-en]').forEach(el=>el.setAttribute('aria-label',lang==='ja'?(el.dataset.ariaJa||jaUI[el.dataset.ariaZh]||el.dataset.ariaEn):el.dataset[`aria${lang==='en'?'En':'Zh'}`]));
 $$('[data-title-zh][data-title-en]').forEach(el=>el.title=lang==='ja'?(jaUI[el.dataset.titleZh]||el.dataset.titleEn):el.dataset[`title${lang==='en'?'En':'Zh'}`]);
 $$('[data-placeholder-zh][data-placeholder-en]').forEach(el=>el.placeholder=lang==='ja'?(el.dataset.placeholderJa||jaUI[el.dataset.placeholderZh]||el.dataset.placeholderEn):el.dataset[`placeholder${lang==='en'?'En':'Zh'}`]);
 const languageSelect=$('#language-select');if(languageSelect)languageSelect.value=lang;
}
const paths={plus:'M12 5v14 M5 12h14',scissors:'M6 6a3 3 0 1 1-6 0 3 3 0 0 1 6 0 M6 18a3 3 0 1 1-6 0 3 3 0 0 1 6 0 M5 8l16 13 M5 16 21 3',eraser:'m4 14 9-10a2 2 0 0 1 3 0l5 5a2 2 0 0 1 0 3l-9 10H8l-4-4a3 3 0 0 1 0-4 M9 9l9 9 M12 22h10',help:'M12 17h.01 M9.1 9a3 3 0 0 1 5.8 1c0 2-3 2-3 4 M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0',bookmark:'M5 3h14v18l-7-4-7 4V3',pencil:'m16 3 5 5-12 12-6 1 1-6L16 3 M14 5l5 5',undo:'M3 10h11a7 7 0 0 1 0 14 M3 10l5-5 M3 10l5 5',redo:'M21 10H10a7 7 0 0 0 0 14 M21 10l-5-5 M21 10l-5 5',grid:'M4 4h16v16H4V4 M4 9h16 M4 15h16 M9 4v16 M15 4v16',refresh:'M20 8a9 9 0 1 0 1 8 M20 3v5h-5',download:'M12 3v12 M7 10l5 5 5-5 M4 16v5h16v-5',move:'M12 2v20 M2 12h20 M8 6l4-4 4 4 M8 18l4 4 4-4 M6 8l-4 4 4 4 M18 8l4 4-4 4',sliders:'M5 3v8 M5 15v6 M12 3v2 M12 9v12 M19 3v11 M19 18v3 M2 11h6v4H2v-4 M9 5h6v4H9V5 M16 14h6v4h-6v-4',trash:'M3 6h18 M9 6V3h6v3 M5 6l1 15h12l1-15 M10 10v7 M14 10v7',flip:'M12 3v18 M9 5 3 18h6V5 M15 5l6 13h-6V5',layers:'m3 8 9-5 9 5-9 5-9-5 M3 12l9 5 9-5 M3 16l9 5 9-5',sparkles:'m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5L12 3 M20 2v4 M18 4h4',close:'m6 6 12 12 M6 18 18 6',hand:'M8 13V5a2 2 0 0 1 4 0v7 M12 10a2 2 0 0 1 4 0v3 M16 11a2 2 0 0 1 4 0v5c0 4-2 6-6 6h-2c-2 0-3-1-4-3l-4-6a2 2 0 0 1 3-2l3 3',copy:'M8 8h13v13H8V8 M16 5V2H2v14h3',upload:'M12 16V3 M7 8l5-5 5 5 M3 16v5h18v-5',list:'M9 6h11 M9 12h11 M9 18h11 M4 6h.01 M4 12h.01 M4 18h.01',share:'M12 16V2 M7 7l5-5 5 5 M5 11H3v10h18V11h-2'};
function icons(root=document){$$('[data-icon]',root).forEach(el=>el.innerHTML=`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${paths[el.dataset.icon]||paths.sparkles}"/></svg>`)}
const specimens=[...atelierSpecimens,...legacyAtelierSpecimens,...photoSpecimens,...bookSpecimens,...legacyFlowers,...newSpecimens,...foliageSpecimens,...studySpecimens,...poseSpecimens,...additionalPoseSpecimens];
applyRealScale(specimens);
// Modest color correction is shared by the canvas and exported artwork; original files remain intact.
applyTone(specimens);
const browseSpecimens=specimens.filter(a=>!bookSpecimens.includes(a));
const familyOrder=[...new Set(browseSpecimens.map(a=>a.family))];
const flowers=familyOrder.map(family=>{const list=browseSpecimens.filter(a=>a.family===family);return {...list[0],id:family,variants:list.length}});
const vessels=[...atelierVessels,...legacyAtelierVessels,...bookVessels,...newVessels,...legacyVessels];
const allAssets=[...specimens,...vessels];
const assetById=Object.fromEntries(allAssets.map(a=>[a.id,a]));
const specimenFor=family=>atelierSpecimens.find(a=>a.family===family)||photoSpecimens.find(a=>a.family===family)||bookSpecimens.find(a=>a.family===family)||newSpecimens.find(a=>a.family===family)||foliageSpecimens.find(a=>a.family===family)||legacyFlowers.find(a=>a.family===family);
const familyHasColor=(family,color)=>color==='all'||browseSpecimens.some(a=>a.family===family&&matchesMaterialColor(a,color));
const assetPath=id=>assetById[id]?.path||`/assets/${id}.${assetById[id]?.format||(assetById[id]?.source==='flower-book'?'webp':'png')}`;
/** Card image for a specimen: its library thumbnail when it has one (see qa/make-thumbs.mjs), else the full asset. */
const cardImage=a=>(a.thumbnail||a.source==='flower-book')?`/assets/thumbs/${a.id}.webp`:assetPath(a.id);
function toneMaterialImages(root){for(const img of root.querySelectorAll('img[src*="/assets/"]')){const id=img.getAttribute('src').match(/\/assets\/(?:thumbs\/)?([^/.]+)/)?.[1],tone=assetById[id]?.saturation;if(tone)img.style.filter=`saturate(${tone})`}}

/** Names, colours and poses in the current language (tables in library.js). */
const assetName=a=>nameOf(a,lang);
const assetColor=a=>colorOf(a,lang);
const botanicalNotesJA={anemone:'花の周りに少し余白を残しましょう。',hellebore:'うつむく花を低い器で受けます。',ranunculus:'重い花頭を低めに配します。',tulip:'光へ曲がる茎の動きを生かします。',peony:'大きな花を低く広い器で受けます。',calla:'曲線を生かし、花の向きを少し変えます。',sakura:'木質の枝を見せ、器との釣り合いを取ります。',chrysanthemum:'大きな花を低めに、細葉で軽さを添えます。',lisianthus:'花の向きを変えて柔らかな重なりをつくります。',iris:'高さを変え、茎の間に余白を残します。',camellia:'一輪を主役に、深い緑の葉で受けます。',quince:'枝の曲がりを残し、器は簡素に。',pine:'枝の勢いで方向を決め、詰め込みすぎません。',maple:'葉の色と花を響かせ、枝先を伸ばします。',willow:'垂れる枝の弧が見える高さを選びます。',eucalyptus:'銀緑の葉を暖色の花と合わせます。',fern:'葉の弧で主役の花をそっと受けます。',pampas:'軽い穂を添え、主役の花を隠しません。'};
/** A family's arranging note; families without one get their role's tip (A15), judged by the pose when one is given (photo-sakura is a supporting cluster). */
const botanicalDescription=(family,a={family})=>(lang==='ja'?botanicalNotesJA[family]:botanicalNotes[family]?.[lang==='zh'?2:3])||roleTip(roleOf(a),lang);
const moodName=value=>lang==='ja'?({'静寂':'静けさ','侘寂':'わびさび','春意':'春','野趣':'自然の趣'}[value]||value):lang==='en'?({'静寂':'Stillness','侘寂':'Wabi-sabi','春意':'Spring','野趣':'Wild spirit'}[value]||value):value;
/** Vessel style chip names (and 花之书) for the empty-result line. */
const vesselStyleName=style=>{const [zh,en,ja]=({book:['花之书','The Book','花の本'],japanese:['日式','Japanese','日本風'],english:['英式','English','英国風'],french:['法式','French','フランス風'],modern:['现代','Modern','モダン']})[style]||['日式','Japanese','日本風'];return L(zh,en,ja)};
const fixtureName=a=>supportName(a,lang);
const STORE='hanama-draft-v1';const uid=()=>globalThis.crypto?.randomUUID?.()||`${Date.now()}-${Math.random().toString(36).slice(2)}`;
function makeItem(type,options={}){return createItem(assetById[type],type,uid(),options)}
const initial=()=>({version:2,id:uid(),title:L('光影插花','Light & Flowers','光と花'),subtitle:L('杏花 · 绯红 · 光的花园','Apricot · burgundy · a garden of light','杏色・深紅・光の庭'),vessel:'editorial-aubergine',scene:'paper',light:'morning',mood:'静寂',generation:'natural',intention:L('像清晨的风掠过庭院，安静、自然，留一点不完美。','Like a morning breeze through the garden: quiet, natural, and gently imperfect.'),items:buildDemoItems({assetById,makeItem,specimenFor})});
const localeIndex=locale=>locale==='zh'?0:locale==='en'?1:2;
const untitledTitles=['未命名作品','Untitled Arrangement','タイトルなしの作品'];
const titlePresets=[['光影插花','Light & Flowers','光と花'],...lightScenes.map(s=>s.title),['风经过的地方','Where the Wind Passed','風が通り過ぎた場所'],untitledTitles,...studies.map(study=>study.title)];
const intentionPresets=['像清晨的风掠过庭院，安静、自然，留一点不完美。','Like a morning breeze through the garden: quiet, natural, and gently imperfect.','朝の庭を風が通り抜けるように。静かで自然に、少しの不揃いを残す。'];
function relocalizePresetFields(draft,locale){
 const titleGroup=titlePresets.find(group=>group.includes(draft.title));
 if(titleGroup)draft.title=titleGroup[localeIndex(locale)];
 if(intentionPresets.includes(draft.intention))draft.intention=intentionPresets[localeIndex(locale)];
}
const clamp=(n,a,b)=>Math.min(b,Math.max(a,n));const clone=o=>JSON.parse(JSON.stringify(o));const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
/** Where a remix came from (B6), checked strictly: an optional field, present only when it has a valid entry. */
const isStudyId=id=>studies.some(study=>study.id===id);
function lineageField(list){const lineage=cleanLineage(list,{isStudy:isStudyId});return lineage.length?{lineage}:{}}
/** "改自「t」" / "after “t”" / "「t」から" for the latest source of a draft, a study in the current language, or '' (also when
 the draft still carries that source's title, so a freshly opened study does not read "X · after X"). */
function lineageNote(s){
 const last=cleanLineage(s?.lineage,{isStudy:isStudyId}).at(-1);if(!last)return '';
 // A preset title (a study's or the demo's) reads in the current language, and matches its other languages.
 const study=last.s&&studies.find(x=>x.id===last.s),group=study?.title||titlePresets.find(g=>g.includes(last.t)),t=group?group[localeIndex(lang)]:last.t,title=String(s?.title||'').trim();
 if(title&&(title===last.t||title===t||group?.includes(title)))return '';
 return L(`改自「${t}」`,`after “${t}”`,`「${t}」から`);
}
/** Rebuild a draft field by field. Strict for share links and imported files. `lenient` (drafts read back from this device:
 localStorage and My Works) drops unknown items and malformed cuts instead of throwing, maps an unknown vessel to round and
 an unknown scene to paper, and counts what it skipped in report.skipped. */
function validate(v,{lenient=false,report=null}={}){
 if(lenient)v=repairDraftShell(v,{hasVessel:id=>vessels.some(a=>a.id===id),hasScene:id=>Object.hasOwn(scenes,id),report});
 if(!v||![1,2].includes(v.version)||!Array.isArray(v.items)||v.items.length>24||!vessels.some(a=>a.id===v.vessel)||!Object.hasOwn(scenes,v.scene))throw Error(L('这不是有效的花间草稿','This is not a valid Hanama draft'));
 let totalPoints=0,totalMaskChars=0,totalMaskPixels=0;const seenIds=new Set();
 return {version:2,id:typeof v.id==='string'&&/^[A-Za-z0-9_-]{1,80}$/.test(v.id)?v.id:uid(),title:String(v.title||L('未命名作品','Untitled Arrangement')).slice(0,40),subtitle:String(v.subtitle||'').slice(0,90),vessel:v.vessel,scene:v.scene,mood:['静寂','侘寂','春意','野趣'].includes(v.mood)?v.mood:'静寂',generation:['natural','creative','faithful'].includes(v.generation)?v.generation:'natural',intention:String(v.intention||'').slice(0,600),...lineageField(v.lineage),...(lightOf(v.light)?{light:lightOf(v.light)}:{}),items:tolerant(v.items,i=>{
  if(!specimens.some(a=>a.id===i.type)||!['x','y','h','angle','trim'].every(k=>Number.isFinite(i[k])))throw Error(L('花材信息不完整','Material data is incomplete'));
  const cuts=tolerant((Array.isArray(i.cuts)?i.cuts:[]).slice(0,24),c=>{
   if(!['lasso','brush'].includes(c.kind)||!Array.isArray(c.points)||c.points.length>128)throw Error(L('剪枝信息不完整','Pruning data is incomplete'));
   totalPoints+=c.points.length;if(totalPoints>8000)throw Error(L('剪枝信息过多','The draft contains too much pruning detail'));
   const points=c.points.map(p=>{if(!Array.isArray(p)||p.length!==2||!p.every(Number.isFinite))throw Error(L('剪枝坐标无效','Pruning coordinates are invalid'));return p.map(n=>clamp(n,-3,4));});
   return {kind:c.kind,points,radius:clamp(Number.isFinite(c.radius)?c.radius:.025,.002,.3)};
  },{lenient,report});
  let itemId=typeof i.id==='string'&&/^[A-Za-z0-9_-]{1,100}$/.test(i.id)&&!seenIds.has(i.id)?i.id:uid();seenIds.add(itemId);
  const segments=tolerant((Array.isArray(i.segments)?i.segments:[]).slice(0,8),segment=>{
   if(!Array.isArray(segment.line)||segment.line.length!==2||![-1,1].includes(segment.side)||!segment.line.every(p=>Array.isArray(p)&&p.length===2&&p.every(Number.isFinite)))throw Error(L('剪枝信息不完整','Cut data is incomplete'));
   return {line:segment.line.map(p=>p.map(n=>clamp(n,-3,4))),side:segment.side};
  },{lenient,report});
  if(i.localCuts&&!Array.isArray(i.localCuts))throw Error(L('剪枝信息不完整','Cut data is incomplete'));
  if(i.localCuts?.length>8)throw Error(L('剪枝信息过多','The draft contains too much pruning detail'));
  const localCuts=(i.localCuts||[]).map(entry=>{
   const cut=entry?.cut,w=cut?.w,h=cut?.h;
   if(!['main','detached'].includes(entry?.part)||![1,2].includes(cut?.v)||!Number.isInteger(w)||!Number.isInteger(h)||w<1||h<1||w*h>850000||typeof cut.d!=='string'||typeof cut.k!=='string')throw Error(L('剪枝信息不完整','Cut data is incomplete'));
   const frame=cut.v===2?cut.frame:null;
   if(cut.v===2&&(!frame||![frame.split,frame.length,frame.end].every(Number.isFinite)||frame.split<0||frame.split>1||frame.length<=0||frame.length>200||frame.end<.4||frame.end>1))throw Error(L('剪枝信息不完整','Cut data is incomplete'));
   totalMaskChars+=cut.d.length+cut.k.length;totalMaskPixels+=w*h;if(totalMaskChars>400000||totalMaskPixels>80000000||!decodeCutMask(cut.d,w*h)||!decodeCutMask(cut.k,w*h))throw Error(L('剪枝信息不完整','Cut data is incomplete'));
   const anchor=Array.isArray(entry.anchor)&&entry.anchor.length===2&&entry.anchor.every(n=>Number.isFinite(n)&&n>=0&&n<=1)?entry.anchor:null;
   return {cut:{v:cut.v,w,h,d:cut.d,k:cut.k,...(frame?{frame:{split:frame.split,length:frame.length,end:frame.end}}:{})},part:entry.part,...(anchor?{anchor}:{})};
  });
  const originId=typeof i.originId==='string'&&/^[A-Za-z0-9_-]{1,100}$/.test(i.originId)?i.originId:null;
  const pieceLabel=typeof i.pieceLabel==='string'&&/^[AB12]{1,8}$/.test(i.pieceLabel)?i.pieceLabel:'';
  return makeItem(i.type,{id:itemId,x:clamp(i.x,5,95),y:clamp(i.y,15,95),h:clamp(i.h,2,95),angle:clamp(i.angle,-180,180),trim:clamp(i.trim,0,60),flip:!!i.flip,length:clamp(Number.isFinite(i.length)?i.length:1,...lengthBounds(assetById[i.type],clamp(i.h,2,95),clamp(i.trim,0,60))),cuts,segments,localCuts,originId,pieceLabel,...(normalizeStemSplit(i.stemSplit,i,assetById[i.type])!==null?{stemSplit:normalizeStemSplit(i.stemSplit,i,assetById[i.type])}:{}),...(Array.isArray(i.flex)&&i.flex.length?{flex:normalizeFlex(i.flex)}:{}),aboveVessel:!!i.aboveVessel,cropAnchorY:clamp(Number.isFinite(i.cropAnchorY)?i.cropAnchorY:1,0,1),cropAnchorSourceY:Number.isFinite(i.cropAnchorSourceY)?clamp(i.cropAnchorSourceY,0,1):null,sv:stemVersion({sv:i.sv,cuts,segments,localCuts})});
 },{lenient,report})};
}
let state=initial(),selected=null,category='flowers',familyFilter='atelier',colorFilter='all',vesselFilter='all',undoStack=[],redoStack=[],toastTimer,images={},galleryUrls=[],importArtFor=null,drag=null,gesture=null,canvasPan=null,zoomLevel=1,zoomPanX=0,zoomPanY=0,editMode='move',stroke=null,cutSession=null,layerDragId=null,suppressLayerContextUntil=0,touchHintShown=false;
/** Picking and keyboard state: the last tap on a stem (repeat taps walk down the stack), a press on empty paper (a tap
 deselects), the last pointer type (for the context menu), a focus restore in progress, and the last arrow or bracket step. */
let lastTap=null,lastPaperTap=null,paperPinch=null,blankPress=null,lastPointerType='mouse',lastStagePointerType='mouse',restoringStemFocus=false,lastKeyStep=null,sheetDrag=null;
/** Phones, tablets and short landscape windows (A14): the material picker is a sheet over the page, not a column beside the canvas. */
const COMPACT_STUDIO='(max-width:900px),(orientation:landscape) and (max-height:540px)';
const mediaMatches=query=>{try{return !!window.matchMedia?.(query).matches}catch{return false}};
/** Seat cues and gestures (A11): the floating stems the seat banner was closed for (it shows again when that set changes), the
 side the next duplicate's base takes, and whether the arrow-key hint for photographed stems has been shown. */
let seatBannerClosed='',duplicateSide=1,photoArrowHint=false;
/** Ikebana guide choices (A13), kept in localStorage: upright or slanting rays, the thirds grid, and a side picked for one
 arrangement ({id, side}; any other arrangement leans with its tallest stem). */
const GUIDE_STORE='hanama-guide-v1';
let guidePrefs={style:'upright',thirds:false,hand:null},guideView=null,guideFrame=0;
try{const saved=JSON.parse(localStorage.getItem(GUIDE_STORE)||'null');if(saved&&typeof saved==='object'){guidePrefs.style=saved.style==='slanting'?'slanting':'upright';guidePrefs.thirds=saved.thirds===true;if(typeof saved.hand?.id==='string'&&(saved.hand.side===1||saved.hand.side===-1))guidePrefs.hand={id:saved.hand.id,side:saved.hand.side}}}catch{}
let studyFilter='all',seasonFilter='all',studyDensity='all',studyLimit=9;
const movePointers=new Map();
const spriteCache=new Map();
let fromInitial=true;
/** Beside the draft: the raw draft when it could not be read back whole (kept before anything overwrites it), raw local
 drafts that a share link replaced (filed into My Works once assets load; see fileDisplacedDrafts) and the signature of the
 canvas as last opened or saved, which tells an untouched study or work from an edited one (markClean, isCleanCanvas). */
const UNREADABLE_STORE='hanama-draft-v1-unreadable',DISPLACED_STORE='hanama-draft-v1-displaced',CLEAN_STORE='hanama-draft-clean-v1';
let bootRaw=null,bootUnreadable=false;const bootReport={skipped:0};
try{bootRaw=localStorage.getItem(STORE)}catch{}
if(bootRaw){try{state=validate(JSON.parse(bootRaw),{lenient:true,report:bootReport});fromInitial=false}catch{bootUnreadable=true}if(bootUnreadable||bootReport.skipped)try{localStorage.setItem(UNREADABLE_STORE,bootRaw)}catch{}}
relocalizePresetFields(state,lang);
/** The canvas's content signature (canvasSignature in editor-state.js), or '' when it does not validate. */
function canvasSig(s){try{return canvasSignature(validate(clone(s)),{titleGroups:titlePresets,intentionPresets})}catch{return ''}}
/** Remember `s` as untouched: a study, template or saved work as opened, or the canvas as just saved to My Works. */
function markClean(s=state){const sig=canvasSig(s);try{if(sig)localStorage.setItem(CLEAN_STORE,sig);else localStorage.removeItem(CLEAN_STORE)}catch{}}
/** Unchanged since markClean()? Without a stored signature every canvas counts as edited, as before. */
function isCleanCanvas(s=state){let clean=null;try{clean=localStorage.getItem(CLEAN_STORE)}catch{}return !!clean&&clean===canvasSig(s)}
// Upgrade only the untouched former welcome arrangement. Edited drafts keep their exact source pixels and cuts.
if(bootRaw&&isCleanCanvas()&&['round','atelier-celadon'].includes(state.vessel)&&['pine-green-sparse|calla-ivory-front|camellia-red-front','atelier-pine|atelier-calla|atelier-camellia'].includes(state.items.map(i=>i.type).join('|'))&&['光影插花','Light & Flowers','光と花'].includes(state.title)){
 try{if(!localStorage.getItem('hanama-artwork-before-v1'))localStorage.setItem('hanama-artwork-before-v1',bootRaw)}catch{}
 state={...initial(),id:state.id};fromInitial=true;markClean();
}
/** Any content worth filing into My Works. */
function hasMeaningfulCanvas(s){return s.items.length>0||String(s.intention||'').trim()||String(s.subtitle||'').trim()||!['',...untitledTitles].includes(String(s.title||'').trim())||s.vessel!=='round'||s.scene!=='paper'||s.mood!=='静寂'||s.generation!=='natural'||!!lightOf(s.light)}
function bytesToBase64(bytes){let str='';for(let i=0;i<bytes.length;i+=8192)str+=String.fromCharCode(...bytes.subarray(i,i+8192));return btoa(str)}
async function readLimited(stream,max=500000){const reader=stream.getReader(),parts=[];let size=0;try{for(;;){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>max)throw Error(L('草稿过大','The draft is too large'));parts.push(value)}}finally{reader.releaseLock()}const out=new Uint8Array(size);let offset=0;for(const part of parts){out.set(part,offset);offset+=part.length}return out}
async function encodeShare(s){const bytes=new TextEncoder().encode(JSON.stringify(s));if(globalThis.CompressionStream){const encoded=await readLimited(new Blob([bytes]).stream().pipeThrough(new CompressionStream('gzip')));return '#draft2='+bytesToBase64(encoded).replaceAll('+','-').replaceAll('/','_').replaceAll('=','')}return '#draft='+bytesToBase64(bytes)}
async function decodeShare(hash){const compressed=hash.startsWith('#draft2=');let data=hash.slice(compressed?8:7);if(data.length>30000)throw Error(L('草稿链接过长','The draft link is too long'));if(compressed)data=data.replaceAll('-','+').replaceAll('_','/');let bytes=Uint8Array.from(atob(data),c=>c.charCodeAt(0));if(compressed){if(!globalThis.DecompressionStream)throw Error(L('请通过草稿文件导入','Import the draft file instead'));bytes=await readLimited(new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip')))}return validate(JSON.parse(new TextDecoder().decode(bytes)))}
/** A shared draft or study link (B6) opens after the first render, so the visitor's own canvas is never replaced unasked:
 a draft link shows the arrival card (arriveShare), a study link (#study= or ?study=) opens the study as its card does. */
const isDraftHash=hash=>hash.startsWith('#draft=')||hash.startsWith('#draft2=');
/** The study a link names (#study=<id> or ?study=<id>), undefined when there is none, null when it is unknown. */
function studyFromLink(){
 let id=null;try{id=location.hash.startsWith('#study=')?decodeURIComponent(location.hash.slice(7)):new URLSearchParams(location.search).get('study')}catch{}
 if(id===null||id==='')return undefined;
 return /^[a-z0-9-]{1,60}$/.test(id)?studies.find(study=>study.id===id)||null:null;
}
/** Drop the link's draft or study from the address, keeping anything else in it. */
function clearLinkFromAddress(){try{const params=new URLSearchParams(location.search);params.delete('study');const query=params.toString();history.replaceState(null,'',location.pathname+(query?`?${query}`:''))}catch{}}
let bootShare=null,bootStudy;
try{if(isDraftHash(location.hash)){const hash=location.hash;clearLinkFromAddress();bootShare=await decodeShare(hash);relocalizePresetFields(bootShare,lang)}}catch{setTimeout(()=>toast(L('草稿链接无法打开，请用导出的 JSON 文件恢复。','The draft link could not be opened. Restore it from an exported JSON file.')),500)}
if(!bootShare){bootStudy=studyFromLink();if(bootStudy!==undefined)clearLinkFromAddress()}
// The first-run demo opens with nothing selected, so the arrangement is seen whole before any handles appear.
selected=fromInitial?null:state.items.at(-1)?.id||null;
/** The first-run demo counts as untouched once its sprites have settled it (see assetsReady), so opening a study does not file it. */
const demoAtBoot=fromInitial?[state.title,state.subtitle,state.intention].join('\n'):null;

/** Show a status message. `opts.action` adds an inline button (label `opts.label`, default 撤销/Undo/元に戻す) that runs the action and hides the toast; such toasts stay 6 s instead of 3.5 s. */
function toast(msg,opts={}){
 const el=$('#toast');if(!el)return;clearTimeout(toastTimer);
 // An open modal dialog sits in the top layer, above anything in the page: show the toast inside it.
 const host=$('#modal')?.open?$('#modal'):document.body;if(el.parentElement!==host)host.append(el);
 const text=document.createElement('span');text.textContent=msg;
 const action=typeof opts?.action==='function'?opts.action:null;let button=null,done=false;
 const live=()=>!button||el.contains(button);
 const hide=()=>{if(!live())return;clearTimeout(toastTimer);el.classList.remove('visible');if(button)setTimeout(()=>{if(!el.classList.contains('visible'))button.remove()},250)};
 if(action){button=document.createElement('button');button.type='button';button.className='toast-action';button.textContent=opts.label||L('撤销','Undo','元に戻す');
  button.onclick=()=>{if(done||!live())return;done=true;hide();try{action()}catch(err){console.error(err)}};
  button.onpointerenter=button.onfocus=()=>{if(live()&&!done)clearTimeout(toastTimer)};
  button.onpointerleave=button.onblur=()=>{if(live()&&!done&&el.classList.contains('visible')){clearTimeout(toastTimer);toastTimer=setTimeout(hide,2500)}};
 }
 el.replaceChildren(...(button?[text,button]:[text]));el.classList.toggle('has-action',!!action);el.classList.add('visible');toastTimer=setTimeout(hide,action?6000:3500);
}
/** Slider, drag and keyboard edits write through schedulePersist (300 ms debounce); change, pagehide and a hidden tab flush it. */
let persistTimer=0;
function schedulePersist(delay=300){clearTimeout(persistTimer);persistTimer=setTimeout(persist,delay)}
function flushPersist(){if(persistTimer)persist()}
addEventListener('pagehide',flushPersist);document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden')flushPersist()});
function persist(){clearTimeout(persistTimer);persistTimer=0;try{localStorage.setItem(STORE,JSON.stringify(state));$('#save-state').textContent=L('已自动保存到本机','Auto-saved on this device')}catch{$('#save-state').textContent=L('本机保存不可用，请导出草稿','Local saving is unavailable; please export your draft')}}
function checkpoint(){undoStack.push({state:clone(state),selected});if(undoStack.length>60)undoStack.shift();redoStack=[];renderHistory()}
/** A toast with an Undo button for the step just checkpointed: call it right after checkpoint(). The button undoes only while
 that entry is still the newest one (entries are compared, not counts: the stack stays at 60 once full). */
function undoToast(msg){const mark=undoStack.at(-1);toast(msg,{action:()=>{if(mark&&undoStack.at(-1)===mark)$('#undo-button').click()}})}
/** Name of a stem as the layer list shows it (with its piece label). */
const itemName=item=>assetName(assetById[item.type])+(item.pieceLabel?` ${item.pieceLabel}`:'');
function renderHistory(){$('#undo-button').disabled=!undoStack.length;$('#redo-button').disabled=!redoStack.length}
function current(){return state.items.find(i=>i.id===selected)}
function setEditorTab(tab){const panel=$('.design-panel');if(!panel)return;panel.dataset.editorTab=tab;$$('[data-editor-tab]',panel).forEach(b=>b.setAttribute('aria-selected',String(b.dataset.editorTab===tab)));panel.querySelector('.panel-heading h2').textContent=tab==='shape'?L('调整花枝','Adjust Stem','枝を整える'):L('让意境成画','Image Prep','画像準備');editingChip=false;renderEditingChip()}
$$('.editor-tabs [data-editor-tab]').forEach(b=>b.onclick=()=>setEditorTab(b.dataset.editorTab));
/**
 * Panel context (B8): picking a stem on the canvas brings the 造型 tab forward. While a field of the 出图 tab has focus (the
 * user is writing), the tab stays and a chip names the stem instead: 正在调整：X · 去调整 ↗.
 */
let editingChip=false;
function revealStemPanel(){
 const panel=$('.design-panel');if(!panel||panel.dataset.editorTab==='shape'||!current())return;
 const field=document.activeElement?.closest?.('input,textarea,select');
 if(field&&panel.contains(field)){editingChip=true;renderEditingChip();return}
 setEditorTab('shape');
}
function renderEditingChip(){
 const chip=$('#editing-chip');if(!chip)return;const item=current(),show=editingChip&&!!item&&$('.design-panel')?.dataset.editorTab==='create';
 if(!show)editingChip=false;chip.hidden=!show;if(!show)return;
 const name=itemName(item);chip.textContent=L(`正在调整：${name} · 去调整 ↗`,`Editing: ${name} · Adjust ↗`,`編集中：${name} · 調整へ ↗`);
}
$('#editing-chip')?.addEventListener('click',()=>{setEditorTab('shape');$('#angle')?.focus({preventScroll:true})});
/** Cuts get a short memoised key; undo clones are new arrays and in-place pushes change the length, so both recompute once. */
const cutsKeys=new WeakMap();
function cutsKey(cuts){
 if(!Array.isArray(cuts)||!cuts.length)return '0';
 const known=cutsKeys.get(cuts);if(known&&known.n===cuts.length)return known.key;
 const text=JSON.stringify(cuts);let hash=2166136261;for(let n=0;n<text.length;n++){hash^=text.charCodeAt(n);hash=Math.imul(hash,16777619)}
 const key=`${cuts.length}.${text.length}.${(hash>>>0).toString(36)}`;cutsKeys.set(cuts,{n:cuts.length,key});return key;
}
const SPRITE_CACHE_LIMIT=40;
let canvasWarned=false;
function canvasTrouble(err){if(err)console.warn(err);if(canvasWarned)return;canvasWarned=true;toast(L('有花材过大，暂时无法显示；可缩短枝梗或刷新页面。','A material is too large to display right now. Shorten its stem or reload the page.','大きすぎて表示できない花材があります。茎を短くするか、ページを再読み込みしてください。'))}
function dropSprite(id){const entry=spriteCache.get(id);if(!entry)return;spriteCache.delete(id);if(entry.canvas)entry.canvas.width=entry.canvas.height=0}
/** Cached, resolution-budgeted sprite for one stem (LRU, about 40 entries; evicted canvases are zeroed so iOS frees them). */
function specimenCanvas(item){
 const img=images[item.type],a=assetById[item.type];if(!img||!a)return null;
 const k=spriteScale(item,a,img.naturalWidth||img.width,img.naturalHeight||img.height),key=`${item.type}|${item.length}|${item.stemSplit??''}|${item.trim}|${k}|${item.sv}|${cutsKey(item.cuts)}|${cutsKey(item.segments)}|${cutsKey(item.localCuts)}`;
 const cached=spriteCache.get(item.id);
 if(cached?.key===key){spriteCache.delete(item.id);spriteCache.set(item.id,cached);return cached.canvas}
 let canvas=null;try{canvas=composeSpecimen(img,item,a,null,undefined,k)}catch(err){canvasTrouble(err)}
 dropSprite(item.id);spriteCache.set(item.id,{key,canvas});
 while(spriteCache.size>SPRITE_CACHE_LIMIT)dropSprite(spriteCache.keys().next().value);
 return canvas;
}
function stemStyle(i){
 const a=assetById[i.type],src=specimenCanvas(i);let g=dimensions(i,a);
 const fixedPoint=a.tip||[g.anchor,0],before=sourceToStage(fixedPoint,i,a);
 const crop=src?.crop||{x:0,y:0,width:src?.width||a.width,height:src?.height||a.heightPx,fullWidth:src?.width||a.width,fullHeight:src?.height||a.heightPx,bottom:i.cropAnchorY??1};
 const nextPivot=clamp(crop.bottom??1,0,1);
 const nextSource=clamp(unwarpY(nextPivot*g.height,g.split,g.length),0,1);
 i.cropAnchorY=nextPivot;i.cropAnchorSourceY=nextSource;
 g=dimensions(i,a);
 const after=sourceToStage(fixedPoint,i,a),dx=(before[0]-after[0])*100,dy=(before[1]-after[1])*100;
 if(Math.abs(dx)>.0001||Math.abs(dy)>.0001){i.x=clamp(i.x+dx,5,95);i.y=clamp(i.y+dy,15,95)}
 const anchorX=(g.anchor*crop.fullWidth-crop.x)/Math.max(1,crop.width),widthRatio=crop.width/Math.max(1,crop.fullWidth),heightRatio=crop.height/Math.max(1,crop.fullHeight),ax=anchorX*100;
 return `left:${i.x}%;top:${i.y}%;height:${i.h*g.height*heightRatio}%;width:${i.h*g.ratio*widthRatio}%;--anchor:${ax}%;transform-origin:${ax}% 100%;transform:translate(${-ax}%,-100%) rotate(${i.angle}deg) scaleX(${i.flip?-1:1});`;
}
/** Stage width in CSS px; a hidden studio (0 px) falls back to a typical width until the ResizeObserver redraws. */
function stageWidth(){const w=$('#stage')?.getBoundingClientRect().width||0;return w>=40?w:720}
const drawnStems=new WeakMap();
/** The DOM canvas is sized to its displayed size (≤2× DPR, 25% headroom), not to the sprite. */
function drawStemCanvas(el,item,{stageW=stageWidth(),previewCut=null}={}){
 const canvas=el&&$('canvas',el);if(!canvas)return;const src=specimenCanvas(item);
 if(!src||!src.width||!src.height){if(canvas.width||canvas.height){canvas.width=canvas.height=0}drawnStems.delete(canvas);return}
 const g=dimensions(item,assetById[item.type]),crop=src.crop,heightRatio=crop?crop.height/Math.max(1,crop.fullHeight):1;
 const [w,h]=stageCanvasSize(src.width,src.height,stageW*item.h*g.height*heightRatio/100,window.devicePixelRatio||1);
 if(!previewCut&&drawnStems.get(canvas)===src&&canvas.width===w&&canvas.height===h)return;
 if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h}
 const ctx=canvas.getContext('2d');if(!ctx){drawnStems.delete(canvas);canvasTrouble();return}
 let preview=null;
 if(previewCut)try{preview=composeSpecimen(images[item.type],item,assetById[item.type],previewCut,undefined,src.scale)}catch(err){canvasTrouble(err)}
 ctx.clearRect(0,0,w,h);ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
 if(preview&&crop)ctx.drawImage(preview,crop.x,crop.y,crop.width,crop.height,0,0,w,h);
 else ctx.drawImage(src,0,0,w,h);
 if(preview){preview.width=preview.height=0;drawnStems.delete(canvas)}else{if(drawnStems.get(canvas)!==src)scheduleVesselLayers();drawnStems.set(canvas,src)}
}
function redrawStemCanvases(){const w=stageWidth();for(const i of state.items)drawStemCanvas($(`.stem[data-id="${i.id}"]`),i,{stageW:w})}
/** Restyle one stem without rebuilding the stage; its canvas is redrawn only when its sprite or display size changed. */
function updateStem(item){
 const el=$(`.stem[data-id="${item.id}"]`);if(!el){renderStage();return}
 el.style.cssText=stemStyle(item);drawStemCanvas(el,item);scheduleVesselLayers();
 if(item.id===selected)syncSelectionReadouts(item);
 renderSeatCues();queueGuide();gameBridge?.schedule();
}
const pendingStems=new Set();let stemFrame=0;
function queueStemUpdate(item){pendingStems.add(item.id);if(!stemFrame)stemFrame=requestAnimationFrame(()=>{stemFrame=0;const ids=[...pendingStems];pendingStems.clear();for(const id of ids){const item=state.items.find(i=>i.id===id);if(item)updateStem(item)}if(vesselLayersFrame)renderVesselLayers()})}
/** Largest backing size of the stage's canvas layers (zoomed in at 2× DPR they would otherwise grow without bound); the
 smooth scene layer needs less. */
const LAYER_MAX=3072,SCENE_MAX=1200;
let vesselLayersFrame=0,sceneLayerKey='',fixtureLayerKey='';
/** Size a layer canvas (0 releases its memory); returns its 2D context, or null when it holds nothing. */
function layerContext(canvas,size){if(!canvas)return null;if(canvas.width!==size||canvas.height!==size){canvas.width=size;canvas.height=size}if(!size)return null;const ctx=canvas.getContext('2d');if(ctx)ctx.clearRect(0,0,size,size);return ctx}
/**
 * The stage's canvas layers, painted by the export's own passes so the editor shows what draft.png will: the scene
 * (background, the vessel's ground shadows, finish) under everything, repainted only when vessel, scene or size change;
 * the inserted ends of stems behind the vessel (#interior-layer), the support (#fixture-layer) and the front rim over
 * stems in front (#rim-layer). Also sets the stem layers' CSS shadow from the same LIGHT. Use scheduleVesselLayers()
 * during drags: it coalesces to one redraw per frame.
 */
function renderVesselLayers(){
 if(vesselLayersFrame){cancelAnimationFrame(vesselLayersFrame);vesselLayersFrame=0}
 const stageEl=$('#stage');if(!stageEl)return;
 const cssSize=Math.max(1,Math.round(stageEl.getBoundingClientRect().width)),density=Math.min(2,window.devicePixelRatio||1),size=Math.max(1,Math.min(LAYER_MAX,Math.round(cssSize*density)));
 const vessel=assetById[state.vessel],night=isNightScene(state.scene),vesselReady=!!images[state.vessel];
 if(!vessel)return;
 if(!vesselReady)ensureAsset(state.vessel).then(scheduleVesselLayers).catch(()=>{});
 const scene=$('#scene-layer'),sceneSize=Math.min(SCENE_MAX,size),sceneKey=`${sceneSize}|${state.vessel}|${state.scene}|${vesselReady}|${lightOf(state.light)||''}`;
 if(scene&&sceneKey!==sceneLayerKey){const ctx=layerContext(scene,sceneSize);if(ctx){paintSceneBackground(ctx,sceneSize,state,scenes);paintLightAmbient(ctx,sceneSize,state.light,{night:isNightScene(state.scene)});paintGroundPass(ctx,sceneSize,state,assetById,images);paintSceneFinish(ctx,sceneSize,state);sceneLayerKey=sceneKey;stageEl.classList.add('scene-painted')}else{sceneLayerKey='';stageEl.classList.remove('scene-painted')}}
 const fixture=$('#fixture-layer'),fixtureKey=`${size}|${state.vessel}|${state.scene}`;
 if(fixture&&fixtureKey!==fixtureLayerKey){const ctx=layerContext(fixture,size);if(ctx){paintFixture(ctx,size,vessel,{night});fixtureLayerKey=fixtureKey}}
 // On a kenzan the holder lies under the stems standing on it (CSS lifts #fixture-layer under #interior-layer); the pins
 // and water in front of their bases are painted over them: behind the vessel in the interior layer, in front in the rim layer.
 stageEl.classList.toggle('support-under',isKenzan(vessel));
 const clips=seatedClips(state,assetById,specimenCanvas),seats=kenzanSeats(state,assetById,specimenCanvas);
 const interior=layerContext($('#interior-layer'),clips.interior.length||seats.back.length?size:0);
 if(interior){paintInteriorPass(interior,size,state,assetById,specimenCanvas,{clips:clips.interior});paintKenzanPass(interior,size,state,assetById,images,{seats,side:'back',getSprite:specimenCanvas})}
 const rim=layerContext($('#rim-layer'),(clips.rim.length||seats.front.length)&&vesselReady?size:0);
 if(rim){paintKenzanPass(rim,size,state,assetById,images,{seats,side:'front',getSprite:specimenCanvas});paintRimPass(rim,size,state,assetById,images,specimenCanvas,{clips:clips.rim})}
 setStemShadows(stageEl);
 queueLightLayer();gameBridge?.schedule();
}
function scheduleVesselLayers(){if(!vesselLayersFrame)vesselLayersFrame=requestAnimationFrame(()=>{vesselLayersFrame=0;renderVesselLayers()})}
/**
 * The window light on the stage (B10): #light-layer holds only the window patch with the arrangement's shadow, at the small
 * working size (lightWorkSize, ≤180 px); CSS scales it over the stage and screens it over the scene layer at the light's
 * strength (the room tone is painted into the scene layer). It repaints with the vessel layers, at most 8 times a second
 * while anything keeps changing, and not at all while a finger drags a stem; it catches up when the drag ends.
 */
const LIGHT_FRAME_MS=125;
let lightTimer=0,lightPaintedAt=-Infinity,lightDirty=false;
const lightCanvas=(w,h)=>{const c=document.createElement('canvas');c.width=w;c.height=h;return c};
function renderLightLayer(){
 clearTimeout(lightTimer);lightTimer=0;lightDirty=false;
 const canvas=$('#light-layer'),stageEl=$('#stage');if(!canvas||!stageEl)return;
 const key=['generated-atelier','generated-editorial'].includes(assetById[state.vessel]?.source)?null:lightOf(state.light);stageEl.classList.toggle('has-light',!!key);
 if(!key){layerContext(canvas,0);return}
 lightPaintedAt=performance.now();
 const density=Math.min(2,window.devicePixelRatio||1),S=lightWorkSize(Math.min(LAYER_MAX,Math.round((stageEl.offsetWidth||stageWidth())*density)));
 let silhouette=null,patch=null;
 try{
  silhouette=lightCanvas(S,S);const sc=silhouette.getContext('2d');if(sc)paintLightSilhouette(sc,S,state,assetById,specimenCanvas,images);
  patch=lightPatch(key,S,sc?silhouette:null,lightCanvas);
  const ctx=layerContext(canvas,patch?S:0);if(ctx)ctx.drawImage(patch,0,0);
  canvas.style.opacity=String(LIGHTS[key].strength);
 }catch{layerContext(canvas,0)}
 finally{for(const c of [silhouette,patch])if(c)c.width=c.height=0;gameBridge?.schedule()}
}
function queueLightLayer(){
 if(!lightOf(state.light)){if($('#light-layer')?.width||$('#stage')?.classList.contains('has-light'))renderLightLayer();return}
 lightDirty=true;
 if((drag||gesture)&&lastStagePointerType==='touch')return;
 const wait=LIGHT_FRAME_MS-(performance.now()-lightPaintedAt);
 if(wait<=0)renderLightLayer();else if(!lightTimer)lightTimer=setTimeout(()=>{lightTimer=0;if(lightDirty)queueLightLayer()},wait);
}
/** Light names [zh, en, ja] for the 光 chip and its menu; '' is none. */
const LIGHT_NAMES={'':['无','None','なし'],morning:['晨光','Morning','朝の光'],noon:['午光','Midday','昼の光'],dusk:['暮光','Evening','夕暮れ'],moon:['月光','Moonlight','月明かり']};
function renderLightControls(){
 const chip=$('#light-button');if(!chip)return;
 const key=lightOf(state.light)||'',name=L(...LIGHT_NAMES[key]);
 $('#light-name').textContent=key?name:'';chip.classList.toggle('active',!!key);
 chip.setAttribute('aria-label',L(`窗光：${name}`,`Window light: ${name}`,`窓の光：${name}`));chip.title=L('窗光与时辰','Window light and time of day','窓の光と時刻');
 $$('[data-light]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.light===key)));
}
function setLightMenu(open){
 const menu=$('#light-menu'),chip=$('#light-button');if(!menu||!chip)return;
 menu.hidden=!open;chip.setAttribute('aria-expanded',String(open));
 if(!open)return;
 // Above the chip, shifted sideways to stay 16 px inside the window; below it when there is no room above.
 menu.style.left='0px';menu.style.top='';menu.style.bottom='';
 const m=menu.getBoundingClientRect(),vw=document.documentElement.clientWidth||innerWidth;let dx=0;
 if(m.right>vw-16)dx=vw-16-m.right;if(m.left+dx<16)dx=16-m.left;menu.style.left=`${Math.round(dx)}px`;
 if(m.top<8){menu.style.bottom='auto';menu.style.top='calc(100% + 6px)'}
 (menu.querySelector('[aria-pressed="true"]')||menu.querySelector('button'))?.focus({preventScroll:true});
}
/** CSS drop-shadows on the unrotated stem containers, from the export's LIGHT (lighter on touch screens, where the
 layer behind the vessel goes without, to keep drags smooth). */
function setStemShadows(stageEl){
 const width=stageEl.offsetWidth||stageWidth(),coarse=matchMedia?.('(pointer:coarse)').matches;
 for(const [selector,kind] of [['#composition','back'],['#composition-front','front']]){
  const el=$(selector);if(!el)continue;
  if(coarse&&kind==='back'){for(const v of ['--sx','--sy','--sb','--sc'])el.style.removeProperty(v);continue}
  const shadow=lightShadow(kind,width,state.scene),px=n=>`${Math.round(n*100)/100}px`;
  el.style.setProperty('--sx',px(shadow.x));el.style.setProperty('--sy',px(shadow.y));el.style.setProperty('--sb',px(shadow.blur*(coarse?.75:1)));el.style.setProperty('--sc',shadow.color);
 }
}
function renderStage(){
 const focusedStemId=document.activeElement?.classList?.contains('stem')?document.activeElement.dataset.id:null;
 const markup=i=>{const name=assetName(assetById[i.type]),piece=i.pieceLabel?` ${i.pieceLabel}`:'',instructions=L(`${name}${piece}，拖动花头转向，拖根部圆点移动，双指旋转缩放`,`${name}${piece}; drag the flower to swing it, drag the base dot to move, use two fingers to rotate and scale`,`${name}${piece}。花を引いて向きを変え、根元の点で移動、2本指で回転・拡大縮小`);return `<div class="stem ${i.id===selected?'selected':''} ${cutSession?.ids.includes(i.id)?'fresh-cut':''}" data-id="${i.id}" data-piece="${esc(i.pieceLabel||'')}" style="${stemStyle(i)}" role="button" tabindex="0" aria-label="${esc(instructions)}" aria-pressed="${i.id===selected}"><canvas class="specimen-image" aria-hidden="true"></canvas></div>`};
 $('#composition').innerHTML=state.items.filter(i=>!i.aboveVessel).map(markup).join('');$('#composition-front').innerHTML=state.items.filter(i=>i.aboveVessel).map(markup).join('');
 const stageW=stageWidth();for(const i of state.items){drawStemCanvas($(`.stem[data-id="${i.id}"]`),i,{stageW})}
 for(const id of [...spriteCache.keys()]){if(!state.items.some(i=>i.id===id))dropSprite(id)}
 $('#vessel').src=assetPath(state.vessel);$('#vessel').alt=assetName(assetById[state.vessel]);const vg=vesselGeometry(assetById[state.vessel]);$('#vessel').style.height=vg.height+'%';$('#vessel').style.width=vg.width+'%';$('#stage').dataset.scene=state.scene;renderVesselLayers();
 $$('button[data-scene]').forEach(b=>{const on=b.dataset.scene===state.scene;b.classList.toggle('active',on);b.setAttribute('aria-pressed',String(on))});renderLightControls();$('#study-count').textContent=String(new Set(state.items.map(i=>i.originId||i.id)).size).padStart(3,'0');renderSelection();renderHistory();renderLayerList();renderCutChoice();drawPruneOverlay();renderSeatCues();renderStartCard();renderGuide();
 gameBridge?.schedule();
 if(focusedStemId){restoringStemFocus=true;try{$(`.stem[data-id="${focusedStemId}"]`)?.focus({preventScroll:true})}finally{restoringStemFocus=false}}
}
/** #selected-empty: its own sentence on an empty canvas, else the usual "select a stem". */
const emptyLines={canvas:['画布还空着。先放一枝线条，定下高度与方向。','The canvas is empty. Start with a line to set the height and direction.','キャンバスはまだ空です。まず線になる枝で、高さと向きを決めましょう。'],pick:['点选一枝花材，调整它的姿态。','Select a material to adjust its pose.','花材を選んで姿を調整します。']};
function renderEmptySelection(){const el=$('#selected-empty');if(!el)return;const [zh,en,ja]=emptyLines[state.items.length?'pick':'canvas'];el.dataset.zh=zh;el.dataset.en=en;el.dataset.ja=ja;el.textContent=L(zh,en,ja)}
function renderSelection(){
 $('#flip-button').disabled=!state.items.length;$('#duplicate-button').disabled=!state.items.length||state.items.length>=24;
 let i=current();$('#selected-empty').hidden=!!i;$('#selection-controls').hidden=!i;renderEditingChip();if(!i){renderEmptySelection();setEditMode('move');return;}
 renderModePill();
 const a=assetById[i.type];$('#selected-thumb').src=assetPath(i.type);$('#selected-thumb').style.filter=a.saturation?`saturate(${a.saturation})`:'';$('#selected-thumb').alt=assetName(a);$('#selected-name').textContent=assetName(a);$('#variant-label').textContent=`${assetColor(a)} · ${displayPose(a,lang)}`;$('#botanical-note').textContent=botanicalDescription(a.family,a);
 const stemDrawn=drawsStem(a),label=$('#stem-details-label');$('#trim').closest('.range-control').hidden=stemDrawn;
 if(label){label.dataset.zh=stemDrawn?'修剪枝叶':'修剪枝叶与根部';label.dataset.en=stemDrawn?'Prune foliage':'Pruning';label.textContent=L(label.dataset.zh,label.dataset.en)}
 syncSelectionReadouts(i,a);$('#restore-cuts').disabled=!i.cuts?.length;
}
/** Slider values and readouts for the selected stem; cheap enough to run every animation frame. */
function syncSelectionReadouts(i,a=assetById[i.type]){
 $('#angle').value=i.angle;$('#angle-value').value=Math.round(i.angle)+'°';$('#trim').value=i.trim;$('#trim-value').value=i.trim+'%';renderSizeControls(i,a);
 const restoreNote=$('#restore-stem-note');if(restoreNote)restoreNote.hidden=!stemTrimmed(i,a);
}
/** Size stays within natural variation of the real plant; drawn stems are shown in centimetres. */
function renderSizeControls(i,a=assetById[i.type]){
 const [min,max]=sizeBounds(a),size=$('#size'),length=$('#length');
 size.min=min;size.max=max;size.step=.1;size.value=clamp(i.h,min,max);$('#size-value').value=Math.round(i.h/a.height*100)+'%';
 let pastCap=false;
 if(drawsStem(a)){
  // Honest length: the slider ends at the species' usual stem (stemMaxCm), or at the stem's own length when it is already
  // longer (saved drafts are never shortened); the stretch past the usual length is painted amber.
  const cm=Math.round(stemCm(i,a)),cap=stemMaxCm(a),top=lengthCeil?.id===i.id?lengthCeil.max:stemCeil(i,a);
  length.min=0;length.max=top;length.step=1;length.value=cm;length.disabled=!stemUnit(i,a);$('#length-value').value=`+${cm} cm`;
  const track=length.parentElement;track.style.setProperty('--cap',String(Math.round(cap/Math.max(1,top)*1e4)/1e4));track.classList.toggle('past-cap',top>cap+.5);
  pastCap=keptStemCm(i)!==null&&stemCm(i,a)>cap+.5;
 }
 else{const ratio=stemLengthRatio(i,a);length.min=60;length.max=240;length.step=5;length.disabled=supportsStemStretch(a)&&stemStretchSplit(i,a)===null;length.value=Math.round(ratio*100);$('#length-value').value=Math.round(ratio*100)+'%';length.parentElement.classList.remove('past-cap')}
 const total=Math.round(itemCm(i,a)),vessel=Math.round(vesselGeometry(assetById[state.vessel]).height);
 // Screen readers hear the size and length in centimetres as well as the slider's position (A15).
 const pct=Math.round(i.h/a.height*100);size.setAttribute('aria-valuetext',L(`约 ${total} cm · ${pct}%`,`about ${total} cm · ${pct}%`,`約${total} cm · ${pct}%`));
 if(drawsStem(a)){const cm=Math.round(stemCm(i,a));length.setAttribute('aria-valuetext',L(`茎 +${cm} cm · 全长约 ${total} cm`,`stem +${cm} cm · whole stem about ${total} cm`,`茎 +${cm} cm · 全長 約${total} cm`))}
 else length.setAttribute('aria-valuetext',L(`约 ${total} cm · ${Math.round(stemLengthRatio(i,a)*100)}%`,`about ${total} cm · ${Math.round(stemLengthRatio(i,a)*100)}%`,`約${total} cm · ${Math.round(stemLengthRatio(i,a)*100)}%`));
 $('#real-size').textContent=lang==='ja'?`この花材 約${total} cm · 花器の高さ 約${vessel} cm`:L(`此枝约 ${total} cm · 花器高约 ${vessel} cm`,`This stem ≈ ${total} cm · vessel ≈ ${vessel} cm tall`);
 $('#scale-warning').hidden=!outOfScale(i,a);
 const capNote=$('#stem-cap-warning');
 if(capNote){capNote.hidden=!pastCap;if(pastCap){const name=assetName(a),n=naturalCm(i,a);$('#stem-cap-text').textContent=L(`比一般的${name}长（通常≤${n} cm）`,`Longer than ${name} usually grows (≈${n} cm)`,`${name}としては長め（通常${n} cm以下）`)}}
}
/** Top of the stem-length slider and the arrow keys for a drawn stem: its species' usual length, or its own when longer. */
const stemCeil=(i,a)=>Math.max(stemMaxCm(a),Math.round(stemCm(i,a)));
/** While the length slider is held its top stays put ({id, max}), so the track never shrinks under the thumb. */
let lengthCeil=null;
/** The whole stem (cm) a drawn stem of this size has at its species' usual length. */
const naturalCm=(i,a)=>Math.round(itemCm({...i,length:Math.min(lengthForStem(i,a,stemMaxCm(a)),lengthBounds(a,i.h,i.trim)[1])},a));
/** "Natural length": a drawn stem past its species' usual length goes back to it (its base stays; a piece keeps its own). */
function naturalLength(){
 const item=current();if(!item)return;const a=assetById[item.type];if(!drawsStem(a)||keptStemCm(item)===null||stemCm(item,a)<=stemMaxCm(a)+.5)return;
 checkpoint();item.length=Math.min(lengthForStem(item,a,stemMaxCm(a)),lengthBounds(a,item.h,item.trim)[1]);
 renderStage();persist();undoToast(L('已恢复自然长度','Back to its natural length','自然な長さに戻しました'));
}
const generationDescriptions={zh:{natural:'保留用花、主次和整体光感，小幅整理枝条、花面与瓶口连接，让作品更真实。',creative:'保持原设计，在花面朝向、枝条节奏和前后空间上多做一点整理，不减花。',faithful:'尽量贴近原稿，仍修正悬空、穿插和不合理连接。'},en:{natural:'Keep the flowers, hierarchy and light; refine local curves, facing and insertion for realism.',creative:'Refine facing, stem rhythm and depth a little further within the same design, without fewer flowers.',faithful:'Stay closest to the draft while correcting floating stems, intersections and implausible connections.'},ja:{natural:jaUI['保留用花、主次和整体光感，小幅整理枝条、花面与瓶口连接，让作品更真实。'],creative:jaUI['保持原设计，在花面朝向、枝条节奏和前后空间上多做一点整理，不减花。'],faithful:jaUI['尽量贴近原稿，仍修正悬空、穿插和不合理连接。']}};
function renderAll(){applyLanguage();renderLightScenes();applyCanvasZoom();setEditorTab($('.design-panel').dataset.editorTab||'shape');renderStage();renderMaterials();renderQuickMaterials();setEditMode(editMode);$('#work-title').value=untitledTitles.includes(state.title)?'':state.title;$('#work-subtitle').value=state.subtitle||'';$('#intention').value=state.intention;$$('[data-mood]').forEach(b=>{const on=b.dataset.mood===state.mood;b.classList.toggle('active',on);b.setAttribute('aria-pressed',String(on))});$('#generation-mode').value=state.generation||'natural';$('#generation-mode-help').textContent=generationDescriptions[lang][state.generation||'natural'];persist()}
/** Neutral names of the placement slots (真·副·控 and the 添え fillers) for the add toast and the guide readout. */
const slotNames={shin:['主枝','Main line','主'],soe:['副枝','Second line','副'],hikae:['客枝','Accent','客'],jushi:['辅枝','Filler','添え']};
const slotName=slot=>(slotNames[slot]||slotNames.jushi)[localeIndex(lang)];
/**
 * Add a stem where a florist would put it (A12): naturalPlacement picks its slot by botanical role, its size, mirror, fit and
 * whether it is drawn before the vessel. Lines and foliage go in before the first flower of their layer group, flowers and
 * fillers on top. The old explicit 'front' (last, before the vessel) and 'back' (first, behind it) still work for callers.
 */
function addSpecimen(type,placement='auto'){
 if(state.items.length>=24)return toast(L('先让这 24 组花材找到自己的位置，再添加。','Arrange these 24 materials before adding another.'));
 const a=assetById[type];if(!a)return;
 const {plan,fields}=naturalPlacement(type,placement);
 checkpoint();const item=makeItem(type,fields);
 if(placement==='back')state.items.unshift(item);else if(placement==='front')state.items.push(item);else state.items.splice(insertIndex(state.items,item,assetById),0,item);
 selected=item.id;rememberMaterial(type);closeQuickMaterialDrawer();setEditMode('move');renderStage();
 ensureAsset(type).then(()=>{if(state.items.some(i=>i.id===item.id))renderStage()}).catch(()=>toast(L('这枝花材暂时无法载入。','This material could not be loaded.')));persist();
 const name=assetName(a),slot=slotName(plan.slot);
 undoToast(L(`添入${a.bundle?'一组':'一枝'}${name} · ${slot}`,`Added ${name} · ${slot}`,`${name}を加えました · ${slot}`));
}
/**
 * Where a new stem goes (planSlot in scale.js): the free 真·副·控 or 添え slot for its role, base in the mouth, focus solved
 * with solveTo (photographs cut, drawn stems within their species' length), lowered, leaned or shrunk to keep 3 cm below the
 * stage top. aboveVessel follows the vessel (kenzan, or an insertion above the front rim) and low blooms, unless `placement`
 * says 'front' or 'back'. While the ikebana guide is shown, its style and side apply, so the stem lands on a drawn ray.
 */
function naturalPlacement(type,placement='auto'){
 const a=assetById[type],plan=planSlot(state,a,assetById,{},guidePlan()),{miss:_,...fit}=plan.fit;
 return {plan,fields:{h:plan.h,flip:plan.flip,...fit,aboveVessel:placement==='front'||(placement!=='back'&&plan.front)}};
}
/** Whether a stem stands in the current vessel (a detached piece: by its cut end); see seatState in scale.js. */
const isSeated=item=>{const a=assetById[item.type],vessel=assetById[state.vessel];return !!a&&!!vessel&&seatState(item,a,vessel).seated};
/** Stems the seat banner offers to put back: out of the vessel, and not a detached cut piece (pieces lie where they were dropped). */
const floatingItems=()=>state.items.filter(item=>!isDetachedPiece(item)&&assetById[item.type]&&!isSeated(item));
const stageDistance=(p,q)=>Math.hypot(p[0]-q[0],p[1]-q[1]);
/** Apply `change` to a stem. A detached piece keeps its cut end where it is, so it turns, scales and mirrors about the point it was cut at. */
function aboutCutEnd(item,change){
 const a=assetById[item.type],uv=cutEndSource(item,a),at=uv&&seatPoint(item,a);
 change(item);
 if(uv){const p=anchorAt(item,a,uv,at);item.x=clamp(p.x,5,95);item.y=clamp(p.y,15,95)}
}
/**
 * Into the vessel for one stem. One that already stands in it is left alone (no undo step). Otherwise its base goes to the
 * mouth and it is re-aimed at its old focus: solveTo (photographs are cut, drawn stems grow), or reach for a stem with cuts so
 * the cuts keep their place; a detached piece turns about its real cut end (reseatPiece). When the focus lands more than 3 cm
 * from where it was, the toast says so. `quiet` (Seat all) skips the checkpoint, render and toast. Returns {miss} in cm.
 */
function reseatItem(item,{quiet=false}={}){
 const a=assetById[item.type],vessel=assetById[state.vessel];if(!a||!vessel)return null;
 if(seatState(item,a,vessel).seated){if(!quiet)toast(L('已在花器中','Already in the vessel','すでに花器に入っています'));return {already:true,miss:0}}
 if(!quiet)checkpoint();
 let miss=0;
 if(cutEndSource(item,a)){const fit=reseatPiece(item,a,vessel,pieceHead(item,a,specimenCanvas(item)?.mask));item.x=fit.x;item.y=fit.y;item.angle=fit.angle;miss=fit.miss}
 else{
  const target=tipPoint(item,a),base=mouthBase(vessel,item.x,.55,{front:!!item.aboveVessel});
  if(item.cuts?.length||item.segments?.length||item.localCuts?.length)Object.assign(item,reach(item,a,base,target),{cropAnchorSourceY:null});
  else{const {miss:_,...fit}=solveTo(item,a,base,target);Object.assign(item,fit)}
  miss=stageDistance(tipPoint(item,a),target);
 }
 if(!quiet){renderStage();persist();undoToast(miss>3?L('够不到原来的位置，已插回并保持方向','Too short to reach that spot — inserted, direction kept','届かないため、向きを保って挿し直しました'):L('枝梗已插回花器口，花头位置尽量保持不变。','The stem now enters the vessel; the flower stays where it was as far as possible.','茎を花器の口に挿し直しました。花の位置はできるだけ保っています。'))}
 return {miss};
}
function reseatSelected(){const item=current();if(item)reseatItem(item)}
/** Phones and short windows (B4): after a vessel is picked far down the page, bring the canvas back into view. */
function revealCanvas(){
 if(!mediaMatches(COMPACT_STUDIO))return;
 const view=$('#canvas-viewport'),r=view?.getBoundingClientRect();if(!r||(r.top>=-1&&r.bottom<=innerHeight+1)||(r.top<=0&&r.bottom>=innerHeight))return;
 view.scrollIntoView({block:r.height>innerHeight?'start':'nearest',behavior:mediaMatches('(prefers-reduced-motion: reduce)')?'auto':'smooth'});
}
/**
 * Change the vessel in one undo step. Every stem moves with the insertion point; those that stood in the old vessel are
 * re-seated at the same place in the new mouth and re-aimed at their focus (remapSeated in scale.js). The toast counts them,
 * and warns when a re-seated bundle meets a mouth under 8 cm (its drawn stems spread wider than that).
 */
function switchVessel(type){
 const from=assetById[state.vessel],to=assetById[type];if(!to||state.vessel===type)return;
 checkpoint();
 const moved=new Set(from?state.items.filter(i=>!isDetachedPiece(i)&&assetById[i.type]&&seatState(i,assetById[i.type],from).seated).map(i=>i.id):[]);
 state.items=from?remapSeated(state.items,from,to,assetById):state.items;state.vessel=type;
 renderStage();renderMaterials();if(!$('#quick-material-drawer').hidden)renderQuickMaterials();persist();revealCanvas();
 const name=assetName(to),support=fixtureName(to),n=moved.size,g=vesselGeometry(to),mouth=g.openings.find(o=>o.primary)||g.openings[0];
 const narrow=!!mouth&&mouth.radius[0]*2<8&&state.items.some(i=>moved.has(i.id)&&assetById[i.type]?.bundle);
 undoToast((lang==='ja'?`${name}に変更しました · 花留め：${support}`:L(`已换成${name} · 自动固定：${support}`,`Changed to ${name} · Auto support: ${support}`))+(n?L(` · ${n} 枝已插回瓶口`,` · ${n} stem${n>1?'s':''} re-seated`,` · ${n}本を口に挿し直しました`):'')+(narrow?L(' · 成组花材底部较宽，窄口瓶里可能露在瓶外',' · Grouped stems spread wider than this neck',' · 束の根元が口より広がります'):''));
}
/** Seat all (the banner): one undo step for every stem the banner counts. */
function seatAll(){
 const list=floatingItems();if(!list.length)return;
 checkpoint();let short=0;for(const item of list)if((reseatItem(item,{quiet:true})?.miss||0)>3)short++;
 renderStage();persist();const n=list.length;
 undoToast(short?L(`已插回 ${n} 枝；其中 ${short} 枝够不到原来的位置，已保持方向`,`Seated ${n} stem${n>1?'s':''}; ${short} could not reach ${short>1?'their':'its'} spot, direction kept`,`${n}本を挿し直しました。${short}本は届かないため、向きを保っています`):L(`已插回 ${n} 枝`,`Seated ${n} stem${n>1?'s':''}`,`${n}本を挿し直しました`));
}
const baseMark=(item,kind)=>{const p=seatPoint(item,assetById[item.type]);return `<i class="base-dot ${kind}" style="left:${Math.round(p[0]*100)/100}%;top:${Math.round(p[1]*100)/100}%"></i>`};
/**
 * A quiet handle for the selected stem. Placement outside the vessel is a creative choice, without warnings.
 */
function renderSeatCues(){
 const move=editMode==='move';
 $$('#stage .stem').forEach(n=>n.classList.remove('floating'));
 const marks=$('#seat-marks');
 if(marks){const item=move?current():null;marks.innerHTML=item?baseMark(item,'selected'):''}
 const banner=$('#seat-banner');if(banner)banner.hidden=true;
}
/** Guide ring glyphs (all languages) and the slot names its readout uses. */
const guideGlyphs={shin:'真',soe:'副',hikae:'控'};
const guideNames={shin:['主枝','Main line','真'],soe:['副枝','Second line','副'],hikae:['客枝','Accent','控']};
const guideName=key=>(guideNames[key]||guideNames.shin)[localeIndex(lang)];
const guideOn=()=>!!$('#guide')&&!$('#guide').hidden;
const guideHand=()=>guidePrefs.hand&&guidePrefs.hand.id===state.id?guidePrefs.hand.side:0;
/** What planSlot gets from the guide: its style and side while it is shown (so a new stem lands on a drawn ray), else nothing. */
const guidePlan=()=>guideOn()?{style:guidePrefs.style,side:guideHand()}:{};
function saveGuidePrefs(){try{localStorage.setItem(GUIDE_STORE,JSON.stringify(guidePrefs))}catch{}}
/** Show or hide the guide and its panel (#guide-button keeps aria-pressed). */
function setGuide(on,{render=true}={}){
 $('#guide').hidden=!on;$('#guide-panel').hidden=!on;$('#guide-button').setAttribute('aria-pressed',String(on));
 if(render)renderGuide();else if(!on){$('#ikebana-guide').innerHTML='';guideView=null}
}
/** Rough SVG text width in stage units (CJK glyphs a full em, others about half). */
const guideTextWidth=(text,fs)=>[...text].reduce((w,ch)=>w+(/[\u2e80-\u9fff\uf900-\ufaff\uff00-\uffef]/.test(ch)?1:.56),0)*fs;
/** Set a ring's label ([bold head, rest]) and keep it inside the stage: beside the ring, on the far side from the insertion. */
function placeGuideLabel(node,[head,rest]){
 const {ray,r,fs}=node,dx=ray.target[0]-ray.from[0],dy=ray.target[1]-ray.from[1],len=Math.hypot(dx,dy)||1,ux=dx/len,uy=dy/len;
 const w=guideTextWidth(head+rest,fs),side=Math.abs(ux)>=.4;let x=ray.target[0]+ux*(r+fs*.45),y=ray.target[1]+uy*(r+fs*.45);
 if(side){y+=fs*.35;x=ux>0?clamp(x,1.5,98.5-w):clamp(x,1.5+w,98.5)}else x=clamp(x,1.5+w/2,98.5-w/2);
 y=clamp(y,fs+.5,98.5);
 node.text.setAttribute('x',x.toFixed(2));node.text.setAttribute('y',y.toFixed(2));node.text.setAttribute('text-anchor',side?(ux>0?'start':'end'):'middle');
 node.text.firstChild.textContent=head;node.text.lastChild.textContent=rest;node.label=head+rest;
}
/**
 * Ikebana guide (A13): dashed rays from the insertion to the 真·副·控 targets for this vessel, from the same slots planSlot
 * fills (guideRays in scale.js), so the guide shows where the next line goes. The SVG's viewBox is the 100 cm stage, so one
 * unit is one centimetre. Labels sit outside the rings; "≈" marks a ray the stage cut short. The old thirds grid is an
 * option. Off by default, DOM only and outside #composition, so exports never include it. renderGuide rebuilds it (vessel,
 * side, style, language, size); queueGuide only relights the ring nearest the active stem (lightGuide).
 */
function renderGuide(){
 const svg=$('#ikebana-guide');if(!svg)return;
 $$('[data-guide-style]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.guideStyle===guidePrefs.style)));
 $('#guide-thirds')?.setAttribute('aria-pressed',String(guidePrefs.thirds));
 const vessel=assetById[state.vessel];
 if(!guideOn()||!vessel){if(guideView){svg.innerHTML='';guideView=null}return}
 const side=slotState(state,assetById,{style:guidePrefs.style,side:guideHand()}).side,rays=guideRays(vessel,{style:guidePrefs.style,side});
 $$('[data-guide-hand]').forEach(b=>b.setAttribute('aria-pressed',String(+b.dataset.guideHand===side)));
 const w=$('#stage')?.getBoundingClientRect().width||stageWidth(),unit=100/Math.max(120,w),fs=clamp(11*unit,1.6,3.6),r=clamp(8*unit,1.4,2.6),f=n=>n.toFixed(2);
 const thirds=guidePrefs.thirds?`<g class="guide-thirds"><path d="M20 76H80M39.8 12V76M59.6 12V76"/><text x="80" y="${f(76-fs*.7)}" text-anchor="end" font-size="${f(fs*.9)}">${esc(L('让枝条伸向留白','Let the stem reach into space','枝を余白へ伸ばす'))}</text></g>`:'';
 const from=rays[0].from;
 svg.innerHTML=thirds+`<circle class="guide-origin" cx="${f(from[0])}" cy="${f(from[1])}" r="${f(r*.32)}"/>`+rays.map(ray=>{
  const dx=ray.target[0]-ray.from[0],dy=ray.target[1]-ray.from[1],len=Math.hypot(dx,dy)||1,end=[ray.target[0]-dx/len*r,ray.target[1]-dy/len*r];
  return `<g class="guide-ray" data-guide-key="${ray.key}"><line x1="${f(ray.from[0])}" y1="${f(ray.from[1])}" x2="${f(end[0])}" y2="${f(end[1])}"/><circle cx="${f(ray.target[0])}" cy="${f(ray.target[1])}" r="${f(r)}"/><text font-size="${f(fs)}" stroke-width="${f(fs*.28)}"><tspan class="guide-glyph"></tspan><tspan></tspan></text></g>`;
 }).join('');
 const nodes={};
 for(const ray of rays){
  const g=svg.querySelector(`[data-guide-key="${ray.key}"]`);
  nodes[ray.key]={ray,g,text:g.querySelector('text'),r,fs,base:[guideGlyphs[ray.key],` ${ray.clamped?'≈':''}${Math.round(ray.cm)} cm`],label:''};
  placeGuideLabel(nodes[ray.key],nodes[ray.key].base);
 }
 guideView={rays,nodes,lit:null,side};
 lightGuide();
}
function queueGuide(){if(!guideView||guideFrame)return;guideFrame=requestAnimationFrame(()=>{guideFrame=0;lightGuide()})}
/**
 * The ring nearest the active stem's focus or crown (the dragged or pinched stem, else the selected one) lights up and reads
 * "主枝 41 / 46 cm"; within 3 cm it fills. The panel shows the same reading with the reach as a multiple of the vessel, and
 * offers to put the selected stem on that line. Touches at most two rings, their labels and the panel line.
 */
function lightGuide(){
 if(!guideView)return;
 const item=drag?.item||gesture?.item||current(),a=item&&assetById[item.type],vessel=assetById[state.vessel];
 const reading=item&&a&&vessel?guideReading(item,a,vessel,guideView.rays):null,key=reading?.key||null;
 if(guideView.lit&&guideView.lit!==key){const old=guideView.nodes[guideView.lit];old.g.classList.remove('lit','filled');placeGuideLabel(old,old.base)}
 if(key){const node=guideView.nodes[key],label=[guideName(key),` ${reading.reach} / ${reading.target} cm`];node.g.classList.add('lit');node.g.classList.toggle('filled',reading.filled);if(node.label!==label.join(''))placeGuideLabel(node,label)}
 guideView.lit=key;
 const line=$('#guide-reading'),fit=$('#guide-fit');if(!line)return;
 const text=reading?`${guideName(key)} ${reading.reach} / ${reading.target} cm · ${L(`≈${reading.ratio}× 花器`,`≈${reading.ratio}× the vessel`,`花器の約${reading.ratio}倍`)}`:L('选中一枝，看看它离哪条线最近。','Select a stem to see which line it is nearest.','花材を選ぶと、近い線と長さを表示します。');
 if(line.textContent!==text)line.textContent=text;
 const offer=!!reading&&!drag&&!gesture&&!isDetachedPiece(item)&&reading.gap>=1;
 if(fit.hidden===offer)fit.hidden=!offer;
}
/** "Put on this line": the selected stem's focus onto the lit ray's target (fitToSlot), one undo step. */
function putOnGuideLine(){
 const item=current(),a=item&&assetById[item.type],vessel=assetById[state.vessel];if(!item||!a||!vessel||!guideView||isDetachedPiece(item))return;
 const reading=guideReading(item,a,vessel,guideView.rays),ray=reading&&guideView.rays.find(r=>r.key===reading.key);if(!ray)return;
 checkpoint();const {miss,...fit}=fitToSlot(item,a,vessel,ray.target);Object.assign(item,fit);
 renderStage();persist();
 const [zh,en]=guideNames[ray.key];
 undoToast(miss>3?L('够不到这条线，已尽量靠近','Too short to reach this line — brought as close as it goes','この線には届かないため、できるだけ近づけました'):L(`已放到${zh}线上`,`Put on the guide’s ${en.toLowerCase()}`,`${guideGlyphs[ray.key]}の線に合わせました`));
}
$$('[data-guide-style]').forEach(b=>b.onclick=()=>{guidePrefs.style=b.dataset.guideStyle==='slanting'?'slanting':'upright';saveGuidePrefs();renderGuide()});
$$('[data-guide-hand]').forEach(b=>b.onclick=()=>{guidePrefs.hand={id:state.id,side:+b.dataset.guideHand===-1?-1:1};saveGuidePrefs();renderGuide()});
$('#guide-thirds').onclick=()=>{guidePrefs.thirds=!guidePrefs.thirds;saveGuidePrefs();renderGuide()};
$('#guide-fit').onclick=putOnGuideLine;
/** A stem back at its material's real size; a drawn stem keeps its length in cm. */
function restoreRealSize(item){const a=assetById[item.type];if(!a)return;const cm=drawsStem(a)?stemCm(item,a):null;item.h=a.height;if(cm!==null)item.length=lengthForStem(item,a,cm)}
function resetRealSize(){
 const item=current();if(!item)return;checkpoint();restoreRealSize(item);
 renderStage();persist();undoToast(L('已恢复真实比例。','Restored to true-to-life size.','実寸に戻しました。'));
}
function variantPicker(family,replaceId=null,preferredColor='all'){
 const selectedType=state.items.find(i=>i.id===replaceId)?.type;
 const allOptions=librarySpecimens.filter(a=>a.family===family).sort((a,b)=>Number(isLibraryCurated(b))-Number(isLibraryCurated(a))||Number(legacyFlowers.includes(a))-Number(legacyFlowers.includes(b)));
 const colorOptions=preferredColor==='all'||replaceId?allOptions:allOptions.filter(a=>matchesMaterialColor(a,preferredColor));
 const options=colorOptions.length?colorOptions:allOptions;
 if(!options.length)return;
 // Shape first (B8): each pose says what it looks like (displayPose); where its picture comes from is a small badge, and the
 // provenance notes fold into one 关于素材 under the grid. The re-trim warning stays in view.
 const notes=[options.some(a=>a.source==='flower-book-photo')?(lang==='ja'?'原書の花びら・色・複数の枝を保った写真です。ひとつのレイヤーとして配置し、付け根を局所的に切れます。':L('原书实拍：保留花瓣、色彩和多枝组合。成组花材可局部剪开。','Original Flower Book photographs retain their petals, colors and groupings. Cut locally at an attachment to separate a piece.')):'',
  options.some(a=>a.source==='generated-foliage')?(lang==='ja'?'透明の葉もの素材は制作した画像です。実物写真ではありません。':L('透明叶材为创作用图像，不是实物摄影。','These transparent foliage cutouts are rendered artwork, not photographs.')):'',
  options.some(a=>a.source==='generated-pose')?L('新增姿态参考原素材辅助制作，保留原姿态供选择。','New poses were made with AI assistance from the original specimens; the originals remain available.','新しい姿は元の花材を参考にAIの補助で制作しました。元の姿も選べます。'):''].filter(Boolean);
 const variantCard=a=>{const pose=displayPose(a,lang),badge=provenance(a,lang);return `<button class="variant-card ${a.id===selectedType?'active':''}" data-variant="${a.id}"><img src="${cardImage(a)}" alt="${esc(assetColor(a)+' '+pose)}" loading="lazy" decoding="async">${badge?`<span class="variant-badge" data-provenance="${badge.key}" title="${esc(badge.title)}">${esc(badge.label)}</span>`:''}<strong><i style="background:${a.swatch}"></i>${esc(assetColor(a))}</strong><span>${esc(pose)}</span><small class="variant-size">${esc(sizeText(sizeFor(a),lang))}</small></button>`};
 openModal(`<h2>${esc(L(`${assetName(options[0])}，选一种喜欢的姿态。`,`Choose a pose for ${assetName(options[0])}.`,`${assetName(options[0])}の姿を選ぶ`))}</h2><p>${esc(botanicalDescription(family))} · ${options.length} ${L('种姿态','poses','の姿')}</p><div class="variant-grid variant-grid-primary">${options.map(variantCard).join('')}</div>${replaceId&&(current()?.cuts.length||current()?.localCuts?.length)?`<p class="file-note">${L('换姿态会恢复这枝的剪口，便于重新修剪；可以撤销恢复。','Changing pose restores this stem before pruning so you can trim it again; Undo remains available.')}</p>`:''}${notes.length?`<details class="material-about"><summary>${esc(L('关于素材','About this material','素材について'))}</summary>${notes.map(note=>`<p class="file-note">${esc(note)}</p>`).join('')}</details>`:''}`,'BOTANICAL VARIATIONS');
 toneMaterialImages($('#modal'));
 $$('[data-variant]').forEach(b=>b.onclick=()=>{if(replaceId){const i=state.items.find(i=>i.id===replaceId);if(!i)return;if(i.type!==b.dataset.variant){const hadCuts=!!(i.cuts?.length||i.localCuts?.length||i.segments?.length);checkpoint();const before=assetById[i.type],tip=tipPoint(i,before),after=assetById[b.dataset.variant],ratio=clamp(i.h/before.height,...sizeRatioBounds(after));i.type=b.dataset.variant;i.cuts=[];i.localCuts=[];i.segments=[];i.pieceLabel='';i.sv=2;i.h=Math.round(after.height*ratio*10)/10;i.trim=0;i.length=1;delete i.stemSplit;const {miss:_,...fit}=solveTo(i,after,[i.x,i.y],tip);Object.assign(i,fit);spriteCache.delete(i.id);selected=i.id;renderStage();ensureAsset(i.type).then(()=>{if(state.items.some(item=>item.id===i.id&&item.type===i.type))renderStage()}).catch(()=>toast(L('这枝花材暂时无法载入。','This material could not be loaded.')));persist();if(hadCuts)undoToast(L('剪口已重置','Cuts reset','剪定をリセット'))}}else addSpecimen(b.dataset.variant);$('#modal').close();document.querySelector('.stem.selected')?.focus({preventScroll:true})});
}
$('#change-variant').onclick=()=>{const i=current();if(i)variantPicker(assetById[i.type].family,i.id)};
/**
 * Library cards (A15, B4). The left library and the quick sheet share one card renderer, one set of words (library.js
 * cardMeta, zh/en/ja) and one search. Plants are listed by role (line, focal, supporting, filler, foliage), tallest first, with
 * role headers under 全部; 花之书 narrows any role to the Flower Book families. Size chips give the true size a material gets
 * as the first stem in the current vessel (cached per vessel).
 */
let familyBook=false,sizeCache={vessel:null,sizes:new Map()},searchIndex=null;
if(familyFilter==='atelier')familyFilter='all';
// Show every catalogued material; IDs, not family names, identify distinct poses.
const librarySpecimens=[...new Map(specimens.filter(a=>a?.id&&a.family&&assetById[a.id]).map(a=>[a.id,a])).values()];
const libraryVesselCatalog=[...new Map(vessels.filter(a=>a?.id&&assetById[a.id]).map(a=>[a.id,a])).values()];
const familyPoses=new Map([...new Set(librarySpecimens.map(a=>a.family))].map(family=>[family,librarySpecimens.filter(a=>a.family===family)]));
const libraryFamilies=[...familyPoses].map(([family,poses])=>({...poses[0],id:family,variants:poses.length}));
const bookFamilies=new Set(librarySpecimens.filter(a=>['flower-book-photo','flower-book'].includes(a.source)).map(a=>a.family));
// The new photographic collection supplies covers without hiding earlier materials.
const curatedLibrarySource=specimens.some(a=>a.source==='generated-editorial')?'generated-editorial':'generated-atelier';
const isLibraryCurated=a=>a?.source===curatedLibrarySource;
function sizeFor(a){
 const vessel=assetById[state.vessel];if(!vessel||!a)return null;
 if(sizeCache.vessel!==state.vessel)sizeCache={vessel:state.vessel,sizes:new Map()};
 if(!sizeCache.sizes.has(a.id)){let size=null;try{size=sizeOf(a,vessel)}catch{}sizeCache.sizes.set(a.id,size)}
 return sizeCache.sizes.get(a.id);
}
const familyHeight=f=>Math.max(0,...(familyPoses.get(f.family)||[]).map(a=>sizeFor(a)?.cm||0));
const libraryIndex=()=>searchIndex||=buildSearchIndex(libraryFamilies,libraryVesselCatalog,librarySpecimens);
const libraryCount=materials=>{const poses=materials.reduce((n,a)=>n+(a.libraryPoses||familyPoses.get(a.family)||[]).length,0);return L(`${materials.length} 类 · ${poses} 姿态`,`${materials.length} types · ${poses} poses`,`${materials.length}種類 · ${poses}の姿`)};
const colorChipName=color=>{const group=materialColorGroups.find(g=>g.id===color);return group?group[lang]||group.zh:''};
/**
 * 当季 / In season / 旬 (B8): the garden season from the month, two seasons on in a southern-hemisphere time zone. Pressing the
 * season chip again moves it on a season; that shift is kept in localStorage 'hanama-season' (0–3), so a wrong hemisphere guess
 * is fixed once. Seasons come from botany.js.
 */
const SEASON_STORE='hanama-season';
let seasonShift=0;try{seasonShift=seasonShiftOf(localStorage.getItem(SEASON_STORE))}catch{}
const timeZone=(()=>{try{return Intl.DateTimeFormat().resolvedOptions().timeZone||''}catch{return ''}})();
const librarySeason=()=>shiftSeason(currentSeason(new Date(),timeZone),seasonShift);
function cycleSeason(){seasonShift=(seasonShift+1)%4;try{if(seasonShift)localStorage.setItem(SEASON_STORE,String(seasonShift));else localStorage.removeItem(SEASON_STORE)}catch{}}
/** Both season chips: 当季 · 秋, with how to change the season in their aria-label and tooltip. */
function renderSeasonChips(){const chip=seasonChip(librarySeason(),lang);$$('[data-family-group="season"],[data-quick-family-group="season"]').forEach(b=>{const name=$('[data-season-name]',b);if(name&&name.textContent!==chip.name)name.textContent=chip.name;b.setAttribute('aria-label',chip.aria);b.title=chip.aria})}
const seasonFilterName=()=>{const chip=seasonChip(librarySeason(),lang);return `${chip.label} · ${chip.name}`};
const filterName=role=>role==='atelier'?L('精选','Studio selection','アトリエの花材'):role==='season'?seasonFilterName():roleLabel(role,lang);
/** Families that pass a role or season chip, the 花之书 toggle and a colour chip, then the search: best match first, else
 role, in season, then height. */
function libraryFlowers(role,book,color,query){
 const hits=libraryIndex().match(query,'flowers'),season=librarySeason(),effectiveRole=role==='atelier'?'all':role;
 const fits=a=>effectiveRole==='season'?matchesSeason(a,season):matchesRole(a,effectiveRole);
 const posesFor=family=>(familyPoses.get(family)||[]).filter(a=>(!book||['flower-book-photo','flower-book'].includes(a.source))&&matchesMaterialColor(a,color));
 const candidates=libraryFamilies.filter(a=>fits(a)&&(!book||bookFamilies.has(a.family))&&posesFor(a.family).length&&(!hits||hits.has(a.id)));
 const list=sortByRole(candidates.map(a=>({...a,libraryPoses:posesFor(a.family)})),familyHeight,a=>matchesSeason(a,season));
 return hits?list.sort((p,q)=>hits.get(q.id)-hits.get(p.id)):list;
}
function libraryVessels(style,query){
 const hits=libraryIndex().match(query,'vessels'),list=libraryVesselCatalog.filter(a=>(style==='all'||(style==='book'?a.source==='flower-book-vessel':(a.style||'japanese')===style))&&(!hits||hits.has(a.id)));
 return hits?list.sort((p,q)=>hits.get(q.id)-hits.get(p.id)):list;
}
/** A family card: picture, name, then its role and true size (线条 · ≈47–65 cm). Under a role header or a role chip (`grouped`)
 the role would only repeat it, so it is kept only for families with a second job (lily: 线条 · 主花). */
function flowerCard(a,attr,color='all',extra='',grouped=false){
 const poses=a.libraryPoses||familyPoses.get(a.family)||[a],m=cardMeta(a,lang,{vessel:assetById[state.vessel],poses,size:sizeFor}),cover=poses.find(p=>isLibraryCurated(p)&&matchesMaterialColor(p,color))||coverFor(a.family,poses,color)||specimenFor(a.family),kicker=grouped&&rolesOf(a).length<2?'':m.kicker;
 const season=seasonMark(a,librarySeason(),lang),label=season?`${m.label} · ${season.title}`:m.label;
 return `<button type="button" class="material-card${extra}" ${attr}="${esc(a.family)}" aria-label="${esc(label)}"><span class="add-mark" aria-hidden="true">+</span><span class="card-figure"><img src="${cardImage(cover)}" alt="" loading="lazy" decoding="async" draggable="false">${m.badge?`<span class="card-badge">${esc(m.badge)}</span>`:''}${season?`<span class="card-season${season.now?' is-now':''}" data-season="${season.key}" title="${esc(season.title)}" aria-hidden="true">${esc(season.text)}</span>`:''}</span><strong>${esc(cardName(a,lang))}</strong><small class="card-size">${kicker?`<span class="card-role">${esc(kicker)}</span> · `:''}${esc(m.size)}</small></button>`;
}
function vesselCard(a,attr,extra=''){
 const m=cardMeta(a,lang),active=a.id===state.vessel;
 return `<button type="button" class="material-card vessel-card${extra}${active?' active':''}" ${attr}="${esc(a.id)}" aria-pressed="${active}" aria-label="${esc(m.label)}"><span class="card-figure"><img src="${isLibraryCurated(a)?cardImage(a):`/assets/thumbs/${a.id}.webp`}" alt="" loading="lazy" decoding="async" draggable="false">${m.badge?`<span class="card-badge">${esc(m.badge)}</span>`:''}</span><strong>${esc(cardName(a,lang))}</strong><small class="vessel-meta"><span class="card-role">${esc(m.kicker)}</span> · ${esc(m.size)}</small><small class="vessel-fit">${esc(m.fit)}</small></button>`;
}
/** Cards, with a role header before each role's run when `grouped` (role chip 全部, no search); card(a, grouped). */
function libraryCards(list,card,grouped){
 if(!grouped)return list.map(a=>card(a,false)).join('');
 return roleGroups(list).map(group=>`<h3 class="material-role-heading"><span>${esc(roleLabel(group.role,lang))}</span><small>${group.items.length}</small></h3>${group.items.map(a=>card(a,true)).join('')}`).join('');
}
/** What an empty grid says: the active filters by name, and a button that clears them (flowers or vessels). */
function libraryEmpty(kind,filters,query){
 const any=filters.length>0||!!String(query).trim();
 return `<span>${esc(emptyText(lang,{kind,filters,query}))}</span>${any?`<button type="button" class="clear-filters" data-clear-filters>${esc(clearFiltersLabel(lang))}</button>`:''}`;
}
const pressChips=(selector,key,value)=>$$(selector).forEach(button=>{const on=button.dataset[key]===value;button.classList.toggle('active',on);button.setAttribute('aria-pressed',String(on))});
const pressToggle=(selector,on)=>$$(selector).forEach(button=>{button.classList.toggle('active',on);button.setAttribute('aria-pressed',String(on))});
function renderMaterials(){
 const query=$('#material-search').value,flowersTab=category==='flowers',grid=$('#material-grid');
 const materials=flowersTab?libraryFlowers(familyFilter,familyBook,colorFilter,query):libraryVessels(vesselFilter,query);
 const filters=flowersTab?[familyFilter!=='all'?filterName(familyFilter):'',familyBook?vesselStyleName('book'):'',colorFilter!=='all'?colorChipName(colorFilter):''].filter(Boolean):[vesselFilter!=='all'?vesselStyleName(vesselFilter):''].filter(Boolean);
 $('#material-filters').hidden=!flowersTab;$('#material-color-filters').hidden=!flowersTab;$('#vessel-filters').hidden=flowersTab;$('#material-heading').textContent=flowersTab?L('一枝一叶','Botanicals'):L('一器一境','Vessels');
 const filtered=filters.length>0||!!query.trim(),n=materials.length;
 $('#material-count').textContent=flowersTab?libraryCount(materials):L(`${n} 款花器`,`${n} vessels`,`${n}点の花器`);
 pressChips('[data-family-group]','familyGroup',familyFilter==='atelier'?'all':familyFilter);renderSeasonChips();pressToggle('[data-family-book]',familyBook);pressChips('[data-color-group]','colorGroup',colorFilter);pressChips('[data-vessel-style]','vesselStyle',vesselFilter);
 grid.innerHTML=!n?`<div class="material-grid-empty">${libraryEmpty(flowersTab?'flowers':'vessels',filters,query)}</div>`:flowersTab?libraryCards(materials,(a,grouped)=>flowerCard(a,'data-material',colorFilter,'',grouped||!['all','season'].includes(familyFilter)),['all','season'].includes(familyFilter)&&!query.trim()):materials.map(a=>vesselCard(a,'data-material')).join('');
 grid.onclick=e=>{
  if(e.target.closest('[data-clear-filters]')){if(flowersTab){familyFilter='all';familyBook=false;colorFilter='all'}else vesselFilter='all';$('#material-search').value='';renderMaterials();$(flowersTab?'[data-family-group="all"]':'[data-vessel-style="all"]')?.focus({preventScroll:true});return}
  const b=e.target.closest('[data-material]');if(!b)return;const type=b.dataset.material;if(category==='vessels')switchVessel(type);else if(b.dataset.directSpecimen)addSpecimen(b.dataset.directSpecimen);else variantPicker(type,null,colorFilter);
 };
 toneMaterialImages(grid);
}
/**
 * Recent strip (B8): the exact poses last added, newest first, in localStorage 'hanama-recent-materials-v2' (variant ids). The
 * old key held families; they map to the family's first photograph (specimenFor), as the strip used to show. A tap adds that
 * pose again where a florist would put it (addSpecimen, auto placement); ⋯ opens the family's poses.
 */
const RECENT_MATERIALS='hanama-recent-materials',RECENT_POSES='hanama-recent-materials-v2',RECENT_SLOTS=3;
let quickFilter='all',quickColorFilter='all',quickBook=false,quickMode='flowers',quickVesselFilter='all',quickRecent=[];
const recentPose=id=>{const a=typeof id==='string'&&Object.hasOwn(assetById,id)?assetById[id]:null;return a?.family?a:null};
{
 const read=key=>{try{const saved=JSON.parse(localStorage.getItem(key)||'null');return Array.isArray(saved)?saved:null}catch{return null}};
 const v2=read(RECENT_POSES),old=v2?null:read(RECENT_MATERIALS);
 const ids=v2||(old||[]).map(family=>flowers.some(f=>f.id===family)?specimenFor(family)?.id:null);
 quickRecent=[...new Set(ids.filter(id=>recentPose(id)))].slice(0,RECENT_SLOTS);
}
if(!quickRecent.length)quickRecent=[...new Set([...state.items].reverse().map(i=>i.type).filter(id=>recentPose(id)))].slice(0,RECENT_SLOTS);
function rememberMaterial(type){if(!recentPose(type))return;quickRecent=[type,...quickRecent.filter(id=>id!==type)].slice(0,RECENT_SLOTS);try{localStorage.setItem(RECENT_POSES,JSON.stringify(quickRecent))}catch{}renderRecentMaterials()}
function renderRecentMaterials(){
 const group=$('#quick-material-recent');if(!group)return;
 const recent=quickRecent.map(recentPose).filter(Boolean);group.hidden=!recent.length;
 $$('[data-recent-slot]',group).forEach((slot,index)=>{
  const a=recent[index],add=$('[data-quick-recent]',slot),more=$('[data-recent-more]',slot);slot.hidden=!a;add.disabled=more.disabled=!a;if(!a)return;
  const name=assetName(a),pose=displayPose(a,lang);add.dataset.quickRecent=a.id;more.dataset.recentMore=a.family;
  add.setAttribute('aria-label',L(`再添一枝${name} · ${pose}`,`Add another ${name} · ${pose}`,`${name}（${pose}）をもう一本`));add.title=`${name} · ${pose}`;
  more.setAttribute('aria-label',L(`${name}：换一种姿态`,`${name}: choose another pose`,`${name}の別の姿を選ぶ`));more.title=more.getAttribute('aria-label');
  const img=$('img',add);if(img?.dataset.id!==a.id){add.innerHTML=`<img src="${cardImage(a)}" alt="" decoding="async" data-id="${a.id}">`}
 });
 toneMaterialImages(group);
}
/** Words on the quick sheet that change with its mode (plants or vessels), kept in the data-* attributes applyLanguage reads. */
const QUICK_WORDS={
 flowers:{title:['挑一枝','Choose a stem','一枝を選ぶ'],aria:['挑选花材','Choose a material','花材を選ぶ'],search:['搜索花材','Search materials','花材を検索'],hint:['点选即加入画布','Pick a stem to add it','選ぶとキャンバスに加わります'],eyebrow:'BOTANICAL LIBRARY'},
 vessels:{title:['换个花器','Choose a vessel','花器を選ぶ'],aria:['挑选花器','Choose a vessel','花器を選ぶ'],search:['搜索花器','Search vessels','花器を検索'],hint:['点选即换，插好的花枝随之移过去','Pick one to switch; seated stems move along','選ぶと入れ替わり、挿した花も移ります'],eyebrow:'VESSEL LIBRARY'}
};
function setWords(el,[zh,en,ja],kind=''){
 if(!el)return;const key=part=>kind?`${kind}${part[0].toUpperCase()}${part.slice(1)}`:part;
 el.dataset[key('zh')]=zh;el.dataset[key('en')]=en;el.dataset[key('ja')]=ja;const text=L(zh,en,ja);
 if(kind==='aria')el.setAttribute('aria-label',text);else if(kind==='placeholder')el.placeholder=text;else el.textContent=text;
}
function renderLibraryScope(){
 const button=$('#library-scope-toggle');if(button){button.hidden=true;button.onclick=null;}$('#quick-material-drawer').dataset.scope='all';
}
function renderQuickMaterials(){
 const vesselMode=quickMode==='vessels',words=QUICK_WORDS[quickMode],search=$('#quick-material-search'),query=search.value,grid=$('#quick-material-grid'),empty=$('#quick-material-empty');
 $$('[data-quick-mode]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.quickMode===quickMode)));
 $('#quick-material-filters').hidden=vesselMode;$('#quick-material-color-filters').hidden=vesselMode;$('#quick-vessel-filters').hidden=!vesselMode;
 const drawer=$('#quick-material-drawer');drawer.dataset.mode=quickMode;setWords(drawer,words.aria,'aria');setWords($('#quick-material-title'),words.title);setWords(search,words.search,'placeholder');setWords($('.quick-material-search-label .sr-only'),words.search);setWords($('#quick-material-hint'),!vesselMode?['选择花材，再挑姿态与花色','Choose a material, then a pose and color','花材を選び、姿と色を決めます']:words.hint);
 const eyebrow=$('.quick-material-heading .eyebrow');if(eyebrow)eyebrow.textContent=words.eyebrow;
 const materials=vesselMode?libraryVessels(quickVesselFilter,query):libraryFlowers(quickFilter,quickBook,quickColorFilter,query),n=materials.length;
 const filters=vesselMode?[quickVesselFilter!=='all'?vesselStyleName(quickVesselFilter):''].filter(Boolean):[quickFilter!=='all'?filterName(quickFilter):'',quickBook?vesselStyleName('book'):'',quickColorFilter!=='all'?colorChipName(quickColorFilter):''].filter(Boolean);
 $('#quick-material-count').textContent=vesselMode?L(`${n} 款花器`,`${n} vessels`,`${n}点の花器`):libraryCount(materials);
 empty.hidden=!!n;empty.innerHTML=n?'':libraryEmpty(vesselMode?'vessels':'flowers',filters,query);
 grid.innerHTML=vesselMode?materials.map(a=>vesselCard(a,'data-quick-vessel',' quick-material-card')).join(''):libraryCards(materials,(a,grouped)=>flowerCard(a,'data-quick-material',quickColorFilter,' quick-material-card',grouped||!['all','season'].includes(quickFilter)),['all','season'].includes(quickFilter)&&!query.trim());
 pressChips('[data-quick-family-group]','quickFamilyGroup',quickFilter==='atelier'?'all':quickFilter);renderSeasonChips();pressToggle('[data-quick-book]',quickBook);pressChips('[data-quick-color-group]','quickColorGroup',quickColorFilter);pressChips('[data-quick-vessel-style]','quickVesselStyle',quickVesselFilter);
 toneMaterialImages(grid);
 const recent=$('#quick-material-recent'),scope=$('#library-scope-toggle');if(recent&&scope&&recent.parentElement!==drawer)scope.before(recent);
 renderRecentMaterials();renderLibraryScope();
}
function closeQuickMaterialDrawer({focus=false}={}){const drawer=$('#quick-material-drawer');if(drawer.hidden)return;drawer.hidden=true;drawer.style.transform='';sheetDrag=null;document.body.classList.remove('material-sheet-open');$('#quick-material-open').setAttribute('aria-expanded','false');if(focus)$('#quick-material-open').focus({preventScroll:true})}
/** Open the quick material sheet on plants (optionally on one filter: 'line' for the start card's "Start with a line") or on
 vessels (`mode`). On a portrait
 phone the canvas scrolls to the top of the screen first (scrollBy: the sticky layout's scroll-padding would offset a
 scrollIntoView), so the art shows above the sheet. Only a fine pointer with hover (a desktop) gets
 the search field focused; touch focuses the heading, which keeps the keyboard (and iOS input zoom) down. */
function openQuickMaterialDrawer({filter=null,mode='flowers'}={}){const drawer=$('#quick-material-drawer');mode=mode==='vessels'?'vessels':'flowers';if(mode!==quickMode){quickMode=mode;$('#quick-material-search').value=''}if(filter){quickFilter=filter;quickBook=false;quickColorFilter='all';$('#quick-material-search').value=''}closeLayerMenu();setEditMode('move');if(drawer.hidden&&!document.body.classList.contains('atelier-simple')&&mediaMatches('(max-width:900px) and (orientation:portrait)')){const frame=$('.stage-frame'),top=(getComputedStyle(frame).position==='sticky'?frame:$('#canvas-viewport')).getBoundingClientRect().top;if(Math.abs(top)>1)window.scrollBy({top,behavior:'instant'})}drawer.hidden=false;drawer.style.transform='';document.body.classList.add('material-sheet-open');$('#quick-material-open').setAttribute('aria-expanded','true');renderQuickMaterials();(filter?$(`[data-quick-family-group="${filter}"]`):mediaMatches('(hover:hover) and (pointer:fine)')?$('#quick-material-search'):$('#quick-material-title'))?.focus({preventScroll:true})}
$('#quick-material-open').onclick=()=>{if(!$('#quick-material-drawer').hidden){closeQuickMaterialDrawer({focus:true});return}openQuickMaterialDrawer()};
$('#quick-material-close').onclick=()=>closeQuickMaterialDrawer({focus:true});
$('#quick-material-search').oninput=renderQuickMaterials;
$('#quick-material-modes').onclick=e=>{const button=e.target.closest('[data-quick-mode]');if(!button||button.dataset.quickMode===quickMode)return;quickMode=button.dataset.quickMode==='vessels'?'vessels':'flowers';$('#quick-material-search').value='';renderQuickMaterials();$('#quick-material-grid').scrollTop=0};
$('#quick-material-filters').onclick=e=>{if(e.target.closest('[data-quick-book]')){quickBook=!quickBook;renderQuickMaterials();return}const button=e.target.closest('[data-quick-family-group]');if(!button)return;if(button.dataset.quickFamilyGroup==='season'&&quickFilter==='season'){cycleSeason();renderMaterials()}quickFilter=button.dataset.quickFamilyGroup;renderQuickMaterials()};
$('#quick-vessel-filters').onclick=e=>{const button=e.target.closest('[data-quick-vessel-style]');if(!button)return;quickVesselFilter=button.dataset.quickVesselStyle;renderQuickMaterials()};
$('#quick-material-empty').onclick=e=>{if(!e.target.closest('[data-clear-filters]'))return;if(quickMode==='vessels')quickVesselFilter='all';else{quickFilter='all';quickBook=false;quickColorFilter='all'}$('#quick-material-search').value='';renderQuickMaterials();$(quickMode==='vessels'?'[data-quick-vessel-style="all"]':'[data-quick-family-group="all"]')?.focus({preventScroll:true})};
$('#quick-material-color-filters').onclick=e=>{const button=e.target.closest('[data-quick-color-group]');if(!button)return;quickColorFilter=button.dataset.quickColorGroup;renderQuickMaterials()};
/** A vessel picked in the sheet: the sheet closes first (so the toast sits at the bottom again), then the vessel changes. */
$('#quick-material-grid').onclick=e=>{const vessel=e.target.closest('[data-quick-vessel]');if(vessel){closeQuickMaterialDrawer({focus:true});switchVessel(vessel.dataset.quickVessel);return}const button=e.target.closest('[data-quick-material]');if(button){if(button.dataset.directSpecimen)addSpecimen(button.dataset.directSpecimen);else variantPicker(button.dataset.quickMaterial,null,quickColorFilter)}};
$('#quick-material-recent').onclick=e=>{const more=e.target.closest('[data-recent-more]');if(more){if(more.dataset.recentMore)variantPicker(more.dataset.recentMore);return}const button=e.target.closest('[data-quick-recent]');if(button&&recentPose(button.dataset.quickRecent))addSpecimen(button.dataset.quickRecent)};
$('#quick-material-drawer').addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();closeQuickMaterialDrawer({focus:true})}});
/** The phone sheet closes from its scrim (shown by CSS while the sheet covers the page) or by dragging its heading down more
 than 80 px; the sheet follows the finger meanwhile. Only a sheet anchored to the bottom of the screen drags. */
$('#sheet-scrim').addEventListener('click',()=>closeQuickMaterialDrawer({focus:true}));
{const heading=$('.quick-material-heading'),drawer=$('#quick-material-drawer');
 heading.addEventListener('pointerdown',e=>{if(e.button!==0||e.target.closest('button')||drawer.hidden||getComputedStyle(drawer).position!=='fixed'||drawer.getBoundingClientRect().top<8)return;sheetDrag={pointer:e.pointerId,y:e.clientY,dy:0};try{heading.setPointerCapture(e.pointerId)}catch{}});
 heading.addEventListener('pointermove',e=>{if(sheetDrag?.pointer!==e.pointerId)return;sheetDrag.dy=Math.max(0,e.clientY-sheetDrag.y);drawer.style.transform=sheetDrag.dy?`translateY(${Math.round(sheetDrag.dy)}px)`:''});
 const endDrag=e=>{if(sheetDrag?.pointer!==e.pointerId)return;const close=e.type==='pointerup'&&sheetDrag.dy>80;sheetDrag=null;drawer.style.transform='';if(close)closeQuickMaterialDrawer({focus:true})};
 for(const type of ['pointerup','pointercancel','lostpointercapture'])heading.addEventListener(type,endDrag);
}
/** Beginner studies the start card offers: three spare three-stem studies, one per school. */
const STARTER_STUDIES=['cherry','calla-curves','winter-quince'];
let startCardClosed=false,startCardLang='';
/**
 * Start card (A12) over an empty canvas (after 新建画布 or 清空, or when the last stem goes): start with a line (the quick
 * sheet on its line filter), one of three beginner studies, or how it works. Its wrapper lets pointers through; only the card
 * takes them. Closing it lasts until the canvas has a stem again. DOM only; exports never include it.
 */
function renderStartCard(){
 const wrap=$('#start-card-wrap');if(!wrap)return;
 if(state.items.length)startCardClosed=false;
 const show=!state.items.length&&!startCardClosed;wrap.hidden=!show;if(!show||startCardLang===lang)return;
 const index=localeIndex(lang);startCardLang=lang;
 $('#start-studies').innerHTML=STARTER_STUDIES.map(id=>studies.find(study=>study.id===id)).filter(Boolean).map(study=>`<button type="button" class="start-study" data-start-study="${study.id}" aria-label="${esc(study.title[index])}" title="${esc(study.title[index])}"><img src="/previews/${study.id}.webp" width="600" height="600" alt="" loading="lazy" decoding="async"><span>${esc(study.title[index])}</span></button>`).join('');
}
$('#start-line').onclick=()=>openQuickMaterialDrawer({filter:'line'});
$('#start-help').onclick=()=>lang==='ja'?helpJapanese():help();
$('#start-card-close').onclick=()=>{startCardClosed=true;renderStartCard();$('#stage').focus({preventScroll:true})};
$('#start-studies').onclick=async e=>{
 const button=e.target.closest('[data-start-study]'),study=button&&studies.find(s=>s.id===button.dataset.startStudy);if(!study)return;
 const index=localeIndex(lang);button.disabled=true;
 try{await openStudy(study)}catch(err){toast(err.message)}finally{button.disabled=false}
};
$('#material-search').oninput=renderMaterials;
$$('[data-category]').forEach(b=>b.onclick=()=>{category=b.dataset.category;$('#material-search').value='';$$('[data-category]').forEach(t=>t.setAttribute('aria-selected',String(t===b)));renderMaterials()});
$$('[data-vessel-style]').forEach(b=>b.onclick=()=>{vesselFilter=b.dataset.vesselStyle;renderMaterials()});
$$('[data-family-group]').forEach(b=>b.onclick=()=>{if(b.dataset.familyGroup==='season'&&familyFilter==='season'){cycleSeason();renderQuickMaterials()}familyFilter=b.dataset.familyGroup;renderMaterials()});
$$('[data-family-book]').forEach(b=>b.onclick=()=>{familyBook=!familyBook;renderMaterials()});
$$('[data-color-group]').forEach(b=>b.onclick=()=>{colorFilter=b.dataset.colorGroup;renderMaterials()});
function pointerStage(e){const r=$('#stage').getBoundingClientRect();return [(e.clientX-r.left)/r.width,(e.clientY-r.top)/r.height]}
/**
 * The stem whose visible pixels are under a client point: each sprite's alpha mask (stem-pick.js), with the crop box as the
 * fallback while a sprite is missing. Tolerance `radius` is 6 CSS px (12 for touch); the selected stem wins within `keep`
 * unless a stem drawn above it is directly under the point (`selectedFirst`: it wins within `keep` regardless). Works at
 * any zoom and for stems that ignore pointer events (cut and erase modes). Returns {id, hits}; id is null on paper.
 */
function pickStem(clientX,clientY,{touch=false,radius=touch?12:6,keep=radius,selectedFirst=false}={}){
 const rect=$('#stage').getBoundingClientRect();if(!(rect.width>0&&rect.height>0))return {id:null,hits:[]};
 const point=[(clientX-rect.left)/rect.width,(clientY-rect.top)/rect.height];
 const hits=stemHits(point,state.items,{assetOf:i=>assetById[i.type],spriteOf:i=>spriteCache.get(i.id)?.canvas||null,stagePx:rect.width,radius:Math.max(radius,keep)});
 return {id:choosePick(hits,selected,{radius,keep,selectedFirst}),hits};
}
/** Select a stem by id; null deselects (the panel shows #selected-empty). */
function selectItem(id){selected=id??null;gameBridge?.schedule();$$('.stem').forEach(n=>{const on=n.dataset.id===id;n.classList.toggle('selected',on);n.setAttribute('aria-pressed',String(on))});renderSelection();renderCutChoice();renderSeatCues();queueGuide();if(!$('#layer-menu').hidden)renderLayerList()}
function renderCutChoice(){
 const choice=$('#cut-choice');if(!choice)return;
 // Cutting keeps both pieces immediately; arranging needs no confirmation step.
 if(document.body.classList.contains('atelier-simple')){cutSession=null;choice.hidden=true;choice.closest('.stage-shell').classList.remove('has-cut-choice');return;}
 if(cutSession&&!cutSession.ids.every(id=>state.items.some(i=>i.id===id)))cutSession=null;
 choice.hidden=!cutSession;choice.closest('.stage-shell').classList.toggle('has-cut-choice',!!cutSession);if(!cutSession)return;
 $$('[data-cut-piece]',choice).forEach(button=>{const item=state.items.find(i=>i.id===cutSession.ids[Number(button.dataset.cutPiece)]);button.textContent=item?.pieceLabel||'?';button.setAttribute('aria-label',lang==='ja'?`${item?.pieceLabel||'?'}を選択`:L(`选择 ${item?.pieceLabel||'?'} 段`,`Select piece ${item?.pieceLabel||'?'}`));button.setAttribute('aria-pressed',String(item?.id===selected))});
 const active=state.items.find(i=>i.id===selected&&cutSession.ids.includes(i.id));
 $('#cut-choice-detail').textContent=active?(lang==='ja'?`${active.pieceLabel} を選択中 · 不要なら削除`:L(`已选中 ${active.pieceLabel} 段，不需要就删除`,`Piece ${active.pieceLabel} selected · remove it if unwanted`)):(lang==='ja'?'残したい部分をキャンバスで選択':L('在画布上点选想处理的那一段','Select either piece on the canvas'));
 $('#cut-delete').disabled=!active;
}
$('#cut-delete').onclick=()=>{if(cutSession?.ids.includes(selected))removeSelected()};
$$('[data-cut-piece]').forEach(button=>button.onclick=()=>{const id=cutSession?.ids[Number(button.dataset.cutPiece)];if(id)selectItem(id)});
$('#cut-keep').onclick=()=>{cutSession=null;renderCutChoice();toast(L('两段已保留，可分别移动。','Both pieces kept; each can be moved separately.','両方の部分を残しました。それぞれ動かせます。'))};
function renderLayerList(){
 const list=$('#layer-list');if(!list)return;
 renderLayerQuickActions();
 const front=[...state.items].filter(i=>i.aboveVessel).reverse(),back=[...state.items].filter(i=>!i.aboveVessel).reverse(),visual=[...front,...back];
 const row=(item,index,side)=>{const a=assetById[item.type],name=assetName(a)+(item.pieceLabel?` · ${item.pieceLabel}`:''),layer=side==='front'?(lang==='ja'?`花器の前 · ${front.indexOf(item)+1}層目`:lang==='en'?`Vessel front · Layer ${front.indexOf(item)+1}`:`花器前 · 第 ${front.indexOf(item)+1} 层`):(lang==='ja'?`花器の後ろ · ${back.indexOf(item)+1}層目`:lang==='en'?`Vessel back · Layer ${back.indexOf(item)+1}`:`花器后 · 第 ${back.indexOf(item)+1} 层`),frontDisabled=item.aboveVessel&&front.indexOf(item)===0,backDisabled=!item.aboveVessel&&back.indexOf(item)===back.length-1;return `<div class="layer-row ${item.id===selected?'active':''}" data-layer-id="${item.id}" draggable="true"><span class="layer-grip" aria-hidden="true">⠿</span><button class="layer-select" data-layer-select="${item.id}" aria-label="${esc(lang==='ja'?`${name}を選択`:L(`选择${name}`,`Select ${name}`))}"><span class="layer-thumb" data-layer-thumb="${item.id}"></span><span><strong>${esc(name)}</strong><small>${layer}</small></span></button><span class="layer-step"><button data-layer-shift="front" aria-label="${esc(lang==='ja'?`${name}を花器の前へ移動`:L(`将${name}移向花器前`,`Move ${name} toward the front of the vase`))}" ${frontDisabled?'disabled':''}>↑</button><button data-layer-shift="back" aria-label="${esc(lang==='ja'?`${name}を花器の後ろへ移動`:L(`将${name}移向花器后`,`Move ${name} toward the back of the vase`))}" ${backDisabled?'disabled':''}>↓</button></span></div>`};
 list.innerHTML=visual.length?[...front.map((item,index)=>row(item,index,'front')),'<div class="layer-vessel-divider">'+L('花器','Vessel')+'</div>',...back.map((item,index)=>row(item,front.length+index,'back'))].join(''):`<div class="layer-empty">${L('先添入花材，再安排层次。','Add a material, then arrange its layer.')}</div>`;
 for(const slot of $$('[data-layer-thumb]',list)){const item=state.items.find(i=>i.id===slot.dataset.layerThumb);if(item)slot.append(layerThumb(item))}
}
/**
 * Layer thumbnails (B8): the stem as it is on the canvas — its cached sprite, already cropped to what is left after cuts — so
 * pieces A and B of a cut stem look different. Each is kept per stem until its sprite key (or mirror) changes; before the
 * sprite exists the material's photograph stands in.
 */
const layerThumbs=new Map();
function layerThumb(item){
 const sprite=spriteCache.get(item.id),src=sprite?.canvas,key=sprite&&`${sprite.key}|${item.flip?1:0}`;
 if(!src?.width||!src.height){const img=document.createElement('img');img.src=assetPath(item.type);img.alt='';img.decoding='async';const tone=assetById[item.type]?.saturation;if(tone)img.style.filter=`saturate(${tone})`;return img}
 const cached=layerThumbs.get(item.id);if(cached?.key===key)return cached.canvas;
 const box=[38,42],dpr=Math.min(2,window.devicePixelRatio||1),k=Math.min(box[0]/src.width,box[1]/src.height,1),w=Math.max(1,Math.round(src.width*k*dpr)),h=Math.max(1,Math.round(src.height*k*dpr));
 const canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;canvas.setAttribute('aria-hidden','true');
 const ctx=canvas.getContext('2d');if(ctx){ctx.imageSmoothingQuality='high';if(item.flip){ctx.translate(w,0);ctx.scale(-1,1)}ctx.drawImage(src,0,0,w,h)}
 layerThumbs.set(item.id,{key,canvas});
 for(const id of [...layerThumbs.keys()])if(!state.items.some(i=>i.id===id))layerThumbs.delete(id);
 return canvas;
}
let focusOtherLayers=false;
let compactLayers=false;
function renderLayerQuickActions(){
 const item=current(),back=state.items.filter(i=>!i.aboveVessel),front=state.items.filter(i=>i.aboveVessel);
 $('#layer-quick-front').disabled=!item||(item.aboveVessel&&front.at(-1)===item);
 $('#layer-quick-back').disabled=!item||(!item.aboveVessel&&back[0]===item);
 $('#layer-quick-middle').disabled=!item||(!item.aboveVessel&&back.length<2);
 $('#layer-quick-focus').disabled=!item;
 $('#layer-quick-focus').setAttribute('aria-pressed',String(focusOtherLayers&&!!item));
 $('#layer-quick-organize').setAttribute('aria-pressed',String(compactLayers));
 $('#layer-quick-organize').textContent=compactLayers?L('展开图层','Expand layers','レイヤーを展開'):L('一键整理图层','Tidy layers','レイヤーを整理');
 $('#layer-menu').classList.toggle('compact',compactLayers);
 $('#stage').classList.toggle('focus-other-layers',focusOtherLayers&&!!item);
}
function closeLayerMenu(){const menu=$('#layer-menu');if(menu.hidden)return;menu.hidden=true;document.body.classList.remove('layer-list-open');$('.design-panel').hidden=false;$('#layers-tool').setAttribute('aria-expanded','false');layerDragId=null;focusOtherLayers=false;renderLayerQuickActions()}
function mountLayerDock(){
 const menu=$('#layer-menu'),host=$('.workspace'),after=$('.design-panel');
 if(menu.parentElement!==host||menu.nextElementSibling!==after)host.insertBefore(menu,after);
}
function openLayerMenu(){
 closeQuickMaterialDrawer();setEditMode('move');mountLayerDock();const menu=$('#layer-menu');menu.hidden=false;document.body.classList.add('layer-list-open');$('.design-panel').hidden=true;$('#layers-tool').setAttribute('aria-expanded','true');renderLayerList();if(!document.body.classList.contains('atelier-simple')&&mediaMatches(COMPACT_STUDIO))menu.scrollIntoView({block:getComputedStyle($('.stage-frame')).position==='sticky'?'start':'nearest',behavior:'smooth'});
}
mountLayerDock();
window.addEventListener('resize',mountLayerDock);
$('#layer-menu').addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();closeLayerMenu();$('#layers-tool').focus()}});
/** The layer tip names the reorder gesture the pointer has: dragging rows with a mouse, the ↑ ↓ buttons by touch. */
function syncLayerTip(){const tip=$('.layer-menu-tip');if(!tip)return;const [zh,en,ja]=mediaMatches('(pointer:coarse)')?['用 ↑ ↓ 调整前后；虚化只辅助查看，不影响作品。','Use ↑ ↓ to reorder. Blur is only an editing aid.','↑ ↓ で並べ替え。ぼかしは編集中だけ表示します。']:['拖动调整顺序；虚化只辅助查看，不影响作品。','Drag to reorder. Blur is only an editing aid.','ドラッグで順序を変更。ぼかしは編集中だけ表示します。'];tip.dataset.zh=zh;tip.dataset.en=en;tip.dataset.ja=ja;tip.textContent=L(zh,en,ja)}
syncLayerTip();try{window.matchMedia?.('(pointer:coarse)').addEventListener?.('change',syncLayerTip)}catch{}
function shiftLayer(id,direction){
 const item=state.items.find(i=>i.id===id);if(!item)return;const back=state.items.filter(i=>!i.aboveVessel),front=state.items.filter(i=>i.aboveVessel),group=item.aboveVessel?front:back,index=group.findIndex(i=>i.id===id),step=direction==='front'?1:-1,next=index+step;checkpoint();
 if(next>=0&&next<group.length)[group[index],group[next]]=[group[next],group[index]];
 else if(direction==='front'&&!item.aboveVessel){item.aboveVessel=true;back.splice(back.indexOf(item),1);front.unshift(item)}
 else if(direction==='back'&&item.aboveVessel&&index===0){item.aboveVessel=false;front.splice(front.indexOf(item),1);back.push(item)}
 state.items=[...back,...front];selected=id;renderStage();persist();toast(direction==='front'?L('已向前移动一层','Moved forward one layer'):L('已向后移动一层','Moved back one layer'));
}
function applyLayerDrop(id,targetId,after){
 if(!id||id===targetId)return;const dragged=state.items.find(i=>i.id===id),target=state.items.find(i=>i.id===targetId);if(!dragged||!target)return;const side=target.aboveVessel?'aboveVessel':'behindVessel',group=state.items.filter(i=>i.aboveVessel===target.aboveVessel).reverse().filter(i=>i.id!==id),targetIndex=group.findIndex(i=>i.id===targetId);if(targetIndex<0)return;checkpoint();dragged.aboveVessel=target.aboveVessel;group.splice(targetIndex+(after?1:0),0,dragged);const back=dragged.aboveVessel?state.items.filter(i=>!i.aboveVessel):group.slice().reverse(),front=dragged.aboveVessel?group.slice().reverse():state.items.filter(i=>i.aboveVessel);state.items=[...back,...front];selected=id;renderStage();persist();toast(L('花材层次已调整','Material layers updated'));
}
$('#layer-list').addEventListener('click',e=>{const row=e.target.closest('[data-layer-id]');if(!row)return;const shift=e.target.closest('[data-layer-shift]');if(shift){shiftLayer(row.dataset.layerId,shift.dataset.layerShift);return}if(e.target.closest('[data-layer-select]')){selectItem(row.dataset.layerId);renderLayerList()}});
$('#layer-list').addEventListener('dragstart',e=>{const row=e.target.closest('[data-layer-id]');if(!row)return;layerDragId=row.dataset.layerId;row.classList.add('dragging');e.dataTransfer.effectAllowed='move';e.dataTransfer.setData('text/plain',layerDragId)});
$('#layer-list').addEventListener('dragover',e=>{const row=e.target.closest('[data-layer-id]');if(!row||row.dataset.layerId===layerDragId)return;e.preventDefault();const after=e.clientY>row.getBoundingClientRect().top+row.offsetHeight/2;$$('.layer-row').forEach(n=>n.classList.remove('drop-before','drop-after'));row.classList.add(after?'drop-after':'drop-before');e.dataTransfer.dropEffect='move'});
$('#layer-list').addEventListener('drop',e=>{const row=e.target.closest('[data-layer-id]');if(!row)return;e.preventDefault();const after=row.classList.contains('drop-after'),id=layerDragId||e.dataTransfer.getData('text/plain');applyLayerDrop(id,row.dataset.layerId,after);layerDragId=null});
$('#layer-list').addEventListener('dragend',()=>{layerDragId=null;$$('.layer-row').forEach(n=>n.classList.remove('dragging','drop-before','drop-after'))});
$('#stage').addEventListener('contextmenu',e=>{e.preventDefault();if(stroke||gesture||movePointers.size||performance.now()<suppressLayerContextUntil)return;const id=pickStem(e.clientX,e.clientY,{touch:lastPointerType==='touch'}).id;if(!id&&lastStagePointerType==='touch')return;if(id)selectItem(id);openLayerMenu(e.clientX,e.clientY)});
// Every press on the stage, right-clicks included, records its pointer type (Safari leaves it off contextmenu events).
$('#stage').addEventListener('pointerdown',e=>{lastStagePointerType=e.pointerType||'mouse'},true);
$('#layers-tool').onclick=()=>$('#layer-menu').hidden?openLayerMenu():closeLayerMenu();$('#close-layers').onclick=closeLayerMenu;
$('#layer-quick-front').onclick=moveSelectedToFront;
$('#layer-quick-back').onclick=moveSelectedToBack;
$('#layer-quick-middle').onclick=moveSelectedToRandomMiddle;
$('#layer-quick-focus').onclick=()=>{focusOtherLayers=!focusOtherLayers;renderLayerQuickActions()};
$('#layer-quick-organize').onclick=()=>{
 if(compactLayers){compactLayers=false;renderLayerQuickActions();return}
 const groupPieces=items=>{const groups=new Map();for(const item of items){const key=item.originId||item.id;if(!groups.has(key))groups.set(key,[]);groups.get(key).push(item)}return [...groups.values()].flat()};
 const next=[...groupPieces(state.items.filter(i=>!i.aboveVessel)),...groupPieces(state.items.filter(i=>i.aboveVessel))];
 if(next.some((item,index)=>item!==state.items[index])){checkpoint();state.items=next;renderStage();persist()}
 compactLayers=true;renderLayerList();toast(L('同枝花材已归在一起，图层列表更紧凑。','Pieces of the same stem are together; layers are more compact.','同じ枝の部分をまとめ、レイヤーをコンパクトにしました。'));
};

const stage=$('#stage');
function applyCanvasZoom(){
 const viewport=$('#canvas-viewport'),limit=Math.max(0,viewport.clientWidth*(zoomLevel-1)/2);zoomPanX=clamp(zoomPanX,-limit,limit);zoomPanY=clamp(zoomPanY,-limit,limit);
 stage.style.transform=`translate(${zoomPanX}px,${zoomPanY}px) scale(${zoomLevel})`;viewport.classList.toggle('is-zoomed',zoomLevel>1);stage.style.setProperty('--mark-scale',String(Math.round(100/zoomLevel)/100));
 const percent=`${Math.round(zoomLevel*100)}%`;$('#zoom-reset').textContent=percent;$('#zoom-reset').setAttribute('aria-label',`${lang==='ja'?'倍率をリセット':lang==='en'?'Reset zoom':'重置画布缩放'} · ${percent}`);$('#zoom-in').disabled=zoomLevel>=3;$('#zoom-out').disabled=zoomLevel<=1;
}
/** Client point of the stage's unzoomed centre (the stage is drawn as translate(pan) scale(zoom) about its centre). */
function stageCentre(){const r=stage.getBoundingClientRect();return [r.left+r.width/2-zoomPanX,r.top+r.height/2-zoomPanY]}
/** Zoom to `next` (1–3×). With a client point `at` (B7: the wheel's pointer, a pinch's centre, a double-tap, the selected
 stem's tip) the stage point under it stays put; otherwise the view scales about the centre as before. */
function setCanvasZoom(next,at=null){
 const old=zoomLevel;zoomLevel=clamp(Math.round(next*1000)/1000,1,3);
 if(zoomLevel===1)zoomPanX=zoomPanY=0;
 else if(old!==zoomLevel){
  if(at){const [cx,cy]=stageCentre();[zoomPanX,zoomPanY]=zoomAbout({from:old,to:zoomLevel,pan:[zoomPanX,zoomPanY],at:[at[0]-cx,at[1]-cy]})}
  else{zoomPanX*=zoomLevel/old;zoomPanY*=zoomLevel/old}
 }
 if(old===zoomLevel)return;applyCanvasZoom();scheduleZoomRedraw();
}
/** The canvases that follow the zoom are redrawn at most once a frame while a wheel or pinch zooms (B7). */
let zoomFrame=0;
function scheduleZoomRedraw(){if(zoomFrame)return;zoomFrame=requestAnimationFrame(()=>{zoomFrame=0;redrawStemCanvases();renderVesselLayers();drawPruneOverlay()})}
/** + and − zoom toward the selected stem's tip (kept inside the visible canvas), else about the centre. */
function zoomTarget(){
 const item=current(),a=item&&assetById[item.type];if(!a)return null;
 const tip=tipPoint(item,a),r=stage.getBoundingClientRect(),view=$('#canvas-viewport').getBoundingClientRect();
 return [clamp(r.left+tip[0]/100*r.width,view.left,view.right),clamp(r.top+tip[1]/100*r.height,view.top,view.bottom)];
}
$('#zoom-in').onclick=()=>setCanvasZoom(zoomLevel+.25,zoomTarget());$('#zoom-out').onclick=()=>setCanvasZoom(zoomLevel-.25,zoomTarget());$('#zoom-reset').onclick=()=>setCanvasZoom(1);
applyCanvasZoom();
/**
 * Mouse wheel and trackpad (B7; wheelAction in editor-state.js). The listener is not passive, and it prevents the page's own
 * scroll or zoom only when it acts: Ctrl+wheel or a trackpad pinch zooms about the pointer (never the page) · a plain wheel pans
 * a zoomed canvas until it reaches an edge, then the page scrolls · Shift+wheel turns the selected stem (or the one under the
 * pointer) 2° a notch about its base · Alt+wheel sizes it within its true-size bounds, a drawn stem keeping its centimetres.
 * Turns and sizes coalesce into one undo step per burst (500 ms between events).
 */
let wheelBubbleTimer=0,safariPinch=null;
function wheelBubble(e,item){showStemFeedback(e.clientX,e.clientY,gestureText(item),'mouse');clearTimeout(wheelBubbleTimer);wheelBubbleTimer=setTimeout(()=>{if(!drag&&!gesture)$('#gesture-feedback')?.classList.remove('active','wide')},700)}
$('#canvas-viewport').addEventListener('wheel',e=>{
 if(e.defaultPrevented||$('#studio-view')?.hidden||e.target.closest?.('.stage-tools,.layer-menu,.start-card,.mode-pill,.cut-choice'))return;
 if(e.ctrlKey&&safariPinch){e.preventDefault();return}
 const free=editMode==='move'&&!drag&&!gesture&&!canvasPan&&!paperPinch&&!movePointers.size;
 let item=free?current():null;
 if(free&&!item&&!e.ctrlKey&&(e.shiftKey!==e.altKey)){const id=pickStem(e.clientX,e.clientY).id;if(id){selectItem(id);item=current()}}
 const act=wheelAction(e,{zoomed:zoomLevel>1,stem:!!item,page:window.innerHeight||800});if(!act)return;
 if(act.type==='zoom'){e.preventDefault();setCanvasZoom(zoomLevel*act.factor,[e.clientX,e.clientY]);return}
 if(act.type==='pan'){const x=zoomPanX,y=zoomPanY;zoomPanX+=act.dx;zoomPanY+=act.dy;applyCanvasZoom();if(zoomPanX!==x||zoomPanY!==y)e.preventDefault();return}
 e.preventDefault();const a=assetById[item.type];
 if(act.type==='turn')keyStep('wheel-turn',item,i=>aboutCutEnd(i,j=>{j.angle=clamp(Math.round((j.angle+act.deg)*10)/10,-180,180)}),500);
 else{const [min,max]=sizeBounds(a);keyStep('wheel-size',item,i=>aboutCutEnd(i,j=>{const cm=drawsStem(a)?stemCm(j,a):null;j.h=clamp(Math.round(j.h*act.ratio*100)/100,min,max);if(cm!==null)j.length=Math.min(lengthForStem(j,a,cm),lengthBounds(a,j.h,j.trim)[1])}),500)}
 wheelBubble(e,item);
},{passive:false});
/** Safari (macOS) reports a trackpad pinch as gesture events, not Ctrl+wheel: the canvas zooms instead of the page. Touch
 pinches on iPhone and iPad are left to the pointer handlers (stems) and the paper pinch below. */
for(const [type,handler] of [
 ['gesturestart',e=>{if(lastStagePointerType==='touch'||movePointers.size||paperPinch)return;e.preventDefault();safariPinch={zoom:zoomLevel}}],
 ['gesturechange',e=>{if(!safariPinch)return;e.preventDefault();setCanvasZoom(safariPinch.zoom*(+e.scale||1),Number.isFinite(e.clientX)?[e.clientX,e.clientY]:null)}],
 ['gestureend',e=>{if(!safariPinch)return;e.preventDefault();safariPinch=null}]
])$('#canvas-viewport').addEventListener(type,handler,{passive:false});
const gestureMetrics=(a,b)=>({distance:Math.hypot(b.x-a.x,b.y-a.y),bearing:Math.atan2(b.y-a.y,b.x-a.x)});
const gestureAngleDelta=(now,start)=>Math.atan2(Math.sin(now-start),Math.cos(now-start))*180/Math.PI;
/** A light tick on gesture snaps where the device supports it. */
const buzz=()=>{try{navigator.vibrate?.(8)}catch{}};
/** Stem cm a drag or pinch keeps for a drawn stem (null for photographs and cut pieces, whose length is the photograph's). */
const keptStemCm=item=>{const a=assetById[item.type];return drawsStem(a)&&!cutEndSource(item,a)&&stemUnit(item,a)>0?stemCm(item,a):null};
function startGestureIfReady(){
 if(gesture||!drag||drag.pointerType!=='touch'||movePointers.size<2)return false;
 const ids=[drag.pointer,...[...movePointers.keys()].filter(id=>id!==drag.pointer)].slice(0,2),a=movePointers.get(ids[0]),b=movePointers.get(ids[1]);if(!a||!b)return false;
 const metrics=gestureMetrics(a,b);if(metrics.distance<24)return false;
 clearTimeout(drag.lengthTimer);const item=drag.item,asset=assetById[item.type],endUV=cutEndSource(item,asset);
 gesture={pointers:ids,item,el:drag.el,startDistance:metrics.distance,startBearing:metrics.bearing,baseAngle:item.angle,baseH:item.h,checkpointed:drag.started,gestureStarted:false,changed:drag.started,rotating:false,scaling:false,snapAngle:false,snapSize:false,stemCm0:keptStemCm(item),endUV,endAt:endUV?seatPoint(item,asset):null};drag=null;suppressLayerContextUntil=performance.now()+600;updateGestureFeedback(a,b,gesture.item,true);return true;
}
function syncGestureControls(item){$('#angle').value=item.angle;$('#angle-value').value=Math.round(item.angle)+'°';renderSizeControls(item)}
/** The pinch bubble: angle and size as a share of true size ("28° · 100% 实寸"). */
function gestureText(item){const a=assetById[item.type],pct=Math.round(item.h/a.height*100);return `${Math.round(item.angle)}° · ${pct}%`+(pct===100?L(' 实寸',' true size',' 実寸'):'')}
function updateGestureFeedback(a,b,item,active=true){const feedback=$('#gesture-feedback');if(!feedback||!a||!b)return;const rect=stage.getBoundingClientRect(),x=((a.x+b.x)/2-rect.left)/rect.width*100,y=((a.y+b.y)/2-rect.top)/rect.height*100;feedback.style.setProperty('--gesture-x',`${clamp(x,8,92)}%`);feedback.style.setProperty('--gesture-y',`${clamp(y,8,92)}%`);$('output',feedback).value=gestureText(item);feedback.classList.add('wide');feedback.classList.toggle('active',active)}
/** The steer bubble, above the pointer (further above a finger). */
function showStemFeedback(x,y,text,pointerType){const feedback=$('#gesture-feedback');if(!feedback)return;const rect=stage.getBoundingClientRect(),lift=pointerType==='touch'?76:44;feedback.style.setProperty('--gesture-x',`${clamp((x-rect.left)/rect.width*100,8,92)}%`);feedback.style.setProperty('--gesture-y',`${clamp((y-lift-rect.top)/rect.height*100,8,92)}%`);$('output',feedback).value=text;feedback.classList.add('wide','active')}
/**
 * One pinch frame. Rotation engages past a 6° dead-zone and snaps to 15° steps within 2°; size engages past 3% and snaps to
 * true size within 3% (sizeBounds still apply). A detached piece turns and scales about its cut end.
 */
function pinchTo(p,q){
 const g=gesture,item=g.item,asset=assetById[item.type],metrics=gestureMetrics(p,q),turn=gestureAngleDelta(metrics.bearing,g.startBearing),ratio=metrics.distance/g.startDistance;
 if(!g.rotating&&Math.abs(turn)>=6)g.rotating=true;
 if(!g.scaling&&Math.abs(ratio-1)>=.03)g.scaling=true;
 let angle=g.baseAngle,h=g.baseH,snapAngle=false,snapSize=false;
 if(g.rotating){angle=clamp(g.baseAngle+turn,-180,180);const step=Math.round(angle/15)*15;snapAngle=Math.abs(angle-step)<=2;angle=snapAngle?step:Math.round(angle)}
 if(g.scaling){h=clamp(g.baseH*ratio,...sizeBounds(asset));snapSize=Math.abs(h/asset.height-1)<=.03;h=snapSize?asset.height:Math.round(h*10)/10}
 if((snapAngle&&!g.snapAngle)||(snapSize&&!g.snapSize))buzz();g.snapAngle=snapAngle;g.snapSize=snapSize;
 if(!g.gestureStarted){if(!g.rotating&&!g.scaling){updateGestureFeedback(p,q,item);return}g.gestureStarted=true;if(!g.checkpointed){checkpoint();g.checkpointed=true}}
 if(angle===item.angle&&h===item.h){updateGestureFeedback(p,q,item);return}
 item.angle=angle;item.h=h;if(g.endUV){const at=anchorAt(item,asset,g.endUV,g.endAt);item.x=clamp(at.x,5,95);item.y=clamp(at.y,15,95)}
 g.changed=true;g.el.style.cssText=stemStyle(item);scheduleVesselLayers();syncGestureControls(item);updateGestureFeedback(p,q,item);queueGuide();
}
/** End of a pinch: a drawn stem gets its centimetres back (the pinch scaled them with the photograph), as the size slider keeps them. */
function settleGesture(g){
 if(!g?.changed||g.stemCm0===null||!state.items.includes(g.item))return;
 const item=g.item,a=assetById[item.type];item.length=Math.min(lengthForStem(item,a,g.stemCm0),lengthBounds(a,item.h,item.trim)[1]);updateStem(item);
}
/**
 * Steer or move, decided at pointerdown (A11). A stem standing in the vessel, pressed away from its base, steers: it turns
 * about the base (a detached piece: about its cut end) while the base slides a little along the mouth, and a drawn stem
 * grows or shortens with the pointer's distance from the base. A press within 12 px (24 px touch) of the base, Alt or Shift,
 * a stem that is not in the vessel, or a piece whose cut end was never stored moves the whole stem, as before.
 */
function dragMode(item,e){
 const a=assetById[item.type],vessel=assetById[state.vessel],rect=stage.getBoundingClientRect(),endUV=cutEndSource(item,a),base=seatPoint(item,a);
 const client=[rect.left+base[0]/100*rect.width,rect.top+base[1]/100*rect.height],px=Math.hypot(e.clientX-client[0],e.clientY-client[1]);
 const seated=!!a&&!!vessel&&seatState(item,a,vessel).seated,move=px<=(e.pointerType==='touch'?24:12)||e.altKey||e.shiftKey||!seated||(!endUV&&isDetachedPiece(item));
 return {mode:move?'move':'steer',seated0:seated,base0:base,baseClient:client,endUV,angle0:item.angle,bearing:Math.atan2(e.clientY-client[1],e.clientX-client[0]),turn:0,r0:px/Math.max(1,rect.width)*100,stemCm0:move?null:keptStemCm(item),stemCm:null,appliedCm:null,lengthAt:0,lengthTimer:0};
}
/** Steer bubble text: the angle, and a drawn stem's centimetres. */
const steerText=(item,d)=>{const deg=`${Math.round(item.angle)}°`;if(d.stemCm0===null)return deg;const cm=Math.round(d.stemCm??d.stemCm0);return L(`${deg} · 枝梗 ${cm} cm`,`${deg} · stem ${cm} cm`,`${deg} · 茎 ${cm} cm`)};
/** A drawn stem's length is part of its sprite key: steering applies it in 0.5 cm steps at most 12 times a second (the exact value on release). */
function applySteerLength(d,cm){
 const item=d.item,a=assetById[item.type];d.lengthAt=performance.now();d.appliedCm=cm;
 item.length=Math.min(lengthForStem(item,a,cm),lengthBounds(a,item.h,item.trim)[1]);updateStem(item);
}
function queueSteerLength(d){
 const cm=Math.round(d.stemCm*2)/2;if(cm===d.appliedCm)return;
 const wait=1000/12-(performance.now()-d.lengthAt);
 if(wait<=0){clearTimeout(d.lengthTimer);d.lengthTimer=0;applySteerLength(d,cm);return}
 if(!d.lengthTimer)d.lengthTimer=setTimeout(()=>{d.lengthTimer=0;if(drag===d&&d.stemCm!==null){const next=Math.round(d.stemCm*2)/2;if(next!==d.appliedCm)applySteerLength(d,next)}},wait);
}
/** One steer frame: the angle (every frame, CSS only) and the base's slide along the mouth; a drawn stem's length via queueSteerLength. */
function steerTo(d,e){
 const item=d.item,a=assetById[item.type],vessel=assetById[state.vessel],px=Math.hypot(e.clientX-d.baseClient[0],e.clientY-d.baseClient[1]);
 // Near the base the bearing is noise: keep the angle until the pointer is 8 px away again.
 if(px>=8){const bearing=Math.atan2(e.clientY-d.baseClient[1],e.clientX-d.baseClient[0]);d.turn+=gestureAngleDelta(bearing,d.bearing);d.bearing=bearing}
 // A piece's angle says nothing about which way it points (it may stand seated at ±170°): it turns freely, wrapped to ±180°.
 item.angle=Math.round((d.endUV?((d.angle0+d.turn)%360+540)%360-180:clamp(d.angle0+d.turn,-135,135))*10)/10;
 const x=slideBase(vessel,d.base0[0],d.base0[0]+(e.clientX-d.startX)/d.rect.width*100*.3,{front:!!item.aboveVessel});
 if(d.endUV){const at=anchorAt(item,a,d.endUV,[x,d.base0[1]]);item.x=clamp(at.x,5,95);item.y=clamp(at.y,15,95)}else item.x=clamp(x,5,95);
 if(d.stemCm0!==null){
  // The stem follows the pointer's distance from the base once it has changed by 1 cm (a swing is never an accidental stretch).
  const dr=px/d.rect.width*100-d.r0;
  if(d.stemCm!==null||Math.abs(dr)>=1){d.stemCm=clamp(d.stemCm0+dr,0,Math.max(stemMaxCm(a),d.stemCm0));queueSteerLength(d)}
 }
 d.el.style.cssText=stemStyle(item);scheduleVesselLayers();syncSelectionReadouts(item);renderSeatCues();queueGuide();showStemFeedback(e.clientX,e.clientY,steerText(item,d),d.pointerType);
}
/**
 * End of a one-pointer drag. Steer: the exact stem length. Move: a base dropped within 3 cm of a mouth snaps into it; a stem
 * that stood in the vessel and no longer does gets a toast that puts it back (Seat all in the banner does the same for all).
 */
function settleDrag(d){
 clearTimeout(d.lengthTimer);d.lengthTimer=0;
 if(!d.started||!state.items.includes(d.item))return;
 const item=d.item,a=assetById[item.type],vessel=assetById[state.vessel];if(!a||!vessel)return;
 if(d.mode==='steer'){if(d.stemCm!==null){item.length=Math.min(lengthForStem(item,a,d.stemCm),lengthBounds(a,item.h,item.trim)[1]);updateStem(item)}return}
 const seat=seatState(item,a,vessel);
 if(!seat.seated&&seat.gap>0&&seat.gap<=3){
  const uv=cutEndSource(item,a),mouth=mouthBase(vessel,seatPoint(item,a)[0],.55,{front:!!item.aboveVessel});
  if(uv){const at=anchorAt(item,a,uv,mouth);item.x=clamp(at.x,5,95);item.y=clamp(at.y,15,95)}else{item.x=mouth[0];item.y=mouth[1]}
  updateStem(item);return;
 }
}
/** The first drag of a visit says how stems are held now (two fingers too, on touch). */
function stemHint(pointerType){if(touchHintShown)return;touchHintShown=true;toast(L('拖动花头转向，拖根部圆点移动','Drag the flower to swing it; drag the base dot to move','花を引いて向きを変え、根元の点で移動')+(pointerType==='touch'?L(' · 双指旋转缩放',' · two fingers rotate and scale',' · 2本指で回転・拡大縮小'):''))}
function finishMoveInteraction(suppressTouchContext=false){
 if(!drag&&!gesture&&!canvasPan&&!paperPinch&&!movePointers.size)return false;
 if(drag)clearTimeout(drag.lengthTimer);
 const changed=!!(drag?.started||gesture?.changed),ids=new Set([...movePointers.keys(),drag?.pointer,canvasPan?.pointer,...(gesture?.pointers||[]),...(paperPinch?.ids||[])]);ids.delete(undefined);if(paperPinch)scheduleZoomRedraw();drag=null;gesture=null;canvasPan=null;paperPinch=null;movePointers.clear();$('#gesture-feedback')?.classList.remove('active','wide');
 for(const id of ids){try{if(stage.hasPointerCapture(id))stage.releasePointerCapture(id)}catch{}}
 if(lightDirty)queueLightLayer();if(suppressTouchContext)suppressLayerContextUntil=performance.now()+600;renderSeatCues();if(changed)renderGuide();else queueGuide();if(changed)persist();return changed;
}
stage.addEventListener('pointerdown',e=>{
 if(e.button!==0||editMode!=='move')return;
 // A second finger while one pans a zoomed canvas (B7): pinch the canvas zoom (1–3×) about the fingers and pan with them,
 // wherever the second finger lands. A third finger is ignored.
 if(e.pointerType==='touch'&&(paperPinch||canvasPan?.touch)){e.preventDefault();e.stopPropagation();if(paperPinch)return;startPaperPinch(e);return}
 if(e.pointerType==='touch'&&(gesture||drag?.pointerType==='touch')){e.preventDefault();e.stopPropagation();if(movePointers.size>=2)return;movePointers.set(e.pointerId,{x:e.clientX,y:e.clientY});try{stage.setPointerCapture(e.pointerId)}catch{}startGestureIfReady();return}
 if(e.target.closest('.stage-tools,.layer-menu')||drag||gesture)return;lastPointerType=e.pointerType;
 // Pick what you see (stem-pick.js): transparent parts of a stem's box are paper. A repeat tap on one spot within 600 ms
 // walks down to the next stem under it.
 const pick=pickStem(e.clientX,e.clientY,{touch:e.pointerType==='touch'});let id=pick.id;
 if(id&&lastTap&&lastTap.id===selected&&performance.now()-lastTap.time<600&&Math.hypot(e.clientX-lastTap.x,e.clientY-lastTap.y)<6){const order=cycleOrder(pick.hits);if(order.length>1)id=nextInCycle(order,selected)}
 lastTap=null;const el=id?$(`.stem[data-id="${id}"]`,stage):null;
 // Paper: a drag pans when zoomed; a tap without movement deselects (finishMovePointer).
 if(!el){blankPress={pointer:e.pointerId,x:e.clientX,y:e.clientY};if(zoomLevel>1){e.preventDefault();canvasPan={pointer:e.pointerId,touch:e.pointerType==='touch',startX:e.clientX,startY:e.clientY,at:[e.clientX,e.clientY],x:zoomPanX,y:zoomPanY};try{stage.setPointerCapture(e.pointerId)}catch{}}return}
 e.preventDefault();selectItem(id);revealStemPanel();const item=current();drag={pointer:e.pointerId,pointerType:e.pointerType,item,startX:e.clientX,startY:e.clientY,x:item.x,y:item.y,rect:stage.getBoundingClientRect(),el,started:false,...dragMode(item,e)};if(e.pointerType==='touch')movePointers.set(e.pointerId,{x:e.clientX,y:e.clientY});el.focus({preventScroll:true});try{stage.setPointerCapture(e.pointerId)}catch{}
});
stage.addEventListener('pointermove',e=>{
 if(paperPinch?.ids.includes(e.pointerId)){e.preventDefault();paperPinch.at.set(e.pointerId,[e.clientX,e.clientY]);pinchPaper();return}
 if(canvasPan?.pointer===e.pointerId){e.preventDefault();canvasPan.at=[e.clientX,e.clientY];zoomPanX=canvasPan.x+e.clientX-canvasPan.startX;zoomPanY=canvasPan.y+e.clientY-canvasPan.startY;applyCanvasZoom();return}
 if(movePointers.has(e.pointerId))movePointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
 if(!gesture&&drag?.pointerType==='touch'&&movePointers.size>1)startGestureIfReady();
 if(gesture&&gesture.pointers.includes(e.pointerId)){e.preventDefault();const a=movePointers.get(gesture.pointers[0]),b=movePointers.get(gesture.pointers[1]);if(a&&b)pinchTo(a,b);return}
 if(!drag||drag.pointer!==e.pointerId)return;e.preventDefault();if(drag.pointerType==='touch'&&movePointers.size>1)return;if(!drag.started&&Math.hypot(e.clientX-drag.startX,e.clientY-drag.startY)<3)return;if(!drag.started){checkpoint();drag.started=true;stemHint(drag.pointerType)}
 if(drag.mode==='steer'){steerTo(drag,e);return}
 drag.item.x=clamp(drag.x+(e.clientX-drag.startX)/drag.rect.width*100,5,95);drag.item.y=clamp(drag.y+(e.clientY-drag.startY)/drag.rect.height*100,15,95);drag.el.style.cssText=stemStyle(drag.item);scheduleVesselLayers();renderSeatCues();queueGuide()
});
function finishMovePointer(e){
 if(blankPress?.pointer===e.pointerId){
  const tap=e.type==='pointerup'&&!paperPinch&&Math.hypot(e.clientX-blankPress.x,e.clientY-blankPress.y)<(e.pointerType==='touch'?8:3);blankPress=null;
  if(tap&&selected&&!drag&&!gesture&&editMode==='move')selectItem(null);
  // Double-tap paper on a touch screen (B7): 1× ⇄ 2× about the tap.
  if(tap&&e.pointerType==='touch'&&editMode==='move'){const now={time:performance.now(),x:e.clientX,y:e.clientY};if(isDoubleTap(lastPaperTap,now)){lastPaperTap=null;setCanvasZoom(zoomLevel>1?1:2,[e.clientX,e.clientY])}else lastPaperTap=now}
 }
 if(drag?.pointer===e.pointerId){lastTap=e.type==='pointerup'&&!drag.started?{time:performance.now(),x:drag.startX,y:drag.startY,id:drag.item.id}:null;settleDrag(drag)}
 if(gesture?.pointers.includes(e.pointerId))settleGesture(gesture);
 const involved=movePointers.has(e.pointerId)||drag?.pointer===e.pointerId||canvasPan?.pointer===e.pointerId||gesture?.pointers.includes(e.pointerId)||paperPinch?.ids.includes(e.pointerId);if(involved)finishMoveInteraction(e.pointerType==='touch')}
stage.addEventListener('pointerup',finishMovePointer);stage.addEventListener('pointercancel',finishMovePointer);stage.addEventListener('lostpointercapture',finishMovePointer);
/** Two fingers on a zoomed canvas: the zoom follows their spread (1–3×) about the point between them, which follows them. */
function startPaperPinch(e){
 const first=canvasPan.pointer,p=canvasPan.at,q=[e.clientX,e.clientY],d=Math.hypot(q[0]-p[0],q[1]-p[1]);if(d<24)return;
 try{stage.setPointerCapture(e.pointerId)}catch{}
 paperPinch={ids:[first,e.pointerId],at:new Map([[first,p],[e.pointerId,q]]),zoom:zoomLevel,pan:[zoomPanX,zoomPanY],mid:[(p[0]+q[0])/2,(p[1]+q[1])/2],distance:d,centre:stageCentre()};
 canvasPan=null;blankPress=null;lastPaperTap=null;
}
function pinchPaper(){
 const g=paperPinch,[p,q]=g.ids.map(id=>g.at.get(id));if(!p||!q)return;
 const mid=[(p[0]+q[0])/2,(p[1]+q[1])/2],zoom=clamp(Math.round(g.zoom*Math.hypot(q[0]-p[0],q[1]-p[1])/g.distance*1000)/1000,1,3);
 const [x,y]=zoomAbout({from:g.zoom,to:zoom,pan:g.pan,at:[g.mid[0]-g.centre[0],g.mid[1]-g.centre[1]]});
 zoomLevel=zoom;zoomPanX=x+mid[0]-g.mid[0];zoomPanY=y+mid[1]-g.mid[1];applyCanvasZoom();
 // The stem and vessel canvases are re-rasterised once, when the pinch ends (finishMoveInteraction): on a phone, resizing
 // every stem canvas each frame of the pinch stutters and churns canvas memory; CSS scales them meanwhile.
}
/** Whether a press at a client point on this stem would move it rather than steer (see dragMode; modifiers aside). */
function pressMoves(item,x,y){
 const a=assetById[item.type],rect=stage.getBoundingClientRect(),base=seatPoint(item,a);
 return !isSeated(item)||(isDetachedPiece(item)&&!cutEndSource(item,a))||Math.hypot(x-(rect.left+base[0]/100*rect.width),y-(rect.top+base[1]/100*rect.height))<=12;
}
// Mouse hover: the grab cursor shows only over visible plant pixels, from the same pick a press makes (one test per frame);
// the move cursor where a press would move the stem (its base, or a stem out of the vessel).
let hoverFrame=0,hoverAt=null;
stage.addEventListener('pointermove',e=>{if(e.pointerType!=='mouse'||e.buttons||editMode!=='move'||drag||canvasPan)return;hoverAt=[e.clientX,e.clientY,e.altKey||e.shiftKey];if(!hoverFrame)hoverFrame=requestAnimationFrame(()=>{hoverFrame=0;if(!hoverAt)return;const id=pickStem(hoverAt[0],hoverAt[1]).id,item=id&&state.items.find(i=>i.id===id);stage.classList.toggle('over-stem',!!item);stage.classList.toggle('over-base',!!item&&(hoverAt[2]||pressMoves(item,hoverAt[0],hoverAt[1])))})});
stage.addEventListener('pointerleave',()=>{hoverAt=null;stage.classList.remove('over-stem','over-base')});
function setEditMode(mode){
 if(drag||gesture||canvasPan||movePointers.size)finishMoveInteraction(true);
 if(mode!=='move'&&!current()){if(!state.items.length)return;selectItem(state.items.at(-1).id)}
 editMode=mode;gameBridge?.schedule();stroke=null;$('#stage').dataset.tool=mode;
 $('#move-tool').setAttribute('aria-pressed',String(mode==='move'));$('#prune-tool').setAttribute('aria-pressed',String(mode==='split'));$('#erase-tool').setAttribute('aria-pressed',String(mode==='brush'));
 $$('[data-prune]').forEach(b=>b.classList.toggle('active',b.dataset.prune===mode));$('#brush-setting').hidden=mode!=='brush';
 renderModePill();renderSeatCues();
 $('#prune-help').textContent=mode==='split'?L('只在剪线接触的局部剪开。剪下部分会成为独立图层，可以移动或删除。','The cut opens only where your stroke touches. The detached part becomes its own movable layer.','線が触れた部分だけを切ります。切り離した部分は移動・削除できるレイヤーになります。'):mode==='move'?L('先选中一枝，再剪开局部连接或修掉细节。','Select a material, then cut a local attachment or refine details.','花材を選んで、付け根を切るか細部を整えます。'):L('在枝叶上涂抹去除细节。只修剪当前选中的一枝。','Brush over foliage details. Only the selected stem will be pruned.','選択中の花材をなぞって細部を消します。');drawPruneOverlay();
}
/** The pill over the canvas in cut and erase modes: the target stem, a one-line instruction, the brush size (erase), how
 to leave, and Done. DOM only; exports never include it. */
function renderModePill(){
 const pill=$('#mode-pill');if(!pill)return;if(document.body.classList.contains('atelier-simple')){pill.hidden=true;return;}const item=current(),on=editMode!=='move'&&!!item;pill.hidden=!on;if(!on)return;
 const brush=editMode==='brush';pill.dataset.mode=editMode;
 $('#mode-pill-target').textContent=itemName(item);
 $('#mode-pill-text').textContent=brush?L('涂抹去除细节','Brush away details','なぞって細部を消します'):L('从目标枝一侧起笔，横划过连接处','Start beside the target twig; draw across its attachment','切りたい枝の側から付け根を横切ってください');
 $('#mode-pill-exit').textContent=matchMedia?.('(pointer:fine)').matches?L('Esc 退出','Esc to exit','Escで終了'):L('再点一次工具即退出','Tap the tool again to exit','もう一度タップで終了');
 $('#mode-pill-brush').hidden=!brush;$('#mode-pill-size').value=$('#brush-size').value;
}
$('#mode-pill-done').onclick=()=>{setEditMode('move');renderStage()};
for(const [id,step] of [['brush-smaller',-3],['brush-larger',3]])$('#'+id).onclick=()=>{const input=$('#brush-size'),next=clamp(Number(input.value)+step,Number(input.min)||5,Number(input.max)||35);if(String(next)===input.value)return;input.value=String(next);input.dispatchEvent(new Event('input',{bubbles:true}))};
$('#move-tool').onclick=()=>setEditMode('move');$('#prune-tool').onclick=()=>setEditMode(editMode==='split'?'move':'split');$('#erase-tool').onclick=()=>setEditMode(editMode==='brush'?'move':'brush');$$('[data-prune]').forEach(b=>b.onclick=()=>setEditMode(editMode===b.dataset.prune?'move':b.dataset.prune));
$('#stem-details').addEventListener('toggle',()=>{if(!document.body.classList.contains('atelier-simple')&&!$('#stem-details').open&&editMode!=='move')setEditMode('move')});
$('#brush-size').oninput=e=>{$('#brush-value').value=e.target.value;const pillSize=$('#mode-pill-size');if(pillSize)pillSize.value=e.target.value};
$('#restore-cuts').onclick=()=>{if(!current()?.cuts.length)return;checkpoint();current().cuts=[];current().sv=stemVersion(current());renderStage();persist();undoToast(L('已恢复细部擦除。','Brushwork restored.','細部消去を戻しました。'))};
function drawPruneOverlay(){const c=$('#prune-overlay');if(!c)return;const size=Math.max(1,Math.round($('#stage').getBoundingClientRect().width));c.width=c.height=size;const ctx=c.getContext('2d');if(!stroke?.points.length||!current())return;const item=current(),asset=assetById[item.type],points=stroke.kind==='split'?[stroke.points[0],stroke.points.at(-1)]:stroke.points;ctx.beginPath();points.forEach((p,k)=>{const q=sourceToStage(p,item,asset);ctx[k?'lineTo':'moveTo'](q[0]*size,q[1]*size)});ctx.strokeStyle='#a5533e';ctx.lineWidth=stroke.kind==='split'?2.5:2;ctx.setLineDash(stroke.kind==='split'?[7,4]:[5,4]);ctx.stroke();}
/** Resize and rotation: zoom, overlays and the vessel layers follow at once; the stem canvases are re-rasterised for the new
 size 120 ms after the last change. A hidden studio measures 0 px and is skipped until it shows again. */
let stemResizeTimer=0;
new ResizeObserver(()=>{applyCanvasZoom();drawPruneOverlay();mountLayerDock();renderGuide();if(stage.getBoundingClientRect().width<40)return;renderVesselLayers();clearTimeout(stemResizeTimer);stemResizeTimer=setTimeout(()=>{if(stage.getBoundingClientRect().width>=40)redrawStemCanvases()},120)}).observe($('#stage'));
/** --frame-h: the canvas frame's height while it is sticky (0 while it has no box). On portrait phones and tablets the root's
 scroll-padding uses it, so the layer list and a focused slider never scroll in under the frame. */
new ResizeObserver(()=>{const frame=$('.stage-frame'),h=frame&&getComputedStyle(frame).position==='sticky'?Math.ceil(frame.getBoundingClientRect().height):0;document.documentElement.style.setProperty('--frame-h',`${h}px`)}).observe($('.stage-frame'));
/**
 * Cut and erase act on the stem under the pointer. Split: a stroke that starts on another stem switches to it, unless the
 * selected stem is within 24 px (strokes start beside the twig). Erase: only when the selected stem has nothing within the
 * brush and another stem does. Decided once, at pointerdown.
 */
function retargetPrune(e){
 const touch=e.pointerType==='touch',brush=editMode==='brush',radius=brush?Math.max(1,Number($('#brush-size').value)/2):touch?12:6;
 const id=pickStem(e.clientX,e.clientY,{touch,radius,keep:brush?radius:24,selectedFirst:true}).id;
 if(!id||id===selected)return;
 selectItem(id);
}
$('#stage').addEventListener('pointerdown',e=>{if(editMode==='move'||e.button!==0||!current()||stroke)return;e.preventDefault();lastPointerType=e.pointerType;retargetPrune(e);if(editMode==='split'&&(current().localCuts||[]).length>=8)return toast(L('这一段已经剪得很细，可先整理现有片段。','This piece has reached the cut limit. Arrange its pieces first.','この部分はこれ以上分割できません。'));if(editMode!=='split'&&current().cuts.length>=24)return toast(L('这枝已有 24 处剪口；可恢复剪枝后重剪。','This stem already has 24 cuts. Restore it before pruning again.'));const total=state.items.reduce((n,i)=>n+i.cuts.reduce((m,c)=>m+c.points.length,0),0);if(editMode!=='split'&&total>7800)return toast(L('剪枝细节已很多，请先恢复部分剪口。','There is extensive pruning detail. Restore some cuts first.'));const item=current(),p=stageToSource(pointerStage(e),item,assetById[item.type]);stroke={kind:editMode,points:[p],radius:clamp(Number($('#brush-size').value)/$('#stage').getBoundingClientRect().width/(item.h/100)/2,.002,.3),pointer:e.pointerId};$('#stage').setPointerCapture(e.pointerId);drawPruneOverlay()});
let brushPreviewFrame=0;
$('#stage').addEventListener('pointermove',e=>{if(!stroke||stroke.pointer!==e.pointerId)return;const item=current();const p=stageToSource(pointerStage(e),item,assetById[item.type]);const previous=sourceToStage(stroke.points.at(-1),item,assetById[item.type]),next=pointerStage(e);if(Math.hypot(next[0]-previous[0],next[1]-previous[1])<.003)return;if(stroke.kind==='split')stroke.points=[stroke.points[0],p];else stroke.points.push(p);if(stroke.points.length>512)stroke.points=simplifyPoints(stroke.points,256);if(stroke.kind==='brush'&&!brushPreviewFrame){const itemId=item.id;brushPreviewFrame=requestAnimationFrame(()=>{brushPreviewFrame=0;if(stroke?.kind==='brush'&&current()?.id===itemId)drawStemCanvas($(`.stem[data-id="${itemId}"]`),item,{previewCut:stroke})})}drawPruneOverlay()});
function splitSelected(cut){
 const item=current(),asset=item&&assetById[item.type],img=item&&images[item.type];if(!item||!img)return false;
 if(state.items.length>=24){toast(L('画布最多放置 24 段花材。','The canvas can hold up to 24 pieces.','キャンバスには24点まで配置できます。'));return false}
 const p0=cut.points[0],p1=cut.points.at(-1),stage0=sourceToStage(p0,item,asset),stage1=sourceToStage(p1,item,asset);
 if(Math.hypot(stage1[0]-stage0[0],stage1[1]-stage0[1])*$('#stage').getBoundingClientRect().width<6){if(!document.body.classList.contains('atelier-simple'))toast(L('横划过要剪的细枝，划过连接处即可。','Draw across the twig at its attachment.','切りたい小枝の付け根を横切ってください。'));return false}
 let result;try{
  const sprite=specimenCanvas(item),g=dimensions(item,asset),w=sprite?.crop?.fullWidth||sprite?.width,h=sprite?.crop?.fullHeight||sprite?.height;
  if(!sprite||!w||!h)return false;
  const point=p=>[p[0]*w,warpY(p[1],g.split,g.length)*h/g.height];
  const anchor=item.localCuts?.at(-1)?.anchor;
  const cutOptions={preferStart:true,photoHeightRatio:Math.min(1,1/g.height)};
  if(anchor)cutOptions.rootPoint=[anchor[0]*w,anchor[1]*h];
  result=analyzeLocalCut(sprite,{a:point(p0),b:point(p1)},cutOptions);
  if(result.ok)result.cut={...result.cut,v:2,frame:{split:g.split,length:g.length,end:g.end}};
 }catch(err){canvasTrouble(err);return false}
 if(!result.ok){if(!document.body.classList.contains('atelier-simple'))toast(result.reason==='short'?L('请横划过想剪开的连接处。','Draw across the attachment to cut it.','切りたい付け根を横切ってください。'):L('这一剪还没把局部剪开，请靠近枝叶连接处再试。','That stroke did not separate a local piece. Try near its attachment.','まだ切り離されていません。枝葉の付け根で試してください。'));return false}
 const root=item.originId||item.id,prefix=item.pieceLabel||'',makePiece=(part,label)=>({...clone(item),id:uid(),originId:root,pieceLabel:label,localCuts:[...(item.localCuts||[]),{cut:result.cut,part,anchor:result.anchors[part]}]});
 const pieces=[makePiece('main',prefix?`${prefix}1`:'A'),makePiece('detached',prefix?`${prefix}2`:'B')];
 checkpoint();const index=state.items.findIndex(i=>i.id===item.id);state.items.splice(index,1,...pieces);selected=pieces[1].id;cutSession=null;dropSprite(item.id);setEditMode('move');renderStage();persist();return true;
}
function finishPrune(e,cancel=false){
 if(!stroke||stroke.pointer!==e.pointerId)return;const cut=stroke;stroke=null;
 if(e.pointerType==='touch')suppressLayerContextUntil=performance.now()+600;
 if(!cancel&&cut.kind==='split'){if(cut.points.length>=2&&splitSelected(cut))return;renderStage();return}
 if(!cancel&&cut.kind==='brush'){
  const item=current();
  // A stroke that reaches no visible pixel of the stem (on the pre-cut mask) is not a cut: no undo step, nothing stored.
  if(!strokeTouches(specimenCanvas(item)?.mask,cut,item,assetById[item.type])){renderStage();return}
  checkpoint();item.cuts.push({kind:cut.kind,points:simplifyPoints(cut.points),radius:clamp(cut.radius,.002,.3)});
  const mask=specimenCanvas(item)?.mask,fullyErased=!!mask&&!mask.data.some(alpha=>alpha>12);
  if(fullyErased){state.items=state.items.filter(entry=>entry.id!==item.id);dropSprite(item.id);selected=state.items.find(entry=>entry.originId&&entry.originId===item.originId)?.id||state.items.at(-1)?.id||null;cutSession=null;setEditMode('move')}
 }
 renderStage();if(!cancel)persist();
}
$('#stage').addEventListener('pointerup',e=>finishPrune(e));$('#stage').addEventListener('pointercancel',e=>finishPrune(e,true));
/** Esc steps back one level: leave cut/erase, then close the cut choice, layers or material drawer, then deselect. */
function escapeStep(){
 if(editMode!=='move'){setEditMode('move');renderStage();return true}
 if(cutSession||!$('#layer-menu').hidden||!$('#quick-material-drawer').hidden){cutSession=null;renderCutChoice();closeLayerMenu();closeQuickMaterialDrawer();return true}
 if(selected){selectItem(null);return true}
 return false;
}
/** Arrow nudges, bracket turns and wheel turns/sizes: one undo step per burst (needsCheckpoint; `gap` ms between steps), saved through the persist debounce. */
function keyStep(kind,item,apply,gap=700){
 const now=performance.now();if(needsCheckpoint(lastKeyStep,{kind,id:item.id,mark:undoStack.at(-1),now},gap))checkpoint();
 lastKeyStep={kind,id:item.id,mark:undoStack.at(-1),time:now};apply(item);queueStemUpdate(item);schedulePersist();
}
/**
 * Arrow keys (A11). A stem standing in the vessel: ←/→ turn it 1° (Shift 5°) about its base (a piece: its cut end), ↑/↓
 * lengthen or shorten a drawn stem by 1 cm (Shift 5 cm), up to its species' usual length or its own when longer (stemCeil);
 * a photographed stem keeps its photograph's length and says so once.
 * Alt+arrows, and every stem that is not in the vessel, move it 0.5 cm (Shift 2 cm) as before.
 */
function arrowStep(item,action){
 const a=assetById[item.type];
 if(action.alt||!isSeated(item)){keyStep('nudge',item,i=>{i.x=clamp(i.x+action.dx,5,95);i.y=clamp(i.y+action.dy,15,95)});return}
 if(action.dx){const deg=Math.sign(action.dx)*(action.shift?5:1);keyStep('turn',item,i=>aboutCutEnd(i,j=>{j.angle=clamp(Math.round((j.angle+deg)*10)/10,-180,180)}));return}
 if(keptStemCm(item)===null){if(!photoArrowHint){photoArrowHint=true;toast(L('这枝的长度就是照片里的长度，↑/↓ 不改变它；←/→ 转向，Alt+方向键移动。','This stem keeps its photograph’s length, so ↑/↓ leave it; ←/→ turn it, Alt+arrows move it.','この茎は写真の長さのままです。↑/↓では変わりません。←/→で向きを変え、Alt+矢印で移動します。'))}return}
 const step=(action.dy<0?1:-1)*(action.shift?5:1);
 // Within one burst (one undo step) the top stays where the burst began, as the slider's does while it is held.
 const burst=!needsCheckpoint(lastKeyStep,{kind:'stem',id:item.id,mark:undoStack.at(-1),now:performance.now()})&&lastKeyStep.ceil,ceil=Math.max(stemCeil(item,a),burst||0);
 keyStep('stem',item,i=>{const cm=clamp(Math.round(stemCm(i,a))+step,0,ceil);i.length=Math.min(lengthForStem(i,a,cm),lengthBounds(a,i.h,i.trim)[1])});lastKeyStep.ceil=ceil;
}
/**
 * One studio keyboard map (keyAction in editor-state.js). Text fields, selects, editable content and open dialogs keep their
 * own keys, including native text undo. Undo/redo and Esc work anywhere in the studio; the stem keys (arrows, [ ], Delete,
 * Enter, Mod+D) only while focus is on the canvas, its toolbar or the mode pill.
 */
document.addEventListener('keydown',e=>{
 if(e.defaultPrevented||e.isComposing)return;
 const target=e.target instanceof Element?e.target:null;
 if(target?.closest('input,textarea,select,[contenteditable]:not([contenteditable=false]),dialog')||document.querySelector('dialog[open]')||$('#studio-view')?.hidden)return;
 const action=keyAction(e);if(!action)return;
 const onStage=!!target?.closest('#canvas-viewport,.stage-tools');
 if(action.type==='undo'||action.type==='redo'){e.preventDefault();$(`#${action.type}-button`).click();return}
 if(action.type==='escape'){if(escapeStep())e.preventDefault();return}
 if(!onStage)return;
 if(action.type==='select'){const stem=target.closest('.stem');if(stem){e.preventDefault();selectItem(stem.dataset.id)}return}
 const item=current();if(!item)return;
 if(action.type==='duplicate'){e.preventDefault();duplicateSelected();return}
 if(action.type==='remove'){e.preventDefault();removeSelected();return}
 if(action.type==='nudge'){e.preventDefault();arrowStep(item,action);return}
 if(action.type==='rotate'){e.preventDefault();keyStep('rotate',item,i=>aboutCutEnd(i,j=>{j.angle=clamp(Math.round((j.angle+action.deg)*10)/10,-180,180)}))}
});
// Keyboard focus selects: tabbing onto a stem makes it the one the keys and the panel act on. Focus from a press (a mouse
// down or a touch tap on a transparent part of a stem's box) is not :focus-visible and must not select: picking decides that.
const keyboardFocus=el=>{try{return el.matches(':focus-visible')}catch{return true}};
$('#stage').addEventListener('focusin',e=>{const stem=e.target.closest?.('.stem');if(stem&&!restoringStemFocus&&stem.dataset.id!==selected&&keyboardFocus(stem)&&state.items.some(i=>i.id===stem.dataset.id)){selectItem(stem.dataset.id);revealStemPanel()}});
/** Slider ticks restyle only the selected stem once per frame; drawn stems keep their centimetres, and the length slider
 stops at the species' usual length (stemCeil). */
for(const [id,key,factor] of [['angle','angle',1],['size','h',1],['trim','trim',1],['length','length',.01]]){let active=false;const el=$('#'+id);el.addEventListener('input',()=>{const item=current();if(!item)return;const a=assetById[item.type];if(key==='trim'&&drawsStem(a))return;if(!active){checkpoint();active=true;if(key==='length')lengthCeil={id:item.id,max:+el.max}}const maxLength=()=>lengthBounds(a,item.h,item.trim)[1];const apply=i=>{if(key==='length'&&drawsStem(a))i.length=Math.min(lengthForStem(i,a,+el.value),maxLength());else if(key==='h'&&drawsStem(a)){const cm=stemCm(i,a);i.h=+el.value;i.length=Math.min(lengthForStem(i,a,cm),maxLength())}else if(key==='length'){if(!setStemLength(i,a,+el.value*factor))i.length=+el.value*factor}else i[key]=+el.value*factor};if(key==='angle'||key==='h')aboutCutEnd(item,apply);else apply(item);queueStemUpdate(item);schedulePersist()});const release=()=>{active=false;if(key==='length'&&lengthCeil){lengthCeil=null;const item=current();if(item)renderSizeControls(item)}flushPersist()};el.addEventListener('change',release);el.addEventListener('blur',release)}
function removeSelected(){const item=current();if(!item)return;const name=itemName(item);checkpoint();state.items=state.items.filter(i=>i.id!==selected);selected=state.items.at(-1)?.id||null;setEditMode('move');renderStage();persist();undoToast(L(`已移除${name}`,`Removed ${name}`,`${name}を外しました`))}
/**
 * Duplicate (A11). A copy of a stem standing in the vessel is a companion inserted just behind it: its base 1.5 cm beside the
 * original's (alternating sides), its focus turned 12° toward the side with fewer flowers and 20% lower (companionFit; a cut
 * piece only turns about its cut end and moves along the mouth). Anything else keeps the old small offset in front. The copy
 * keeps its cuts and drops the piece label (labels are A/B/1/2 paths of one cut stem).
 */
function duplicateSelected(){
 const item=current();if(!item)return;if(state.items.length>=24)return toast(L('画布最多放置 24 组花材。','The canvas can hold up to 24 material layers.'));
 const a=assetById[item.type],vessel=assetById[state.vessel],seated=isSeated(item),uv=cutEndSource(item,a);
 checkpoint();const duplicate={...clone(item),id:uid(),pieceLabel:'',cuts:clone(item.cuts||[]),localCuts:clone(item.localCuts||[])};duplicate.originId=duplicate.id;const index=state.items.findIndex(i=>i.id===item.id);
 if(seated){
  const head=uv?(()=>{const h=pieceHead(item,a,specimenCanvas(item)?.mask);return h?sourceToStage(h,item,a).map(v=>v*100):tipPoint(item,a)})():tipPoint(item,a);
  const tips=state.items.filter(i=>i!==item&&assetById[i.type]).map(i=>tipPoint(i,assetById[i.type])[0]),left=tips.filter(x=>x<head[0]-.5).length,right=tips.filter(x=>x>head[0]+.5).length;
  const side=duplicateSide,toward=right<left?1:left<right?-1:side;duplicateSide=-duplicateSide;
  if(uv){const mouth=besideBase(vessel,seatPoint(item,a)[0],side,{front:!!item.aboveVessel});duplicate.angle=clamp(Math.round((item.angle+12*toward)*10)/10,-180,180);const at=anchorAt(duplicate,a,uv,mouth);duplicate.x=clamp(at.x,5,95);duplicate.y=clamp(at.y,15,95)}
  else Object.assign(duplicate,companionClear(item,a,vessel,{side,toward,others:state.items.filter(i=>i!==item&&i.type===item.type).map(i=>tipPoint(i,a))}));
  state.items.splice(index,0,duplicate);
 }else{duplicate.x=clamp(item.x+2.5,5,95);duplicate.y=clamp(item.y-2,15,95);state.items.splice(index+1,0,duplicate)}
 selected=duplicate.id;renderStage();persist();
 undoToast(!seated?L('已复制花材，剪口与长度也已保留。','Duplicated the material with its cuts and stem length.','花材を複製しました。剪定と茎の長さもそのままです。'):uv?L('已复制这一段，插在旁边并稍稍转开。','Duplicated the piece beside it, turned slightly away.','この部分を隣に複製し、少し向きを変えました。'):L('已复制为一枝稍低的陪衬，插在旁边。','Duplicated as a slightly lower companion beside it.','少し低い添えとして隣に複製しました。'));
}
function moveSelectedToFront(){const item=current();if(!item)return;checkpoint();state.items=state.items.filter(i=>i.id!==item.id);item.aboveVessel=true;state.items.push(item);selected=item.id;renderStage();persist();toast(L('已移到最前层','Moved to the front layer'))}
function moveSelectedToBack(){const item=current();if(!item)return;checkpoint();state.items=state.items.filter(i=>i.id!==item.id);item.aboveVessel=false;state.items.unshift(item);selected=item.id;renderStage();persist();toast(L('已移到最后层','Moved to the back layer'))}
function moveSelectedToRandomMiddle(){
 const item=current();if(!item)return;
 const back=state.items.filter(i=>!i.aboveVessel&&i!==item),front=state.items.filter(i=>i.aboveVessel&&i!==item);
 const original=state.items.filter(i=>!i.aboveVessel).indexOf(item),positions=Array.from({length:back.length+1},(_,index)=>index);
 const middle=positions.filter(index=>index>0&&index<back.length),pool=middle.length?middle:positions;
 const choices=pool.filter(index=>item.aboveVessel||index!==original);if(!choices.length)return;
 checkpoint();item.aboveVessel=false;back.splice(choices[Math.floor(Math.random()*choices.length)],0,item);state.items=[...back,...front];selected=item.id;renderStage();persist();undoToast(L('已随机放在花器后方','Placed behind the vase','花器の後ろに配置しました'));
}
/** First-screen actions follow the selected stem, or the frontmost stem when none is selected. */
function toolbarItem(){
 if(!current()&&state.items.length)selectItem((state.items.filter(i=>i.aboveVessel).at(-1)||state.items.at(-1)).id);
 if(current())setEditMode('move');
 return current();
}
$('#delete-button').onclick=removeSelected;$('#reseat-button').onclick=reseatSelected;$('#scale-reset').onclick=resetRealSize;$('#stem-cap-reset').onclick=naturalLength;$('#flip-button').onclick=()=>{const item=toolbarItem();if(!item)return;const seated=isSeated(item);checkpoint();aboutCutEnd(item,i=>{i.flip=!i.flip;if(seated)i.angle=-i.angle||0});renderStage();persist()};$('#seat-all').onclick=seatAll;$('#seat-banner-close').onclick=()=>{seatBannerClosed=floatingItems().map(i=>i.id).sort().join(',');renderSeatCues()};$('#duplicate-button').onclick=()=>{if(toolbarItem())duplicateSelected()};$('#layer-button').onclick=moveSelectedToFront;$('#layer-back-button').onclick=moveSelectedToBack;
$('#undo-button').onclick=()=>{finishMoveInteraction(true);if(!undoStack.length)return;redoStack.push({state:clone(state),selected});const previous=undoStack.pop();state=previous.state;selected=previous.selected;cutSession=null;setEditMode('move');renderAll()};$('#redo-button').onclick=()=>{finishMoveInteraction(true);if(!redoStack.length)return;undoStack.push({state:clone(state),selected});const next=redoStack.pop();state=next.state;selected=next.selected;cutSession=null;setEditMode('move');renderAll()};
$('#guide-button').onclick=()=>setGuide($('#guide').hidden);$('#reset-button').onclick=()=>{if(!state.items.length)return toast(L('花器里还没有花材。','There are no materials to clear.','まだ花材がありません。'));checkpoint();state.items=[];selected=null;cutSession=null;setEditMode('move');renderStage();persist();undoToast(L('已清空花材','All materials cleared','花材をすべて外しました'))};
$$('button[data-scene]').forEach(b=>b.onclick=()=>{checkpoint();state.scene=b.dataset.scene;renderStage();persist()});
$('#light-button')?.addEventListener('click',()=>setLightMenu($('#light-menu').hidden));
$$('[data-light]').forEach(b=>b.onclick=()=>{
 const next=lightOf(b.dataset.light);setLightMenu(false);$('#light-button')?.focus({preventScroll:true});
 if((lightOf(state.light)||null)===next)return;
 checkpoint();if(next)state.light=next;else delete state.light;renderStage();persist();
});
$('.light-picker')?.addEventListener('keydown',e=>{if(e.key==='Escape'&&!$('#light-menu').hidden){e.preventDefault();e.stopPropagation();setLightMenu(false);$('#light-button')?.focus({preventScroll:true})}});
document.addEventListener('pointerdown',e=>{const menu=$('#light-menu');if(menu&&!menu.hidden&&!e.target.closest?.('.light-picker'))setLightMenu(false)},true);
$('.light-picker')?.addEventListener('focusout',e=>{if(e.relatedTarget&&!e.currentTarget.contains(e.relatedTarget))setLightMenu(false)});$$('[data-mood]').forEach(b=>b.onclick=()=>{checkpoint();state.mood=b.dataset.mood;$$('[data-mood]').forEach(t=>{t.classList.toggle('active',t===b);t.setAttribute('aria-pressed',String(t===b))});persist()});
$('#work-title').addEventListener('input',e=>{state.title=e.target.value;persist()});$('#work-subtitle').addEventListener('input',e=>{state.subtitle=e.target.value;persist()});$('#intention').addEventListener('input',e=>{state.intention=e.target.value;persist()});
$('#generation-mode').onchange=e=>{checkpoint();state.generation=e.target.value;$('#generation-mode-help').textContent=generationDescriptions[lang][state.generation];persist()};

function openModal(html,kicker='HANAMA ATELIER'){endPackSession();endKindSession();$('#modal-kicker').textContent=kicker;$('#modal').classList.toggle('variant-modal',kicker==='BOTANICAL VARIATIONS');$('#modal').classList.toggle('pack-modal',kicker===PACK_KICKER);$('#modal-content').innerHTML=html;icons($('#modal'));if(!$('#modal').open)$('#modal').showModal()}
$('#close-modal').onclick=()=>$('#modal').close();$('#modal').addEventListener('close',()=>{endPackSession();endKindSession();const t=$('#toast');if(t?.parentElement===$('#modal'))document.body.append(t)});$('#modal').addEventListener('click',e=>{if(e.target===$('#modal')){const r=$('#modal').getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)$('#modal').close()}});
function help(){
 const copy=lang==='en'?{
  title:'Take a moment and arrange slowly.',
  steps:[
   ['Choose a stem, then shape it.','Use Flowers to choose plants or vessels. Pull a flower head to bend its branch, drag the base dot to move it, and use two fingers to rotate and scale. The coloured handles adjust angle and size. Tap Length below the flowers to stretch a stem without enlarging its flower head.'],
   ['Cut or refine.','Tap the scissors to cut a twig, or the eraser to brush away details. Both pieces stay on the canvas after a cut and can be moved separately. Tap the active tool again or press Esc to return to arranging. Undo and Redo are always beside the tools.'],
   ['Find the light, keep the moment.','Light offers all nine backgrounds, four atmosphere presets and direct light controls. Open Keep to save a draft, take a photo or immerse yourself in the arrangement. More contains the recipe, sharing and an AI image pack. Imported photos stay with your drafts in My Works.']
  ],
  note:'Ctrl/⌘+Z undoes, Ctrl/⌘+Shift+Z redoes, Delete removes, and Esc leaves the current tool. Drafts and artworks stay in this browser; export a file to keep a backup.',
  done:'Start arranging',import:'Import draft file'
 }:lang==='ja'?{
  title:'ゆっくり、ひと枝ずつ。',
  steps:[
   ['花材を選び、枝を曲げる。','「花材」から花材や花器を選びます。花先を引くと枝が曲がり、根元の点で移動できます。2本指で回転・拡大縮小。色付きハンドルで角度や大きさを変え、花の下の「茎の長さ」で花先の大きさを保って茎を伸ばせます。'],
   ['切って、細部を整える。','ハサミを選んで小枝を切り、消しゴムで細部をなぞって消します。切った両方の部分はそのまま残り、別々に動かせます。同じツールをもう一度タップするか、Escで終了します。「元に戻す」と「やり直す」はすぐ隣にあります。'],
   ['光を選び、この瞬間を残す。','「光と景」には9つの背景、4つの光のプリセット、直接使える光の調整があります。「作品」から下書き保存、撮影、鑑賞ができます。「その他」にはレシピ、共有、AI生成用パックがあります。取り込んだ写真は下書きと一緒に「マイ作品」に残ります。']
  ],
  note:'Ctrl/⌘+Zで元に戻す、Ctrl/⌘+Shift+Zでやり直し、Deleteで削除、Escで現在のツールを終了します。下書きと作品はこのブラウザに保存されます。ファイルを書き出すとバックアップできます。',
  done:'創作を始める',import:'下書きを読み込む'
 }:{
  title:'给自己一刻，慢慢插花。',
  steps:[
   ['挑一枝，弯出姿态。','从「花材」选择花与枝或花器。拖花头弯枝，拖根部圆点移位，双指旋转和缩放；彩色手柄可单独调角度与大小，点画布下方「枝长」直接拉伸枝干，花头大小保持不变。'],
   ['剪一剪，留出呼吸。','点剪刀横划细枝，点橡皮涂抹细节。剪开的两段直接留在画布上，可以分别移动。再点一次当前工具或按 Esc 即可继续插花，撤销与重做就在工具旁。'],
   ['选一束光，留住这一刻。','「光景」直接展示 9 款背景、四种自然氛围和光照调节。「作品」里可保存草稿、拍照或全屏赏花；「更多」里还有配方、分享和AI生图包。导入的照片会与草稿一起保存在「我的作品」。']
  ],
  note:'Ctrl/⌘+Z撤销，Ctrl/⌘+Shift+Z重做，Delete删除，Esc退出当前工具。草稿与作品保存在当前浏览器，可导出文件备份。',
  done:'开始这一枝',import:'导入草稿文件'
 };
 const html=`<h2>${copy.title}</h2><div class="step-list">${copy.steps.map(([title,text],index)=>`<div><span class="step-number">0${index+1}</span><p><strong>${title}</strong><br>${text}</p></div>`).join('')}</div><p class="file-note">${copy.note}</p><div class="modal-actions"><button class="button dark" id="help-done">${copy.done}</button><button class="button outline" id="help-import">${copy.import}</button></div>`;
 openModal(html);$('#help-done').onclick=()=>$('#modal').close();$('#help-import').onclick=()=>$('#draft-upload').click();
}
function helpJapanese(){return help()}
$('#help-button').onclick=()=>lang==='ja'?helpJapanese():help();
function sources(){const html=lang==='en'?`<h2>Materials from nature, ideas from ikebana.</h2><p>Hanama is a free-form creative exercise. It does not score work or present its simplified composition hints as school rules.</p><h3>Ikebana references</h3><div class="source-list"><a href="https://chs.ikenobo.jp/about/style.html" target="_blank" rel="noopener noreferrer">Ikenobo · Three styles of ikebana ↗</a><br><a href="https://www.sogetsu.or.jp/e/begin/" target="_blank" rel="noopener noreferrer">Sogetsu · Learning through free expression ↗</a></div><p>Ikenobo free style values the form and texture of plants; Sogetsu encourages personal expression. The spacing and direction cues here are creative suggestions for the game.</p><h3>The Flower Book · reading notes</h3><p>Rachel Siegfried, DK: vessel shape (pp. 10–11), floral roles and natural facing (pp. 12–21), cherry (pp. 64–67), iris (pp. 108–111), and chrysanthemum (pp. 156–159). The editable studies interpret these ideas. The library includes original photographs for all 60 botanical profiles, preserving the flower faces and 34 natural groupings. Page backgrounds and text were removed. Six earlier AI adaptations remain compatible with saved drafts.</p><h3>Asset notes</h3><p>Book photographs are labeled separately from original GPT Image plants. Book vessels use image-assisted extraction and reconstruction of hidden openings. Other newer vessels are original GPT Image assets. Two original vessels come from <a href="https://purepng.com/photo/18638/objects-vase" target="_blank" rel="noopener noreferrer">PurePNG / PNGStock</a>, marked CC0 on the source page. The archived exhibition photograph is Rémi Jouan's <a href="https://commons.wikimedia.org/wiki/File:Ikebana_International_Paris_2019_(01).JPG" target="_blank" rel="noopener noreferrer">Ikebana International Paris 2019 (01)</a>, used under <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener noreferrer">CC BY 4.0</a>.</p><p class="file-note">Sources reviewed September 2026. You control exports and sharing; Hanama does not publish your images automatically.</p>`:`<h2>从自然取材，从花道取意。</h2><p>花间以自由创作练习为出发点，不为作品打分，也不将简化的构图方法当作流派规范。</p><h3>花道参考</h3><div class="source-list"><a href="https://chs.ikenobo.jp/about/style.html" target="_blank" rel="noopener noreferrer">池坊 · 花道的三种样式 ↗</a><br><a href="https://www.sogetsu.or.jp/e/begin/" target="_blank" rel="noopener noreferrer">草月 · 自由表达与学习 ↗</a></div><p>池坊的自由花重视草木的形状与质感；草月鼓励创作者表达自己的想法。这里的留白、方向和疏密提示，是游戏中的创作建议。</p><h3>《The Flower Book》阅读手记</h3><p>Rachel Siegfried 著，DK 出版：花器形态（书页 10–11）、花材主次与自然朝向（12–21）、樱枝（64–67）、鸢尾（108–111）、菊花（156–159）。可编辑练习重新诠释这些思路。素材库已收录书中全部 60 个花材条目的实拍照片，去除版面和底色，保留原有花面与 34 种成组姿态。此前六款 AI 整理素材继续兼容旧草稿。</p><h3>素材说明</h3><p>「原书实拍」保留书中花材摄影，其他花枝姿态使用 GPT Image 原创生成。书中花器通过图像辅助提取并补全遮挡的器口；其他新增花器为 GPT Image 原创。原有两只花器来自 <a href="https://purepng.com/photo/18638/objects-vase" target="_blank" rel="noopener noreferrer">PurePNG / PNGStock</a>，来源页标注 CC0。保留的展览参考摄影为 Rémi Jouan 的 <a href="https://commons.wikimedia.org/wiki/File:Ikebana_International_Paris_2019_(01).JPG" target="_blank" rel="noopener noreferrer">Ikebana International Paris 2019 (01)</a>，依据 <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener noreferrer">CC BY 4.0</a> 使用。</p><p class="file-note">资料整理：2026 年 9 月。你的作品由你导出和分享；本工房不自动公开上传图片。</p>`;openModal(html,'REFERENCES & MATERIALS')}
function sourcesJapanese(){openModal(`<h2>自然の素材と、いけばなの発想。</h2><p>花間は自由な創作を楽しむためのアトリエです。構図のヒントは流派の決まりではなく、表現のための提案です。</p><h3>いけばなの参考</h3><div class="source-list"><a href="https://chs.ikenobo.jp/about/style.html" target="_blank" rel="noopener noreferrer">池坊 · いけばなの三つの様式 ↗</a><br><a href="https://www.sogetsu.or.jp/e/begin/" target="_blank" rel="noopener noreferrer">草月流 · 自由な表現から学ぶ ↗</a></div><h3>『The Flower Book』と素材</h3><p>Rachel Siegfried著、DK刊。書籍の植物写真60種と、自然な組み合わせ34点を収録しています。書籍の写真は花の表情を保って整理しています。既存の枝葉素材にはヤナギ、ユーカリ、シダがあります。今後も実物の植物素材を少しずつ追加します。</p><h3>画像の出典</h3><p>書籍由来の植物写真とオリジナル素材を区別して表示しています。器の一部はPurePNG / PNGStockのCC0素材、展示写真はRémi Jouan撮影の<a href="https://commons.wikimedia.org/wiki/File:Ikebana_International_Paris_2019_(01).JPG" target="_blank" rel="noopener noreferrer">Ikebana International Paris 2019 (01)</a>をCC BY 4.0で使用しています。</p><p class="file-note">作品は自動公開されません。保存・書き出し・共有はご自身で行えます。</p>`,'参考資料と素材')}
$('#sources-button').onclick=()=>lang==='ja'?sourcesJapanese():sources();
/** An image, decoded, or a rejection: on error, or after 20 s (a stalled download no longer blocks a study or an export). */
const IMAGE_TIMEOUT_MS=20000;
function loadImage(src){
 const img=new Image();
 const loaded=new Promise((resolve,reject)=>{img.onload=()=>resolve(img);img.onerror=()=>reject(Error(L('图片暂时无法载入，请稍后重试','The image could not be loaded. Please try again.','画像を読み込めませんでした。しばらくしてからもう一度お試しください。')))});
 img.src=src;
 // decode() only settles with a rendered frame, so in a background tab (a share link opened from a chat) it waits until the
 // tab is shown: the loaded image is usable as it is, so wait for decode() briefly and never let it time the image out.
 return withTimeout(loaded.then(async()=>{try{await Promise.race([img.decode?.(),new Promise(resolve=>setTimeout(resolve,300))])}catch{}return img}),IMAGE_TIMEOUT_MS,()=>Error(L('图片载入超时，请检查网络后重试。','The image took too long to load. Check your connection and try again.','画像の読み込みに時間がかかりすぎました。接続を確認して、もう一度お試しください。')),()=>{img.onload=img.onerror=null;img.removeAttribute('src')});
}
const imageTasks=new Map();
function ensureAsset(id){if(images[id])return Promise.resolve(images[id]);if(!imageTasks.has(id)){imageTasks.set(id,loadImage(assetPath(id)).then(img=>{images[id]=img;return img}).catch(err=>{imageTasks.delete(id);throw err}))}return imageTasks.get(id)}
const bootAssetIds=[...new Set([...state.items.map(i=>i.type),state.vessel])],assetsReady=Promise.allSettled(bootAssetIds.map(ensureAsset));
let organicRoomsReady=false;
preloadOrganicRooms().then(()=>{organicRoomsReady=true;sceneLayerKey='';renderStage();gameBridge?.schedule()});
assetsReady.then(results=>{renderStage();persist();if(demoAtBoot!==null&&!undoStack.length&&[state.title,state.subtitle,state.intention].join('\n')===demoAtBoot)markClean();if(results.some(r=>r.status==='rejected'))toast(missingMessage(failedIds(bootAssetIds,results)))});
function drawCover(ctx,img,x,y,w,h){const factor=Math.max(w/img.width,h/img.height),iw=img.width*factor,ih=img.height*factor;ctx.drawImage(img,x+(w-iw)/2,y+(h-ih)/2,iw,ih)}
/** Asset ids as names for a toast: "松枝、马蹄莲" / "Pine branch, Calla lily", at most four and then "…". */
function assetNames(ids){const names=[...new Set(ids.map(id=>assetById[id]?assetName(assetById[id]):id))],list=names.slice(0,4).join(L('、',', ','、'));return names.length>4?list+L(' 等',' …','など'):list}
const missingMessage=ids=>L(`${assetNames(ids)} 没能载入，暂时空着；网络恢复后再打开即可。`,`${assetNames(ids)} did not load and ${new Set(ids).size>1?'are':'is'} left out for now; open it again when the connection is back.`,`${assetNames(ids)}を読み込めず、いまは外しています。接続が戻ったらもう一度開いてください。`);
/** The draft painted at `size` px. Materials whose image will not load are left out (with a toast unless `report` is false);
 the canvas lists them in `.missing`. */
async function draftCanvas(s=state,size=1600,{report=true}={}){
 await preloadOrganicRooms();
 // A work stored before drawn-stem renderer 2 has no sv: draw it as validate() would open it in the studio.
 if(s.items.some(i=>i.sv===undefined))s={...s,items:s.items.map(i=>i.sv===undefined?{...i,sv:stemVersion(i)}:i)};
 const ids=[...new Set([...s.items.map(i=>i.type),s.vessel])],missing=failedIds(ids,await Promise.allSettled(ids.map(ensureAsset)));
 if(missing.length){s={...s,items:s.items.filter(i=>!missing.includes(i.type))};if(report)toast(missingMessage(missing))}
 const c=document.createElement('canvas');c.width=c.height=size;
 paintArrangement(c.getContext('2d'),size,s,assetById,scenes,specimenCanvas,images);c.missing=missing;return c;
}
async function compositionGuideCanvas(s=state,size=1600){
 await Promise.all([...new Set([...s.items.map(i=>i.type),s.vessel])].map(ensureAsset));const c=document.createElement('canvas');c.width=c.height=size;paintCompositionGuide(c.getContext('2d'),size,s,assetById,scenes,specimenCanvas,images);return c;
}
const canvasBlob=(c,type='image/png',quality=.95)=>new Promise((resolve,reject)=>c.toBlob(b=>b?resolve(b):reject(Error(L('无法导出图片，请重试','The image could not be exported. Please try again.'))),type,quality));
function download(blob,name){const a=document.createElement('a');const url=URL.createObjectURL(blob);a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),30000)}
const fileTitle=s=>(s.title||L('花间作品','Hanama Work','花間作品')).replace(/[\\/:*?"<>|]/g,'-');
/** The generation prompt (prompt.js). An untouched preset note goes in as its English text, as a mood cue rather than an
 instruction; `extras.guide` adds the sentence for the zip, which also carries composition-guide.png. */
const promptFor=(s=state,extras={})=>buildPrompt(s,assetById,scenes,{outOfScale:s.items.some(i=>assetById[i.type]&&outOfScale(i,assetById[i.type])),presetNote:intentionPresets.includes(s.intention)?intentionPresets[1]:false,...extras});
/** The zip writer (crc32, zipFiles) lives in my-works.js with the backup reader. */
async function copyText(text){try{await navigator.clipboard.writeText(text);toast(L('已复制','Copied'))}catch{const ta=document.createElement('textarea');ta.value=text;$('#modal').open?$('#modal-content').append(ta):document.body.append(ta);ta.select();const ok=document.execCommand('copy');ta.remove();toast(ok?L('已复制','Copied'):L('请长按或选中文字后手动复制','Select the text and copy it manually'))}}
/** Render each pass separately so a cut piece remains its own editable Compositor layer. */
async function layeredCompositorZip(snapshot,size=1600){
 await preloadOrganicRooms();
 await Promise.all([...new Set([...snapshot.items.map(i=>i.type),snapshot.vessel])].map(ensureAsset));
 // The same passes as the flat draft, so the layers composite to draft.png: ground shadows under the stems behind the vessel,
 // their inserted ends (with the support) above it, and the front rim over stems in front, each only when it has content.
 const clips=seatedClips(snapshot,assetById,specimenCanvas),seats=kenzanSeats(snapshot,assetById,specimenCanvas),flags={light:!!lightOf(snapshot.light),ground:true,interior:clips.interior.length>0||seats.back.length>0,water:seats.front.length>0,rim:clips.rim.length>0};
 const plan=compositorLayerPlan(snapshot,item=>assetName(assetById[item.type]),flags);
 const root=`${fileTitle(snapshot).slice(0,70)||'Hanama'}.comp`,files=[],layers=[];
 for(let index=0;index<plan.length;index++){
  const pass=plan[index],id=crypto.randomUUID().toUpperCase(),canvas=document.createElement('canvas');canvas.width=canvas.height=size;
  try{
   const ctx=canvas.getContext('2d');if(!ctx)throw Error(L('画布内存不足，请稍后重试。','Not enough canvas memory. Please try again.','キャンバスのメモリが不足しています。再度お試しください。'));
   if(pass.kind==='background')paintSceneBackground(ctx,size,snapshot,scenes);
   if(pass.kind==='light'){paintSceneBackground(ctx,size,snapshot,scenes);paintLightPass(ctx,size,snapshot,assetById,specimenCanvas,images,undefined,{patch:false});if(flags.ground)paintGroundPass(ctx,size,snapshot,assetById,images);paintLightPass(ctx,size,snapshot,assetById,specimenCanvas,images,undefined,{ambient:false})}
   if(pass.kind==='botanical')paintBotanicalLayer(ctx,size,snapshot,pass.item,assetById,specimenCanvas);
   if(pass.kind==='ground')paintGroundPass(ctx,size,snapshot,assetById,images);
   if(pass.kind==='vessel')paintVesselLayer(ctx,size,snapshot,assetById,images,{ground:!flags.ground,fixture:!flags.interior});
   if(pass.kind==='interior')paintInsertedPass(ctx,size,snapshot,assetById,images,specimenCanvas,{clips:clips.interior,seats});
   if(pass.kind==='water')paintKenzanPass(ctx,size,snapshot,assetById,images,{seats,side:'front',getSprite:specimenCanvas});
   if(pass.kind==='rim')paintRimPass(ctx,size,snapshot,assetById,images,specimenCanvas,{clips:clips.rim});
   if(pass.kind==='finish')paintSceneFinish(ctx,size,snapshot);
   files.push([`${root}/images/${id}.png`,await canvasBlob(canvas)]);
  }finally{canvas.width=canvas.height=0}
  layers.push({id,name:pass.kind==='botanical'?`${String(index).padStart(2,'0')} · ${pass.name}`:pass.name});
 }
 const manifest=compositorManifest(size,layers,crypto.randomUUID().toUpperCase());
 files.unshift([`${root}/manifest.json`,new Blob([JSON.stringify(manifest,null,2)],{type:'application/json'})]);
 const notes='HANAMA × Compositor\n\n1. Unzip this archive. Open the .comp folder in Compositor 1.3 or later on macOS.\n2. The background, each cut flower or leaf layer, vessel, and atmosphere remain separate.\n3. composition.json is the editable Hanama draft; import it at flowerist.org to keep arranging there.\n\nCompositor and its documented .comp format: https://github.com/robbietilton/Compositor\nCopyright (c) 2026 Wonder Assembly LLC. MIT license: https://github.com/robbietilton/Compositor/blob/main/LICENSE\n';
 files.push(['README.txt',new Blob([notes],{type:'text/plain;charset=utf-8'})]);
 files.push(['composition.json',new Blob([JSON.stringify(snapshot,null,2)],{type:'application/json'})]);
 return zipFiles(files);
}
/** Refinement modes, [zh, en, ja] picked with say(): the dialog's segment labels; the full names and pack file names live in prompt.js. */
const MODE_SHORT={natural:['自然重整','Gentle','自然に'],creative:['花艺润色','More refined','ほどよく'],faithful:['最小修正','Minimal','最小限']};
const PROVIDER_HELP={
 chatgpt:['上传草稿图，粘贴 Prompt，一起发送。','Attach the draft and send it with the prompt.','下書き画像を添付し、プロンプトと一緒に送信します。'],
 gemini:['在 Gemini 的「图片」中上传草稿图，再粘贴 Prompt；有 Nano Banana 选项时可使用。','In Gemini Images, upload the draft and paste the prompt; use Nano Banana when offered.','Gemini の「画像」で下書きをアップロードし、プロンプトを貼ります。Nano Banana があれば選べます。']
};
const FORMAT_HELP={
 phone:['竖向延展背景，保留完整花器；上方留一点安静空间。','The scene expands vertically; the full vase stays visible with room above.','背景を縦に広げ、花器を収めて上部に余白を残します。'],
 macbook:['向两侧自然延展，花器不拉伸，留出桌面图标空间。','The scene expands sideways without stretching the arrangement.','左右に自然に広げ、花器を伸ばさず余白を残します。'],
 square:['保留方形构图，完整呈现花器与留白。','Keep a square composition with the whole vase in view.','正方形の構図で、花器と余白を収めます。']
};
const say=([zh,en,ja])=>L(zh,en,ja);
const PACK_KICKER='DRAFT → IMAGE → ARTWORK';
/** The open generation dialog (A17): the snapshot it packs and the prompt shown, which a pasted or dropped photo attaches to
 (B5). Null when the dialog is closed or shows something else. */
let packSession=null;
function endPackSession(){if(!packSession)return;const session=packSession;packSession=null;session.closed=true;session.urls.forEach(URL.revokeObjectURL)}
/**
 * The generation dialog: three steps that work on phones. 1 hands the draft image to ChatGPT (the share sheet on touch devices
 * that can share files, else an image on the clipboard, else the image itself to long-press or download); 2 copies the prompt,
 * ready at once because it needs no rendering; 3 brings the photo back. Floating and out-of-scale stems are listed first with
 * one Fix all. The mode switch rewrites the prompt; the zip, the layout guide and the layered project sit under More exports.
 */
async function generatePackageV3(){
 if(!state.items.length){toast(L('先添入一枝花，再让灵感开花。','Add at least one material before creating a generation pack.'));return}
 const snapshot=clone(state),variation=Date.now(),materialCount=new Set(snapshot.items.map(i=>i.originId||i.id)).size;
 const floating=[],oversize=state.items.filter(i=>{const a=assetById[i.type];return !!a&&outOfScale(i,a)});
 const coarse=mediaMatches('(pointer:coarse)'),wechat=/MicroMessenger/i.test(navigator.userAgent||'');
 let shareFiles=false;try{shareFiles=coarse&&!wechat&&!!navigator.canShare?.({files:[new File([new Uint8Array(8)],'draft.png',{type:'image/png'})]})}catch{}
 const handoff=shareFiles?'share':!wechat&&typeof ClipboardItem==='function'&&!!navigator.clipboard?.write?'copy':'show';
 const names=list=>list.slice(0,4).map(itemName).join(lang==='en'?', ':'、')+(list.length>4?'…':'');
 const checks=[
  oversize.length&&L(`${oversize.length} 枝超出真实比例：${names(oversize)}`,`${oversize.length} stem${oversize.length>1?'s':''} beyond true size: ${names(oversize)}`,`${oversize.length}本が実寸を外れています：${names(oversize)}`)
 ].filter(Boolean);
 const imageHint=handoff==='share'?L('在分享面板里选生图工具；Prompt 会同时复制好。','Pick your image app in the share sheet; the prompt is copied too.','共有メニューで画像生成ツールを選びます。プロンプトもコピーされます。')
  :handoff==='copy'?L('复制后，在所选生图工具中粘贴 (⌘/Ctrl+V)，或下载后上传。','Copy it, then paste into the selected image tool (⌘/Ctrl+V), or download and upload.','コピーして、選んだ画像生成ツールに貼り付けます（⌘/Ctrl+V）。保存してアップロードもできます。')
  :coarse?L('长按图片保存，再上传到所选生图工具。','Long-press to save the image, then upload it to your image tool.','画像を長押しで保存し、選んだツールにアップロードします。')
  :L('下载草稿图，再上传到所选生图工具。','Download the draft image, then upload it to your image tool.','下書き画像を保存して、選んだツールにアップロードします。');
 const html=`<h2>${L('让草稿，成为值得收藏的花艺壁纸。','Make a floral photograph worth keeping as a wallpaper.','下書きから、飾りたくなる花の壁紙へ。')}</h2>
<div class="pack-summary"><img id="draft-preview" alt="${esc(L('草稿图','Draft image','下書き画像'))}"><div><strong>${esc(snapshot.title||L('未命名作品','Untitled Arrangement'))}</strong>${snapshot.subtitle?`<p class="export-subtitle">${esc(snapshot.subtitle)}</p>`:''}<p>${esc(L(`${materialCount} 枝花材`,`${materialCount} material${materialCount>1?'s':''}`,`${materialCount}本の花材`))} · ${esc(assetName(assetById[snapshot.vessel]))}<br>${esc(L('意境：','Mood: ','イメージ：')+moodName(snapshot.mood))}</p></div></div>
${checks.length?`<div class="pack-check" id="pack-check"><p><strong>${L('生成前检查','Before you generate','生成の前に')}</strong></p><ul>${checks.map(text=>`<li>${esc(text)}</li>`).join('')}</ul><button type="button" class="button outline" id="pack-fix">${L('全部修正','Fix all','すべて直す')}</button></div>`:''}
<div class="pack-mode"><span class="slider-label" id="pack-mode-label">${L('整理程度','Refinement','仕上げ')}</span><div class="pack-modes" role="group" aria-labelledby="pack-mode-label">${PACK_MODES.map(mode=>`<button type="button" data-pack-mode="${mode}" aria-pressed="false" title="${esc(say(MODE_NAMES[mode]))}">${esc(say(MODE_SHORT[mode]))}</button>`).join('')}</div><p class="file-note" id="pack-mode-help"></p></div>
<div class="pack-format"><span class="slider-label" id="pack-format-label">${L('成品画幅','Final image size','仕上がりサイズ')}</span><div class="pack-formats" role="group" aria-labelledby="pack-format-label">${OUTPUT_FORMAT_ORDER.map(format=>{const f=OUTPUT_FORMATS[format];return `<button type="button" data-pack-format="${format}" aria-pressed="false"><span>${esc(say(f.names))}</span><small>${f.ratio} · ${f.width}×${f.height}</small></button>`}).join('')}</div><p class="file-note" id="pack-format-help"></p></div>
<div class="pack-provider"><span class="slider-label" id="pack-provider-label">${L('选择生图工具','Image generator','画像生成ツール')}</span><div class="pack-providers" role="group" aria-labelledby="pack-provider-label">${Object.entries(GENERATOR_PROVIDERS).map(([id,provider])=>`<button type="button" data-pack-provider="${id}" aria-pressed="false">${esc(say(provider.names))}</button>`).join('')}</div><p class="file-note" id="pack-provider-help"></p></div>
<ol class="pack-steps">
<li class="pack-step"><div class="pack-step-text"><h3>${L('把草稿图交给生图工具','Give the image tool your draft','下書きを画像生成ツールへ')}</h3>${wechat?`<p class="pack-hint pack-hint-strong">${L('微信里无法复制或下载图片：点右上角 ··· 用浏览器打开。','Tap ··· and open in your browser to copy or download the image.','··· からブラウザで開くと、画像をコピー・保存できます。')}</p>`:''}<p class="pack-hint">${imageHint}</p></div><div class="pack-step-actions">${handoff==='show'?'':`<button type="button" class="button accent" id="pack-image"${handoff==='share'?' disabled':''}><span data-icon="${handoff==='share'?'share':'copy'}"></span>${handoff==='share'?L('发送草稿图','Send draft image','下書き画像を送る'):L('复制草稿图','Copy draft image','下書き画像をコピー')}</button>`}<a class="text-button pack-download" id="pack-draft-download" download="draft.png" hidden>${L('下载 draft.png','Download draft.png','draft.png を保存')}</a></div><figure class="pack-fallback" id="pack-fallback" hidden><img id="pack-fallback-image" alt="${esc(L('草稿图','Draft image','下書き画像'))}"><figcaption>${coarse?L('长按保存','Long-press to save','長押しで保存'):L('右键可复制或保存','Right-click to copy or save','右クリックでコピー・保存')}</figcaption></figure></li>
<li class="pack-step"><div class="pack-step-text"><h3>${L('复制 Prompt','Copy the prompt','プロンプトをコピー')}</h3><p class="pack-hint">${L('贴在草稿图后面，一起发送。','Paste it after the image and send both.','画像のあとに貼り付けて、一緒に送信します。')}</p></div><div class="pack-step-actions"><button type="button" class="button outline" id="copy-prompt"><span data-icon="copy"></span>${L('复制 Prompt','Copy prompt','プロンプトをコピー')}</button><a class="button outline" id="open-generator" href="https://chatgpt.com/" target="_blank" rel="noopener">${L('打开 ChatGPT ↗','Open ChatGPT ↗','ChatGPTを開く ↗')}</a></div></li>
<li class="pack-step"><div class="pack-step-text"><h3>${L('把生成的照片带回来','Bring the photo back','できた写真を取り込む')}</h3><p class="pack-hint">${L('也可以直接粘贴或拖进这个窗口。','You can also paste or drop it into this window.','このウィンドウに貼り付けたり、ドロップしたりもできます。')}</p></div><div class="pack-step-actions"><button type="button" class="button outline" id="import-result"><span data-icon="upload"></span>${L('导入照片','Import the photo','写真を読み込む')}</button></div></li>
</ol>
<details class="pack-more"><summary>${L('查看 Prompt','View prompt','プロンプトを見る')}</summary><label for="prompt-text" class="sr-only">${L('为你的作品准备的 Prompt','Generation prompt','作品のためのプロンプト')}</label><textarea id="prompt-text" class="prompt-area" readonly></textarea></details>
<details class="pack-more" id="pack-exports"><summary>${L('更多导出','More exports','その他の書き出し')}</summary><figure class="pack-guide"><img id="guide-preview" alt="${esc(L('大致轮廓与前后关系参考','Broad silhouette and depth reference','輪郭と前後関係の参考'))}"><figcaption>${L('轮廓参考图：只说明哪些花枝在瓶口前面。','Layout guide: it only shows which stems pass in front of the rim.','輪郭ガイド：花器の口の前を通る枝だけを示します。')}</figcaption></figure><div class="modal-actions"><button type="button" class="button outline" id="download-package"><span data-icon="download"></span>${L('下载生图包 .zip','Download image pack .zip','生成用パックを保存 .zip')}</button><button type="button" class="button outline" id="download-guide"><span data-icon="download"></span>${L('轮廓参考图 .png','Layout guide .png','輪郭ガイド .png')}</button><button type="button" class="button outline" id="download-compositor"><span data-icon="download"></span>${L('下载分层工程 .comp','Download layered .comp project','レイヤー付き .comp を保存')}</button></div><p class="file-note">${L('生图包里有 draft.png、prompt.txt、轮廓参考图、配方卡（recipe.png / recipe.txt）、可编辑的 composition.json 和三语说明。分层工程解压后可在 macOS 的 Compositor 中逐枝编辑，格式来自 ','The pack holds draft.png, prompt.txt, the layout guide, the recipe (recipe.png / recipe.txt), the editable composition.json and a readme in three languages. Unzip the layered project to edit each stem in Compositor on macOS. Format by ','パックには draft.png、prompt.txt、輪郭ガイド、レシピ（recipe.png / recipe.txt）、編集できる composition.json と3言語の説明が入っています。レイヤー付きプロジェクトは展開すると macOS の Compositor で一枝ずつ編集できます。形式の提供元：')}<a href="https://github.com/robbietilton/Compositor" target="_blank" rel="noopener noreferrer">Compositor ↗</a></p></details>`;
 openModal(html,PACK_KICKER);
 const content=$('#modal-content'),session=packSession={snapshot,promptText:'',format:coarse?'phone':'macbook',provider:'chatgpt',urls:[],closed:false},inPack=sel=>session.closed?null:$(sel,content);
 const refreshPrompt=()=>{session.promptText=promptFor({...snapshot,generationVariation:variation},{format:session.format});inPack('#prompt-text').value=session.promptText};
 const setMode=mode=>{
  snapshot.generation=mode;refreshPrompt();inPack('#pack-mode-help').textContent=generationDescriptions[lang][mode];
  $$('[data-pack-mode]',content).forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.packMode===mode)));
 };
 const setFormat=format=>{
  if(!Object.hasOwn(OUTPUT_FORMATS,format))return;
  session.format=format;refreshPrompt();
  const f=OUTPUT_FORMATS[format];inPack('#pack-format-help').textContent=`${f.ratio} · ${f.width} × ${f.height} · ${say(FORMAT_HELP[format])} ${L('草稿图仍是方形参考；实际像素取决于所选生图工具。','The square draft stays a reference; actual pixels depend on the image tool.','正方形の下書きは参考画像です。実際のサイズは使用するツールにより異なります。')}`;
  $$('[data-pack-format]',content).forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.packFormat===format)));
 };
 setMode(PACK_MODES.includes(snapshot.generation)?snapshot.generation:'natural');setFormat(session.format);
 $$('[data-pack-format]',content).forEach(b=>b.onclick=()=>setFormat(b.dataset.packFormat));
 const setProvider=id=>{
  const provider=GENERATOR_PROVIDERS[id];if(!provider)return;
  session.provider=id;const link=inPack('#open-generator');link.href=provider.url;link.textContent=L(`打开 ${id==='gemini'?'Gemini':'ChatGPT'} ↗`,`Open ${id==='gemini'?'Gemini':'ChatGPT'} ↗`,`${id==='gemini'?'Gemini':'ChatGPT'}を開く ↗`);
  inPack('#pack-provider-help').textContent=say(PROVIDER_HELP[id]);
  $$('[data-pack-provider]',content).forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.packProvider===id)));
 };
 setProvider(session.provider);
 $$('[data-pack-provider]',content).forEach(b=>b.onclick=()=>setProvider(b.dataset.packProvider));
 $$('[data-pack-mode]',content).forEach(b=>b.onclick=()=>{
  const mode=b.dataset.packMode;if(mode===snapshot.generation)return;
  checkpoint();state.generation=mode;$('#generation-mode').value=mode;$('#generation-mode-help').textContent=generationDescriptions[lang][mode];persist();setMode(mode);
 });
 const done=sel=>inPack(sel)?.closest('.pack-step')?.classList.add('is-done');
 const handedOff=()=>rememberPending(snapshot,session.promptText);
 // Rendered once: the step-1 image, the preview, the zip and the download link all use it.
 const draft=draftCanvas(snapshot).then(async canvas=>{const blob=await canvasBlob(canvas);return {blob,file:new File([blob],'draft.png',{type:'image/png'}),preview:canvas.toDataURL('image/jpeg',.85)}});
 let ready=null;
 const showFallback=()=>{const figure=inPack('#pack-fallback');if(!figure)return;figure.hidden=false;if(ready)inPack('#pack-fallback-image').src=ready.preview};
 draft.then(result=>{
  if(session.closed)return;ready=result;const url=URL.createObjectURL(result.blob);session.urls.push(url);
  inPack('#draft-preview').src=result.preview;const link=inPack('#pack-draft-download');link.href=url;link.hidden=wechat;
  const button=inPack('#pack-image');if(button)button.disabled=false;
  if(handoff==='show'||!inPack('#pack-fallback').hidden)showFallback();
 }).catch(err=>{if(!session.closed)toast(err.message)});
 inPack('#pack-draft-download').onclick=handedOff;
 const imageButton=inPack('#pack-image');
 if(imageButton)imageButton.onclick=()=>{
  if(handoff==='share'){
   if(!ready)return;
   // Nothing is awaited before share(), so the tap still counts as the gesture; the prompt goes to the clipboard alongside.
   const copied=navigator.clipboard?.writeText?navigator.clipboard.writeText(session.promptText).then(()=>true,()=>false):Promise.resolve(false);
   navigator.share({files:[ready.file],text:session.promptText}).then(async()=>{handedOff();done('#pack-image');toast(await copied?L('草稿图已发送，Prompt 也已复制。','Draft sent. The prompt is copied too.','下書き画像を送りました。プロンプトもコピー済みです。'):L('草稿图已发送。','Draft sent.','下書き画像を送りました。'))})
    .catch(err=>{if(err?.name==='AbortError')return;showFallback();toast(L('无法打开分享，请长按图片保存。','Sharing is not available here. Long-press the image to save it.','共有できません。画像を長押しで保存してください。'))});
   return;
  }
  // The clipboard write starts inside the click and is handed a promise of the image, so Safari keeps the gesture.
  let write;try{write=navigator.clipboard.write([new ClipboardItem({'image/png':ready?ready.blob:draft.then(r=>r.blob)})])}catch(err){write=Promise.reject(err)}
  write.then(()=>{handedOff();done('#pack-image');toast(L('图片已复制 · 在生图工具中粘贴 (⌘/Ctrl+V)','Image copied — paste into your image tool (⌘/Ctrl+V)','画像をコピーしました · 画像生成ツールに貼り付け'))},
   ()=>{showFallback();toast(L('无法复制图片，请下载或长按保存。','The image could not be copied. Download it or long-press to save it.','画像をコピーできませんでした。保存してからアップロードしてください。'))});
 };
 inPack('#copy-prompt').onclick=()=>{copyText(session.promptText);handedOff();done('#copy-prompt')};
 inPack('#open-generator').onclick=handedOff;
 inPack('#import-result').onclick=()=>pickArt(snapshot,{kind:'generated',prompt:session.promptText});
 inPack('#pack-fix')?.addEventListener('click',()=>{
  checkpoint();
  for(const item of state.items){const a=assetById[item.type];if(a&&outOfScale(item,a))restoreRealSize(item)}
  for(const item of floatingItems())reseatItem(item,{quiet:true});
  renderStage();persist();
  generatePackageV3().then(()=>toast(L('已修正，可以生成了。','Fixed. Ready to generate.','直しました。生成できます。'))).catch(err=>toast(err.message));
 });
 // The layout guide renders only when More exports is opened or a file needs it.
 let guide=null;const guideCanvas=()=>guide||(guide=compositionGuideCanvas(snapshot));
 inPack('#pack-exports').addEventListener('toggle',e=>{if(!e.currentTarget.open||inPack('#guide-preview').src)return;guideCanvas().then(canvas=>{const img=inPack('#guide-preview');if(img)img.src=canvas.toDataURL('image/jpeg',.85)}).catch(()=>{})});
 inPack('#download-package').onclick=async e=>{
  const b=e.currentTarget;b.disabled=true;
  try{
   const [image,layout]=await Promise.all([draft,guideCanvas()]),mode=snapshot.generation;
   const zip=await zipFiles([['draft.png',image.blob],['composition-guide.png',await canvasBlob(layout)],['prompt.txt',new Blob([promptFor({...snapshot,generationVariation:variation},{guide:true,format:session.format})],{type:'text/plain;charset=utf-8'})],['composition.json',new Blob([JSON.stringify(snapshot,null,2)],{type:'application/json'})],['readme.txt',new Blob([packReadme(mode,lang,session.format,session.provider)],{type:'text/plain;charset=utf-8'})],
    // The recipe (A18): what to buy and how to cut, for making it for real.
    ['recipe.png',await recipeCardBlob(snapshot)],['recipe.txt',new Blob([recipeTextFor(snapshot)],{type:'text/plain;charset=utf-8'})]]);
   download(zip,`${fileTitle(snapshot)}-${say(PACK_NAMES[mode]||PACK_NAMES.natural)}-${session.format}.zip`);handedOff();
   toast(L('创作包已下载，上传草稿图并粘贴 Prompt 即可。','Pack downloaded. Upload the draft to your chosen tool and paste the prompt.'));
  }catch(err){toast(err.message)}finally{b.disabled=false}
 };
 inPack('#download-guide').onclick=async e=>{const b=e.currentTarget;b.disabled=true;try{download(await canvasBlob(await guideCanvas()),'composition-guide.png')}catch(err){toast(err.message)}finally{b.disabled=false}};
 inPack('#download-compositor').onclick=async e=>{const b=e.currentTarget;b.disabled=true;try{download(await layeredCompositorZip(snapshot),fileTitle(snapshot)+'-Compositor.zip');toast(L('分层工程已下载，解压后打开 .comp 文件夹。','Layered project downloaded. Unzip and open the .comp folder.','レイヤー付きプロジェクトを保存しました。展開して .comp フォルダを開いてください。'))}catch(err){toast(err.message)}finally{b.disabled=false}};
}
/**
 * Bringing the generated photo home (B5). When a pack leaves for ChatGPT (image sent or copied, prompt copied, zip saved),
 * its snapshot goes into its own small IndexedDB database ('hanama-pending', so the works database keeps version 1) and
 * {at, id, generation, shown} into localStorage 'hanama-pending'. Coming back to the page within 24 h (or opening it again)
 * offers the import, at most three times; importing the photo clears it.
 */
const PENDING_STORE='hanama-pending',PENDING_TTL=24*60*60*1000,PENDING_REMINDERS=3;
let pendingDb=null;
function pendingAction(mode,fn){
 pendingDb||=new Promise((resolve,reject)=>{try{const req=indexedDB.open('hanama-pending',1);req.onupgradeneeded=()=>req.result.createObjectStore('packs',{keyPath:'id'});req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error)}catch(err){reject(err)}});
 return pendingDb.then(db=>new Promise((resolve,reject)=>{const tx=db.transaction('packs',mode),req=fn(tx.objectStore('packs'));let result;req.onsuccess=()=>result=req.result;tx.oncomplete=()=>resolve(result);tx.onerror=tx.onabort=()=>reject(tx.error)}));
}
/** The localStorage entry while it is under a day old, else null. */
function freshPending(){
 let entry=null;try{entry=JSON.parse(localStorage.getItem(PENDING_STORE)||'null')}catch{}
 const age=Date.now()-entry?.at;
 return entry&&typeof entry.id==='string'&&age>=0&&age<PENDING_TTL?entry:null;
}
function rememberPending(snapshot,prompt){
 const at=Date.now(),same=freshPending()?.id===snapshot.id;
 try{localStorage.setItem(PENDING_STORE,JSON.stringify({at,id:snapshot.id,generation:snapshot.generation||'natural',shown:same?freshPending().shown||0:0}))}catch{}
 pendingAction('readwrite',store=>store.put({id:'pack',at,state:clone(snapshot),prompt:String(prompt||'').slice(0,4000)})).catch(()=>{});
}
function clearPending(){try{localStorage.removeItem(PENDING_STORE)}catch{}pendingAction('readwrite',store=>store.delete('pack')).catch(()=>{})}
/** The pending pack as {state, prompt}, read back leniently; null when there is none, it is stale or it no longer reads. */
async function loadPending(){
 const entry=freshPending();if(!entry)return null;
 try{const record=await pendingAction('readonly',store=>store.get('pack'));if(!record||record.state?.id!==entry.id)return null;return {state:validate(record.state,{lenient:true}),prompt:typeof record.prompt==='string'?record.prompt:''}}
 catch{return null}
}
let reminding=false,pickingAt=0;
/** Offer the pending import with a toast (its button opens the file picker in the same tap). */
async function remindPending(){
 const entry=freshPending();// Not while a photo is being picked: on Android the file picker hides the page, so coming back from it is no return from ChatGPT.
 if(reminding||!entry||(entry.shown||0)>=PENDING_REMINDERS||packSession||Date.now()-pickingAt<120000)return;
 reminding=true;
 try{
  const pending=await loadPending();if(!pending){clearPending();return}
  try{localStorage.setItem(PENDING_STORE,JSON.stringify({...entry,shown:(entry.shown||0)+1}))}catch{}
  toast(L('从 ChatGPT 回来了？把生成的照片收进「我的作品」。','Back from ChatGPT? Keep the generated photo in My Works.','ChatGPTから戻りましたか？生成した画像を「マイ作品」に残しましょう。'),{action:()=>pickArt(pending.state,{kind:'generated',prompt:pending.prompt}),label:L('导入生成作品','Import the result','生成画像を取り込む')});
 }finally{reminding=false}
}
let hiddenAt=0;
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden')hiddenAt=Date.now();else if(hiddenAt&&Date.now()-hiddenAt>15000){hiddenAt=0;remindPending()}});
addEventListener('pageshow',e=>{if(e.persisted)remindPending()});
let importOptions={};
/** Open the file picker for a photo of `s` (call it inside the tap). opts: {kind:'generated'|'real', prompt}. */
function pickArt(s,opts={}){importArtFor=s;importOptions=opts;pickingAt=Date.now();$('#art-upload').click()}
/**
 * Keep a photo in My Works next to the draft it shows: a new record holding the draft (as `state`), a 600 px draft preview and
 * the photo, plus the optional sourceId (the draft's id), generation, artKind ('generated' or 'real') and prompt. Older
 * records simply lack those fields.
 */
async function importArt(file,s,{kind='generated',prompt=''}={}){
 if(!file||!['image/png','image/jpeg','image/webp'].includes(file.type)||file.size>15*1024*1024){toast(L('请选择不超过 15 MB 的 PNG、JPG 或 WebP 图片。','Choose a PNG, JPG, or WebP image no larger than 15 MB.'));return false}
 const snapshot=clone(s||state),real=kind==='real';
 try{
  const url=URL.createObjectURL(file);let img;try{img=await loadImage(url)}finally{URL.revokeObjectURL(url)}
  const c=document.createElement('canvas'),scale=Math.min(1,2000/Math.max(img.width,img.height));c.width=Math.round(img.width*scale);c.height=Math.round(img.height*scale);c.getContext('2d').drawImage(img,0,0,c.width,c.height);
  const art=await canvasBlob(c,'image/jpeg',.93),preview=await canvasBlob(await draftCanvas(snapshot,600),'image/jpeg',.85),artworkId=uid();
  const record={id:artworkId,state:{...snapshot,id:artworkId},title:snapshot.title||file.name.replace(/\.[^.]+$/,''),updated:Date.now(),preview,art,sourceId:snapshot.id,generation:snapshot.generation||'natural',artKind:real?'real':'generated'};
  if(!real&&prompt)record.prompt=String(prompt).slice(0,4000);
  await dbAction('readwrite',store=>store.put(record));
  if(freshPending()?.id===snapshot.id)clearPending();
  if($('#modal').open)$('#modal').close();await refreshCount();setView('gallery');
  toast(real?L('实拍照片已收进「我的作品」。','Your photo is saved in My Works.','写真を「マイ作品」に保存しました。'):L('成品已收藏，可以分享了。','Artwork saved to My Works and ready to share.'));
  return true;
 }catch(err){toast(err.message);return false}
}
/** The draft a photo imported in My Works belongs to: the pack that went to ChatGPT, when it is this canvas's, else the canvas. */
let galleryPending=null;
const galleryBase=()=>galleryPending&&galleryPending.state.id===state.id?galleryPending:{state:clone(state),prompt:''};
let kindSession=null;
function endKindSession(){if(kindSession?.url)URL.revokeObjectURL(kindSession.url);kindSession=null}
/** My Works import: say what the photo is (generated, or a real arrangement), then pick it or use the one pasted or dropped. */
function chooseArtKind(file=null){
 const base=galleryBase(),title=base.state.title||L('未命名作品','Untitled Arrangement');
 openModal(`<h2>${L('这张照片是……','This photo is…','この写真は…')}</h2><p>${esc(L(`它会和草稿「${title}」一起收进「我的作品」。`,`It is kept in My Works with the draft “${title}”.`,`下書き「${title}」と一緒に「マイ作品」に保存します。`))}</p><img class="import-kind-preview" id="import-kind-preview" alt="" hidden><div class="import-kinds"><button type="button" class="import-kind" data-art-kind="generated"><strong>${L('生成图','Generated image','生成画像')}</strong><small>${L('用这份草稿在 ChatGPT 生成','Made from this draft in ChatGPT','この下書きからChatGPTで生成')}</small></button><button type="button" class="import-kind" data-art-kind="real"><strong>${L('实拍','Real photo','実物の写真')}</strong><small>${L('照着草稿插好后拍下','Arranged for real and photographed','下書きどおりに生けて撮影')}</small></button></div><p class="file-note">${L('也可以把图片粘贴或拖到这里。','You can also paste or drop an image here.','画像をここに貼り付けたり、ドロップしたりもできます。')}</p>`);
 kindSession={base,file:null,url:''};if(file)setKindFile(file);
 $$('[data-art-kind]').forEach(b=>b.onclick=()=>{const kind=b.dataset.artKind,{file:chosen}=kindSession||{},opts={kind,prompt:kind==='generated'?base.prompt:''};if(chosen)importArt(chosen,base.state,opts);else pickArt(base.state,opts)});
}
function setKindFile(file){
 if(!kindSession)return;if(kindSession.url)URL.revokeObjectURL(kindSession.url);
 kindSession.file=file;kindSession.url=URL.createObjectURL(file);const img=$('#import-kind-preview');if(img){img.src=kindSession.url;img.hidden=false}
}
/** Where a pasted or dropped image goes: the open pack, the kind chooser, or My Works (which asks what it is). */
function photoTarget(zone=null){
 const modalOpen=$('#modal').open;
 if(modalOpen&&packSession&&(!zone||zone===$('#modal-content'))){const session=packSession;return file=>importArt(file,session.snapshot,{kind:'generated',prompt:session.promptText})}
 if(modalOpen&&kindSession&&(!zone||zone===$('#modal-content')))return setKindFile;
 if(!modalOpen&&!$('#gallery-view').hidden&&(!zone||zone===$('#gallery-view')))return chooseArtKind;
 return null;
}
const imageFile=list=>[...(list||[])].find(f=>/^image\//.test(f?.type||''))||null;
document.addEventListener('paste',e=>{
 const active=document.activeElement;if(active?.isContentEditable||active?.matches?.('input,textarea,select'))return;
 const target=photoTarget();if(!target)return;
 const file=imageFile(e.clipboardData?.files)||imageFile([...(e.clipboardData?.items||[])].filter(i=>i.kind==='file').map(i=>i.getAsFile()));
 if(!file)return;e.preventDefault();target(file);
});
for(const zone of [$('#modal-content'),$('#gallery-view')]){
 const hasFiles=e=>[...(e.dataTransfer?.types||[])].includes('Files');
 zone.addEventListener('dragover',e=>{if(!hasFiles(e)||!photoTarget(zone))return;e.preventDefault();e.dataTransfer.dropEffect='copy';zone.classList.add('is-drop-target')});
 zone.addEventListener('dragleave',e=>{if(!zone.contains(e.relatedTarget))zone.classList.remove('is-drop-target')});
 zone.addEventListener('drop',e=>{zone.classList.remove('is-drop-target');const target=hasFiles(e)&&photoTarget(zone);if(!target)return;e.preventDefault();const file=imageFile(e.dataTransfer.files);if(file)target(file);else toast(L('请选择不超过 15 MB 的 PNG、JPG 或 WebP 图片。','Choose a PNG, JPG, or WebP image no larger than 15 MB.'))});
}
$('#generate-button').onclick=()=>generatePackageV3().catch(e=>toast(e.message));$('#export-draft').onclick=async()=>{try{download(await canvasBlob(await draftCanvas()),fileTitle(state)+L('-草稿.png','-draft.png'));toast(L('草稿图已下载','Draft image downloaded'))}catch(e){toast(e.message)}};
const dbPromise=new Promise((resolve,reject)=>{const req=indexedDB.open('hanama-artworks',1);req.onupgradeneeded=()=>req.result.createObjectStore('works',{keyPath:'id'});req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error)});dbPromise.catch(()=>{});
async function dbAction(mode,fn){const db=await dbPromise;return new Promise((resolve,reject)=>{const tx=db.transaction('works',mode);const req=fn(tx.objectStore('works'));let result;req.onsuccess=()=>result=req.result;tx.oncomplete=()=>resolve(result);tx.onerror=()=>reject(Error(L('本机存储空间不足或不可用，请导出文件保存。','Local storage is full or unavailable. Export a file to keep your work.')));tx.onabort=()=>reject(Error(L('保存未完成，请导出文件备份。','Saving did not finish. Export a backup file.')))})}
const listWorks=()=>dbAction('readonly',store=>store.getAll());
async function refreshCount(){try{$('#gallery-count').textContent=(await listWorks()).length}catch{}}
async function saveDraft(s=state,{notify=true}={}){const snapshot=clone(s),preview=await canvasBlob(await draftCanvas(snapshot,600,{report:notify}),'image/jpeg',.86);const prev=await dbAction('readonly',store=>store.get(snapshot.id));await dbAction('readwrite',store=>store.put({...prev,id:snapshot.id,state:snapshot,title:snapshot.title||L('未命名作品','Untitled Arrangement'),updated:Date.now(),preview,art:prev?.art||null}));if(snapshot.id===state.id)markClean(snapshot);await refreshCount();if(notify)document.dispatchEvent(new Event('hanama-saved'));if(notify)toast(L('草稿已收进「我的作品」','Draft saved to My Works'));return snapshot.id}
$('#save-button').onclick=async e=>{e.currentTarget.disabled=true;askPersistentStorage();try{await saveDraft()}catch(err){toast(err.message)}finally{$('#save-button').disabled=false}};
/** Ask the browser to keep this site's storage (Safari otherwise may clear it after a week without a visit). Call it inside a
 tap; the answer is not needed. */
function askPersistentStorage(){try{navigator.storage?.persist?.()?.catch?.(()=>{})}catch{}}
/** The draft as a composition.json download (the same file Share → draft file gives). */
function downloadDraftFile(s=state){try{download(new Blob([JSON.stringify(s,null,2)],{type:'application/json'}),fileTitle(s)+'.json')}catch(err){toast(err.message)}}
/** When the current canvas cannot be filed into My Works before another opens: download it first, open anyway, or stay.
 Resolves 'download', 'open' or 'cancel' (also when the dialog is closed). */
function askSaveFailed(err){
 return new Promise(resolve=>{
  const name=String(state.title||'').trim()||L('未命名作品','Untitled Arrangement','タイトルなしの作品'),modal=$('#modal');
  openModal(`<h2>${esc(L(`「${name}」没能存进「我的作品」`,`“${name}” could not be saved to My Works`,`「${name}」を「マイ作品」に保存できませんでした`))}</h2><p>${esc(err?.message||'')}</p><p>${esc(L('打开另一幅画布会替换当前草稿。可以先下载草稿文件，之后用「导入草稿」继续。','Opening another canvas replaces the current draft. Download the draft file first and continue from it later with Import draft.','別のキャンバスを開くと、いまの下書きは置き換わります。先に下書きファイルを保存すれば、あとで「下書きを読み込む」から続けられます。'))}</p><div class="modal-actions"><button class="button dark" id="save-fail-download">${esc(L('下载草稿文件并打开','Download the draft file and open','下書きファイルを保存して開く'))}</button><button class="button outline" id="save-fail-open">${esc(L('直接打开','Open anyway','そのまま開く'))}</button><button class="button outline" id="save-fail-cancel">${esc(L('取消','Cancel','キャンセル'))}</button></div>`,'MY WORKS');
  let done=false;
  const finish=choice=>{if(done)return;done=true;modal.removeEventListener('close',onClose);if(modal.open)modal.close();resolve(choice)},onClose=()=>finish('cancel');
  modal.addEventListener('close',onClose);
  $('#save-fail-download').onclick=()=>finish('download');$('#save-fail-open').onclick=()=>finish('open');$('#save-fail-cancel').onclick=()=>finish('cancel');
 });
}
const skippedMessage=n=>L(`有 ${n} 处内容无法读取，已跳过。`,`Skipped ${n} part${n===1?'':'s'} that could not be read.`,`読み込めない部分を${n}か所スキップしました。`);
/**
 * Open `next` in the studio. The current canvas is filed into My Works first, unless it is empty or unchanged since it was
 * opened or saved (isCleanCanvas). `clean` records the opened canvas as untouched (studies, templates, saved works);
 * `lenient` reads a saved work leniently (validate); `message` may be a function of {saved}. Returns {saved}.
 */
async function activateCanvas(next,{saveCurrent=true,message='',clean=false,lenient=false}={}){const activeView=$('.view:not([hidden])');if(activeView)activeView.inert=true;try{const report={skipped:0},candidate=validate(next,{lenient,report}),ids=[...new Set([...candidate.items.map(i=>i.type),candidate.vessel])],missing=failedIds(ids,await Promise.allSettled(ids.map(ensureAsset)));let saved=!!(saveCurrent&&hasMeaningfulCanvas(state)&&!isCleanCanvas(state));if(saved){try{await saveDraft(state,{notify:false})}catch(err){const choice=await askSaveFailed(err);if(choice==='cancel')return {saved:false,cancelled:true};if(choice==='download')downloadDraftFile(state);saved=false}}state=candidate;selected=state.items.at(-1)?.id||null;undoStack=[];redoStack=[];cutSession=null;spriteCache.clear();closeLayerMenu();setGuide(false,{render:false});startCardClosed=false;setEditMode('move');zoomLevel=1;zoomPanX=zoomPanY=0;renderAll();if(clean)markClean();setView('studio');const text=typeof message==='function'?message({saved}):message;if(missing.length)toast(missingMessage(missing)+(report.skipped?' '+skippedMessage(report.skipped):''));else if(report.skipped)toast(skippedMessage(report.skipped));else if(text)toast(text);return {saved}}finally{if(activeView)activeView.inert=false}}
$('#new-canvas-button').onclick=async e=>{const button=e.currentTarget,next=initial();next.title=L('未命名作品','Untitled Arrangement');next.subtitle='';next.intention='';next.items=[];button.disabled=true;try{await activateCanvas(next,{clean:true,message:({saved})=>saved?L('原草稿已保存，新画布已打开。','The previous draft was saved and a new canvas is ready.'):L('新画布已打开。','A new canvas is ready.')})}catch(err){toast(err.message)}finally{button.disabled=false}};
$('#language-select').onchange=e=>{if(!['zh','en','ja'].includes(e.target.value))return;lang=e.target.value;try{localStorage.setItem(LANGUAGE_STORE,lang)}catch{}relocalizePresetFields(state,lang);renderAll();const active=$('.view:not([hidden])')?.id;if(active==='inspiration-view')renderInspiration();if(active==='gallery-view')renderGallery().catch(err=>toast(err.message))};
function setView(view){closeQuickMaterialDrawer();closeLayerMenu();$$('.view').forEach(el=>el.hidden=el.id!==`${view}-view`);$$('[data-view]').forEach(b=>b.classList.toggle('active',b.dataset.view===view));if(view==='gallery')renderGallery().catch(err=>toast(err.message));if(view==='inspiration')renderInspiration();window.scrollTo({top:0,behavior:'instant'})}
$$('[data-view]').forEach(b=>b.onclick=()=>setView(b.dataset.view));
/** A study as a new canvas; it remembers which study it came from (B6 lineage), so a remix of it can say so. */
function renderLightScenes(){
 const host=$('#light-scene-cases');if(!host)return;const index=localeIndex(lang);
 host.innerHTML=lightScenes.map(p=>`<button type="button" class="light-scene-case" data-light-case="${p.id}" title="${esc(p.detail[index])}"><img src="/previews/light-${p.id}.webp" alt="" width="600" height="600" loading="lazy"><span><strong>${esc(p.title[index])}</strong><small>${esc(p.detail[index])}</small></span><b aria-hidden="true">↗</b></button>`).join('');
 host.querySelectorAll('[data-light-case]').forEach(button=>button.onclick=async()=>{
  const p=lightScenes.find(p=>p.id===button.dataset.lightCase),study=atelierCase(p,studies.find(s=>s.id===p.study));button.disabled=true;
  try{await activateCanvas({...studyState(study),title:p.title[localeIndex(lang)],scene:p.scene,light:p.light},{clean:true,message:({saved})=>saved?L('光影案例已打开，原草稿已存入「我的作品」。','Light study opened; your draft is in My Works.','光の作例を開き、下書きを保存しました。'):L('光影案例已打开，可继续调光、换景与摆花。','Light study opened. Adjust the light, scene and flowers.','光の作例を開きました。自由に調整できます。')})}catch(err){toast(err.message)}finally{button.disabled=false}
 });
}
function studyState(study){return {...buildStudyState(study,{assetById,lang,makeItem,initial}),lineage:[{t:study.title[localeIndex(lang)],s:study.id}]}}
/** Open a study in the studio (its card, the start card or a study link); the current canvas is filed first when it has changes. */
function openStudy(study){
 const index=localeIndex(lang);
 return activateCanvas(studyState(study),{clean:true,message:({saved})=>saved?['搭配已打开，原草稿已保存在「我的作品」。','Study opened. Your previous draft is in My Works.','作品を開きました。前の下書きは「マイ作品」に保存しました。'][index]:['搭配已打开','Study opened','作例を開きました'][index]});
}
/** A study link (B6): open the study, or say the link names none. */
async function openStudyLink(study){
 if(!study)return toast(L('找不到这组搭配，去灵感手帖看看吧。','That study is not here; have a look in Inspiration.','この作例は見つかりません。インスピレーションをご覧ください。'));
 try{await openStudy(study)}catch(err){toast(err.message)}
}
/** The short link to a study (B6): /?study=<id> on this page, so it needs nothing from the host but index.html. */
const studyLink=study=>`${location.origin}${location.pathname}?study=${encodeURIComponent(study.id)}`;
/** Share a study's link: the system share sheet where there is one, else the clipboard. */
async function shareStudy(study){
 const index=localeIndex(lang),url=studyLink(study),title=study.title[index];
 if(navigator.share){try{await navigator.share({title:`${title} · HANAMA`,text:study.caption[index],url});return}catch(err){if(err?.name==='AbortError')return}}
 copyText(url);
}
function renderInspiration(){
 const index=localeIndex(lang),root=$('#inspiration-view');
 const schoolNames={ikenobo:['池坊','Ikenobo','池坊'],ohara:['小原流','Ohara','小原流'],sogetsu:['草月流','Sogetsu','草月流'],free:['自由花','Free style','自由花']};
 const schoolNotes={ikenobo:['池坊取意','Inspired by Ikenobo','池坊の発想'],ohara:['小原流取意','Inspired by Ohara','小原流の発想'],sogetsu:['草月流取意','Inspired by Sogetsu','草月流の発想'],free:['西式花园取意','Garden-style free arrangement','庭の花の自由花']};
 const seasonNames={spring:['春','Spring','春'],summer:['夏','Summer','夏'],autumn:['秋','Autumn','秋'],winter:['冬','Winter','冬']};
 const densityNames={all:['所有疏密','All scales','すべての量感'],spare:['留白 · 1–4 枝','Spare · 1–4 stems','余白 · 1〜4 本'],balanced:['轻盈 · 5–6 枝','Balanced · 5–6 stems','軽やか · 5〜6 本'],lush:['丰盛 · 7 枝以上','Lush · 7+ stems','豊か · 7 本以上']};
 const densityOf=study=>study.items.length<=4?'spare':study.items.length<=6?'balanced':'lush';
 const highlights=['cherry','iris','abundant','cosmos-wind','peony-first','white-winter'];
 const rank=study=>{const i=highlights.indexOf(study.id);return i<0?highlights.length+studies.indexOf(study):i};
 const visible=studies.filter(study=>(studyFilter==='all'||study.school===studyFilter)&&(seasonFilter==='all'||study.season===seasonFilter)&&(studyDensity==='all'||densityOf(study)===studyDensity)).sort((a,b)=>rank(a)-rank(b));
 const featured=studyFilter==='all'&&seasonFilter==='all'&&studyDensity==='all';
 const hero=featured?visible[0]:null,shown=visible.slice(hero?1:0,studyLimit+(hero?1:0)),displayed=hero?[hero,...shown]:shown;
 const filterLabel=key=>key==='all'?['全部流派','All schools','すべての流派'][index]:schoolNames[key][index];
 const seasonLabel=key=>key==='all'?['四季','All seasons','四季'][index]:seasonNames[key][index];
 const count=studies.length;
 const sourceNote=[
  `${count} 组可编辑草稿借鉴《The Flower Book》的花材与器形，并参考三所流派的公开介绍。花材按真实大小比例摆放；派系标签代表创作方向，不是正式流派范式。`,
  `${count} editable studies draw on The Flower Book and public introductions from three ikebana schools. Materials are placed at true-to-life scale. School labels show creative influences, not formal arrangements.`,
  `編集できる${count}の下書きは『The Flower Book』の花材・器から着想し、三つの流派の公式紹介を参考にしています。花材は実寸比で配置。流派名は発想の手がかりで、正式な型ではありません。`
 ][index];
 const shareLabel=study=>[`分享「${study.title[0]}」的链接`,`Share a link to “${study.title[1]}”`,`「${study.title[2]}」のリンクを共有`][index];
 const stemLabel=study=>index===2?`${study.items.length} 本`:index===1?`${study.items.length} stems`:`${study.items.length} 枝`;
 const cardHTML=(study,isHero=false)=>`<article class="study-card ${isHero?'study-card--featured':''}" data-study-card="${study.id}"><div class="study-image"><img src="/previews/${study.id}.webp" width="600" height="600" loading="${isHero?'eager':'lazy'}" ${isHero?'fetchpriority="high"':''} alt="${esc(study.title[index])}"><span class="study-number">${String(studies.indexOf(study)+1).padStart(2,'0')}</span><span class="study-season">${esc(seasonNames[study.season][index])}</span></div><div class="study-content"><span class="study-school">${esc(schoolNotes[study.school][index])} · ${stemLabel(study)}</span><p class="eyebrow">${esc(study.caption[index])}</p><h2>${esc(study.title[index])}</h2><p>${esc(study.note[index])}</p><div class="study-actions"><button class="button outline" data-study="${study.id}">${['打开，继续创作','Open and make it yours','開いて、自分らしく生ける'][index]} <span>↗</span></button><button type="button" class="study-share" data-study-share="${study.id}" aria-label="${esc(shareLabel(study))}" title="${esc(shareLabel(study))}"><span data-icon="share"></span></button></div></div></article>`;
 root.innerHTML=`<div class="page-heading study-heading"><div><p class="eyebrow">HANAMA / STUDY NOTES</p><h1>${['从一种感觉，开始插花。','Begin with a feeling.','ひとつの気配から、花を生ける。'][index]}</h1><p>${[`从一枝的留白到一束花的丰盛。${count} 组可改写的搭配，换花、修剪、重排，慢慢变成你的作品。`,`From a single stem to a generous gathering. Explore ${count} editable arrangements, then make one your own.`,`一枝の余白から、花束の豊かさまで。${count}の組み合わせを、花材や枝ぶりを変えながら自分の作品に。`][index]}</p></div><button class="text-button" id="inspiration-sources">${['阅读与素材来源 ↗','Reading & sources ↗','参考資料と素材 ↗'][index]}</button></div>
 <div class="study-intro"><span class="study-intro-line"></span><p>${['先看一枝，再慢慢找到自己的疏密与季节。','Begin with a stem. Follow your own sense of season and scale.','まず一枝から。自分らしい季節と量感を見つけてください。'][index]}</p><span>${String(count).padStart(2,'0')} / HANAMA</span></div>
 ${hero?`<div class="study-featured">${cardHTML(hero,true)}</div>`:''}
 <div class="study-filter-bar"><div class="study-filter-group"><span class="study-filter-label">${['疏密','Scale','量感'][index]}</span><div class="study-filters" role="group" aria-label="${['搭配疏密','Arrangement scale','花の量感'][index]}">${['all','spare','balanced','lush'].map(key=>`<button type="button" data-study-density="${key}" aria-pressed="${studyDensity===key}">${esc(densityNames[key][index])}</button>`).join('')}</div></div><div class="study-filter-group"><span class="study-filter-label">${['季节','Season','季節'][index]}</span><div class="study-filters" role="group" aria-label="${['季节','Seasons','季節'][index]}">${['all',...studySeasons].map(key=>`<button type="button" data-study-season="${key}" aria-pressed="${seasonFilter===key}">${esc(seasonLabel(key))}</button>`).join('')}</div></div><div class="study-filter-group"><span class="study-filter-label">${['流派取意','Inspired by','流派の発想'][index]}</span><div class="study-filters" role="group" aria-label="${['派系灵感','School inspirations','流派の発想'][index]}">${['all','ikenobo','ohara','sogetsu','free'].map(key=>`<button type="button" data-study-school="${key}" aria-pressed="${studyFilter===key}">${esc(filterLabel(key))}</button>`).join('')}</div></div></div>
 <div class="study-results-heading"><h2>${featured?['继续翻阅','More ways to begin','次の花を探す'][index]:['找到的搭配','Arrangements','見つかった組み合わせ'][index]}</h2><span class="study-total">${index===2?`${visible.length} 件`:index===1?`${visible.length} studies`:`${visible.length} 组`}</span></div>
 ${visible.length?`<div class="study-grid">${shown.map(study=>cardHTML(study)).join('')}</div>${displayed.length<visible.length?`<div class="study-more-wrap"><button type="button" class="button outline study-more" id="study-more">${['继续翻阅','See more studies','続きを見る'][index]} <span>↓</span></button><span>${displayed.length} / ${visible.length}</span></div>`:''}`:`<div class="study-empty"><p>${['这一组还没有搭配，换个季节或疏密看看。','No arrangements in this combination. Try another season or scale.','この組み合わせにはまだ作品がありません。季節か量感を変えてみてください。'][index]}</p><button type="button" class="button outline" id="study-reset">${['查看全部搭配','See all studies','すべてを見る'][index]}</button></div>`}
 <p class="study-source">${esc(sourceNote)} <a href="https://www.ikenobo.jp/english/about/style.html" target="_blank" rel="noopener noreferrer">${esc(schoolNames.ikenobo[index])} ↗</a> · <a href="https://ohararyu.or.jp/beginners/" target="_blank" rel="noopener noreferrer">${esc(schoolNames.ohara[index])} ↗</a> · <a href="https://www.sogetsu.or.jp/e/about/" target="_blank" rel="noopener noreferrer">${esc(schoolNames.sogetsu[index])} ↗</a></p>`;
 $('#inspiration-sources').onclick=()=>lang==='ja'?sourcesJapanese():sources();
 const choose=(key,value)=>{if(key==='school')studyFilter=value;else if(key==='season')seasonFilter=value;else studyDensity=value;studyLimit=9;renderInspiration()};
 $$('[data-study-school]',root).forEach(button=>button.onclick=()=>choose('school',button.dataset.studySchool));
 $$('[data-study-season]',root).forEach(button=>button.onclick=()=>choose('season',button.dataset.studySeason));
 $$('[data-study-density]',root).forEach(button=>button.onclick=()=>choose('density',button.dataset.studyDensity));
 $('#study-reset')?.addEventListener('click',()=>{studyFilter=seasonFilter=studyDensity='all';studyLimit=9;renderInspiration()});
 $('#study-more')?.addEventListener('click',()=>{studyLimit+=12;renderInspiration()});
 const byId=new Map(displayed.map(study=>[study.id,study]));
 icons(root);$$('[data-study-share]',root).forEach(button=>button.onclick=()=>shareStudy(byId.get(button.dataset.studyShare)).catch(err=>toast(err.message)));
 $$('[data-study]',root).forEach(button=>button.onclick=async()=>{button.disabled=true;try{await openStudy(byId.get(button.dataset.study))}catch(err){toast(err.message)}finally{button.disabled=false}});
}
/** My Works backup (B9): one zip of every work with its images (my-works.js), and when this browser last made one. */
const BACKUP_STORE='hanama-backup-at';
function lastBackupAt(){try{const v=Number(localStorage.getItem(BACKUP_STORE));return Number.isFinite(v)&&v>0?v:0}catch{return 0}}
const dateText=ms=>new Date(ms).toLocaleDateString(lang==='en'?'en-US':lang==='ja'?'ja-JP':'zh-CN');
function backupBar(count){
 const at=lastBackupAt(),note=at?L(`上次备份：${dateText(at)}`,`Last backup: ${dateText(at)}`,`前回のバックアップ：${dateText(at)}`):count?L('还没有备份。清理浏览器数据会一并删除这里的作品。','Not backed up yet. Clearing browser data also deletes the works here.','まだバックアップがありません。ブラウザのデータを消すと、ここの作品も消えます。'):'';
 return `<div class="backup-bar">${note?`<p class="backup-note">${esc(note)}</p>`:''}<div class="backup-actions">${count?`<button type="button" class="text-button" id="backup-works"><span data-icon="download"></span>${esc(L('备份全部作品','Back up all works','すべての作品をバックアップ'))}</button>`:''}<button type="button" class="text-button" id="restore-works"><span data-icon="upload"></span>${esc(L('从备份恢复','Restore from backup','バックアップから復元'))}</button></div></div>`;
}
async function backupWorks(button){
 askPersistentStorage();if(button)button.disabled=true;
 try{
  const works=await listWorks();if(!works.length){toast(L('「我的作品」还是空的。','My Works is empty.','「マイ作品」はまだ空です。'));return}
  const now=Date.now();download(await zipFiles(backupFiles(works,{now})),backupName(now));
  try{localStorage.setItem(BACKUP_STORE,String(now))}catch{}
  toast(L(`已备份 ${works.length} 件作品，请把文件存到安全的地方。`,`Backed up ${works.length} work${works.length===1?'':'s'}. Keep the file somewhere safe.`,`${works.length}点の作品をバックアップしました。ファイルは安全な場所に保管してください。`));
  if(!$('#gallery-view').hidden)await renderGallery();
 }catch(err){toast(err.message)}finally{if(button?.isConnected)button.disabled=false}
}
/** Restore a backup zip: each work is checked strictly and kept only when newer than the one here with its id. */
async function restoreWorks(file){
 if(!file)return;
 if(file.size>MAX_BACKUP_FILE){toast(L('备份文件过大，无法在浏览器里打开。','The backup file is too large to open in the browser.','バックアップファイルが大きすぎて、ブラウザで開けません。'));return}
 const busy=$('#restore-works');if(busy)busy.disabled=true;
 try{
  const result=await readBackup(new Uint8Array(await file.arrayBuffer()),{validate:v=>validate(v)});let {skipped}=result,restored=0,kept=0;
  for(const record of result.records){
   if(!record.preview)try{record.preview=await canvasBlob(await draftCanvas(record.state,600,{report:false}),'image/jpeg',.86)}catch{}
   if(!record.preview&&!record.art){skipped++;continue}
   const existing=await dbAction('readonly',store=>store.get(record.id));
   if(!keepIncoming(existing,record)){kept++;continue}
   if(!record.updated)record.updated=Date.now();
   await dbAction('readwrite',store=>store.put(record));restored++;
  }
  await refreshCount();
  const parts=[L(`已恢复 ${restored} 件作品。`,`Restored ${restored} work${restored===1?'':'s'}.`,`${restored}点の作品を復元しました。`)];
  if(kept)parts.push(L(`${kept} 件本机已有相同或更新的版本，保持不变。`,`${kept} already here in the same or a newer version, left as is.`,`${kept}点はこの端末に同じか新しい版があるため、そのままにしました。`));
  if(skipped)parts.push(L(`${skipped} 处无法读取，已跳过。`,`Skipped ${skipped} part${skipped===1?'':'s'} that could not be read.`,`読み込めない部分を${skipped}か所スキップしました。`));
  toast(parts.join(' '));
  if($('#gallery-view').hidden)setView('gallery');else await renderGallery();
 }catch(err){
  toast(err instanceof BackupError?(err.code==='manifest'?L('这不是花间的作品备份文件。','This is not a Hanama backup file.','HANAMAのバックアップファイルではありません。'):L('备份文件无法读取，可能已损坏。','The backup file could not be read; it may be damaged.','バックアップファイルを読み込めません。破損している可能性があります。')):err.message);
 }finally{const b=$('#restore-works');if(b)b.disabled=false}
}
async function renderGallery(){
 const works=(await listWorks()).sort((a,b)=>b.updated-a.updated);galleryUrls.forEach(URL.revokeObjectURL);galleryUrls=[];
 galleryPending=await loadPending().catch(()=>null);
 // A work with a photo can show its hand draft instead (⇄, B5); a real photo says so.
 const cards=works.map(w=>{const url=URL.createObjectURL(w.art||w.preview);galleryUrls.push(url);const draftUrl=w.art&&w.preview?URL.createObjectURL(w.preview):'';if(draftUrl)galleryUrls.push(draftUrl);const status=w.art?(w.artKind==='real'?L('实拍作品','Made for real','実物の作品'):L('生成成品','Generated artwork')):L('插花草稿','Ikebana draft'),date=new Date(w.updated).toLocaleDateString(lang==='en'?'en-US':lang==='ja'?'ja-JP':'zh-CN');return `<article class="art-card"><div class="art-media"><img src="${url}" alt="${esc(w.title)}" loading="lazy" data-art-src="${url}"${draftUrl?` data-draft-src="${draftUrl}"`:''}>${draftUrl?`<button type="button" class="art-flip" data-art-flip aria-pressed="false" title="${esc(L('在照片与手作草稿之间切换','Switch between the photo and the hand draft','写真と手作りの下書きを切り替え'))}"><span aria-hidden="true">⇄</span>${L('手作草稿','Hand draft','手作りの下書き')}</button>`:''}</div><div class="art-card-content"><h2>${esc(w.title)}</h2>${w.state?.subtitle?`<p class="art-subtitle">${esc(w.state.subtitle)}</p>`:''}${lineageNote(w.state)?`<p class="art-lineage">${esc(lineageNote(w.state))}</p>`:''}<p>${status} · ${date}</p><div class="art-card-actions"><button data-work-edit="${esc(w.id)}">${L('继续创作','Continue')}</button><button data-work-share="${esc(w.id)}">${L('分享作品 ↗','Share ↗')}</button><button data-work-delete="${esc(w.id)}" aria-label="${esc(L(`删除${w.title}`,`Delete ${w.title}`))}">${L('删除','Delete')}</button></div></div></article>`}).join('');
 $('#gallery-view').innerHTML=`<div class="page-heading"><div><p class="eyebrow">YOUR PERSONAL COLLECTION</p><h1>${L('一花一记','A Record of Each Flower')}</h1><p>${L('这里珍藏你的草稿与成品，仅保存在当前浏览器。','Your drafts and artworks are stored only in this browser.')}</p></div><div class="page-actions"><button class="button outline" type="button" data-draft-import title="${esc(L('从导出的 composition.json 继续创作','Continue from an exported composition.json','書き出した composition.json から続ける'))}"><span data-icon="upload"></span>${L('导入草稿','Import draft','下書きを読み込む')}</button><button class="button outline" id="gallery-import" title="${esc(L('生成图或实拍照片，也可以直接粘贴或拖进来','A generated image or a real photo; you can also paste or drop it','生成画像か実物の写真。貼り付けやドロップもできます'))}"><span data-icon="upload"></span>${L('导入作品照片','Import a photo','写真を読み込む')}</button></div></div>${backupBar(works.length)}${works.length?`<div class="gallery-grid">${cards}</div>`:`<div class="empty-gallery"><h2>${L('留住你的第一枝。','Keep your first stem.')}</h2><p>${L('在工房保存草稿，或把生成的成品导入这里。','Save a draft in the atelier or import a generated artwork here.')}</p><div class="empty-actions"><button class="button dark" id="back-studio">${L('回到插花台','Back to Atelier')}</button><button class="button outline" type="button" data-draft-import title="${esc(L('从导出的 composition.json 继续创作','Continue from an exported composition.json','書き出した composition.json から続ける'))}"><span data-icon="upload"></span>${L('导入草稿','Import draft','下書きを読み込む')}</button></div></div>`}`;
 icons($('#gallery-view'));$('#gallery-import').onclick=()=>chooseArtKind();$$('[data-art-flip]',$('#gallery-view')).forEach(b=>b.onclick=()=>{const img=b.parentElement.querySelector('img'),on=b.getAttribute('aria-pressed')!=='true';b.setAttribute('aria-pressed',String(on));img.src=on?img.dataset.draftSrc:img.dataset.artSrc});$('#back-studio')?.addEventListener('click',()=>setView('studio'));$$('[data-draft-import]',$('#gallery-view')).forEach(b=>b.onclick=()=>$('#draft-upload').click());$('#backup-works')?.addEventListener('click',e=>backupWorks(e.currentTarget));$('#restore-works')?.addEventListener('click',()=>{askPersistentStorage();$('#backup-upload').click()});
 $$('[data-work-edit]').forEach(b=>b.onclick=async()=>{const w=works.find(w=>w.id===b.dataset.workEdit),next=w.id===state.id?clone(state):w.state;b.disabled=true;try{await activateCanvas(next,{clean:true,lenient:true})}catch(err){toast(err.message)}finally{b.disabled=false}});
 $$('[data-work-share]').forEach(b=>b.onclick=()=>shareWork(works.find(w=>w.id===b.dataset.workShare)).catch(err=>toast(err.message)));
 $$('[data-work-delete]').forEach(b=>b.onclick=()=>{const w=works.find(w=>w.id===b.dataset.workDelete);openModal(`<h2>${esc(L(`移除「${w.title}」？`,`Remove “${w.title}”?`))}</h2><p>${L('这会删除本机作品集中的草稿和成品，已下载的图片仍然保留。','This deletes the draft and artwork from this browser. Downloaded files remain.')}</p><div class="modal-actions"><button class="button outline" id="cancel-delete">${L('保留作品','Keep Work')}</button><button class="button accent" id="confirm-delete">${L('删除作品','Delete Work')}</button></div>`);$('#cancel-delete').onclick=()=>$('#modal').close();$('#confirm-delete').onclick=async()=>{try{await dbAction('readwrite',store=>store.delete(w.id));if(w.id===state.id){state.id=uid();persist()}$('#modal').close();await renderGallery();await refreshCount();toast(L('已移除作品','Work removed'))}catch(e){toast(e.message)}}})
}
async function artPoster(w){
 const c=document.createElement('canvas');c.width=1600;c.height=1870;const ctx=c.getContext('2d');ctx.fillStyle='#f5f2e8';ctx.fillRect(0,0,c.width,c.height);
 const source=w.art||await canvasBlob(await draftCanvas(w.state,1600)),url=URL.createObjectURL(source);
 try{const img=await loadImage(url),fit=Math.min(1480/img.width,1480/img.height),iw=img.width*fit,ih=img.height*fit;ctx.drawImage(img,60+(1480-iw)/2,60+(1480-ih)/2,iw,ih)}finally{URL.revokeObjectURL(url)}
 const serif=lang==='ja'?'"Hiragino Mincho ProN", "Yu Mincho", "Noto Serif CJK JP", serif':lang==='en'?'Georgia, serif':'"Noto Serif SC", "Songti SC", serif';
 ctx.fillStyle='#354034';ctx.font=`48px ${serif}`;const title=w.title||L('未命名作品','Untitled Arrangement');let label=title;while(ctx.measureText(label).width>1300)label=label.slice(0,-1);if(label!==title)label+='…';ctx.fillText(label,85,1640);
 const subtitle=String(w.state?.subtitle||'').trim();if(subtitle){ctx.fillStyle='#5e695e';ctx.font=`27px ${serif}`;let line=subtitle;while(ctx.measureText(line).width>1300)line=line.slice(0,-1);if(line!==subtitle)line+='…';ctx.fillText(line,87,1694)}
 ctx.fillStyle='#7a8074';ctx.font='22px sans-serif';const note=lineageNote(w.state);let meta=`${moodName(w.state.mood)}  /  ${w.art?(w.artKind==='real'?L('照着手作草稿插成的实物','Arranged for real from a hand-made draft','手作りの下書きから実際に生けた作品'):L('由手作草稿延展的生成作品','Generated from a hand-arranged draft')):L('亲手设计的插花草稿','Hand-designed ikebana draft')}${note?`  /  ${note}`:''}`;while(ctx.measureText(meta).width>1420&&meta.length>1)meta=meta.slice(0,-2)+'…';ctx.fillText(meta,87,subtitle?1738:1695);
 ctx.fillStyle='#a5533e';ctx.font=`38px ${serif}`;const brand=lang==='en'?'HANAMA':lang==='ja'?'花間':'花间';ctx.fillText(brand,85,1790);ctx.fillStyle='#8e9286';ctx.font='16px sans-serif';ctx.fillText('HANAMA · A MOMENT WITH FLOWERS',lang==='en'?265:200,1787);return canvasBlob(c)
}
async function shareWork(w){
 // The recipe card (A18) travels with the share card: what to buy and how to cut, for a friend who wants to make it.
 const recipeButton=w.state?.items?.length?`<button class="button outline" id="share-recipe"><span data-icon="list"></span>${L('下载配方卡','Download Recipe Card','レシピカードを保存')}</button>`:'';
 const html=lang==='en'?`<h2>Let this arrangement meet someone.</h2><p>The share card keeps the artwork, title and subtitle. The draft file lets a friend continue the composition.</p><div class="modal-actions"><button class="button accent" id="share-system" disabled><span data-icon="share"></span>Share Image</button><button class="button outline" id="share-download" disabled><span data-icon="download"></span>Download Share Card</button><button class="button outline" id="share-original">Download ${w.art?'Saved Artwork':'Draft Image'}</button>${recipeButton}</div><h3>Share an editable draft</h3><p class="file-note">The link carries the material layout and intention, not the generated image. The recipient needs access to this atelier.</p><input class="share-field" id="share-link" readonly aria-label="Draft share link"><div class="modal-actions"><button class="button outline" id="copy-link">Copy Draft Link</button><button class="button outline" id="share-json">Download Draft File</button></div>`:`<h2>让这一枝，遇见别人。</h2><p>分享卡保留作品与题名、副题。草稿文件还能让朋友继续你的创作。</p><div class="modal-actions"><button class="button accent" id="share-system" disabled><span data-icon="share"></span>分享图片</button><button class="button outline" id="share-download" disabled><span data-icon="download"></span>下载分享卡</button><button class="button outline" id="share-original">下载${w.art?'保存的成品':'草稿图'}</button>${recipeButton}</div><h3>也可以分享可编辑的草稿</h3><p class="file-note">链接仅携带花材布局与意境，不包含成品图片。接收者需要有权访问此工房。</p><input class="share-field" id="share-link" readonly aria-label="草稿分享链接"><div class="modal-actions"><button class="button outline" id="copy-link">复制草稿链接</button><button class="button outline" id="share-json">下载草稿文件</button></div>`;
 openModal(html,lang==='ja'?'作品を共有':'SHARE YOUR LITTLE WORLD');if(lang==='ja'){translateTextNodes($('#modal-content'),{'让这一枝，遇见别人。':'この花を、誰かへ。','分享卡保留作品与题名、副题。草稿文件还能让朋友继续你的创作。':'共有カードには作品と題名、副題が残ります。下書きファイルを渡せば、相手も続きを編集できます。','分享图片':'画像を共有','下载分享卡':'共有カードをダウンロード','下载保存的成品':'完成作品をダウンロード','下载草稿图':'下書き画像をダウンロード','保存的成品':'保存した完成作品','草稿图':'下書き画像','也可以分享可编辑的草稿':'編集できる下書きも共有できます','链接仅携带花材布局与意境，不包含成品图片。接收者需要有权访问此工房。':'リンクには花材の配置とイメージが含まれ、完成画像は含まれません。受け取る方もこのアトリエを利用できる必要があります。','复制草稿链接':'下書きリンクをコピー','下载草稿文件':'下書きファイルをダウンロード'});$('#share-link').setAttribute('aria-label','下書き共有リンク')}// The link keeps the work's id, so opening one's own link goes straight to the canvas (arriveShare).
 const shared=validate(w.state,{lenient:true});if(typeof w.id==='string'&&/^[A-Za-z0-9_-]{1,80}$/.test(w.id))shared.id=w.id;const hash=await encodeShare(shared);const linkOK=hash.length<=30000,link=location.origin+location.pathname+hash;$('#share-link').value=linkOK?link:L('剪枝细节较多，请下载草稿文件分享。','This draft has extensive pruning details; share the downloaded draft file instead.');$('#copy-link').disabled=!linkOK;$('#copy-link').onclick=()=>copyText($('#share-link').value);$('#share-json').onclick=()=>download(new Blob([JSON.stringify(w.state,null,2)],{type:'application/json'}),fileTitle(w.state)+'.json');
 $('#share-recipe')?.addEventListener('click',async e=>{const b=e.currentTarget;b.disabled=true;try{download(await recipeCardBlob(validate(w.state,{lenient:true})),fileTitle(w.state)+L('-配方.png','-recipe.png','-レシピ.png'))}catch(err){toast(err.message)}finally{b.disabled=false}});
 $('#share-original').onclick=async()=>{try{const source=w.art||await canvasBlob(await draftCanvas(w.state,1600));download(source,fileTitle(w.state)+(w.art?L('-成品','-artwork'):L('-草稿','-draft'))+'.'+(source.type==='image/png'?'png':'jpg'))}catch(e){toast(e.message)}};
 const poster=await artPoster(w);$('#share-system').disabled=false;$('#share-download').disabled=false;$('#share-download').onclick=()=>download(poster,fileTitle(w.state)+L('-分享卡.png','-share-card.png'));$('#share-system').onclick=async()=>{const file=new File([poster],fileTitle(w.state)+'.png',{type:'image/png'});try{if(navigator.canShare?.({files:[file]})){
 // A link short enough for a message goes along, so a friend can continue the arrangement (B5).
 const data={files:[file],title:w.title};if(link.length<=2000)data.text=`${L('在花间继续这件作品','Continue this arrangement in HANAMA','HANAMAでこの作品の続きを')} ${link}`;
 await navigator.share(data)}else{download(poster,file.name);toast(L('分享卡已下载，可以发送给朋友。','Share card downloaded and ready to send.'))}}catch(err){if(err.name!=='AbortError')toast(L('设备分享不可用，请下载分享卡。','Device sharing is unavailable. Download the share card instead.'))}}
}
/**
 * A shared draft arrives (B6). The visitor's canvas stays as it is: a card shows the draft's picture, words and materials, then
 * 在我的花间里改一改 opens it (activateCanvas files the current canvas into My Works first, as every opening does), 收进我的作品
 * saves a copy without switching, 只是看看 closes the card. A link to one of this browser's own works (same id) opens at once.
 */
async function arriveShare(shared){
 let own=shared.id===state.id;
 if(!own&&shared.id!=='shared')try{own=!!(await dbAction('readonly',store=>store.get(shared.id)))}catch{}
 if(own)return remixShared(shared,{credit:false});
 const title=String(shared.title||'').trim()||L('未命名作品','Untitled Arrangement'),subtitle=String(shared.subtitle||'').trim(),intention=String(shared.intention||'').trim(),note=lineageNote(shared);
 let recipe=null;try{recipe=arrangementRecipe(shared,assetById)}catch{}
 const materials=recipe?.groups.length?`<h4>${esc(recipeLabel('need',lang))}</h4><ul class="recipe-shopping">${recipe.groups.map(group=>`<li><span class="recipe-swatch" style="background:${esc(group.asset.swatch||'#8d927f')}"></span>${esc(groupText(group,lang))}</li>`).join('')}</ul>`:'';
 const html=`<h2>${L('有人与你分享了一件插花','An arrangement, shared with you','アレンジが届きました')}</h2>
<div class="arrival"><figure class="arrival-figure"><img id="arrival-preview" width="600" height="600" alt="${esc(title)}"></figure><div class="arrival-text"><h3>${esc(title)}</h3>${subtitle?`<p class="export-subtitle">${esc(subtitle)}</p>`:''}${note?`<p class="art-lineage">${esc(note)}</p>`:''}${intention?`<p class="arrival-intention">${esc(intention)}</p>`:''}${materials}${recipe?`<p class="file-note">${esc(recipeLabel('vessel',lang))} · ${esc(vesselText(recipe,lang))}</p>`:''}</div></div>
<div class="modal-actions arrival-actions"><button type="button" class="button accent" id="arrival-remix">${L('在我的花间里改一改','Remix in my atelier','自分のアトリエでアレンジ')}</button><button type="button" class="button outline" id="arrival-keep">${L('收进我的作品','Keep in My Works','マイ作品に保存')}</button><button type="button" class="button outline" id="arrival-look">${L('只是看看','Just look','見るだけ')}</button></div>
<p class="file-note">${L('改一改之前，你现在的画布会先收进「我的作品」，不会丢失。','Before you remix, your current canvas is filed into My Works, so nothing is lost.','アレンジする前に、今のキャンバスは「マイ作品」に保存されます。')}</p>`;
 openModal(html,L('SHARED WITH YOU','SHARED WITH YOU','届いた作品'));
 const content=$('#modal-content'),inCard=sel=>content.contains($('#arrival-remix'))?$(sel,content):null;
 // The picture is framed on the arrangement (the recipe card's crop), not the whole metre of wall.
 draftCanvas(clone(shared),900).then(canvas=>{
  const img=inCard('#arrival-preview');
  if(img){const f=recipe?recipeFrame(recipe):{sx:0,sy:0,side:100},k=canvas.width/100,out=document.createElement('canvas');out.width=out.height=600;out.getContext('2d').drawImage(canvas,f.sx*k,f.sy*k,f.side*k,f.side*k,0,0,600,600);img.src=out.toDataURL('image/jpeg',.86);out.width=out.height=0}
  canvas.width=canvas.height=0;
 }).catch(()=>{});
 const busy=on=>['#arrival-remix','#arrival-keep','#arrival-look'].forEach(sel=>{const b=inCard(sel);if(b)b.disabled=on});
 $('#arrival-remix').onclick=async()=>{busy(true);try{await remixShared(shared);if(inCard('#arrival-remix'))$('#modal').close()}catch(err){busy(false);toast(err.message)}};
 $('#arrival-keep').onclick=async()=>{busy(true);try{await saveDraft({...clone(shared),id:uid()},{notify:false});if(inCard('#arrival-keep'))$('#modal').close();toast(L('已收进「我的作品」','Kept in My Works','「マイ作品」に保存しました'),{action:()=>setView('gallery'),label:L('去看看','View','見る')})}catch(err){busy(false);toast(err.message)}};
 $('#arrival-look').onclick=()=>$('#modal').close();
}
/** Open a shared draft as a new canvas. A remix credits the draft it came from (lineage), unless `credit` is false (one's own link). */
async function remixShared(shared,{credit=true}={}){
 const next={...clone(shared),id:uid()},title=String(shared.title||'').trim(),last=cleanLineage(shared.lineage,{isStudy:isStudyId}).at(-1);
 const known=title&&!untitledTitles.includes(title)&&!(last&&(last.t===title||(last.s&&studies.find(x=>x.id===last.s)?.title.includes(title))));
 if(credit&&known)next.lineage=extendLineage(shared.lineage,{t:title},{isStudy:isStudyId});
 const previous=String(state.title||'').trim()||L('未命名作品','Untitled Arrangement');
 return activateCanvas(next,{message:({saved})=>saved?L(`已打开分享的草稿。你之前的「${previous}」已保存在「我的作品」`,`Shared draft opened. Your previous “${previous}” is saved in My Works.`,`共有された下書きを開きました。前の「${previous}」は「マイ作品」に保存しました`):L('已打开分享草稿，剪枝与花色也一并保留。','Shared draft opened with pruning and color choices preserved.','共有された下書きを開きました。剪定と花色もそのままです。')});
}

/** The recipe card (A18): 1080×1350 PNG of the draft with numbered crowns, what to buy and how to cut (share-cards.js). */
async function recipeCardBlob(s){
 const recipe=arrangementRecipe(s,assetById),lines=recipeLines(recipe,lang,{title:String(s.title||'').trim()||L('未命名作品','Untitled Arrangement')});
 try{await document.fonts?.ready}catch{}
 const art=await draftCanvas(s,1600),c=document.createElement('canvas');c.width=1080;c.height=1350;
 try{
  const ctx=c.getContext('2d');if(!ctx)throw Error(L('画布内存不足，请稍后重试。','Not enough canvas memory. Please try again.','キャンバスのメモリが不足しています。再度お試しください。'));
  const subtitle=[String(s.subtitle||'').trim(),lineageNote(s)].filter(Boolean).join(' · ');
  paintRecipeCard(ctx,1080,1350,art,recipe,{...lines,subtitle,kicker:L('花间 HANAMA · 配方','HANAMA · RECIPE','花間 HANAMA · レシピ'),brand:'花',site:'HANAMA · flowerist.org'},cardFonts(lang));
  return await canvasBlob(c);
 }finally{art.width=art.height=0;c.width=c.height=0}
}
/** recipe.txt / the copied text, ending with the site's address. */
const recipeTextFor=s=>recipeText(arrangementRecipe(s,assetById),lang,{title:String(s.title||'').trim()||L('未命名作品','Untitled Arrangement'),subtitle:[String(s.subtitle||'').trim(),lineageNote(s)].filter(Boolean).join(' · '),url:`${location.origin}/`});
/**
 * The recipe dialog for the studio canvas: an accessible table of the steps (tallest stem first), the shopping list and the
 * vessel, with 复制文字 for a chat app and 下载卡片 for the 4:5 card. Stems out of the vessel can be put back from here.
 */
function openRecipe(){
 if(!state.items.length){toast(recipeLabel('empty',lang));return}
 const snapshot=clone(state);let recipe;try{recipe=arrangementRecipe(snapshot,assetById)}catch(err){toast(err.message);return}
 const lines=recipeLines(recipe,lang,{title:snapshot.title}),title=String(snapshot.title||'').trim()||L('未命名作品','Untitled Arrangement');
 const rows=recipe.rows.map((row,i)=>{const line=lines.rows[i];return `<tr${row.seated?'':' class="is-floating"'}><th scope="row"><span class="recipe-number">${row.n}</span></th><td><strong>${esc(line.name)}</strong><span class="recipe-cut">${esc(line.cut)}</span></td><td>${esc(line.place)}${line.notes.length?`<small>${esc(line.notes.join(' · '))}</small>`:''}${line.warn?`<p class="recipe-warn">${esc(line.warn)}</p>`:''}${row.seated?'':`<p class="recipe-warn">${esc(line.unseated)} <button type="button" class="text-button" data-recipe-reseat="${esc(row.unseated.join(' '))}">${esc(recipeLabel('reseat',lang))}</button></p>`}</td></tr>`}).join('');
 const html=`<div class="recipe-dialog"><h2>${L('照着草稿，插一盆真的','Make it for real','下書きどおりに、実際に生ける')}</h2><p class="recipe-title">${esc(title)}${lineageNote(snapshot)?` · <span class="art-lineage">${esc(lineageNote(snapshot))}</span>`:''}</p>
<div class="recipe-need"><h3>${esc(lines.labels.need)}</h3><ul class="recipe-shopping">${recipe.groups.map((group,i)=>`<li><span class="recipe-swatch" style="background:${esc(group.asset.swatch||'#8d927f')}"></span>${esc(lines.groups[i])}</li>`).join('')}</ul><p><strong>${esc(lines.labels.vessel)}</strong> · ${esc(lines.vessel)}</p></div>
<div class="recipe-table-wrap"><table class="recipe-table"><caption>${esc(lines.labels.steps)}</caption><thead><tr><th scope="col">${esc(lines.labels.number)}</th><th scope="col">${esc(lines.labels.material)} · ${esc(lines.labels.cut)}</th><th scope="col">${esc(lines.labels.place)}</th></tr></thead><tbody>${rows}</tbody></table></div>
<p class="file-note">${esc(lines.footer)}</p>
<div class="modal-actions"><button type="button" class="button accent" id="recipe-download"><span data-icon="download"></span>${L('下载卡片','Download card','カードを保存')}</button><button type="button" class="button outline" id="recipe-copy"><span data-icon="copy"></span>${L('复制文字','Copy text','テキストをコピー')}</button></div></div>`;
 openModal(html,L('配方 · RECIPE','RECIPE','レシピ · RECIPE'));
 const content=$('#modal-content');
 $('#recipe-copy',content).onclick=()=>copyText(recipeTextFor(snapshot));
 $('#recipe-download',content).onclick=async e=>{const b=e.currentTarget;b.disabled=true;try{download(await recipeCardBlob(snapshot),fileTitle(snapshot)+L('-配方.png','-recipe.png','-レシピ.png'))}catch(err){toast(err.message)}finally{b.disabled=false}};
 $$('[data-recipe-reseat]',content).forEach(b=>b.onclick=()=>{
  const ids=b.dataset.recipeReseat.split(' '),items=state.items.filter(item=>ids.includes(item.id));if(!items.length)return;
  checkpoint();for(const item of items)reseatItem(item,{quiet:true});renderStage();persist();openRecipe();
  toast(L('枝梗已插回花器口，花头位置尽量保持不变。','The stem now enters the vessel; the flower stays where it was as far as possible.','茎を花器の口に挿し直しました。花の位置はできるだけ保っています。'));
 });
}
$('#recipe-button').onclick=openRecipe;
/** Share the studio canvas (B6): it is saved to My Works, then the share dialog opens for it. */
$('#share-current').onclick=async e=>{
 const button=e.currentTarget;if(!state.items.length){toast(L('先添入一枝花，再分享。','Add a stem first, then share.','まず花材を一つ加えてから共有しましょう。'));return}
 button.disabled=true;
 try{const id=await saveDraft(state,{notify:false}),work=await dbAction('readonly',store=>store.get(id));await shareWork(work);toast(L('已同时收进「我的作品」','Also saved to My Works','「マイ作品」にも保存しました'))}catch(err){toast(err.message)}finally{button.disabled=false}
};
// A picked photo keeps the reminder away while it is imported (importArt clears the pending pack); a cancelled pick does not.
$('#art-upload').addEventListener('cancel',()=>{pickingAt=0});
$('#art-upload').addEventListener('change',e=>{pickingAt=Date.now();const file=e.target.files[0];e.target.value='';const target=importArtFor,opts=importOptions;importArtFor=null;importOptions={};if(file)importArt(file,target||state,opts)});
$('#backup-upload')?.addEventListener('change',e=>{const file=e.target.files[0];e.target.value='';if(file)restoreWorks(file)});
$('#draft-upload').addEventListener('change',async e=>{const file=e.target.files[0];e.target.value='';if(!file)return;if(file.size>500000)return toast(L('草稿文件过大，请选择花间导出的 JSON 文件。','The draft file is too large. Choose a JSON file exported by Hanama.'));let next;try{next=validate(JSON.parse(await file.text()))}catch{return toast(L('文件无法读取，请选择花间导出的 composition.json。','The file could not be read. Choose a composition.json exported by Hanama.'))}next.id=uid();try{await activateCanvas(next,{message:L('草稿已恢复，可以继续创作。','Draft restored and ready to edit.')});$('#modal').close()}catch(err){toast(err.message)}});
/** File the local drafts a share link displaced (stashed raw at boot) into My Works; a stash that cannot be saved stays for
 the next visit, one that no longer reads moves to the unreadable key. Returns the drafts filed. */
async function fileDisplacedDrafts(){
 let list=[];try{list=readStash(localStorage.getItem(DISPLACED_STORE))}catch{}
 if(!list.length)return [];
 const filed=[],keep=[];
 for(const raw of list){
  let draft;try{draft=validate(JSON.parse(raw),{lenient:true});relocalizePresetFields(draft,lang)}catch{try{localStorage.setItem(UNREADABLE_STORE,raw)}catch{}continue}
  try{await saveDraft(draft,{notify:false});filed.push(draft)}catch{keep.push(raw)}
 }
 try{if(keep.length)localStorage.setItem(DISPLACED_STORE,JSON.stringify(keep));else localStorage.removeItem(DISPLACED_STORE)}catch{}
 return filed;
}
/** After the first render: file displaced drafts (stashed by older versions, whose share links replaced the canvas), say what
 happened to the local draft, then show a shared draft's arrival card or open a linked study (B6). */
async function afterBoot(){
 const filed=await fileDisplacedDrafts().catch(()=>[]);
 await new Promise(resolve=>setTimeout(resolve,700));
 const title=filed.at(-1)?.title||L('未命名作品','Untitled Arrangement');
 if(filed.length)toast(L(`之前的「${title}」已保存在「我的作品」`,`Your previous “${title}” is saved in My Works.`,`前の「${title}」は「マイ作品」に保存しました`));
 else if(bootUnreadable)toast(L('上次的草稿无法读取，原始内容已另存在本机。','Your last draft could not be read; its raw data is kept on this device.','前回の下書きを読み込めませんでした。元のデータはこの端末に残しています。'));
 else if(bootReport.skipped)toast(skippedMessage(bootReport.skipped));
 const spoke=filed.length||bootUnreadable||bootReport.skipped;
 if(bootShare){const shared=bootShare;bootShare=null;arriveShare(shared).catch(err=>toast(err.message));return}
 if(bootStudy!==undefined){const study=bootStudy;bootStudy=undefined;setTimeout(()=>openStudyLink(study),spoke?3800:0);return}
 // A pack that went to ChatGPT (B5): offer its import once the boot message has had its turn.
 if(freshPending())setTimeout(remindPending,spoke?4200:0);
}
icons();applyLanguage();renderMaterials();renderAll();refreshCount();afterBoot();
// A shared draft or a study link may arrive as a same-page hash navigation in an already-open studio.
window.addEventListener('hashchange',async()=>{
 if(location.hash.startsWith('#study=')){const study=studyFromLink();clearLinkFromAddress();return openStudyLink(study)}
 if(!isDraftHash(location.hash))return;
 let imported;try{imported=await decodeShare(location.hash)}catch{return toast(L('草稿链接无法打开，请用导出的 JSON 文件恢复。','The draft link could not be opened. Restore it from an exported JSON file.'))}
 clearLinkFromAddress();relocalizePresetFields(imported,lang);arriveShare(imported).catch(err=>toast(err.message));
});


const gameRasterCache=new Map();
function gameRaster(key,paint,size=768){
 if(gameRasterCache.has(key))return gameRasterCache.get(key);
 const c=document.createElement('canvas');c.width=c.height=size;const ctx=c.getContext('2d');paint(ctx,size);
 const texture=c.toDataURL('image/png');c.width=c.height=0;gameRasterCache.set(key,texture);
 while(gameRasterCache.size>48)gameRasterCache.delete(gameRasterCache.keys().next().value);
 return texture;
}
function gameFrame(knownTextures=new Map()){
 const transfer=(id,key,paint,size)=>knownTextures.get(id)===key?'':gameRaster(key,paint,size);
 const sceneKey=`organic-room-6|${organicRoomsReady}|${sceneLayerKey}|${state.light||''}`;
 const full=(id,key,texture,order)=>({id,key,texture,x:50,y:50,width:100,height:100,px:.5,py:.5,angle:0,flip:false,interactive:false,order});
 const background=transfer('room',sceneKey,(ctx,S)=>{paintOrganicRoom(ctx,S,state);paintOrganicGround(ctx,S,assetById[state.vessel],isNightScene(state.scene));});
 const nodes=[full('room',sceneKey,background,0)];
 state.items.forEach((item,index)=>{
  const a=assetById[item.type],src=specimenCanvas(item);if(!src?.width||!src.height)return;
  const g=dimensions(item,a),crop=src.crop||{x:0,y:0,width:src.width,height:src.height,fullWidth:src.width,fullHeight:src.height};
  const pivot=Number.isFinite(item.cropAnchorSourceY)?warpY(item.cropAnchorSourceY,g.split,g.length)/g.height:(item.cropAnchorY??1),key=`game-flower|${spriteCache.get(item.id)?.key}|${src.width}|${src.height}|${a.saturation||1}`;
  const texture=transfer(item.id,key,(ctx,S)=>{if(a.saturation)ctx.filter=`saturate(${a.saturation})`;ctx.drawImage(src,0,0,S,S);},Math.min(1024,Math.max(src.width,src.height)));
  const [min,max]=sizeBounds(a);
  nodes.push({id:item.id,name:assetName(a),flex:normalizeFlex(item.flex),extent:flexExtent(item,a,g)*100,flexibility:botanicalFlexibility(a),seated:isSeated(item),key,texture,x:item.x,y:item.y,width:item.h*g.ratio*crop.width/crop.fullWidth,height:item.h*g.height*crop.height/crop.fullHeight,px:(g.anchor*crop.fullWidth-crop.x)/crop.width,py:(pivot*crop.fullHeight-crop.y)/crop.height,angle:item.angle,h:item.h,flip:item.flip,interactive:true,order:(item.aboveVessel?600:100)+index*2,minScale:min/item.h,maxScale:max/item.h});
 });
 const compositionKey=JSON.stringify(state.items),vesselKey=`game-vessel|${state.vessel}|${!!images[state.vessel]}`;
 nodes.push(full('vessel',vesselKey,transfer('vessel',vesselKey,(ctx,S)=>paintVesselLayer(ctx,S,state,assetById,images,{ground:false,fixture:false})),500));
 for(const [name,order] of [['fixture',isKenzan(assetById[state.vessel])?50:550],['interior',450],['rim',900]]){
  const c=$(`#${name}-layer`);if(!c?.width)continue;const key=`game-${name}|${state.vessel}|${state.scene}|${compositionKey}`;
  nodes.push(full(name,key,transfer(name,key,(ctx,S)=>ctx.drawImage(c,0,0,S,S)),order));
 }
 const v=vesselGeometry(assetById[state.vessel]);return {nodes,selected:selected||'',mode:editMode,brush:Number($('#brush-size').value)/Math.max(1,stageWidth())*50,light:state.light||'',mouthX:v.insertion[0],mouthY:v.insertion[1]};
}
let gameGestureMark=null,gameGestureRedo=null,gameGestureUndo=null;
function gameEvent(e){
 if(e.type==='select'){selectItem(e.id||null);return;}
 const item=state.items.find(i=>i.id===e.id);
 if(e.type==='begin'&&item){gameGestureMark=null;gameGestureRedo=redoStack.slice();gameGestureUndo=undoStack.slice();if(editMode==='move'){checkpoint();gameGestureMark=undoStack.at(-1);}selectItem(e.id);return;}
 if(e.type==='cancel'){if(gameGestureMark&&undoStack.at(-1)===gameGestureMark){undoStack=gameGestureUndo||[];redoStack=gameGestureRedo||[];}gameGestureUndo=gameGestureRedo=gameGestureMark=null;renderStage();renderHistory();return;}
 if(e.type==='commit'&&item){
  if(![e.x,e.y,e.angle,e.scale].every(Number.isFinite))return;
  item.x=clamp(e.x,5,95);item.y=clamp(e.y,15,95);item.angle=clamp(e.angle,-180,180);item.h=clamp(item.h*clamp(e.scale,.25,4),...sizeBounds(assetById[item.type]));
  if(Array.isArray(e.flex)){const flex=normalizeFlex(e.flex);if(flex.some(a=>Math.abs(a)>.00001))item.flex=flex;else delete item.flex;}
  gameGestureUndo=gameGestureRedo=gameGestureMark=null;selected=item.id;renderStage();persist();return;
 }
 if(e.type==='cut'&&item&&['split','brush'].includes(e.mode)&&Array.isArray(e.points)&&e.points.length>=2){
  selected=item.id;const points=e.points.filter(p=>Number.isFinite(p.x)&&Number.isFinite(p.y)).slice(0,512).map(p=>stageToSource([p.x/100,p.y/100],item,assetById[item.type]));
  if((e.mode==='split'&&(item.localCuts?.length||0)>=8)||(e.mode==='brush'&&item.cuts.length>=24))return;
  stroke={kind:e.mode,points,radius:clamp(Number($('#brush-size').value)/stageWidth()/(item.h/100)/2,.002,.3),pointer:-777};finishPrune({pointerId:-777,pointerType:'mouse'});
 }
}
gameBridge=mountUnityGame({getFrame:gameFrame,onEvent:gameEvent,locale:()=>lang,onAction:action=>{
 if(action==='move'){setEditMode('move');return;}
 if(action==='duplicate'){duplicateSelected();return;}
 if(action==='straighten'&&current()){checkpoint();delete current().flex;renderStage();persist();return;}
 if(action==='reseat'&&current()){checkpoint();reseatItem(current(),{quiet:true});renderStage();persist();}
}});
