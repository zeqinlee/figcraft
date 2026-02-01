/**
 * Biogas Plant RL Control — Architecture Diagram (Paper Style)
 * Focus: Core model structure (Environment ↔ Agent interaction)
 */
import { Figure } from '../src'

async function main() {
  const fig = new Figure(850, 500, {
    bg: '#ffffff',
    antiOverlap: false,
    fontFamily: 'Times New Roman',
  })

  // Academic paper color palette
  const cMarket  = { fill: '#fff3e0', color: '#333' }
  const cFeed    = { fill: '#fffde7', color: '#333' }
  const cDigest  = { fill: '#e3f2fd', color: '#333' }
  const cStorage = { fill: '#e8f5e9', color: '#333' }
  const cCHP     = { fill: '#c8e6c9', color: '#333' }
  const cReward  = { fill: '#b2ebf2', color: '#333' }
  const cAgent   = { fill: '#ede7f6', color: '#333' }
  const ac       = { color: '#333' }

  // ── Background containers (dashed, same height, closer gap) ──
  const envBg = fig.rect('', {
    pos: [25, 15], size: [340, 375],
    fill: '#f1f8e9', stroke: { color: '#a5d6a7', width: 1.5, dash: [6, 3] },
    radius: 12,
  })
  const agentBg = fig.rect('', {
    pos: [475, 15], size: [250, 375],
    fill: '#f3e5f5', stroke: { color: '#ce93d8', width: 1.5, dash: [6, 3] },
    radius: 12,
  })

  // ── Container titles ──
  fig.text('Biogas Plant Environment', {
    pos: [195, 37], fontSize: 13, fontColor: '#333', bold: true,
  })
  fig.text('PPO Agent', {
    pos: [600, 37], fontSize: 13, fontColor: '#333', bold: true,
  })

  // ══════ Environment internals ══════

  // Electricity Price — cylinder (data source icon, small)
  const price = fig.cylinder('', {
    pos: [130, 52], size: [130, 30],
    ...cMarket,
  })
  fig.text('Electricity Price', {
    pos: [195, 74], fontSize: 9, fontColor: '#333',
  })

  // Substrate Feed — full width, center-aligned with digester
  const feed = fig.rect('Substrate Feed', {
    pos: [50, 118], size: [290, 36],
    ...cFeed, radius: 4, fontSize: 11,
  })

  // Anaerobic Digester — key component
  const digester = fig.rect('Anaerobic Digester', {
    pos: [50, 182], size: [290, 58],
    ...cDigest, radius: 4, fontSize: 12, bold: true,
  })
  fig.text("x' = Ax + Bu,  y = Cx", {
    pos: [195, 224], fontSize: 9, fontColor: '#1565c0',
  })

  // Gas Storage — cylinder (tank icon)
  const storage = fig.cylinder('Gas Storage', {
    pos: [50, 270], size: [125, 48],
    ...cStorage, fontSize: 10,
  })
  fig.text('1810 m³', {
    pos: [112, 308], fontSize: 8, fontColor: '#555',
  })

  // CHP Unit — trapezoid (converter/generator icon)
  const chp = fig.trapezoid('CHP Unit', {
    pos: [215, 272], size: [125, 44],
    ...cCHP, fontSize: 10, topRatio: 0.7,
  })
  fig.text('150–275 kW', {
    pos: [277, 308], fontSize: 8, fontColor: '#555',
  })

  // Reward
  const reward = fig.rect('Reward', {
    pos: [50, 348], size: [290, 36],
    ...cReward, radius: 4, fontSize: 11,
  })
  fig.text('r = revenue − cost − penalty', {
    pos: [195, 376], fontSize: 9, fontColor: '#006064',
  })

  // ══════ Agent internals ══════

  // Observation input — stack (29D feature vector)
  const obsInput = fig.stack('s (29D)', {
    pos: [495, 58], size: [220, 26],
    fill: '#dcedc8', color: '#333', radius: 4, fontSize: 10,
    count: 3, stackOffset: [3, -3],
  })

  // Actor network (left column)
  const actor = fig.rect('Actor π(a|s)', {
    pos: [495, 118], size: [105, 50],
    ...cAgent, radius: 4, fontSize: 11,
  })
  fig.text('[256, 256]', {
    pos: [547, 155], fontSize: 8, fontColor: '#4527a0',
  })

  // Critic network (right column)
  const critic = fig.rect('Critic V(s)', {
    pos: [610, 118], size: [105, 50],
    ...cAgent, radius: 4, fontSize: 11,
  })
  fig.text('[256, 256]', {
    pos: [662, 155], fontSize: 8, fontColor: '#4527a0',
  })

  // Actor output — aligned width with actor
  const actorOut = fig.rect('a (2D)', {
    pos: [495, 194], size: [105, 24],
    fill: '#e1bee7', color: '#333', radius: 4, fontSize: 9,
  })

  // Critic output — aligned width with critic
  const criticOut = fig.rect('Value', {
    pos: [610, 194], size: [105, 24],
    fill: '#e1bee7', color: '#333', radius: 4, fontSize: 9,
  })

  // PPO training info — same width as stack
  fig.rect('PPO Clipped Objective', {
    pos: [495, 248], size: [220, 28],
    fill: '#f3e5f5', color: '#333', radius: 4, fontSize: 10,
    stroke: { color: '#ce93d8', dash: [4, 2] },
  })
  fig.text('GAE (λ=0.95, γ=0.99)', {
    pos: [605, 294], fontSize: 9, fontColor: '#6a1b9a',
  })
  fig.text('LR: 3e-4 → 3e-5', {
    pos: [605, 310], fontSize: 8, fontColor: '#888',
  })

  // Agent internal arrows
  fig.fork(obsInput, [actor, critic], {
    from: 'bottom', to: 'top',
    ...ac, head: 'stealth', cornerRadius: 6, curve: 16,
  })
  fig.arrow(actor, actorOut, {
    from: 'bottom', to: 'top', ...ac, head: 'stealth',
  })
  fig.arrow(critic, criticOut, {
    from: 'bottom', to: 'top', ...ac, head: 'stealth',
  })

  // ══════ Internal flow arrows (all vertical or horizontal) ══════

  // Price → Feed
  fig.arrow(price, feed, {
    from: 'bottom', to: 'top',
    ...ac, head: 'stealth',
  })

  // Feed → Digester: both 290px wide, centers at x=195 → perfectly vertical
  fig.arrow(feed, digester, {
    from: 'bottom', to: 'top',
    ...ac, head: 'stealth',
  })

  // Digester → Storage: exit at x≈112.5 → storage center x=112.5 → vertical
  fig.arrow(digester, storage, {
    from: { side: 'bottom', at: '21.5%' }, to: 'top',
    ...ac, head: 'stealth',
  })

  // Storage → CHP: horizontal
  fig.arrow(storage, chp, {
    from: 'right', to: 'left',
    ...ac, head: 'stealth',
  })

  // CHP → Reward: exit x≈277.5 → reward at 78.4% = x≈277.4 → vertical
  fig.arrow(chp, reward, {
    from: 'bottom', to: { side: 'top', at: '78.4%' },
    ...ac, head: 'stealth',
  })

  // ══════ RL interaction arrows (horizontal) ══════

  fig.arrow(envBg, agentBg, {
    from: { side: 'right', at: '40%' },
    to: { side: 'left', at: '40%' },
    label: 'Observation (29D)',
    ...ac, head: 'stealth',
  })

  fig.arrow(agentBg, envBg, {
    from: { side: 'left', at: '65%' },
    to: { side: 'right', at: '65%' },
    label: 'Action (2D)',
    ...ac, head: 'stealth',
  })

  fig.arrow(envBg, agentBg, {
    from: { side: 'right', at: '86%' },
    to: { side: 'left', at: '86%' },
    label: 'Reward',
    ...ac, head: 'stealth', style: 'dashed',
  })

  await fig.export('gallery/biogas-rl.svg', { fit: true, margin: 30 })
  await fig.export('gallery/biogas-rl.png', { fit: true, margin: 30, scale: 2 })
}

main()
