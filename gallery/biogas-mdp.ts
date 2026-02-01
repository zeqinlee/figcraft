/**
 * Biogas Plant RL — MDP State & Action Space (Paper Style)
 * Color scheme: Cyan-Blue (State) + Amber-Gold (Action)
 */
import { Figure } from '../src'

async function main() {
  const fig = new Figure(780, 420, {
    bg: '#fff',
    antiOverlap: false,
    fontFamily: 'Times New Roman',
  })

  const ac = { color: '#333' }

  // ══════ State s (29D) — left (Cyan family) ══════
  const state = fig.rect('', {
    pos: [20, 20], size: [440, 380],
    fill: '#e0f7fa',
    stroke: { color: '#4dd0e1', width: 1.5, dash: [6, 3] },
    radius: 10,
  })
  fig.text('State  s  (29D)', {
    pos: [240, 42], fontSize: 14, fontColor: '#333', bold: true,
  })

  // — Sub-container 1: Plant State (5D) —
  fig.rect('', {
    pos: [30, 56], size: [420, 148],
    fill: '#e1f5fe',
    stroke: { color: '#81d4fa', width: 1.2, dash: [5, 3] },
    radius: 6,
  })
  fig.text('Plant State (5D)', {
    pos: [240, 74], fontSize: 12, fontColor: '#333', bold: true,
  })

  // 5 state variables in 2 rows
  const row1y = 92, row2y = 148, rw = 195, rh2 = 38
  fig.rect('Gas Storage / Capacity', {
    pos: [40, row1y], size: [rw, rh2],
    fill: '#b3e5fc', color: '#333', radius: 4, fontSize: 10,
  })
  fig.rect('(u − u_min) / Δu', {
    pos: [245, row1y], size: [rw, rh2],
    fill: '#b3e5fc', color: '#333', radius: 4, fontSize: 10,
  })
  fig.rect('(y − 80) / 40', {
    pos: [40, row2y], size: [125, rh2],
    fill: '#b3e5fc', color: '#333', radius: 4, fontSize: 10,
  })
  fig.rect('sin(2πh/24)', {
    pos: [175, row2y], size: [125, rh2],
    fill: '#f0f4c3', color: '#333', radius: 4, fontSize: 10,
  })
  fig.rect('cos(2πh/24)', {
    pos: [315, row2y], size: [125, rh2],
    fill: '#f0f4c3', color: '#333', radius: 4, fontSize: 10,
  })

  // — Sub-container 2: Price Window (24D) —
  fig.rect('', {
    pos: [30, 216], size: [420, 130],
    fill: '#e1f5fe',
    stroke: { color: '#81d4fa', width: 1.2, dash: [5, 3] },
    radius: 6,
  })
  fig.text('Price Window (24D)', {
    pos: [240, 234], fontSize: 12, fontColor: '#333', bold: true,
  })

  fig.stack('p(t+1),  p(t+2),  ...,  p(t+24)', {
    pos: [40, 252], size: [400, 38],
    fill: '#c5cae9', color: '#333', radius: 4, fontSize: 11,
    count: 3, stackOffset: [3, -3],
  })

  fig.text('p_k = (price[t+k] − mean) / std', {
    pos: [240, 314], fontSize: 10, fontColor: '#333',
  })

  // Bottom note
  fig.text('Time step: 1 hour', {
    pos: [240, 380], fontSize: 10, fontColor: '#333',
  })

  // ══════ Action a (2D) — right (Amber family) ══════
  const action = fig.rect('', {
    pos: [510, 20], size: [250, 380],
    fill: '#fff8e1',
    stroke: { color: '#ffd54f', width: 1.5, dash: [6, 3] },
    radius: 10,
  })
  fig.text('Action  a  (2D)', {
    pos: [635, 42], fontSize: 14, fontColor: '#333', bold: true,
  })

  // — Feed Rate —
  fig.rect('', {
    pos: [525, 68], size: [220, 125],
    fill: '#ffecb3', color: '#333', radius: 6,
  })
  fig.text('Feed Rate  u', {
    pos: [635, 88], fontSize: 12, fontColor: '#333', bold: true,
  })
  fig.rect('u ∈ [0.4, 0.8] t/h', {
    pos: [540, 104], size: [190, 32],
    fill: '#ffe0b2', color: '#333', radius: 4, fontSize: 11,
  })
  fig.rect('interval: every 2h', {
    pos: [540, 148], size: [190, 32],
    fill: '#ffe0b2', color: '#333', radius: 4, fontSize: 11,
    stroke: { color: '#333', dash: [4, 2] },
  })

  // — Power Level —
  fig.rect('', {
    pos: [525, 214], size: [220, 125],
    fill: '#ffecb3', color: '#333', radius: 6,
  })
  fig.text('Power Level  P', {
    pos: [635, 234], fontSize: 12, fontColor: '#333', bold: true,
  })
  fig.rect('{150, 175, 200, 225, 250, 275} kW', {
    pos: [540, 250], size: [190, 32],
    fill: '#ffe0b2', color: '#333', radius: 4, fontSize: 10,
  })
  fig.rect('interval: every 1h', {
    pos: [540, 294], size: [190, 32],
    fill: '#ffe0b2', color: '#333', radius: 4, fontSize: 11,
    stroke: { color: '#333', dash: [4, 2] },
  })

  fig.text('Multi-timescale action', {
    pos: [635, 380], fontSize: 10, fontColor: '#333',
  })

  // ══════ Arrows ══════
  fig.arrow(state, action, {
    from: { side: 'right', at: '30%' },
    to: { side: 'left', at: '30%' },
    label: 'π(a|s)',
    ...ac, head: 'stealth',
  })
  fig.arrow(action, state, {
    from: { side: 'left', at: '70%' },
    to: { side: 'right', at: '70%' },
    label: 'T(s′|s, a)',
    ...ac, head: 'stealth', style: 'dashed',
  })

  await fig.export('gallery/biogas-mdp.svg', { fit: true, margin: 30 })
  await fig.export('gallery/biogas-mdp.png', { fit: true, margin: 30, scale: 2 })
}

main()
