/**
 * 避障方向选择测试 — 左边有元素时应从右边绕
 *
 * 运行: npx tsx examples/avoid-direction-test.ts
 */
import { Figure } from '../src'

async function main() {

// ============================================================
// 场景 1: 左边有障碍，垂直段应往右偏移
// ============================================================
const fig1 = new Figure(600, 250, { bg: '#fff' })

fig1.text('垂直段方向选择：左边有障碍 → 应往右绕', {
  pos: [300, 20], fontSize: 13, fontWeight: 'bold', fontColor: '#333',
})

const a1 = fig1.rect('A', {
  pos: [50, 50], size: [80, 40],
  fill: '#e3f2fd', radius: 4,
})
// 左侧障碍：挡在 midX 左边
const leftBlock = fig1.rect('左障碍', {
  pos: [200, 80], size: [80, 100],
  fill: '#ffcdd2', radius: 4,
})
// 右侧：路径中间的障碍
const midBlock = fig1.rect('中障碍', {
  pos: [280, 80], size: [80, 100],
  fill: '#ffe0b2', radius: 4,
})
const b1 = fig1.rect('B', {
  pos: [450, 150], size: [80, 40],
  fill: '#c8e6c9', radius: 4,
})

// 箭头 1: from: right → to: top（指向 B 上边）
fig1.arrow(a1, b1, {
  from: 'right', to: 'top',
  path: 'polyline', head: 'stealth',
  label: '→ B上边',
})

// 箭头 2: from: right → to: right（指向 B 右边）
fig1.arrow(a1, b1, {
  from: 'bottom', to: 'right',
  path: 'polyline', head: 'stealth',
  label: '→ B右边',
  style: 'dashed',
})

await fig1.export('examples/avoid-direction-test-1.svg')
await fig1.export('examples/avoid-direction-test-1.png', { fit: true, margin: 15, scale: 2 })
console.log('✓ 场景1: 指向B上边 + B右边')

// ============================================================
// 场景 2: 上方有障碍，U型绕行应往下
// ============================================================
const fig2 = new Figure(600, 300, { bg: '#fff' })

fig2.text('U型绕行方向：上方有障碍 → 应往下绕', {
  pos: [300, 20], fontSize: 13, fontWeight: 'bold', fontColor: '#333',
})

const a2 = fig2.rect('A', {
  pos: [50, 130], size: [80, 40],
  fill: '#e3f2fd', radius: 4,
})
// 上方障碍：挡住从上方绕行
const topBlock = fig2.rect('上障碍', {
  pos: [230, 50], size: [140, 60],
  fill: '#ffcdd2', radius: 4,
})
// 中间障碍：正好挡在水平路径上
const midBlock2 = fig2.rect('中障碍', {
  pos: [230, 120], size: [140, 60],
  fill: '#ffe0b2', radius: 4,
})
const b2 = fig2.rect('B', {
  pos: [470, 130], size: [80, 40],
  fill: '#c8e6c9', radius: 4,
})

// 水平段在 y=150 穿过中障碍(120-180)
// U型上绕到 y=108, 但上障碍在 y:50-110 → 108 也碰撞
// 应选下绕到 y=192
fig2.arrow(a2, b2, {
  from: 'right', to: 'left',
  path: 'polyline', head: 'stealth',
  label: '应从下方绕',
})

await fig2.export('examples/avoid-direction-test-2.svg')
await fig2.export('examples/avoid-direction-test-2.png', { fit: true, margin: 15, scale: 2 })
console.log('✓ 场景2: 上方有障碍，U型绕行往下')

// ============================================================
// 场景 3: 两侧都有空间，选最近的
// ============================================================
const fig3 = new Figure(600, 250, { bg: '#fff' })

fig3.text('两侧都有空间 → 选距离最近的方向', {
  pos: [300, 20], fontSize: 13, fontWeight: 'bold', fontColor: '#333',
})

const a3 = fig3.rect('A', {
  pos: [50, 100], size: [80, 40],
  fill: '#e3f2fd', radius: 4,
})
const obstacle3 = fig3.rect('障碍', {
  pos: [250, 80], size: [100, 80],
  fill: '#ffcdd2', radius: 4,
})
const b3 = fig3.rect('B', {
  pos: [470, 100], size: [80, 40],
  fill: '#c8e6c9', radius: 4,
})

fig3.arrow(a3, b3, {
  from: 'right', to: 'left',
  path: 'polyline', head: 'stealth',
  label: '选最近方向',
})

await fig3.export('examples/avoid-direction-test-3.svg')
await fig3.export('examples/avoid-direction-test-3.png', { fit: true, margin: 15, scale: 2 })
console.log('✓ 场景3: 两侧都有空间，选最近方向')

console.log('\n全部方向选择测试通过 ✓')

}

main()
