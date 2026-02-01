/**
 * 基础示例 — Encoder-Decoder 架构图
 *
 * 运行: npx tsx examples/basic.ts
 */
import { Figure } from '../src'

const fig = new Figure(800, 400, { bg: '#fafafa' })

// ===== 1. Encoder =====
const encoder = fig.rect('Encoder', {
  pos: ['5%', '10%'], size: ['35%', '80%'],
  fill: '#e3f2fd', radius: 12,
  color: '#1565c0', bold: true, shadow: true,
  padding: 30,
})

encoder.circle('Self Attn', {
  pos: ['50%', '30%'], r: 28,
  fill: '#bbdefb', color: '#1565c0', fontSize: 10,
})

encoder.rect('FFN', {
  pos: ['15%', '60%'], size: ['70%', '25%'],
  fill: '#90caf9', radius: 6, color: '#1565c0', fontSize: 12,
})

// 在容器内任意位置加文字
encoder.text('x6', { pos: ['85%', '95%'], fontSize: 11, fontColor: '#1565c0' })

// ===== 2. Decoder =====
const decoder = fig.rect('Decoder', {
  pos: ['55%', '10%'], size: ['35%', '80%'],
  fill: 'none', radius: 12,
  stroke: { color: '#e65100', dash: [6, 3] },
  color: '#e65100', bold: true, padding: 30,
})

decoder.circle('Cross Attn', {
  pos: ['50%', '30%'], r: 28,
  fill: '#fff3e0', color: '#e65100', fontSize: 10,
})

decoder.rect('Linear', {
  pos: ['15%', '60%'], size: ['70%', '25%'],
  fill: '#ffe0b2', radius: 6, color: '#e65100', fontSize: 12,
})

// ===== 3. Output =====
const output = fig.rect('Output', {
  pos: ['92%', '42%'], size: [50, 36],
  fill: '#c8e6c9', radius: 18,
  color: '#2e7d32', bold: true, fontSize: 12,
})

// ===== 4. Arrows =====
fig.arrow(encoder, decoder, { label: 'hidden states', color: '#555' })
fig.arrow(decoder, output, { from: 'right', to: 'left', color: '#2e7d32' })
fig.arrow(encoder, decoder, {
  from: { side: 'right', at: '75%' },
  to: { side: 'left', at: '75%' },
  style: 'dashed', color: '#999', label: 'residual',
})

fig.export('examples/output.svg')
