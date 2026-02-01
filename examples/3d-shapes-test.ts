import { Figure } from '../src'

async function main() {
  const fig = new Figure(1000, 500, { bg: '#ffffff' })

  // === Cylinder 圆柱体 ===
  const cyl1 = fig.cylinder('Feature\nMap', {
    pos: [50, 100], size: [100, 160],
    fill: '#bbdefb', color: '#1565c0',
    depth: 0.18, fontSize: 12,
  })

  const cyl2 = fig.cylinder('Database', {
    pos: [200, 130], size: [80, 120],
    fill: '#c8e6c9', color: '#2e7d32',
    fontSize: 11,
  })

  const cyl3 = fig.cylinder('Pool', {
    pos: [330, 160], size: [60, 90],
    fill: '#ffe0b2', color: '#e65100',
    depth: 0.2, fontSize: 11,
  })

  fig.arrow(cyl1, cyl2, { from: 'right', to: 'left' })
  fig.arrow(cyl2, cyl3, { from: 'right', to: 'left' })

  // === Cuboid 长方体 ===
  const cub1 = fig.cuboid('Conv Block', {
    pos: [500, 100], size: [120, 80],
    fill: '#e8eaf6', color: '#3f51b5',
    depth: 20, fontSize: 12,
  })

  const cub2 = fig.cuboid('FC Layer', {
    pos: [700, 110], size: [100, 60],
    fill: '#fce4ec', color: '#c62828',
    depth: 12, fontSize: 12,
  })

  const cub3 = fig.cuboid('Tensor', {
    pos: [520, 260], size: [80, 80],
    fill: '#fff9c4', color: '#f57f17',
    depth: 25, fontSize: 12, shadow: true,
  })

  fig.arrow(cub1, cub2, { from: 'right', to: 'left' })
  fig.arrow(cub1, cub3, { from: 'bottom', to: 'top' })

  // === Sphere 球体 ===
  const sph1 = fig.sphere('h₁', {
    pos: [150, 380], r: 30,
    fill: '#e3f2fd', color: '#1565c0',
  })

  const sph2 = fig.sphere('h₂', {
    pos: [250, 380], r: 30,
    fill: '#e8f5e9', color: '#2e7d32',
  })

  const sph3 = fig.sphere('h₃', {
    pos: [350, 380], r: 30,
    fill: '#fff3e0', color: '#e65100',
  })

  const sph4 = fig.sphere('Out', {
    pos: [500, 380], r: 40,
    fill: '#fce4ec', color: '#c62828', fontSize: 14,
  })

  fig.arrows([sph1, sph2, sph3], sph4, { color: '#666' })

  // === CNN Pipeline: Cylinder → Cuboid → Sphere ===
  fig.text('Cylinder (Feature Maps)', { pos: [150, 70], fontSize: 13, fontColor: '#999' })
  fig.text('Cuboid (3D Blocks)', { pos: [660, 70], fontSize: 13, fontColor: '#999' })
  fig.text('Sphere (Attention Heads)', { pos: [300, 340], fontSize: 13, fontColor: '#999' })

  await fig.export('examples/3d-shapes-test.png', { fit: true, margin: 30, scale: 2 })
}

main()
