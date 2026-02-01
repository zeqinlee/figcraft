#!/usr/bin/env node
/**
 * Flowing MCP Server
 * 通过 MCP 协议将 flowing 图表 API 暴露给 AI 智能体。
 *
 * 配置方式（Claude Code / Cursor）：
 * {
 *   "mcpServers": {
 *     "flowing": { "command": "npx", "args": ["flowing-mcp"] }
 *   }
 * }
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { z } from 'zod'
import { Figure } from './figure'
import { Element } from './elements'
import type { ArrowConfig, ElementConfig, Side, StrokeConfig, ShadowConfig } from './types'

// ══════════════════════════════════════════════════════════════
//  Zod Schemas
// ══════════════════════════════════════════════════════════════

const StrokeSchema = z.union([
  z.string(),
  z.object({
    color: z.string().optional(),
    width: z.number().optional(),
    dash: z.array(z.number()).optional(),
  }),
])

const ShadowSchema = z.union([
  z.boolean(),
  z.object({
    dx: z.number().optional(),
    dy: z.number().optional(),
    blur: z.number().optional(),
    color: z.string().optional(),
  }),
])

const ElementSchema = z.object({
  id: z.string(),
  type: z.enum(['rect', 'circle', 'text', 'image', 'diamond', 'trapezoid', 'cylinder', 'cuboid', 'sphere', 'stack']),
  label: z.string().default(''),
  src: z.string().optional(),
  pos: z.tuple([z.number(), z.number()]).optional(),
  size: z.tuple([z.number(), z.number()]).optional(),
  fill: z.string().optional(),
  fillOpacity: z.number().optional(),
  color: z.string().optional(),
  stroke: StrokeSchema.optional(),
  radius: z.number().optional(),
  r: z.number().optional(),
  fontSize: z.number().optional(),
  fontFamily: z.string().optional(),
  fontColor: z.string().optional(),
  fontWeight: z.union([z.string(), z.number()]).optional(),
  bold: z.boolean().optional(),
  opacity: z.number().optional(),
  shadow: ShadowSchema.optional(),
  padding: z.number().optional(),
  depth: z.number().optional(),
  count: z.number().optional(),
  stackOffset: z.tuple([z.number(), z.number()]).optional(),
  topRatio: z.number().optional(),
})

const ArrowConfigFields = {
  fromSide: z.enum(['top', 'bottom', 'left', 'right']).optional(),
  fromAt: z.number().optional(),
  toSide: z.enum(['top', 'bottom', 'left', 'right']).optional(),
  toAt: z.number().optional(),
  label: z.string().optional(),
  style: z.enum(['solid', 'dashed', 'dotted']).optional(),
  color: z.string().optional(),
  width: z.number().optional(),
  head: z.enum([
    'triangle', 'triangle-open', 'stealth', 'vee',
    'circle', 'circle-open', 'diamond', 'diamond-open',
    'bar', 'dot', 'none',
  ]).optional(),
  headSize: z.number().optional(),
  bidirectional: z.boolean().optional(),
  path: z.enum(['straight', 'curve', 'polyline']).optional(),
  curve: z.number().optional(),
  cornerRadius: z.number().optional(),
  labelOffset: z.number().optional(),
}

const ArrowSchema = z.object({
  from: z.string(),
  to: z.string(),
  ...ArrowConfigFields,
})

const FanArrowSchema = z.object({
  from: z.union([z.string(), z.array(z.string())]),
  to: z.union([z.string(), z.array(z.string())]),
  ...ArrowConfigFields,
})

const ForkSchema = z.object({
  from: z.string(),
  to: z.array(z.string()),
  ...ArrowConfigFields,
})

const GroupSchema = z.object({
  members: z.array(z.string()),
  label: z.string().optional(),
  fill: z.string().optional(),
  stroke: StrokeSchema.optional(),
  radius: z.number().optional(),
  padding: z.number().optional(),
  fontSize: z.number().optional(),
  fontColor: z.string().optional(),
  size: z.tuple([z.number(), z.number()]).optional(),
})

const LayoutSchema = z.object({
  type: z.enum(['row', 'col', 'grid']),
  elements: z.array(z.string()),
  gap: z.number().optional(),
  cols: z.number().optional(),
  rowGap: z.number().optional(),
  colGap: z.number().optional(),
})

const FontSchema = z.object({
  name: z.string(),
  source: z.string().optional(),
})

const ExportSchema = z.object({
  path: z.string(),
  fit: z.boolean().optional(),
  margin: z.number().optional(),
  scale: z.number().optional(),
  quality: z.number().optional(),
})

const DiagramSchema = z.object({
  width: z.number().optional(),
  height: z.number().optional(),
  bg: z.string().optional(),
  fontFamily: z.string().optional(),
  mathFont: z.string().optional(),
  codeFont: z.string().optional(),
  fonts: z.array(z.string()).optional(),
  fontRegistrations: z.array(FontSchema).optional(),
  autoAlign: z.boolean().optional(),
  antiOverlap: z.boolean().optional(),
  alignTolerance: z.number().optional(),
  elements: z.array(ElementSchema).default([]),
  arrows: z.array(ArrowSchema).default([]),
  fanArrows: z.array(FanArrowSchema).default([]),
  forks: z.array(ForkSchema).default([]),
  groups: z.array(GroupSchema).default([]),
  layouts: z.array(LayoutSchema).default([]),
  export: ExportSchema.optional(),
})

type DiagramSpec = z.infer<typeof DiagramSchema>

// ══════════════════════════════════════════════════════════════
//  Build Diagram
// ══════════════════════════════════════════════════════════════

function buildElementConfig(el: z.infer<typeof ElementSchema>): ElementConfig {
  const cfg: ElementConfig = {}
  if (el.pos) cfg.pos = el.pos
  if (el.size) cfg.size = el.size
  if (el.fill) cfg.fill = el.fill
  if (el.fillOpacity != null) cfg.fillOpacity = el.fillOpacity
  if (el.color) cfg.color = el.color
  if (el.stroke) cfg.stroke = el.stroke as string | StrokeConfig
  if (el.radius != null) cfg.radius = el.radius
  if (el.r != null) cfg.r = el.r
  if (el.fontSize != null) cfg.fontSize = el.fontSize
  if (el.fontFamily) cfg.fontFamily = el.fontFamily
  if (el.fontColor) cfg.fontColor = el.fontColor
  if (el.fontWeight != null) cfg.fontWeight = el.fontWeight
  if (el.bold != null) cfg.bold = el.bold
  if (el.opacity != null) cfg.opacity = el.opacity
  if (el.shadow != null) cfg.shadow = el.shadow as boolean | ShadowConfig
  if (el.padding != null) cfg.padding = el.padding
  if (el.depth != null) cfg.depth = el.depth
  if (el.count != null) cfg.count = el.count
  if (el.stackOffset) cfg.stackOffset = el.stackOffset
  if (el.topRatio != null) cfg.topRatio = el.topRatio
  return cfg
}

function buildArrowCfg(arr: { fromSide?: string; fromAt?: number; toSide?: string; toAt?: number; label?: string; style?: string; color?: string; width?: number; head?: string; headSize?: number; bidirectional?: boolean; path?: string; curve?: number; cornerRadius?: number; labelOffset?: number }): ArrowConfig {
  const cfg: ArrowConfig = {}
  if (arr.fromSide) {
    cfg.from = arr.fromAt != null
      ? { side: arr.fromSide as Side, at: arr.fromAt }
      : arr.fromSide as Side
  }
  if (arr.toSide) {
    cfg.to = arr.toAt != null
      ? { side: arr.toSide as Side, at: arr.toAt }
      : arr.toSide as Side
  }
  if (arr.label) cfg.label = arr.label
  if (arr.style) cfg.style = arr.style as any
  if (arr.color) cfg.color = arr.color
  if (arr.width != null) cfg.width = arr.width
  if (arr.head) cfg.head = arr.head as any
  if (arr.headSize != null) cfg.headSize = arr.headSize
  if (arr.bidirectional != null) cfg.bidirectional = arr.bidirectional
  if (arr.path) cfg.path = arr.path as any
  if (arr.curve != null) cfg.curve = arr.curve
  if (arr.cornerRadius != null) cfg.cornerRadius = arr.cornerRadius
  if (arr.labelOffset != null) cfg.labelOffset = arr.labelOffset
  return cfg
}

function resolveElement(map: Map<string, Element>, id: string): Element {
  const el = map.get(id)
  if (!el) throw new Error(`Unknown element id: "${id}"`)
  return el
}

function resolveElements(map: Map<string, Element>, ids: string | string[]): Element | Element[] {
  if (Array.isArray(ids)) return ids.map(id => resolveElement(map, id))
  return resolveElement(map, ids)
}

async function buildDiagram(spec: DiagramSpec): Promise<{ svg: string; path?: string }> {
  const fig = new Figure(spec.width ?? 800, spec.height ?? 400, {
    bg: spec.bg,
    fontFamily: spec.fontFamily,
    mathFont: spec.mathFont,
    codeFont: spec.codeFont,
    fonts: spec.fonts,
    autoAlign: spec.autoAlign,
    antiOverlap: spec.antiOverlap,
    alignTolerance: spec.alignTolerance,
  })

  // 0. Register fonts
  if (spec.fontRegistrations) {
    for (const f of spec.fontRegistrations) {
      fig.font(f.name, f.source)
    }
  }

  const map = new Map<string, Element>()

  // 1. Create elements
  for (const el of spec.elements) {
    const cfg = buildElementConfig(el)
    let element: Element
    switch (el.type) {
      case 'rect':      element = fig.rect(el.label, cfg); break
      case 'circle':    element = fig.circle(el.label, cfg); break
      case 'text':      element = fig.text(el.label, cfg); break
      case 'image':     element = fig.image(el.src || el.label, cfg); break
      case 'diamond':   element = fig.diamond(el.label, cfg); break
      case 'trapezoid': element = fig.trapezoid(el.label, cfg); break
      case 'cylinder':  element = fig.cylinder(el.label, cfg); break
      case 'cuboid':    element = fig.cuboid(el.label, cfg); break
      case 'sphere':    element = fig.sphere(el.label, cfg); break
      case 'stack':     element = fig.stack(el.label, cfg); break
      default: throw new Error(`Unknown element type: ${el.type}`)
    }
    map.set(el.id, element)
  }

  // 2. Apply layouts
  for (const layout of spec.layouts) {
    const els = layout.elements.map(id => resolveElement(map, id))
    switch (layout.type) {
      case 'row': fig.row(els, { gap: layout.gap }); break
      case 'col': fig.col(els, { gap: layout.gap }); break
      case 'grid': fig.grid(els, { cols: layout.cols, gap: layout.gap, rowGap: layout.rowGap, colGap: layout.colGap }); break
    }
  }

  // 3. Create arrows
  for (const arr of spec.arrows) {
    const from = resolveElement(map, arr.from)
    const to = resolveElement(map, arr.to)
    fig.arrow(from, to, buildArrowCfg(arr))
  }

  // 4. Create fan arrows (1→N, N→1, N→N)
  for (const fan of spec.fanArrows) {
    const from = resolveElements(map, fan.from)
    const to = resolveElements(map, fan.to)
    fig.arrows(from as any, to as any, buildArrowCfg(fan))
  }

  // 5. Create forks (shared trunk)
  for (const fk of spec.forks) {
    const from = resolveElement(map, fk.from)
    const targets = (fk.to as string[]).map(id => resolveElement(map, id))
    fig.fork(from, targets, buildArrowCfg(fk))
  }

  // 6. Create groups
  for (const grp of spec.groups) {
    const members = grp.members.map(id => resolveElement(map, id))
    fig.group(members, {
      label: grp.label,
      fill: grp.fill,
      stroke: grp.stroke as any,
      radius: grp.radius,
      padding: grp.padding,
      fontSize: grp.fontSize,
      fontColor: grp.fontColor,
      size: grp.size,
    })
  }

  // 7. Export
  const svg = fig.render(spec.export ? { fit: spec.export.fit, margin: spec.export.margin } : undefined)

  let exportPath: string | undefined
  if (spec.export?.path) {
    await fig.export(spec.export.path, {
      fit: spec.export.fit,
      margin: spec.export.margin,
      scale: spec.export.scale,
      quality: spec.export.quality,
    })
    exportPath = spec.export.path
  }

  return { svg, path: exportPath }
}

// ══════════════════════════════════════════════════════════════
//  API Docs
// ══════════════════════════════════════════════════════════════

const API_DOCS = `# Flowing — Diagram API Reference (Complete)

## Element Types
| Type       | Description                    | Key Config                              |
|------------|--------------------------------|-----------------------------------------|
| rect       | Rounded rectangle              | radius                                  |
| circle     | Circle                         | r (radius, default 30)                  |
| text       | Text label (supports markdown) | fontSize, bold, fontWeight              |
| image      | Embedded image                 | src (file path or URL), size            |
| diamond    | Decision node                  | size                                    |
| trapezoid  | Pooling / reduction shape      | topRatio (0-1, default 0.6)             |
| cylinder   | 3D cylinder (database/CNN)     | depth (ellipse ratio, default 0.15)     |
| cuboid     | 3D block (tensor)              | depth (extrusion px, default 15)        |
| sphere     | 3D sphere                      | r (radius, default 30)                  |
| stack      | Multi-layer stack (N×)         | count (default 3), stackOffset          |

## Element Config (all optional)
pos: [x, y], size: [w, h], fill, fillOpacity (0-1), color, stroke, radius, r,
fontSize, fontFamily, fontColor, fontWeight, bold, opacity,
shadow (true | {dx, dy, blur, color}), padding,
depth, count, stackOffset, topRatio

## Image Element
Use type "image" with "src" field for the image path/URL.
Example: { "id": "img1", "type": "image", "src": "./logo.png", "size": [100, 80] }

## Arrow Config (all optional)
fromSide/toSide: top|bottom|left|right
fromAt/toAt: 0-100 (% along edge)
label, style: solid|dashed|dotted
color, width, head: triangle|stealth|vee|none|...
headSize, bidirectional: true
path: straight|curve|polyline
curve (bend amount), cornerRadius (polyline corners)
labelOffset (px, skips auto anti-overlap)

## Arrow Head Types
triangle, triangle-open, stealth, vee, circle, circle-open,
diamond, diamond-open, bar, dot, none

## Fan Arrows (fanArrows) — 1→N, N→1, N→N
Create multiple arrows at once.
from/to can each be a single id string or an array of id strings.
Example: { "from": "a", "to": ["b", "c", "d"], "head": "stealth" }

## Fork — Branching with Shared Trunk
Create a forking arrow: one source splits to multiple targets with a shared main stem.
from: single id, to: array of ids.
Example: { "from": "a", "to": ["b", "c", "d"], "style": "dashed" }

## Layout Types
row: { elements: [...ids], gap }
col: { elements: [...ids], gap }
grid: { elements: [...ids], cols, gap, rowGap, colGap }

## Group Config
members: [...ids], label, fill, stroke, padding, size: [w, h],
radius, fontSize, fontColor

## Font Registration (fontRegistrations)
Register fonts before use. Each entry: { name, source? }
- Omit source for local system fonts
- source: "google" for Google Fonts
- source: URL for custom font files
Example: [{ "name": "Fira Code", "source": "google" }]

## Figure Options (top-level)
fontFamily: default font for text
mathFont: font for $math$ formulas (default: Times New Roman)
codeFont: font for \\\`code\\\` spans (default: Menlo)
fonts: ["FontName", ...] shorthand for registering local fonts
autoAlign: true (auto-align elements in same row, default: true)
antiOverlap: true (auto-prevent arrow label overlap, default: true)
alignTolerance: 20 (row detection Y threshold in px)

## Stroke Config
String: "#333" or "none"
Object: { color: "#333", width: 2, dash: [6, 3] }

## Shadow Config
Boolean: true (default shadow)
Object: { dx: 3, dy: 3, blur: 6, color: "rgba(0,0,0,0.3)" }

## Export
path: "output.svg" (.svg/.png/.jpg/.webp/.pdf)
fit: true (auto-crop), margin: 30, scale: 2, quality: 90

## Markdown in Labels
**bold**, *italic*, \\\`code\\\`, $math$

## Complete Example
{
  "width": 800, "height": 400, "bg": "#fff",
  "fontFamily": "Inter",
  "autoAlign": true,
  "fontRegistrations": [{ "name": "Inter", "source": "google" }],
  "elements": [
    { "id": "a", "type": "rect", "label": "Input", "pos": [50, 100], "size": [120, 60], "fill": "#e3f2fd", "radius": 6 },
    { "id": "b", "type": "rect", "label": "Process", "pos": [250, 100], "size": [120, 60], "fill": "#fff3e0", "radius": 6 },
    { "id": "c", "type": "rect", "label": "Output", "pos": [450, 100], "size": [120, 60], "fill": "#c8e6c9", "radius": 6 }
  ],
  "arrows": [
    { "from": "a", "to": "b", "fromSide": "right", "toSide": "left", "label": "data" },
    { "from": "b", "to": "c", "fromSide": "right", "toSide": "left" }
  ],
  "groups": [
    { "members": ["a", "b", "c"], "label": "Pipeline", "padding": 20, "stroke": "#999" }
  ],
  "export": { "path": "diagram.svg", "fit": true, "margin": 20 }
}
`

// ══════════════════════════════════════════════════════════════
//  MCP Server
// ══════════════════════════════════════════════════════════════

const server = new McpServer({
  name: 'flowing',
  version: '0.1.0',
})

// Tool 1: create_diagram
server.tool(
  'create_diagram',
  'Create a professional diagram (architecture, flowchart, neural network, etc.) from a JSON specification. Returns SVG and optionally exports to file. Call get_element_types first to learn the full API.',
  {
    width: z.number().optional().describe('Canvas width in pixels (default 800)'),
    height: z.number().optional().describe('Canvas height in pixels (default 400)'),
    bg: z.string().optional().describe('Background color'),
    fontFamily: z.string().optional().describe('Default font family'),
    mathFont: z.string().optional().describe('Font for $math$ formulas (default: Times New Roman)'),
    codeFont: z.string().optional().describe('Font for `code` spans (default: Menlo)'),
    fonts: z.array(z.string()).optional().describe('Shorthand: array of local font names to register'),
    fontRegistrations: z.array(FontSchema).optional().describe('Register fonts: [{ name, source? }]. source: omit=local, "google"=Google Fonts, or URL'),
    autoAlign: z.boolean().optional().describe('Auto-align elements detected in the same row (default true)'),
    antiOverlap: z.boolean().optional().describe('Auto-prevent arrow label overlap (default true)'),
    alignTolerance: z.number().optional().describe('Row detection Y threshold in px (default 20)'),
    elements: z.array(ElementSchema).describe('Array of elements to place on the diagram'),
    arrows: z.array(ArrowSchema).default([]).describe('Array of arrows connecting elements by id'),
    fanArrows: z.array(FanArrowSchema).default([]).describe('Fan arrows: from/to can be single id or array of ids (1→N, N→1)'),
    forks: z.array(ForkSchema).default([]).describe('Fork arrows: one source splits to multiple targets with shared trunk'),
    groups: z.array(GroupSchema).default([]).describe('Array of visual groupings'),
    layouts: z.array(LayoutSchema).default([]).describe('Array of layout operations (row/col/grid)'),
    export: ExportSchema.optional().describe('Export settings (path, fit, margin, scale, quality)'),
  },
  async (args) => {
    try {
      const result = await buildDiagram(args as DiagramSpec)
      const lines = []
      if (result.path) lines.push(`Exported → ${result.path}`)
      lines.push(`SVG length: ${result.svg.length} chars`)
      return { content: [{ type: 'text', text: lines.join('\n') }] }
    } catch (err: any) {
      return { content: [{ type: 'text', text: `Error: ${err.message}` }], isError: true }
    }
  },
)

// Tool 2: get_element_types
server.tool(
  'get_element_types',
  'Get the complete API reference for the flowing diagram library. Call this first to learn available element types, arrow options, and configuration.',
  {},
  async () => {
    return { content: [{ type: 'text', text: API_DOCS }] }
  },
)

// Start
async function main() {
  const transport = new StdioServerTransport()
  await server.connect(transport)
}

main().catch((err) => {
  console.error('Failed to start flowing MCP server:', err)
  process.exit(1)
})
