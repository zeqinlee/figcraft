/**
 * 箭头穿过元素测试 — 直线 vs 折线 vs 曲线
 *
 * 测试场景：A → C 中间有 B 挡路
 * - straight: 直线是否直接穿过？
 * - polyline: 折线是否自动避障？
 * - curve: 曲线是否绕过？
 *
 * 运行: npx tsx examples/arrow-through-test.ts
 */
import { Figure } from '../src'

async function main() {

// ============================================================
// 场景 1: 三个元素一条线，中间挡路
// ============================================================
const fig1 = new Figure(700, 500, { bg: '#fff' })

fig1.text('箭头穿过元素测试', {
  pos: [350, 25], fontSize: 16, fontWeight: 'bold', fontColor: '#333',
})

// --- 第一行: 水平排列，B 挡在 A→C 之间 ---
const a1 = fig1.rect('A', {
  pos: [50, 60], size: [80, 40],
  fill: '#e3f2fd', radius: 4,
})
const b1 = fig1.rect('B (障碍)', {
  pos: [250, 60], size: [100, 40],
  fill: '#ffcdd2', radius: 4,
})
const c1 = fig1.rect('C', {
  pos: [500, 60], size: [80, 40],
  fill: '#c8e6c9', radius: 4,
})

// straight — 直线直接穿过 B
fig1.arrow(a1, c1, {
  head: 'stealth', label: 'straight（穿过）',
})

// --- 第二行: polyline ---
const a2 = fig1.rect('A', {
  pos: [50, 170], size: [80, 40],
  fill: '#e3f2fd', radius: 4,
})
const b2 = fig1.rect('B (障碍)', {
  pos: [250, 170], size: [100, 40],
  fill: '#ffcdd2', radius: 4,
})
const c2 = fig1.rect('C', {
  pos: [500, 170], size: [80, 40],
  fill: '#c8e6c9', radius: 4,
})

// polyline — 折线应自动避开 B
fig1.arrow(a2, c2, {
  from: 'right', to: 'left',
  path: 'polyline', head: 'stealth',
  label: 'polyline（避障）',
})

// --- 第三行: curve ---
const a3 = fig1.rect('A', {
  pos: [50, 280], size: [80, 40],
  fill: '#e3f2fd', radius: 4,
})
const b3 = fig1.rect('B (障碍)', {
  pos: [250, 280], size: [100, 40],
  fill: '#ffcdd2', radius: 4,
})
const c3 = fig1.rect('C', {
  pos: [500, 280], size: [80, 40],
  fill: '#c8e6c9', radius: 4,
})

// curve — 曲线向上弯曲绕过
fig1.arrow(a3, c3, {
  from: 'right', to: 'left',
  path: 'curve', head: 'stealth',
  curve: -50,
  label: 'curve（绕上方）',
})

// --- 第四行: 垂直方向，B 挡在 A→C 之间 ---
fig1.text('垂直方向穿过测试', {
  pos: [350, 380], fontSize: 13, fontWeight: 'bold', fontColor: '#555',
})

const a4 = fig1.rect('Top', {
  pos: [100, 400], size: [80, 40],
  fill: '#e3f2fd', radius: 4,
})
const b4 = fig1.rect('障碍', {
  pos: [290, 400], size: [80, 60],
  fill: '#ffcdd2', radius: 4,
})
const c4 = fig1.rect('Bottom', {
  pos: [480, 400], size: [80, 40],
  fill: '#c8e6c9', radius: 4,
})

// straight 垂直方向
fig1.arrow(a4, c4, {
  head: 'stealth', label: 'straight',
})

// polyline 从 top→bottom 绕过障碍
fig1.arrow(a4, c4, {
  from: 'bottom', to: 'top',
  path: 'polyline', head: 'triangle',
  label: 'polyline',
  style: 'dashed',
})

await fig1.export('examples/arrow-through-test.svg')
await fig1.export('examples/arrow-through-test.png', { fit: true, margin: 15, scale: 2 })
console.log('✓ 箭头穿过测试导出完成')

}

main()
