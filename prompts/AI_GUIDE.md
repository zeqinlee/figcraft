# Figcraft — AI 助手专用指南

> 本文档面向 AI 助手（Claude / ChatGPT / Cursor Agent 等），帮助你更好地协助用户使用 figcraft 生成高质量图表。
>
> **CLI 版本:** 本指南也可通过 `npx figcraft help ai` 查看（已内置到 npm 包中）
>
> **完整技术文档:** [figcraft.xflowing.com/docs.html](https://figcraft.xflowing.com/docs.html)
>
> **设计优化技巧:** 另见 `prompts/diagram-optimization.md`

---

## 一、库概述

figcraft 是一个纯 TypeScript / Node.js 的 SVG 图表库。用户写 `.ts` 文件，通过 `npx tsx <file>.ts` 运行生成图表。

```typescript
import { Figure } from 'figcraft'  // 或 from '../src'（本地开发）

const fig = new Figure(width, height, {
  bg: '#fff',           // 背景色
  fontFamily: 'Inter',  // 默认字体
  antiOverlap: false,   // 关闭自动防重叠（叠放元素时必须）
  autoAlign: true,      // 自动行对齐
})
```

运行和导出：

```bash
npx tsx diagram.ts
```

---

## 二、全部元素类型及参数

### 2.1 元素一览

| 方法 | 形状 | 象形语义 | 关键参数 |
|------|------|---------|---------|
| `fig.rect(label, cfg)` | 矩形 | 处理步骤、模块、容器 | `radius`, `padding` |
| `fig.circle(label, cfg)` | 圆形 | 状态、端点 | `r`（半径，默认 30） |
| `fig.diamond(label, cfg)` | 菱形 | 决策、判断 | `size` |
| `fig.trapezoid(label, cfg)` | 梯形 | 转换器、池化层 | `topRatio`（0-1，默认 0.6） |
| `fig.text(label, cfg)` | 文本 | 标注、标题 | `fontSize`, `bold`, `fontColor` |
| `fig.image(src, cfg)` | 图片 | 嵌入图片 | `size` 必填 |
| `fig.cylinder(label, cfg)` | 圆柱体 | 数据库、存储 | `depth`（椭圆比，默认 0.15） |
| `fig.cuboid(label, cfg)` | 长方体 | 张量、数据块 | `depth`（挤出距离，默认 15） |
| `fig.sphere(label, cfg)` | 球体 | 3D 节点 | `r`（半径，默认 30） |
| `fig.stack(label, cfg)` | 堆叠层 | 多层数据、向量 | `count`（层数），`stackOffset` |

### 2.2 通用 ElementConfig

```typescript
interface ElementConfig {
  pos?: [x, y]              // 位置（Rect: 左上角；Circle: 圆心）
  size?: [width, height]    // 尺寸
  fill?: string | 'none'    // 填充色
  fillOpacity?: number      // 填充透明度 0-1
  color?: string            // 主题色简写（同时设置 stroke + fontColor）
  stroke?: string | { color, width, dash }  // 边框
  radius?: number           // 圆角（Rect）
  r?: number                // 半径（Circle / Sphere）
  opacity?: number          // 整体透明度
  shadow?: boolean | { dx, dy, blur, color }
  padding?: number          // 内边距
  fontSize?: number
  fontFamily?: string
  fontColor?: string
  bold?: boolean
  topRatio?: number         // 梯形上/下边比
  count?: number            // Stack 层数
  stackOffset?: [dx, dy]    // Stack 偏移方向
  depth?: number            // 3D 深度
}
```

### 2.3 Markdown 标签

元素 label 支持 Markdown：`**粗体**`、`*斜体*`、`` `代码` ``、`$数学公式$`

---

## 三、箭头系统

### 3.1 基本箭头

```typescript
fig.arrow(elementA, elementB, {
  from?: Side | { side, at },   // 起点锚点
  to?: Side | { side, at },     // 终点锚点
  label?: string,               // 标签文字
  head?: ArrowHead,             // 箭头头部类型
  style?: 'solid' | 'dashed' | 'dotted',
  color?: string,
  width?: number,               // 线宽
  path?: 'straight' | 'curve' | 'polyline',
  curve?: number,               // 曲线弯曲度（正=上弯，负=下弯）
  cornerRadius?: number,        // polyline 拐角圆角
  bidirectional?: boolean,      // 双向箭头
  labelOffset?: number,         // 标签偏移（跳过自动防重叠）
})
```

### 3.2 箭头头部类型

`triangle` | `triangle-open` | `stealth` | `vee` | `circle` | `circle-open` | `diamond` | `diamond-open` | `bar` | `dot` | `none`

学术论文推荐使用 `stealth`。

### 3.3 锚点系统

```typescript
// 简写：从底部中心 → 顶部中心
fig.arrow(a, b, { from: 'bottom', to: 'top' })

// 百分比锚点：精确控制出发/到达位置
fig.arrow(a, b, {
  from: { side: 'right', at: '30%' },
  to: { side: 'left', at: '70%' },
})
```

### 3.4 扇出箭头

```typescript
// 一对多
fig.arrows(source, [t1, t2, t3], { head: 'stealth' })

// 多对一
fig.arrows([s1, s2, s3], target, { head: 'stealth' })
```

### 3.5 智能自动路由（v0.1.2+）

箭头具备完全自动的路径规划能力，**无需手动指定 `from` / `to`**：

```typescript
// 最简用法 — 自动选择最优出发边和到达边
fig.arrow(a, b, { path: 'polyline', head: 'stealth' })
```

**自动路由规则：**
- 系统遍历源和目标的 4 条边（top/bottom/left/right），选择距离最短的锚点对
- Polyline 自动选择水平起步（Z 型）、垂直起步或 U 型环绕模式
- 当方向冲突（如 `from: 'left', to: 'right'`）时自动切换为 U 型环绕路径

**自动避障：**
- Polyline 箭头自动检测路径上的第三方元素并绕行
- 垂直段碰撞 → 左右偏移；水平段碰撞 → U 型绕行
- 多障碍物合并为一个包围盒，单次绕行避免路径震荡
- 绕行方向自动选择空间更大的一侧

**自动拉直：**
- 端点差值 < 8px 时自动吸附为完美水平/垂直，消除微小偏移

**这意味着 AI 生成图表时不需要精确计算锚点方向，系统会自动处理。**
只需指定 `path: 'polyline'` 即可获得智能路由 + 避障 + 拉直的完整体验。

### 3.6 Fork 分叉箭头

```typescript
fig.fork(source, [t1, t2, t3], {
  from: 'bottom', to: 'top',
  head: 'stealth',
  cornerRadius: 6,   // 转角圆滑度
  curve: 15,          // 分叉转弯位置（距源元素距离，建议 = 间距/2）
})
```

---

## 四、布局方法

```typescript
fig.row([a, b, c], { gap: 40 })             // 水平排列
fig.col([a, b, c], { gap: 30 })             // 垂直排列
fig.grid([a, b, c, d, e, f], {              // 网格排列
  cols: 3, gap: 20, rowGap: 30, colGap: 20
})
fig.group([a, b, c], {                      // 分组框
  label: '模块', padding: 20,
  fill: '#f5f5f5', stroke: '#999', radius: 8
})
```

---

## 五、嵌套子元素

父元素返回的对象可以创建子元素，子元素位置用百分比相对父元素定位：

```typescript
const parent = fig.rect('Title', {
  pos: [100, 100], size: [300, 200],
  fill: 'none', color: '#333', radius: 8,
  bold: true, padding: 20,  // padding 为标题留空间
})

// 子元素用百分比定位
parent.rect('子模块 A', {
  pos: ['5%', '25%'], size: ['90%', '20%'],
  fill: '#e3f2fd', radius: 4, fontSize: 10,
})

parent.rect('子模块 B', {
  pos: ['5%', '50%'], size: ['90%', '20%'],
  fill: '#e3f2fd', radius: 4, fontSize: 10,
})
```

---

## 六、导出

```typescript
await fig.export('out.svg', { fit: true, margin: 30 })
await fig.export('out.png', { fit: true, margin: 30, scale: 2 })
await fig.export('out.jpg', { quality: 95 })
await fig.export('out.pdf')
await fig.export('out.webp')

// 仅获取 SVG 字符串
const svgStr = fig.render({ fit: true, margin: 20 })
```

- `fit: true` — 自动裁剪空白区域
- `margin` — 四周留白像素
- `scale: 2` — PNG 高清（论文用）

---

## 七、常用设计模式

### 7.1 背景容器 + 前景元素

用空标签 rect 做分组背景，**必须先创建背景**（SVG 图层顺序），配合 `antiOverlap: false`：

```typescript
const fig = new Figure(800, 500, {
  bg: '#fff',
  antiOverlap: false,   // 必须关闭
})

// 先画背景容器
const envBg = fig.rect('', {
  pos: [20, 20], size: [350, 400],
  fill: '#e0f7fa',
  stroke: { color: '#4dd0e1', width: 1.5, dash: [6, 3] },
  radius: 12,
})

// 再画前景元素（会叠在背景上方）
fig.text('Environment', {
  pos: [195, 40], fontSize: 13, fontColor: '#333', bold: true,
})
const moduleA = fig.rect('Module A', {
  pos: [40, 60], size: [310, 50],
  fill: '#b3e5fc', color: '#333', radius: 4,
})
```

### 7.2 多层嵌套容器

三层：外层容器 → 虚线子容器 → 内部元素。颜色从浅到深递进：

```typescript
// 外层
fig.rect('', { pos: [20, 20], size: [400, 300], fill: '#e0f7fa', ... })

// 子容器（不同底色，虚线边框）
fig.rect('', {
  pos: [30, 50], size: [380, 120],
  fill: '#e1f5fe',
  stroke: { color: '#81d4fa', width: 1.2, dash: [5, 3] },
  radius: 6,
})

// 最内层元素
fig.rect('Item', { pos: [40, 70], size: [170, 35], fill: '#b3e5fc', ... })
```

### 7.3 箭头垂直/水平对齐

**关键原则**：箭头要么纯垂直要么纯水平，不要斜线。

垂直箭头 — 两元素中心 X 相同：
```typescript
const a = fig.rect('A', { pos: [50, 100], size: [200, 40] })  // 中心 X = 150
const b = fig.rect('B', { pos: [50, 200], size: [200, 40] })  // 中心 X = 150
fig.arrow(a, b, { from: 'bottom', to: 'top' })  // 垂直
```

不同宽度元素 — 用百分比锚点：
```typescript
// wide: pos [50, 100], size [300, 50] → 中心 X = 200
// narrow: pos [150, 200], size [100, 50] → 中心 X = 200
// 百分比 = (200 - 50) / 300 = 50% → 默认即可
// 或 = (200 - 50) / 300 = 50%
fig.arrow(wide, narrow, {
  from: { side: 'bottom', at: '50%' }, to: 'top',
})
```

### 7.4 跨容器交互箭头

用百分比锚点在容器边缘均匀分布：

```typescript
fig.arrow(leftBox, rightBox, {
  from: { side: 'right', at: '30%' },
  to: { side: 'left', at: '30%' },
  label: 'Request', head: 'stealth',
})
fig.arrow(rightBox, leftBox, {
  from: { side: 'left', at: '70%' },
  to: { side: 'right', at: '70%' },
  label: 'Response', head: 'stealth', style: 'dashed',
})
```

---

## 八、配色方案参考

### 学术论文 — 使用 Material Design 浅色（50~100 色阶）

方案 A（绿紫）:
```typescript
const envBg   = '#f1f8e9'  // 环境背景 — 浅绿
const agentBg = '#f3e5f5'  // 智能体背景 — 浅紫
const input   = '#fff3e0'  // 输入 — 浅橙
const process = '#e3f2fd'  // 处理 — 浅蓝
const storage = '#e8f5e9'  // 存储 — 浅绿
const output  = '#b2ebf2'  // 输出 — 浅青
const model   = '#ede7f6'  // 模型 — 浅紫
```

方案 B（青金）:
```typescript
const leftBg  = '#e0f7fa'  // 左侧背景 — 浅青
const rightBg = '#fff8e1'  // 右侧背景 — 浅金
const sub     = '#e1f5fe'  // 子容器 — 天蓝
const subR    = '#ffecb3'  // 子容器右 — 琥珀
const item    = '#b3e5fc'  // 元素 — 天蓝
const itemR   = '#ffe0b2'  // 元素右 — 浅橙
const accent  = '#f0f4c3'  // 点缀 — 黄绿
const stack   = '#c5cae9'  // 叠层 — 靛蓝
```

方案 C（纯黑白）— 适合正式出版物:
```typescript
const bk = { fill: 'none', color: '#000' }
const ac = { color: '#000' }
```

### 配色原则

1. 不同功能模块使用不同颜色家族
2. 同一张图中，同一色系内从浅到深表示层级（外层最浅、内层最深）
3. 同一系列的多张图应使用**不同**色系，避免视觉混淆
4. 边框统一深灰 `#333`（不要纯黑），纯黑白风格例外
5. 背景 + 子容器 + 元素至少三个色阶，形成层次感

---

## 九、迭代检查清单

每次生成图表后，检查以下项目：

- [ ] 逻辑正确 — 箭头方向是否符合数据流/控制流？
- [ ] 箭头垂直/水平 — 有没有歪斜的箭头？
- [ ] 元素间距均匀 — 上下左右间距是否一致？
- [ ] 文字可读 — 字号是否过小？是否溢出元素边界？
- [ ] 容器对齐 — 并列容器是否等高、顶部对齐？
- [ ] 颜色层次 — 背景→子容器→元素是否有清晰的层次？
- [ ] 关键模块突出 — 核心组件是否比辅助组件更显眼？
- [ ] 箭头头部方向 — fork 箭头头部是否朝正确方向？
- [ ] 多图色系区分 — 多张图之间配色是否足够不同？

---

## 十、MCP 集成（JSON 模式）

如果通过 MCP 协议使用 figcraft，使用 JSON 格式创建图表：

```json
{
  "width": 800, "height": 400, "bg": "#fff",
  "antiOverlap": false,
  "elements": [
    { "id": "a", "type": "rect", "label": "Input", "pos": [50, 100], "size": [120, 60], "fill": "#e3f2fd", "radius": 6 },
    { "id": "b", "type": "rect", "label": "Output", "pos": [250, 100], "size": [120, 60], "fill": "#c8e6c9", "radius": 6 }
  ],
  "arrows": [
    { "from": "a", "to": "b", "fromSide": "right", "toSide": "left", "head": "stealth", "label": "data" }
  ],
  "forks": [
    { "from": "a", "to": ["b", "c"], "head": "stealth", "cornerRadius": 6 }
  ],
  "export": { "path": "out.svg", "fit": true, "margin": 20 }
}
```

先调用 `get_element_types` 获取完整 API 参考。

---

## 十一、常见错误及解决

| 问题 | 原因 | 解决 |
|------|------|------|
| 元素被背景遮挡 | 背景容器在元素之后创建 | 先创建背景 rect，再创建前景元素 |
| 箭头标签重叠 | `antiOverlap: true`（默认）未生效 | 设置 `labelOffset` 手动调整 |
| 元素互相推开 | `antiOverlap: true` 自动避让 | 设置 `antiOverlap: false` |
| fork 箭头方向反了 | 旧版本 bug | 确认使用最新版本 |
| Stack 元素层数不对 | 默认 `count: 3` | 指定 `count` 和 `stackOffset` |
| 百分比定位不生效 | 非子元素不支持百分比 | 百分比仅在 `parent.rect()` 子元素中有效 |
| 字体不生效 | 未注册字体 | 使用 `fig.font('名称', 'google')` 注册 |
| 箭头穿过其他元素 | 使用了 straight 路径 | 改用 `path: 'polyline'`，系统自动避障 |
| 不知道该指定哪个边 | 不确定 from/to 方向 | 不写 from/to，系统自动选择最优方向 |
