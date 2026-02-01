import { Figure } from '../src'

async function main() {
  const fig = new Figure(1200, 700, { bg: '#ffffff' })

  // === 1. col() 垂直布局 ===
  const input = fig.rect('Input', { size: [140, 50], bold: true })
  const embed = fig.rect('Embedding', { size: [140, 50], fill: '#d4e6ff', color: '#1a73e8' })
  const encoder = fig.rect('Encoder', { size: [140, 50], fill: '#d4edda', color: '#28a745' })
  const decoder = fig.rect('Decoder', { size: [140, 50], fill: '#ffe8cc', color: '#e67700' })
  const output = fig.rect('Output', { size: [140, 50], bold: true })

  fig.col([input, embed, encoder, decoder, output], { gap: 30 })

  // 串联箭头
  fig.arrow(input, embed)
  fig.arrow(embed, encoder)
  fig.arrow(encoder, decoder)
  fig.arrow(decoder, output)

  // === 2. group() 分组框 ===
  fig.group([embed, encoder], {
    label: 'Feature Extraction',
    stroke: { color: '#1a73e8', dash: [6, 3] },
    fontColor: '#1a73e8',
    padding: 20,
  })

  fig.group([decoder], {
    label: 'Generation',
    stroke: { color: '#e67700', dash: [6, 3] },
    fontColor: '#e67700',
    padding: 20,
  })

  // === 3. diamond() 菱形 ===
  const decision = fig.diamond('Loss < 0.01?', {
    pos: [750, 250],
    size: [160, 100],
    fill: '#ffe0e0',
    color: '#d32f2f',
  })

  // === 4. trapezoid() 梯形 ===
  const pool = fig.trapezoid('MaxPool', {
    pos: [770, 80],
    size: [130, 60],
    fill: '#e8eaf6',
    color: '#3f51b5',
    topRatio: 0.6,
  })

  // === 5. 更多元素 ===
  const conv = fig.rect('Conv2D', {
    pos: [770, 10],
    size: [130, 55],
    fill: '#e8eaf6',
    color: '#3f51b5',
    radius: 6,
  })

  const deploy = fig.rect('Deploy', {
    pos: [950, 270],
    size: [100, 50],
    fill: '#e8f5e9',
    color: '#2e7d32',
    radius: 20,
  })

  const retrain = fig.rect('Retrain', {
    pos: [780, 440],
    size: [110, 50],
    fill: '#fff3e0',
    color: '#e67700',
  })

  // === 6. arrows() 一对多 ===
  fig.arrow(conv, pool)
  fig.arrow(pool, decision, { style: 'dashed', color: '#999' })

  // 菱形判断分支
  fig.arrow(decision, deploy, { from: 'right', to: 'left', label: 'Yes', color: '#2e7d32' })
  fig.arrow(decision, retrain, { from: 'bottom', to: 'top', label: 'No', color: '#e67700' })

  // 从 decoder 连到 decision
  fig.arrow(decoder, decision, { from: 'right', to: 'left' })

  // 回路 retrain → encoder (polyline)
  fig.arrow(retrain, encoder, {
    from: 'left',
    to: 'right',
    path: 'polyline',
    style: 'dashed',
    color: '#e67700',
    head: 'vee',
  })

  await fig.export('examples/new-features-test.png', { fit: true, margin: 30 })
}

main()
