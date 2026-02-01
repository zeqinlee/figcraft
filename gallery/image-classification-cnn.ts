/**
 * Image Classification CNN Architecture — 3 Styles
 */

import { Figure } from '../src'

async function main() {
  const fig = new Figure(1200, 1150, { bg: '#ffffff' })

  const H = 120
  const sections = [
    {
      title: 'Style 1 — Outline',
      y: 110,
      input:  { fill: '#e8eaf6', color: '#3949ab' },
      conv1:  { fill: '#e3f2fd', color: '#1565c0' },
      pool:   { fill: '#e0f7fa', color: '#00838f' },
      conv2:  { fill: '#e8f5e9', color: '#2e7d32' },
      fc:     { fill: '#fff3e0', color: '#e65100' },
      drop:   { fill: '#fce4ec', color: '#c62828', stroke: { color: '#c62828', dash: [4, 3] } as any },
      grp1:   { stroke: { color: '#1565c0', dash: [6, 3] }, fontColor: '#1565c0' },
      grp2:   { stroke: { color: '#2e7d32', dash: [6, 3] }, fontColor: '#2e7d32' },
      grp3:   { stroke: { color: '#e65100', dash: [6, 3] }, fontColor: '#e65100' },
      arrow:  '#555',
      note:   '#888',
    },
    {
      title: 'Style 2 — Filled Groups',
      y: 460,
      input:  { fill: '#e8eaf6', color: '#3949ab' },
      conv1:  { fill: '#e3f2fd', color: '#1565c0' },
      pool:   { fill: '#e0f7fa', color: '#00838f' },
      conv2:  { fill: '#e8f5e9', color: '#2e7d32' },
      fc:     { fill: '#fff3e0', color: '#e65100' },
      drop:   { fill: '#fce4ec', color: '#c62828', stroke: { color: '#c62828', dash: [4, 3] } as any },
      grp1:   { fill: '#dbeafe', stroke: { color: '#1565c0', dash: [6, 3] }, fontColor: '#1565c0' },
      grp2:   { fill: '#dcfce7', stroke: { color: '#2e7d32', dash: [6, 3] }, fontColor: '#2e7d32' },
      grp3:   { fill: '#ffedd5', stroke: { color: '#e65100', dash: [6, 3] }, fontColor: '#e65100' },
      arrow:  '#555',
      note:   '#888',
    },
    {
      title: 'Style 3 — Monochrome',
      y: 810,
      input:  { fill: '#e0e0e0', color: '#000', fontColor: '#000' },
      conv1:  { fill: '#d0d0d0', color: '#000', fontColor: '#000' },
      pool:   { fill: '#c0c0c0', color: '#000', fontColor: '#000' },
      conv2:  { fill: '#b0b0b0', color: '#000', fontColor: '#000' },
      fc:     { fill: '#a0a0a0', color: '#000', fontColor: '#000' },
      drop:   { fill: '#e8e8e8', color: '#000', fontColor: '#000', stroke: { color: '#000', dash: [4, 3] } as any },
      grp1:   { stroke: { color: '#000', dash: [6, 3] }, fontColor: '#000' },
      grp2:   { stroke: { color: '#000', dash: [6, 3] }, fontColor: '#000' },
      grp3:   { stroke: { color: '#000', dash: [6, 3] }, fontColor: '#000' },
      arrow:  '#000',
      note:   '#666',
    },
  ]

  for (const s of sections) {
    const Y = s.y

    // 标题
    fig.text(`**${s.title}**`, {
      pos: [600, Y - 68], fontSize: 16, fontColor: '#333',
    })

    // Input
    const input = fig.stack('224×224', {
      pos: [30, Y], size: [75, H],
      ...s.input, count: 3, stackOffset: [5, -5], radius: 4, fontSize: 11,
    })

    // Block 1
    const c1 = fig.stack('Conv 64', {
      pos: [155, Y], size: [70, H],
      ...s.conv1, count: 4, stackOffset: [4, -4], radius: 3, fontSize: 10,
    })
    const c2 = fig.stack('Conv 64', {
      pos: [260, Y], size: [70, H],
      ...s.conv1, count: 4, stackOffset: [4, -4], radius: 3, fontSize: 10,
    })
    const p1 = fig.trapezoid('Pool', {
      pos: [365, Y], size: [60, H],
      ...s.pool, topRatio: 0.6, fontSize: 10,
    })

    // Block 2
    const c3 = fig.stack('Conv 128', {
      pos: [470, Y], size: [70, H],
      ...s.conv2, count: 4, stackOffset: [4, -4], radius: 3, fontSize: 10,
    })
    const c4 = fig.stack('Conv 128', {
      pos: [575, Y], size: [70, H],
      ...s.conv2, count: 4, stackOffset: [4, -4], radius: 3, fontSize: 10,
    })
    const p2 = fig.trapezoid('Pool', {
      pos: [680, Y], size: [55, H],
      ...s.pool, topRatio: 0.55, fontSize: 10,
    })

    // Classifier
    const f1 = fig.cuboid('FC 512', {
      pos: [785, Y], size: [80, H],
      ...s.fc, depth: 14, radius: 3, fontSize: 11,
    })
    const dr = fig.rect('Dropout', {
      pos: [910, Y], size: [65, H],
      ...s.drop, radius: 3, fontSize: 10,
    })
    const f2 = fig.cuboid('FC 1000', {
      pos: [1015, Y], size: [75, H],
      ...s.fc, depth: 12, radius: 3, fontSize: 11,
    })

    // Arrows
    const ac = { color: s.arrow }
    fig.arrow(input, c1, { from: 'right', to: 'left', ...ac })
    fig.arrow(c1, c2, { from: 'right', to: 'left', ...ac })
    fig.arrow(c2, p1, { from: 'right', to: 'left', ...ac })
    fig.arrow(p1, c3, { from: 'right', to: 'left', ...ac })
    fig.arrow(c3, c4, { from: 'right', to: 'left', ...ac })
    fig.arrow(c4, p2, { from: 'right', to: 'left', ...ac })
    fig.arrow(p2, f1, { from: 'right', to: 'left', ...ac })
    fig.arrow(f1, dr, { from: 'right', to: 'left', ...ac })
    fig.arrow(dr, f2, { from: 'right', to: 'left', ...ac })

    // Groups
    fig.group([c1, c2, p1], { label: 'Block 1', ...s.grp1, padding: 18, fontSize: 11 })
    fig.group([c3, c4, p2], { label: 'Block 2', ...s.grp2, padding: 18, fontSize: 11 })
    fig.group([f1, dr, f2], { label: 'Classifier', ...s.grp3, padding: 18, fontSize: 11 })

    // Notes
    fig.text('BatchNorm + ReLU after each Conv', {
      pos: [290, Y + H + 55], fontSize: 10, fontColor: s.note,
    })
    fig.text('Feature maps: 64 → 128', {
      pos: [600, Y + H + 55], fontSize: 10, fontColor: s.note,
    })
  }

  await fig.export('gallery/image-classification-cnn.svg', { fit: true, margin: 30 })
  await fig.export('gallery/image-classification-cnn.png', { fit: true, margin: 30, scale: 2 })
}

main()
