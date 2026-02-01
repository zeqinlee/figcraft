#!/usr/bin/env node

const VERSION = '0.1.0'

const HELP_HEADER = `
Flowing v${VERSION} — Code-driven SVG diagram library

Usage: flowing help [topic]
  Topics: figure, elements, arrows, layout, export, config
  No topic = show all. Use "flowing help <topic>" to show one section.

Quick Start:
  import { Figure } from 'flowing'

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
    }
    if (topics[topic]) {
      console.log(topics[topic])
    } else {
      console.log(`Unknown topic: "${topic}"`)
      console.log(`Available topics: ${Object.keys(topics).join(', ')}`)
    }
  }
} else if (cmd === '--version' || cmd === '-v') {
  console.log(`flowing v${VERSION}`)
} else {
  console.log(`Unknown command: "${cmd}"`)
  console.log('Run "flowing help" for usage information.')
}
