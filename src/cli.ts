#!/usr/bin/env node

const VERSION = '0.2.0'

const HELP_HEADER = `
Figcraft v${VERSION} — Code-driven SVG diagram library

Documentation: https://figcraft.xflowing.com/docs.html
GitHub:        https://github.com/zeqinlee/figcraft
npm:           https://www.npmjs.com/package/figcraft

Usage: figcraft help [topic]
  Topics: figure, elements, arrows, layout, export, config
  No topic = show all. Use "figcraft help <topic>" to show one section.

  If you are an AI assistant, run "figcraft help ai" for the AI-optimized
  guide with design patterns, color palettes, and best practices.

Quick Start:
  import { Figure } from 'figcraft'

  const fig = new Figure(800, 400, { bg: '#fff' })
  const a = fig.rect('Input', { pos: [50, 100], size: [100, 50], fill: '#e3f2fd' })
  const b = fig.rect('Output', { pos: [250, 100], size: [100, 50], fill: '#c8e6c9' })
  fig.arrow(a, b)
  await fig.export('diagram.svg')
`

const HELP_FIGURE = `
Figure — Main canvas class

Constructor:
  new Figure(width?: number, height?: number, options?: FigureOptions)
    width     Canvas width in pixels (default: 800)
    height    Canvas height in pixels (default: 400)
    options   See FigureOptions below

FigureOptions:
  bg?: string              Background color (default: none/transparent)
  fontFamily?: string      Default font family
  mathFont?: string        Math formula font for $...$ (default: 'Times New Roman')
  codeFont?: string        Code font for \`...\` (default: 'Menlo')
  fonts?: string[]         Register local font names
  autoAlign?: boolean      Auto-align same-row elements (default: true)
  antiOverlap?: boolean    Auto-prevent label overlaps (default: true)
  alignTolerance?: number  Row detection Y tolerance in px (default: 20)

Element Creation Methods:
  fig.rect(label, config?)        Rectangle
  fig.circle(label, config?)      Circle
  fig.text(content, config?)      Text label
  fig.image(src, config?)         Image
  fig.diamond(label, config?)     Diamond (decision node)
  fig.trapezoid(label, config?)   Trapezoid
  fig.cylinder(label, config?)    Cylinder (3D)
  fig.cuboid(label, config?)      Cuboid (3D block)
  fig.sphere(label, config?)      Sphere (3D)
  fig.stack(label, config?)       Stacked layers

Connection Methods:
  fig.arrow(source, target, config?)     Single arrow
  fig.arrows(source(s), target(s), config?)  Fan-out / fan-in

Layout Methods:
  fig.row(elements, { gap? })                      Horizontal layout
  fig.col(elements, { gap? })                      Vertical layout
  fig.grid(elements, { cols?, gap?, rowGap?, colGap? })  Grid layout
  fig.group(members, config?)                      Grouping frame

Other Methods:
  fig.font(name, source?)          Register font
  fig.render(options?): string     Render to SVG string
  fig.export(path, options?)       Export to file (.svg/.png/.jpg/.webp/.pdf)
`

const HELP_ELEMENTS = `
Element Types — All shape classes

All elements support nesting: element.rect(), element.circle(), etc.
Child elements are positioned relative to their parent.

2D Shapes:
  Rect        fig.rect(label, config?)
              Supports: rounded corners, dashed border, shadow, container
              Key config: pos, size, fill, radius, stroke, shadow

  Circle      fig.circle(label, config?)
              Key config: pos, r (radius, default: 30), fill

  Text        fig.text(content, config?)
              Standalone text label, supports markdown
              Key config: pos, fontSize, fontColor, bold

  Image       fig.image(src, config?)
              Key config: pos, size, src (URL or path)

  Diamond     fig.diamond(label, config?)
              Flowchart decision node
              Key config: pos, size, fill

  Trapezoid   fig.trapezoid(label, config?)
              Key config: pos, size, fill, topRatio (0-1, default: 0.6)

3D Shapes:
  Cylinder    fig.cylinder(label, config?)
              CNN feature maps, databases
              Key config: pos, size, fill, depth (ellipse ratio, default: 0.15)

  Cuboid      fig.cuboid(label, config?)
              3D block / tensor
              Key config: pos, size, fill, depth (extrusion px, default: 15)

  Sphere      fig.sphere(label, config?)
              Nodes, attention heads
              Key config: pos, r (radius, default: 30), fill

  Stack       fig.stack(label, config?)
              Multi-layer stacking effect (CNN feature maps, Transformer N×)
              Key config: pos, size, fill, count (layers, default: 3),
                          stackOffset ([dx, dy], default: [6, -6])

Markdown in Labels:
  **bold**    Bold text
  *italic*    Italic text
  \`code\`     Monospace font
  $E=mc^2$   Math formula (serif italic)

Nesting Example:
  const container = fig.rect('Parent', { pos: [0,0], size: [200,150] })
  container.rect('Child', { pos: [20, 40], size: [60, 30] })
`

const HELP_ARROWS = `
Arrows — Connection configuration

Methods:
  fig.arrow(source, target, config?)
    Connect two elements with an arrow.
    Auto-snaps to nearest edges if no anchor specified.

  fig.arrows(source, targets, config?)
  fig.arrows(sources, target, config?)
    Fan-out (1→N) or fan-in (N→1) connections.
    Automatically aligns target/source elements.

ArrowConfig:
  from?: AnchorSpec          Source anchor ('top'|'bottom'|'left'|'right' or {side, at?})
  to?: AnchorSpec            Target anchor
  label?: string             Text label on the arrow
  labelOffset?: number       Manual label offset (skips auto anti-overlap)
  style?: 'solid'|'dashed'|'dotted'   Line style (default: 'solid')
  color?: string             Arrow color (default: '#000')
  width?: number             Line width (default: 1.5)
  head?: ArrowHead           Arrow head type (default: 'triangle')
  headSize?: number          Arrow head size
  bidirectional?: boolean    Double-headed arrow
  path?: ArrowPath           Path type (default: 'straight')
  curve?: number             Curve bend amount (positive=up, negative=down), only for path='curve'

ArrowHead types:
  'triangle'        Solid triangle (default)
  'triangle-open'   Open triangle
  'stealth'         Sharp arrow (LaTeX style)
  'vee'             V-shape
  'circle'          Solid circle
  'circle-open'     Open circle
  'diamond'         Solid diamond
  'diamond-open'    Open diamond
  'bar'             Vertical bar |
  'dot'             Small dot
  'none'            No arrowhead

ArrowPath types:
  'straight'    Direct line (default)
  'curve'       Bezier curve (use 'curve' option to control bend)
  'polyline'    Right-angle path

AnchorSpec:
  Simple:   'top' | 'bottom' | 'left' | 'right'
  Detailed: { side: 'top', at: 30 }    // 30% along the edge
  Default:  auto-snap to nearest edges

Example:
  fig.arrow(a, b, {
    from: 'right', to: 'left',
    label: 'data', style: 'dashed',
    color: '#1565c0', head: 'stealth'
  })
`

const HELP_LAYOUT = `
Layout — Positioning helpers

fig.row(elements, options?)
  Arrange elements in a horizontal row.
  Options: { gap?: number }  (default gap: 40)
  Note: first element must have pos set.

fig.col(elements, options?)
  Arrange elements in a vertical column.
  Options: { gap?: number }  (default gap: 40)
  Note: first element must have pos set.

fig.grid(elements, options?)
  Arrange elements in a grid.
  Options: {
    cols?: number       Columns per row (default: 3)
    gap?: number        Uniform gap (default: 40)
    rowGap?: number     Override vertical gap
    colGap?: number     Override horizontal gap
  }
  Note: first element must have pos set.

fig.group(members, config?)
  Draw a grouping frame around elements.
  Must be called AFTER row/col/grid (needs resolved positions).
  Returns a Rect that can be used as arrow source/target.
  Config: {
    label?: string
    fill?: string
    stroke?: string | StrokeConfig | 'none'
    radius?: number
    padding?: number       (default: 20)
    fontSize?: number
    fontColor?: string
  }

Auto-Alignment:
  When autoAlign is enabled (default), elements at similar Y positions
  are automatically aligned. Fan-out/fan-in targets are auto-spaced.
  Use FigureOptions.autoAlign = false to disable.

Example:
  const a = fig.rect('A', { pos: [50, 50], size: [80, 40] })
  const b = fig.rect('B', { size: [80, 40] })
  const c = fig.rect('C', { size: [80, 40] })
  fig.row([a, b, c], { gap: 30 })
  fig.group([a, b, c], { label: 'Pipeline', stroke: { color: '#666', dash: [6,3] } })
`

const HELP_EXPORT = `
Export — Rendering and file output

fig.render(options?): string
  Returns the SVG markup as a string.

fig.export(filePath, options?): Promise<void>
  Export to file. Format auto-detected by extension:
    .svg    SVG markup
    .png    PNG raster image (via sharp)
    .jpg    JPEG image (via sharp)
    .webp   WebP image (via sharp)
    .pdf    PDF document (via pdfkit)

ExportOptions:
  scale?: number      Resolution multiplier for raster formats (default: 2)
  fit?: boolean        Auto-crop to content bounds
  margin?: number     Margin around content when fit=true (default: 20)
  quality?: number    JPG/WebP quality 1-100 (default: 90)

Example:
  // High-res PNG with auto-fit
  await fig.export('output.png', { fit: true, margin: 30, scale: 3 })

  // SVG with tight crop
  await fig.export('output.svg', { fit: true, margin: 10 })

  // Get SVG string
  const svg = fig.render({ fit: true })
`

const HELP_CONFIG = `
ElementConfig — Full property reference

Position & Size:
  pos?: [x, y]                Position (pixels or '%')
  size?: [width, height]      Size (pixels or '%')

Colors:
  fill?: string | 'none'      Fill color ('none' = transparent)
  fillOpacity?: number         Fill opacity (0-1)
  color?: string               Theme color (sets stroke + fontColor)
  stroke?: string | StrokeConfig | 'none'   Border

StrokeConfig:
  { color?: string, width?: number, dash?: number[] }
  dash examples: [6,3] = dashed, [2,2] = dotted

Appearance:
  radius?: number              Corner radius (Rect)
  r?: number                   Circle/Sphere radius (default: 30)
  opacity?: number             Overall opacity (0-1)
  shadow?: boolean | ShadowConfig   Drop shadow (true = defaults)

ShadowConfig:
  { dx?: number, dy?: number, blur?: number, color?: string }

Typography:
  fontSize?: number            Font size in px
  fontFamily?: string          Font family
  fontColor?: string           Text color
  fontWeight?: string|number   Font weight
  bold?: boolean               Shorthand for fontWeight: 'bold'

Spacing:
  padding?: number             Inner padding

Shape-Specific:
  topRatio?: number            Trapezoid top/bottom width ratio (0-1, default: 0.6)
  depth?: number               Cuboid: extrusion px (default: 15)
                               Cylinder: ellipse height ratio (default: 0.15)
  count?: number               Stack: number of layers (default: 3)
  stackOffset?: [dx, dy]       Stack: per-layer offset (default: [6, -6])

PosValue:
  number      Absolute pixels, e.g. 100
  string      Percentage of parent, e.g. '50%'
`

const HELP_AI = `
Figcraft — AI Assistant Guide
==============================

This guide is optimized for AI assistants (Claude, ChatGPT, Cursor Agent, etc.)
to help users generate high-quality diagrams with figcraft.

Full docs: https://figcraft.xflowing.com/docs.html

1. OVERVIEW
-----------
figcraft is a pure TypeScript/Node.js SVG diagram library.
Users write .ts files, run "npx tsx <file>.ts" to generate diagrams.

  import { Figure } from 'figcraft'
  const fig = new Figure(width, height, {
    bg: '#fff',
    fontFamily: 'Times New Roman',
    antiOverlap: false,   // REQUIRED when overlapping elements on background containers
  })

2. ALL ELEMENT TYPES
--------------------
  fig.rect(label, cfg)        Rectangle — modules, steps, containers
  fig.circle(label, cfg)      Circle — states, endpoints (key: r)
  fig.diamond(label, cfg)     Diamond — decisions, branches
  fig.trapezoid(label, cfg)   Trapezoid — converters, pooling (key: topRatio 0-1)
  fig.text(label, cfg)        Text — standalone labels, titles
  fig.image(src, cfg)         Image — embedded images (key: size required)
  fig.cylinder(label, cfg)    Cylinder — databases, storage (key: depth)
  fig.cuboid(label, cfg)      Cuboid — 3D tensors (key: depth)
  fig.sphere(label, cfg)      Sphere — 3D nodes (key: r)
  fig.stack(label, cfg)       Stack — multi-layer data (key: count, stackOffset)

  ElementConfig (all optional):
    pos: [x, y]            Position (Rect: top-left; Circle: center)
    size: [w, h]           Size
    fill: string|'none'    Fill color
    fillOpacity: 0-1       Fill opacity
    color: string          Theme color (sets stroke + fontColor at once)
    stroke: string | { color, width, dash }   Border
    radius: number         Corner radius (Rect)
    r: number              Radius (Circle/Sphere, default 30)
    shadow: true | { dx, dy, blur, color }
    padding: number        Inner padding
    fontSize, fontFamily, fontColor, bold
    topRatio: 0-1          Trapezoid top/bottom ratio (default 0.6)
    count: number          Stack layers (default 3)
    stackOffset: [dx,dy]   Stack offset (default [6,-6])
    depth: number          3D depth

  Markdown in labels: **bold**, *italic*, \`code\`, $math$

3. ARROW SYSTEM
---------------
  fig.arrow(a, b, cfg?)                   Single arrow
  fig.arrows(src, [t1,t2,t3], cfg?)       Fan-out (1→N)
  fig.arrows([s1,s2], target, cfg?)       Fan-in (N→1)
  fig.fork(src, [t1,t2,t3], cfg?)         Fork with shared trunk

  ArrowConfig (all optional):
    from/to: 'top'|'bottom'|'left'|'right' | { side, at: '30%' }
    label: string           Text on arrow
    head: 'stealth'|'triangle'|'vee'|'circle'|'diamond'|'bar'|'dot'|'none'
          + open variants: 'triangle-open', 'circle-open', 'diamond-open'
    style: 'solid'|'dashed'|'dotted'
    color, width
    path: 'straight'|'curve'|'polyline'
    curve: number           Bend amount (path=curve)
    cornerRadius: number    Polyline corner radius
    bidirectional: boolean  Double-headed
    labelOffset: number     Manual offset (skips auto anti-overlap)

  Fork-specific: cornerRadius, curve (distance from source to split line)

4. LAYOUT
---------
  fig.row([a,b,c], { gap: 40 })              Horizontal
  fig.col([a,b,c], { gap: 30 })              Vertical
  fig.grid([a,b,c,d,e,f], { cols: 3 })       Grid
  fig.group([a,b,c], { label, fill, stroke, padding, radius })  Group box

5. NESTING — Child Elements
----------------------------
  Parent elements can create children with percentage-based positioning:

  const parent = fig.rect('Title', {
    pos: [100,100], size: [300,200],
    padding: 20, bold: true
  })
  parent.rect('Child A', { pos: ['5%','25%'], size: ['90%','20%'] })
  parent.rect('Child B', { pos: ['5%','50%'], size: ['90%','20%'] })

6. EXPORT
---------
  await fig.export('out.svg', { fit: true, margin: 30 })
  await fig.export('out.png', { fit: true, margin: 30, scale: 2 })
  await fig.export('out.pdf')
  const svgStr = fig.render({ fit: true })

  Options: fit (auto-crop), margin, scale (PNG resolution), quality (JPG/WebP)

7. DESIGN PATTERNS
------------------

  Pattern A — Background Container + Foreground Elements:
    MUST set antiOverlap: false. Create background rect FIRST (SVG layer order).

    const bg = fig.rect('', {
      pos: [20,20], size: [350,400],
      fill: '#e0f7fa',
      stroke: { color: '#4dd0e1', width: 1.5, dash: [6,3] },
      radius: 12,
    })
    fig.text('Title', { pos: [195,40], fontSize: 13, bold: true })
    const inner = fig.rect('Module', { pos: [40,60], size: [310,50], fill: '#b3e5fc' })

  Pattern B — Multi-layer Nesting (3 depth levels):
    Outer container (lightest) → Sub-container (medium) → Elements (deepest)
    Each layer uses different fill color for visual hierarchy.

  Pattern C — Arrows Must Be Vertical or Horizontal:
    Same-width elements: same pos[0] and size[0] → perfect vertical arrows.
    Different widths: use percentage anchors:
      fig.arrow(wide, narrow, { from: { side: 'bottom', at: '21.5%' }, to: 'top' })

  Pattern D — Cross-Container Interaction:
    fig.arrow(leftBox, rightBox, {
      from: { side: 'right', at: '30%' },
      to: { side: 'left', at: '30%' },
      label: 'Request', head: 'stealth',
    })

  Pattern E — Parallel Containers MUST Have Equal Height (CRITICAL):
    When placing multiple containers side by side, they MUST have the same
    height and top-aligned. This is the #1 visual quality rule.

    Method 1 — Fixed same size:
      const left  = fig.rect('', { pos: [20, 20],  size: [350, 380], ... })
      const right = fig.rect('', { pos: [400, 20], size: [250, 380], ... })
      //                                    ^^^^ same Y      ^^^^ same H

    Method 2 — Calculate from content (Encoder/Decoder pattern):
      // Define shared block heights
      const HA = 55, HF = 48, HN = 30, GAP = 20

      // Decoder has more blocks → taller, calculate its total height
      const decH = HN + GAP + HF + GAP + HN + GAP + HA + GAP + HN + GAP + HA
      const decBottom = gTop + decH

      // Encoder has fewer blocks → bottom-align with decoder
      const encH = HN + GAP + HF + GAP + HN + GAP + HA
      const encStartY = decBottom - encH  // align bottoms

    Method 3 — Wrap with group() after layout:
      fig.group([a, b, c], { label: 'Left', padding: 16 })
      fig.group([d, e, f, g], { label: 'Right', padding: 16 })
      // group auto-fits to content — then manually adjust if heights differ

    WRONG (different heights):
      fig.rect('', { pos: [20, 20],  size: [350, 300], ... })  // height 300
      fig.rect('', { pos: [400, 20], size: [250, 400], ... })  // height 400 ✗

8. COLOR PALETTE REFERENCE
--------------------------
  Use Material Design 50-100 shades. Avoid high saturation.
  Border: #333 (not pure black). Same module = same color family.

  Palette A (Green + Purple):
    #f1f8e9 / #a5d6a7  — green bg     #f3e5f5 / #ce93d8 — purple bg
    #e8f5e9 — green item               #ede7f6 — purple item
    #fff3e0 — orange input             #e3f2fd — blue process
    #b2ebf2 — cyan output              #e1bee7 — pink accent

  Palette B (Cyan + Amber):
    #e0f7fa / #4dd0e1  — cyan bg       #fff8e1 / #ffd54f — amber bg
    #e1f5fe — sky blue sub-container   #ffecb3 — amber sub-container
    #b3e5fc — blue item                #ffe0b2 — orange item
    #f0f4c3 — lime accent              #c5cae9 — indigo stack

  Palette C (Pure Black & White):
    fill: 'none', color: '#000' — for formal publications

  Rule: Multiple figures in same paper → use DIFFERENT palettes to avoid confusion.

9. CHECKLIST (after each generation)
------------------------------------
  [ ] Arrow directions match data/control flow
  [ ] All arrows are strictly vertical or horizontal (no diagonal)
  [ ] Even spacing between elements
  [ ] Text readable, not overflowing element bounds
  [ ] Parallel containers: same height, top-aligned
  [ ] Background → sub-container → element: 3 distinct color levels
  [ ] Key modules visually prominent (larger, bolder)
  [ ] Fork arrowheads pointing correct direction
  [ ] Multiple figures use different color palettes

10. COMMON ERRORS
-----------------
  Elements hidden behind background → create background rect FIRST
  Elements push each other away → set antiOverlap: false
  Arrow labels overlap → use labelOffset for manual control
  Fork arrowheads reversed → update to latest version
  Stack wrong count → explicitly set count and stackOffset
  Percentage pos not working → only works inside parent.rect() children
  Font not rendering → register with fig.font('Name', 'google')

11. COMPLETE EXAMPLE — Transformer Architecture
------------------------------------------------
  This real-world example demonstrates: parallel columns with bottom-aligned
  heights, residual connections, cross-attention arrows, group boxes,
  consistent color coding, and proper vertical arrow flow.

  /**
   * Transformer Architecture
   * Based on "Attention is All You Need" (Vaswani et al., 2017)
   */
  import { Figure } from 'figcraft'

  async function main() {
    const fig = new Figure(700, 900, { bg: '#ffffff' })

    const W = 150
    const HA = 55     // attention block height
    const HF = 48     // feed forward height
    const HN = 30     // add & norm height
    const GAP = 20    // gap between blocks

    const EX = 60     // encoder column left x
    const DX = 380    // decoder column left x
    const ECX = EX + W / 2
    const DCX = DX + W / 2

    // Color palette — one color per semantic role
    const cAttn   = { fill: '#fff3e0', color: '#333' }   // orange — attention
    const cNorm   = { fill: '#fffde7', color: '#333' }   // yellow — add & norm
    const cFF     = { fill: '#e8eaf6', color: '#333' }   // indigo — feed forward
    const cEmbed  = { fill: '#fce4ec', color: '#333' }   // pink — embedding
    const cLinear = { fill: '#c8e6c9', color: '#333' }   // green — linear
    const cSoft   = { fill: '#b2ebf2', color: '#333' }   // cyan — softmax
    const ac = { color: '#333' }

    // === Output area ===
    fig.text('Output Probabilities', { pos: [DCX, 15], fontSize: 11, fontColor: '#555' })
    const softmax = fig.rect('Softmax', { pos: [DX, 30], size: [W, 32], ...cSoft, radius: 4, fontSize: 11 })
    const linear = fig.rect('Linear', { pos: [DX, 82], size: [W, 32], ...cLinear, radius: 4, fontSize: 11 })

    // === Decoder ×N (more blocks, determines total height) ===
    const gTop = 148
    let dy = gTop

    const dAN3 = fig.rect('Add & Norm', { pos: [DX, dy], size: [W, HN], ...cNorm, radius: 4, fontSize: 10 })
    dy += HN + GAP
    const dFF = fig.rect('Feed Forward', { pos: [DX, dy], size: [W, HF], ...cFF, radius: 4, fontSize: 10 })
    dy += HF + GAP
    const dAN2 = fig.rect('Add & Norm', { pos: [DX, dy], size: [W, HN], ...cNorm, radius: 4, fontSize: 10 })
    dy += HN + GAP
    const dCross = fig.rect('Multi-Head Attention', { pos: [DX, dy], size: [W, HA], ...cAttn, radius: 4, fontSize: 10 })
    dy += HA + GAP
    const dAN1 = fig.rect('Add & Norm', { pos: [DX, dy], size: [W, HN], ...cNorm, radius: 4, fontSize: 10 })
    dy += HN + GAP
    const dMasked = fig.rect('Masked Multi-Head Attn', { pos: [DX, dy], size: [W, HA], ...cAttn, radius: 4, fontSize: 10 })
    dy += HA
    const decBottom = dy

    // === Encoder ×N (fewer blocks → BOTTOM-ALIGNED with decoder) ===
    const encH = HN + GAP + HF + GAP + HN + GAP + HA
    let ey = decBottom - encH   // ← KEY: align encoder bottom with decoder bottom

    const eAN2 = fig.rect('Add & Norm', { pos: [EX, ey], size: [W, HN], ...cNorm, radius: 4, fontSize: 10 })
    ey += HN + GAP
    const eFF = fig.rect('Feed Forward', { pos: [EX, ey], size: [W, HF], ...cFF, radius: 4, fontSize: 10 })
    ey += HF + GAP
    const eAN1 = fig.rect('Add & Norm', { pos: [EX, ey], size: [W, HN], ...cNorm, radius: 4, fontSize: 10 })
    ey += HN + GAP
    const eMHA = fig.rect('Multi-Head Attention', { pos: [EX, ey], size: [W, HA], ...cAttn, radius: 4, fontSize: 10 })

    // === Bottom: Embedding + Positional Encoding ===
    const btm = decBottom + 25
    const ePlus = fig.circle('+', { pos: [ECX - 14, btm + 5], r: 14, fill: '#fff', color: '#333', fontSize: 16 })
    const dPlus = fig.circle('+', { pos: [DCX - 14, btm + 5], r: 14, fill: '#fff', color: '#333', fontSize: 16 })
    fig.text('Pos Encoding →', { pos: [EX - 28, btm + 19], fontSize: 9, fontColor: '#555' })
    fig.text('← Pos Encoding', { pos: [DX + W + 42, btm + 19], fontSize: 9, fontColor: '#555' })
    const eEmbed = fig.rect('Input Embedding', { pos: [EX, btm + 50], size: [W, 36], ...cEmbed, radius: 4, fontSize: 10 })
    const dEmbed = fig.rect('Output Embedding', { pos: [DX, btm + 50], size: [W, 36], ...cEmbed, radius: 4, fontSize: 10 })
    fig.text('Inputs', { pos: [ECX, btm + 100], fontSize: 11, fontColor: '#333' })
    fig.text('Outputs', { pos: [DCX, btm + 100], fontSize: 11, fontColor: '#333' })

    // === Groups (dashed border) ===
    fig.group([eAN2, eFF, eAN1, eMHA], {
      label: 'Encoder ×N', stroke: { color: '#999', dash: [6, 3] },
      fontColor: '#666', padding: 16, fontSize: 11,
    })
    fig.group([dAN3, dFF, dAN2, dCross, dAN1, dMasked], {
      label: 'Decoder ×N', stroke: { color: '#999', dash: [6, 3] },
      fontColor: '#666', padding: 16, fontSize: 11,
    })

    // === Main flow arrows (upward) ===
    fig.arrow(eMHA, eAN1, { from: 'top', to: 'bottom', ...ac })
    fig.arrow(eAN1, eFF, { from: 'top', to: 'bottom', ...ac })
    fig.arrow(eFF, eAN2, { from: 'top', to: 'bottom', ...ac })
    fig.arrow(dMasked, dAN1, { from: 'top', to: 'bottom', ...ac })
    fig.arrow(dAN1, dCross, { from: 'top', to: 'bottom', ...ac })
    fig.arrow(dCross, dAN2, { from: 'top', to: 'bottom', ...ac })
    fig.arrow(dAN2, dFF, { from: 'top', to: 'bottom', ...ac })
    fig.arrow(dFF, dAN3, { from: 'top', to: 'bottom', ...ac })
    fig.arrow(dAN3, linear, { from: 'top', to: 'bottom', ...ac })
    fig.arrow(linear, softmax, { from: 'top', to: 'bottom', ...ac })

    // Cross-attention: encoder → decoder
    fig.arrow(eAN2, dCross, {
      from: 'top', to: 'left', path: 'polyline', curve: 63, cornerRadius: 12, ...ac,
    })

    // Embedding → ⊕ → first block
    fig.arrow(eEmbed, ePlus, { from: 'top', to: 'bottom', ...ac })
    fig.arrow(ePlus, eMHA, { from: 'top', to: 'bottom', ...ac })
    fig.arrow(dEmbed, dPlus, { from: 'top', to: 'bottom', ...ac })
    fig.arrow(dPlus, dMasked, { from: 'top', to: 'bottom', ...ac })

    // Residual connections (bypass arrows on sides)
    fig.arrow(eMHA, eAN1, { from: 'left', to: 'left', path: 'polyline', curve: 35, cornerRadius: 10, ...ac })
    fig.arrow(eFF, eAN2, { from: 'left', to: 'left', path: 'polyline', curve: 35, cornerRadius: 10, ...ac })
    fig.arrow(dMasked, dAN1, { from: 'right', to: 'right', path: 'polyline', curve: 35, cornerRadius: 10, ...ac })
    fig.arrow(dCross, dAN2, { from: 'right', to: 'right', path: 'polyline', curve: 35, cornerRadius: 10, ...ac })
    fig.arrow(dFF, dAN3, { from: 'right', to: 'right', path: 'polyline', curve: 35, cornerRadius: 10, ...ac })

    await fig.export('transformer.svg', { fit: true, margin: 30 })
    await fig.export('transformer.png', { fit: true, margin: 30, scale: 2 })
  }

  main()
`

// --- CLI entry ---

const args = process.argv.slice(2)
const cmd = args[0]?.toLowerCase()

const ALL_SECTIONS = [HELP_FIGURE, HELP_ELEMENTS, HELP_ARROWS, HELP_LAYOUT, HELP_EXPORT, HELP_CONFIG]
const SEPARATOR = '\n' + '='.repeat(70) + '\n'

if (!cmd || cmd === 'help' || cmd === '--help' || cmd === '-h') {
  const topic = args[1]?.toLowerCase()
  if (!topic) {
    // 无参数：输出全部内容
    console.log(HELP_HEADER)
    console.log(SEPARATOR)
    console.log(ALL_SECTIONS.join(SEPARATOR))
  } else {
    const topics: Record<string, string> = {
      figure: HELP_FIGURE,
      elements: HELP_ELEMENTS,
      arrows: HELP_ARROWS,
      layout: HELP_LAYOUT,
      export: HELP_EXPORT,
      config: HELP_CONFIG,
      ai: HELP_AI,
    }
    if (topics[topic]) {
      console.log(topics[topic])
    } else {
      console.log(`Unknown topic: "${topic}"`)
      console.log(`Available topics: ${Object.keys(topics).join(', ')}`)
    }
  }
} else if (cmd === '--version' || cmd === '-v') {
  console.log(`figcraft v${VERSION}`)
} else {
  console.log(`Unknown command: "${cmd}"`)
  console.log('Run "figcraft help" for usage information.')
}
