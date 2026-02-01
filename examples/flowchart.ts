/**
 * 示例 4 — 数据处理流水线（纯黑白风格）
 */
import { Figure } from '../src'

const fig = new Figure(800, 350, { bg: '#fff' })

// 数据源
const data = fig.rect('Raw Data', {
  size: [100, 50], fill: 'none', radius: 6,
  color: '#000', bold: true,
})

// 预处理
const preprocess = fig.rect('Preprocess', {
  size: [120, 120], fill: 'none', radius: 8,
  color: '#000', bold: true, padding: 20,
})
preprocess.rect('Clean', {
  pos: ['5%', '22%'], size: ['90%', '28%'],
  fill: 'none', color: '#000', radius: 4, fontSize: 11,
})
preprocess.rect('Tokenize', {
  pos: ['5%', '56%'], size: ['90%', '28%'],
  fill: 'none', color: '#000', radius: 4, fontSize: 11,
})

// 模型
const model = fig.rect('Model', {
  size: [120, 120], fill: 'none', radius: 8,
  stroke: { color: '#000', dash: [6, 3] },
  color: '#000', bold: true, padding: 20,
})
model.rect('Encoder', {
  pos: ['5%', '22%'], size: ['90%', '28%'],
  fill: 'none', color: '#000', radius: 4, fontSize: 11,
})
model.rect('Decoder', {
  pos: ['5%', '56%'], size: ['90%', '28%'],
  fill: 'none', color: '#000', radius: 4, fontSize: 11,
})

// 评估
const evaluate = fig.rect('Evaluate', {
  size: [100, 50], fill: 'none', radius: 6,
  color: '#000', bold: true,
})

// 部署
const deploy = fig.rect('Deploy', {
  size: [100, 50], fill: 'none', radius: 25,
  color: '#000', bold: true,
})

fig.row([data, preprocess, model, evaluate, deploy], { gap: 30 })

// 正向流
fig.arrow(data, preprocess, { color: '#000', head: 'stealth' })
fig.arrow(preprocess, model, { color: '#000', head: 'stealth' })
fig.arrow(model, evaluate, { color: '#000', head: 'stealth' })
fig.arrow(evaluate, deploy, { color: '#000', head: 'stealth' })

// 反馈回路
fig.arrow(evaluate, preprocess, {
  from: { side: 'top', at: '50%' },
  to: { side: 'top', at: '50%' },
  path: 'curve', curve: -80,
  style: 'dashed', color: '#000',
  head: 'vee', label: 'feedback',
})

fig.export('examples/flowchart.svg')

