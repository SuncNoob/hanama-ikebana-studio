# 花间 · 素材与创作说明

整理日期：2026-09-25。

## 可摆放花材

由内置 GPT Image 图片工具生成一张透明素材图集，再按单元格拆分、裁去透明边缘，保留原始颜色与 alpha。没有用代码绘制替代花材。

| 素材 | 游戏文件 | 尺寸 |
|---|---|---|
| 樱花 | `dist/assets/sakura.png` | 350×493 |
| 马蹄莲 | `dist/assets/calla.png` | 201×470 |
| 秋菊 | `dist/assets/chrysanthemum.png` | 269×486 |
| 松枝 | `dist/assets/pine.png` | 394×495 |
| 红枫 | `dist/assets/maple.png` | 432×472 |
| 蒲苇 | `dist/assets/pampas.png` | 223×501 |

生成工具：内置 image_gen；非 API/CLI 模式。完整提交提示词见 [prompts.json](prompts.json)。其中花器图集和摄影示例两次请求因连接问题失败，未作为游戏素材使用；花器与灵感参考采用下列有许可说明的网络素材。

## 可选花器

褐釉长颈瓶（818×978）与窑变圆瓶（748×734）由同一张透明照片机械裁切得到，保留像素与透明度。

- 来源：[Vase / PNGStock，PurePNG](https://purepng.com/photo/18638/objects-vase)
- 原始图片：[透明花器照片](https://purepng.com/public/uploads/large/purepng.com-vasevaseopen-containerceramics-vaseflower-vase-1701527704569hqfbv.png)
- 许可：来源页标注 CC0、可商用且不要求署名。工房仍保留来源链接。
- 更改：分离两个花器，裁去透明边缘；未改变花器颜色、形状。
- 游戏文件：`dist/assets/bottle.png`、`dist/assets/round.png`。

## 灵感摄影

**Ikebana International Paris 2019 (01)**，摄影：**Rémi Jouan**。

- [Wikimedia Commons 原始来源](https://commons.wikimedia.org/wiki/File:Ikebana_International_Paris_2019_(01).JPG)
- [CC BY 4.0 许可](https://creativecommons.org/licenses/by/4.0/)
- 文件：`dist/assets/ikebana-reference.jpg`，1068×1600。
- 内容未修改，网页按版面尺寸展示；此图是展览记录，不是用户当前草稿的生成结果。
- 网页灵感页及素材说明均保留作者、原始来源与许可证链接。

## 花道参考

- [池坊官方：花道三种样式](https://chs.ikenobo.jp/about/style.html)：作为立花、生花、自由花区别的参考；此工房以自由创作为范围。
- [草月官方：Study Sogetsu](https://www.sogetsu.or.jp/e/begin/)：自由表达与学习背景。

网页中的留白、方向和疏密提示是创作建议，并非正式流派教学或评分标准。

## 从草稿到生成作品

创作包由网页从实际摆放状态实时产生，包括：

1. `draft.png`：1600×1600 的构图图像，不带界面和选择框。
2. `prompt.txt`：花材品种、锚点位置、角度、相对高度、裁短量、镜像与前后关系，加上用户意境和场景；要求生成器保留结构，仅完善真实质感。
3. `composition.json`：可重新导入的完整草稿。
4. `readme.txt`：上传、生成、导入、分享的步骤。

网页不伪造生成结果，也不自动调用付费图片 API。用户将草稿和提示词一起提交给自己的 GPT Image 工具，随后导入成品。模型仍可能改变细节，生成后需检查构图。
