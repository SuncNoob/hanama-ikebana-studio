import {composeSpecimen,paintArrangement,paintCompositionGuide,paintFixture,paintSceneBackground,paintBotanicalLayer,paintVesselLayer,paintSceneFinish} from './compositor.js?v=33';
import {compositorLayerPlan,compositorManifest} from './compositor-project.js?v=1';
import {buildPrompt} from './prompt.js?v=26';
import {newSpecimens} from './catalog.js?v=25';
import {photoSpecimens} from './photo-catalog.js?v=25';
import {bookSpecimens} from './book-catalog.js?v=25';
import {foliageSpecimens} from './foliage-catalog.js?v=31';
import {studySpecimens} from './study-catalog.js?v=31';
import {poseSpecimens} from './pose-catalog.js?v=1';
import {additionalPoseSpecimens} from './additional-pose-catalog.js?v=1';
import {matchesMaterialColor} from './material-colors.js?v=1';
import {bookVessels} from './book-vessels.js?v=25';
import {newVessels} from './vessels.js?v=25';
import {botanicalNotes,vesselNote} from './floristry.js?v=25';
import {studies,studySeasons} from './studies.js?v=25';
import {applyRealScale,sizeBounds,outOfScale,drawsStem,lengthBounds,stemCm,lengthForStem,itemCm,mouthBase,tipPoint,reach,MAX_STEM_CM,stemUnit,stemTrimmed,spriteScale,stageCanvasSize} from './scale.js?v=25';
import {dimensions, vesselGeometry, warpY, unwarpY, sourceToStage, stageToSource, simplifyPoints} from './geometry.js?v=28';
import {analyzeLocalCut,decodeCutMask} from './local-cut.js?v=31';
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
 '花间 HANAMA · 氛围插花':'花間 HANAMA · 空気感のある花あしらい','在花间挑选花材、修剪枝叶，亲手创作有氛围的插花作品。保存草稿与 GPT Image 提示词，让灵感自然成形。':'HANAMAで花材を選び、枝葉を整えて、空気感のある花あしらいを。下書きとGPT Image用プロンプトを保存できます。',
 '插花工房':'アトリエ','灵感手帖':'インスピレーション','我的作品':'マイ作品','新建画布':'新しいキャンバス','怎么玩':'使い方','保存草稿':'下書きを保存','花材库':'花材ライブラリ','一枝一叶':'花材','一器一境':'花器','花与枝':'花と枝もの','花器':'花器','全部':'すべて','花之书':'花の本','成组':'ブーケ','花朵':'花','枝叶':'枝葉','搜索花材、花器':'花材・花器を検索','点选花材，再挑姿态与花色。':'花材を選び、姿や色を選択します。','枝梗可以单独拉长，也可以剪。':'茎の長さを調整したり、剪定したりできます。','从一组搭配开始':'組み合わせから始める','素材与花道参考':'素材といけばなの参考','作品名称':'作品名','草稿仅保存在本机':'下書きはこの端末に保存されます',
 '插花画布':'いけばなキャンバス','方向键微调，Delete 删除。':'矢印キーで微調整、Deleteで削除。','移动花材':'花材を移動','圈选剪枝':'囲んで剪定','花材图层':'花材レイヤー','打开花材图层':'花材レイヤーを開く','关闭花材图层':'花材レイヤーを閉じる','撤销':'元に戻す','重做':'やり直す','构图辅助线':'構図ガイド','清空花材':'花材をすべて削除','拖动花材调整顺序；箭头可跨过花器。':'ドラッグで順序を変更。矢印で花器の前後も移動できます。','花器也是前后层次的分界':'花器を境に前後を分けます。','点选一枝花材，调整它的姿态。':'花材を選んで姿を調整します。','正在调整':'調整中','姿态与真实花色':'姿と自然な色','更换 ↗':'変更 ↗','整枝倾斜':'枝全体の角度','花材大小':'花材の大きさ','修剪与枝梗':'剪定と茎','枝梗长度':'茎の長さ','剪短根部':'根元を短くする','修剪枝叶':'枝葉を剪定','恢复剪枝':'剪定を戻す','圈选剪掉':'囲んで切る','细部擦除':'細部を消す','剪口大小':'ブラシサイズ','翻转':'反転','复制图层':'レイヤーを複製','移到最前':'最前面へ','移到最后':'最後面へ','加入画布的位置':'追加する位置','最前层':'最前面','盖在现有花材前':'既存の花材より前','最后层':'最後面','放在现有花材后':'既存の花材より後',
 '光与景':'光と背景','素纸背景':'和紙の背景','青灰背景':'青灰色の背景','墨夜背景':'墨色の背景','拖动移动 · 双指旋转缩放 · 右键调层次':'ドラッグで移動 · 2本指で回転・拡大縮小 · 右クリックでレイヤー','草稿图':'下書き画像','创作意境':'作品のイメージ','让想象继续':'想像を広げる','静寂':'静けさ','侘寂':'わびさび','春意':'春','野趣':'自然の趣','创作想法':'創作メモ','生成整理程度':'仕上げの度合い','小幅自然重整 · 推荐':'自然に少し整える · おすすめ','适度花艺润色':'ほどよく花を整える','最小修正':'最小限の修正','生成创作包':'生成用パックを作成','保留你的设计，小幅整理成真实插花。':'デザインを保ちながら、自然ないけばなに整えます。','草稿参考 · 物理修正 · 自然花瓣':'下書きを参照 · 自然な形 · 花びらの表情','让灵感，成为作品':'ひらめきを作品に','不必填满。':'すべてを埋めなくて大丈夫。','空白，也是作品的一部分。':'余白も作品の一部です。','让枝条伸向留白':'枝を余白へ伸ばす','日式':'日本風','英式':'英国風','法式':'フランス風','现代':'モダン',
 '先添入花材，再安排层次。':'まず花材を追加して、レイヤーを整えましょう。','先选中要修剪的那一枝。':'剪定する花材を選んでください。','已移到最前层':'花器の前面へ移動しました','已移到最后层':'最後面へ移動しました','已复制花材，剪口与长度也已保留。':'花材を複製しました。剪定と長さも引き継がれます。','已向前移动一层':'一つ前のレイヤーへ移動しました','已向后移动一层':'一つ後ろのレイヤーへ移動しました','花材层次已调整':'花材の順序を変更しました','已剪去选中的枝叶，可撤销。':'選択した枝葉を剪定しました。元に戻せます。','这枝已恢复到修剪前。':'剪定前の状態に戻しました。',
 '保留用花、主次和整体光感，小幅整理枝条、花面与瓶口连接，让作品更真实。':'花材、主役と光を保ち、枝の曲線や花の向き、器とのつながりを自然に整えます。','保持原设计，在花面朝向、枝条节奏和前后空间上多做一点整理，不减花。':'花材を減らさず、花の向き、枝のリズムと奥行きを少し整えます。','尽量贴近原稿，仍修正悬空、穿插和不合理连接。':'下書きに沿いながら、浮きや不自然な交差、接続を整えます。',
 '先选中一枝，再圈住不要的枝叶。':'花材を選び、不要な枝葉を囲んでください。','圈住不要的枝叶，松手剪掉 · Esc 退出':'不要な枝葉を囲んで離すと剪定 · Escで終了','涂抹剪掉细节 · Esc 退出':'なぞって細部を削除 · Escで終了','拖动移动 · 双指旋转缩放 · 右键调层次':'ドラッグで移動 · 2本指で回転・拡大縮小 · 右クリックでレイヤー','在画布上围着多余的枝叶画一圈。只修剪当前选中的一枝。':'不要な枝葉を囲んでください。選択中の花材だけを剪定します。','在枝叶上涂抹去除细节。只修剪当前选中的一枝。':'枝葉をなぞって細部を消します。選択中の花材だけを剪定します。',
 '点选左侧花材和花器。挑选自然花色与姿态，并决定新花材放在最前层或最后层。单指拖动调整位置，双指旋转和缩放；右键画布或点击图层按钮可以调整前后顺序。花材大小和枝梗长度可分别调整，也可以圈选剪枝或细部擦除。':'左側で花材と花器を選び、色や姿を決めます。追加位置は最前面か最後面を選択できます。ドラッグで移動し、2本指で回転・拡大縮小。レイヤーから花器の前後も調整できます。大きさと茎の長さは別々に調整でき、囲み剪定や細部消去も行えます。','生成された作品':'生成作品','插花草稿':'いけばなの下書き','继续创作':'創作を続ける','分享作品 ↗':'作品を共有 ↗','删除':'削除','导入生成作品':'生成作品を読み込む','回到插花台':'アトリエへ戻る','导入草稿文件':'下書きファイルを読み込む','开始这一枝':'創作を始める','保留作品':'作品を残す','删除作品':'作品を削除','取消':'キャンセル','确认':'確認','草稿已保存到「我的作品」':'下書きを「マイ作品」に保存しました','本机保存不可用，请导出草稿':'端末への保存ができません。下書きを書き出してください','已自动保存到本机':'この端末に自動保存しました','草稿仅保存在本机':'下書きはこの端末に保存されます','你控制导出和分享':'書き出しと共有はご自身で管理できます','风经过的地方':'風が通り過ぎた場所','未命名作品':'タイトルなしの作品','从形态、质感和留白开始。三组搭配，都可以亲手改写。':'形、質感、余白から始めましょう。3つの組み合わせを自由に整えられます。','先看一枝，再想一器。':'まず一枝、そして花器。','阅读与素材来源 ↗':'読みものと素材の出典 ↗','正在铺开花枝…':'枝を配置しています…','以此开始':'この組み合わせで始める','阅读 Rachel Siegfried《The Flower Book》（DK）后创作的练习：陶壶与花枝、浅器与线条、暖花与银绿叶。画面为可编辑草稿，其中鸢尾使用书图整理花材，并非生成成品。':'Rachel Siegfried著『The Flower Book』（DK）から着想した練習です。陶器と枝、浅い器と線、暖色の花と銀緑の葉。編集可能な下書きで、完成画像ではありません。','开始这一枝':'創作を始める','草稿图已下载':'下書き画像をダウンロードしました','创作包已下载，上传草稿图并粘贴 Prompt 即可。':'生成用パックを保存しました。下書き画像をアップロードしてプロンプトを貼り付けてください。','花器前':'花器の前','花器后':'花器の後ろ','已换成':'花器を変更しました：'
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
Object.assign(jaUI,{'画布旁的创作工具':'キャンバスの創作ツール','选择剪开的部分':'切り分けた部分を選択','造型':'形を整える','意境':'イメージ','剪成两段':'二つに切る','这一剪，分成两段':'二つに分かれました','删除选中段':'選んだ部分を削除','两段都保留':'両方を残す','一剪两段':'二つに切る','圈选移除':'囲んで取り除く'});
function translateTextNodes(root,translations){const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);let node;while((node=walker.nextNode()))for(const [from,to] of Object.entries(translations))if(node.nodeValue.includes(from))node.nodeValue=node.nodeValue.replaceAll(from,to)}
function applyLanguage(){
 document.documentElement.lang=lang==='en'?'en':lang==='ja'?'ja':'zh-CN';
 document.title=L('花间 HANAMA · 氛围插花','HANAMA · Atmospheric Flower Arranging');
 $('meta[name="description"]').content=L('在花间挑选花材、修剪枝叶，亲手创作有氛围的插花作品。保存草稿与 GPT Image 提示词，让灵感自然成形。','Choose flowers, shape stems, and create atmospheric floral arrangements. Save your draft and GPT Image prompt.');
 $$('[data-zh][data-en]').forEach(el=>el.textContent=lang==='ja'?(el.dataset.ja||jaUI[el.dataset.zh]||el.dataset.en):el.dataset[lang]);
 $$('[data-aria-zh][data-aria-en]').forEach(el=>el.setAttribute('aria-label',lang==='ja'?(el.dataset.ariaJa||jaUI[el.dataset.ariaZh]||el.dataset.ariaEn):el.dataset[`aria${lang==='en'?'En':'Zh'}`]));
 $$('[data-title-zh][data-title-en]').forEach(el=>el.title=lang==='ja'?(jaUI[el.dataset.titleZh]||el.dataset.titleEn):el.dataset[`title${lang==='en'?'En':'Zh'}`]);
 $$('[data-placeholder-zh][data-placeholder-en]').forEach(el=>el.placeholder=lang==='ja'?(el.dataset.placeholderJa||jaUI[el.dataset.placeholderZh]||el.dataset.placeholderEn):el.dataset[`placeholder${lang==='en'?'En':'Zh'}`]);
 const languageSelect=$('#language-select');if(languageSelect)languageSelect.value=lang;
}
const paths={plus:'M12 5v14 M5 12h14',scissors:'M6 6a3 3 0 1 1-6 0 3 3 0 0 1 6 0 M6 18a3 3 0 1 1-6 0 3 3 0 0 1 6 0 M5 8l16 13 M5 16 21 3',eraser:'m4 14 9-10a2 2 0 0 1 3 0l5 5a2 2 0 0 1 0 3l-9 10H8l-4-4a3 3 0 0 1 0-4 M9 9l9 9 M12 22h10',help:'M12 17h.01 M9.1 9a3 3 0 0 1 5.8 1c0 2-3 2-3 4 M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0',bookmark:'M5 3h14v18l-7-4-7 4V3',pencil:'m16 3 5 5-12 12-6 1 1-6L16 3 M14 5l5 5',undo:'M3 10h11a7 7 0 0 1 0 14 M3 10l5-5 M3 10l5 5',redo:'M21 10H10a7 7 0 0 0 0 14 M21 10l-5-5 M21 10l-5 5',grid:'M4 4h16v16H4V4 M4 9h16 M4 15h16 M9 4v16 M15 4v16',refresh:'M20 8a9 9 0 1 0 1 8 M20 3v5h-5',download:'M12 3v12 M7 10l5 5 5-5 M4 16v5h16v-5',move:'M12 2v20 M2 12h20 M8 6l4-4 4 4 M8 18l4 4 4-4 M6 8l-4 4 4 4 M18 8l4 4-4 4',sliders:'M5 3v8 M5 15v6 M12 3v2 M12 9v12 M19 3v11 M19 18v3 M2 11h6v4H2v-4 M9 5h6v4H9V5 M16 14h6v4h-6v-4',trash:'M3 6h18 M9 6V3h6v3 M5 6l1 15h12l1-15 M10 10v7 M14 10v7',flip:'M12 3v18 M9 5 3 18h6V5 M15 5l6 13h-6V5',layers:'m3 8 9-5 9 5-9 5-9-5 M3 12l9 5 9-5 M3 16l9 5 9-5',sparkles:'m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5L12 3 M20 2v4 M18 4h4',close:'m6 6 12 12 M6 18 18 6',hand:'M8 13V5a2 2 0 0 1 4 0v7 M12 10a2 2 0 0 1 4 0v3 M16 11a2 2 0 0 1 4 0v5c0 4-2 6-6 6h-2c-2 0-3-1-4-3l-4-6a2 2 0 0 1 3-2l3 3',copy:'M8 8h13v13H8V8 M16 5V2H2v14h3',upload:'M12 16V3 M7 8l5-5 5 5 M3 16v5h18v-5',share:'M12 16V2 M7 7l5-5 5 5 M5 11H3v10h18V11h-2'};
function icons(root=document){$$('[data-icon]',root).forEach(el=>el.innerHTML=`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${paths[el.dataset.icon]||paths.sparkles}"/></svg>`)}
const legacyFlowers=[
 {id:'sakura',family:'sakura',name:'樱花',en:'Cherry blossom',group:'branch',color:'淡粉',pose:'原版花枝',swatch:'#dfb7bc',height:53,width:350,heightPx:493,anchor:.469,split:.56},
 {id:'calla',family:'calla',name:'马蹄莲',en:'Calla lily',group:'bloom',color:'象牙白',pose:'原版正面',swatch:'#ebe7d3',height:49,width:201,heightPx:470,anchor:.259,split:.4},
 {id:'chrysanthemum',family:'chrysanthemum',name:'秋菊',en:'Chrysanthemum',group:'bloom',color:'赭橙',pose:'原版正面',swatch:'#bc692f',height:35,width:269,heightPx:486,anchor:.531,split:.58},
 {id:'pine',family:'pine',name:'松枝',en:'Pine branch',group:'branch',color:'松绿',pose:'原版虬枝',swatch:'#596a45',height:57,width:394,heightPx:495,anchor:.443,split:.6},
 {id:'maple',family:'maple',name:'枫枝',en:'Japanese maple',group:'branch',color:'秋红',pose:'原版舒展',swatch:'#98483e',height:45,width:432,heightPx:472,anchor:.534,split:.65},
 {id:'pampas',family:'pampas',name:'蒲苇',en:'Pampas grass',group:'branch',color:'麦白',pose:'自然穗形',swatch:'#d4c5ae',height:58,width:223,heightPx:501,anchor:.404,split:.6}
];
const specimens=[...photoSpecimens,...bookSpecimens,...legacyFlowers,...newSpecimens,...foliageSpecimens,...studySpecimens,...poseSpecimens,...additionalPoseSpecimens];
applyRealScale(specimens);
// Modest color correction is shared by the canvas and exported artwork; original files remain intact.
const saturation={ 'photo-poppy':.78,'photo-ranunculus':.82,'photo-anemone':.88,'photo-cosmos':.88,'photo-dahlia':.86,'photo-zinnia':.86,'photo-celosia':.86,'photo-sunflower':.9,'photo-aster':.9,'photo-peony':.89,'photo-cornflower':.9,'photo-chrysanthemum':.9 };
for(const asset of specimens)if(saturation[asset.id])asset.saturation=saturation[asset.id];
const browseSpecimens=specimens.filter(a=>!bookSpecimens.includes(a));
const familyOrder=[...new Set(browseSpecimens.map(a=>a.family))];
const flowers=familyOrder.map(family=>{const list=browseSpecimens.filter(a=>a.family===family);return {...list[0],id:family,variants:list.length}});
const vessels=[...bookVessels,...newVessels,
 {id:'round',name:'窑变圆瓶',shortName:'窑变圆瓶',en:'Bronze and blue glazed round ceramic vase',color:'窑变釉',colorEn:'variegated bronze-blue glaze',height:23,width:748,heightPx:734,group:'low',style:'japanese',mouth:[.5,.05],insertion:[50,66],openings:[{shape:'ellipse',center:[.5,.05],radius:[.12,.025],frontRimY:.09}],fixture:{kind:'neck',visibility:'hidden',name:'瓶口支撑',en:'Concealed neck support',prompt:'The small glazed neck itself supports the stems below the rim; no separate support is visible.'}},
 {id:'bottle',name:'褐釉长颈瓶',shortName:'褐釉长颈瓶',en:'Dark brown glazed bottle vase',color:'褐釉',colorEn:'dark brown glaze',height:29,width:818,heightPx:978,group:'tall',style:'japanese',mouth:[.5,.04],insertion:[50,60],openings:[{shape:'ellipse',center:[.5,.04],radius:[.13,.024],frontRimY:.075}],fixture:{kind:'neck',visibility:'hidden',name:'瓶口支撑',en:'Concealed neck support',prompt:'The narrow glazed neck itself supports the stems below the rim; no separate support is visible.'}}
];
const allAssets=[...specimens,...vessels];
const assetById=Object.fromEntries(allAssets.map(a=>[a.id,a]));
const specimenFor=family=>photoSpecimens.find(a=>a.family===family)||bookSpecimens.find(a=>a.family===family)||newSpecimens.find(a=>a.family===family)||foliageSpecimens.find(a=>a.family===family)||legacyFlowers.find(a=>a.family===family);
const familyHasColor=(family,color)=>color==='all'||browseSpecimens.some(a=>a.family===family&&matchesMaterialColor(a,color));
const specimenForColor=(family,color)=>browseSpecimens.find(a=>a.family===family&&matchesMaterialColor(a,color))||specimenFor(family);
const assetPath=id=>`/assets/${id}.${assetById[id]?.format||(assetById[id]?.source==='flower-book'?'webp':'png')}`;
function toneMaterialImages(root){for(const img of root.querySelectorAll('img[src*="/assets/"]')){const id=img.getAttribute('src').match(/\/assets\/(?:thumbs\/)?([^/.]+)/)?.[1],tone=assetById[id]?.saturation;if(tone)img.style.filter=`saturate(${tone})`}}

const scenes={paper:['#f5f4ef','#dedfd7','温暖的米灰色石灰墙与浅色石台','warm greige limewash wall and pale stone surface'],stone:['#e2e6e2','#aeb9b2','青灰色墙面与自然石台','blue-gray wall and natural stone surface'],night:['#566259','#27312b','深墨绿色背景与沉静的暗调光影','deep ink-green backdrop with subdued dark tones']};
const labelEN={
 '淡粉':'soft pink','象牙白':'ivory','赭橙':'ochre orange','松绿':'pine green','秋红':'autumn red','麦白':'wheat white','柔粉':'blush pink','暖白':'warm white','浅杏':'pale apricot','酒红':'burgundy','浅粉':'pale pink','白色':'white','淡紫':'pale lavender','紫色':'purple','浅蓝':'pale blue','自然红':'natural red','红色':'red','嫩绿':'fresh green','银绿':'silver green','自然绿':'natural green','深绿':'deep green','夏绿':'summer green','哑黑':'matte black','墨黑':'ink black','炭黑':'charcoal','浅青釉':'pale celadon','深蓝釉':'deep indigo glaze','暖沙色':'warm sand','铁锈深釉':'dark rust glaze','浅灰釉':'light gray glaze','深绿釉':'deep green glaze','窑变釉':'variegated glaze','褐釉':'brown glaze',
 '原版花枝':'original flowering branch','原版正面':'original front view','原版虬枝':'original gnarled branch','原版舒展':'original spreading branch','自然穗形':'natural plume','正面':'front view','侧面':'side view','斜侧面':'three-quarter view','直立枝':'upright branch','横逸枝':'lateral branch','自然弧枝':'natural arched branch','垂弧枝':'drooping arch','斜生枝':'oblique branch','弧形叶':'arched frond','疏枝':'sparse branch','自然斜枝':'natural oblique branch','舒展枝':'spreading branch'
};
const assetJA={willow:'ヤナギ',eucalyptus:'ユーカリ',fern:'シダ',pine:'松',maple:'カエデ',sakura:'桜',calla:'カラー',chrysanthemum:'菊',tulip:'チューリップ',rose:'バラ',peony:'芍薬',iris:'アヤメ',camellia:'椿',quince:'ボケ',anemone:'アネモネ','lily-of-the-valley':'スズラン',freesia:'フリージア',fritillary:'バイモ',hellebore:'クリスマスローズ',magnolia:'モクレン',muscari:'ムスカリ',narcissus:'スイセン',pieris:'アセビ',ranunculus:'ラナンキュラス','pussy-willow':'ネコヤナギ',lilac:'ライラック',alchemilla:'アルケミラ',allium:'アリウム',alstroemeria:'アルストロメリア',ammi:'アミ',astrantia:'アストランティア',cornflower:'ヤグルマギク',clematis:'クレマチス',delphinium:'デルフィニウム','sweet-william':'ビジョナデシコ',foxglove:'ジギタリス',gypsophila:'カスミソウ','sweet-pea':'スイートピー',lavender:'ラベンダー',lily:'ユリ',stock:'ストック',nigella:'ニゲラ',poppy:'アイスランドポピー',viburnum:'ビバーナム',yarrow:'セイヨウノコギリソウ',amaranthus:'ヒモゲイトウ',snapdragon:'キンギョソウ',aster:'アスター',briza:'コバンソウ',cosmos:'コスモス',crocosmia:'モントブレチア',dahlia:'ダリア','sea-holly':'エリンジウム',sunflower:'ヒマワリ',hydrangea:'アジサイ',hypericum:'ヒペリカム',statice:'スターチス',phlox:'フロックス',scabious:'スカビオサ',sedum:'セダム',snowberry:'スノーベリー',strawflower:'ムギワラギク',zinnia:'ジニア',agapanthus:'アガパンサス',celosia:'ケイトウ',jasmine:'ジャスミン',pincushion:'ピンクッション',orchid:'コチョウラン',pampas:'パンパスグラス',lisianthus:'トルコギキョウ'};
const vesselJA={
 'matte-black-long-neck':'黒の細首瓶','ivory-tall-cylinder':'象牙色の細筒','white-squat-round':'白の丸い低瓶','ink-black-low-bowl':'墨黒の浅鉢','white-square-column':'白の角筒','charcoal-square-basin':'炭黒の角鉢','celadon-shallow-suiban':'淡青磁の水盤','indigo-oval-suiban':'藍釉の楕円水盤','sand-wide-pottery-bowl':'砂色の広口陶鉢','rust-dark-cylinder':'錆釉の陶筒','gray-flat-round':'薄灰釉の平丸瓶','forest-green-shoulder':'深緑釉の肩張り瓶',
 'english-cream-pitcher':'英国風クリーム陶壺','english-pewter-compote':'英国風の錫脚鉢','english-stone-garden-urn':'砂岩の庭園壺','french-medicis-urn':'仏風アイボリーの脚鉢','french-charcoal-compote':'仏風炭黒の脚鉢','french-blue-cachepot':'仏風霧青の鉢','modern-smoked-glass-column':'煙色ガラスの柱瓶','modern-steel-loop-vessel':'スチールの輪形花器','modern-travertine-trough':'トラバーチンの長鉢',
 'book-vessel-turquoise-jug':'トルコ石色の陶壺','book-vessel-pink-green-pitcher':'葉模様の細首壺','book-vessel-low-patina-compote':'緑青の低脚鉢','book-vessel-copper-footed-bowl':'鎚目銅の脚鉢','book-vessel-fluted-silver-bowl':'銀色の脚鉢','book-vessel-dark-pedestal-urn':'深茶の高脚花器','book-vessel-teal-round-pitcher':'青釉の丸い壺','book-vessel-green-ribbed-vase':'緑釉の丸い花器','round':'窯変釉の丸瓶','bottle':'褐色釉の細首瓶'
};
const colorJA={'淡粉':'淡いピンク','象牙白':'アイボリー','赭橙':'黄土色','松绿':'松葉色','秋红':'秋色の赤','麦白':'麦わら色','柔粉':'淡いピンク','暖白':'温かみのある白','浅杏':'淡いアプリコット','酒红':'ワインレッド','浅粉':'淡いピンク','白色':'白','淡紫':'淡い紫','紫色':'紫','浅蓝':'淡い青','自然红':'自然な赤','红色':'赤','嫩绿':'若葉色','银绿':'シルバーグリーン','自然绿':'自然な緑','深绿':'深緑','夏绿':'夏の緑','哑黑':'マットブラック','墨黑':'墨色','炭黑':'チャコール','浅青釉':'淡い青磁釉','深蓝釉':'濃紺の釉薬','暖沙色':'温かな砂色','铁锈深釉':'錆色の濃釉','浅灰釉':'淡い灰釉','深绿釉':'深緑の釉薬','窑变釉':'窯変釉','褐釉':'褐色の釉薬'};
const poseJA={'原版花枝':'自然な花枝','原版正面':'正面','原版虬枝':'曲がり枝','原版舒展':'広がる枝','自然穗形':'自然な穂','正面':'正面','侧面':'側面','斜侧面':'斜め前','直立枝':'直立する枝','横逸枝':'横へ伸びる枝','自然弧枝':'自然な弧','垂弧枝':'垂れる弧','斜生枝':'斜めの枝','弧形叶':'弧を描く葉','疏枝':'まばらな枝','自然斜枝':'自然な斜め枝','舒展枝':'広がる枝'};
const colorENtoJA={'apricot orange':'杏色のオレンジ','apricot-pink berries':'杏色のピンクの実','blue':'青','blue violet':'青紫','blush pink':'淡いピンク','burgundy':'ワインレッド','burgundy checks':'ワインレッドの市松模様','burgundy with white edges':'白縁のワインレッド','chartreuse':'黄緑','chocolate red':'チョコレート色の赤','coral red':'コーラルレッド','cornflower blue':'矢車菊色の青','cream and mauve':'クリーム色と薄紫','cream white':'クリームホワイト','crimson':'深紅','deep crimson':'濃い深紅','deep purple':'濃い紫','deep rose pink':'濃いローズピンク','dusty pink':'くすみピンク','golden orange':'黄金色のオレンジ','golden yellow':'黄金色の黄色','grass green':'草緑','green-white':'緑がかった白','ivory with burgundy speckles':'ワインレッドの斑点がある象牙色','ivory with green stripes':'緑の筋がある象牙色','lavender':'ラベンダー色','lilac':'ライラック色','magenta':'マゼンタ','mauve':'薄紫','mauve with yellow-white veins':'黄白の筋がある薄紫','orange red':'オレンジレッド','orchid purple':'蘭色の紫','pale blue':'淡い青','pale green':'淡い緑','pale pink':'淡いピンク','pale pink-white':'淡い桃白','pale violet blue':'淡い青紫','pale yellow':'淡い黄色','pink and white':'ピンクと白','pink-white berries':'桃白色の実','purple':'紫','red and yellow':'赤と黄色','rose pink':'ローズピンク','rose pink and cream':'ローズピンクとクリーム色','russet':'赤茶','scarlet':'朱色','silver gray':'銀灰色','silver green':'銀緑','violet blue':'青紫','violet with yellow veins':'黄色の筋がある紫','white':'白','white and orange':'白とオレンジ','white and purple':'白と紫','white and yellow':'白と黄色','yellow green':'黄緑'};
const poseENtoJA={'Book photograph pose':'書籍写真の姿','Original grouped photograph':'原書の複数枝写真','Original photograph':'実物写真'};
const assetName=a=>lang==='ja'?(a.ja||assetJA[a.family]||vesselJA[a.id]||a.en||a.name):lang==='en'?(a.en||a.name):a.name;
const assetColor=a=>lang==='ja'?(a.colorJa||colorJA[a.color]||colorENtoJA[a.colorEn]||a.colorEn||a.color):lang==='en'?(a.colorEn||labelEN[a.color]||a.color):a.color;
const assetPose=a=>lang==='ja'?(a.poseJa||poseJA[a.pose]||poseENtoJA[a.poseEn]||a.poseEn||a.pose):lang==='en'?(a.poseEn||labelEN[a.pose]||a.pose):a.pose;
const botanicalNotesJA={anemone:'花の周りに少し余白を残しましょう。',hellebore:'うつむく花を低い器で受けます。',ranunculus:'重い花頭を低めに配します。',tulip:'光へ曲がる茎の動きを生かします。',peony:'大きな花を低く広い器で受けます。',calla:'曲線を生かし、花の向きを少し変えます。',sakura:'木質の枝を見せ、器との釣り合いを取ります。',chrysanthemum:'大きな花を低めに、細葉で軽さを添えます。',lisianthus:'花の向きを変えて柔らかな重なりをつくります。',iris:'高さを変え、茎の間に余白を残します。',camellia:'一輪を主役に、深い緑の葉で受けます。',quince:'枝の曲がりを残し、器は簡素に。',pine:'枝の勢いで方向を決め、詰め込みすぎません。',maple:'葉の色と花を響かせ、枝先を伸ばします。',willow:'垂れる枝の弧が見える高さを選びます。',eucalyptus:'銀緑の葉を暖色の花と合わせます。',fern:'葉の弧で主役の花をそっと受けます。',pampas:'軽い穂を添え、主役の花を隠しません。'};
const botanicalDescription=family=>lang==='ja'?(botanicalNotesJA[family]||'花の向きと茎の流れを見ながら、余白を残しましょう。'):(botanicalNotes[family]?.[lang==='zh'?2:3]||L('保留自然姿态，也可以整组入画。','Keep the natural form, or use the entire group.'));
const moodName=value=>lang==='ja'?({'静寂':'静けさ','侘寂':'わびさび','春意':'春','野趣':'自然の趣'}[value]||value):lang==='en'?({'静寂':'Stillness','侘寂':'Wabi-sabi','春意':'Spring','野趣':'Wild spirit'}[value]||value):value;
const vesselStyleName=style=>L(({japanese:'日式',english:'英式',french:'法式',modern:'现代'})[style]||'日式',({japanese:'Japanese',english:'English',french:'French',modern:'Modern'})[style]||'Japanese');
const fixtureName=a=>lang==='ja'?({neck:'花器の口',kenzan:'剣山','integrated-holes':'器の穴','chicken-wire':'花留めのワイヤー','hidden-grid':'隠し格子',crossbar:'隠し横棒',foam:'隠したフォーム'}[a.fixture?.kind]||'花留め'):lang==='en'?(a.fixture?.en||'Auto support'):(a.fixture?.name||'自动固定');
const shortVesselEN={
 'matte-black-long-neck':'Matte black long-neck','ivory-tall-cylinder':'Ivory tall cylinder','white-squat-round':'White squat vase','ink-black-low-bowl':'Ink black bowl','white-square-column':'White square column','charcoal-square-basin':'Charcoal square basin','celadon-shallow-suiban':'Celadon suiban','indigo-oval-suiban':'Indigo oval suiban','sand-wide-pottery-bowl':'Sand pottery bowl','rust-dark-cylinder':'Rust stoneware cylinder','gray-flat-round':'Gray flattened vase','forest-green-shoulder':'Green shoulder vase','english-cream-pitcher':'Creamware pitcher','english-pewter-compote':'Pewter compote','english-stone-garden-urn':'Stone garden urn','french-medicis-urn':'Ivory Medici urn','french-charcoal-compote':'Charcoal compote','french-blue-cachepot':'Mist-blue cachepot','modern-smoked-glass-column':'Smoked-glass column','modern-steel-loop-vessel':'Steel loop vessel','modern-travertine-trough':'Travertine trough','round':'Bronze-blue round vase','bottle':'Brown long-neck vase'
};
const STORE='hanama-draft-v1';const uid=()=>globalThis.crypto?.randomUUID?.()||`${Date.now()}-${Math.random().toString(36).slice(2)}`;
function makeItem(type,options={}){const a=assetById[type];return {id:uid(),type,x:50,y:65,h:a.height||48,angle:0,trim:0,flip:false,length:a.stemLength||1,cuts:[],segments:[],localCuts:[],pieceLabel:'',aboveVessel:false,cropAnchorY:1,cropAnchorSourceY:null,...options};}
const initial=()=>({version:2,id:uid(),title:L('风经过的地方','Where the Wind Passed'),subtitle:'',vessel:'round',scene:'paper',mood:'静寂',generation:'natural',intention:L('像清晨的风掠过庭院，安静、自然，留一点不完美。','Like a morning breeze through the garden: quiet, natural, and gently imperfect.'),items:[makeItem(specimenFor('pine').id,{h:49,angle:-20}),makeItem(specimenFor('calla').id,{h:45,angle:9}),makeItem(specimenFor('chrysanthemum').id,{h:16,angle:28})]});
const localeIndex=locale=>locale==='zh'?0:locale==='en'?1:2;
const untitledTitles=['未命名作品','Untitled Arrangement','タイトルなしの作品'];
const titlePresets=[['风经过的地方','Where the Wind Passed','風が通り過ぎた場所'],untitledTitles,...studies.map(study=>study.title)];
const intentionPresets=['像清晨的风掠过庭院，安静、自然，留一点不完美。','Like a morning breeze through the garden: quiet, natural, and gently imperfect.','朝の庭を風が通り抜けるように。静かで自然に、少しの不揃いを残す。'];
function relocalizePresetFields(draft,locale){
 const titleGroup=titlePresets.find(group=>group.includes(draft.title));
 if(titleGroup)draft.title=titleGroup[localeIndex(locale)];
 if(intentionPresets.includes(draft.intention))draft.intention=intentionPresets[localeIndex(locale)];
}
const clamp=(n,a,b)=>Math.min(b,Math.max(a,n));const clone=o=>JSON.parse(JSON.stringify(o));const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function validate(v){
 if(!v||![1,2].includes(v.version)||!Array.isArray(v.items)||v.items.length>24||!vessels.some(a=>a.id===v.vessel)||!Object.hasOwn(scenes,v.scene))throw Error(L('这不是有效的花间草稿','This is not a valid Hanama draft'));
 let totalPoints=0,totalMaskChars=0,totalMaskPixels=0;const seenIds=new Set();
 return {version:2,id:typeof v.id==='string'&&/^[A-Za-z0-9_-]{1,80}$/.test(v.id)?v.id:uid(),title:String(v.title||L('未命名作品','Untitled Arrangement')).slice(0,40),subtitle:String(v.subtitle||'').slice(0,90),vessel:v.vessel,scene:v.scene,mood:['静寂','侘寂','春意','野趣'].includes(v.mood)?v.mood:'静寂',generation:['natural','creative','faithful'].includes(v.generation)?v.generation:'natural',intention:String(v.intention||'').slice(0,600),items:v.items.map(i=>{
  if(!specimens.some(a=>a.id===i.type)||!['x','y','h','angle','trim'].every(k=>Number.isFinite(i[k])))throw Error(L('花材信息不完整','Material data is incomplete'));
  const cuts=(Array.isArray(i.cuts)?i.cuts:[]).slice(0,24).map(c=>{
   if(!['lasso','brush'].includes(c.kind)||!Array.isArray(c.points)||c.points.length>128)throw Error(L('剪枝信息不完整','Pruning data is incomplete'));
   totalPoints+=c.points.length;if(totalPoints>8000)throw Error(L('剪枝信息过多','The draft contains too much pruning detail'));
   const points=c.points.map(p=>{if(!Array.isArray(p)||p.length!==2||!p.every(Number.isFinite))throw Error(L('剪枝坐标无效','Pruning coordinates are invalid'));return p.map(n=>clamp(n,-3,4));});
   return {kind:c.kind,points,radius:clamp(Number.isFinite(c.radius)?c.radius:.025,.002,.3)};
  });
  let itemId=typeof i.id==='string'&&/^[A-Za-z0-9_-]{1,100}$/.test(i.id)&&!seenIds.has(i.id)?i.id:uid();seenIds.add(itemId);
  const segments=(Array.isArray(i.segments)?i.segments:[]).slice(0,8).map(segment=>{
   if(!Array.isArray(segment.line)||segment.line.length!==2||![-1,1].includes(segment.side)||!segment.line.every(p=>Array.isArray(p)&&p.length===2&&p.every(Number.isFinite)))throw Error(L('剪枝信息不完整','Cut data is incomplete'));
   return {line:segment.line.map(p=>p.map(n=>clamp(n,-3,4))),side:segment.side};
  });
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
  return makeItem(i.type,{id:itemId,x:clamp(i.x,5,95),y:clamp(i.y,15,95),h:clamp(i.h,2,95),angle:clamp(i.angle,-180,180),trim:clamp(i.trim,0,60),flip:!!i.flip,length:clamp(Number.isFinite(i.length)?i.length:1,...lengthBounds(assetById[i.type],clamp(i.h,2,95),clamp(i.trim,0,60))),cuts,segments,localCuts,originId,pieceLabel,aboveVessel:!!i.aboveVessel,cropAnchorY:clamp(Number.isFinite(i.cropAnchorY)?i.cropAnchorY:1,0,1),cropAnchorSourceY:Number.isFinite(i.cropAnchorSourceY)?clamp(i.cropAnchorSourceY,0,1):null});
 })};
}
let state=initial(),selected=null,category='flowers',familyFilter='all',colorFilter='all',vesselFilter='all',undoStack=[],redoStack=[],toastTimer,images={},galleryUrls=[],importArtFor=null,drag=null,gesture=null,canvasPan=null,zoomLevel=1,zoomPanX=0,zoomPanY=0,editMode='move',stroke=null,cutSession=null,layerDragId=null,suppressLayerContextUntil=0,touchHintShown=false;
let studyFilter='all',seasonFilter='all',studyObserver=null;
const studyPreviews=new Map();
const movePointers=new Map();
const spriteCache=new Map();
try{const v=localStorage.getItem(STORE);if(v)state=validate(JSON.parse(v))}catch{}
relocalizePresetFields(state,lang);
function bytesToBase64(bytes){let str='';for(let i=0;i<bytes.length;i+=8192)str+=String.fromCharCode(...bytes.subarray(i,i+8192));return btoa(str)}
async function readLimited(stream,max=500000){const reader=stream.getReader(),parts=[];let size=0;try{for(;;){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>max)throw Error(L('草稿过大','The draft is too large'));parts.push(value)}}finally{reader.releaseLock()}const out=new Uint8Array(size);let offset=0;for(const part of parts){out.set(part,offset);offset+=part.length}return out}
async function encodeShare(s){const bytes=new TextEncoder().encode(JSON.stringify(s));if(globalThis.CompressionStream){const encoded=await readLimited(new Blob([bytes]).stream().pipeThrough(new CompressionStream('gzip')));return '#draft2='+bytesToBase64(encoded).replaceAll('+','-').replaceAll('/','_').replaceAll('=','')}return '#draft='+bytesToBase64(bytes)}
async function decodeShare(hash){const compressed=hash.startsWith('#draft2=');let data=hash.slice(compressed?8:7);if(data.length>30000)throw Error(L('草稿链接过长','The draft link is too long'));if(compressed)data=data.replaceAll('-','+').replaceAll('_','/');let bytes=Uint8Array.from(atob(data),c=>c.charCodeAt(0));if(compressed){if(!globalThis.DecompressionStream)throw Error(L('请通过草稿文件导入','Import the draft file instead'));bytes=await readLimited(new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip')))}return validate(JSON.parse(new TextDecoder().decode(bytes)))}
let sharedLoaded=false;
try{if(location.hash.startsWith('#draft=')||location.hash.startsWith('#draft2=')){state=await decodeShare(location.hash);relocalizePresetFields(state,lang);state.id=uid();sharedLoaded=true;history.replaceState(null,'',location.pathname+location.search)}}catch{setTimeout(()=>toast(L('草稿链接无法打开，请用导出的 JSON 文件恢复。','The draft link could not be opened. Restore it from an exported JSON file.')),500)}
selected=state.items.at(-1)?.id||null;

/** Show a status message. `opts.action` adds an inline button (label `opts.label`, default 撤销/Undo/元に戻す) that runs the action and hides the toast; such toasts stay 6 s instead of 3.5 s. */
function toast(msg,opts={}){
 const el=$('#toast');if(!el)return;clearTimeout(toastTimer);
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
function persist(){clearTimeout(persistTimer);persistTimer=0;try{localStorage.setItem(STORE,JSON.stringify(state));$('#save-state').textContent=L('已自动保存到本机','Auto-saved on this device')}catch{$('#save-state').textContent=L('本机保存不可用，请导出草稿','Local saving is unavailable; please export your draft')}}
function checkpoint(){undoStack.push({state:clone(state),selected});if(undoStack.length>60)undoStack.shift();redoStack=[];renderHistory()}
function renderHistory(){$('#undo-button').disabled=!undoStack.length;$('#redo-button').disabled=!redoStack.length}
function current(){return state.items.find(i=>i.id===selected)}
function setEditorTab(tab){const panel=$('.design-panel');if(!panel)return;panel.dataset.editorTab=tab;$$('[data-editor-tab]',panel).forEach(b=>b.setAttribute('aria-selected',String(b.dataset.editorTab===tab)));panel.querySelector('.panel-heading h2').textContent=tab==='shape'?L('调整花枝','Adjust Stem','枝を整える'):L('让意境成画','Image Prep','画像準備')}
$$('.editor-tabs [data-editor-tab]').forEach(b=>b.onclick=()=>setEditorTab(b.dataset.editorTab));
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
 const k=spriteScale(item,a,img.naturalWidth||img.width,img.naturalHeight||img.height),key=`${item.type}|${item.length}|${item.trim}|${k}|${cutsKey(item.cuts)}|${cutsKey(item.segments)}|${cutsKey(item.localCuts)}`;
 const cached=spriteCache.get(item.id);
 if(cached?.key===key){spriteCache.delete(item.id);spriteCache.set(item.id,cached);return cached.canvas}
 let canvas=null;try{canvas=composeSpecimen(img,item,a,null,undefined,k)}catch(err){canvasTrouble(err)}
 dropSprite(item.id);spriteCache.set(item.id,{key,canvas});
 while(spriteCache.size>SPRITE_CACHE_LIMIT)dropSprite(spriteCache.keys().next().value);
 return canvas;
}
function stemStyle(i){
 const a=assetById[i.type],g=dimensions(i,a),src=specimenCanvas(i);
 const crop=src?.crop||{x:0,y:0,width:src?.width||a.width,height:src?.height||a.heightPx,fullWidth:src?.width||a.width,fullHeight:src?.height||a.heightPx,bottom:i.cropAnchorY??1};
 const nextPivot=clamp(crop.bottom??1,0,1),previousPivot=i.cropAnchorY??1;
 const nextSource=clamp(unwarpY(nextPivot*g.height,g.split,g.length),0,1);
 const previousSource=Number.isFinite(i.cropAnchorSourceY)?i.cropAnchorSourceY:clamp(unwarpY(previousPivot*g.height,g.split,g.length),0,1);
 const dy=(warpY(nextSource,g.split,g.length)-warpY(previousSource,g.split,g.length))*i.h;
 if(Math.abs(dy)>.0001){const angle=i.angle*Math.PI/180;i.x=clamp(i.x-dy*Math.sin(angle),5,95);i.y=clamp(i.y+dy*Math.cos(angle),15,95)}
 i.cropAnchorY=nextPivot;i.cropAnchorSourceY=nextSource;
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
 if(preview){preview.width=preview.height=0;drawnStems.delete(canvas)}else drawnStems.set(canvas,src);
}
function redrawStemCanvases(){const w=stageWidth();for(const i of state.items)drawStemCanvas($(`.stem[data-id="${i.id}"]`),i,{stageW:w})}
/** Restyle one stem without rebuilding the stage; its canvas is redrawn only when its sprite or display size changed. */
function updateStem(item){
 const el=$(`.stem[data-id="${item.id}"]`);if(!el){renderStage();return}
 el.style.cssText=stemStyle(item);drawStemCanvas(el,item);
 if(item.id===selected)syncSelectionReadouts(item);
}
const pendingStems=new Set();let stemFrame=0;
function queueStemUpdate(item){pendingStems.add(item.id);if(!stemFrame)stemFrame=requestAnimationFrame(()=>{stemFrame=0;const ids=[...pendingStems];pendingStems.clear();for(const id of ids){const item=state.items.find(i=>i.id===id);if(item)updateStem(item)}})}
function renderFixture(){const canvas=$('#fixture-layer');if(!canvas)return;const cssSize=Math.max(1,Math.round($('#stage').getBoundingClientRect().width)),density=Math.min(2,window.devicePixelRatio||1),size=Math.max(1,Math.round(cssSize*density));if(canvas.width!==size||canvas.height!==size){canvas.width=size;canvas.height=size}const ctx=canvas.getContext('2d');ctx.clearRect(0,0,size,size);paintFixture(ctx,size,assetById[state.vessel],{night:state.scene==='night'})}
function renderStage(){
 const focusedStemId=document.activeElement?.classList?.contains('stem')?document.activeElement.dataset.id:null;
 const markup=i=>{const name=assetName(assetById[i.type]),piece=i.pieceLabel?` ${i.pieceLabel}`:'',instructions=lang==='ja'?`${name}${piece}。ドラッグで移動、2本指で回転・拡大縮小`:L(`${name}${piece}，拖动移动，双指旋转缩放`,`${name}${piece}; drag to move, use two fingers to rotate and scale`);return `<div class="stem ${i.id===selected?'selected':''} ${cutSession?.ids.includes(i.id)?'fresh-cut':''}" data-id="${i.id}" data-piece="${esc(i.pieceLabel||'')}" style="${stemStyle(i)}" role="button" tabindex="0" aria-label="${esc(instructions)}" aria-pressed="${i.id===selected}"><canvas class="specimen-image" aria-hidden="true"></canvas></div>`};
 $('#composition').innerHTML=state.items.filter(i=>!i.aboveVessel).map(markup).join('');$('#composition-front').innerHTML=state.items.filter(i=>i.aboveVessel).map(markup).join('');
 const stageW=stageWidth();for(const i of state.items){drawStemCanvas($(`.stem[data-id="${i.id}"]`),i,{stageW})}
 for(const id of [...spriteCache.keys()]){if(!state.items.some(i=>i.id===id))dropSprite(id)}
 $('#vessel').src=assetPath(state.vessel);$('#vessel').alt=assetName(assetById[state.vessel]);const vg=vesselGeometry(assetById[state.vessel]);$('#vessel').style.height=vg.height+'%';$('#vessel').style.width=vg.width+'%';$('#stage').dataset.scene=state.scene;renderFixture();
 $$('[data-scene]').forEach(b=>b.classList.toggle('active',b.dataset.scene===state.scene));$('#study-count').textContent=String(new Set(state.items.map(i=>i.originId||i.id)).size).padStart(3,'0');renderSelection();renderHistory();renderLayerList();renderCutChoice();drawPruneOverlay();
 if(focusedStemId)$(`.stem[data-id="${focusedStemId}"]`)?.focus({preventScroll:true});
}
function renderSelection(){
 let i=current();$('#selected-empty').hidden=!!i;$('#selection-controls').hidden=!i;if(!i){setEditMode('move');return;}
 const a=assetById[i.type];$('#selected-thumb').src=assetPath(i.type);$('#selected-thumb').style.filter=a.saturation?`saturate(${a.saturation})`:'';$('#selected-thumb').alt=assetName(a);$('#selected-name').textContent=assetName(a);$('#variant-label').textContent=`${assetColor(a)} · ${assetPose(a)}`;$('#botanical-note').textContent=botanicalDescription(a.family);
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
 if(drawsStem(a)){const cm=Math.round(stemCm(i,a));length.min=0;length.max=MAX_STEM_CM;length.step=1;length.value=cm;length.disabled=!stemUnit(i,a);$('#length-value').value=`+${cm} cm`}
 else{length.min=60;length.max=240;length.step=5;length.disabled=false;length.value=Math.round((i.length??1)*100);$('#length-value').value=Math.round((i.length??1)*100)+'%'}
 const total=Math.round(itemCm(i,a)),vessel=Math.round(vesselGeometry(assetById[state.vessel]).height);
 $('#real-size').textContent=lang==='ja'?`この花材 約${total} cm · 花器の高さ 約${vessel} cm`:L(`此枝约 ${total} cm · 花器高约 ${vessel} cm`,`This stem ≈ ${total} cm · vessel ≈ ${vessel} cm tall`);
 $('#scale-warning').hidden=!outOfScale(i,a);
}
const generationDescriptions={zh:{natural:'保留用花、主次和整体光感，小幅整理枝条、花面与瓶口连接，让作品更真实。',creative:'保持原设计，在花面朝向、枝条节奏和前后空间上多做一点整理，不减花。',faithful:'尽量贴近原稿，仍修正悬空、穿插和不合理连接。'},en:{natural:'Keep the flowers, hierarchy and light; refine local curves, facing and insertion for realism.',creative:'Refine facing, stem rhythm and depth a little further within the same design, without fewer flowers.',faithful:'Stay closest to the draft while correcting floating stems, intersections and implausible connections.'},ja:{natural:jaUI['保留用花、主次和整体光感，小幅整理枝条、花面与瓶口连接，让作品更真实。'],creative:jaUI['保持原设计，在花面朝向、枝条节奏和前后空间上多做一点整理，不减花。'],faithful:jaUI['尽量贴近原稿，仍修正悬空、穿插和不合理连接。']}};
function renderAll(){applyLanguage();applyCanvasZoom();setEditorTab($('.design-panel').dataset.editorTab||'shape');renderStage();renderMaterials();renderQuickMaterials();setEditMode(editMode);$('#work-title').value=untitledTitles.includes(state.title)?'':state.title;$('#work-subtitle').value=state.subtitle||'';$('#intention').value=state.intention;$$('[data-mood]').forEach(b=>b.classList.toggle('active',b.dataset.mood===state.mood));$('#generation-mode').value=state.generation||'natural';$('#generation-mode-help').textContent=generationDescriptions[lang][state.generation||'natural'];persist()}
function addSpecimen(type,placement='front'){if(state.items.length>=24)return toast(L('先让这 24 组花材找到自己的位置，再添加。','Arrange these 24 materials before adding another.'));checkpoint();const insertion=vesselGeometry(assetById[state.vessel]).insertion,item=makeItem(type,{x:insertion[0],y:insertion[1],angle:0,aboveVessel:placement==='front'});Object.assign(item,naturalPlacement(item));if(placement==='back')state.items.unshift(item);else state.items.push(item);selected=item.id;rememberMaterial(assetById[type].family);closeQuickMaterialDrawer();setEditMode('move');renderStage();ensureAsset(type).then(()=>{if(state.items.some(i=>i.id===item.id))renderStage()}).catch(()=>toast(L('这枝花材暂时无法载入。','This material could not be loaded.')));persist();const name=assetName(assetById[type]);toast(lang==='ja'?`${name}を${placement==='back'?'最後面':'最前面'}に追加しました。`:L(`添入${assetById[type].bundle?"一组":"一枝"}${name}，放在${placement==='back'?'最后层':'最前层'}`,`Added ${name} to the ${placement==='back'?'back':'front'} layer`))}
/** New material enters the vessel mouth at its real size; flower heads get a stem long enough to rise above the rim. */
function naturalPlacement(item){
 const a=assetById[item.type],vessel=assetById[state.vessel],g=vesselGeometry(vessel),lean=[0,-1,1,-.55,.55,-1.3,1.3][state.items.length%7];
 const base=mouthBase(vessel,g.insertion[0]+lean*2);
 if(!drawsStem(a))return {x:base[0],y:base[1],angle:Math.round(lean*14)};
 const rise=clamp(g.height*.85+a.height*.35,14,48);
 return reach(item,a,base,[base[0]+lean*rise*.4,base[1]-rise]);
}
function reseatSelected(){
 const item=current();if(!item)return;const a=assetById[item.type];checkpoint();
 Object.assign(item,reach(item,a,mouthBase(assetById[state.vessel],item.x),tipPoint(item,a)));
 renderStage();persist();toast(L('枝梗已插回花器口，花头位置尽量保持不变。','The stem now enters the vessel; the flower stays where it was as far as possible.'));
}
function resetRealSize(){
 const item=current();if(!item)return;const a=assetById[item.type];checkpoint();
 const cm=drawsStem(a)?stemCm(item,a):null;item.h=a.height;if(cm!==null)item.length=lengthForStem(item,a,cm);
 renderStage();persist();toast(L('已恢复真实比例。','Restored to true-to-life size.'));
}
function variantPicker(family,replaceId=null,preferredColor='all'){
 const allOptions=specimens.filter(a=>a.family===family&&(!bookSpecimens.includes(a)||a.id===current()?.type)).sort((a,b)=>Number(b.source==='flower-book')-Number(a.source==='flower-book')||Number(legacyFlowers.includes(a))-Number(legacyFlowers.includes(b)));
 const colorOptions=preferredColor==='all'||replaceId?allOptions:allOptions.filter(a=>matchesMaterialColor(a,preferredColor));
 const options=colorOptions.length?colorOptions:allOptions;
 const selectedType=state.items.find(i=>i.id===replaceId)?.type;
 let placement='front';
 const placementChoice=replaceId?'':`<fieldset class="insert-position"><legend>${L('加入画布的位置','Place on canvas')}</legend><button type="button" class="active" data-insert-position="front" aria-pressed="true"><strong>${L('最前层','Front layer')}</strong><small>${L('盖在现有花材前','In front of existing materials')}</small></button><button type="button" data-insert-position="back" aria-pressed="false"><strong>${L('最后层','Back layer')}</strong><small>${L('放在现有花材后','Behind existing materials')}</small></button></fieldset>`;
 openModal(`<h2>${esc(L(`${assetName(options[0])}，选一种喜欢的姿态。`,`Choose a pose for ${assetName(options[0])}.`))}</h2><p>${esc(botanicalNotes[family]?.[lang==='en'?3:2]||L('保留自然姿态，也可以整组入画。','Choose a pose you like.'))}</p>${options.some(a=>a.source==='flower-book-photo')?`<p class="file-note">${lang==='ja'?'原書の花びら・色・複数の枝を保った写真です。ひとつのレイヤーとして配置し、付け根を局所的に切れます。':L('原书实拍：保留花瓣、色彩和多枝组合。成组花材可局部剪开。','Original Flower Book photographs retain their petals, colors and groupings. Cut locally at an attachment to separate a piece.')}</p>`:''}${options.some(a=>a.source==='generated-foliage')?`<p class="file-note">${lang==='ja'?'透明の葉もの素材は制作した画像です。実物写真ではありません。':L('透明叶材为创作用图像，不是实物摄影。','These transparent foliage cutouts are rendered artwork, not photographs.')}</p>`:''}${placementChoice}<div class="variant-grid">${options.map(a=>`<button class="variant-card ${a.id===selectedType?'active':''}" data-variant="${a.id}"><img src="${(a.thumbnail||a.source==='flower-book')?`/assets/thumbs/${a.id}.webp`:assetPath(a.id)}" alt="${esc(assetColor(a)+' '+assetPose(a))}"><strong><i style="background:${a.swatch}"></i>${esc(assetColor(a))}</strong><span>${esc(assetPose(a))}${a.source==='flower-book'?L(' · 书图整理',' · Book adaptation'):''}</span></button>`).join('')}</div>${replaceId&&(current()?.cuts.length||current()?.localCuts?.length)?`<p class="file-note">${L('换姿态会恢复这枝的剪口，便于重新修剪；可以撤销恢复。','Changing pose restores this stem before pruning so you can trim it again; Undo remains available.')}</p>`:''}`,'BOTANICAL VARIATIONS');
 if(options.some(a=>a.source==='generated-pose')){const note=document.createElement('p');note.className='file-note';note.textContent=L('新增姿态参考原素材辅助制作，保留原姿态供选择。','New poses were made with AI assistance from the original specimens; the originals remain available.','新しい姿は元の花材を参考にAIの補助で制作しました。元の姿も選べます。');$('#modal-content .variant-grid').before(note)}
 $('#modal-content .variant-grid').after(...$$('#modal-content .file-note'));
 toneMaterialImages($('#modal'));
 if(lang==='ja'){$('#modal-content h2').textContent=`${assetName(options[0])}の姿を選ぶ`;$('#modal-content > p').textContent=botanicalDescription(family)}
 $$('[data-insert-position]').forEach(b=>b.onclick=()=>{placement=b.dataset.insertPosition;$$('[data-insert-position]').forEach(t=>{const on=t===b;t.classList.toggle('active',on);t.setAttribute('aria-pressed',String(on))})});
 $$('[data-variant]').forEach(b=>b.onclick=()=>{if(replaceId){const i=state.items.find(i=>i.id===replaceId);if(!i)return;if(i.type!==b.dataset.variant){checkpoint();const before=assetById[i.type],tip=tipPoint(i,before),ratio=clamp(i.h/before.height,.8,1.25);i.type=b.dataset.variant;i.cuts=[];i.localCuts=[];i.segments=[];i.pieceLabel='';const after=assetById[i.type];i.h=Math.round(after.height*ratio*10)/10;i.trim=0;i.length=1;Object.assign(i,reach(i,after,[i.x,i.y],tip));spriteCache.delete(i.id);selected=i.id;renderStage();ensureAsset(i.type).then(()=>{if(state.items.some(item=>item.id===i.id&&item.type===i.type))renderStage()}).catch(()=>toast(L('这枝花材暂时无法载入。','This material could not be loaded.')));persist()}}else addSpecimen(b.dataset.variant,placement);$('#modal').close();document.querySelector('.stem.selected')?.focus({preventScroll:true})});
}
$('#change-variant').onclick=()=>{const i=current();if(i)variantPicker(assetById[i.type].family,i.id)};
function renderMaterials(){
 const query=$('#material-search').value.trim().toLocaleLowerCase();
 const materials=(category==='flowers'?flowers.filter(a=>(familyFilter==='all'||(familyFilter==='book'?photoSpecimens.some(s=>s.family===a.family):familyFilter==='bundle'?a.bundle:a.group===familyFilter))&&familyHasColor(a.family,colorFilter)):vessels.filter(a=>vesselFilter==='all'||(vesselFilter==='book'?a.source==='flower-book-vessel':(a.style||'japanese')===vesselFilter))).filter(a=>!query||`${a.name} ${a.en} ${assetName(a)}`.toLocaleLowerCase().includes(query));
 $('#material-filters').hidden=category!=='flowers';$('#material-color-filters').hidden=category!=='flowers';$('#vessel-filters').hidden=category!=='vessels';$('#material-heading').textContent=category==='flowers'?L('一枝一叶','Botanicals'):L('一器一境','Vessels');$('#material-count').textContent=category==='flowers'?(familyFilter!=='all'||colorFilter!=='all'||query?L(`${materials.length} 种`,`${materials.length} types`,`${materials.length}種類`):L(`${flowers.length} 种 · ${browseSpecimens.length} 款`,`${flowers.length} types · ${browseSpecimens.length} variants`,`${flowers.length}種 · ${browseSpecimens.length}タイプ`)):L(`${vessels.length} 款花器`,`${vessels.length} vessels`,`${vessels.length}点の花器`);
 $('#material-grid').innerHTML=materials.map(a=>{const isFlower=category==='flowers',sample=isFlower?specimenForColor(a.id,colorFilter):a,name=assetName(a),image=isFlower?((sample.thumbnail||sample.source==='flower-book')?`/assets/thumbs/${sample.id}.webp`:assetPath(sample.id)):`/assets/thumbs/${a.id}.webp`,cardName=isFlower?(lang==='zh'?(a.shortName||a.name):assetName(a)):(lang==='zh'?(a.shortName||a.name):assetName(a)),meta=isFlower?`${a.group==='foliage'?L('叶材','Leaf','葉もの'):a.group==='branch'?L('枝材','Branch','枝もの'):a.bundle?L('成组','Group','花束'):L('花朵','Flower','花')} · ${a.variants}${lang==='ja'?'姿':''}`:(a.source==='flower-book-vessel'?L('书中器形 · '+a.color,'Book form · '+a.colorEn):vesselNote(a,lang==='zh'?'zh':'en')),pressed=isFlower?'':` aria-pressed="${a.id===state.vessel}"`;return `<button class="material-card ${!isFlower&&a.id===state.vessel?'active':''}" data-material="${a.id}" aria-label="${esc(L(`${isFlower?'挑选':'选择'}${name}`,`${isFlower?'Choose':'Select'} ${name}`))}"${pressed}><span class="add-mark">${isFlower?'+':''}</span><img src="${image}" alt="${esc(name)}" draggable="false" loading="lazy"><strong>${esc(cardName)}</strong><small class="${isFlower?'':'vessel-meta'}">${esc(meta)}</small></button>`}).join('');
 if(!materials.length)$('#material-grid').innerHTML=`<p class="material-grid-empty">${L('没有找到花材，试试其他颜色或名称。','No materials found. Try another color or name.','花材が見つかりません。色や名前を変えてください。')}</p>`;
 $('#material-grid').onclick=e=>{const b=e.target.closest('[data-material]');if(!b)return;const type=b.dataset.material;if(category==='vessels'){if(state.vessel===type)return;checkpoint();const from=vesselGeometry(assetById[state.vessel]).insertion,to=vesselGeometry(assetById[type]).insertion;state.items.forEach(i=>{i.x=clamp(i.x+to[0]-from[0],5,95);i.y=clamp(i.y+to[1]-from[1],15,95)});state.vessel=type;renderStage();renderMaterials();persist();const vessel=assetById[type],name=assetName(vessel),support=fixtureName(vessel);toast(lang==='ja'?`${name}に変更しました · 花留め：${support}`:L(`已换成${name} · 自动固定：${support}`,`Changed to ${name} · Auto support: ${support}`))}else variantPicker(type,null,colorFilter)};
 if(lang==='ja'){
  if(category==='flowers'&&familyFilter==='all'&&colorFilter==='all'&&!query)$('#material-count').textContent=`${flowers.length}種 · ${browseSpecimens.length}タイプ`;
  $$('.material-card',$('#material-grid')).forEach((button,index)=>{
   const material=materials[index],isFlower=category==='flowers';
   button.querySelector('small').textContent=isFlower?`${material.group==='foliage'?'葉もの':material.bundle?'花束':'花材'} · ${material.variants}姿`:(material.source==='flower-book-vessel'?`書籍の器 · ${assetColor(material)}`:vesselNote(material,'ja'));
   button.setAttribute('aria-label',`${isFlower?'花材を選ぶ':'花器を選ぶ'}: ${assetName(material)}`);
  });
 }
 toneMaterialImages($('#material-grid'));
}
const RECENT_MATERIALS='hanama-recent-materials';
let quickFilter='all',quickColorFilter='all',quickRecent=[];
try{const saved=JSON.parse(localStorage.getItem(RECENT_MATERIALS)||'[]');if(Array.isArray(saved))quickRecent=saved.filter(id=>flowers.some(f=>f.id===id)).slice(0,3)}catch{}
if(!quickRecent.length)quickRecent=[...new Set([...state.items].reverse().map(i=>assetById[i.type]?.family).filter(Boolean))].slice(0,3);
function rememberMaterial(family){quickRecent=[family,...quickRecent.filter(id=>id!==family)].slice(0,3);try{localStorage.setItem(RECENT_MATERIALS,JSON.stringify(quickRecent))}catch{}renderRecentMaterials()}
function renderRecentMaterials(){
 const group=$('#quick-material-recent');if(!group)return;
 const recent=quickRecent.map(id=>flowers.find(f=>f.id===id)).filter(Boolean);group.hidden=!recent.length;
 $$('[data-recent-slot]',group).forEach((button,index)=>{const material=recent[index];button.hidden=!material;button.disabled=!material;if(!material)return;const specimen=specimenFor(material.family),name=assetName(material);button.dataset.quickRecent=material.family;button.setAttribute('aria-label',lang==='ja'?`${name}を再び選ぶ`:lang==='en'?`Choose ${name} again`:`再次挑选${name}`);button.title=name;button.innerHTML=`<img src="${(specimen.thumbnail||specimen.source==='flower-book')?`/assets/thumbs/${specimen.id}.webp`:assetPath(specimen.id)}" alt="">`});
 toneMaterialImages(group);
}
function renderQuickMaterials(){
 const query=$('#quick-material-search').value.trim().toLocaleLowerCase();
 const materials=flowers.filter(a=>(quickFilter==='all'||(quickFilter==='book'?photoSpecimens.some(s=>s.family===a.family):quickFilter==='bundle'?a.bundle:a.group===quickFilter))&&familyHasColor(a.family,quickColorFilter)&&(!query||`${a.name} ${a.en} ${a.ja||''} ${assetName(a)}`.toLocaleLowerCase().includes(query)));
 $('#quick-material-count').textContent=lang==='ja'?`${materials.length}種類`:lang==='en'?`${materials.length} types`:`${materials.length} 种`;
 $('#quick-material-empty').hidden=!!materials.length;
 $('#quick-material-grid').innerHTML=materials.map(a=>{const sample=specimenForColor(a.family,quickColorFilter),name=assetName(a),image=(sample.thumbnail||sample.source==='flower-book')?`/assets/thumbs/${sample.id}.webp`:assetPath(sample.id),group=lang==='ja'?(a.group==='foliage'?'葉もの':a.bundle?'花束':a.group==='branch'?'枝もの':'花'):lang==='en'?(a.group==='foliage'?'Foliage':a.bundle?'Group':a.group==='branch'?'Branch':'Bloom'):(a.group==='foliage'?'叶材':a.bundle?'成组':a.group==='branch'?'枝叶':'花朵');return `<button type="button" class="material-card quick-material-card" data-quick-material="${esc(a.family)}" aria-label="${esc(lang==='ja'?`${name}を選ぶ`:lang==='en'?`Choose ${name}`:`挑选${name}`)}"><span class="add-mark">+</span><img src="${image}" alt="" loading="lazy" draggable="false"><strong>${esc(lang==='zh'?(a.shortName||name):name)}</strong><small>${esc(group)} · ${a.variants}${lang==='ja'?'姿':lang==='en'?(a.variants===1?' pose':' poses'):' 款'}</small></button>`}).join('');
 $$('[data-quick-family-group]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.quickFamilyGroup===quickFilter)));
 $$('[data-quick-color-group]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.quickColorGroup===quickColorFilter)));
 toneMaterialImages($('#quick-material-grid'));
 renderRecentMaterials();
}
function closeQuickMaterialDrawer({focus=false}={}){const drawer=$('#quick-material-drawer');if(drawer.hidden)return;drawer.hidden=true;document.body.classList.remove('material-sheet-open');$('#quick-material-open').setAttribute('aria-expanded','false');if(focus)$('#quick-material-open').focus({preventScroll:true})}
$('#quick-material-open').onclick=()=>{const drawer=$('#quick-material-drawer');if(!drawer.hidden){closeQuickMaterialDrawer({focus:true});return}closeLayerMenu();setEditMode('move');drawer.hidden=false;document.body.classList.add('material-sheet-open');$('#quick-material-open').setAttribute('aria-expanded','true');renderQuickMaterials();$('#quick-material-search').focus({preventScroll:true})};
$('#quick-material-close').onclick=()=>closeQuickMaterialDrawer({focus:true});
$('#quick-material-search').oninput=renderQuickMaterials;
$('#quick-material-filters').onclick=e=>{const button=e.target.closest('[data-quick-family-group]');if(!button)return;quickFilter=button.dataset.quickFamilyGroup;renderQuickMaterials()};
$('#quick-material-color-filters').onclick=e=>{const button=e.target.closest('[data-quick-color-group]');if(!button)return;quickColorFilter=button.dataset.quickColorGroup;renderQuickMaterials()};
$('#quick-material-grid').onclick=e=>{const button=e.target.closest('[data-quick-material]');if(button)variantPicker(button.dataset.quickMaterial,null,quickColorFilter)};
$('#quick-material-recent').onclick=e=>{const button=e.target.closest('[data-quick-recent]');if(button)variantPicker(button.dataset.quickRecent)};
$('#quick-material-drawer').addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();closeQuickMaterialDrawer({focus:true})}});
$('#material-search').oninput=renderMaterials;
$$('[data-category]').forEach(b=>b.onclick=()=>{category=b.dataset.category;$('#material-search').value='';$$('[data-category]').forEach(t=>t.setAttribute('aria-selected',String(t===b)));renderMaterials()});
$$('[data-vessel-style]').forEach(b=>b.onclick=()=>{vesselFilter=b.dataset.vesselStyle;$$('[data-vessel-style]').forEach(t=>{const active=t===b;t.classList.toggle('active',active);t.setAttribute('aria-pressed',String(active))});renderMaterials()});
$$('[data-family-group]').forEach(b=>b.onclick=()=>{familyFilter=b.dataset.familyGroup;$$('[data-family-group]').forEach(t=>t.classList.toggle('active',t===b));renderMaterials()});
$$('[data-color-group]').forEach(b=>b.onclick=()=>{colorFilter=b.dataset.colorGroup;$$('[data-color-group]').forEach(t=>{const active=t===b;t.classList.toggle('active',active);t.setAttribute('aria-pressed',String(active))});renderMaterials()});
function pointerStage(e){const r=$('#stage').getBoundingClientRect();return [(e.clientX-r.left)/r.width,(e.clientY-r.top)/r.height]}
function selectItem(id){selected=id;$$('.stem').forEach(n=>{const on=n.dataset.id===id;n.classList.toggle('selected',on);n.setAttribute('aria-pressed',String(on))});renderSelection();renderCutChoice();if(!$('#layer-menu').hidden)renderLayerList()}
function renderCutChoice(){
 const choice=$('#cut-choice');if(!choice)return;
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
 const row=(item,index,side)=>{const a=assetById[item.type],name=assetName(a)+(item.pieceLabel?` · ${item.pieceLabel}`:''),layer=side==='front'?(lang==='ja'?`花器の前 · ${front.indexOf(item)+1}層目`:lang==='en'?`Vessel front · Layer ${front.indexOf(item)+1}`:`花器前 · 第 ${front.indexOf(item)+1} 层`):(lang==='ja'?`花器の後ろ · ${back.indexOf(item)+1}層目`:lang==='en'?`Vessel back · Layer ${back.indexOf(item)+1}`:`花器后 · 第 ${back.indexOf(item)+1} 层`),frontDisabled=item.aboveVessel&&front.indexOf(item)===0,backDisabled=!item.aboveVessel&&back.indexOf(item)===back.length-1;return `<div class="layer-row ${item.id===selected?'active':''}" data-layer-id="${item.id}" draggable="true"><span class="layer-grip" aria-hidden="true">⠿</span><button class="layer-select" data-layer-select="${item.id}" aria-label="${esc(lang==='ja'?`${name}を選択`:L(`选择${name}`,`Select ${name}`))}"><img src="${assetPath(item.type)}" alt=""><span><strong>${esc(name)}</strong><small>${layer}</small></span></button><span class="layer-step"><button data-layer-shift="front" aria-label="${esc(lang==='ja'?`${name}を花器の前へ移動`:L(`将${name}移向花器前`,`Move ${name} toward the front of the vase`))}" ${frontDisabled?'disabled':''}>↑</button><button data-layer-shift="back" aria-label="${esc(lang==='ja'?`${name}を花器の後ろへ移動`:L(`将${name}移向花器后`,`Move ${name} toward the back of the vase`))}" ${backDisabled?'disabled':''}>↓</button></span></div>`};
 list.innerHTML=visual.length?[...front.map((item,index)=>row(item,index,'front')),'<div class="layer-vessel-divider">'+L('花器','Vessel')+'</div>',...back.map((item,index)=>row(item,front.length+index,'back'))].join(''):`<div class="layer-empty">${L('先添入花材，再安排层次。','Add a material, then arrange its layer.')}</div>`;
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
function closeLayerMenu(){const menu=$('#layer-menu');if(menu.hidden)return;menu.hidden=true;$('.design-panel').hidden=false;$('#layers-tool').setAttribute('aria-expanded','false');layerDragId=null;focusOtherLayers=false;renderLayerQuickActions()}
function mountLayerDock(){
 const menu=$('#layer-menu'),host=$('.workspace'),after=$('.design-panel');
 if(menu.parentElement!==host||menu.nextElementSibling!==after)host.insertBefore(menu,after);
}
function openLayerMenu(){
 closeQuickMaterialDrawer();setEditMode('move');mountLayerDock();const menu=$('#layer-menu');menu.hidden=false;$('.design-panel').hidden=true;$('#layers-tool').setAttribute('aria-expanded','true');renderLayerList();if(innerWidth<=900)menu.scrollIntoView({block:'nearest',behavior:'smooth'});
}
mountLayerDock();
window.addEventListener('resize',mountLayerDock);
$('#layer-menu').addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();closeLayerMenu();$('#layers-tool').focus()}});
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
$('#stage').addEventListener('contextmenu',e=>{e.preventDefault();if(stroke||gesture||movePointers.size||performance.now()<suppressLayerContextUntil)return;const stem=e.target.closest('.stem');if(stem)selectItem(stem.dataset.id);openLayerMenu(e.clientX,e.clientY)});
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
 stage.style.transform=`translate(${zoomPanX}px,${zoomPanY}px) scale(${zoomLevel})`;
 const percent=`${Math.round(zoomLevel*100)}%`;$('#zoom-reset').textContent=percent;$('#zoom-reset').setAttribute('aria-label',`${lang==='ja'?'倍率をリセット':lang==='en'?'Reset zoom':'重置画布缩放'} · ${percent}`);$('#zoom-in').disabled=zoomLevel>=3;$('#zoom-out').disabled=zoomLevel<=1;
}
function setCanvasZoom(next){const old=zoomLevel;zoomLevel=clamp(Math.round(next*100)/100,1,3);if(zoomLevel===1)zoomPanX=zoomPanY=0;else if(old!==zoomLevel){zoomPanX*=zoomLevel/old;zoomPanY*=zoomLevel/old}applyCanvasZoom();redrawStemCanvases();renderFixture();drawPruneOverlay()}
$('#zoom-in').onclick=()=>setCanvasZoom(zoomLevel+.25);$('#zoom-out').onclick=()=>setCanvasZoom(zoomLevel-.25);$('#zoom-reset').onclick=()=>setCanvasZoom(1);
applyCanvasZoom();
const gestureMetrics=(a,b)=>({distance:Math.hypot(b.x-a.x,b.y-a.y),bearing:Math.atan2(b.y-a.y,b.x-a.x)});
const gestureAngleDelta=(now,start)=>Math.atan2(Math.sin(now-start),Math.cos(now-start))*180/Math.PI;
function startGestureIfReady(){
 if(gesture||!drag||drag.pointerType!=='touch'||movePointers.size<2)return false;
 const ids=[drag.pointer,...[...movePointers.keys()].filter(id=>id!==drag.pointer)].slice(0,2),a=movePointers.get(ids[0]),b=movePointers.get(ids[1]);if(!a||!b)return false;
 const metrics=gestureMetrics(a,b);if(metrics.distance<24)return false;
 gesture={pointers:ids,item:drag.item,el:drag.el,startDistance:metrics.distance,startBearing:metrics.bearing,baseAngle:drag.item.angle,baseH:drag.item.h,checkpointed:drag.started,gestureStarted:false,changed:drag.started};drag=null;suppressLayerContextUntil=performance.now()+600;updateGestureFeedback(a,b,gesture.item,true);return true;
}
function syncGestureControls(item){$('#angle').value=item.angle;$('#angle-value').value=Math.round(item.angle)+'°';renderSizeControls(item)}
function updateGestureFeedback(a,b,item,active=true){const feedback=$('#gesture-feedback');if(!feedback||!a||!b)return;const rect=stage.getBoundingClientRect(),x=((a.x+b.x)/2-rect.left)/rect.width*100,y=((a.y+b.y)/2-rect.top)/rect.height*100;feedback.style.setProperty('--gesture-x',`${clamp(x,8,92)}%`);feedback.style.setProperty('--gesture-y',`${clamp(y,8,92)}%`);$('output',feedback).value=`${Math.round(item.angle)}°`;feedback.classList.toggle('active',active)}
function finishMoveInteraction(suppressTouchContext=false){
 if(!drag&&!gesture&&!canvasPan&&!movePointers.size)return false;
 const changed=!!(drag?.started||gesture?.changed),ids=new Set([...movePointers.keys(),drag?.pointer,canvasPan?.pointer,...(gesture?.pointers||[])]);ids.delete(undefined);drag=null;gesture=null;canvasPan=null;movePointers.clear();$('#gesture-feedback')?.classList.remove('active');
 for(const id of ids){try{if(stage.hasPointerCapture(id))stage.releasePointerCapture(id)}catch{}}
 if(suppressTouchContext)suppressLayerContextUntil=performance.now()+600;if(changed)persist();return changed;
}
stage.addEventListener('pointerdown',e=>{
 if(e.button!==0||editMode!=='move')return;
 if(e.pointerType==='touch'&&(gesture||drag?.pointerType==='touch')){e.preventDefault();e.stopPropagation();if(movePointers.size>=2)return;movePointers.set(e.pointerId,{x:e.clientX,y:e.clientY});try{stage.setPointerCapture(e.pointerId)}catch{}startGestureIfReady();return}
 if(e.target.closest('.stage-tools,.layer-menu'))return;const el=e.target.closest('.stem');if(!el&&zoomLevel>1&&!drag&&!gesture){e.preventDefault();canvasPan={pointer:e.pointerId,startX:e.clientX,startY:e.clientY,x:zoomPanX,y:zoomPanY};try{stage.setPointerCapture(e.pointerId)}catch{}return}if(!el||drag||gesture)return;e.preventDefault();selectItem(el.dataset.id);const item=current();drag={pointer:e.pointerId,pointerType:e.pointerType,item,startX:e.clientX,startY:e.clientY,x:item.x,y:item.y,rect:stage.getBoundingClientRect(),el,started:false};if(e.pointerType==='touch'){movePointers.set(e.pointerId,{x:e.clientX,y:e.clientY});if(!touchHintShown){touchHintShown=true;toast(L('单指移动 · 双指旋转与缩放','One finger moves · Two fingers rotate and scale'))}}el.focus({preventScroll:true});try{stage.setPointerCapture(e.pointerId)}catch{}
});
stage.addEventListener('pointermove',e=>{
 if(canvasPan?.pointer===e.pointerId){e.preventDefault();zoomPanX=canvasPan.x+e.clientX-canvasPan.startX;zoomPanY=canvasPan.y+e.clientY-canvasPan.startY;applyCanvasZoom();return}
 if(movePointers.has(e.pointerId))movePointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
 if(!gesture&&drag?.pointerType==='touch'&&movePointers.size>1)startGestureIfReady();
 if(gesture&&gesture.pointers.includes(e.pointerId)){e.preventDefault();const a=movePointers.get(gesture.pointers[0]),b=movePointers.get(gesture.pointers[1]);if(!a||!b)return;const metrics=gestureMetrics(a,b),nextAngle=Math.round(clamp(gesture.baseAngle+gestureAngleDelta(metrics.bearing,gesture.startBearing),-180,180)),nextH=Math.round(clamp(gesture.baseH*metrics.distance/gesture.startDistance,...sizeBounds(assetById[gesture.item.type]))*10)/10;if(!gesture.gestureStarted){if(Math.abs(nextAngle-gesture.baseAngle)<.8&&Math.abs(nextH-gesture.baseH)<.6){updateGestureFeedback(a,b,gesture.item);return}gesture.gestureStarted=true;if(!gesture.checkpointed){checkpoint();gesture.checkpointed=true}}if(nextAngle===gesture.item.angle&&nextH===gesture.item.h){updateGestureFeedback(a,b,gesture.item);return}gesture.item.angle=nextAngle;gesture.item.h=nextH;gesture.changed=true;gesture.el.style.cssText=stemStyle(gesture.item);syncGestureControls(gesture.item);updateGestureFeedback(a,b,gesture.item);return}
 if(!drag||drag.pointer!==e.pointerId)return;e.preventDefault();if(drag.pointerType==='touch'&&movePointers.size>1)return;if(!drag.started&&Math.hypot(e.clientX-drag.startX,e.clientY-drag.startY)<3)return;if(!drag.started){checkpoint();drag.started=true}drag.item.x=clamp(drag.x+(e.clientX-drag.startX)/drag.rect.width*100,5,95);drag.item.y=clamp(drag.y+(e.clientY-drag.startY)/drag.rect.height*100,15,95);drag.el.style.cssText=stemStyle(drag.item)
});
function finishMovePointer(e){const involved=movePointers.has(e.pointerId)||drag?.pointer===e.pointerId||canvasPan?.pointer===e.pointerId||gesture?.pointers.includes(e.pointerId);if(involved)finishMoveInteraction(e.pointerType==='touch')}
stage.addEventListener('pointerup',finishMovePointer);stage.addEventListener('pointercancel',finishMovePointer);stage.addEventListener('lostpointercapture',finishMovePointer);
function setEditMode(mode){
 if(drag||gesture||canvasPan||movePointers.size)finishMoveInteraction(true);
 if(mode!=='move'&&!current()){toast(L('先选中要修剪的那一枝。','Select a material to cut first.','先に切る花材を選んでください。'));return}
 editMode=mode;if(mode!=='move'){setEditorTab('shape');$('#stem-details').open=true}stroke=null;$('#stage').dataset.tool=mode;
 $('#move-tool').setAttribute('aria-pressed',String(mode==='move'));$('#prune-tool').setAttribute('aria-pressed',String(mode==='split'));$('#erase-tool').setAttribute('aria-pressed',String(mode==='brush'));
 $$('[data-prune]').forEach(b=>b.classList.toggle('active',b.dataset.prune===mode));$('#brush-setting').hidden=mode!=='brush';
 $('#stage-hint').textContent=mode==='split'?L('从目标枝一侧起笔，横划过连接处','Start beside the target twig; draw across its attachment','切りたい枝の側から付け根を横切ってください'):mode==='brush'?L('涂抹剪掉细节 · Esc 退出','Brush over details to remove · Esc to exit','なぞって細部を消します · Escで終了'):L('拖动移动 · 双指旋转缩放 · 右键调层次','Drag to move · Pinch to rotate and scale · Right-click for layers','ドラッグで移動 · 2本指で回転・拡大縮小 · 右クリックでレイヤー');
 $('#prune-help').textContent=mode==='split'?L('只在剪线接触的局部剪开。剪下部分会成为独立图层，可以移动或删除。','The cut opens only where your stroke touches. The detached part becomes its own movable layer.','線が触れた部分だけを切ります。切り離した部分は移動・削除できるレイヤーになります。'):mode==='move'?L('先选中一枝，再剪开局部连接或修掉细节。','Select a material, then cut a local attachment or refine details.','花材を選んで、付け根を切るか細部を整えます。'):L('在枝叶上涂抹去除细节。只修剪当前选中的一枝。','Brush over foliage details. Only the selected stem will be pruned.','選択中の花材をなぞって細部を消します。');drawPruneOverlay();
}
$('#move-tool').onclick=()=>setEditMode('move');$('#prune-tool').onclick=()=>setEditMode(editMode==='split'?'move':'split');$('#erase-tool').onclick=()=>setEditMode(editMode==='brush'?'move':'brush');$$('[data-prune]').forEach(b=>b.onclick=()=>setEditMode(editMode===b.dataset.prune?'move':b.dataset.prune));
$('#stem-details').addEventListener('toggle',()=>{if(!$('#stem-details').open&&editMode!=='move')setEditMode('move')});
$('#brush-size').oninput=e=>$('#brush-value').value=e.target.value;
$('#restore-cuts').onclick=()=>{if(!current()?.cuts.length)return;checkpoint();current().cuts=[];renderStage();persist();toast(L('已恢复细部擦除。','Brushwork restored.','細部消去を戻しました。'))};
function drawPruneOverlay(){const c=$('#prune-overlay');if(!c)return;const size=Math.max(1,Math.round($('#stage').getBoundingClientRect().width));c.width=c.height=size;const ctx=c.getContext('2d');if(!stroke?.points.length||!current())return;const item=current(),asset=assetById[item.type],points=stroke.kind==='split'?[stroke.points[0],stroke.points.at(-1)]:stroke.points;ctx.beginPath();points.forEach((p,k)=>{const q=sourceToStage(p,item,asset);ctx[k?'lineTo':'moveTo'](q[0]*size,q[1]*size)});ctx.strokeStyle='#a5533e';ctx.lineWidth=stroke.kind==='split'?2.5:2;ctx.setLineDash(stroke.kind==='split'?[7,4]:[5,4]);ctx.stroke();}
new ResizeObserver(()=>{applyCanvasZoom();drawPruneOverlay();renderFixture();mountLayerDock()}).observe($('#stage'));
$('#stage').addEventListener('pointerdown',e=>{if(editMode==='move'||e.button!==0||!current()||stroke)return;e.preventDefault();if(editMode==='split'&&(current().localCuts||[]).length>=8)return toast(L('这一段已经剪得很细，可先整理现有片段。','This piece has reached the cut limit. Arrange its pieces first.','この部分はこれ以上分割できません。'));if(editMode!=='split'&&current().cuts.length>=24)return toast(L('这枝已有 24 处剪口；可恢复剪枝后重剪。','This stem already has 24 cuts. Restore it before pruning again.'));const total=state.items.reduce((n,i)=>n+i.cuts.reduce((m,c)=>m+c.points.length,0),0);if(editMode!=='split'&&total>7800)return toast(L('剪枝细节已很多，请先恢复部分剪口。','There is extensive pruning detail. Restore some cuts first.'));const item=current(),p=stageToSource(pointerStage(e),item,assetById[item.type]);stroke={kind:editMode,points:[p],radius:clamp(Number($('#brush-size').value)/$('#stage').getBoundingClientRect().width/(item.h/100)/2,.002,.3),pointer:e.pointerId};$('#stage').setPointerCapture(e.pointerId);drawPruneOverlay()});
let brushPreviewFrame=0;
$('#stage').addEventListener('pointermove',e=>{if(!stroke||stroke.pointer!==e.pointerId)return;const item=current();const p=stageToSource(pointerStage(e),item,assetById[item.type]);const previous=sourceToStage(stroke.points.at(-1),item,assetById[item.type]),next=pointerStage(e);if(Math.hypot(next[0]-previous[0],next[1]-previous[1])<.003)return;if(stroke.kind==='split')stroke.points=[stroke.points[0],p];else stroke.points.push(p);if(stroke.points.length>512)stroke.points=simplifyPoints(stroke.points,256);if(stroke.kind==='brush'&&!brushPreviewFrame){const itemId=item.id;brushPreviewFrame=requestAnimationFrame(()=>{brushPreviewFrame=0;if(stroke?.kind==='brush'&&current()?.id===itemId)drawStemCanvas($(`.stem[data-id="${itemId}"]`),item,{previewCut:stroke})})}drawPruneOverlay()});
function splitSelected(cut){
 const item=current(),asset=item&&assetById[item.type],img=item&&images[item.type];if(!item||!img)return false;
 if(state.items.length>=24){toast(L('画布最多放置 24 段花材。','The canvas can hold up to 24 pieces.','キャンバスには24点まで配置できます。'));return false}
 const p0=cut.points[0],p1=cut.points.at(-1),stage0=sourceToStage(p0,item,asset),stage1=sourceToStage(p1,item,asset);
 if(Math.hypot(stage1[0]-stage0[0],stage1[1]-stage0[1])*$('#stage').getBoundingClientRect().width<6){toast(L('横划过要剪的细枝，划过连接处即可。','Draw across the twig at its attachment.','切りたい小枝の付け根を横切ってください。'));return false}
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
 if(!result.ok){toast(result.reason==='short'?L('请横划过想剪开的连接处。','Draw across the attachment to cut it.','切りたい付け根を横切ってください。'):L('这一剪还没把局部剪开，请靠近枝叶连接处再试。','That stroke did not separate a local piece. Try near its attachment.','まだ切り離されていません。枝葉の付け根で試してください。'));return false}
 const root=item.originId||item.id,prefix=item.pieceLabel||'',makePiece=(part,label)=>({...clone(item),id:uid(),originId:root,pieceLabel:label,localCuts:[...(item.localCuts||[]),{cut:result.cut,part,anchor:result.anchors[part]}]});
 const pieces=[makePiece('main',prefix?`${prefix}1`:'A'),makePiece('detached',prefix?`${prefix}2`:'B')];
 checkpoint();const index=state.items.findIndex(i=>i.id===item.id);state.items.splice(index,1,...pieces);selected=pieces[1].id;cutSession={ids:pieces.map(i=>i.id)};dropSprite(item.id);setEditMode('move');$('#stem-details').open=false;renderStage();persist();return true;
}
function finishPrune(e,cancel=false){
 if(!stroke||stroke.pointer!==e.pointerId)return;const cut=stroke;stroke=null;
 if(e.pointerType==='touch')suppressLayerContextUntil=performance.now()+600;
 if(!cancel&&cut.kind==='split'){if(cut.points.length>=2&&splitSelected(cut))return;renderStage();return}
 if(!cancel&&cut.kind==='brush'){
  const item=current();checkpoint();item.cuts.push({kind:cut.kind,points:simplifyPoints(cut.points),radius:clamp(cut.radius,.002,.3)});
  const mask=specimenCanvas(item)?.mask,fullyErased=!!mask&&!mask.data.some(alpha=>alpha>12);
  if(fullyErased){state.items=state.items.filter(entry=>entry.id!==item.id);dropSprite(item.id);selected=state.items.find(entry=>entry.originId&&entry.originId===item.originId)?.id||state.items.at(-1)?.id||null;cutSession=null;setEditMode('move');toast(L('这一小段已擦除，可撤销。','This piece was erased. You can undo.','この部分を消去しました。元に戻せます。'))}
  else toast(L('已剪去选中的枝叶，可撤销。','Selected foliage removed. You can undo this action.'));
 }
 renderStage();if(!cancel)persist();
}
$('#stage').addEventListener('pointerup',e=>finishPrune(e));$('#stage').addEventListener('pointercancel',e=>finishPrune(e,true));
$('#stage').addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();closeLayerMenu();cutSession=null;renderCutChoice();setEditMode('move');renderStage();return}if(e.target.closest('input,textarea'))return;if(e.key==='Enter'&&e.target.closest('.stem')){selectItem(e.target.closest('.stem').dataset.id);return}const item=current();if(!item)return;if(['Delete','Backspace'].includes(e.key)){e.preventDefault();removeSelected();return}if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key))return;e.preventDefault();checkpoint();const step=e.shiftKey?2:.5;item.x=clamp(item.x+(e.key==='ArrowRight'?step:e.key==='ArrowLeft'?-step:0),5,95);item.y=clamp(item.y+(e.key==='ArrowDown'?step:e.key==='ArrowUp'?-step:0),15,95);const el=$(`.stem[data-id="${item.id}"]`);if(el)el.style.cssText=stemStyle(item);persist()});
/** Slider ticks restyle only the selected stem once per frame; drawn stems keep their centimetres and never pass MAX_STEM_CM. */
for(const [id,key,factor] of [['angle','angle',1],['size','h',1],['trim','trim',1],['length','length',.01]]){let active=false;const el=$('#'+id);el.addEventListener('input',()=>{const item=current();if(!item)return;const a=assetById[item.type];if(key==='trim'&&drawsStem(a))return;if(!active){checkpoint();active=true}const maxLength=()=>lengthBounds(a,item.h,item.trim)[1];if(key==='length'&&drawsStem(a))item.length=Math.min(lengthForStem(item,a,+el.value),maxLength());else if(key==='h'&&drawsStem(a)){const cm=stemCm(item,a);item.h=+el.value;item.length=Math.min(lengthForStem(item,a,cm),maxLength())}else item[key]=+el.value*factor;queueStemUpdate(item);schedulePersist()});el.addEventListener('change',()=>{active=false;flushPersist()});el.addEventListener('blur',()=>{active=false;flushPersist()})}
function removeSelected(){if(!current())return;checkpoint();state.items=state.items.filter(i=>i.id!==selected);selected=state.items.at(-1)?.id||null;setEditMode('move');renderStage();persist()}
function duplicateSelected(){const item=current();if(!item)return;if(state.items.length>=24)return toast(L('画布最多放置 24 组花材。','The canvas can hold up to 24 material layers.'));checkpoint();const duplicate={...clone(item),id:uid(),x:clamp(item.x+2.5,5,95),y:clamp(item.y-2,15,95),cuts:clone(item.cuts||[]),localCuts:clone(item.localCuts||[])};duplicate.originId=duplicate.id;const index=state.items.findIndex(i=>i.id===item.id);state.items.splice(index+1,0,duplicate);selected=duplicate.id;renderStage();persist();toast(L('已复制花材，剪口与长度也已保留。','Duplicated the material with its cuts and stem length.'))}
function moveSelectedToFront(){const item=current();if(!item)return;checkpoint();state.items=state.items.filter(i=>i.id!==item.id);item.aboveVessel=true;state.items.push(item);selected=item.id;renderStage();persist();toast(L('已移到最前层','Moved to the front layer'))}
function moveSelectedToBack(){const item=current();if(!item)return;checkpoint();state.items=state.items.filter(i=>i.id!==item.id);item.aboveVessel=false;state.items.unshift(item);selected=item.id;renderStage();persist();toast(L('已移到最后层','Moved to the back layer'))}
function moveSelectedToRandomMiddle(){
 const item=current();if(!item)return;
 const back=state.items.filter(i=>!i.aboveVessel&&i!==item),front=state.items.filter(i=>i.aboveVessel&&i!==item);
 const original=state.items.filter(i=>!i.aboveVessel).indexOf(item),positions=Array.from({length:back.length+1},(_,index)=>index);
 const middle=positions.filter(index=>index>0&&index<back.length),pool=middle.length?middle:positions;
 const choices=pool.filter(index=>item.aboveVessel||index!==original);if(!choices.length)return;
 checkpoint();item.aboveVessel=false;back.splice(choices[Math.floor(Math.random()*choices.length)],0,item);state.items=[...back,...front];selected=item.id;renderStage();persist();toast(L('已随机放在花器后方','Placed behind the vase','花器の後ろに配置しました'));
}
$('#delete-button').onclick=removeSelected;$('#reseat-button').onclick=reseatSelected;$('#scale-reset').onclick=resetRealSize;$('#flip-button').onclick=()=>{if(!current())return;checkpoint();current().flip=!current().flip;renderStage();persist()};$('#duplicate-button').onclick=duplicateSelected;$('#layer-button').onclick=moveSelectedToFront;$('#layer-back-button').onclick=moveSelectedToBack;
$('#undo-button').onclick=()=>{finishMoveInteraction(true);if(!undoStack.length)return;redoStack.push({state:clone(state),selected});const previous=undoStack.pop();state=previous.state;selected=previous.selected;cutSession=null;setEditMode('move');renderAll()};$('#redo-button').onclick=()=>{finishMoveInteraction(true);if(!redoStack.length)return;undoStack.push({state:clone(state),selected});const next=redoStack.pop();state=next.state;selected=next.selected;cutSession=null;setEditMode('move');renderAll()};
$('#guide-button').onclick=()=>{const on=$('#guide').hidden;$('#guide').hidden=!on;$('#guide-button').setAttribute('aria-pressed',String(on))};$('#reset-button').onclick=()=>{checkpoint();state.items=[];selected=null;cutSession=null;setEditMode('move');renderStage();persist();toast(L('花器已留空，随时可以撤销。','The vessel is empty. You can undo this action.'))};
$$('[data-scene]').forEach(b=>b.onclick=()=>{checkpoint();state.scene=b.dataset.scene;renderStage();persist()});$$('[data-mood]').forEach(b=>b.onclick=()=>{checkpoint();state.mood=b.dataset.mood;$$('[data-mood]').forEach(t=>t.classList.toggle('active',t===b));persist()});
$('#work-title').addEventListener('input',e=>{state.title=e.target.value;persist()});$('#work-subtitle').addEventListener('input',e=>{state.subtitle=e.target.value;persist()});$('#intention').addEventListener('input',e=>{state.intention=e.target.value;persist()});
$('#generation-mode').onchange=e=>{checkpoint();state.generation=e.target.value;$('#generation-mode-help').textContent=generationDescriptions[lang][state.generation];persist()};

function openModal(html,kicker='HANAMA ATELIER'){$('#modal-kicker').textContent=kicker;$('#modal').classList.toggle('variant-modal',kicker==='BOTANICAL VARIATIONS');$('#modal-content').innerHTML=html;icons($('#modal'));if(!$('#modal').open)$('#modal').showModal()}
$('#close-modal').onclick=()=>$('#modal').close();$('#modal').addEventListener('click',e=>{if(e.target===$('#modal')){const r=$('#modal').getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)$('#modal').close()}});
function help(){const html=lang==='en'?`<h2>Take a moment and arrange slowly.</h2><div class="step-list"><div><span class="step-number">01</span><p><strong>Choose and place.</strong><br>Select materials beside the canvas, then choose a natural color and pose. Drag to move; use two fingers to rotate and scale. Zoom with the nearby controls. Draw across a local attachment to split off a movable piece, or brush away fine details. Open Layers to reorder.</p></div><div><span class="step-number">02</span><p><strong>Set your intention.</strong><br>Choose the scene and add a note. All three modes preserve your flowers, main composition and overall light. They allow different degrees of small adjustments to stem curves, facing, depth and insertion so the sketch becomes a believable real arrangement.</p></div><div><span class="step-number">03</span><p><strong>From draft to artwork.</strong><br>Download the pack, upload draft.png to ChatGPT image creation or GPT Image, and paste prompt.txt. The composition guide is optional. Import the result into My Works to save or share it.</p></div></div><p class="file-note">Keyboard: use arrow keys to nudge, Shift + arrows for larger moves, and Delete to remove the selected material. Drafts and artworks stay in this browser unless you export them.</p><div class="modal-actions"><button class="button dark" id="help-done">Start arranging</button><button class="button outline" id="help-import">Import draft file</button></div>`:`<h2>给自己一刻，慢慢插花。</h2><div class="step-list"><div><span class="step-number">01</span><p><strong>选花，落枝。</strong><br>在画布旁挑选花材，选好姿态与花色。单指拖动位置，双指旋转缩放；旁边按钮可放大画布。划过一处枝叶连接，就能分出可移动、可删除的一段；细节也可涂抹修剪。图层入口可调整前后顺序。</p></div><div><span class="step-number">02</span><p><strong>写下你的意境。</strong><br>选择光与景，留下一句话。三种生成方式都保留用花、主要构图与整体光感，允许不同程度的小幅整理：枝条弧度、花面朝向、前后空间和瓶口插入关系。</p></div><div><span class="step-number">03</span><p><strong>从草稿，到作品。</strong><br>下载创作包，在 ChatGPT 图片创作或 GPT Image 中上传 draft.png，再粘贴 prompt.txt。轮廓参考图可按需附上。生成后可导入「我的作品」保存或分享。</p></div></div><p class="file-note">键盘操作：方向键微调，Shift + 方向键大幅移动，Delete 删除。草稿与成品仅保存在当前浏览器，导出文件可以备份。</p><div class="modal-actions"><button class="button dark" id="help-done">开始这一枝</button><button class="button outline" id="help-import">导入草稿文件</button></div>`;openModal(html);$('#help-done').onclick=()=>$('#modal').close();$('#help-import').onclick=()=>$('#draft-upload').click()}
function helpJapanese(){const html=`<h2>ゆっくり、ひと枝ずつ。</h2><div class="step-list"><div><span class="step-number">01</span><p><strong>花材を選び、配置する。</strong><br>花材と花器を選び、色や姿を整えます。追加位置は最前面か最後面を選択できます。ドラッグで移動し、2本指で回転・拡大縮小。キャンバス脇のボタンで拡大できます。付け根を横切るように線を引くと、切り離した部分が独立したレイヤーになり、移動や削除ができます。レイヤーから前後も並べ替えられます。</p></div><div><span class="step-number">02</span><p><strong>作品のイメージを決める。</strong><br>背景と雰囲気を選び、ひとことメモを添えます。生成用の3つの仕上げ方は、花材・構図・全体の光を保ちながら、枝の曲線や花の向き、奥行き、器への挿し方を自然に整えます。</p></div><div><span class="step-number">03</span><p><strong>下書きを作品にする。</strong><br>生成用パックをダウンロードし、draft.pngをChatGPTの画像作成またはGPT Imageにアップロードして、prompt.txtを貼り付けます。完成画像は「マイ作品」に読み込んで保存・共有できます。</p></div></div><p class="file-note">キーボード：矢印キーで微調整、Shift＋矢印キーで大きく移動、Deleteで選択した花材を削除します。</p><div class="modal-actions"><button class="button dark" id="help-done">創作を始める</button><button class="button outline" id="help-import">下書きを読み込む</button></div>`;openModal(html);$('#help-done').onclick=()=>$('#modal').close();$('#help-import').onclick=()=>$('#draft-upload').click()}
$('#help-button').onclick=()=>lang==='ja'?helpJapanese():help();
function sources(){const html=lang==='en'?`<h2>Materials from nature, ideas from ikebana.</h2><p>Hanama is a free-form creative exercise. It does not score work or present its simplified composition hints as school rules.</p><h3>Ikebana references</h3><div class="source-list"><a href="https://chs.ikenobo.jp/about/style.html" target="_blank" rel="noopener noreferrer">Ikenobo · Three styles of ikebana ↗</a><br><a href="https://www.sogetsu.or.jp/e/begin/" target="_blank" rel="noopener noreferrer">Sogetsu · Learning through free expression ↗</a></div><p>Ikenobo free style values the form and texture of plants; Sogetsu encourages personal expression. The spacing and direction cues here are creative suggestions for the game.</p><h3>The Flower Book · reading notes</h3><p>Rachel Siegfried, DK: vessel shape (pp. 10–11), floral roles and natural facing (pp. 12–21), cherry (pp. 64–67), iris (pp. 108–111), and chrysanthemum (pp. 156–159). The editable studies interpret these ideas. The library includes original photographs for all 60 botanical profiles, preserving the flower faces and 34 natural groupings. Page backgrounds and text were removed. Six earlier AI adaptations remain compatible with saved drafts.</p><h3>Asset notes</h3><p>Book photographs are labeled separately from original GPT Image plants. Book vessels use image-assisted extraction and reconstruction of hidden openings. Other newer vessels are original GPT Image assets. Two original vessels come from <a href="https://purepng.com/photo/18638/objects-vase" target="_blank" rel="noopener noreferrer">PurePNG / PNGStock</a>, marked CC0 on the source page. The archived exhibition photograph is Rémi Jouan's <a href="https://commons.wikimedia.org/wiki/File:Ikebana_International_Paris_2019_(01).JPG" target="_blank" rel="noopener noreferrer">Ikebana International Paris 2019 (01)</a>, used under <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener noreferrer">CC BY 4.0</a>.</p><p class="file-note">Sources reviewed September 2026. You control exports and sharing; Hanama does not publish your images automatically.</p>`:`<h2>从自然取材，从花道取意。</h2><p>花间以自由创作练习为出发点，不为作品打分，也不将简化的构图方法当作流派规范。</p><h3>花道参考</h3><div class="source-list"><a href="https://chs.ikenobo.jp/about/style.html" target="_blank" rel="noopener noreferrer">池坊 · 花道的三种样式 ↗</a><br><a href="https://www.sogetsu.or.jp/e/begin/" target="_blank" rel="noopener noreferrer">草月 · 自由表达与学习 ↗</a></div><p>池坊的自由花重视草木的形状与质感；草月鼓励创作者表达自己的想法。这里的留白、方向和疏密提示，是游戏中的创作建议。</p><h3>《The Flower Book》阅读手记</h3><p>Rachel Siegfried 著，DK 出版：花器形态（书页 10–11）、花材主次与自然朝向（12–21）、樱枝（64–67）、鸢尾（108–111）、菊花（156–159）。可编辑练习重新诠释这些思路。素材库已收录书中全部 60 个花材条目的实拍照片，去除版面和底色，保留原有花面与 34 种成组姿态。此前六款 AI 整理素材继续兼容旧草稿。</p><h3>素材说明</h3><p>「原书实拍」保留书中花材摄影，其他花枝姿态使用 GPT Image 原创生成。书中花器通过图像辅助提取并补全遮挡的器口；其他新增花器为 GPT Image 原创。原有两只花器来自 <a href="https://purepng.com/photo/18638/objects-vase" target="_blank" rel="noopener noreferrer">PurePNG / PNGStock</a>，来源页标注 CC0。保留的展览参考摄影为 Rémi Jouan 的 <a href="https://commons.wikimedia.org/wiki/File:Ikebana_International_Paris_2019_(01).JPG" target="_blank" rel="noopener noreferrer">Ikebana International Paris 2019 (01)</a>，依据 <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener noreferrer">CC BY 4.0</a> 使用。</p><p class="file-note">资料整理：2026 年 9 月。你的作品由你导出和分享；本工房不自动公开上传图片。</p>`;openModal(html,'REFERENCES & MATERIALS')}
function sourcesJapanese(){openModal(`<h2>自然の素材と、いけばなの発想。</h2><p>花間は自由な創作を楽しむためのアトリエです。構図のヒントは流派の決まりではなく、表現のための提案です。</p><h3>いけばなの参考</h3><div class="source-list"><a href="https://chs.ikenobo.jp/about/style.html" target="_blank" rel="noopener noreferrer">池坊 · いけばなの三つの様式 ↗</a><br><a href="https://www.sogetsu.or.jp/e/begin/" target="_blank" rel="noopener noreferrer">草月流 · 自由な表現から学ぶ ↗</a></div><h3>『The Flower Book』と素材</h3><p>Rachel Siegfried著、DK刊。書籍の植物写真60種と、自然な組み合わせ34点を収録しています。書籍の写真は花の表情を保って整理しています。既存の枝葉素材にはヤナギ、ユーカリ、シダがあります。今後も実物の植物素材を少しずつ追加します。</p><h3>画像の出典</h3><p>書籍由来の植物写真とオリジナル素材を区別して表示しています。器の一部はPurePNG / PNGStockのCC0素材、展示写真はRémi Jouan撮影の<a href="https://commons.wikimedia.org/wiki/File:Ikebana_International_Paris_2019_(01).JPG" target="_blank" rel="noopener noreferrer">Ikebana International Paris 2019 (01)</a>をCC BY 4.0で使用しています。</p><p class="file-note">作品は自動公開されません。保存・書き出し・共有はご自身で行えます。</p>`,'参考資料と素材')}
$('#sources-button').onclick=()=>lang==='ja'?sourcesJapanese():sources();
async function loadImage(src){return new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>resolve(img);img.onerror=()=>reject(Error(L('图片暂时无法载入，请稍后重试','The image could not be loaded. Please try again.')));img.src=src})}
const imageTasks=new Map();
function ensureAsset(id){if(images[id])return Promise.resolve(images[id]);if(!imageTasks.has(id)){imageTasks.set(id,loadImage(assetPath(id)).then(img=>{images[id]=img;return img}).catch(err=>{imageTasks.delete(id);throw err}))}return imageTasks.get(id)}
const assetsReady=Promise.allSettled([...new Set([...state.items.map(i=>i.type),state.vessel])].map(ensureAsset));
assetsReady.then(results=>{renderStage();if(results.some(r=>r.status==='rejected'))toast(L('部分花材未载入；已载入的花材仍可使用。','Some materials did not load; the available materials can still be used.'))});
function drawCover(ctx,img,x,y,w,h){const factor=Math.max(w/img.width,h/img.height),iw=img.width*factor,ih=img.height*factor;ctx.drawImage(img,x+(w-iw)/2,y+(h-ih)/2,iw,ih)}
async function draftCanvas(s=state,size=1600){
 await Promise.all([...new Set([...s.items.map(i=>i.type),s.vessel])].map(ensureAsset));
 const c=document.createElement('canvas');c.width=c.height=size;
 paintArrangement(c.getContext('2d'),size,s,assetById,scenes,specimenCanvas,images);return c;
}
async function compositionGuideCanvas(s=state,size=1600){
 await Promise.all([...new Set([...s.items.map(i=>i.type),s.vessel])].map(ensureAsset));const c=document.createElement('canvas');c.width=c.height=size;paintCompositionGuide(c.getContext('2d'),size,s,assetById,scenes,specimenCanvas,images);return c;
}
const canvasBlob=(c,type='image/png',quality=.95)=>new Promise((resolve,reject)=>c.toBlob(b=>b?resolve(b):reject(Error(L('无法导出图片，请重试','The image could not be exported. Please try again.'))),type,quality));
function download(blob,name){const a=document.createElement('a');const url=URL.createObjectURL(blob);a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),30000)}
const fileTitle=s=>(s.title||L('花间作品','Hanama Work','花間作品')).replace(/[\\/:*?"<>|]/g,'-');
const promptFor=(s=state)=>buildPrompt(s,assetById,scenes,{outOfScale:s.items.some(i=>assetById[i.type]&&outOfScale(i,assetById[i.type]))});
function crc32(data){let c=0xffffffff;for(const v of data){c^=v;for(let i=0;i<8;i++)c=(c>>>1)^((c&1)?0xedb88320:0)}return (c^0xffffffff)>>>0}
async function zipFiles(files){const enc=new TextEncoder(),parts=[],central=[];let offset=0;for(const [name,blob] of files){const data=new Uint8Array(await blob.arrayBuffer()),filename=enc.encode(name),crc=crc32(data),local=new Uint8Array(30+filename.length),lv=new DataView(local.buffer);lv.setUint32(0,0x04034b50,true);lv.setUint16(4,20,true);lv.setUint16(6,0x0800,true);lv.setUint32(14,crc,true);lv.setUint32(18,data.length,true);lv.setUint32(22,data.length,true);lv.setUint16(26,filename.length,true);local.set(filename,30);parts.push(local,data);const cd=new Uint8Array(46+filename.length),dv=new DataView(cd.buffer);dv.setUint32(0,0x02014b50,true);dv.setUint16(4,20,true);dv.setUint16(6,20,true);dv.setUint16(8,0x0800,true);dv.setUint32(16,crc,true);dv.setUint32(20,data.length,true);dv.setUint32(24,data.length,true);dv.setUint16(28,filename.length,true);dv.setUint32(42,offset,true);cd.set(filename,46);central.push(cd);offset+=local.length+data.length}const length=central.reduce((n,a)=>n+a.length,0),end=new Uint8Array(22),ev=new DataView(end.buffer);ev.setUint32(0,0x06054b50,true);ev.setUint16(8,files.length,true);ev.setUint16(10,files.length,true);ev.setUint32(12,length,true);ev.setUint32(16,offset,true);return new Blob([...parts,...central,end],{type:'application/zip'})}
async function copyText(text){try{await navigator.clipboard.writeText(text);toast(L('已复制','Copied'))}catch{const ta=document.createElement('textarea');ta.value=text;$('#modal').open?$('#modal-content').append(ta):document.body.append(ta);ta.select();const ok=document.execCommand('copy');ta.remove();toast(ok?L('已复制','Copied'):L('请长按或选中文字后手动复制','Select the text and copy it manually'))}}
/** Render each pass separately so a cut piece remains its own editable Compositor layer. */
async function layeredCompositorZip(snapshot,size=1600){
 await Promise.all([...new Set([...snapshot.items.map(i=>i.type),snapshot.vessel])].map(ensureAsset));
 const plan=compositorLayerPlan(snapshot,item=>assetName(assetById[item.type]));
 const root=`${fileTitle(snapshot).slice(0,70)||'Hanama'}.comp`,files=[],layers=[];
 for(let index=0;index<plan.length;index++){
  const pass=plan[index],id=crypto.randomUUID().toUpperCase(),canvas=document.createElement('canvas');canvas.width=canvas.height=size;
  try{
   const ctx=canvas.getContext('2d');if(!ctx)throw Error(L('画布内存不足，请稍后重试。','Not enough canvas memory. Please try again.','キャンバスのメモリが不足しています。再度お試しください。'));
   if(pass.kind==='background')paintSceneBackground(ctx,size,snapshot,scenes);
   if(pass.kind==='botanical')paintBotanicalLayer(ctx,size,snapshot,pass.item,assetById,specimenCanvas);
   if(pass.kind==='vessel')paintVesselLayer(ctx,size,snapshot,assetById,images);
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
async function generatePackageV3(){
 if(!state.items.length){toast(L('先添入一枝花，再让灵感开花。','Add at least one material before creating a generation pack.'));return}
 const snapshot=clone(state),materialCount=new Set(snapshot.items.map(i=>i.originId||i.id)).size,promptSnapshot={...snapshot,generationVariation:Date.now()},promptText=promptFor(promptSnapshot),modeName=({zh:{natural:'小幅自然重整',creative:'适度花艺润色',faithful:'最小修正'},en:{natural:'Gentle natural refinement',creative:'Moderate florist refinement',faithful:'Minimal correction'},ja:{natural:'自然に少し整える',creative:'ほどよく花を整える',faithful:'最小限の修正'}})[lang][snapshot.generation||'natural'];
 const modalHtml=lang==='en'?`<h2>Bring your draft into real life.</h2><p>Keep your flowers, main composition and overall light. Allow small changes to curves, facing, depth and insertion to make a physically believable arrangement.</p><div class="export-preview export-preview-v3"><div class="reference-pair"><figure><img id="draft-preview" alt="Design, materials and overall lighting reference"><figcaption>Design reference</figcaption></figure><figure><img id="guide-preview" alt="Broad silhouette and depth reference"><figcaption>Optional silhouette reference</figcaption></figure></div><div><strong>${esc(snapshot.title||'Untitled Arrangement')}</strong>${snapshot.subtitle?`<p class="export-subtitle">${esc(snapshot.subtitle)}</p>`:''}<p>${materialCount} materials · ${esc(assetName(assetById[snapshot.vessel]))}<br>Mood: ${esc(moodName(snapshot.mood))}<br>Refinement: ${esc(modeName)}</p><p class="file-note">Keep every flower; refine its position and facing gently.<br>Physical realism takes priority over tracing the draft.</p></div></div><label for="prompt-text" class="slider-label">Generation prompt</label><textarea id="prompt-text" class="prompt-area" readonly></textarea><div class="modal-actions"><button class="button accent" id="download-package" disabled><span data-icon="download"></span>Download Image Pack .zip</button><button class="button outline" id="copy-prompt" disabled><span data-icon="copy"></span>Copy Prompt</button><button class="button outline" id="import-result" disabled><span data-icon="upload"></span>Import Result</button></div><p class="file-note">Upload draft.png and paste the prompt. Add composition-guide.png if the intended layers are unclear; its contours are approximate.</p>`:`<h2>让草稿，成为真实的插花。</h2><p>保留用花、主要构图和整体光感，允许小幅整理枝条弧度、花面朝向、前后空间与瓶口连接，让作品符合真实物理关系。</p><div class="export-preview export-preview-v3"><div class="reference-pair"><figure><img id="draft-preview" alt="花材、设计与整体光感参考"><figcaption>主要设计参考</figcaption></figure><figure><img id="guide-preview" alt="大致轮廓与前后关系参考"><figcaption>可选轮廓参考</figcaption></figure></div><div><strong>${esc(snapshot.title||L('未命名作品','Untitled Arrangement'))}</strong>${snapshot.subtitle?`<p class="export-subtitle">${esc(snapshot.subtitle)}</p>`:''}<p>${materialCount} 枝花材 · ${esc(assetName(assetById[snapshot.vessel]))}<br>意境：${esc(moodName(snapshot.mood))}<br>整理程度：${esc(modeName)}</p><p class="file-note">保留每一朵花，允许小幅移动与转向。<br>优先修正物理关系，避免照搬拼贴痕迹。</p></div></div><label for="prompt-text" class="slider-label">为你的作品准备的 Prompt</label><textarea id="prompt-text" class="prompt-area" readonly></textarea><div class="modal-actions"><button class="button accent" id="download-package" disabled><span data-icon="download"></span>下载生图包 .zip</button><button class="button outline" id="copy-prompt" disabled><span data-icon="copy"></span>复制 Prompt</button><button class="button outline" id="import-result" disabled><span data-icon="upload"></span>导入生成作品</button></div><p class="file-note">上传 draft.png 并粘贴 Prompt；前后关系不清楚时，可附上 composition-guide.png 辅助说明，无需照描轮廓。</p>`;
 openModal(modalHtml,'DRAFT → GPT IMAGE → ARTWORK');
 if(lang==='ja'){const labels={'让草稿，成为真实的插花。':'下書きを、自然ないけばなに。','保留用花、主要构图和整体光感，允许小幅整理枝条弧度、花面朝向、前后空间与瓶口连接，让作品符合真实物理关系。':'花材、構図、全体の光を保ち、枝の曲線や花の向き、奥行き、器との接続を小さく整えて、自然な作品に仕上げます。','主要设计参考':'主なデザインの参考','可选轮廓参考':'任意の輪郭参考','枝花材':'本の花材','意境：':'イメージ：','整理程度：':'仕上げ：','保留每一朵花，允许小幅移动与转向。':'花を一輪も減らさず、位置や向きを少し整えます。','优先修正物理关系，避免照搬拼贴痕迹。':'切り貼りの形をなぞらず、実際の花材として自然な関係に整えます。','为你的作品准备的 Prompt':'作品のためのプロンプト','下载生图包 .zip':'生成用パックをダウンロード .zip','复制 Prompt':'プロンプトをコピー','导入生成作品':'生成作品を読み込む','上传 draft.png 并粘贴 Prompt；前后关系不清楚时，可附上 composition-guide.png 辅助说明，无需照描轮廓。':'draft.pngをアップロードし、prompt.txtを貼り付けます。前後関係が分かりにくい場合はcomposition-guide.pngを参考として添えます。'};let html=$('#modal-content').innerHTML;for(const [from,to] of Object.entries(labels))html=html.replaceAll(from,to);$('#modal-content').innerHTML=html;icons($('#modal-content'));}
 const compButton=document.createElement('button');compButton.type='button';compButton.id='download-compositor';compButton.className='button outline';compButton.disabled=true;compButton.innerHTML=`<span data-icon="download"></span>${L('下载分层工程 .comp','Download layered .comp project','レイヤー付き .comp を保存')}`;$('.modal-actions',$('#modal-content')).append(compButton);icons(compButton);
 const compHint=document.createElement('p');compHint.className='file-note';compHint.append(document.createTextNode(L('解压后可在 macOS 的 Compositor 中逐枝编辑。格式来自 ','Unzip to edit each stem in Compositor on macOS. Format by ','展開すると macOS の Compositor で一枝ずつ編集できます。形式の提供元：')));const compLink=document.createElement('a');compLink.href='https://github.com/robbietilton/Compositor';compLink.target='_blank';compLink.rel='noopener noreferrer';compLink.textContent='Compositor ↗';compHint.append(compLink);$('.modal-actions',$('#modal-content')).insertAdjacentElement('afterend',compHint);
 $('#prompt-text').value=promptText;const [draft,guide]=await Promise.all([draftCanvas(snapshot),compositionGuideCanvas(snapshot)]);$('#draft-preview').src=draft.toDataURL('image/jpeg',.85);$('#guide-preview').src=guide.toDataURL('image/jpeg',.88);['download-package','copy-prompt','import-result'].forEach(id=>$('#'+id).disabled=false);
 compButton.disabled=false;compButton.onclick=async()=>{compButton.disabled=true;try{download(await layeredCompositorZip(snapshot),fileTitle(snapshot)+'-Compositor.zip');toast(L('分层工程已下载，解压后打开 .comp 文件夹。','Layered project downloaded. Unzip and open the .comp folder.','レイヤー付きプロジェクトを保存しました。展開して .comp フォルダを開いてください。'))}catch(err){toast(err.message)}finally{compButton.disabled=false}};
 $('#copy-prompt').onclick=()=>copyText(promptText);
 $('#download-package').onclick=async e=>{const b=e.currentTarget;b.disabled=true;try{const readme="花间 · 自然重整创作包 / HANAMA · NATURAL REFINEMENT PACK\n\n中文\n1. 上传 draft.png 并粘贴 prompt.txt。前后关系不清楚时，可附上 composition-guide.png；它仅作轮廓参考。\n2. 保留用花与花朵数量、主要构图、花器及整体光感。草稿是设计意图，不是必须照描的物理实物。\n3. 允许小幅整理花面、枝条弧度、前后空间和瓶口连接；局部阴影与反光随真实结构修正。\n4. composition.json 可以恢复原始可编辑草稿；生成不会自动改动画布。\n\nENGLISH\n1. Upload draft.png and paste prompt.txt. Optionally add composition-guide.png to clarify intended depth; it is a rough silhouette aid.\n2. Keep the materials and flower count, main composition, vessel and overall light. Treat the draft as design intent rather than exact physical geometry.\n3. Make small corrections to flower facing, stem curves, depth and insertion. Recalculate local shadows and reflections for coherent physical form.\n4. composition.json restores the original editable draft; generation does not automatically modify the canvas.\n\nThe website does not call a generation API and the pack contains no API key.";const zip=await zipFiles([['draft.png',await canvasBlob(draft)],['composition-guide.png',await canvasBlob(guide)],['prompt.txt',new Blob([promptText],{type:'text/plain;charset=utf-8'})],['composition.json',new Blob([JSON.stringify(snapshot,null,2)],{type:'application/json'})],['readme.txt',new Blob([readme],{type:'text/plain;charset=utf-8'})]]);download(zip,fileTitle(snapshot)+'-'+L('自然重整创作包','natural-refinement-pack')+'.zip');toast(L('创作包已下载，上传草稿图并粘贴 Prompt 即可。','Pack downloaded. Upload the draft and paste the prompt.'))}catch(err){toast(err.message)}finally{b.disabled=false}};
 $('#import-result').onclick=()=>{importArtFor=snapshot;$('#art-upload').click()};
}
$('#generate-button').onclick=()=>generatePackageV3().catch(e=>toast(e.message));$('#export-draft').onclick=async()=>{try{download(await canvasBlob(await draftCanvas()),fileTitle(state)+L('-草稿.png','-draft.png'));toast(L('草稿图已下载','Draft image downloaded'))}catch(e){toast(e.message)}};
const dbPromise=new Promise((resolve,reject)=>{const req=indexedDB.open('hanama-artworks',1);req.onupgradeneeded=()=>req.result.createObjectStore('works',{keyPath:'id'});req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error)});dbPromise.catch(()=>{});
async function dbAction(mode,fn){const db=await dbPromise;return new Promise((resolve,reject)=>{const tx=db.transaction('works',mode);const req=fn(tx.objectStore('works'));let result;req.onsuccess=()=>result=req.result;tx.oncomplete=()=>resolve(result);tx.onerror=()=>reject(Error(L('本机存储空间不足或不可用，请导出文件保存。','Local storage is full or unavailable. Export a file to keep your work.')));tx.onabort=()=>reject(Error(L('保存未完成，请导出文件备份。','Saving did not finish. Export a backup file.')))})}
const listWorks=()=>dbAction('readonly',store=>store.getAll());
async function refreshCount(){try{$('#gallery-count').textContent=(await listWorks()).length}catch{}}
async function saveDraft(s=state,{notify=true}={}){const snapshot=clone(s),preview=await canvasBlob(await draftCanvas(snapshot,600),'image/jpeg',.86);const prev=await dbAction('readonly',store=>store.get(snapshot.id));await dbAction('readwrite',store=>store.put({id:snapshot.id,state:snapshot,title:snapshot.title||L('未命名作品','Untitled Arrangement'),updated:Date.now(),preview,art:prev?.art||null}));await refreshCount();if(notify)toast(L('草稿已收进「我的作品」','Draft saved to My Works'));return snapshot.id}
$('#save-button').onclick=async e=>{e.currentTarget.disabled=true;try{await saveDraft()}catch(err){toast(err.message)}finally{$('#save-button').disabled=false}};
const hasMeaningfulCanvas=s=>s.items.length>0||String(s.intention||'').trim()||String(s.subtitle||'').trim()||!['',...untitledTitles].includes(String(s.title||'').trim())||s.vessel!=='round'||s.scene!=='paper'||s.mood!=='静寂'||s.generation!=='natural';
async function activateCanvas(next,{saveCurrent=true,message=''}={}){const activeView=$('.view:not([hidden])');if(activeView)activeView.inert=true;try{const candidate=validate(next);await Promise.all([...new Set([...candidate.items.map(i=>i.type),candidate.vessel])].map(ensureAsset));if(saveCurrent&&hasMeaningfulCanvas(state))await saveDraft(state,{notify:false});state=candidate;selected=state.items.at(-1)?.id||null;undoStack=[];redoStack=[];cutSession=null;spriteCache.clear();closeLayerMenu();$('#guide').hidden=true;$('#guide-button').setAttribute('aria-pressed','false');setEditMode('move');renderAll();setView('studio');if(message)toast(message)}finally{if(activeView)activeView.inert=false}}
$('#new-canvas-button').onclick=async e=>{const button=e.currentTarget,hadWork=!!hasMeaningfulCanvas(state),next=initial();next.title=L('未命名作品','Untitled Arrangement');next.subtitle='';next.intention='';next.items=[];button.disabled=true;try{await activateCanvas(next,{message:hadWork?L('原草稿已保存，新画布已打开。','The previous draft was saved and a new canvas is ready.'):L('新画布已打开。','A new canvas is ready.')})}catch(err){toast(err.message)}finally{button.disabled=false}};
$('#language-select').onchange=e=>{if(!['zh','en','ja'].includes(e.target.value))return;lang=e.target.value;try{localStorage.setItem(LANGUAGE_STORE,lang)}catch{}relocalizePresetFields(state,lang);renderAll();const active=$('.view:not([hidden])')?.id;if(active==='inspiration-view')renderInspiration();if(active==='gallery-view')renderGallery().catch(err=>toast(err.message))};
function setView(view){$$('.view').forEach(el=>el.hidden=el.id!==`${view}-view`);$$('[data-view]').forEach(b=>b.classList.toggle('active',b.dataset.view===view));if(view==='gallery')renderGallery().catch(err=>toast(err.message));if(view==='inspiration')renderInspiration();window.scrollTo({top:0,behavior:'instant'})}
$$('[data-view]').forEach(b=>b.onclick=()=>setView(b.dataset.view));
function studyState(study){
 const vessel=assetById[study.vessel],insertion=vesselGeometry(vessel).insertion;
 const items=study.items.map(({type,to=[0,20],s=1,flip=false,front=false,base})=>{
  const a=assetById[type],item=makeItem(type,{h:Math.round(a.height*clamp(s,.8,1.25)*10)/10,flip,aboveVessel:front});
  const stemBase=mouthBase(vessel,insertion[0]+(base??to[0]*.1),.6);
  return Object.assign(item,reach(item,a,stemBase,[insertion[0]+to[0],insertion[1]-to[1]]));
 });
 return {...initial(),title:study.title[localeIndex(lang)],intention:'',vessel:study.vessel,scene:study.scene,mood:study.mood,items};
}
/** Stage-percent corners of a specimen as drawn, used to frame previews around the arrangement. */
function spriteCorners(item,sprite){
 const a=assetById[item.type],g=dimensions(item,a),crop=sprite.crop,fullH=item.h*g.height,fullW=item.h*g.ratio;
 const left=-fullW*g.anchor+fullW*crop.x/crop.fullWidth,top=fullH*(crop.y/crop.fullHeight-(item.cropAnchorY??1)),w=fullW*crop.width/crop.fullWidth,h=fullH*crop.height/crop.fullHeight;
 const r=item.angle*Math.PI/180,f=item.flip?-1:1;
 return [[left,top],[left+w,top],[left,top+h],[left+w,top+h]].map(([x,y])=>[item.x+x*f*Math.cos(r)-y*Math.sin(r),item.y+x*f*Math.sin(r)+y*Math.cos(r)]);
}
let previewQueue=Promise.resolve();
function studyPreview(study){
 if(!studyPreviews.has(study.id)){
  const task=previewQueue.then(()=>renderStudyPreview(study));previewQueue=task.catch(()=>{});
  studyPreviews.set(study.id,task.catch(err=>{studyPreviews.delete(study.id);throw err}));
 }
 return studyPreviews.get(study.id);
}
async function renderStudyPreview(study,size=720){
 const s=studyState(study);await Promise.all([...new Set([...s.items.map(i=>i.type),s.vessel])].map(ensureAsset));
 const sprites=new Map(),getSprite=item=>{if(!sprites.has(item.id))sprites.set(item.id,composeSpecimen(images[item.type],item,assetById[item.type]));return sprites.get(item.id)};
 const g=vesselGeometry(assetById[s.vessel]);let [x0,y0,x1,y1]=[g.left,g.top,g.left+g.width,88];
 for(const item of s.items)for(const [x,y] of spriteCorners(item,getSprite(item))){x0=Math.min(x0,x);y0=Math.min(y0,y);x1=Math.max(x1,x);y1=Math.max(y1,y)}
 const side=clamp(Math.max(x1-x0,y1-y0)*1.16+4,62,100),cx=(x0+x1)/2,bottom=clamp(Math.max(y1+side*.06,93),side,100);
 const sx=clamp(cx-side/2,0,100-side),sy=bottom-side,full=Math.round(size*100/side);
 const c=document.createElement('canvas');c.width=c.height=full;paintArrangement(c.getContext('2d'),full,s,assetById,scenes,getSprite,images);
 const out=document.createElement('canvas');out.width=out.height=size;out.getContext('2d').drawImage(c,sx/100*full,sy/100*full,side/100*full,side/100*full,0,0,size,size);
 return canvasBlob(out,'image/webp',.9).then(blob=>URL.createObjectURL(blob));
}
function renderInspiration(){
 const index=localeIndex(lang),root=$('#inspiration-view');
 const schoolNames={ikenobo:['池坊','Ikenobo','池坊'],ohara:['小原流','Ohara','小原流'],sogetsu:['草月流','Sogetsu','草月流'],free:['自由花','Free style','自由花']};
 const schoolNotes={ikenobo:['池坊取意','Inspired by Ikenobo','池坊の発想'],ohara:['小原流取意','Inspired by Ohara','小原流の発想'],sogetsu:['草月流取意','Inspired by Sogetsu','草月流の発想'],free:['西式花园取意','Garden-style free arrangement','庭の花の自由花']};
 const seasonNames={spring:['春','Spring','春'],summer:['夏','Summer','夏'],autumn:['秋','Autumn','秋'],winter:['冬','Winter','冬']};
 const visible=studies.filter(study=>(studyFilter==='all'||study.school===studyFilter)&&(seasonFilter==='all'||study.season===seasonFilter));
 const filterLabel=key=>key==='all'?L('全部流派','All schools'):schoolNames[key][index];
 const seasonLabel=key=>key==='all'?L('四季','All seasons'):seasonNames[key][index];
 const count=studies.length;
 const sourceNote=[
  `${count} 组可编辑草稿借鉴《The Flower Book》的花材与器形，并参考三所流派的公开介绍。所有花材按真实大小比例摆放；派系标签代表创作方向，不是正式流派范式。`,
  `${count} editable studies draw on The Flower Book and public introductions from three ikebana schools. Every material is placed at true-to-life scale. School labels show creative influences, not formal school arrangements.`,
  `編集できる${count}の下書きは『The Flower Book』の花材・器から着想し、三つの流派の公式紹介を参考にしています。花材はすべて実寸比で配置しています。流派名は発想の手がかりで、正式な型を示すものではありません。`
 ][index];
 root.innerHTML=`<div class="page-heading"><div><p class="eyebrow">${['花之书 · 灵感手帖','THE FLOWER BOOK · FIELD NOTES','花の本 · 創作ノート'][index]}</p><h1>${L('先看一枝，再想一器。','A stem first. Then a vessel.')}</h1><p>${lang==='ja'?`花材、器、余白から考える${count}の組み合わせ。花はすべて実寸比で、自由に描き直せます。`:L(`从花材、器形与留白出发。${count} 组搭配都按真实比例摆放，可以亲手改写。`,`${count} editable studies in materials, vessels and space, all at true-to-life scale.`)}</p></div><button class="text-button" id="inspiration-sources">${L('阅读与素材来源 ↗','Reading & sources ↗')}</button></div><div class="study-filter-bar"><div class="study-filters" role="group" aria-label="${esc(L('派系灵感','School inspirations'))}">${['all','ikenobo','ohara','sogetsu','free'].map(key=>`<button type="button" data-study-school="${key}" aria-pressed="${studyFilter===key}">${esc(filterLabel(key))}</button>`).join('')}</div><div class="study-filters" role="group" aria-label="${esc(L('季节','Seasons'))}">${['all',...studySeasons].map(key=>`<button type="button" data-study-season="${key}" aria-pressed="${seasonFilter===key}">${esc(seasonLabel(key))}</button>`).join('')}</div><span class="study-total">${lang==='ja'?`${visible.length} 件`:L(`${visible.length} 组`,`${visible.length} studies`)}</span></div><div class="study-grid">${visible.map(study=>`<article class="study-card"><div class="study-image"><img id="study-preview-${study.id}" alt="${esc(study.title[index])}" hidden><span class="study-number">${String(studies.indexOf(study)+1).padStart(2,'0')}</span><span class="study-season">${esc(seasonNames[study.season][index])}</span><span class="study-loading">${L('正在铺开花枝…','Preparing the stems…')}</span></div><div class="study-content"><span class="study-school">${esc(schoolNotes[study.school][index])}</span><p class="eyebrow">${esc(study.caption[index])}</p><h2>${esc(study.title[index])}</h2><p>${esc(study.note[index])}</p><button class="button outline" data-study="${study.id}">${L('以此开始','Start with this')} <span>↗</span></button></div></article>`).join('')}</div><p class="study-source">${esc(sourceNote)} <a href="https://www.ikenobo.jp/english/about/style.html" target="_blank" rel="noopener noreferrer">${esc(schoolNames.ikenobo[index])} ↗</a> · <a href="https://ohararyu.or.jp/beginners/" target="_blank" rel="noopener noreferrer">${esc(schoolNames.ohara[index])} ↗</a> · <a href="https://www.sogetsu.or.jp/e/about/" target="_blank" rel="noopener noreferrer">${esc(schoolNames.sogetsu[index])} ↗</a></p>`;
 $('#inspiration-sources').onclick=()=>lang==='ja'?sourcesJapanese():sources();
 $$('[data-study-school]',root).forEach(button=>button.onclick=()=>{studyFilter=button.dataset.studySchool;renderInspiration()});
 $$('[data-study-season]',root).forEach(button=>button.onclick=()=>{seasonFilter=button.dataset.studySeason;renderInspiration()});
 const show=study=>{
  const image=$(`#study-preview-${study.id}`);if(!image)return;const loading=image.parentElement.querySelector('.study-loading');
  studyPreview(study).then(url=>{if(!image.isConnected)return;image.src=url;image.hidden=false;loading?.remove()}).catch(()=>{if(loading?.isConnected)loading.textContent=L('预览暂时无法载入，可点击重试。','Preview unavailable. Select the study to retry.')});
 };
 studyObserver?.disconnect();
 if('IntersectionObserver' in window){studyObserver=new IntersectionObserver(entries=>{for(const entry of entries)if(entry.isIntersecting){studyObserver.unobserve(entry.target);show(studies.find(study=>study.id===entry.target.dataset.studyCard))}},{rootMargin:'400px 0px'});$$('.study-card',root).forEach((card,k)=>{card.dataset.studyCard=visible[k].id;studyObserver.observe(card)})}
 else visible.forEach(show);
 $$('[data-study]',root).forEach(button=>button.onclick=async()=>{button.disabled=true;try{await activateCanvas(studyState(studies.find(study=>study.id===button.dataset.study)),{message:L('搭配已打开，原草稿已保存在「我的作品」。','Study opened. Your previous draft is in My Works.')})}catch(err){toast(err.message)}finally{button.disabled=false}});
}
async function renderGallery(){
 const works=(await listWorks()).sort((a,b)=>b.updated-a.updated);galleryUrls.forEach(URL.revokeObjectURL);galleryUrls=[];
 const cards=works.map(w=>{const url=URL.createObjectURL(w.art||w.preview);galleryUrls.push(url);const status=w.art?L('生成成品','Generated artwork'):L('插花草稿','Ikebana draft'),date=new Date(w.updated).toLocaleDateString(lang==='en'?'en-US':lang==='ja'?'ja-JP':'zh-CN');return `<article class="art-card"><img src="${url}" alt="${esc(w.title)}" loading="lazy"><div class="art-card-content"><h2>${esc(w.title)}</h2>${w.state?.subtitle?`<p class="art-subtitle">${esc(w.state.subtitle)}</p>`:''}<p>${status} · ${date}</p><div class="art-card-actions"><button data-work-edit="${esc(w.id)}">${L('继续创作','Continue')}</button><button data-work-share="${esc(w.id)}">${L('分享作品 ↗','Share ↗')}</button><button data-work-delete="${esc(w.id)}" aria-label="${esc(L(`删除${w.title}`,`Delete ${w.title}`))}">${L('删除','Delete')}</button></div></div></article>`}).join('');
 $('#gallery-view').innerHTML=`<div class="page-heading"><div><p class="eyebrow">YOUR PERSONAL COLLECTION</p><h1>${L('一花一记','A Record of Each Flower')}</h1><p>${L('这里珍藏你的草稿与成品，仅保存在当前浏览器。','Your drafts and artworks are stored only in this browser.')}</p></div><button class="button outline" id="gallery-import"><span data-icon="upload"></span>${L('导入生成作品','Import Generated Artwork')}</button></div>${works.length?`<div class="gallery-grid">${cards}</div>`:`<div class="empty-gallery"><h2>${L('留住你的第一枝。','Keep your first stem.')}</h2><p>${L('在工房保存草稿，或把生成的成品导入这里。','Save a draft in the atelier or import a generated artwork here.')}</p><button class="button dark" id="back-studio">${L('回到插花台','Back to Atelier')}</button></div>`}`;
 icons($('#gallery-view'));$('#gallery-import').onclick=()=>{importArtFor=clone(state);$('#art-upload').click()};$('#back-studio')?.addEventListener('click',()=>setView('studio'));
 $$('[data-work-edit]').forEach(b=>b.onclick=async()=>{const w=works.find(w=>w.id===b.dataset.workEdit),next=w.id===state.id?clone(state):w.state;b.disabled=true;try{await activateCanvas(next)}catch(err){toast(err.message)}finally{b.disabled=false}});
 $$('[data-work-share]').forEach(b=>b.onclick=()=>shareWork(works.find(w=>w.id===b.dataset.workShare)).catch(err=>toast(err.message)));
 $$('[data-work-delete]').forEach(b=>b.onclick=()=>{const w=works.find(w=>w.id===b.dataset.workDelete);openModal(`<h2>${esc(L(`移除「${w.title}」？`,`Remove “${w.title}”?`))}</h2><p>${L('这会删除本机作品集中的草稿和成品，已下载的图片仍然保留。','This deletes the draft and artwork from this browser. Downloaded files remain.')}</p><div class="modal-actions"><button class="button outline" id="cancel-delete">${L('保留作品','Keep Work')}</button><button class="button accent" id="confirm-delete">${L('删除作品','Delete Work')}</button></div>`);$('#cancel-delete').onclick=()=>$('#modal').close();$('#confirm-delete').onclick=async()=>{try{await dbAction('readwrite',store=>store.delete(w.id));$('#modal').close();await renderGallery();await refreshCount();toast(L('已移除作品','Work removed'))}catch(e){toast(e.message)}}})
}
async function artPoster(w){
 const c=document.createElement('canvas');c.width=1600;c.height=1870;const ctx=c.getContext('2d');ctx.fillStyle='#f5f2e8';ctx.fillRect(0,0,c.width,c.height);
 const source=w.art||await canvasBlob(await draftCanvas(w.state,1600)),url=URL.createObjectURL(source);
 try{const img=await loadImage(url),fit=Math.min(1480/img.width,1480/img.height),iw=img.width*fit,ih=img.height*fit;ctx.drawImage(img,60+(1480-iw)/2,60+(1480-ih)/2,iw,ih)}finally{URL.revokeObjectURL(url)}
 const serif=lang==='ja'?'"Hiragino Mincho ProN", "Yu Mincho", "Noto Serif CJK JP", serif':lang==='en'?'Georgia, serif':'"Noto Serif SC", "Songti SC", serif';
 ctx.fillStyle='#354034';ctx.font=`48px ${serif}`;const title=w.title||L('未命名作品','Untitled Arrangement');let label=title;while(ctx.measureText(label).width>1300)label=label.slice(0,-1);if(label!==title)label+='…';ctx.fillText(label,85,1640);
 const subtitle=String(w.state?.subtitle||'').trim();if(subtitle){ctx.fillStyle='#5e695e';ctx.font=`27px ${serif}`;let line=subtitle;while(ctx.measureText(line).width>1300)line=line.slice(0,-1);if(line!==subtitle)line+='…';ctx.fillText(line,87,1694)}
 ctx.fillStyle='#7a8074';ctx.font='22px sans-serif';ctx.fillText(`${moodName(w.state.mood)}  /  ${w.art?L('由手作草稿延展的生成作品','Generated from a hand-arranged draft'):L('亲手设计的插花草稿','Hand-designed ikebana draft')}`,87,subtitle?1738:1695);
 ctx.fillStyle='#a5533e';ctx.font=`38px ${serif}`;const brand=lang==='en'?'HANAMA':lang==='ja'?'花間':'花间';ctx.fillText(brand,85,1790);ctx.fillStyle='#8e9286';ctx.font='16px sans-serif';ctx.fillText('HANAMA · A MOMENT WITH FLOWERS',lang==='en'?265:200,1787);return canvasBlob(c)
}
async function shareWork(w){
 const html=lang==='en'?`<h2>Let this arrangement meet someone.</h2><p>The share card keeps the artwork, title and subtitle. The draft file lets a friend continue the composition.</p><div class="modal-actions"><button class="button accent" id="share-system" disabled><span data-icon="share"></span>Share Image</button><button class="button outline" id="share-download" disabled><span data-icon="download"></span>Download Share Card</button><button class="button outline" id="share-original">Download ${w.art?'Saved Artwork':'Draft Image'}</button></div><h3>Share an editable draft</h3><p class="file-note">The link carries the material layout and intention, not the generated image. The recipient needs access to this atelier.</p><input class="share-field" id="share-link" readonly aria-label="Draft share link"><div class="modal-actions"><button class="button outline" id="copy-link">Copy Draft Link</button><button class="button outline" id="share-json">Download Draft File</button></div>`:`<h2>让这一枝，遇见别人。</h2><p>分享卡保留作品与题名、副题。草稿文件还能让朋友继续你的创作。</p><div class="modal-actions"><button class="button accent" id="share-system" disabled><span data-icon="share"></span>分享图片</button><button class="button outline" id="share-download" disabled><span data-icon="download"></span>下载分享卡</button><button class="button outline" id="share-original">下载${w.art?'保存的成品':'草稿图'}</button></div><h3>也可以分享可编辑的草稿</h3><p class="file-note">链接仅携带花材布局与意境，不包含成品图片。接收者需要有权访问此工房。</p><input class="share-field" id="share-link" readonly aria-label="草稿分享链接"><div class="modal-actions"><button class="button outline" id="copy-link">复制草稿链接</button><button class="button outline" id="share-json">下载草稿文件</button></div>`;
 openModal(html,lang==='ja'?'作品を共有':'SHARE YOUR LITTLE WORLD');if(lang==='ja'){translateTextNodes($('#modal-content'),{'让这一枝，遇见别人。':'この花を、誰かへ。','分享卡保留作品与题名、副题。草稿文件还能让朋友继续你的创作。':'共有カードには作品と題名、副題が残ります。下書きファイルを渡せば、相手も続きを編集できます。','分享图片':'画像を共有','下载分享卡':'共有カードをダウンロード','下载保存的成品':'完成作品をダウンロード','下载草稿图':'下書き画像をダウンロード','保存的成品':'保存した完成作品','草稿图':'下書き画像','也可以分享可编辑的草稿':'編集できる下書きも共有できます','链接仅携带花材布局与意境，不包含成品图片。接收者需要有权访问此工房。':'リンクには花材の配置とイメージが含まれ、完成画像は含まれません。受け取る方もこのアトリエを利用できる必要があります。','复制草稿链接':'下書きリンクをコピー','下载草稿文件':'下書きファイルをダウンロード'});$('#share-link').setAttribute('aria-label','下書き共有リンク')}const shared=validate(w.state);shared.id='shared';const hash=await encodeShare(shared);const linkOK=hash.length<=30000;$('#share-link').value=linkOK?location.origin+location.pathname+hash:L('剪枝细节较多，请下载草稿文件分享。','This draft has extensive pruning details; share the downloaded draft file instead.');$('#copy-link').disabled=!linkOK;$('#copy-link').onclick=()=>copyText($('#share-link').value);$('#share-json').onclick=()=>download(new Blob([JSON.stringify(w.state,null,2)],{type:'application/json'}),fileTitle(w.state)+'.json');
 $('#share-original').onclick=async()=>{try{const source=w.art||await canvasBlob(await draftCanvas(w.state,1600));download(source,fileTitle(w.state)+(w.art?L('-成品','-artwork'):L('-草稿','-draft'))+'.'+(source.type==='image/png'?'png':'jpg'))}catch(e){toast(e.message)}};
 const poster=await artPoster(w);$('#share-system').disabled=false;$('#share-download').disabled=false;$('#share-download').onclick=()=>download(poster,fileTitle(w.state)+L('-分享卡.png','-share-card.png'));$('#share-system').onclick=async()=>{const file=new File([poster],fileTitle(w.state)+'.png',{type:'image/png'});try{if(navigator.canShare?.({files:[file]})){await navigator.share({files:[file],title:w.title})}else{download(poster,file.name);toast(L('分享卡已下载，可以发送给朋友。','Share card downloaded and ready to send.'))}}catch(err){if(err.name!=='AbortError')toast(L('设备分享不可用，请下载分享卡。','Device sharing is unavailable. Download the share card instead.'))}}
}
$('#art-upload').addEventListener('change',async e=>{const file=e.target.files[0];e.target.value='';if(!file)return;if(!['image/png','image/jpeg','image/webp'].includes(file.type)||file.size>15*1024*1024)return toast(L('请选择不超过 15 MB 的 PNG、JPG 或 WebP 图片。','Choose a PNG, JPG, or WebP image no larger than 15 MB.'));const s=clone(importArtFor||state);try{const url=URL.createObjectURL(file);let img;try{img=await loadImage(url)}finally{URL.revokeObjectURL(url)}const c=document.createElement('canvas'),scale=Math.min(1,2000/Math.max(img.width,img.height));c.width=Math.round(img.width*scale);c.height=Math.round(img.height*scale);c.getContext('2d').drawImage(img,0,0,c.width,c.height);const art=await canvasBlob(c,'image/jpeg',.93),preview=await canvasBlob(await draftCanvas(s,600),'image/jpeg',.85);const artworkId=uid();await dbAction('readwrite',store=>store.put({id:artworkId,state:{...s,id:artworkId},title:s.title||file.name.replace(/\.[^.]+$/,''),updated:Date.now(),preview,art}));$('#modal').close();await refreshCount();setView('gallery');toast(L('成品已收藏，可以分享了。','Artwork saved to My Works and ready to share.'))}catch(err){toast(err.message)}finally{importArtFor=null}});
$('#draft-upload').addEventListener('change',async e=>{const file=e.target.files[0];e.target.value='';if(!file)return;if(file.size>500000)return toast(L('草稿文件过大，请选择花间导出的 JSON 文件。','The draft file is too large. Choose a JSON file exported by Hanama.'));let next;try{next=validate(JSON.parse(await file.text()))}catch{return toast(L('文件无法读取，请选择花间导出的 composition.json。','The file could not be read. Choose a composition.json exported by Hanama.'))}next.id=uid();try{await activateCanvas(next,{message:L('草稿已恢复，可以继续创作。','Draft restored and ready to edit.')});$('#modal').close()}catch(err){toast(err.message)}});
icons();applyLanguage();renderMaterials();renderAll();refreshCount();if(sharedLoaded)setTimeout(()=>toast(L('已打开分享草稿，你可以继续创作。','Shared draft opened. You can continue editing.')),700);
// A shared draft may arrive as a same-page hash navigation in an already-open studio.
window.addEventListener('hashchange',async()=>{
 if(!location.hash.startsWith('#draft=')&&!location.hash.startsWith('#draft2='))return;
 let imported;try{imported=await decodeShare(location.hash)}catch{return toast(L('草稿链接无法打开，请用导出的 JSON 文件恢复。','The draft link could not be opened. Restore it from an exported JSON file.'))}imported.id=uid();history.replaceState(null,'',location.pathname+location.search);try{await activateCanvas(imported,{message:L('已打开分享草稿，剪枝与花色也一并保留。','Shared draft opened with pruning and color choices preserved.')})}catch(err){toast(err.message)}
});
