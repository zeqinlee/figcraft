import { Figure } from '../src'

async function main() {
  // === Test 1: 自动行对齐 ===
  // 元素 Y 位置略有偏差，应该自动对齐到同一行
  const fig1 = new Figure(800, 400, { bg: '#ffffff' })

  const a = fig1.rect('Input', { pos: [50, 100], size: [100, 50], fill: '#e3f2fd', color: '#1565c0' })
  const b = fig1.rect('Process', { pos: [220, 115], size: [100, 50], fill: '#e8f5e9', color: '#2e7d32' })
  const c = fig1.rect('Output', { pos: [390, 95], size: [100, 50], fill: '#fff3e0', color: '#e65100' })
  const d = fig1.rect('Log', { pos: [560, 108], size: [100, 50], fill: '#fce4ec', color: '#c62828' })

  fig1.arrow(a, b, { label: 'data' })
  fig1.arrow(b, c, { label: 'transform' })
  fig1.arrow(c, d, { label: 'result' })

  // 第二行：也有偏差
  const e = fig1.rect('DB', { pos: [130, 250], size: [80, 50], fill: '#e8eaf6', color: '#3f51b5' })
  const f = fig1.rect('Cache', { pos: [300, 260], size: [80, 50], fill: '#e8eaf6', color: '#3f51b5' })
  const g = fig1.rect('Queue', { pos: [470, 245], size: [80, 50], fill: '#e8eaf6', color: '#3f51b5' })

  fig1.arrow(e, f)
  fig1.arrow(f, g)

  fig1.text('Auto Row Alignment (Y offset ±15px → aligned)', {
    pos: [400, 30], fontSize: 14, fontWeight: 'bold', fontColor: '#333',
  })

  await fig1.export('examples/auto-align-test.png', { fit: true, margin: 30 })

  // === Test 2: 箭头标签防重叠 ===
  const fig2 = new Figure(600, 300, { bg: '#ffffff' })

  const s = fig2.rect('Start', { pos: [50, 100], size: [100, 60], fill: '#e3f2fd', color: '#1565c0' })
  const mid = fig2.rect('Middle', { pos: [250, 100], size: [100, 60], fill: '#e8f5e9', color: '#2e7d32' })
  const end = fig2.rect('End', { pos: [450, 100], size: [100, 60], fill: '#fff3e0', color: '#e65100' })

  // 箭头标签在两个紧邻的元素之间，会靠近中间元素
  fig2.arrow(s, mid, { label: 'flow' })
  fig2.arrow(mid, end, { label: 'next' })

  // 一个 diamond 在上方，箭头标签可能和它重叠
  const check = fig2.diamond('OK?', {
    pos: [220, 10], size: [100, 70], fill: '#fff9c4', color: '#f57f17',
  })
  fig2.arrow(check, mid, { from: 'bottom', to: 'top', label: 'yes' })

  fig2.text('Arrow Label Anti-overlap', {
    pos: [300, 250], fontSize: 14, fontWeight: 'bold', fontColor: '#333',
  })

  await fig2.export('examples/anti-overlap-test.png', { fit: true, margin: 30 })

  // === Test 3: 禁用自动对齐 ===
  const fig3 = new Figure(500, 200, { bg: '#ffffff', autoAlign: false })

  const x1 = fig3.rect('A', { pos: [50, 50], size: [80, 40], fill: '#e3f2fd', color: '#1565c0' })
  const x2 = fig3.rect('B', { pos: [200, 70], size: [80, 40], fill: '#e8f5e9', color: '#2e7d32' })
  const x3 = fig3.rect('C', { pos: [350, 55], size: [80, 40], fill: '#fff3e0', color: '#e65100' })

  fig3.arrow(x1, x2)
  fig3.arrow(x2, x3)

  fig3.text('autoAlign: false (keeps original positions)', {
    pos: [250, 140], fontSize: 12, fontWeight: 'bold', fontColor: '#999',
  })

  await fig3.export('examples/no-align-test.png', { fit: true, margin: 20 })
}

main()
