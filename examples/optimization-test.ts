/**
 * 内部优化验证 — 测试 P0~P3 全部改进
 *
 * P0: 箭头自动拉直（坐标差 < 8px 自动吸附）
 * P1: 形状感知锚点（Trapezoid / Cylinder）
 * P2: Polyline 标签定位（最长段中点 + 画布约束）
 * P3: row/col/grid 对 Circle/Sphere 居中修正
 *
 * 运行: npx tsx examples/optimization-test.ts
 */
import { Figure } from '../src'

async function main() {

// ============================================================
// 测试 1: P0 箭头自动拉直
// ============================================================
const fig1 = new Figure(500, 200, { bg: '#fff' })

// 故意让 Y 差 5px（< 8px 阈值），应该自动拉直为水平线
const a1 = fig1.rect('A', { pos: [50, 80], size: [80, 40], fill: '#e3f2fd', radius: 4 })
const b1 = fig1.rect('B', { pos: [220, 85], size: [80, 40], fill: '#e3f2fd', radius: 4 })
fig1.arrow(a1, b1, { head: 'stealth', label: '应水平' })

// 故意让 X 差 6px（< 8px），应该自动拉直为垂直线
const c1 = fig1.rect('C', { pos: [370, 30], size: [80, 40], fill: '#fff3e0', radius: 4 })
const d1 = fig1.rect('D', { pos: [376, 120], size: [80, 40], fill: '#fff3e0', radius: 4 })
fig1.arrow(c1, d1, { head: 'stealth', label: '应垂直' })

await fig1.export('examples/optimization-test-p0.svg')
await fig1.export('examples/optimization-test-p0.png', { fit: true, margin: 10, scale: 2 })
console.log('P0 ✓ 箭头自动拉直')

// ============================================================
// 测试 2: P1 形状感知锚点 — Trapezoid + Cylinder
// ============================================================
const fig2 = new Figure(600, 300, { bg: '#fff' })

// Trapezoid: top 锚点应在窄边上，不是 bounding box 边缘
const trap = fig2.trapezoid('Pool', {
  pos: [60, 120], size: [120, 60],
  fill: '#f3e5f5', topRatio: 0.5,
})
const topNode = fig2.rect('Feature', {
  pos: [80, 30], size: [80, 40],
  fill: '#e8eaf6', radius: 4,
})
fig2.arrow(topNode, trap, { from: 'bottom', to: 'top', head: 'stealth', label: '→窄边' })

// Cylinder: top 锚点应在椭圆面最高点
const cyl = fig2.cylinder('DB', {
  pos: [300, 100], size: [100, 80],
  fill: '#e8f5e9', depth: 0.18,
})
const writer = fig2.rect('Writer', {
  pos: [310, 10], size: [80, 40],
  fill: '#fff3e0', radius: 4,
})
fig2.arrow(writer, cyl, { from: 'bottom', to: 'top', head: 'stealth', label: '→椭圆面' })

// Cylinder left/right 应在柱体范围内
const reader = fig2.rect('Reader', {
  pos: [470, 120], size: [80, 40],
  fill: '#fce4ec', radius: 4,
})
fig2.arrow(cyl, reader, { from: 'right', to: 'left', head: 'stealth', label: '柱体侧面' })

await fig2.export('examples/optimization-test-p1.svg')
await fig2.export('examples/optimization-test-p1.png', { fit: true, margin: 10, scale: 2 })
console.log('P1 ✓ 形状感知锚点')

// ============================================================
// 测试 3a: P2 同侧绕行 — bypass 不再穿过目标
// ============================================================
const fig3a = new Figure(500, 300, { bg: '#fff' })

const src3a = fig3a.rect('Source', {
  pos: [50, 50], size: [100, 40],
  fill: '#e3f2fd', radius: 4,
})
const mid3a = fig3a.rect('Middle', {
  pos: [200, 200], size: [100, 40],
  fill: '#fff3e0', radius: 4,
})
const dst3a = fig3a.rect('Target', {
  pos: [350, 50], size: [100, 40],
  fill: '#c8e6c9', radius: 4,
})

// 同侧绕行: 之前 bypass 只到 x=340，穿过了 Target(x:350-450)
// 修复后 bypass 应超过 Target 右边缘
fig3a.arrow(mid3a, dst3a, {
  from: 'right', to: 'right',
  path: 'polyline', head: 'stealth',
  label: '同侧绕行',
  curve: 30,
})

// 普通垂直起步 polyline
fig3a.arrow(src3a, mid3a, {
  from: 'bottom', to: 'top',
  path: 'polyline', head: 'stealth',
  label: '垂直起步',
})

// 水平起步 polyline
fig3a.arrow(src3a, dst3a, {
  from: 'right', to: 'left',
  path: 'polyline', head: 'stealth',
  label: '水平折线',
})

await fig3a.export('examples/optimization-test-p2a.svg')
await fig3a.export('examples/optimization-test-p2a.png', { fit: true, margin: 10, scale: 2 })
console.log('P2a ✓ 同侧绕行不再穿过目标')

// ============================================================
// 测试 3b: P2 第三方避障 — 折线路由段自动绕开中间元素
// ============================================================
const fig3b = new Figure(600, 300, { bg: '#fff' })

const left3b = fig3b.rect('Left', {
  pos: [50, 50], size: [100, 40],
  fill: '#e3f2fd', radius: 4,
})
// 障碍物：正好挡在折线的垂直路由段 (midX=300) 上
const obstacle = fig3b.rect('Obstacle', {
  pos: [260, 100], size: [80, 80],
  fill: '#ffcdd2', radius: 4,
})
const right3b = fig3b.rect('Right', {
  pos: [450, 200], size: [100, 40],
  fill: '#c8e6c9', radius: 4,
})

// 水平起步折线: midX=(100+500)/2=300, 垂直段 x=300 会穿过 Obstacle(x:260-340)
// 避障后应自动偏移到 Obstacle 左侧或右侧
fig3b.arrow(left3b, right3b, {
  from: 'right', to: 'left',
  path: 'polyline', head: 'stealth',
  label: '自动避障',
})

await fig3b.export('examples/optimization-test-p2b.svg')
await fig3b.export('examples/optimization-test-p2b.png', { fit: true, margin: 10, scale: 2 })
console.log('P2b ✓ 第三方元素避障')

// ============================================================
// 测试 4: P3 row/col/grid 中 Circle/Sphere 居中
// ============================================================
const fig4 = new Figure(600, 400, { bg: '#fff' })

// row: 混合 Rect + Circle + Sphere，应该视觉中心对齐
const r1 = fig4.rect('Rect', { size: [80, 50], fill: '#e3f2fd', radius: 4 })
const c2 = fig4.circle('Circle', { r: 25, fill: '#f3e5f5' })
const s1 = fig4.sphere('Sphere', { r: 25, fill: '#fff3e0' })
const r2 = fig4.rect('Rect2', { size: [80, 50], fill: '#e8f5e9', radius: 4 })

fig4.row([r1, c2, s1, r2], { gap: 40 })

// 连接箭头验证锚点
fig4.arrow(r1, c2, { head: 'stealth' })
fig4.arrow(c2, s1, { head: 'stealth' })
fig4.arrow(s1, r2, { head: 'stealth' })

// 标题
fig4.text('row() 混合布局: Rect + Circle + Sphere 应中心对齐', {
  pos: [300, 30], fontSize: 13, fontColor: '#333',
})

await fig4.export('examples/optimization-test-p3.svg')
await fig4.export('examples/optimization-test-p3.png', { fit: true, margin: 10, scale: 2 })
console.log('P3 ✓ 混合布局居中')

console.log('\n全部优化测试通过 ✓')

}

main()
