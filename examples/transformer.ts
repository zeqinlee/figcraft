/**
 * 示例 1 — Transformer 架构图
 */
import { Figure } from '../src'

const fig = new Figure(700, 500, { bg: '#fff' })

// 输入
const input = fig.rect('Input Embedding', {
  size: [130, 36], fill: '#e8eaf6', radius: 4,
  color: '#283593', fontSize: 11,
})

// Encoder 堆叠
const enc = fig.rect('Encoder', {
  size: [160, 260], fill: '#e3f2fd', radius: 10,
  color: '#1565c0', bold: true, shadow: true, padding: 25,
})

enc.rect('Multi-Head\nAttention', {
  pos: ['5%', '15%'], size: ['90%', '30%'],
  fill: '#bbdefb', radius: 6, color: '#1565c0', fontSize: 11,
})
enc.rect('Add & Norm', {
  pos: ['5%', '48%'], size: ['90%', '12%'],
  fill: '#90caf9', radius: 4, color: '#1565c0', fontSize: 10,
})
enc.rect('Feed Forward', {
  pos: ['5%', '64%'], size: ['90%', '20%'],
  fill: '#bbdefb', radius: 6, color: '#1565c0', fontSize: 11,
})
enc.text('x N', { pos: ['88%', '95%'], fontSize: 10, fontColor: '#1565c0' })

// Decoder 堆叠
const dec = fig.rect('Decoder', {
  size: [160, 260], fill: 'none', radius: 10,
  stroke: { color: '#e65100', dash: [6, 3] },
  color: '#e65100', bold: true, padding: 25,
})

dec.rect('Masked\nAttention', {
  pos: ['5%', '8%'], size: ['90%', '22%'],
  fill: '#fff3e0', radius: 6, color: '#e65100', fontSize: 11,
})
dec.rect('Cross\nAttention', {
  pos: ['5%', '34%'], size: ['90%', '22%'],
  fill: '#ffe0b2', radius: 6, color: '#e65100', fontSize: 11,
})
dec.rect('Feed Forward', {
  pos: ['5%', '62%'], size: ['90%', '20%'],
  fill: '#fff3e0', radius: 6, color: '#e65100', fontSize: 11,
})
dec.text('x N', { pos: ['88%', '95%'], fontSize: 10, fontColor: '#e65100' })

// 输出
const output = fig.rect('Linear + Softmax', {
  size: [130, 36], fill: '#c8e6c9', radius: 4,
  color: '#2e7d32', fontSize: 11,
})

// 排列
fig.row([input, enc, dec, output], { gap: 40 })

// 箭头
fig.arrow(input, enc, { color: '#555' })
fig.arrow(enc, dec, { color: '#555', label: 'K, V' })
fig.arrow(dec, output, { color: '#555' })

fig.export('examples/transformer.svg')
