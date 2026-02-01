# Figcraft

代码驱动的 SVG 图表库，适用于 TypeScript / Node.js。

写几行 TypeScript，生成专业级架构图 — 支持 SVG、PNG、JPG、WebP、PDF。

[![npm version](https://img.shields.io/npm/v/figcraft)](https://www.npmjs.com/package/figcraft)
[![license](https://img.shields.io/npm/l/figcraft)](./LICENSE)

<p align="center">
  <img src="https://figcraft.xflowing.com/assets/diagrams/flowchart.svg" width="600" alt="Figcraft 示例输出">
</p>

## 特性

- **10 种元素类型** — 矩形、圆形、菱形、梯形、文本、图片、圆柱体、长方体、球体、堆叠层
- **11 种箭头头部** — triangle、stealth、vee、circle、diamond、bar、dot 及其空心变体
- **智能布局** — `row()`、`col()`、`grid()`、`group()`，自动对齐
- **Markdown 标签** — 任何元素内支持 `**粗体**`、`*斜体*`、`` `代码` ``、`$数学公式$`
- **多格式导出** — SVG、PNG、JPG、WebP、PDF，支持 `fit` 自动裁剪
- **MCP 集成** — AI 智能体通过自然语言直接生成图表
- **零浏览器依赖** — 完全在 Node.js 中运行

## 安装

```bash
npm install figcraft
```

需要 Node.js 18+。

## 快速开始

创建 `diagram.ts`：

```typescript
import { Figure } from 'figcraft'

const fig = new Figure(800, 400, { bg: '#fff' })

const a = fig.rect('输入', {
  pos: [50, 100], size: [120, 50],
  fill: '#e3f2fd', radius: 6
})

const b = fig.rect('输出', {
  pos: [250, 100], size: [120, 50],
  fill: '#c8e6c9', radius: 6
})

fig.arrow(a, b, { head: 'stealth', label: 'data' })

await fig.export('diagram.svg', { fit: true, margin: 20 })
```

运行：

```bash
npx tsx diagram.ts
```

## 元素类型

| 类型 | 方法 | 说明 |
|------|------|------|
| 矩形 | `fig.rect()` | 圆角矩形 |
| 圆形 | `fig.circle()` | 圆形 |
| 菱形 | `fig.diamond()` | 决策菱形 |
| 梯形 | `fig.trapezoid()` | 梯形（池化层） |
| 文本 | `fig.text()` | 支持 Markdown 的文本标签 |
| 图片 | `fig.image()` | 嵌入图片 |
| 圆柱体 | `fig.cylinder()` | 3D 圆柱体（数据库） |
| 长方体 | `fig.cuboid()` | 3D 长方体（张量） |
| 球体 | `fig.sphere()` | 3D 球体 |
| 堆叠层 | `fig.stack()` | 多层堆叠 |

## 箭头

```typescript
// 基本用法
fig.arrow(a, b)
fig.arrow(a, b, { head: 'stealth', color: '#1565c0' })

// 锚点
fig.arrow(a, b, { from: 'right', to: 'left' })
fig.arrow(a, b, {
  from: { side: 'bottom', at: 30 },
  to: { side: 'top', at: 70 }
})

// 路径
fig.arrow(a, b, { path: 'curve', curve: 40 })
fig.arrow(a, b, { path: 'polyline', cornerRadius: 8 })

// 样式
fig.arrow(a, b, { style: 'dashed', bidirectional: true })

// 扇出 / 扇入
fig.arrows(source, [t1, t2, t3], { head: 'stealth' })

// 分支（共享主干）
fig.fork(source, [t1, t2, t3], { head: 'stealth' })
```

## 布局

```typescript
fig.row([a, b, c], { gap: 40 })           // 水平排列
fig.col([a, b, c], { gap: 30 })           // 垂直排列
fig.grid([a, b, c, d, e, f], { cols: 3 }) // 网格排列
fig.group([a, b, c], { label: '流水线' })   // 分组框
```

## 导出

```typescript
await fig.export('out.svg')                          // SVG
await fig.export('out.png', { fit: true, scale: 3 }) // 高分辨率 PNG
await fig.export('out.jpg', { quality: 95 })         // JPG
await fig.export('out.webp')                         // WebP
await fig.export('out.pdf')                          // PDF

const svg = fig.render({ fit: true })                // SVG 字符串
```

## MCP 集成

在 Claude Code 或 Cursor 的 MCP 配置中添加：

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

然后用自然语言描述你的图表 — AI 智能体自动完成。

## 文档

完整文档：[figcraft.xflowing.com](https://figcraft.xflowing.com/)

## 许可证

[MIT](./LICENSE) — by [XFlow](https://xflowing.com/)
