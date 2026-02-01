import { Figure } from '../src'

async function main() {
  const fig = new Figure(2200, 1200, { bg: '#ffffff' })

  // ==================== 区域 1：基础形状 ====================
  fig.text('Shapes', { pos: [120, 28], fontSize: 18, fontWeight: 'bold', fontColor: '#333' })

  fig.rect('Rect', { pos: [30, 55], size: [100, 50], fill: '#e3f2fd', color: '#1565c0', radius: 6 })
  fig.rect('Rounded', { pos: [150, 55], size: [100, 50], fill: '#fce4ec', color: '#c62828', radius: 20 })
  fig.rect('Shadow', { pos: [30, 120], size: [100, 50], fill: '#fff8e1', color: '#f57f17', shadow: true, radius: 4 })
  fig.rect('Dashed', { pos: [150, 120], size: [100, 50], fill: 'none', stroke: { color: '#666', dash: [6, 3] } })
  fig.circle('Circle', { pos: [80, 225], r: 35, fill: '#e8f5e9', color: '#2e7d32' })
  fig.diamond('Diamond', { pos: [30, 295], size: [120, 80], fill: '#f3e5f5', color: '#7b1fa2' })
  fig.trapezoid('Trapezoid', { pos: [170, 305], size: [110, 60], fill: '#e0f7fa', color: '#00838f', topRatio: 0.6 })

  // ==================== 区域 2：3D 形状 ====================
  fig.text('3D Shapes', { pos: [120, 400], fontSize: 18, fontWeight: 'bold', fontColor: '#333' })

  fig.cylinder('Cylinder', { pos: [30, 430], size: [90, 130], fill: '#bbdefb', color: '#1565c0', depth: 0.18, fontSize: 11 })
  fig.cuboid('Cuboid', { pos: [150, 460], size: [100, 70], fill: '#c8e6c9', color: '#2e7d32', depth: 16, fontSize: 11 })
  fig.sphere('Sphere', { pos: [95, 610], r: 35, fill: '#ffe0b2', color: '#e65100', fontSize: 11 })

  // ==================== 区域 3：文字格式 ====================
  fig.text('Markdown', { pos: [420, 28], fontSize: 18, fontWeight: 'bold', fontColor: '#333' })

  fig.rect('**Bold** Text', { pos: [330, 55], size: [180, 36], fill: '#f5f5f5', fontSize: 13 })
  fig.rect('*Italic* Style', { pos: [330, 100], size: [180, 36], fill: '#f5f5f5', fontSize: 13 })
  fig.rect('`code` Inline', { pos: [330, 145], size: [180, 36], fill: '#f5f5f5', fontSize: 13 })
  fig.rect('$E=mc^2$ Math', { pos: [330, 190], size: [180, 36], fill: '#f5f5f5', fontSize: 13 })
  fig.rect('**Bold** + *italic* + `mix`', { pos: [330, 235], size: [180, 36], fill: '#f5f5f5', fontSize: 12 })

  // ==================== 区域 4：箭头头部 ====================
  fig.text('Arrow Heads', { pos: [690, 28], fontSize: 18, fontWeight: 'bold', fontColor: '#333' })

  const headTypes: Array<[string, string]> = [
    ['triangle', 'Triangle'], ['triangle-open', 'Open Triangle'],
    ['stealth', 'Stealth'], ['vee', 'Vee'],
    ['circle', 'Circle'], ['circle-open', 'Open Circle'],
    ['diamond', 'Diamond'], ['diamond-open', 'Open Diamond'],
    ['bar', 'Bar'], ['dot', 'Dot'], ['none', 'None'],
  ]
  const ax = 590
  for (let i = 0; i < headTypes.length; i++) {
    const y = 55 + i * 30
    const [head, name] = headTypes[i]
    const s = fig.rect('', { pos: [ax, y], size: [6, 6], fill: '#999', stroke: 'none' })
    const d = fig.rect('', { pos: [ax + 120, y], size: [6, 6], fill: '#999', stroke: 'none' })
    fig.arrow(s, d, { head: head as any, color: '#555', from: 'right', to: 'left' })
    fig.text(name, { pos: [ax + 160, y + 3], fontSize: 11, fontColor: '#666' })
  }

  // ==================== 区域 5：箭头样式 + 路径 ====================
  fig.text('Arrow Styles & Paths', { pos: [690, 400], fontSize: 18, fontWeight: 'bold', fontColor: '#333' })

  const styles: Array<[string, string, any]> = [
    ['Solid', '#1565c0', {}],
    ['Dashed', '#c62828', { style: 'dashed' }],
    ['Dotted', '#2e7d32', { style: 'dotted' }],
    ['Bidirectional', '#e67700', { bidirectional: true }],
  ]
  for (let i = 0; i < styles.length; i++) {
    const y = 430 + i * 32
    const [name, color, cfg] = styles[i]
    const s = fig.rect('', { pos: [ax, y], size: [6, 6], fill: color, stroke: 'none' })
    const d = fig.rect('', { pos: [ax + 120, y], size: [6, 6], fill: color, stroke: 'none' })
    fig.arrow(s, d, { from: 'right', to: 'left', color, ...cfg })
    fig.text(name, { pos: [ax + 160, y + 3], fontSize: 11, fontColor: '#666' })
  }

  // 路径类型
  fig.text('Paths:', { pos: [ax + 20, 568], fontSize: 12, fontWeight: 'bold', fontColor: '#555' })
  const pa1 = fig.rect('A', { pos: [ax, 590], size: [45, 28], fill: '#e3f2fd', color: '#1565c0', fontSize: 11 })
  const pa2 = fig.rect('B', { pos: [ax + 130, 590], size: [45, 28], fill: '#e3f2fd', color: '#1565c0', fontSize: 11 })
  fig.arrow(pa1, pa2, { from: 'right', to: 'left', color: '#1565c0' })
  fig.text('Straight', { pos: [ax + 210, 604], fontSize: 11, fontColor: '#666' })

  const pb1 = fig.rect('A', { pos: [ax, 630], size: [45, 28], fill: '#fce4ec', color: '#c62828', fontSize: 11 })
  const pb2 = fig.rect('B', { pos: [ax + 130, 630], size: [45, 28], fill: '#fce4ec', color: '#c62828', fontSize: 11 })
  fig.arrow(pb1, pb2, { from: 'right', to: 'left', path: 'curve', curve: -25, color: '#c62828' })
  fig.text('Curve', { pos: [ax + 210, 644], fontSize: 11, fontColor: '#666' })

  const pc1 = fig.rect('A', { pos: [ax, 670], size: [45, 28], fill: '#e8f5e9', color: '#2e7d32', fontSize: 11 })
  const pc2 = fig.rect('B', { pos: [ax + 130, 710], size: [45, 28], fill: '#e8f5e9', color: '#2e7d32', fontSize: 11 })
  fig.arrow(pc1, pc2, { from: 'right', to: 'left', path: 'polyline', color: '#2e7d32' })
  fig.text('Polyline', { pos: [ax + 210, 700], fontSize: 11, fontColor: '#666' })

  // ==================== 区域 6：col + group ====================
  fig.text('col() + group()', { pos: [980, 28], fontSize: 18, fontWeight: 'bold', fontColor: '#333' })

  const la = fig.rect('Input', { size: [120, 40], fill: '#f5f5f5', bold: true, fontSize: 13 })
  const lb = fig.rect('Encoder', { size: [120, 40], fill: '#bbdefb', color: '#1565c0', fontSize: 13 })
  const lc = fig.rect('Attention', { size: [120, 40], fill: '#c8e6c9', color: '#2e7d32', fontSize: 13 })
  const ld = fig.rect('FFN', { size: [120, 40], fill: '#c8e6c9', color: '#2e7d32', fontSize: 13 })
  const le = fig.rect('Decoder', { size: [120, 40], fill: '#ffe0b2', color: '#e65100', fontSize: 13 })
  const lf = fig.rect('Output', { size: [120, 40], fill: '#f5f5f5', bold: true, fontSize: 13 })

  const colX = 920, colY = 60, colGap = 18
  ;[la, lb, lc, ld, le, lf].forEach((el, i) => {
    el.config.pos = [colX, colY + i * (40 + colGap)]
  })
  fig.arrow(la, lb); fig.arrow(lb, lc); fig.arrow(lc, ld); fig.arrow(ld, le); fig.arrow(le, lf)

  fig.group([lb, lc, ld], {
    label: 'Transformer Block', stroke: { color: '#2e7d32', dash: [6, 3] },
    fontColor: '#2e7d32', padding: 16, fontSize: 11,
  })
  fig.group([le], {
    label: 'Decode Stage', stroke: { color: '#e65100', dash: [4, 4] },
    fontColor: '#e65100', padding: 14, fontSize: 11,
  })

  // ==================== 区域 7：row ====================
  fig.text('row()', { pos: [980, 430], fontSize: 18, fontWeight: 'bold', fontColor: '#333' })

  const ra = fig.rect('Conv', { size: [70, 36], fill: '#e8eaf6', color: '#3f51b5', fontSize: 12 })
  const rb = fig.rect('BN', { size: [50, 36], fill: '#e8eaf6', color: '#3f51b5', fontSize: 12 })
  const rc = fig.rect('ReLU', { size: [60, 36], fill: '#e8eaf6', color: '#3f51b5', fontSize: 12 })
  const rd = fig.rect('Pool', { size: [50, 36], fill: '#e8eaf6', color: '#3f51b5', fontSize: 12 })

  let rx = 870, ry = 460
  for (const el of [ra, rb, rc, rd]) {
    const w = el.config.size![0] as number
    el.config.pos = [rx, ry]
    rx += w + 16
  }
  fig.arrow(ra, rb, { from: 'right', to: 'left' })
  fig.arrow(rb, rc, { from: 'right', to: 'left' })
  fig.arrow(rc, rd, { from: 'right', to: 'left' })

  // ==================== 区域 8：grid ====================
  fig.text('grid()', { pos: [980, 530], fontSize: 18, fontWeight: 'bold', fontColor: '#333' })

  const gridEls = ['A', 'B', 'C', 'D', 'E', 'F'].map(l =>
    fig.rect(l, { size: [55, 36], fill: '#fff3e0', color: '#e65100', fontSize: 12 })
  )
  const gx = 880, gy = 560, gg = 14
  for (let i = 0; i < gridEls.length; i++) {
    gridEls[i].config.pos = [gx + (i % 3) * (55 + gg), gy + Math.floor(i / 3) * (36 + gg)]
  }

  // ==================== 区域 9：Fan-out / Fan-in (自动对齐) ====================
  fig.text('arrows() + Auto Fan Align', { pos: [1430, 28], fontSize: 18, fontWeight: 'bold', fontColor: '#333' })

  // 1→4 扇出（左1对右4）
  const src = fig.rect('Source', { pos: [1250, 170], size: [100, 45], fill: '#e3f2fd', color: '#1565c0', fontSize: 12 })
  const t1 = fig.rect('Target 1', { pos: [1500, 70], size: [100, 38], fill: '#e8f5e9', color: '#2e7d32', fontSize: 11 })
  const t2 = fig.rect('Target 2', { pos: [1500, 120], size: [100, 38], fill: '#e8f5e9', color: '#2e7d32', fontSize: 11 })
  const t3 = fig.rect('Target 3', { pos: [1500, 170], size: [100, 38], fill: '#e8f5e9', color: '#2e7d32', fontSize: 11 })
  const t4 = fig.rect('Target 4', { pos: [1500, 220], size: [100, 38], fill: '#e8f5e9', color: '#2e7d32', fontSize: 11 })
  fig.arrows(src, [t1, t2, t3, t4], { color: '#1565c0', from: 'right', to: 'left' })
  fig.text('1→4 Fan-out (auto Y center)', { pos: [1410, 280], fontSize: 11, fontColor: '#999' })

  // 3→1 扇入
  const s1 = fig.rect('Input A', { pos: [1250, 320], size: [100, 38], fill: '#fce4ec', color: '#c62828', fontSize: 11 })
  const s2 = fig.rect('Input B', { pos: [1250, 370], size: [100, 38], fill: '#fce4ec', color: '#c62828', fontSize: 11 })
  const s3 = fig.rect('Input C', { pos: [1250, 420], size: [100, 38], fill: '#fce4ec', color: '#c62828', fontSize: 11 })
  const merge = fig.rect('Merge', { pos: [1500, 330], size: [100, 45], fill: '#fff3e0', color: '#e65100', fontSize: 12 })
  fig.arrows([s1, s2, s3], merge, { color: '#c62828', from: 'right', to: 'left' })
  fig.text('3→1 Fan-in (auto Y center)', { pos: [1410, 475], fontSize: 11, fontColor: '#999' })

  // ==================== 区域 10：Diamond 流程 ====================
  fig.text('Diamond Decision Flow', { pos: [1430, 510], fontSize: 18, fontWeight: 'bold', fontColor: '#333' })

  const start = fig.rect('Start', { pos: [1360, 545], size: [90, 38], fill: '#e8eaf6', color: '#3f51b5', radius: 20, fontSize: 12 })
  const check = fig.diamond('x > 0 ?', { pos: [1345, 605], size: [120, 75], fill: '#fff9c4', color: '#f57f17', fontSize: 12 })
  const yes = fig.rect('Positive', { pos: [1520, 615], size: [90, 38], fill: '#e8f5e9', color: '#2e7d32', fontSize: 12 })
  const no = fig.rect('Negative', { pos: [1520, 700], size: [90, 38], fill: '#fce4ec', color: '#c62828', fontSize: 12 })
  const end = fig.rect('End', { pos: [1360, 720], size: [90, 38], fill: '#e8eaf6', color: '#3f51b5', radius: 20, fontSize: 12 })

  fig.arrow(start, check)
  fig.arrow(check, yes, { from: 'right', to: 'left', label: 'Yes', color: '#2e7d32' })
  fig.arrow(check, no, { from: 'bottom', to: 'left', label: 'No', color: '#c62828', path: 'polyline' })
  fig.arrow(yes, end, { path: 'polyline', color: '#666' })
  fig.arrow(no, end, { from: 'left', to: 'right', path: 'polyline', color: '#666' })

  // ==================== 区域 11：3D CNN Pipeline ====================
  fig.text('3D CNN Pipeline', { pos: [1430, 800], fontSize: 18, fontWeight: 'bold', fontColor: '#333' })

  const cnn1 = fig.cylinder('Conv', { pos: [1240, 840], size: [70, 100], fill: '#bbdefb', color: '#1565c0', depth: 0.2, fontSize: 11 })
  const cnn2 = fig.cylinder('Pool', { pos: [1350, 855], size: [55, 75], fill: '#c8e6c9', color: '#2e7d32', depth: 0.2, fontSize: 11 })
  const cnn3 = fig.cuboid('FC', { pos: [1450, 870], size: [80, 50], fill: '#ffe0b2', color: '#e65100', depth: 12, fontSize: 12 })
  const cnn4 = fig.sphere('Out', { pos: [1600, 895], r: 25, fill: '#fce4ec', color: '#c62828', fontSize: 11 })

  fig.arrow(cnn1, cnn2, { from: 'right', to: 'left', color: '#666' })
  fig.arrow(cnn2, cnn3, { from: 'right', to: 'left', color: '#666' })
  fig.arrow(cnn3, cnn4, { from: 'right', to: 'left', color: '#666' })

  // ==================== 区域 12a：Stack 叠层 ====================
  fig.text('Stack Layers', { pos: [480, 700], fontSize: 18, fontWeight: 'bold', fontColor: '#333' })

  fig.stack('Conv ×3', {
    pos: [340, 735], size: [80, 50], count: 3,
    stackOffset: [6, -6], fill: '#bbdefb', color: '#1565c0', radius: 4, fontSize: 12,
  })
  fig.stack('FC ×4', {
    pos: [480, 735], size: [70, 45], count: 4,
    stackOffset: [6, -6], fill: '#c8e6c9', color: '#2e7d32', radius: 4, fontSize: 12,
  })
  fig.stack('Pool ×2', {
    pos: [620, 735], size: [75, 50], count: 2,
    stackOffset: [8, 8], fill: '#ffe0b2', color: '#e65100', radius: 4, fontSize: 12,
  })

  // ==================== 区域 12b：Trapezoid CNN Layers ====================
  fig.text('Trapezoid Layers', { pos: [150, 700], fontSize: 18, fontWeight: 'bold', fontColor: '#333' })

  const tp1 = fig.trapezoid('Conv', { pos: [30, 740], size: [90, 55], fill: '#bbdefb', color: '#1565c0', topRatio: 0.7, fontSize: 12 })
  const tp2 = fig.trapezoid('Pool', { pos: [155, 740], size: [75, 55], fill: '#c8e6c9', color: '#2e7d32', topRatio: 0.55, fontSize: 12 })
  const tp3 = fig.trapezoid('Conv', { pos: [265, 740], size: [65, 55], fill: '#bbdefb', color: '#1565c0', topRatio: 0.6, fontSize: 12 })
  const tp4 = fig.rect('FC', { pos: [365, 748], size: [55, 40], fill: '#ffe0b2', color: '#e65100', radius: 4, fontSize: 12 })

  fig.arrow(tp1, tp2, { from: 'right', to: 'left', color: '#666' })
  fig.arrow(tp2, tp3, { from: 'right', to: 'left', color: '#666' })
  fig.arrow(tp3, tp4, { from: 'right', to: 'left', color: '#666' })

  // ==================== 区域 13：Mind Map (思维导图示例) ====================
  fig.text('Mind Map (Auto Align)', { pos: [480, 850], fontSize: 18, fontWeight: 'bold', fontColor: '#333' })

  const root = fig.rect('**Flowing**', { pos: [310, 960], size: [120, 45], fill: '#e3f2fd', color: '#1565c0', radius: 8, fontSize: 14 })

  const b1 = fig.rect('Shapes', { pos: [510, 890], size: [90, 35], fill: '#e8f5e9', color: '#2e7d32', radius: 4, fontSize: 12 })
  const b2 = fig.rect('Arrows', { pos: [510, 940], size: [90, 35], fill: '#fff3e0', color: '#e65100', radius: 4, fontSize: 12 })
  const b3 = fig.rect('Layout', { pos: [510, 990], size: [90, 35], fill: '#fce4ec', color: '#c62828', radius: 4, fontSize: 12 })
  const b4 = fig.rect('Export', { pos: [510, 1040], size: [90, 35], fill: '#f3e5f5', color: '#7b1fa2', radius: 4, fontSize: 12 })

  fig.arrows(root, [b1, b2, b3, b4], { from: 'right', to: 'left', color: '#1565c0', head: 'vee' })

  // Shapes 子节点
  const s1a = fig.rect('2D', { pos: [660, 875], size: [60, 28], fill: '#f1f8e9', color: '#558b2f', radius: 3, fontSize: 11 })
  const s1b = fig.rect('3D', { pos: [660, 910], size: [60, 28], fill: '#f1f8e9', color: '#558b2f', radius: 3, fontSize: 11 })
  fig.arrows(b1, [s1a, s1b], { from: 'right', to: 'left', color: '#2e7d32', head: 'vee' })

  // Layout 子节点
  const s3a = fig.rect('row', { pos: [660, 975], size: [55, 28], fill: '#fbe9e7', color: '#bf360c', radius: 3, fontSize: 11 })
  const s3b = fig.rect('col', { pos: [660, 1010], size: [55, 28], fill: '#fbe9e7', color: '#bf360c', radius: 3, fontSize: 11 })
  const s3c = fig.rect('grid', { pos: [660, 1045], size: [55, 28], fill: '#fbe9e7', color: '#bf360c', radius: 3, fontSize: 11 })
  fig.arrows(b3, [s3a, s3b, s3c], { from: 'right', to: 'left', color: '#c62828', head: 'vee' })

  await fig.export('examples/showcase.png', { fit: true, margin: 25, scale: 2 })
  await fig.export('examples/showcase.svg', { fit: true, margin: 25 })
}

main()
