<div align="center">

<img src="assets/logo.svg" width="80" alt="Figcraft logo">

# Figcraft

**Code-driven SVG diagram library for TypeScript / Node.js**

By <a href="https://xflowing.com/"><strong>XFlow</strong></a> · Write a few lines of TypeScript, get publication-ready architecture diagrams.

[![npm version](https://img.shields.io/npm/v/figcraft?color=cb3837&label=npm)](https://www.npmjs.com/package/figcraft)
[![license](https://img.shields.io/npm/l/figcraft?color=blue)](./LICENSE)
[![node](https://img.shields.io/badge/node-%3E%3D18-brightgreen)](https://nodejs.org/)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://github.com/zeqinlee/figcraft/pulls)

[Website](https://figcraft.xflowing.com/) · [Documentation](https://figcraft.xflowing.com/docs.html) · [Install](https://figcraft.xflowing.com/install.html) · [GitHub](https://github.com/zeqinlee/figcraft)

---

<img src="gallery/transformer.svg" width="600" alt="Transformer architecture diagram">

<br>

<img src="gallery/image-classification-cnn.svg" width="700" alt="CNN image classification pipeline">

</div>

<br>

## Highlights

| | Feature | |
|---|---|---|
| **10 Shapes** | rect, circle, diamond, trapezoid, text, image, cylinder, cuboid, sphere, stack | 2D + 3D |
| **11 Arrow Heads** | triangle, stealth, vee, circle, diamond, bar, dot + open variants | Fully customizable |
| **Smart Layout** | `row()` `col()` `grid()` `group()` | Auto-alignment |
| **Markdown Labels** | `**bold**` `*italic*` `` `code` `` `$math$` | In any element |
| **Multi-format** | SVG, PNG, JPG, WebP, PDF | `fit` auto-crop |
| **MCP** | AI agents generate diagrams via natural language | Claude / Cursor |
| **Zero Browser** | Runs entirely in Node.js | Server-side ready |

## Install

```bash
npm install figcraft        # npm
pnpm add figcraft           # pnpm
yarn add figcraft           # yarn
```

> Requires Node.js 18+

## Quick Start

```typescript
import { Figure } from 'figcraft'

const fig = new Figure(800, 400, { bg: '#fff' })

const a = fig.rect('Input', {
  pos: [50, 100], size: [120, 50],
  fill: '#e3f2fd', radius: 6
})

const b = fig.rect('Output', {
  pos: [250, 100], size: [120, 50],
  fill: '#c8e6c9', radius: 6
})

fig.arrow(a, b, { head: 'stealth', label: 'data' })

await fig.export('diagram.svg', { fit: true, margin: 20 })
```

```bash
npx tsx diagram.ts
```

## Elements

| Type | Method | Description |
|:-----|:-------|:------------|
| Rect | `fig.rect()` | Rounded rectangle |
| Circle | `fig.circle()` | Circle |
| Diamond | `fig.diamond()` | Decision node |
| Trapezoid | `fig.trapezoid()` | Pooling / reduction |
| Text | `fig.text()` | Markdown text label |
| Image | `fig.image()` | Embedded image |
| Cylinder | `fig.cylinder()` | 3D cylinder (database) |
| Cuboid | `fig.cuboid()` | 3D cuboid (tensor) |
| Sphere | `fig.sphere()` | 3D sphere |
| Stack | `fig.stack()` | Multi-layer stack |

## Arrows

```typescript
fig.arrow(a, b)                                      // default
fig.arrow(a, b, { head: 'stealth', color: '#1565c0' }) // styled

// Anchors
fig.arrow(a, b, { from: 'right', to: 'left' })
fig.arrow(a, b, {
  from: { side: 'bottom', at: 30 },
  to: { side: 'top', at: 70 }
})

// Paths
fig.arrow(a, b, { path: 'curve', curve: 40 })
fig.arrow(a, b, { path: 'polyline', cornerRadius: 8 })

// Styles
fig.arrow(a, b, { style: 'dashed', bidirectional: true })

// Fan & Fork
fig.arrows(src, [a, b, c], { head: 'stealth' })  // fan-out
fig.fork(src, [a, b, c], { head: 'stealth' })     // shared trunk
```

## Layout

```typescript
fig.row([a, b, c], { gap: 40 })            // horizontal
fig.col([a, b, c], { gap: 30 })            // vertical
fig.grid([a, b, c, d, e, f], { cols: 3 })  // grid
fig.group([a, b, c], { label: 'Pipeline' }) // group box
```

## Export

```typescript
await fig.export('out.svg')                           // SVG vector
await fig.export('out.png', { fit: true, scale: 3 })  // high-res PNG
await fig.export('out.jpg', { quality: 95 })           // JPEG
await fig.export('out.webp')                           // WebP
await fig.export('out.pdf')                            // PDF

const svg = fig.render({ fit: true })                  // SVG string
```

## MCP Integration

Let AI agents create diagrams for you. Add to Claude Code or Cursor config:

```json
{
  "mcpServers": {
    "figcraft": {
      "command": "npx",
      "args": ["figcraft-mcp"]
    }
  }
}
```

Then just describe what you want in natural language.

## Contributing

Contributions are welcome! Feel free to open an [issue](https://github.com/zeqinlee/figcraft/issues) or submit a [pull request](https://github.com/zeqinlee/figcraft/pulls).

## Links

- [Website](https://figcraft.xflowing.com/)
- [Documentation](https://figcraft.xflowing.com/docs.html)
- [npm](https://www.npmjs.com/package/figcraft)
- [GitHub](https://github.com/zeqinlee/figcraft)

## License

[MIT](./LICENSE) — Made by [XFlow](https://xflowing.com/)
