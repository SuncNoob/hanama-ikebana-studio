# Botanical studies and cutting, v20

This release adds 14 individually generated transparent botanical studies to the 101 existing selectable specimens. The eight foliage families each gain a genuinely different view or growth habit; six frequently used flowering families gain a bud, half-open, late-open, oblique, or side-view state. Original Flower Book photographs remain available and are not recolored or rotated to represent the new studies.

| Family | New asset | Distinct state |
|---|---|---|
| Alpine fern | `leaf-alpine-fern-side.png` | Side-arching frond |
| Lemon eucalyptus | `leaf-lemon-eucalyptus-side.png` | Side-view branch |
| Snow willow | `leaf-snow-willow-cascade.png` | Cascading spray |
| Silver ragwort | `leaf-silver-ragwort-young.png` | Younger oblique branch |
| Gardenia foliage | `leaf-gardenia-side.png` | Side-view new growth |
| Bird's-nest fern | `leaf-bird-nest-fern-curl.png` | Curling side frond |
| Fatsia | `leaf-fatsia-oblique.png` | Oblique palmate leaf |
| Monstera | `leaf-monstera-young.png` | Younger side-view leaf |
| Sedum | `study-sedum-bud.png` | Two budding heads |
| Dahlia | `study-dahlia-side.png` | Half-open side bloom |
| Rose | `study-rose-half-open.png` | Half-open oblique bloom |
| Peony | `study-peony-early.png` | Early side-opening bloom |
| Chrysanthemum | `study-chrysanthemum-late.png` | Loose late-open side bloom |
| Hydrangea | `study-hydrangea-transition.png` | Transitional half-bloom |

Images were made as separate built-in GPT Image requests with a single-specimen botanical studio-photo brief: natural color and imperfections, full stem visible, transparent background, no vessel or text. They are generated studies, not Flower Book photographs. Files retain their original RGBA pixels; no hue filters or rotation stand in for new camera angles.

Every specimen now enters the same cutting analysis. A normal alpha cut remains the first choice. If overlapping foliage keeps the mask connected, the cutter tests rooted reddish, brown, and green stem-core color classes, accepts only a core that itself separates, then assigns visible leaf and flower pixels to the nearest side. The Sedum flower-lobe seam applies when a reddish multi-stem core is detected from pixels, rather than from its asset ID. Existing cut records and drafts remain compatible.
