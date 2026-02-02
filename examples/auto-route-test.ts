/**
 * 自动路径测试 — 各种形状之间的自动路由
 *
 * 运行: npx tsx examples/auto-route-test.ts
 */
import { Figure } from '../src'

async function main() {

const fig = new Figure(900, 500, { bg: '#fff' })

// 各种形状
const r = fig.rect('Rect', {
  pos: [50, 50], size: [90, 45],
  fill: '#e3f2fd', radius: 4,
})

const c = fig.circle('Circle', {
  pos: [250, 72], size: [55, 55],
  fill: '#f3e5f5',
})

const d = fig.diamond('Diamond', {
  pos: [380, 40], size: [90, 70],
  fill: '#fff9c4',
})

const t = fig.trapezoid('Trapezoid', {
  pos: [550, 50], size: [110, 50],
  fill: '#ffe0b2', topRatio: 0.6,
})

const cy = fig.cylinder('Cylinder', {
  pos: [750, 40], size: [90, 65],
  fill: '#c8e6c9',
})

const cu = fig.cuboid('Cuboid', {
  pos: [50, 250], size: [90, 60],
  fill: '#bbdefb',
})

const sp = fig.sphere('Sphere', {
  pos: [250, 280], size: [60, 60],
  fill: '#f8bbd0',
})

const st = fig.stack('Stack', {
  pos: [420, 250], size: [90, 55],
  fill: '#d1c4e9', layers: 3,
})

const r2 = fig.rect('End', {
  pos: [620, 260], size: [90, 45],
  fill: '#c8e6c9', radius: 20,
})

// 上排连接: Rect → Circle → Diamond → Trapezoid → Cylinder
fig.arrow(r, c, { path: 'polyline', head: 'stealth' })
fig.arrow(c, d, { path: 'polyline', head: 'stealth' })
fig.arrow(d, t, { path: 'polyline', head: 'stealth' })
fig.arrow(t, cy, { path: 'polyline', head: 'stealth' })

// 下排连接: Cuboid → Sphere → Stack → End
fig.arrow(cu, sp, { path: 'polyline', head: 'stealth' })
fig.arrow(sp, st, { path: 'polyline', head: 'stealth' })
fig.arrow(st, r2, { path: 'polyline', head: 'stealth' })

// 跨排连接: Rect → Cuboid, Cylinder → End
fig.arrow(r, cu, { path: 'polyline', head: 'stealth', style: 'dashed' })
fig.arrow(cy, r2, { path: 'polyline', head: 'stealth', style: 'dashed' })

// 反向连接: End → Diamond
fig.arrow(r2, d, { path: 'polyline', head: 'stealth', style: 'dotted' })

await fig.export('examples/auto-route-test.svg')
await fig.export('examples/auto-route-test.png', { fit: true, margin: 20, scale: 2 })
console.log('✓ 多形状自动路由测试')

}

main()
