/**
 * 导出格式测试
 *
 * 运行: npx tsx examples/export-test.ts
 */
import { Figure } from '../src'

const fig = new Figure(400, 200, { bg: '#fff' })

const a = fig.rect('Input', {
  size: [100, 50], fill: 'none', radius: 6,
  color: '#000', bold: true,
})

const b = fig.rect('Model', {
  size: [100, 50], fill: 'none', radius: 6,
  color: '#000', bold: true,
})

const c = fig.rect('Output', {
  size: [100, 50], fill: 'none', radius: 6,
  color: '#000', bold: true,
})

fig.row([a, b, c], { gap: 30 })
fig.arrow(a, b, { color: '#000', head: 'stealth' })
fig.arrow(b, c, { color: '#000', head: 'stealth' })

async function main() {
  // 测试所有格式
  await fig.export('examples/export-test.svg')
  await fig.export('examples/export-test.png')
  await fig.export('examples/export-test.jpg')
  await fig.export('examples/export-test.webp')
  await fig.export('examples/export-test.pdf')

  // 测试 fit 模式
  await fig.export('examples/export-test-fit.png', { fit: true, margin: 10 })

  // 测试透明背景
  const fig2 = new Figure(400, 200)  // 不设置 bg → 透明
  fig2.rect('Transparent', {
    size: [150, 60], pos: ['30%', '35%'],
    fill: '#e3f2fd', color: '#1565c0', radius: 8, bold: true,
  })
  await fig2.export('examples/export-test-transparent.png')

  // 测试高分辨率
  await fig.export('examples/export-test-hires.png', { scale: 4 })

  console.log('All format tests completed!')
}

main()
