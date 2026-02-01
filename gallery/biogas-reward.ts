/**
 * Biogas Plant RL — Reward Function Decomposition (Paper Style, B&W)
 */
import { Figure } from '../src'

async function main() {
  const fig = new Figure(800, 360, {
    bg: '#fff',
    antiOverlap: false,
    fontFamily: 'Times New Roman',
  })

  const bk = { fill: 'none', color: '#000' }
  const ac = { color: '#000' }

  // ══════ Top: Total Reward ══════
  const total = fig.rect('', {
    pos: [240, 20], size: [300, 44],
    ...bk, radius: 6,
  })
  fig.text('r = r_profit + r_safety + r_signal + r_shape', {
    pos: [390, 42], fontSize: 11, fontColor: '#000', bold: true,
  })

  // ══════ Layout ══════
  const cw = 180, ch = 230, cy = 110
  const gap = 16

  // — 1. Economic Profit —
  const profit = fig.rect('Economic Profit', {
    pos: [10, cy], size: [cw, ch],
    ...bk, radius: 6, bold: true, padding: 20, fontSize: 12,
  })
  profit.rect('Revenue', {
    pos: ['5%', '22%'], size: ['90%', '16%'],
    ...bk, radius: 4, fontSize: 10,
  })
  profit.rect('Feed Cost', {
    pos: ['5%', '42%'], size: ['90%', '16%'],
    ...bk, radius: 4, fontSize: 10,
  })
  profit.rect('Normalize', {
    pos: ['5%', '62%'], size: ['90%', '16%'],
    ...bk, radius: 4, fontSize: 10,
    stroke: { color: '#000', dash: [4, 2] },
  })
  fig.text('r = (P·(p+b) − u·c) / 10', {
    pos: [100, cy + ch - 14], fontSize: 9, fontColor: '#000',
  })

  // — 2. Safety Penalties —
  const sx = 10 + cw + gap
  const safety = fig.rect('Safety Penalties', {
    pos: [sx, cy], size: [cw, ch],
    ...bk, radius: 6, bold: true, padding: 20, fontSize: 12,
  })
  safety.rect('Empty Penalty', {
    pos: ['5%', '22%'], size: ['90%', '16%'],
    ...bk, radius: 4, fontSize: 10,
  })
  safety.rect('Full Penalty', {
    pos: ['5%', '42%'], size: ['90%', '16%'],
    ...bk, radius: 4, fontSize: 10,
  })
  safety.rect('Gas Mgmt', {
    pos: ['5%', '62%'], size: ['90%', '16%'],
    ...bk, radius: 4, fontSize: 10,
    stroke: { color: '#000', dash: [4, 2] },
  })
  fig.text('−3·p_empty − 2·p_full', {
    pos: [sx + cw / 2, cy + ch - 14], fontSize: 9, fontColor: '#000',
  })

  // — 3. Price Signal —
  const px = sx + cw + gap
  const signal = fig.rect('Price Signal', {
    pos: [px, cy], size: [cw, ch],
    ...bk, radius: 6, bold: true, padding: 20, fontSize: 12,
  })
  signal.rect('Feed Tracking', {
    pos: ['5%', '22%'], size: ['90%', '16%'],
    ...bk, radius: 4, fontSize: 10,
  })
  signal.rect('P-Power Match', {
    pos: ['5%', '42%'], size: ['90%', '16%'],
    ...bk, radius: 4, fontSize: 10,
  })
  signal.rect('Price Response', {
    pos: ['5%', '62%'], size: ['90%', '16%'],
    ...bk, radius: 4, fontSize: 10,
  })
  fig.text('(1 − |u−u*|/Δu) × 0.3', {
    pos: [px + cw / 2, cy + ch - 14], fontSize: 9, fontColor: '#000',
  })

  // — 4. Operational Shaping —
  const ox = px + cw + gap
  const shape = fig.rect('Operational Shaping', {
    pos: [ox, cy], size: [cw, ch],
    ...bk, radius: 6, bold: true, padding: 20, fontSize: 12,
  })
  shape.rect('Dynamic Adj.', {
    pos: ['5%', '22%'], size: ['90%', '16%'],
    ...bk, radius: 4, fontSize: 10,
  })
  shape.rect('Future Anticip.', {
    pos: ['5%', '42%'], size: ['90%', '16%'],
    ...bk, radius: 4, fontSize: 10,
  })
  shape.rect('Neg. Price', {
    pos: ['5%', '62%'], size: ['90%', '16%'],
    ...bk, radius: 4, fontSize: 10,
  })
  fig.text('Δu > 0.05 → +0.2', {
    pos: [ox + cw / 2, cy + ch - 14], fontSize: 9, fontColor: '#000',
  })

  // ══════ Arrows ══════
  fig.fork(total, [profit, safety, signal, shape], {
    from: 'bottom', to: 'top',
    ...ac, head: 'stealth', cornerRadius: 6, curve: 20,
  })

  await fig.export('gallery/biogas-reward.svg', { fit: true, margin: 30 })
  await fig.export('gallery/biogas-reward.png', { fit: true, margin: 30, scale: 2 })
}

main()
