/**
 * 箭头大全 — 展示所有 11 种头部 × 3 种路径 + cornerRadius + fork
 *
 * 运行: npx tsx examples/arrows-demo.ts
 */
import { Figure, ArrowHead } from '../src'

const fig = new Figure(900, 1000, { bg: '#ffffff' })

// ---------- 11 种箭头头部 ----------
const headTypes: ArrowHead[] = [
  'triangle', 'triangle-open', 'stealth', 'vee',
  'circle', 'circle-open',
  'diamond', 'diamond-open',
  'bar', 'dot', 'none',
]

const startX = 180
const endX = 500
const startY = 40
const rowH = 40

headTypes.forEach((head, i) => {
  const y = startY + i * rowH

  // 标签
  fig.text(head, {
    pos: [80, y],
    fontSize: 13,
    fontColor: '#000',
    fontWeight: 'bold',
  })

  // 起点和终点用不可见的小矩形
  const a = fig.rect('', {
    pos: [startX, y - 3],
    size: [6, 6],
    fill: 'none',
    stroke: 'none',
  })
  const b = fig.rect('', {
    pos: [endX, y - 3],
    size: [6, 6],
    fill: 'none',
    stroke: 'none',
  })

  fig.arrow(a, b, {
    from: 'right',
    to: 'left',
    head,
    color: '#000',
    headSize: 10,
  })
})

// ---------- 3 种路径类型 ----------
const pathY = startY + headTypes.length * rowH + 30

// 标题
fig.text('Path Types', {
  pos: [80, pathY],
  fontSize: 15,
  fontColor: '#000',
  fontWeight: 'bold',
})

const pathTypes = [
  { path: 'straight' as const, label: 'straight', curve: 0 },
  { path: 'curve' as const,    label: 'curve',    curve: 35 },
  { path: 'polyline' as const, label: 'polyline',  curve: 0 },
] as const

pathTypes.forEach(({ path, label, curve }, i) => {
  const y = pathY + 40 + i * 60

  fig.text(label, {
    pos: [80, y + 15],
    fontSize: 13,
    fontColor: '#000',
    fontWeight: 'bold',
  })

  const a = fig.rect('A', {
    pos: [startX, y],
    size: [50, 30],
    fill: 'none',
    stroke: '#000',
    radius: 4,
    fontSize: 11,
    fontColor: '#000',
  })
  const b = fig.rect('B', {
    pos: [endX - 30, y],
    size: [50, 30],
    fill: 'none',
    stroke: '#000',
    radius: 4,
    fontSize: 11,
    fontColor: '#000',
  })

  fig.arrow(a, b, {
    from: 'right',
    to: 'left',
    path,
    curve,
    color: '#000',
    head: 'triangle',
  })
})

// ---------- Polyline Corner Radius ----------
const crY = pathY + 230

fig.text('Polyline Corner Radius', {
  pos: [80, crY],
  fontSize: 15,
  fontColor: '#000',
  fontWeight: 'bold',
})

const radii = [0, 6, 12]

radii.forEach((r, i) => {
  const y = crY + 40 + i * 70

  fig.text(`r = ${r}`, {
    pos: [80, y + 15],
    fontSize: 13,
    fontColor: '#000',
    fontWeight: 'bold',
  })

  const a = fig.rect('A', {
    pos: [startX, y],
    size: [50, 30],
    fill: '#e3f2fd',
    stroke: '#1976d2',
    radius: 4,
    fontSize: 11,
    fontColor: '#333',
  })
  const b = fig.rect('B', {
    pos: [endX - 30, y + 30],
    size: [50, 30],
    fill: '#e8f5e9',
    stroke: '#388e3c',
    radius: 4,
    fontSize: 11,
    fontColor: '#333',
  })

  fig.arrow(a, b, {
    from: 'right',
    to: 'left',
    path: 'polyline',
    color: '#333',
    head: 'triangle',
    cornerRadius: r,
  })
})

// ---------- Fork ----------
const forkY = crY + 280

fig.text('Fork (one source → N targets)', {
  pos: [80, forkY],
  fontSize: 15,
  fontColor: '#000',
  fontWeight: 'bold',
})

// Fork 示例 1: 垂直主干 → 水平分支 (from: top, to: left)
const fy1 = forkY + 60

fig.text('top → left', {
  pos: [80, fy1 + 40],
  fontSize: 13,
  fontColor: '#000',
  fontWeight: 'bold',
})

const src1 = fig.rect('Source', {
  pos: [startX, fy1 + 20],
  size: [70, 30],
  fill: '#fff3e0',
  stroke: '#e65100',
  radius: 4,
  fontSize: 11,
  fontColor: '#333',
})

const t1a = fig.rect('T1', {
  pos: [endX - 50, fy1],
  size: [60, 26],
  fill: '#e8eaf6',
  stroke: '#283593',
  radius: 4,
  fontSize: 11,
  fontColor: '#333',
})
const t1b = fig.rect('T2', {
  pos: [endX - 50, fy1 + 36],
  size: [60, 26],
  fill: '#e8eaf6',
  stroke: '#283593',
  radius: 4,
  fontSize: 11,
  fontColor: '#333',
})
const t1c = fig.rect('T3', {
  pos: [endX - 50, fy1 + 72],
  size: [60, 26],
  fill: '#e8eaf6',
  stroke: '#283593',
  radius: 4,
  fontSize: 11,
  fontColor: '#333',
})

fig.fork(src1, [t1a, t1b, t1c], {
  from: 'top',
  to: 'left',
  color: '#333',
  head: 'triangle',
  cornerRadius: 8,
})

// Fork 示例 2: 水平主干 → 垂直分支 (from: right, to: top)
const fy2 = forkY + 170

fig.text('right → top', {
  pos: [80, fy2 + 30],
  fontSize: 13,
  fontColor: '#000',
  fontWeight: 'bold',
})

const src2 = fig.rect('Source', {
  pos: [startX, fy2 + 15],
  size: [70, 30],
  fill: '#fce4ec',
  stroke: '#c62828',
  radius: 4,
  fontSize: 11,
  fontColor: '#333',
})

const t2a = fig.rect('T1', {
  pos: [340, fy2 + 50],
  size: [60, 26],
  fill: '#e0f7fa',
  stroke: '#00838f',
  radius: 4,
  fontSize: 11,
  fontColor: '#333',
})
const t2b = fig.rect('T2', {
  pos: [430, fy2 + 50],
  size: [60, 26],
  fill: '#e0f7fa',
  stroke: '#00838f',
  radius: 4,
  fontSize: 11,
  fontColor: '#333',
})
const t2c = fig.rect('T3', {
  pos: [520, fy2 + 50],
  size: [60, 26],
  fill: '#e0f7fa',
  stroke: '#00838f',
  radius: 4,
  fontSize: 11,
  fontColor: '#333',
})

fig.fork(src2, [t2a, t2b, t2c], {
  from: 'right',
  to: 'top',
  color: '#333',
  head: 'triangle',
  cornerRadius: 8,
})

fig.export('examples/arrows-demo.svg', { fit: true, margin: 30 })
fig.export('examples/arrows-demo.png', { fit: true, margin: 30, scale: 2 })
