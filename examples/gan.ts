/**
 * 示例 3 — GAN 架构图
 */
import { Figure } from '../src'

const fig = new Figure(750, 320, { bg: '#fff' })

// 噪声输入
const noise = fig.circle('z ~ N(0,1)', {
  r: 35, fill: '#ede7f6', color: '#4527a0', fontSize: 10,
})

// Generator
const gen = fig.rect('Generator', {
  size: [150, 180], fill: '#e8eaf6', radius: 10,
  color: '#283593', bold: true, shadow: true, padding: 25,
})
gen.rect('Dense\n128', {
  pos: ['5%', '10%'], size: ['90%', '22%'],
  fill: '#c5cae9', radius: 4, color: '#283593', fontSize: 10,
})
gen.rect('ConvT\n64', {
  pos: ['5%', '38%'], size: ['90%', '22%'],
  fill: '#c5cae9', radius: 4, color: '#283593', fontSize: 10,
})
gen.rect('ConvT\n3', {
  pos: ['5%', '66%'], size: ['90%', '22%'],
  fill: '#c5cae9', radius: 4, color: '#283593', fontSize: 10,
})

// 生成图像
const fakeImg = fig.rect('Generated\nImage', {
  size: [80, 80], fill: '#f3e5f5', radius: 8,
  color: '#6a1b9a', fontSize: 11,
})

// 真实图像
const realImg = fig.rect('Real\nImage', {
  size: [80, 80], fill: '#e8f5e9', radius: 8,
  color: '#2e7d32', fontSize: 11,
})

// Discriminator
const disc = fig.rect('Discriminator', {
  size: [130, 180], fill: '#fce4ec', radius: 10,
  color: '#b71c1c', bold: true, shadow: true, padding: 25,
})
disc.rect('Conv\n64', {
  pos: ['5%', '10%'], size: ['90%', '22%'],
  fill: '#ffcdd2', radius: 4, color: '#b71c1c', fontSize: 10,
})
disc.rect('Conv\n128', {
  pos: ['5%', '38%'], size: ['90%', '22%'],
  fill: '#ffcdd2', radius: 4, color: '#b71c1c', fontSize: 10,
})
disc.rect('Dense\n1', {
  pos: ['5%', '66%'], size: ['90%', '22%'],
  fill: '#ffcdd2', radius: 4, color: '#b71c1c', fontSize: 10,
})

// 输出
const output = fig.circle('Real?\nFake?', {
  r: 30, fill: '#fff3e0', color: '#e65100', fontSize: 10,
})

fig.row([noise, gen, fakeImg, disc, output], { gap: 30 })

// 箭头
fig.arrow(noise, gen, { color: '#4527a0', head: 'triangle' })
fig.arrow(gen, fakeImg, { color: '#283593', label: 'G(z)' })
fig.arrow(fakeImg, disc, { color: '#6a1b9a' })
fig.arrow(disc, output, { color: '#b71c1c' })

// 真实图像从上方进入 Discriminator
fig.arrow(realImg, disc, {
  from: 'bottom', to: 'top',
  color: '#2e7d32', style: 'dashed', label: 'real data',
})

fig.export('examples/gan.svg')
