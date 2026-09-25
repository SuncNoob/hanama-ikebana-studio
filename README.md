# 花间 · HANAMA

独立的日式插花创作工房。静态网页，无运行时依赖；不会改动同目录下的 Java 游戏。

## 使用

在本目录执行 `python3 -m http.server 4173 --directory dist`，打开 `http://localhost:4173`。

- 花与枝：18 类、39 款透明位图花材，包含不同自然花色、正面、侧面和枝条姿态；最多添加 24 枝，可拖动、旋转、缩放、裁短和镜像。手机端单指移动，双指直接旋转与缩放；一段手势只占一次撤销。新增花材可放在最前层或最后层；右键画布或使用图层按钮可打开图层栈，拖动或逐层调整前后顺序。
- 花材大小与枝梗长度分开调整；枝梗可在 60–240% 范围伸缩，只改变素材设定的下部枝梗段，保留上部花叶大小。
- 圈选剪枝与细部擦除会真正移除当前花材的相应像素。剪口记录在原始素材坐标中，移动、旋转、镜像和伸缩后仍跟随花材；支持撤销、重做和恢复整枝。
- 23 款花器：在原有日式高瓶、矮器与水盘之外，新增英式奶油陶壶、旧银高脚盆、砂岩庭院瓮，法式美第奇杯、炭黑高脚盆、雾蓝套盆，以及现代烟灰玻璃柱瓶、拉丝钢双口环形器、洞石长槽器。花器库按日式、英式、法式、现代筛选，换器自动跟随真实瓶口位置调整枝条。
- 每只花器自带专业固定结构，不增加操作面板：水盘与宽浅器自动使用可见或半隐藏剑山，英法宽口器使用花艺网或藏在口沿下的可重复使用花艺网，窄口瓶使用瓶口支撑，双口现代器使用一体插口。编辑画布、草稿图、结构参考图和 Prompt 共用同一套结构数据。
- 本机自动恢复当前草稿；作品集用 IndexedDB 保存草稿及导入的生成成品。剪枝、花材款式、枝梗长度和生成模式随草稿保存；兼容 v1 草稿。点击“新建画布”时，非空的当前作品会先自动存入“我的作品”，保存成功后才打开空白画布。
- 创作包包含两张 1600×1600 图片：`draft.png` 表达花材、主要构图、花器与整体光感；`composition-guide.png` 是可选的轮廓和前后关系参考，不要求照描。另含简短 Prompt、可恢复 JSON 和中英文说明。
- Prompt 默认“小幅自然重整”：保留花材与花朵数量、主要方向、高低主次、花器和整体光感；允许小幅调整花面、枝条弧度、局部位置、前后空间和瓶口插入关系，修复悬空、穿插及拼贴痕迹。局部阴影和反光随真实结构修正。自然花瓣因子提供个体差异，不强制每朵花都有瑕疵。另有“适度花艺润色”和“最小修正”，三档都允许必要的物理修正；不自动改动原始草稿。
- 界面支持中英文即时切换；语言偏好独立保存，不会改动作品内容、花材位置或用户输入的题名与创作想法。
- 在 ChatGPT 图片创作或 GPT Image 中上传草稿与 Prompt，生成图片后导入工房。
- 下载成品、分享卡、可编辑 JSON；支持系统文件分享与保留剪枝数据的压缩草稿链接。

## 明确边界

网页不直接调用 OpenAI 图片生成 API，也不包含任何 API 密钥；生成步骤在用户自己的图片生成工具完成。灵感图有明确示例标记，不会冒充当前草稿的生成结果。

当前草稿使用 localStorage；作品集使用 IndexedDB，均仅属于当前浏览器。清理浏览器数据会清除本机作品，需下载文件备份。导入成品限制 15 MB，最长边压缩到 2000 像素以控制本机存储；下载的成品是保存后的 JPEG，而非上传文件的原始字节。

分享链接包含花材款式、构图、剪枝、枝梗长度、意境与生成自由度，不包含成品图片。支持的浏览器使用压缩链接；链接过长或浏览器无法解压时，可下载并导入 JSON 草稿文件。链接可访问性仍遵循网站访问权限。图片分享不依赖访问网站。

## 素材与参考

详见 [素材与创作说明](docs/asset-sources.md)。v2 的三张花材图集提示词保存为 `docs/atlas-1-prompt-v2.txt`、`docs/atlas-2-prompt-v2.txt`、`docs/atlas-3-prompt-v2.txt`，逐款尺寸、透明度、裁切来源和枝梗锚点见 [asset-metadata-v2.json](docs/asset-metadata-v2.json)。本轮花器扩展见 [vessel-expansion-v3.md](docs/vessel-expansion-v3.md) 与 [vessel-metadata-v3.json](docs/vessel-metadata-v3.json)。旧版生成记录保留在 `docs/prompts.json`。


## v8 · 《花之书》与更轻的创作流程

- 新增 6 款「书图整理」花材：银莲花、铁筷子、花毛茛、郁金香、鸢尾、芍药，现共 18 类、39 款。来自用户提供的书中照片，经内置 GPT Image 去版面、拼合跨页花面和补全枝梗，保留透明通道；不是无损照片抠图，也不标作原创摄影。
- 花材库提供「花之书」筛选；新花材与原有旋转、镜像、剪枝、伸长、图层、保存、导出及分享流程共用。
- 花材卡提示角色，选中后仅显示一句搭配建议；花器卡改为形态、质感与搭配提示。技术性的固定结构仍自动处理。
- 「修剪与枝梗」按需展开，角度、大小保留在第一层；画布剪刀会自动打开修剪控件。
- 灵感手帖提供三组可编辑练习，打开前先保存现有草稿。图像来自真实的草稿渲染，不冒充生图成品。
- Prompt 压缩为几个短段落与汇总花材清单，保留用花/数量、设计身份和整体光感，允许自然的局部物理修正；不再逐枝锁坐标、角度、阴影或花瓣。

详见 [阅读与素材整理记录](docs/flower-book-study.md) 和 [花材图像处理提示词](docs/book-image-prompts.json)。

### Original book library (v9)
- All 60 botanical profiles from the supplied Flower Book, with 34 grouped poses; original flower faces retained in transparent WebP.
- Chinese/English search, book and grouped-material filters. Earlier assets retain stable IDs for saved drafts.
- Layers dock in the desktop design sidebar and below the mobile canvas; adding at the back, reordering and undo remain available.
- Extraction provenance and printed/PDF page mapping: `docs/book-photo-extraction.md`, `docs/book-photo-catalog.json`.

- Eight book-derived vessels with calibrated opening coordinates and concealed support: `docs/book-vessel-sources.json`. Total vessel library:31.
