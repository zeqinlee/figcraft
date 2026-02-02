import { Figure } from './src/index'

async function main() {
  const fig = new Figure(700, 900, { bg: '#fff' })

  const cAttn = { fill: '#fff3e0', color: '#333' }
  const cNorm = { fill: '#fffde7', color: '#333' }
  const cFF   = { fill: '#e8eaf6', color: '#333' }

  const eMHA = fig.rect('Multi-Head Attention', {
    pos: [60, 385], size: [150, 55],
    ...cAttn, radius: 4, fontSize: 10,
  })
  const eAN1 = fig.rect('Add & Norm', {
    pos: [60, 310], size: [150, 30],
    ...cNorm, radius: 4, fontSize: 10,
  })
  const eFF = fig.rect('Feed Forward', {
    pos: [60, 260], size: [150, 48],
    ...cFF, radius: 4, fontSize: 10,
  })

  fig.arrow(eMHA, eAN1, { from: 'top', to: 'bottom' })
  fig.arrow(eAN1, eFF,  { from: 'top', to: 'bottom' })

  // Residual connections
  fig.arrow(eMHA, eAN1, {
    from: 'left', to: 'left',
    path: 'polyline', curve: 35, cornerRadius: 10,
  })

  fig.group([eMHA, eAN1, eFF], {
    label: 'Encoder ×N',
    stroke: { color: '#999', dash: [6, 3] },
  })

  const outPath = '../flowing-website/assets/diagrams/transformer-simple.svg'
  await fig.export(outPath, { fit: true, margin: 20 })
  console.log('Generated:', outPath)
}

main()
