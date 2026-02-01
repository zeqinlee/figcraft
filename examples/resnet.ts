/**
 * 示例 2 — ResNet 残差连接
 */
import { Figure } from '../src'

const fig = new Figure(800, 280, { bg: '#fff' })

const input = fig.rect('Input\n224x224', {
  size: [80, 60], fill: '#e0e0e0', radius: 6,
  color: '#424242', fontSize: 11,
})

const conv1 = fig.rect('Conv 7x7\nstride 2', {
  size: [90, 60], fill: '#e3f2fd', radius: 6,
  color: '#1565c0', fontSize: 11,
})

const pool = fig.rect('MaxPool\n3x3', {
  size: [80, 60], fill: '#e8eaf6', radius: 6,
  color: '#283593', fontSize: 11,
})

const res1 = fig.rect('ResBlock', {
  size: [100, 120], fill: '#e8f5e9', radius: 8,
  color: '#2e7d32', bold: true, padding: 20,
})
res1.rect('Conv 3x3', {
  pos: ['5%', '20%'], size: ['90%', '28%'],
  fill: '#c8e6c9', radius: 4, color: '#2e7d32', fontSize: 10,
})
res1.rect('Conv 3x3', {
  pos: ['5%', '55%'], size: ['90%', '28%'],
  fill: '#c8e6c9', radius: 4, color: '#2e7d32', fontSize: 10,
})

const res2 = fig.rect('ResBlock', {
  size: [100, 120], fill: '#fce4ec', radius: 8,
  color: '#c62828', bold: true, padding: 20,
})
res2.rect('Conv 3x3', {
  pos: ['5%', '20%'], size: ['90%', '28%'],
  fill: '#ffcdd2', radius: 4, color: '#c62828', fontSize: 10,
})
res2.rect('Conv 3x3', {
  pos: ['5%', '55%'], size: ['90%', '28%'],
  fill: '#ffcdd2', radius: 4, color: '#c62828', fontSize: 10,
})

const gap = fig.rect('Global\nAvgPool', {
  size: [80, 60], fill: '#f3e5f5', radius: 6,
  color: '#6a1b9a', fontSize: 11,
})

const fc = fig.rect('FC\n1000', {
  size: [70, 60], fill: '#fff3e0', radius: 6,
  color: '#e65100', fontSize: 11,
})

fig.row([input, conv1, pool, res1, res2, gap, fc], { gap: 20 })

// 正向箭头
fig.arrow(input, conv1, { color: '#555', head: 'vee' })
fig.arrow(conv1, pool, { color: '#555', head: 'vee' })
fig.arrow(pool, res1, { color: '#555', head: 'vee' })
fig.arrow(res1, res2, { color: '#555', head: 'vee' })
fig.arrow(res2, gap, { color: '#555', head: 'vee' })
fig.arrow(gap, fc, { color: '#555', head: 'vee' })

// 残差跳跃连接
fig.arrow(res1, res1, {
  from: { side: 'top', at: '20%' },
  to: { side: 'top', at: '80%' },
  path: 'curve', curve: -30,
  style: 'dashed', color: '#2e7d32', head: 'stealth',
  label: 'skip',
})

fig.arrow(res2, res2, {
  from: { side: 'top', at: '20%' },
  to: { side: 'top', at: '80%' },
  path: 'curve', curve: -30,
  style: 'dashed', color: '#c62828', head: 'stealth',
  label: 'skip',
})

fig.export('examples/resnet.svg')
