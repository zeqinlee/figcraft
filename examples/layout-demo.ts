/**
 * 布局示例 — row() 自动居中对齐
 *
 * 运行: npx tsx examples/layout-demo.ts
 */
import { Figure } from '../src'

const fig = new Figure(900, 300, { bg: '#ffffff' })

// 定义三个容器，不需要设置 pos
const a = fig.rect('Embedding', {
  size: [180, 200],
  fill: 'none',
  stroke: '#000',
  radius: 8,
  fontColor: '#000',
  fontWeight: 'bold',
})

const b = fig.rect('Transformer', {
  size: [200, 200],
  fill: 'none',
  stroke: '#000',
  radius: 8,
  fontColor: '#000',
  fontWeight: 'bold',
  padding: 30,
})

// 在 Transformer 内部加子元素
b.rect('Multi-Head Attention', {
  pos: ['10%', '25%'],
  size: ['80%', '28%'],
  fill: 'none',
  stroke: '#000',
  radius: 4,
  fontSize: 11,
  fontColor: '#000',
})

b.rect('Feed Forward', {
  pos: ['10%', '60%'],
  size: ['80%', '28%'],
  fill: 'none',
  stroke: '#000',
  radius: 4,
  fontSize: 11,
  fontColor: '#000',
})

const c = fig.rect('Output Layer', {
  size: [180, 200],
  fill: 'none',
  stroke: '#000',
  radius: 8,
  fontColor: '#000',
  fontWeight: 'bold',
})

// 一行代码，三个容器自动居中对齐
fig.row([a, b, c], { gap: 50 })

// 箭头连接
fig.arrow(a, b, { color: '#000' })
fig.arrow(b, c, { color: '#000' })

fig.export('examples/layout-demo.svg')
