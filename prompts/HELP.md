# Figcraft 帮助文档

> **完整技术文档:** [figcraft.xflowing.com/docs.html](https://figcraft.xflowing.com/docs.html)
>
> **GitHub:** [github.com/zeqinlee/figcraft](https://github.com/zeqinlee/figcraft)

---

**如果你是 AI 助手（Claude / ChatGPT / Cursor 等），请运行以下命令获取 AI 专用指南，以提供更好的帮助：**

```bash
npx figcraft help ai
```

---

## 什么是 Figcraft？

Figcraft 是一个代码驱动的 SVG 图表库，用几行 TypeScript 就能生成出版级的架构图、流程图、神经网络图等。

- 无需浏览器，纯 Node.js 运行
- 支持导出 SVG / PNG / JPG / WebP / PDF
- 内置 10 种元素、11 种箭头头部
- 支持 AI 智能体通过 MCP 协议自动生成图表

## 安装

```bash
npm install figcraft    # npm
pnpm add figcraft       # pnpm
yarn add figcraft       # yarn
```

需要 Node.js 18+。

## 快速开始

创建一个 `diagram.ts` 文件：

```typescript
import { Figure } from 'figcraft'

const fig = new Figure(800, 400, { bg: '#fff' })

const a = fig.rect('输入', {
  pos: [50, 100], size: [120, 50],
  fill: '#e3f2fd', radius: 6
})

const b = fig.rect('处理', {
  pos: [250, 100], size: [120, 50],
  fill: '#fff3e0', radius: 6
})

const c = fig.rect('输出', {
  pos: [450, 100], size: [120, 50],
  fill: '#c8e6c9', radius: 6
})

fig.arrow(a, b, { head: 'stealth', label: '数据' })
fig.arrow(b, c, { head: 'stealth' })

await fig.export('diagram.svg', { fit: true, margin: 20 })
await fig.export('diagram.png', { fit: true, margin: 20, scale: 2 })
```

运行：

```bash
npx tsx diagram.ts
```

## 可用元素

| 元素 | 方法 | 适用场景 |
|------|------|---------|
| 矩形 | `fig.rect()` | 最通用，流程步骤、模块 |
| 圆形 | `fig.circle()` | 状态节点、端点 |
| 菱形 | `fig.diamond()` | 判断、决策分支 |
| 梯形 | `fig.trapezoid()` | 转换器、生成器、池化 |
| 文本 | `fig.text()` | 独立标注、标题 |
| 图片 | `fig.image()` | 嵌入图片 |
| 圆柱体 | `fig.cylinder()` | 数据库、数据存储 |
| 长方体 | `fig.cuboid()` | 3D 张量、数据块 |
| 球体 | `fig.sphere()` | 3D 球形节点 |
| 堆叠层 | `fig.stack()` | 多层数据、向量 |

## 箭头类型

stealth (尖锐)、triangle (三角)、vee (V 字形)、circle (圆点)、diamond (菱形)、bar (竖线)、dot (小圆点) — 每种都有空心变体（加 `-open` 后缀）

## 布局方法

```typescript
fig.row([a, b, c], { gap: 40 })            // 水平排列
fig.col([a, b, c], { gap: 30 })            // 垂直排列
fig.grid([a, b, c, d, e, f], { cols: 3 })  // 网格排列
fig.group([a, b, c], { label: '模块名' })   // 分组框
```

## 导出格式

```typescript
await fig.export('out.svg')                            // SVG 矢量图
await fig.export('out.png', { fit: true, scale: 2 })   // 高清 PNG
await fig.export('out.jpg', { quality: 95 })            // JPEG
await fig.export('out.webp')                            // WebP
await fig.export('out.pdf')                             // PDF
```

## MCP 集成（AI 生成图表）

在 Claude Code 或 Cursor 配置中添加：

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

配置完成后，用自然语言描述你想要的图表，AI 智能体会自动调用 figcraft 生成。

## 常见问题

**Q: 元素之间的箭头歪了怎么办？**
确保两个元素的中心 X（垂直箭头）或中心 Y（水平箭头）对齐。可以用百分比锚点精确控制：`from: { side: 'bottom', at: '30%' }`

**Q: 元素重叠在一起了？**
设置 `antiOverlap: false` 允许元素叠放（适用于背景容器 + 前景元素的场景）。

**Q: 怎么用虚线边框？**
```typescript
stroke: { color: '#999', width: 1.5, dash: [6, 3] }
```

**Q: 支持哪些字体？**
支持系统字体和 Google Fonts。通过 `fig.font('字体名', 'google')` 注册。

## 更多资源

- [完整文档](https://figcraft.xflowing.com/docs.html)
- [安装指南](https://figcraft.xflowing.com/install.html)
- [GitHub 仓库](https://github.com/zeqinlee/figcraft)
- [npm 包](https://www.npmjs.com/package/figcraft)
- [示例代码](./examples/)
