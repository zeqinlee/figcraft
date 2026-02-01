/**
 * 示例 5 — Markdown 格式 + 字体
 *
 * 运行: npx tsx examples/fonts-markdown.ts
 */
import { Figure } from '../src'

const fig = new Figure(800, 450, {
  bg: '#fff',
  fontFamily: 'PingFang SC',  // 全局字体：苹方
})

// 标题
fig.text('**Attention** *Is All You Need*', {
  pos: ['50%', 30], fontSize: 20, fontColor: '#000',
})

// 左：公式
const left = fig.rect('', {
  size: [300, 280], fill: '#fafafa', radius: 10,
  stroke: '#000', padding: 20,
})

left.text('**Scaled Dot-Product Attention**', {
  pos: ['50%', '8%'], fontSize: 13, fontColor: '#000',
})

left.text('$Attention(Q, K, V)$', {
  pos: ['50%', '25%'], fontSize: 15, fontColor: '#222',
})

left.text('$= softmax(QK^T / sqrt(d_k)) V$', {
  pos: ['50%', '38%'], fontSize: 14, fontColor: '#222',
})

left.rect('', {
  pos: ['10%', '50%'], size: ['80%', 0.5],
  fill: '#ddd', stroke: 'none',
})

left.text('**Q** = query matrix', {
  pos: ['50%', '60%'], fontSize: 12, fontColor: '#555',
})

left.text('**K** = key matrix, **V** = value matrix', {
  pos: ['50%', '72%'], fontSize: 12, fontColor: '#555',
})

left.text('`dim(Q) = dim(K) = d_k`', {
  pos: ['50%', '88%'], fontSize: 11, fontColor: '#888',
})

// 右：参数表
const right = fig.rect('', {
  size: [300, 280], fill: '#fafafa', radius: 10,
  stroke: '#000', padding: 20,
})

right.text('**Model Configuration**', {
  pos: ['50%', '8%'], fontSize: 13, fontColor: '#000',
})

right.text('Layers   $N = 6$', {
  pos: ['50%', '25%'], fontSize: 13, fontColor: '#333',
})

right.text('Hidden   $d_model = 512$', {
  pos: ['50%', '38%'], fontSize: 13, fontColor: '#333',
})

right.text('Heads    $h = 8$', {
  pos: ['50%', '51%'], fontSize: 13, fontColor: '#333',
})

right.text('FFN dim  $d_ff = 2048$', {
  pos: ['50%', '64%'], fontSize: 13, fontColor: '#333',
})

right.rect('', {
  pos: ['10%', '76%'], size: ['80%', 0.5],
  fill: '#ddd', stroke: 'none',
})

right.text('Loss: $L = -log P(y | x)$', {
  pos: ['50%', '86%'], fontSize: 12, fontColor: '#555',
})

fig.row([left, right], { gap: 60 })

fig.arrow(left, right, { color: '#000', head: 'stealth' })

fig.export('examples/fonts-markdown.svg')
