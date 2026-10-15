# 素材与权利 / Assets and rights / 素材と権利

## 中文

本仓库包含网站代码与运行所需图片，但**代码许可不适用于图片，也不为所有图片授予统一的再使用许可**。

- `dist/assets/photo-*.webp`、`book-*.webp` 及部分 `book-vessel-*.webp` 与用户提供的 Rachel Siegfried 著 *The Flower Book*（DK）有关。部分保留原书花面，部分经过背景移除、跨页拼合或枝梗补全；它们不是独立原创摄影，也不因仓库公开而获得新的授权。
- `dist/assets/editorial/` 是主素材系列：12 款摄影质感透明花材、胭粉/暖象牙白/梅紫三幅背景，以及三只花器。内置 `image_gen` 以一张原创生成静物统一上左侧宽光、花瓣透光和釉面反射；这些是 AI 摄影风格艺术图，**并非实物摄影**。原始 PNG、运行 WebP、完整提示词与引用关系见 [花材记录](../dist/assets/editorial/art-direction.json) 和 [环境及花器记录](../dist/assets/editorial/environment-art-direction.json)。本系列没有取用《The Flower Book》的花面，也不作为植物鉴定依据。
- `dist/assets/atelier/` 的上一版九花材、三背景与一只烟青陶瓶作为归档保留，使用独立 ID 供旧作品继续打开；记录见 [art-direction-v1.json](../dist/assets/atelier/art-direction-v1.json)。主库展示新系列，「更多」可访问历次素材。
- 用户提供的 Magnific 参考链接返回 403；只读取三个公开页面的 metadata，未查看或复制其图片像素。本轮美术以项目自己新生成的艺术基准图制作。
- 其他花材与多数花器为项目制作的生成图，不能用作植物鉴定照片。逐款来源与处理记录见 [asset-sources.md](asset-sources.md)、[book-photo-extraction.md](book-photo-extraction.md) 和 [book-vessel-sources.json](book-vessel-sources.json)。
- `dist/previews/*.webp` 为上述花材和花器组成的预览图，沿用各组成图片的权利状态；代码许可不覆盖这些预览图。
- `dist/assets/bottle.png` 与 `round.png` 来自 [PurePNG / PNGStock](https://purepng.com/photo/18638/objects-vase)，来源页标注 CC0。
- `dist/assets/ikebana-reference.jpg` 为 Rémi Jouan 摄影的 [Ikebana International Paris 2019 (01)](https://commons.wikimedia.org/wiki/File:Ikebana_International_Paris_2019_(01).JPG)，按 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) 使用并保留署名。
- `dist/third-party/Compositor-LICENSE.txt` 保留 Compositor 项目的 MIT 许可与原著作权声明；相关格式参考见 `dist/compositor-project.js`。

## English

This repository includes the site code and images needed to run it, but **the code license does not cover images or grant a blanket reuse license for them**.

- `dist/assets/photo-*.webp`, `book-*.webp`, and some `book-vessel-*.webp` are related to the user-supplied *The Flower Book* by Rachel Siegfried (DK). Some retain the book's photographed flower faces; others were processed to remove backgrounds, join spreads, or extend stems. They are not independent original photographs, and publication of this repository does not create new usage rights.
- `dist/assets/editorial/` is the main series: 12 transparent botanicals with photographic material detail, blush/ivory/plum backgrounds, and three vessels. Built-in `image_gen` uses one original generated still life to direct broad upper-left light, translucent petals and glazed reflections. These are AI-generated photographic artworks, **not photographs of physical specimens**. Original PNG, runtime WebP, exact prompts and reference relationships are in the [botanical record](../dist/assets/editorial/art-direction.json) and [environment/vessel record](../dist/assets/editorial/environment-art-direction.json). This series does not reuse flower faces from *The Flower Book* and is not a botanical identification reference.
- The preceding nine-botanical, three-background and one smoky-celadon vessel series in `dist/assets/atelier/` remains archived under separate IDs so saved works reopen unchanged. See [art-direction-v1.json](../dist/assets/atelier/art-direction-v1.json). The main library shows the new series; More exposes earlier catalogs.
- The supplied Magnific reference returned HTTP 403. Only metadata from three public pages was read; their image pixels were neither inspected nor copied. This art direction uses the project's own newly generated master.
- Other botanicals and most vessels are generated artwork made for the project, not botanical identification photographs. For item-level provenance, see [asset-sources.md](asset-sources.md), [book-photo-extraction.md](book-photo-extraction.md), and [book-vessel-sources.json](book-vessel-sources.json).
- `dist/previews/*.webp` are compositions of those botanical and vessel images. Their rights follow the constituent images; the code license does not cover these previews.
- `dist/assets/bottle.png` and `round.png` come from [PurePNG / PNGStock](https://purepng.com/photo/18638/objects-vase), whose source page marks them CC0.
- `dist/assets/ikebana-reference.jpg` is Rémi Jouan's [Ikebana International Paris 2019 (01)](https://commons.wikimedia.org/wiki/File:Ikebana_International_Paris_2019_(01).JPG), used with credit under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).
- `dist/third-party/Compositor-LICENSE.txt` preserves the Compositor project's MIT license and original copyright notice; see `dist/compositor-project.js` for the format reference.

## 日本語

このリポジトリにはサイトのコードと動作に必要な画像が含まれますが、**コードのライセンスは画像に適用されず、画像に一律の再利用許諾を与えるものではありません**。

- `dist/assets/photo-*.webp`、`book-*.webp`、一部の `book-vessel-*.webp` は、ユーザーが提供した Rachel Siegfried 著 *The Flower Book*（DK）に由来します。原書の花の写真表現を残した素材のほか、背景除去、見開きの接合、茎の補完を行った素材もあります。独立したオリジナル写真ではなく、リポジトリの公開によって新しい利用権が生じるものではありません。
- `dist/assets/editorial/` が主なシリーズです。写真の質感を持つ透明花材12点、ブラッシュ／アイボリー／プラムの背景3点、花器3点を含みます。内蔵 `image_gen` による1枚のオリジナル生成静物画を基準に、左上の広い光、花びらの透け感、釉薬の反射を統一しました。AIによる写真風の生成画像で、**実物を撮影した写真ではありません**。元のPNG、実行用WebP、正確なプロンプトと参照関係は [花材記録](../dist/assets/editorial/art-direction.json) と [環境・花器記録](../dist/assets/editorial/environment-art-direction.json) にあります。*The Flower Book* の花の写真表現を再利用せず、植物同定の資料ではありません。
- 前版の `dist/assets/atelier/` にある花材9点、背景3点、煙青色の陶器1点は、既存作品を元の画像で開くため独立したIDで残しています。[art-direction-v1.json](../dist/assets/atelier/art-direction-v1.json) を参照してください。主なライブラリは新シリーズを表示し、「もっと見る」から過去の素材へ進めます。
- 提供されたMagnific参照リンクはHTTP 403を返しました。公開3ページのメタデータのみを読み、画像のピクセルは閲覧・複製していません。今回の制作基準は、このプロジェクトで新たに生成した静物画です。
- その他の花材と大半の花器は、このプロジェクトのために制作した生成画像であり、植物同定用の写真ではありません。個別の出典と処理は [asset-sources.md](asset-sources.md)、[book-photo-extraction.md](book-photo-extraction.md)、[book-vessel-sources.json](book-vessel-sources.json) に記録しています。
- `dist/previews/*.webp` は上記の花材と花器を組み合わせたプレビューです。各画像の権利状態が引き継がれ、コードのライセンスは適用されません。
- `dist/assets/bottle.png` と `round.png` は [PurePNG / PNGStock](https://purepng.com/photo/18638/objects-vase) に由来し、出典ページには CC0 と記載されています。
- `dist/assets/ikebana-reference.jpg` は Rémi Jouan 撮影の [Ikebana International Paris 2019 (01)](https://commons.wikimedia.org/wiki/File:Ikebana_International_Paris_2019_(01).JPG) で、[CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) に基づきクレジットを表示しています。
- `dist/third-party/Compositor-LICENSE.txt` には Compositor プロジェクトの MIT ライセンスと元の著作権表示を保持しています。形式の参考元は `dist/compositor-project.js` に記載しています。
