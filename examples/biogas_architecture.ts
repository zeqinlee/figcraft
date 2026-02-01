/**
 * Biogas RL — PPO Actor-Critic Architecture
 */
import { Figure } from '../src'

const fig = new Figure(900, 340, { bg: '#fff' })

// ===== 输入 =====
const input = fig.rect('Observation', {
  size: [110, 200], fill: '#f3e5f5', radius: 8,
  color: '#6a1b9a', bold: true, padding: 20,
})
input.rect('Storage', {
  pos: ['5%', '5%'], size: ['90%', '16%'],
  fill: '#e1bee7', radius: 4, color: '#6a1b9a', fontSize: 10,
})
input.rect('Feed Rate', {
  pos: ['5%', '24%'], size: ['90%', '16%'],
  fill: '#e1bee7', radius: 4, color: '#6a1b9a', fontSize: 10,
})
input.rect('Gas Prod.', {
  pos: ['5%', '43%'], size: ['90%', '16%'],
  fill: '#e1bee7', radius: 4, color: '#6a1b9a', fontSize: 10,
})
input.rect('Time', {
  pos: ['5%', '62%'], size: ['90%', '16%'],
  fill: '#ce93d8', radius: 4, color: '#4a148c', fontSize: 10,
})
input.rect('24h Price', {
  pos: ['5%', '81%'], size: ['90%', '16%'],
  fill: '#ab47bc', radius: 4, color: '#fff', fontSize: 10,
})

// ===== 策略网络 =====
const actor = fig.rect('Actor', {
  size: [340, 80], fill: '#fff3e0', radius: 8,
  color: '#e65100', bold: true, shadow: true, padding: 18,
})
const af1 = actor.rect('FC 256', {
  pos: ['2%', '20%'], size: ['27%', '65%'],
  fill: '#ffe0b2', radius: 4, color: '#e65100', fontSize: 11,
})
const af2 = actor.rect('ReLU', {
  pos: ['32%', '20%'], size: ['15%', '65%'],
  fill: '#ffe0b2', radius: 4, color: '#e65100', fontSize: 11,
})
const af3 = actor.rect('FC 256', {
  pos: ['50%', '20%'], size: ['27%', '65%'],
  fill: '#ffe0b2', radius: 4, color: '#e65100', fontSize: 11,
})
const af4 = actor.rect('FC 2', {
  pos: ['80%', '20%'], size: ['18%', '65%'],
  fill: '#ffcc80', radius: 4, color: '#bf360c', fontSize: 11, bold: true,
})

// ===== 价值网络 =====
const critic = fig.rect('Critic', {
  size: [340, 80], fill: '#e3f2fd', radius: 8,
  color: '#1565c0', bold: true, shadow: true, padding: 18,
})
const vf1 = critic.rect('FC 256', {
  pos: ['2%', '20%'], size: ['27%', '65%'],
  fill: '#bbdefb', radius: 4, color: '#1565c0', fontSize: 11,
})
const vf2 = critic.rect('ReLU', {
  pos: ['32%', '20%'], size: ['15%', '65%'],
  fill: '#bbdefb', radius: 4, color: '#1565c0', fontSize: 11,
})
const vf3 = critic.rect('FC 256', {
  pos: ['50%', '20%'], size: ['27%', '65%'],
  fill: '#bbdefb', radius: 4, color: '#1565c0', fontSize: 11,
})
const vf4 = critic.rect('FC 1', {
  pos: ['80%', '20%'], size: ['18%', '65%'],
  fill: '#90caf9', radius: 4, color: '#0d47a1', fontSize: 11, bold: true,
})

// ===== 输出 =====
const actOut = fig.rect('Action', {
  size: [80, 50], fill: '#c8e6c9', radius: 25,
  color: '#2e7d32', bold: true, fontSize: 12,
})
const valOut = fig.rect('Value', {
  size: [80, 50], fill: '#bbdefb', radius: 25,
  color: '#1565c0', bold: true, fontSize: 12,
})

// ===== 布局 =====
fig.col([actor, critic], { gap: 25 })
fig.col([actOut, valOut], { gap: 55 })
fig.row([input, actor, actOut], { gap: 40 })

// 手动让 critic 和 valOut 与 actor 行对齐
// (col 已经把 actor/critic 排好了，row 定了水平位置)

// ===== 内部箭头 =====
fig.arrow(af1, af2, { color: '#e65100', head: 'vee' })
fig.arrow(af2, af3, { color: '#e65100', head: 'vee' })
fig.arrow(af3, af4, { color: '#e65100', head: 'vee' })

fig.arrow(vf1, vf2, { color: '#1565c0', head: 'vee' })
fig.arrow(vf2, vf3, { color: '#1565c0', head: 'vee' })
fig.arrow(vf3, vf4, { color: '#1565c0', head: 'vee' })

// ===== 连接箭头 =====
fig.arrow(input, actor, { color: '#6a1b9a', head: 'stealth' })
fig.arrow(input, critic, { color: '#6a1b9a', head: 'stealth' })
fig.arrow(actor, actOut, { color: '#2e7d32', head: 'stealth' })
fig.arrow(critic, valOut, { color: '#1565c0', head: 'stealth' })

fig.export('examples/biogas_architecture.svg')
fig.export('examples/biogas_architecture.png', { fit: true, scale: 2, margin: 30 })
