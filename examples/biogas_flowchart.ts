/**
 * Biogas RL — PPO Training Pipeline
 */
import { Figure } from '../src'

const fig = new Figure(900, 400, { bg: '#fff' })

// ===== 节点：每个只写 1~2 个词 =====
const data = fig.cylinder('Price Data', {
  size: [100, 70], fill: '#e8eaf6', color: '#283593',
  fontSize: 12, bold: true, depth: 0.18,
})

const env = fig.rect('Environment', {
  size: [180, 180], fill: '#e3f2fd', radius: 10,
  color: '#1565c0', bold: true, shadow: true, padding: 25,
})
env.rect('State-Space', {
  pos: ['5%', '18%'], size: ['90%', '22%'],
  fill: '#bbdefb', radius: 4, color: '#1565c0', fontSize: 11,
})
env.rect('Gas Balance', {
  pos: ['5%', '44%'], size: ['90%', '22%'],
  fill: '#bbdefb', radius: 4, color: '#1565c0', fontSize: 11,
})
env.rect('Reward', {
  pos: ['5%', '70%'], size: ['90%', '22%'],
  fill: '#90caf9', radius: 4, color: '#0d47a1', fontSize: 11, bold: true,
})

const agent = fig.rect('PPO Agent', {
  size: [180, 180], fill: '#fff3e0', radius: 10,
  color: '#e65100', bold: true, shadow: true, padding: 25,
})
agent.rect('Actor', {
  pos: ['5%', '18%'], size: ['90%', '32%'],
  fill: '#ffe0b2', radius: 4, color: '#e65100', fontSize: 12,
})
agent.rect('Critic', {
  pos: ['5%', '55%'], size: ['90%', '32%'],
  fill: '#ffe0b2', radius: 4, color: '#e65100', fontSize: 12,
})

const output = fig.rect('Action', {
  size: [90, 50], fill: '#c8e6c9', radius: 25,
  color: '#2e7d32', bold: true, fontSize: 12,
})

// ===== 布局 =====
fig.row([data, env, agent, output], { gap: 40 })

// ===== 箭头 =====
fig.arrow(data, env, { color: '#283593', head: 'stealth' })
fig.arrow(env, agent, { color: '#555', head: 'stealth', label: 'obs, reward' })
fig.arrow(agent, output, { color: '#555', head: 'stealth' })

// 反馈：Action → Environment
fig.arrow(output, env, {
  from: { side: 'bottom', at: '50%' },
  to: { side: 'bottom', at: '50%' },
  path: 'curve', curve: 80,
  style: 'dashed', color: '#2e7d32',
  head: 'stealth', label: 'feed rate, power',
})

fig.export('examples/biogas_flowchart.svg')
fig.export('examples/biogas_flowchart.png', { fit: true, scale: 2, margin: 30 })
