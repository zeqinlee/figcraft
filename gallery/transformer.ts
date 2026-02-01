/**
 * Transformer Architecture
 * Based on "Attention is All You Need" (Vaswani et al., 2017)
 */

import { Figure } from '../src'

async function main() {
  const fig = new Figure(700, 900, { bg: '#ffffff' })

  const W = 150
  const HA = 55     // attention block height (tall)
  const HF = 48     // feed forward height (medium)
  const HN = 30     // add & norm height (thin)
  const GAP = 20    // gap between blocks

  const EX = 60     // encoder column left x
  const DX = 380    // decoder column left x
  const ECX = EX + W / 2
  const DCX = DX + W / 2

  // Colors matching the original paper style
  const cAttn   = { fill: '#fff3e0', color: '#333' }   // light orange — attention
  const cNorm   = { fill: '#fffde7', color: '#333' }   // light yellow — add & norm
  const cFF     = { fill: '#e8eaf6', color: '#333' }   // light indigo — feed forward
  const cEmbed  = { fill: '#fce4ec', color: '#333' }   // light pink — embedding
  const cLinear = { fill: '#c8e6c9', color: '#333' }   // light green — linear
  const cSoft   = { fill: '#b2ebf2', color: '#333' }   // light cyan — softmax
  const ac = { color: '#333' }

  // ==================== Output area ====================
  fig.text('Output Probabilities', {
    pos: [DCX, 15], fontSize: 11, fontColor: '#555',
  })
  const softmax = fig.rect('Softmax', {
    pos: [DX, 30], size: [W, 32],
    ...cSoft, radius: 4, fontSize: 11,
  })
  const linear = fig.rect('Linear', {
    pos: [DX, 82], size: [W, 32],
    ...cLinear, radius: 4, fontSize: 11,
  })

  // ==================== Decoder ×N ====================
  const gTop = 148  // top of group content
  let dy = gTop

  const dAN3 = fig.rect('Add & Norm', {
    pos: [DX, dy], size: [W, HN],
    ...cNorm, radius: 4, fontSize: 10,
  })
  dy += HN + GAP
  const dFF = fig.rect('Feed Forward', {
    pos: [DX, dy], size: [W, HF],
    ...cFF, radius: 4, fontSize: 10,
  })
  dy += HF + GAP
  const dAN2 = fig.rect('Add & Norm', {
    pos: [DX, dy], size: [W, HN],
    ...cNorm, radius: 4, fontSize: 10,
  })
  dy += HN + GAP
  const dCross = fig.rect('Multi-Head Attention', {
    pos: [DX, dy], size: [W, HA],
    ...cAttn, radius: 4, fontSize: 10,
  })
  dy += HA + GAP
  const dAN1 = fig.rect('Add & Norm', {
    pos: [DX, dy], size: [W, HN],
    ...cNorm, radius: 4, fontSize: 10,
  })
  dy += HN + GAP
  const dMasked = fig.rect('Masked Multi-Head Attn', {
    pos: [DX, dy], size: [W, HA],
    ...cAttn, radius: 4, fontSize: 10,
  })
  dy += HA
  const decBottom = dy

  // ==================== Encoder ×N ====================
  // Bottom-aligned with decoder
  const encH = HN + GAP + HF + GAP + HN + GAP + HA
  let ey = decBottom - encH

  const eAN2 = fig.rect('Add & Norm', {
    pos: [EX, ey], size: [W, HN],
    ...cNorm, radius: 4, fontSize: 10,
  })
  ey += HN + GAP
  const eFF = fig.rect('Feed Forward', {
    pos: [EX, ey], size: [W, HF],
    ...cFF, radius: 4, fontSize: 10,
  })
  ey += HF + GAP
  const eAN1 = fig.rect('Add & Norm', {
    pos: [EX, ey], size: [W, HN],
    ...cNorm, radius: 4, fontSize: 10,
  })
  ey += HN + GAP
  const eMHA = fig.rect('Multi-Head Attention', {
    pos: [EX, ey], size: [W, HA],
    ...cAttn, radius: 4, fontSize: 10,
  })

  // ==================== Bottom: Positional Encoding + Embedding ====================
  const btm = decBottom + 25

  const ePlus = fig.circle('+', {
    pos: [ECX - 14, btm + 5], r: 14,
    fill: '#fff', color: '#333', fontSize: 16,
  })
  const dPlus = fig.circle('+', {
    pos: [DCX - 14, btm + 5], r: 14,
    fill: '#fff', color: '#333', fontSize: 16,
  })

  fig.text('Pos Encoding →', {
    pos: [EX - 28, btm + 19], fontSize: 9, fontColor: '#555',
  })
  fig.text('← Pos Encoding', {
    pos: [DX + W + 42, btm + 19], fontSize: 9, fontColor: '#555',
  })

  const eEmbed = fig.rect('Input Embedding', {
    pos: [EX, btm + 50], size: [W, 36],
    ...cEmbed, radius: 4, fontSize: 10,
  })
  const dEmbed = fig.rect('Output Embedding', {
    pos: [DX, btm + 50], size: [W, 36],
    ...cEmbed, radius: 4, fontSize: 10,
  })

  fig.text('Inputs', {
    pos: [ECX, btm + 100], fontSize: 11, fontColor: '#333',
  })
  fig.text('Outputs', {
    pos: [DCX, btm + 100], fontSize: 11, fontColor: '#333',
  })

  // ==================== Groups ====================
  fig.group([eAN2, eFF, eAN1, eMHA], {
    label: 'Encoder ×N',
    stroke: { color: '#999', dash: [6, 3] },
    fontColor: '#666',
    padding: 16, fontSize: 11,
  })
  fig.group([dAN3, dFF, dAN2, dCross, dAN1, dMasked], {
    label: 'Decoder ×N',
    stroke: { color: '#999', dash: [6, 3] },
    fontColor: '#666',
    padding: 16, fontSize: 11,
  })

  // ==================== Main flow arrows (upward) ====================
  // Encoder: bottom → top
  fig.arrow(eMHA, eAN1, { from: 'top', to: 'bottom', ...ac })
  fig.arrow(eAN1, eFF, { from: 'top', to: 'bottom', ...ac })
  fig.arrow(eFF, eAN2, { from: 'top', to: 'bottom', ...ac })

  // Decoder: bottom → top
  fig.arrow(dMasked, dAN1, { from: 'top', to: 'bottom', ...ac })
  fig.arrow(dAN1, dCross, { from: 'top', to: 'bottom', ...ac })
  fig.arrow(dCross, dAN2, { from: 'top', to: 'bottom', ...ac })
  fig.arrow(dAN2, dFF, { from: 'top', to: 'bottom', ...ac })
  fig.arrow(dFF, dAN3, { from: 'top', to: 'bottom', ...ac })

  // Output chain
  fig.arrow(dAN3, linear, { from: 'top', to: 'bottom', ...ac })
  fig.arrow(linear, softmax, { from: 'top', to: 'bottom', ...ac })

  // Cross-attention: encoder output → decoder cross-attention
  fig.arrow(eAN2, dCross, {
    from: 'top', to: 'left',
    path: 'polyline', curve: 63, cornerRadius: 12, ...ac,
  })

  // Bottom: embedding → ⊕ → encoder/decoder
  fig.arrow(eEmbed, ePlus, { from: 'top', to: 'bottom', ...ac })
  fig.arrow(ePlus, eMHA, { from: 'top', to: 'bottom', ...ac })
  fig.arrow(dEmbed, dPlus, { from: 'top', to: 'bottom', ...ac })
  fig.arrow(dPlus, dMasked, { from: 'top', to: 'bottom', ...ac })

  // ==================== Residual connections (curved bypass arrows) ====================
  // Encoder: 残差连接在左侧
  fig.arrow(eMHA, eAN1, {
    from: 'left', to: 'left', path: 'polyline', curve: 35, cornerRadius: 10, ...ac,
  })
  fig.arrow(eFF, eAN2, {
    from: 'left', to: 'left', path: 'polyline', curve: 35, cornerRadius: 10, ...ac,
  })

  // Decoder: 残差连接在右侧
  fig.arrow(dMasked, dAN1, {
    from: 'right', to: 'right', path: 'polyline', curve: 35, cornerRadius: 10, ...ac,
  })
  fig.arrow(dCross, dAN2, {
    from: 'right', to: 'right', path: 'polyline', curve: 35, cornerRadius: 10, ...ac,
  })
  fig.arrow(dFF, dAN3, {
    from: 'right', to: 'right', path: 'polyline', curve: 35, cornerRadius: 10, ...ac,
  })

  await fig.export('gallery/transformer.svg', { fit: true, margin: 30 })
  await fig.export('gallery/transformer.png', { fit: true, margin: 30, scale: 2 })
}

main()
