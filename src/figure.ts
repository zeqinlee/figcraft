import * as fs from 'fs'
import * as path from 'path'
import {
  Element, Rect, Circle, Text, Image, Diamond, Trapezoid,
  Cylinder, Cuboid, Sphere, Stack,
  resolveValue, resolvePercent, escapeXml, resetIdCounter,
  parseMarkdown, TextSegment,
} from './elements'
import {
  ElementConfig, ArrowConfig, ArrowHead, Bounds, Point,
  Side, AnchorSpec, AnchorPoint, StrokeConfig, ExportOptions,
} from './types'

// --- 内部 Arrow 类 ---

class Arrow {
  constructor(
    public source: Element,
    public target: Element,
    public config: ArrowConfig = {},
  ) {}
}

class Fork {
  constructor(
    public source: Element,
    public targets: Element[],
    public config: ArrowConfig = {},
  ) {}
}

// --- Figure ---

export interface FigureOptions {
  bg?: string
  /** 默认字体（普通文字） */
  fontFamily?: string
  /** 公式字体（$...$），默认 Times New Roman */
  mathFont?: string
  /** 代码字体（`...`），默认 Menlo */
  codeFont?: string
  /** 注册本地字体名称 */
  fonts?: string[]
  /** 自动对齐同行元素（默认 true） */
  autoAlign?: boolean
  /** 自动防重叠（默认 true） */
  antiOverlap?: boolean
  /** 行检测 Y 阈值（默认 20px） */
  alignTolerance?: number
}

/**
 * 画布根节点。
 *
 * 用法：
 *   const fig = new Figure(800, 400)
 *   const a = fig.rect('A', { ... })
 *   const b = fig.rect('B', { ... })
 *   fig.arrow(a, b)
 *   fig.export('output.svg')
 */
export class Figure {
  readonly width: number
  readonly height: number
  private options: FigureOptions
  children: Element[] = []
  private _arrows: Arrow[] = []
  private _forks: Fork[] = []
  private boundsMap = new Map<string, Bounds>()
  private defs: string[] = []
  private registeredFonts: Array<{ name: string; url: string }> = []
  private groups: Array<{ rect: Rect; members: Element[]; padding: number; size?: [number, number] }> = []
  private arrowLabelPositions = new Map<Arrow, Point>()
  private textLayer: string[] = []

  constructor(width: number = 800, height: number = 400, options?: FigureOptions) {
    this.width = width
    this.height = height
    this.options = options ?? {}
    resetIdCounter()
    // 自动注册 options 中的字体
    if (this.options.fonts) {
      for (const name of this.options.fonts) this.font(name)
    }
  }

  /**
   * 注册字体。
   *   fig.font('PingFang SC')                              // 本地字体，不加载外部资源
   *   fig.font('Noto Sans SC', 'google')                   // 从 Google Fonts 加载
   *   fig.font('Custom', 'https://example.com/font.css')   // 自定义 URL
   */
  font(name: string, source?: string): void {
    if (!source) {
      // 纯本地字体，只记录名字，不生成 @import
      this.registeredFonts.push({ name, url: '' })
    } else if (source === 'google') {
      const encoded = name.replace(/ /g, '+')
      this.registeredFonts.push({
        name,
        url: `https://fonts.googleapis.com/css2?family=${encoded}:wght@400;700&display=swap`,
      })
    } else {
      this.registeredFonts.push({ name, url: source })
    }
  }

  get bounds(): Bounds {
    return { x: 0, y: 0, width: this.width, height: this.height }
  }

  private get defaultFont(): string {
    return this.options.fontFamily ?? 'Inter, system-ui, -apple-system, sans-serif'
  }

  // ========== 创建元素 ==========

  rect(label: string, config?: ElementConfig): Rect {
    const el = new Rect(label, config)
    this.children.push(el)
    return el
  }

  circle(label: string, config?: ElementConfig): Circle {
    const el = new Circle(label, config)
    this.children.push(el)
    return el
  }

  text(content: string, config?: ElementConfig): Text {
    const el = new Text(content, config)
    this.children.push(el)
    return el
  }

  /** 添加图片元素 */
  image(src: string, config?: ElementConfig): Image {
    const el = new Image(src, config)
    this.children.push(el)
    return el
  }

  /** 添加菱形（流程图判断节点） */
  diamond(label: string, config?: ElementConfig): Diamond {
    const el = new Diamond(label, config)
    this.children.push(el)
    return el
  }

  /** 添加梯形 */
  trapezoid(label: string, config?: ElementConfig): Trapezoid {
    const el = new Trapezoid(label, config)
    this.children.push(el)
    return el
  }

  /** 添加圆柱体 */
  cylinder(label: string, config?: ElementConfig): Cylinder {
    const el = new Cylinder(label, config)
    this.children.push(el)
    return el
  }

  /** 添加长方体 */
  cuboid(label: string, config?: ElementConfig): Cuboid {
    const el = new Cuboid(label, config)
    this.children.push(el)
    return el
  }

  /** 添加球体 */
  sphere(label: string, config?: ElementConfig): Sphere {
    const el = new Sphere(label, config)
    this.children.push(el)
    return el
  }

  /** 添加叠层（多层堆叠效果） */
  stack(label: string, config?: ElementConfig): Stack {
    const el = new Stack(label, config)
    this.children.push(el)
    return el
  }

  /** 连接两个元素，不指定锚点则自动吸附最近的边 */
  arrow(source: Element, target: Element, config?: ArrowConfig): void {
    this._arrows.push(new Arrow(source, target, config))
  }

  /** 一对多 / 多对一箭头 */
  arrows(
    source: Element | Element[],
    target: Element | Element[],
    config?: ArrowConfig,
  ): void {
    if (Array.isArray(source)) {
      // 多对一
      for (const s of source) this._arrows.push(new Arrow(s, target as Element, config))
    } else if (Array.isArray(target)) {
      // 一对多
      for (const t of target) this._arrows.push(new Arrow(source, t, config))
    } else {
      this._arrows.push(new Arrow(source, target, config))
    }
  }

  /** 分叉箭头：一个源分叉到 N 个目标，共享主干线 */
  fork(source: Element, targets: Element[], config?: ArrowConfig): void {
    this._forks.push(new Fork(source, targets, config))
  }

  /**
   * 将多个元素水平排列成一行，自动居中对齐。
   *
   *   fig.row([a, b, c])              // 默认间距 40px
   *   fig.row([a, b, c], { gap: 60 }) // 自定义间距
   *
   * 元素不需要预先设置 pos，调用后会自动计算。
   */
  row(elements: Element[], options?: { gap?: number }): void {
    const gap = options?.gap ?? 40
    const sizes = elements.map(el => this.elSize(el))

    const totalWidth = sizes.reduce((sum, s) => sum + s.w, 0) + gap * (elements.length - 1)
    const maxHeight = Math.max(...sizes.map(s => s.h))

    // 起始 x：水平居中；y：垂直居中
    let x = (this.width - totalWidth) / 2
    const baseY = (this.height - maxHeight) / 2

    for (let i = 0; i < elements.length; i++) {
      const centerY = baseY + (maxHeight - sizes[i].h) / 2 + sizes[i].h / 2
      const centerX = x + sizes[i].w / 2
      if (elements[i].type === 'circle' || elements[i].type === 'sphere') {
        // Circle/Sphere pos 是圆心
        elements[i].config.pos = [r(centerX), r(centerY)]
      } else {
        elements[i].config.pos = [r(x), r(baseY + (maxHeight - sizes[i].h) / 2)]
      }
      x += sizes[i].w + gap
    }
  }

  /** 获取元素的像素尺寸 */
  private elSize(el: Element): { w: number; h: number } {
    if (el.type === 'circle' || el.type === 'sphere') {
      const radius = el.type === 'circle' ? (el as Circle).r : ((el as Sphere).r)
      const d = radius * 2
      return { w: d, h: d }
    }
    const size = el.config.size ?? [100, 60]
    return {
      w: resolveValue(size[0], this.width),
      h: resolveValue(size[1], this.height),
    }
  }

  /**
   * 将多个元素垂直排列成一列，自动水平居中。
   *
   *   fig.col([a, b, c])              // 默认间距 40px
   *   fig.col([a, b, c], { gap: 30 }) // 自定义间距
   */
  col(elements: Element[], options?: { gap?: number }): void {
    const gap = options?.gap ?? 40
    const sizes = elements.map(el => this.elSize(el))

    const totalHeight = sizes.reduce((sum, s) => sum + s.h, 0) + gap * (elements.length - 1)
    const maxWidth = Math.max(...sizes.map(s => s.w))

    let y = (this.height - totalHeight) / 2
    const baseX = (this.width - maxWidth) / 2

    for (let i = 0; i < elements.length; i++) {
      const centerX = baseX + (maxWidth - sizes[i].w) / 2 + sizes[i].w / 2
      const centerY = y + sizes[i].h / 2
      if (elements[i].type === 'circle' || elements[i].type === 'sphere') {
        elements[i].config.pos = [r(centerX), r(centerY)]
      } else {
        elements[i].config.pos = [r(baseX + (maxWidth - sizes[i].w) / 2), r(y)]
      }
      y += sizes[i].h + gap
    }
  }

  /**
   * 将元素按网格排列。
   *
   *   fig.grid([a, b, c, d], { cols: 2, gap: 30 })
   */
  grid(elements: Element[], options?: { cols?: number; gap?: number; rowGap?: number; colGap?: number }): void {
    const cols = options?.cols ?? 3
    const cGap = options?.colGap ?? options?.gap ?? 40
    const rGap = options?.rowGap ?? options?.gap ?? 40
    const sizes = elements.map(el => this.elSize(el))

    // 每列最大宽度，每行最大高度
    const rows = Math.ceil(elements.length / cols)
    const colWidths: number[] = []
    const rowHeights: number[] = []

    for (let c = 0; c < cols; c++) {
      let maxW = 0
      for (let ri = 0; ri < rows; ri++) {
        const idx = ri * cols + c
        if (idx < sizes.length) maxW = Math.max(maxW, sizes[idx].w)
      }
      colWidths.push(maxW)
    }
    for (let ri = 0; ri < rows; ri++) {
      let maxH = 0
      for (let c = 0; c < cols; c++) {
        const idx = ri * cols + c
        if (idx < sizes.length) maxH = Math.max(maxH, sizes[idx].h)
      }
      rowHeights.push(maxH)
    }

    const totalW = colWidths.reduce((s, w) => s + w, 0) + cGap * (cols - 1)
    const totalH = rowHeights.reduce((s, h) => s + h, 0) + rGap * (rows - 1)
    const startX = (this.width - totalW) / 2
    const startY = (this.height - totalH) / 2

    for (let i = 0; i < elements.length; i++) {
      const ri = Math.floor(i / cols)
      const ci = i % cols

      let cellX = startX
      for (let c = 0; c < ci; c++) cellX += colWidths[c] + cGap
      cellX += (colWidths[ci] - sizes[i].w) / 2

      let cellY = startY
      for (let rr = 0; rr < ri; rr++) cellY += rowHeights[rr] + rGap
      cellY += (rowHeights[ri] - sizes[i].h) / 2

      if (elements[i].type === 'circle' || elements[i].type === 'sphere') {
        elements[i].config.pos = [r(cellX + sizes[i].w / 2), r(cellY + sizes[i].h / 2)]
      } else {
        elements[i].config.pos = [r(cellX), r(cellY)]
      }
    }
  }

  /**
   * 在一组元素外围绘制分组框（虚线边框 + 标题）。
   *
   *   fig.group([a, b], { label: 'Encoder', padding: 20 })
   *
   * 必须在 row/col/grid 之后调用（元素需要已设置位置）。
   * 返回的 Rect 可以作为箭头的连接目标。
   */
  group(
    members: Element[],
    config?: {
      label?: string
      fill?: string
      stroke?: string | StrokeConfig | 'none'
      radius?: number
      padding?: number
      fontSize?: number
      fontColor?: string
      /** 固定 group 尺寸 [width, height]，成员自动居中 */
      size?: [number, number]
    },
  ): Rect {
    const padding = config?.padding ?? 15
    const el = new Rect(config?.label ?? '', {
      fill: config?.fill ?? 'none',
      stroke: config?.stroke ?? { color: '#999', dash: [6, 3] },
      radius: config?.radius ?? 8,
      fontSize: config?.fontSize ?? 11,
      fontColor: config?.fontColor ?? '#999',
    })
    this.children.unshift(el) // 插到最前面，渲染在最底层
    this.groups.push({ rect: el, members, padding, size: config?.size })
    return el
  }

  // ========== 坐标解析 ==========

  private resolveBounds(el: Element, parentBounds: Bounds): Bounds {
    const cfg = el.config

    if (el.type === 'circle' || el.type === 'sphere') {
      const radius = el.type === 'circle' ? (el as Circle).r : (el as Sphere).r
      const pos = cfg.pos ?? ['50%', '50%']
      const cx = resolveValue(pos[0], parentBounds.width) + parentBounds.x
      const cy = resolveValue(pos[1], parentBounds.height) + parentBounds.y
      return { x: cx - radius, y: cy - radius, width: radius * 2, height: radius * 2 }
    }

    if (el.type === 'text') {
      const pos = cfg.pos ?? ['50%', '50%']
      const x = resolveValue(pos[0], parentBounds.width) + parentBounds.x
      const y = resolveValue(pos[1], parentBounds.height) + parentBounds.y
      return { x, y, width: 0, height: 0 }
    }

    // Rect / Image / Diamond / Trapezoid: pos 是左上角
    const pos = cfg.pos ?? [0, 0]
    const size = cfg.size ?? [100, 60]
    const x = r(resolveValue(pos[0], parentBounds.width) + parentBounds.x)
    const y = r(resolveValue(pos[1], parentBounds.height) + parentBounds.y)
    const w = r(resolveValue(size[0], parentBounds.width))
    const h = r(resolveValue(size[1], parentBounds.height))
    return { x, y, width: w, height: h }
  }

  private resolveAll(elements: Element[], parentBounds: Bounds): void {
    for (const el of elements) {
      const bounds = this.resolveBounds(el, parentBounds)
      this.boundsMap.set(el.id, bounds)

      if (el.children.length > 0) {
        const pad = el.config.padding ?? 0
        const content: Bounds = {
          x: bounds.x + pad,
          y: bounds.y + pad,
          width: bounds.width - pad * 2,
          height: bounds.height - pad * 2,
        }
        this.resolveAll(el.children, content)
      }
    }
  }

  // ========== 锚点系统 ==========

  private getAnchor(el: Element, spec: AnchorSpec): Point {
    const b = this.boundsMap.get(el.id)!
    const anchor: AnchorPoint = typeof spec === 'string' ? { side: spec } : spec
    const at = anchor.at !== undefined ? resolvePercent(anchor.at) : 0.5

    // 形状感知锚点：Trapezoid / Cylinder 使用专用方法
    if (el.type === 'trapezoid') return this.getTrapezoidAnchor(el, b, anchor.side, at)
    if (el.type === 'cylinder') return this.getCylinderAnchor(el, b, anchor.side, at)

    switch (anchor.side) {
      case 'top':    return { x: b.x + b.width * at,  y: b.y }
      case 'bottom': return { x: b.x + b.width * at,  y: b.y + b.height }
      case 'left':   return { x: b.x,                  y: b.y + b.height * at }
      case 'right':  return { x: b.x + b.width,        y: b.y + b.height * at }
    }
  }

  /** Trapezoid 锚点：top 边按 topRatio 收窄，left/right 沿斜边插值 */
  private getTrapezoidAnchor(el: Element, b: Bounds, side: Side, at: number): Point {
    const topRatio = el.config.topRatio ?? 0.6
    const inset = b.width * (1 - topRatio) / 2

    switch (side) {
      case 'top':
        return { x: b.x + inset + (b.width - 2 * inset) * at, y: b.y }
      case 'bottom':
        return { x: b.x + b.width * at, y: b.y + b.height }
      case 'left': {
        // 左斜边从 (b.x + inset, b.y) 到 (b.x, b.y + b.height)
        const t = at  // 0=top, 1=bottom
        return { x: b.x + inset * (1 - t), y: b.y + b.height * t }
      }
      case 'right': {
        // 右斜边从 (b.x + b.width - inset, b.y) 到 (b.x + b.width, b.y + b.height)
        const t = at
        return { x: b.x + b.width - inset * (1 - t), y: b.y + b.height * t }
      }
    }
  }

  /** Cylinder 锚点：top/bottom 按椭圆面计算，left/right 在柱体范围插值 */
  private getCylinderAnchor(el: Element, b: Bounds, side: Side, at: number): Point {
    const depthRatio = el.config.depth ?? 0.15
    const ry = b.height * depthRatio
    const cx = b.x + b.width / 2
    const topCy = b.y + ry
    const botCy = b.y + b.height - ry

    switch (side) {
      case 'top': {
        // 椭圆面顶部：at=0.5 → 椭圆最高点
        const angle = Math.PI * (1 - at)  // at=0 → π(左), at=0.5 → π/2(顶), at=1 → 0(右)
        return { x: cx + (b.width / 2) * Math.cos(angle), y: topCy - ry * Math.sin(angle) }
      }
      case 'bottom': {
        const angle = Math.PI * at  // at=0.5 → π/2(底)
        return { x: cx - (b.width / 2) * Math.cos(angle), y: botCy + ry * Math.sin(angle) }
      }
      case 'left':
        return { x: b.x, y: topCy + (botCy - topCy) * at }
      case 'right':
        return { x: b.x + b.width, y: topCy + (botCy - topCy) * at }
    }
  }

  /**
   * Polyline 避障：检测所有路由段是否穿过第三方元素，自动绕开。
   * - 垂直段碰撞 → 偏移 x
   * - 水平段碰撞 → 插入 U 型绕行（上下绕过障碍物）
   */
  private avoidPolylineObstacles(points: Point[], sourceId: string, targetId: string): Point[] {
    if (points.length < 3) return points

    const margin = 12

    const obstacles: Bounds[] = []
    for (const [id, b] of this.boundsMap.entries()) {
      if (id === sourceId || id === targetId) continue
      if (b.width <= 2 || b.height <= 2) continue
      obstacles.push(b)
    }
    if (obstacles.length === 0) return points

    // 检测候选 x 是否与任何障碍物碰撞（在 yMin~yMax 范围内）
    const xHitsObstacle = (cx: number, yMin: number, yMax: number): boolean => {
      for (const ob of obstacles) {
        if (cx > ob.x && cx < ob.x + ob.width && yMax > ob.y && yMin < ob.y + ob.height) return true
      }
      return false
    }
    // 检测候选 y 的水平段是否与任何障碍物碰撞（在 xMin~xMax 范围内）
    const yHitsObstacle = (cy: number, xMin: number, xMax: number): boolean => {
      for (const ob of obstacles) {
        if (cy > ob.y && cy < ob.y + ob.height && xMax > ob.x && xMin < ob.x + ob.width) return true
      }
      return false
    }

    let pts = points.map(p => ({ ...p }))

    for (let pass = 0; pass < 5; pass++) {
      let changed = false

      for (let i = 0; i < pts.length - 1; i++) {
        const p1 = pts[i]
        const p2 = pts[i + 1]
        const dx = Math.abs(p1.x - p2.x)
        const dy = Math.abs(p1.y - p2.y)

        // --- 垂直段碰撞：偏移 x（仅内部段）---
        // 找出垂直段上所有碰撞的障碍，计算联合包围盒后偏移
        if (dx < 1 && dy >= 1 && i >= 1 && i < pts.length - 2) {
          const x = p1.x
          const yMin = Math.min(p1.y, p2.y)
          const yMax = Math.max(p1.y, p2.y)
          const hits = obstacles.filter(b =>
            x > b.x && x < b.x + b.width && yMax > b.y && yMin < b.y + b.height)
          if (hits.length > 0) {
            const cLeft = Math.min(...hits.map(b => b.x))
            const cRight = Math.max(...hits.map(b => b.x + b.width))
            const leftX = cLeft - margin
            const rightX = cRight + margin
            const leftClear = !xHitsObstacle(leftX, yMin, yMax)
            const rightClear = !xHitsObstacle(rightX, yMin, yMax)
            let newX: number
            if (leftClear && rightClear) {
              newX = Math.abs(leftX - x) <= Math.abs(rightX - x) ? leftX : rightX
            } else if (leftClear) {
              newX = leftX
            } else if (rightClear) {
              newX = rightX
            } else {
              newX = Math.abs(leftX - x) > Math.abs(rightX - x) ? leftX : rightX
            }
            pts[i].x = newX
            pts[i + 1].x = newX
            changed = true
          }
        }

        // --- 水平段碰撞：插入 U 型绕行 ---
        // 找出水平段上所有碰撞的障碍，计算联合包围盒后一次绕过
        if (!changed && dy < 1 && dx > 1) {
          const y = p1.y
          const xMin = Math.min(p1.x, p2.x)
          const xMax = Math.max(p1.x, p2.x)
          const hits = obstacles.filter(b =>
            y > b.y && y < b.y + b.height && xMax > b.x + 1 && xMin < b.x + b.width - 1)
          if (hits.length > 0) {
            const cLeft = Math.min(...hits.map(b => b.x))
            const cRight = Math.max(...hits.map(b => b.x + b.width))
            const cTop = Math.min(...hits.map(b => b.y))
            const cBottom = Math.max(...hits.map(b => b.y + b.height))

            const enterX = cLeft - margin
            const exitX = cRight + margin
            const topY = cTop - margin
            const botY = cBottom + margin

            const topClear = !yHitsObstacle(topY, enterX, exitX)
            const botClear = !yHitsObstacle(botY, enterX, exitX)
            let detourY: number
            if (topClear && botClear) {
              detourY = Math.abs(topY - y) <= Math.abs(botY - y) ? topY : botY
            } else if (topClear) {
              detourY = topY
            } else if (botClear) {
              detourY = botY
            } else {
              detourY = Math.abs(topY - y) > Math.abs(botY - y) ? topY : botY
            }

            const detour: Point[] = [
              { x: enterX, y },
              { x: enterX, y: detourY },
              { x: exitX, y: detourY },
              { x: exitX, y },
            ]

            // 跳过绕行区域内的后续冗余点
            let j = i + 1
            const goRight = p2.x >= p1.x
            while (j < pts.length - 1) {
              const px = pts[j].x
              if (goRight ? px <= exitX : px >= exitX) j++
              else break
            }

            const before = pts.slice(0, i + 1)
            const after = pts.slice(j)
            pts = [...before, ...detour, ...after]
            changed = true
          }
        }

        if (changed) break
      }

      if (!changed) break
    }

    return pts
  }

  /** Polyline 标签定位：找到最长线段的中点 */
  private polylineLabelPosition(points: Point[]): Point {
    let maxLen = 0
    let bestMid: Point = { x: (points[0].x + points[points.length - 1].x) / 2, y: (points[0].y + points[points.length - 1].y) / 2 }
    for (let i = 0; i < points.length - 1; i++) {
      const len = Math.hypot(points[i + 1].x - points[i].x, points[i + 1].y - points[i].y)
      if (len > maxLen) {
        maxLen = len
        bestMid = { x: (points[i].x + points[i + 1].x) / 2, y: (points[i].y + points[i + 1].y) / 2 }
      }
    }
    return bestMid
  }

  /** 将标签位置限制在画布内 */
  private clampLabelToCanvas(pt: Point, labelW: number, labelH: number): Point {
    const margin = 4
    return {
      x: Math.max(margin + labelW / 2, Math.min(this.width - margin - labelW / 2, pt.x)),
      y: Math.max(margin + labelH / 2, Math.min(this.height - margin - labelH / 2, pt.y)),
    }
  }

  /**
   * 自动吸附：找到两个元素之间距离最近的锚点对。
   * 遍历双方各 4 条边的中心点，返回距离最小的一对。
   */
  private autoSnap(source: Element, target: Element): { from: Point; to: Point; fromSide: Side; toSide: Side } {
    const sides: Side[] = ['top', 'bottom', 'left', 'right']
    let bestFrom: Point = { x: 0, y: 0 }
    let bestTo: Point = { x: 0, y: 0 }
    let bestFromSide: Side = 'right'
    let bestToSide: Side = 'left'
    let minDist = Infinity

    for (const s of sides) {
      const sp = this.getAnchor(source, s)
      for (const t of sides) {
        const tp = this.getAnchor(target, t)
        const d = Math.hypot(sp.x - tp.x, sp.y - tp.y)
        if (d < minDist) {
          minDist = d
          bestFrom = sp
          bestTo = tp
          bestFromSide = s
          bestToSide = t
        }
      }
    }
    const { from, to } = this.straightenPoints(bestFrom, bestTo, 'straight')
    return { from, to, fromSide: bestFromSide, toSide: bestToSide }
  }

  /**
   * 自动拉直：若两端点近似水平/垂直（差值 < 8px），吸附到完美对齐。
   * 仅对 straight/polyline 生效，curve 不处理。
   */
  private straightenPoints(from: Point, to: Point, path: string): { from: Point; to: Point } {
    const T = 8
    if (path === 'curve') return { from, to }
    const dx = Math.abs(from.x - to.x)
    const dy = Math.abs(from.y - to.y)
    if (dx < T && dy >= T) {
      const avgX = (from.x + to.x) / 2
      return { from: { x: avgX, y: from.y }, to: { x: avgX, y: to.y } }
    }
    if (dy < T && dx >= T) {
      const avgY = (from.y + to.y) / 2
      return { from: { x: from.x, y: avgY }, to: { x: to.x, y: avgY } }
    }
    return { from, to }
  }

  // ========== SVG 渲染 ==========

  /** 展开简写属性：color → stroke + fontColor, bold → fontWeight, shadow: true → 默认值 */
  private resolveConfig(cfg: ElementConfig): ElementConfig {
    const out = { ...cfg }
    // color 简写
    if (cfg.color) {
      if (!cfg.stroke || cfg.stroke === undefined) out.stroke = cfg.color
      if (!cfg.fontColor) out.fontColor = cfg.color
    }
    // bold 简写
    if (cfg.bold && !cfg.fontWeight) out.fontWeight = 'bold'
    // shadow: true 简写
    if (cfg.shadow === true) {
      out.shadow = { dx: 0, dy: 2, blur: 4, color: 'rgba(0,0,0,0.15)' }
    }
    return out
  }

  /**
   * 渲染带 markdown 格式的文字。
   * 支持 **粗体**、*斜体*、`代码`、$公式$
   */
  private renderText(
    text: string, x: number, y: number,
    fontSize: number, fontColor: string, fontWeight: string,
    fontFamily: string, anchor: string, indent: string,
  ): string {
    const segments = parseMarkdown(text)
    const hasFormat = segments.some(s => s.bold || s.italic || s.code || s.math)
    const base = `${indent}<text x="${x}" y="${y}" text-anchor="${anchor}" dominant-baseline="middle" font-family="${fontFamily}" font-size="${fontSize}" font-weight="${fontWeight}" fill="${fontColor}">`

    if (!hasFormat) {
      return `${base}${escapeXml(text)}</text>`
    }

    let inner = ''
    for (const seg of segments) {
      const a: string[] = []
      if (seg.bold) a.push('font-weight="bold"')
      if (seg.italic) a.push('font-style="italic"')
      if (seg.code) {
        const cf = this.options.codeFont ?? "'JetBrains Mono', 'Fira Code', Menlo, monospace"
        a.push(`font-family="${cf}"`)
      }
      if (seg.math) {
        const mf = this.options.mathFont ?? "'Times New Roman', 'Latin Modern Math', serif"
        a.push('font-style="italic"', `font-family="${mf}"`)
      }
      if (a.length > 0) {
        inner += `<tspan ${a.join(' ')}>${escapeXml(seg.text)}</tspan>`
      } else {
        inner += escapeXml(seg.text)
      }
    }
    return `${base}${inner}</text>`
  }

  private resolveStroke(
    stroke?: string | StrokeConfig | 'none',
  ): { color: string; width: number; dash: number[] } | null {
    if (stroke === 'none') return null
    if (stroke === undefined) return { color: '#333333', width: 1.5, dash: [] }
    if (typeof stroke === 'string') return { color: stroke, width: 1.5, dash: [] }
    return {
      color: stroke.color ?? '#333333',
      width: stroke.width ?? 1.5,
      dash: stroke.dash ?? [],
    }
  }

  /** 渲染一个元素及其所有子元素 */
  private renderElement(el: Element, indent: string = '  '): string {
    const bounds = this.boundsMap.get(el.id)!
    const lines: string[] = []

    lines.push(`${indent}<g id="${el.id}">`)

    if (el.type === 'rect') {
      this.svgRect(el, bounds, indent + '  ', lines)
    } else if (el.type === 'circle') {
      this.svgCircle(el as Circle, bounds, indent + '  ', lines)
    } else if (el.type === 'text') {
      this.svgText(el, bounds, indent + '  ', lines)
    } else if (el.type === 'image') {
      this.svgImage(el as Image, bounds, indent + '  ', lines)
    } else if (el.type === 'diamond') {
      this.svgDiamond(el, bounds, indent + '  ', lines)
    } else if (el.type === 'trapezoid') {
      this.svgTrapezoid(el, bounds, indent + '  ', lines)
    } else if (el.type === 'cylinder') {
      this.svgCylinder(el, bounds, indent + '  ', lines)
    } else if (el.type === 'cuboid') {
      this.svgCuboid(el, bounds, indent + '  ', lines)
    } else if (el.type === 'sphere') {
      this.svgSphere(el, bounds, indent + '  ', lines)
    } else if (el.type === 'stack') {
      this.svgStack(el, bounds, indent + '  ', lines)
    }

    for (const child of el.children) {
      lines.push(this.renderElement(child, indent + '  '))
    }

    lines.push(`${indent}</g>`)
    return lines.join('\n')
  }

  private svgRect(el: Element, b: Bounds, indent: string, out: string[]): void {
    const cfg = this.resolveConfig(el.config)
    const fill = cfg.fill ?? '#f5f5f5'
    const stroke = this.resolveStroke(cfg.stroke)
    const radius = cfg.radius ?? 0

    // 阴影（resolveConfig 已将 true 转为默认对象）
    if (cfg.shadow && typeof cfg.shadow === 'object') {
      const s = cfg.shadow
      this.defs.push(
        `    <filter id="shadow_${el.id}" x="-20%" y="-20%" width="140%" height="140%">`,
        `      <feDropShadow dx="${s.dx ?? 0}" dy="${s.dy ?? 2}" stdDeviation="${s.blur ?? 4}" flood-color="${s.color ?? 'rgba(0,0,0,0.15)'}" />`,
        `    </filter>`,
      )
    }

    const a: string[] = [`x="${b.x}"`, `y="${b.y}"`, `width="${b.width}"`, `height="${b.height}"`]
    if (radius > 0) a.push(`rx="${radius}"`)
    a.push(`fill="${fill}"`)
    if (fill !== 'none' && cfg.fillOpacity !== undefined && cfg.fillOpacity < 1) {
      a.push(`fill-opacity="${cfg.fillOpacity}"`)
    }
    if (stroke) {
      a.push(`stroke="${stroke.color}"`, `stroke-width="${stroke.width}"`)
      if (stroke.dash.length > 0) a.push(`stroke-dasharray="${stroke.dash.join(' ')}"`)
    } else {
      a.push(`stroke="none"`)
    }
    if (cfg.opacity !== undefined && cfg.opacity < 1) a.push(`opacity="${cfg.opacity}"`)
    if (cfg.shadow) a.push(`filter="url(#shadow_${el.id})"`)

    out.push(`${indent}<rect ${a.join(' ')} />`)

    // 标签文字
    if (el.label) {
      const fs = cfg.fontSize ?? 14
      const fc = cfg.fontColor ?? '#333333'
      const fw = String(cfg.fontWeight ?? 'normal')
      const ff = cfg.fontFamily ?? this.defaultFont
      // 分组框：标签在顶部左侧；有子元素：标签在顶部居中；普通矩形：标签居中
      const isGroup = this.groups.some(g => g.rect.id === el.id)
      let ly: number
      let lx = b.x + b.width / 2
      let anchor = 'middle'
      if (isGroup) {
        ly = b.y + fs + 2
        lx = b.x + 10
        anchor = 'start'
      } else if (el.children.length > 0) {
        ly = b.y + fs + 8
      } else {
        ly = b.y + b.height / 2
      }
      this.textLayer.push(this.renderText(el.label, lx, ly, fs, fc, fw, ff, anchor, '  '))
    }
  }

  private svgCircle(el: Circle, b: Bounds, indent: string, out: string[]): void {
    const cfg = this.resolveConfig(el.config)
    const r = el.r
    const cx = b.x + r
    const cy = b.y + r
    const fill = cfg.fill ?? '#f5f5f5'
    const stroke = this.resolveStroke(cfg.stroke)

    const a: string[] = [`cx="${cx}"`, `cy="${cy}"`, `r="${r}"`, `fill="${fill}"`]
    if (stroke) {
      a.push(`stroke="${stroke.color}"`, `stroke-width="${stroke.width}"`)
      if (stroke.dash.length > 0) a.push(`stroke-dasharray="${stroke.dash.join(' ')}"`)
    } else {
      a.push(`stroke="none"`)
    }

    out.push(`${indent}<circle ${a.join(' ')} />`)

    if (el.label) {
      const fs = cfg.fontSize ?? 12
      const fc = cfg.fontColor ?? '#333333'
      const fw = String(cfg.fontWeight ?? 'normal')
      const ff = cfg.fontFamily ?? this.defaultFont
      this.textLayer.push(this.renderText(el.label, cx, cy, fs, fc, fw, ff, 'middle', '  '))
    }
  }

  private svgText(el: Element, b: Bounds, indent: string, out: string[]): void {
    const cfg = this.resolveConfig(el.config)
    const fs = cfg.fontSize ?? 14
    const fc = cfg.fontColor ?? '#333333'
    const fw = String(cfg.fontWeight ?? 'normal')
    const ff = cfg.fontFamily ?? this.defaultFont

    this.textLayer.push(this.renderText(el.label, b.x, b.y, fs, fc, fw, ff, 'middle', '  '))
  }

  /** 将图片文件嵌入为 base64 data URI */
  private embedImage(src: string): string {
    // 如果已经是 data URI 或 URL，直接使用
    if (src.startsWith('data:') || src.startsWith('http://') || src.startsWith('https://')) {
      return src
    }
    // 读取本地文件，转为 base64
    const ext = path.extname(src).toLowerCase()
    const mimeMap: Record<string, string> = {
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
      '.svg': 'image/svg+xml',
      '.bmp': 'image/bmp',
      '.ico': 'image/x-icon',
    }
    const mime = mimeMap[ext] ?? 'image/png'
    const data = fs.readFileSync(src)
    return `data:${mime};base64,${data.toString('base64')}`
  }

  private svgImage(el: Image, b: Bounds, indent: string, out: string[]): void {
    const cfg = this.resolveConfig(el.config)
    const radius = cfg.radius ?? 0
    const stroke = this.resolveStroke(cfg.stroke ?? 'none')
    const opacity = cfg.opacity

    const href = this.embedImage(el.src)

    // 圆角需要 clipPath
    if (radius > 0) {
      const clipId = `clip_${el.id}`
      this.defs.push(
        `    <clipPath id="${clipId}">`,
        `      <rect x="${b.x}" y="${b.y}" width="${b.width}" height="${b.height}" rx="${radius}" />`,
        `    </clipPath>`,
      )

      const imgAttrs: string[] = [
        `href="${href}"`,
        `x="${b.x}"`, `y="${b.y}"`,
        `width="${b.width}"`, `height="${b.height}"`,
        `preserveAspectRatio="xMidYMid slice"`,
        `clip-path="url(#${clipId})"`,
      ]
      if (opacity !== undefined && opacity < 1) imgAttrs.push(`opacity="${opacity}"`)
      out.push(`${indent}<image ${imgAttrs.join(' ')} />`)
    } else {
      const imgAttrs: string[] = [
        `href="${href}"`,
        `x="${b.x}"`, `y="${b.y}"`,
        `width="${b.width}"`, `height="${b.height}"`,
        `preserveAspectRatio="xMidYMid slice"`,
      ]
      if (opacity !== undefined && opacity < 1) imgAttrs.push(`opacity="${opacity}"`)
      out.push(`${indent}<image ${imgAttrs.join(' ')} />`)
    }

    // 边框
    if (stroke) {
      const borderAttrs: string[] = [
        `x="${b.x}"`, `y="${b.y}"`,
        `width="${b.width}"`, `height="${b.height}"`,
        `fill="none"`,
        `stroke="${stroke.color}"`, `stroke-width="${stroke.width}"`,
      ]
      if (radius > 0) borderAttrs.push(`rx="${radius}"`)
      if (stroke.dash.length > 0) borderAttrs.push(`stroke-dasharray="${stroke.dash.join(' ')}"`)
      out.push(`${indent}<rect ${borderAttrs.join(' ')} />`)
    }

    // 标签文字（如果有）
    if (el.label) {
      const fs = cfg.fontSize ?? 12
      const fc = cfg.fontColor ?? '#333333'
      const fw = String(cfg.fontWeight ?? 'normal')
      const ff = cfg.fontFamily ?? this.defaultFont
      this.textLayer.push(this.renderText(el.label, b.x + b.width / 2, b.y + b.height + fs + 4, fs, fc, fw, ff, 'middle', '  '))
    }
  }

  private svgDiamond(el: Element, b: Bounds, indent: string, out: string[]): void {
    const cfg = this.resolveConfig(el.config)
    const fill = cfg.fill ?? '#f5f5f5'
    const stroke = this.resolveStroke(cfg.stroke)

    const cx = b.x + b.width / 2
    const cy = b.y + b.height / 2
    const points = [
      `${r2(cx)},${r2(b.y)}`,           // top
      `${r2(b.x + b.width)},${r2(cy)}`, // right
      `${r2(cx)},${r2(b.y + b.height)}`, // bottom
      `${r2(b.x)},${r2(cy)}`,           // left
    ].join(' ')

    const a: string[] = [`points="${points}"`, `fill="${fill}"`]
    if (stroke) {
      a.push(`stroke="${stroke.color}"`, `stroke-width="${stroke.width}"`)
      if (stroke.dash.length > 0) a.push(`stroke-dasharray="${stroke.dash.join(' ')}"`)
    } else {
      a.push(`stroke="none"`)
    }
    if (cfg.opacity !== undefined && cfg.opacity < 1) a.push(`opacity="${cfg.opacity}"`)

    out.push(`${indent}<polygon ${a.join(' ')} />`)

    if (el.label) {
      const fs = cfg.fontSize ?? 12
      const fc = cfg.fontColor ?? '#333333'
      const fw = String(cfg.fontWeight ?? 'normal')
      const ff = cfg.fontFamily ?? this.defaultFont
      this.textLayer.push(this.renderText(el.label, cx, cy, fs, fc, fw, ff, 'middle', '  '))
    }
  }

  private svgTrapezoid(el: Element, b: Bounds, indent: string, out: string[]): void {
    const cfg = this.resolveConfig(el.config)
    const fill = cfg.fill ?? '#f5f5f5'
    const stroke = this.resolveStroke(cfg.stroke)
    const topRatio = cfg.topRatio ?? 0.6

    const inset = b.width * (1 - topRatio) / 2
    const points = [
      `${r2(b.x + inset)},${r2(b.y)}`,           // top-left
      `${r2(b.x + b.width - inset)},${r2(b.y)}`,  // top-right
      `${r2(b.x + b.width)},${r2(b.y + b.height)}`, // bottom-right
      `${r2(b.x)},${r2(b.y + b.height)}`,           // bottom-left
    ].join(' ')

    const a: string[] = [`points="${points}"`, `fill="${fill}"`]
    if (stroke) {
      a.push(`stroke="${stroke.color}"`, `stroke-width="${stroke.width}"`)
      if (stroke.dash.length > 0) a.push(`stroke-dasharray="${stroke.dash.join(' ')}"`)
    } else {
      a.push(`stroke="none"`)
    }
    if (cfg.opacity !== undefined && cfg.opacity < 1) a.push(`opacity="${cfg.opacity}"`)

    out.push(`${indent}<polygon ${a.join(' ')} />`)

    if (el.label) {
      const fs = cfg.fontSize ?? 12
      const fc = cfg.fontColor ?? '#333333'
      const fw = String(cfg.fontWeight ?? 'normal')
      const ff = cfg.fontFamily ?? this.defaultFont
      const cx = b.x + b.width / 2
      const cy = b.y + b.height / 2
      this.textLayer.push(this.renderText(el.label, cx, cy, fs, fc, fw, ff, 'middle', '  '))
    }
  }

  // ========== 3D 形状渲染 ==========

  private svgCylinder(el: Element, b: Bounds, indent: string, out: string[]): void {
    const cfg = this.resolveConfig(el.config)
    const fill = cfg.fill ?? '#f5f5f5'
    const stroke = this.resolveStroke(cfg.stroke)
    const depthRatio = cfg.depth ?? 0.15

    const ry = b.height * depthRatio
    const rx = b.width / 2
    const cx = b.x + b.width / 2
    const topCy = b.y + ry
    const botCy = b.y + b.height - ry

    // 阴影
    if (cfg.shadow && typeof cfg.shadow === 'object') {
      const s = cfg.shadow
      this.defs.push(
        `    <filter id="shadow_${el.id}" x="-20%" y="-20%" width="140%" height="140%">`,
        `      <feDropShadow dx="${s.dx ?? 0}" dy="${s.dy ?? 2}" stdDeviation="${s.blur ?? 4}" flood-color="${s.color ?? 'rgba(0,0,0,0.15)'}" />`,
        `    </filter>`,
      )
    }

    // 侧面深度渐变
    const gradId = `cylGrad_${el.id}`
    this.defs.push(
      `    <linearGradient id="${gradId}" x1="0" y1="0" x2="1" y2="0">`,
      `      <stop offset="0%" stop-color="rgba(0,0,0,0.1)" />`,
      `      <stop offset="50%" stop-color="rgba(0,0,0,0)" />`,
      `      <stop offset="100%" stop-color="rgba(0,0,0,0.1)" />`,
      `    </linearGradient>`,
    )

    // 柱体路径: 左线 + 底弧 + 右线 + 顶弧下半
    const bodyD = [
      `M ${r2(b.x)} ${r2(topCy)}`,
      `L ${r2(b.x)} ${r2(botCy)}`,
      `A ${r2(rx)} ${r2(ry)} 0 0 0 ${r2(b.x + b.width)} ${r2(botCy)}`,
      `L ${r2(b.x + b.width)} ${r2(topCy)}`,
      `A ${r2(rx)} ${r2(ry)} 0 0 1 ${r2(b.x)} ${r2(topCy)}`,
    ].join(' ')

    const bodyAttrs: string[] = [`d="${bodyD}"`, `fill="${fill}"`]
    if (stroke) {
      bodyAttrs.push(`stroke="${stroke.color}"`, `stroke-width="${stroke.width}"`)
      if (stroke.dash.length > 0) bodyAttrs.push(`stroke-dasharray="${stroke.dash.join(' ')}"`)
    } else {
      bodyAttrs.push(`stroke="none"`)
    }
    if (cfg.opacity !== undefined && cfg.opacity < 1) bodyAttrs.push(`opacity="${cfg.opacity}"`)
    if (cfg.shadow) bodyAttrs.push(`filter="url(#shadow_${el.id})"`)
    out.push(`${indent}<path ${bodyAttrs.join(' ')} />`)

    // 深度阴影覆盖层
    out.push(`${indent}<path d="${bodyD}" fill="url(#${gradId})" stroke="none" />`)

    // 顶盖椭圆
    const topAttrs: string[] = [
      `cx="${r2(cx)}"`, `cy="${r2(topCy)}"`,
      `rx="${r2(rx)}"`, `ry="${r2(ry)}"`,
      `fill="${fill}"`,
    ]
    if (stroke) {
      topAttrs.push(`stroke="${stroke.color}"`, `stroke-width="${stroke.width}"`)
      if (stroke.dash.length > 0) topAttrs.push(`stroke-dasharray="${stroke.dash.join(' ')}"`)
    } else {
      topAttrs.push(`stroke="none"`)
    }
    out.push(`${indent}<ellipse ${topAttrs.join(' ')} />`)

    // 标签（柱体中央）
    if (el.label) {
      const fs = cfg.fontSize ?? 12
      const fc = cfg.fontColor ?? '#333333'
      const fw = String(cfg.fontWeight ?? 'normal')
      const ff = cfg.fontFamily ?? this.defaultFont
      const labelY = (topCy + botCy) / 2
      this.textLayer.push(this.renderText(el.label, cx, labelY, fs, fc, fw, ff, 'middle', '  '))
    }
  }

  private svgCuboid(el: Element, b: Bounds, indent: string, out: string[]): void {
    const cfg = this.resolveConfig(el.config)
    const fill = cfg.fill ?? '#f5f5f5'
    const stroke = this.resolveStroke(cfg.stroke)
    const d = cfg.depth ?? 15

    // 正面四角
    const fx1 = b.x, fy1 = b.y
    const fx2 = b.x + b.width, fy2 = b.y + b.height

    // 阴影
    if (cfg.shadow && typeof cfg.shadow === 'object') {
      const s = cfg.shadow
      this.defs.push(
        `    <filter id="shadow_${el.id}" x="-20%" y="-20%" width="140%" height="140%">`,
        `      <feDropShadow dx="${s.dx ?? 0}" dy="${s.dy ?? 2}" stdDeviation="${s.blur ?? 4}" flood-color="${s.color ?? 'rgba(0,0,0,0.15)'}" />`,
        `    </filter>`,
      )
    }

    const filterAttr = cfg.shadow ? ` filter="url(#shadow_${el.id})"` : ''
    const strokeAttrs = stroke
      ? ` stroke="${stroke.color}" stroke-width="${stroke.width}"${stroke.dash.length > 0 ? ` stroke-dasharray="${stroke.dash.join(' ')}"` : ''}`
      : ' stroke="none"'

    // 右侧面（最暗）
    const rightPts = [
      `${r2(fx2)},${r2(fy1)}`,
      `${r2(fx2 + d)},${r2(fy1 - d)}`,
      `${r2(fx2 + d)},${r2(fy2 - d)}`,
      `${r2(fx2)},${r2(fy2)}`,
    ].join(' ')
    out.push(`${indent}<polygon points="${rightPts}" fill="${fill}"${strokeAttrs}${filterAttr} />`)
    out.push(`${indent}<polygon points="${rightPts}" fill="rgba(0,0,0,0.15)" stroke="none" />`)

    // 顶面（中间明度）
    const topPts = [
      `${r2(fx1)},${r2(fy1)}`,
      `${r2(fx1 + d)},${r2(fy1 - d)}`,
      `${r2(fx2 + d)},${r2(fy1 - d)}`,
      `${r2(fx2)},${r2(fy1)}`,
    ].join(' ')
    out.push(`${indent}<polygon points="${topPts}" fill="${fill}"${strokeAttrs} />`)
    out.push(`${indent}<polygon points="${topPts}" fill="rgba(0,0,0,0.08)" stroke="none" />`)

    // 正面（最亮）
    const frontAttrs: string[] = [
      `x="${r2(fx1)}"`, `y="${r2(fy1)}"`,
      `width="${r2(b.width)}"`, `height="${r2(b.height)}"`,
      `fill="${fill}"`,
    ]
    const radius = cfg.radius ?? 0
    if (radius > 0) frontAttrs.push(`rx="${radius}"`)
    if (stroke) {
      frontAttrs.push(`stroke="${stroke.color}"`, `stroke-width="${stroke.width}"`)
      if (stroke.dash.length > 0) frontAttrs.push(`stroke-dasharray="${stroke.dash.join(' ')}"`)
    } else {
      frontAttrs.push(`stroke="none"`)
    }
    if (cfg.opacity !== undefined && cfg.opacity < 1) frontAttrs.push(`opacity="${cfg.opacity}"`)
    out.push(`${indent}<rect ${frontAttrs.join(' ')} />`)

    // 标签（正面中央）
    if (el.label) {
      const fs = cfg.fontSize ?? 12
      const fc = cfg.fontColor ?? '#333333'
      const fw = String(cfg.fontWeight ?? 'normal')
      const ff = cfg.fontFamily ?? this.defaultFont
      const cx = fx1 + b.width / 2
      const cy = fy1 + b.height / 2
      this.textLayer.push(this.renderText(el.label, cx, cy, fs, fc, fw, ff, 'middle', '  '))
    }
  }

  private svgSphere(el: Element, b: Bounds, indent: string, out: string[]): void {
    const cfg = this.resolveConfig(el.config)
    const radius = (el as Sphere).r
    const cx = b.x + radius
    const cy = b.y + radius
    const fill = cfg.fill ?? '#f5f5f5'
    const stroke = this.resolveStroke(cfg.stroke)

    // 径向渐变（左上高光）
    const gradId = `sphereGrad_${el.id}`
    this.defs.push(
      `    <radialGradient id="${gradId}" cx="35%" cy="35%" r="65%">`,
      `      <stop offset="0%" stop-color="rgba(255,255,255,0.6)" />`,
      `      <stop offset="100%" stop-color="rgba(0,0,0,0)" />`,
      `    </radialGradient>`,
    )

    // 底色圆
    const a: string[] = [`cx="${r2(cx)}"`, `cy="${r2(cy)}"`, `r="${radius}"`, `fill="${fill}"`]
    if (stroke) {
      a.push(`stroke="${stroke.color}"`, `stroke-width="${stroke.width}"`)
      if (stroke.dash.length > 0) a.push(`stroke-dasharray="${stroke.dash.join(' ')}"`)
    } else {
      a.push(`stroke="none"`)
    }
    out.push(`${indent}<circle ${a.join(' ')} />`)

    // 高光覆盖层
    out.push(`${indent}<circle cx="${r2(cx)}" cy="${r2(cy)}" r="${radius}" fill="url(#${gradId})" stroke="none" />`)

    // 标签
    if (el.label) {
      const fs = cfg.fontSize ?? 12
      const fc = cfg.fontColor ?? '#333333'
      const fw = String(cfg.fontWeight ?? 'normal')
      const ff = cfg.fontFamily ?? this.defaultFont
      this.textLayer.push(this.renderText(el.label, cx, cy, fs, fc, fw, ff, 'middle', '  '))
    }
  }

  private svgStack(el: Element, b: Bounds, indent: string, out: string[]): void {
    const cfg = this.resolveConfig(el.config)
    const fill = cfg.fill ?? '#f5f5f5'
    const stroke = this.resolveStroke(cfg.stroke)
    const radius = cfg.radius ?? 0
    const count = cfg.count ?? 3
    const [dx, dy] = cfg.stackOffset ?? [6, -6]

    // 阴影（仅用于最前面一层）
    if (cfg.shadow && typeof cfg.shadow === 'object') {
      const s = cfg.shadow
      this.defs.push(
        `    <filter id="shadow_${el.id}" x="-20%" y="-20%" width="140%" height="140%">`,
        `      <feDropShadow dx="${s.dx ?? 0}" dy="${s.dy ?? 2}" stdDeviation="${s.blur ?? 4}" flood-color="${s.color ?? 'rgba(0,0,0,0.15)'}" />`,
        `    </filter>`,
      )
    }

    const strokeAttrs = stroke
      ? ` stroke="${stroke.color}" stroke-width="${stroke.width}"${stroke.dash.length > 0 ? ` stroke-dasharray="${stroke.dash.join(' ')}"` : ''}`
      : ' stroke="none"'
    const opacityAttr = (cfg.opacity !== undefined && cfg.opacity < 1) ? ` opacity="${cfg.opacity}"` : ''

    // 从最后面 (i = count-1) 到最前面 (i = 0) 渲染
    for (let i = count - 1; i >= 0; i--) {
      const ox = dx * i
      const oy = dy * i
      const rx = r2(b.x + ox)
      const ry = r2(b.y + oy)
      const rw = r2(b.width)
      const rh = r2(b.height)

      const a: string[] = [`x="${rx}"`, `y="${ry}"`, `width="${rw}"`, `height="${rh}"`]
      if (radius > 0) a.push(`rx="${radius}"`)
      a.push(`fill="${fill}"`)
      if (fill !== 'none' && cfg.fillOpacity !== undefined && cfg.fillOpacity < 1) {
        a.push(`fill-opacity="${cfg.fillOpacity}"`)
      }
      a.push(strokeAttrs.trim())
      if (opacityAttr) a.push(opacityAttr.trim())
      // 阴影仅在最后面一层
      if (cfg.shadow && i === count - 1) a.push(`filter="url(#shadow_${el.id})"`)

      out.push(`${indent}<rect ${a.join(' ')} />`)
    }

    // 标签（最前面矩形中央）
    if (el.label) {
      const fs = cfg.fontSize ?? 14
      const fc = cfg.fontColor ?? '#333333'
      const fw = String(cfg.fontWeight ?? 'normal')
      const ff = cfg.fontFamily ?? this.defaultFont
      const cx = b.x + b.width / 2
      const cy = b.y + b.height / 2
      this.textLayer.push(this.renderText(el.label, cx, cy, fs, fc, fw, ff, 'middle', '  '))
    }
  }

  // ========== 箭头渲染 ==========

  /** 构建带圆角的折线 SVG path d 属性 */
  private buildRoundedPolylinePath(points: Point[], radius: number): string {
    if (points.length < 2) return ''
    if (radius <= 0 || points.length < 3) {
      // 无圆角，直接画折线
      return 'M ' + points.map(p => `${r2(p.x)} ${r2(p.y)}`).join(' L ')
    }
    const parts: string[] = [`M ${r2(points[0].x)} ${r2(points[0].y)}`]
    for (let i = 1; i < points.length - 1; i++) {
      const prev = points[i - 1]
      const curr = points[i]
      const next = points[i + 1]
      // 前后线段方向
      const dx1 = curr.x - prev.x, dy1 = curr.y - prev.y
      const dx2 = next.x - curr.x, dy2 = next.y - curr.y
      const len1 = Math.sqrt(dx1 * dx1 + dy1 * dy1)
      const len2 = Math.sqrt(dx2 * dx2 + dy2 * dy2)
      const rr = Math.min(radius, len1 / 2, len2 / 2)
      if (rr <= 0) { parts.push(`L ${r2(curr.x)} ${r2(curr.y)}`); continue }
      // 圆弧起点：距拐点 rr 距离
      const ax = curr.x - (dx1 / len1) * rr
      const ay = curr.y - (dy1 / len1) * rr
      // 圆弧终点
      const bx = curr.x + (dx2 / len2) * rr
      const by = curr.y + (dy2 / len2) * rr
      // sweep 方向：叉积正 → 顺时针 (sweep=1)
      const cross = dx1 * dy2 - dy1 * dx2
      const sweep = cross > 0 ? 1 : 0
      parts.push(`L ${r2(ax)} ${r2(ay)}`)
      parts.push(`A ${r2(rr)} ${r2(rr)} 0 0 ${sweep} ${r2(bx)} ${r2(by)}`)
    }
    const last = points[points.length - 1]
    parts.push(`L ${r2(last.x)} ${r2(last.y)}`)
    return parts.join(' ')
  }

  /** 不同头部类型需要的线段缩短量 */
  private headOffset(head: ArrowHead, size: number): number {
    switch (head) {
      case 'triangle':
      case 'triangle-open':
      case 'stealth':       return size * 0.7
      case 'vee':           return size * 0.15
      case 'circle':
      case 'circle-open':   return size * 0.5
      case 'diamond':
      case 'diamond-open':  return size
      case 'bar':           return 1
      case 'dot':           return size * 0.25
      case 'none':          return 0
    }
  }

  private renderArrow(arrow: Arrow, indent: string = '  '): string {
    const cfg = arrow.config
    let fromPt: Point
    let toPt: Point

    // 解析锚点 + 自动推断边
    let resolvedFromSide: Side | undefined
    let resolvedToSide: Side | undefined

    if (cfg.from && cfg.to) {
      fromPt = this.getAnchor(arrow.source, cfg.from)
      toPt = this.getAnchor(arrow.target, cfg.to)
      resolvedFromSide = typeof cfg.from === 'string' ? cfg.from as Side : (cfg.from as AnchorPoint).side
      resolvedToSide = typeof cfg.to === 'string' ? cfg.to as Side : (cfg.to as AnchorPoint).side
    } else if (cfg.from) {
      fromPt = this.getAnchor(arrow.source, cfg.from)
      resolvedFromSide = typeof cfg.from === 'string' ? cfg.from as Side : (cfg.from as AnchorPoint).side
      const nearest = this.findNearest(arrow.target, fromPt)
      toPt = nearest.point
      resolvedToSide = nearest.side
    } else if (cfg.to) {
      toPt = this.getAnchor(arrow.target, cfg.to)
      resolvedToSide = typeof cfg.to === 'string' ? cfg.to as Side : (cfg.to as AnchorPoint).side
      const nearest = this.findNearest(arrow.source, toPt)
      fromPt = nearest.point
      resolvedFromSide = nearest.side
    } else {
      const snap = this.autoSnap(arrow.source, arrow.target)
      fromPt = snap.from
      toPt = snap.to
      resolvedFromSide = snap.fromSide
      resolvedToSide = snap.toSide
    }

    // 自动拉直近似水平/垂直的箭头
    const pathType0 = cfg.path ?? 'straight'
    ;({ from: fromPt, to: toPt } = this.straightenPoints(fromPt, toPt, pathType0))

    const color = cfg.color ?? '#333333'
    const lineW = cfg.width ?? 1.5
    const headSize = cfg.headSize ?? 8
    const lineStyle = cfg.style ?? 'solid'
    const head = cfg.head ?? 'triangle'
    const pathType = cfg.path ?? 'straight'

    const lines: string[] = []
    lines.push(`${indent}<g class="flowing-arrow">`)

    let dash = ''
    if (lineStyle === 'dashed') dash = ' stroke-dasharray="6 3"'
    else if (lineStyle === 'dotted') dash = ' stroke-dasharray="2 2"'

    const endOffset = this.headOffset(head, headSize)
    const startOffset = cfg.bidirectional ? this.headOffset(head, headSize) : 0

    // ---------- 路径绘制 ----------
    const straightAngle = Math.atan2(toPt.y - fromPt.y, toPt.x - fromPt.x)
    let endAngle = straightAngle   // 箭头朝向
    let startAngle = straightAngle // 尾部朝向
    let labelPt: Point = { x: (fromPt.x + toPt.x) / 2, y: (fromPt.y + toPt.y) / 2 }

    if (pathType === 'curve') {
      // 贝塞尔曲线
      const curvature = cfg.curve ?? 40
      const perpAngle = straightAngle - Math.PI / 2
      const cp: Point = {
        x: (fromPt.x + toPt.x) / 2 + curvature * Math.cos(perpAngle),
        y: (fromPt.y + toPt.y) / 2 + curvature * Math.sin(perpAngle),
      }
      // 切线方向
      startAngle = Math.atan2(cp.y - fromPt.y, cp.x - fromPt.x)
      endAngle = Math.atan2(toPt.y - cp.y, toPt.x - cp.x)
      // 缩短端点
      const sx = fromPt.x + startOffset * Math.cos(startAngle)
      const sy = fromPt.y + startOffset * Math.sin(startAngle)
      const ex = toPt.x - endOffset * Math.cos(endAngle)
      const ey = toPt.y - endOffset * Math.sin(endAngle)
      lines.push(
        `${indent}  <path d="M ${r2(sx)} ${r2(sy)} Q ${r2(cp.x)} ${r2(cp.y)} ${r2(ex)} ${r2(ey)}" ` +
        `fill="none" stroke="${color}" stroke-width="${lineW}"${dash} />`,
      )
      // 标签位置：曲线中点
      labelPt = { x: (fromPt.x + 2 * cp.x + toPt.x) / 4, y: (fromPt.y + 2 * cp.y + toPt.y) / 4 }

    } else if (pathType === 'polyline') {
      const fromSide = resolvedFromSide
      const toSide = resolvedToSide
      const startVert = fromSide === 'top' || fromSide === 'bottom'
      const cr = cfg.cornerRadius ?? 0
      let polyPoints: Point[]

      if (startVert) {
        // 垂直起步折线：↑/↓ → 水平 → ↑/↓ → 水平进入目标
        const vDir = fromSide === 'top' ? -1 : 1
        const gap = cfg.curve ?? 25
        // 同方向同侧时（如 bottom→bottom），midY 必须超过两端最远锚点
        const sameVertSide = fromSide === toSide
        const midY = sameVertSide
          ? (vDir > 0 ? Math.max(fromPt.y, toPt.y) : Math.min(fromPt.y, toPt.y)) + vDir * gap
          : fromPt.y + vDir * gap
        const sy = fromPt.y + startOffset * vDir
        startAngle = vDir < 0 ? -Math.PI / 2 : Math.PI / 2

        if (toSide === 'left' || toSide === 'right') {
          const hDir = toSide === 'left' ? -1 : 1
          const ex = toPt.x + endOffset * hDir
          endAngle = toSide === 'left' ? 0 : Math.PI
          const turnX = (fromPt.x + toPt.x) / 2
          polyPoints = [
            { x: fromPt.x, y: sy },
            { x: fromPt.x, y: midY },
            { x: turnX, y: midY },
            { x: turnX, y: toPt.y },
            { x: ex, y: toPt.y },
          ]
        } else {
          const vDir2 = toSide === 'top' ? -1 : 1
          const ey = toPt.y + endOffset * vDir2
          endAngle = vDir2 < 0 ? Math.PI / 2 : -Math.PI / 2
          polyPoints = [
            { x: fromPt.x, y: sy },
            { x: fromPt.x, y: midY },
            { x: toPt.x, y: midY },
            { x: toPt.x, y: ey },
          ]
        }
        labelPt = this.polylineLabelPosition(polyPoints)
      } else {
        const sameSide = fromSide === toSide && (fromSide === 'left' || fromSide === 'right')

        if (sameSide) {
          // 同侧绕行：← ↑/↓ → 或 → ↑/↓ ←
          const dir = fromSide === 'left' ? -1 : 1
          const bypassDist = cfg.curve ?? 30
          // bypass 必须超过两端最远的锚点，否则水平段穿过目标元素
          const edgeX = dir > 0 ? Math.max(fromPt.x, toPt.x) : Math.min(fromPt.x, toPt.x)
          const midX = edgeX + dir * bypassDist
          startAngle = dir > 0 ? 0 : Math.PI
          endAngle = dir > 0 ? Math.PI : 0
          const sx = fromPt.x + startOffset * dir
          const ex = toPt.x + endOffset * dir
          polyPoints = [
            { x: sx, y: fromPt.y },
            { x: midX, y: fromPt.y },
            { x: midX, y: toPt.y },
            { x: ex, y: toPt.y },
          ]
          labelPt = this.polylineLabelPosition(polyPoints)
        } else {
          // 检查标准 Z 型中点是否与出口/入口方向冲突
          const testMidX = (fromPt.x + toPt.x) / 2
          const exitBad = (fromSide === 'left' && testMidX > fromPt.x) ||
                          (fromSide === 'right' && testMidX < fromPt.x)
          const entryBad = (toSide === 'left' && testMidX > toPt.x) ||
                           (toSide === 'right' && testMidX < toPt.x)

          if (exitBad || entryBad) {
            // U型环绕：出口/入口朝外，无法走标准Z型
            const gap = cfg.curve ?? 25
            const srcB = this.boundsMap.get(arrow.source.id)!
            const tgtB = this.boundsMap.get(arrow.target.id)!

            // 出口方向
            const fromDir = fromSide === 'left' ? -1 : 1
            startAngle = fromDir > 0 ? 0 : Math.PI

            // 出口 X：沿出口方向超过元素边界
            const exitX = fromDir < 0
              ? Math.min(srcB.x, tgtB.x) - gap
              : Math.max(srcB.x + srcB.width, tgtB.x + tgtB.width) + gap
            const sx = fromPt.x + startOffset * fromDir

            // 入口 X：沿入口方向超过元素边界
            let entryX: number
            if (toSide === 'right') {
              entryX = Math.max(srcB.x + srcB.width, tgtB.x + tgtB.width) + gap
              endAngle = Math.PI  // 箭头从右往左
            } else if (toSide === 'left') {
              entryX = Math.min(srcB.x, tgtB.x) - gap
              endAngle = 0        // 箭头从左往右
            } else {
              entryX = toPt.x
              endAngle = toPt.y > fromPt.y ? -Math.PI / 2 : Math.PI / 2
            }
            const ex = toSide === 'right' ? toPt.x + endOffset : toSide === 'left' ? toPt.x - endOffset : toPt.x

            // 绕行 Y：选上方或下方，取距离较近的
            const topY = Math.min(srcB.y, tgtB.y) - gap
            const botY = Math.max(srcB.y + srcB.height, tgtB.y + tgtB.height) + gap
            const wrapY = (Math.abs(fromPt.y - topY) <= Math.abs(fromPt.y - botY)) ? topY : botY

            polyPoints = [
              { x: sx, y: fromPt.y },
              { x: exitX, y: fromPt.y },
              { x: exitX, y: wrapY },
              { x: entryX, y: wrapY },
              { x: entryX, y: toPt.y },
              { x: ex, y: toPt.y },
            ]
            labelPt = this.polylineLabelPosition(polyPoints)
          } else {
            // 水平起步折线：→ 到中点 → ↕ → → 到终点
            const midX = testMidX
            const sx = fromPt.x + startOffset * Math.sign(toPt.x - fromPt.x)
            const ex = toPt.x - endOffset * Math.sign(toPt.x - fromPt.x)
            endAngle = toPt.x >= fromPt.x ? 0 : Math.PI
            startAngle = endAngle
            polyPoints = [
              { x: sx, y: fromPt.y },
              { x: midX, y: fromPt.y },
              { x: midX, y: toPt.y },
              { x: ex, y: toPt.y },
            ]
            labelPt = this.polylineLabelPosition(polyPoints)
          }
        }
      }

      // 避障：偏移穿过第三方元素的内部路由段
      polyPoints = this.avoidPolylineObstacles(polyPoints, arrow.source.id, arrow.target.id)
      // 避障后重新计算标签位置
      labelPt = this.polylineLabelPosition(polyPoints)

      if (cr > 0) {
        const d = this.buildRoundedPolylinePath(polyPoints, cr)
        lines.push(
          `${indent}  <path d="${d}" fill="none" stroke="${color}" stroke-width="${lineW}"${dash} />`,
        )
      } else {
        const pts = polyPoints.map(p => `${r2(p.x)},${r2(p.y)}`).join(' ')
        lines.push(
          `${indent}  <polyline points="${pts}" fill="none" stroke="${color}" stroke-width="${lineW}"${dash} />`,
        )
      }

    } else {
      // 直线
      const sx = fromPt.x + startOffset * Math.cos(straightAngle)
      const sy = fromPt.y + startOffset * Math.sin(straightAngle)
      const ex = toPt.x - endOffset * Math.cos(straightAngle)
      const ey = toPt.y - endOffset * Math.sin(straightAngle)
      lines.push(
        `${indent}  <line x1="${r2(sx)}" y1="${r2(sy)}" x2="${r2(ex)}" y2="${r2(ey)}" ` +
        `stroke="${color}" stroke-width="${lineW}"${dash} />`,
      )
    }

    // ---------- 箭头头部 ----------
    const headSvg = this.svgHead(head, toPt, endAngle, headSize, color, lineW, indent + '  ')
    if (headSvg) lines.push(headSvg)

    if (cfg.bidirectional) {
      const tailSvg = this.svgHead(head, fromPt, startAngle + Math.PI, headSize, color, lineW, indent + '  ')
      if (tailSvg) lines.push(tailSvg)
    }

    // ---------- 标签 ----------
    if (cfg.label) {
      let finalLabelPt: Point
      if (cfg.labelOffset !== undefined) {
        finalLabelPt = { x: labelPt.x, y: labelPt.y + cfg.labelOffset }
      } else {
        finalLabelPt = this.arrowLabelPositions.get(arrow) ?? { x: labelPt.x, y: labelPt.y - 8 }
      }
      this.textLayer.push(
        `  <text x="${r2(finalLabelPt.x)}" y="${r2(finalLabelPt.y)}" text-anchor="middle" ` +
        `font-family="${this.defaultFont}" font-size="11" fill="${color}">` +
        `${escapeXml(cfg.label)}</text>`,
      )
    }

    lines.push(`${indent}</g>`)
    return lines.join('\n')
  }

  /**
   * 渲染 Fork 箭头：从一个源分叉到 N 个目标。
   * 每个分支是一条完整折线（共享主干段），末端各有独立箭头。
   */
  private renderFork(fork: Fork, indent: string = '  '): string {
    const cfg = fork.config
    const color = cfg.color ?? '#333333'
    const lineW = cfg.width ?? 1.5
    const headSize = cfg.headSize ?? 8
    const head = cfg.head ?? 'triangle'
    const cr = cfg.cornerRadius ?? 0
    const lineStyle = cfg.style ?? 'solid'

    let dash = ''
    if (lineStyle === 'dashed') dash = ' stroke-dasharray="6 3"'
    else if (lineStyle === 'dotted') dash = ' stroke-dasharray="2 2"'

    const fromSpec = cfg.from ?? 'top'
    const toSpec = cfg.to ?? 'left'
    const fromSide = typeof fromSpec === 'string' ? fromSpec : fromSpec.side
    const toSide = typeof toSpec === 'string' ? toSpec : toSpec.side

    const srcPt = this.getAnchor(fork.source, fromSpec)
    const endOffset = this.headOffset(head, headSize)
    const stemVert = fromSide === 'top' || fromSide === 'bottom'

    const lines: string[] = [`${indent}<g class="flowing-fork">`]

    for (const target of fork.targets) {
      const tgt = this.getAnchor(target, toSpec)
      let branchPts: Point[]
      let endAngle: number

      if (stemVert) {
        const vDir = fromSide === 'top' ? -1 : 1
        const gap = cfg.curve ?? 25
        const splitY = srcPt.y + vDir * gap

        if (toSide === 'left' || toSide === 'right') {
          const hDir = toSide === 'left' ? -1 : 1
          const ex = tgt.x + endOffset * hDir
          endAngle = toSide === 'left' ? 0 : Math.PI
          const dropX = (srcPt.x + tgt.x) / 2
          branchPts = [
            srcPt,
            { x: srcPt.x, y: splitY },
            { x: dropX, y: splitY },
            { x: dropX, y: tgt.y },
            { x: ex, y: tgt.y },
          ]
        } else {
          const vDir2 = toSide === 'top' ? -1 : 1
          const ey = tgt.y + endOffset * vDir2
          endAngle = vDir2 < 0 ? Math.PI / 2 : -Math.PI / 2
          branchPts = [
            srcPt,
            { x: srcPt.x, y: splitY },
            { x: tgt.x, y: splitY },
            { x: tgt.x, y: ey },
          ]
        }
      } else {
        const hDir = fromSide === 'right' ? 1 : -1
        const gap = cfg.curve ?? 25
        const splitX = srcPt.x + hDir * gap

        if (toSide === 'top' || toSide === 'bottom') {
          const vDir2 = toSide === 'top' ? -1 : 1
          const ey = tgt.y + endOffset * vDir2
          endAngle = vDir2 < 0 ? Math.PI / 2 : -Math.PI / 2
          const dropY = (srcPt.y + tgt.y) / 2
          branchPts = [
            srcPt,
            { x: splitX, y: srcPt.y },
            { x: splitX, y: dropY },
            { x: tgt.x, y: dropY },
            { x: tgt.x, y: ey },
          ]
        } else {
          const hDir2 = toSide === 'left' ? -1 : 1
          const ex = tgt.x + endOffset * hDir2
          endAngle = toSide === 'left' ? 0 : Math.PI
          branchPts = [
            srcPt,
            { x: splitX, y: srcPt.y },
            { x: splitX, y: tgt.y },
            { x: ex, y: tgt.y },
          ]
        }
      }

      // 渲染分支路径
      if (cr > 0) {
        const d = this.buildRoundedPolylinePath(branchPts, cr)
        lines.push(
          `${indent}  <path d="${d}" fill="none" stroke="${color}" stroke-width="${lineW}"${dash} />`,
        )
      } else {
        const pts = branchPts.map(p => `${r2(p.x)},${r2(p.y)}`).join(' ')
        lines.push(
          `${indent}  <polyline points="${pts}" fill="none" stroke="${color}" stroke-width="${lineW}"${dash} />`,
        )
      }

      // 箭头头部
      const headSvg = this.svgHead(head, tgt, endAngle, headSize, color, lineW, indent + '  ')
      if (headSvg) lines.push(headSvg)
    }

    lines.push(`${indent}</g>`)
    return lines.join('\n')
  }

  /** 找到元素上离目标点最近的锚点，同时返回所选的边 */
  private findNearest(el: Element, target: Point): { point: Point; side: Side } {
    const sides: Side[] = ['top', 'bottom', 'left', 'right']
    let best = this.getAnchor(el, 'top')
    let bestSide: Side = 'top'
    let minD = Infinity
    for (const s of sides) {
      const p = this.getAnchor(el, s)
      const d = Math.hypot(p.x - target.x, p.y - target.y)
      if (d < minD) { minD = d; best = p; bestSide = s }
    }
    return { point: best, side: bestSide }
  }

  // ========== 11 种箭头头部 ==========

  private svgHead(
    head: ArrowHead, tip: Point, angle: number,
    size: number, color: string, lineW: number, indent: string,
  ): string | null {
    const PI = Math.PI
    const cos = Math.cos
    const sin = Math.sin

    switch (head) {

      // ▶ 实心三角
      case 'triangle': {
        const a1 = angle + PI * 0.82, a2 = angle - PI * 0.82
        return `${indent}<polygon points="${pt(tip)} ${pt2(tip, a1, size)} ${pt2(tip, a2, size)}" fill="${color}" />`
      }

      // ▷ 空心三角
      case 'triangle-open': {
        const a1 = angle + PI * 0.82, a2 = angle - PI * 0.82
        return `${indent}<polygon points="${pt(tip)} ${pt2(tip, a1, size)} ${pt2(tip, a2, size)}" fill="white" stroke="${color}" stroke-width="${lineW}" />`
      }

      // ➤ 尖锐箭头（stealth）：更窄更长，带凹槽
      case 'stealth': {
        const len = size * 1.2
        const a1 = angle + PI * 0.88, a2 = angle - PI * 0.88
        const back: Point = { x: tip.x + len * 0.5 * cos(angle + PI), y: tip.y + len * 0.5 * sin(angle + PI) }
        return `${indent}<polygon points="${pt(tip)} ${pt2(tip, a1, len)} ${pt(back)} ${pt2(tip, a2, len)}" fill="${color}" />`
      }

      // > V 字形（仅线条，不填充）
      case 'vee': {
        const a1 = angle + PI * 0.78, a2 = angle - PI * 0.78
        return (
          `${indent}<polyline points="${pt2(tip, a1, size)} ${pt(tip)} ${pt2(tip, a2, size)}" ` +
          `fill="none" stroke="${color}" stroke-width="${lineW}" stroke-linejoin="round" />`
        )
      }

      // ● 实心圆
      case 'circle': {
        const cr = size * 0.45
        const cx = tip.x - cr * cos(angle)
        const cy = tip.y - cr * sin(angle)
        return `${indent}<circle cx="${r2(cx)}" cy="${r2(cy)}" r="${r2(cr)}" fill="${color}" />`
      }

      // ○ 空心圆
      case 'circle-open': {
        const cr = size * 0.45
        const cx = tip.x - cr * cos(angle)
        const cy = tip.y - cr * sin(angle)
        return `${indent}<circle cx="${r2(cx)}" cy="${r2(cy)}" r="${r2(cr)}" fill="white" stroke="${color}" stroke-width="${lineW}" />`
      }

      // ◆ 实心菱形
      case 'diamond': {
        const half = size * 0.5
        const tipPt = tip
        const backPt: Point = { x: tip.x + size * cos(angle + PI), y: tip.y + size * sin(angle + PI) }
        const perpA = angle + PI / 2
        const mid: Point = { x: (tip.x + backPt.x) / 2, y: (tip.y + backPt.y) / 2 }
        const left: Point = { x: mid.x + half * cos(perpA), y: mid.y + half * sin(perpA) }
        const right: Point = { x: mid.x - half * cos(perpA), y: mid.y - half * sin(perpA) }
        return `${indent}<polygon points="${pt(tipPt)} ${pt(left)} ${pt(backPt)} ${pt(right)}" fill="${color}" />`
      }

      // ◇ 空心菱形
      case 'diamond-open': {
        const half = size * 0.5
        const backPt: Point = { x: tip.x + size * cos(angle + PI), y: tip.y + size * sin(angle + PI) }
        const perpA = angle + PI / 2
        const mid: Point = { x: (tip.x + backPt.x) / 2, y: (tip.y + backPt.y) / 2 }
        const left: Point = { x: mid.x + half * cos(perpA), y: mid.y + half * sin(perpA) }
        const right: Point = { x: mid.x - half * cos(perpA), y: mid.y - half * sin(perpA) }
        return `${indent}<polygon points="${pt(tip)} ${pt(left)} ${pt(backPt)} ${pt(right)}" fill="white" stroke="${color}" stroke-width="${lineW}" />`
      }

      // | 竖线
      case 'bar': {
        const perpA = angle + PI / 2
        const x1 = tip.x + size * 0.6 * cos(perpA)
        const y1 = tip.y + size * 0.6 * sin(perpA)
        const x2 = tip.x - size * 0.6 * cos(perpA)
        const y2 = tip.y - size * 0.6 * sin(perpA)
        return `${indent}<line x1="${r2(x1)}" y1="${r2(y1)}" x2="${r2(x2)}" y2="${r2(y2)}" stroke="${color}" stroke-width="${lineW + 0.5}" />`
      }

      // • 小圆点
      case 'dot': {
        const dr = size * 0.2
        return `${indent}<circle cx="${r2(tip.x)}" cy="${r2(tip.y)}" r="${r2(dr)}" fill="${color}" />`
      }

      case 'none':
        return null
    }
  }

  // ========== 输出 ==========

  /** 计算分组框位置（包裹成员元素） */
  private computeGroupBounds(): void {
    for (const g of this.groups) {
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
      for (const member of g.members) {
        const mb = this.boundsMap.get(member.id)
        if (!mb) continue
        minX = Math.min(minX, mb.x)
        minY = Math.min(minY, mb.y)
        maxX = Math.max(maxX, mb.x + mb.width)
        maxY = Math.max(maxY, mb.y + mb.height)
      }
      if (isFinite(minX)) {
        const p = g.padding
        const labelH = g.rect.label ? 20 : 0
        if (g.size) {
          const [gw, gh] = g.size
          const naturalW = maxX - minX + p * 2
          const naturalH = maxY - minY + p * 2 + labelH
          const extraW = Math.max(0, gw - naturalW)
          const extraH = Math.max(0, gh - naturalH)
          this.boundsMap.set(g.rect.id, {
            x: r(minX - p - extraW / 2),
            y: r(minY - p - labelH - extraH / 2),
            width: r(Math.max(gw, naturalW)),
            height: r(Math.max(gh, naturalH)),
          })
        } else {
          this.boundsMap.set(g.rect.id, {
            x: r(minX - p),
            y: r(minY - p - labelH),
            width: r(maxX - minX + p * 2),
            height: r(maxY - minY + p * 2 + labelH),
          })
        }
      }
    }
  }

  // ========== 自动对齐 + 防重叠 ==========

  /**
   * 综合自动对齐：
   * 1. 扇出/扇入（1→N, N→1）→ 单元素对齐到多元素组中心（带防重叠检测）
   * 2. 同行元素（相近 Y）→ 垂直居中对齐
   * 3. 同列元素（相近 X）→ 水平居中对齐
   */
  private autoAlignRows(): void {
    if (this.options.autoAlign === false) return

    const tolerance = this.options.alignTolerance ?? 20
    const groupIds = new Set(this.groups.map(g => g.rect.id))

    // 收集顶层非文字、非分组框、非零尺寸元素
    type Entry = { el: Element; bounds: Bounds; cx: number; cy: number }
    const entries: Entry[] = []
    for (const el of this.children) {
      const b = this.boundsMap.get(el.id)
      if (!b || b.width === 0 || b.height === 0) continue
      if (el.type === 'text') continue
      if (groupIds.has(el.id)) continue
      // 跳过用作箭头锚点的微小元素（size ≤ 10px）
      if (b.width <= 10 && b.height <= 10) continue
      entries.push({ el, bounds: b, cx: b.x + b.width / 2, cy: b.y + b.height / 2 })
    }

    // 构建连通分量：只在有箭头连接的元素间对齐
    const componentOf = this.buildConnectedComponents(entries)
    const components = new Map<string, Entry[]>()
    for (const e of entries) {
      const comp = componentOf.get(e.el.id)!
      if (!components.has(comp)) components.set(comp, [])
      components.get(comp)!.push(e)
    }

    for (const [, compEntries] of components) {
      if (compEntries.length < 2) continue

      // --- 步骤 1：扇出/扇入对齐 ---
      this.autoAlignFanOut(compEntries)
      this.refreshEntries(compEntries)

      // --- 步骤 2：同行对齐（相近 Y → 统一 Y 中心）---
      compEntries.sort((a, b) => a.cy - b.cy)
      const usedRow = new Set<string>()
      for (let i = 0; i < compEntries.length; i++) {
        if (usedRow.has(compEntries[i].el.id)) continue
        const group = [compEntries[i]]
        usedRow.add(compEntries[i].el.id)

        for (let j = i + 1; j < compEntries.length; j++) {
          if (usedRow.has(compEntries[j].el.id)) continue
          const avgCy = group.reduce((s, g) => s + g.cy, 0) / group.length
          if (Math.abs(compEntries[j].cy - avgCy) <= tolerance) {
            group.push(compEntries[j])
            usedRow.add(compEntries[j].el.id)
          }
        }
        if (group.length < 2) continue

        const avgCy = group.reduce((s, g) => s + g.cy, 0) / group.length
        for (const g of group) {
          const dy = avgCy - g.cy
          if (Math.abs(dy) < 0.5) continue
          if (this.wouldOverlap(g.el, 0, dy, entries)) continue
          this.shiftElement(g.el, 0, dy)
          g.bounds = this.boundsMap.get(g.el.id)!
          g.cy = g.bounds.y + g.bounds.height / 2
        }
      }

      // --- 步骤 3：同列对齐（相近 X → 统一 X 中心）---
      this.refreshEntries(compEntries)
      compEntries.sort((a, b) => a.cx - b.cx)
      const usedCol = new Set<string>()
      for (let i = 0; i < compEntries.length; i++) {
        if (usedCol.has(compEntries[i].el.id)) continue
        const group = [compEntries[i]]
        usedCol.add(compEntries[i].el.id)

        for (let j = i + 1; j < compEntries.length; j++) {
          if (usedCol.has(compEntries[j].el.id)) continue
          const avgCx = group.reduce((s, g) => s + g.cx, 0) / group.length
          if (Math.abs(compEntries[j].cx - avgCx) <= tolerance) {
            group.push(compEntries[j])
            usedCol.add(compEntries[j].el.id)
          }
        }
        if (group.length < 2) continue

        const avgCx = group.reduce((s, g) => s + g.cx, 0) / group.length
        for (const g of group) {
          const dx = avgCx - g.cx
          if (Math.abs(dx) < 0.5) continue
          if (this.wouldOverlap(g.el, dx, 0, entries)) continue
          this.shiftElement(g.el, dx, 0)
          g.bounds = this.boundsMap.get(g.el.id)!
          g.cx = g.bounds.x + g.bounds.width / 2
        }
      }
    }
  }

  /** 刷新 entries 的 bounds/cx/cy 缓存 */
  private refreshEntries(entries: Array<{ el: Element; bounds: Bounds; cx: number; cy: number }>): void {
    for (const e of entries) {
      const b = this.boundsMap.get(e.el.id)!
      e.bounds = b
      e.cx = b.x + b.width / 2
      e.cy = b.y + b.height / 2
    }
  }

  /** 构建连通分量（Union-Find），只在有箭头连接的元素间对齐 */
  private buildConnectedComponents(entries: Array<{ el: Element }>): Map<string, string> {
    const parent = new Map<string, string>()
    const find = (x: string): string => {
      if (!parent.has(x)) parent.set(x, x)
      let root = x
      while (parent.get(root) !== root) root = parent.get(root)!
      let curr = x
      while (curr !== root) {
        const next = parent.get(curr)!
        parent.set(curr, root)
        curr = next
      }
      return root
    }
    const union = (a: string, b: string): void => {
      const ra = find(a), rb = find(b)
      if (ra !== rb) parent.set(ra, rb)
    }
    for (const e of entries) parent.set(e.el.id, e.el.id)
    for (const arrow of this._arrows) {
      if (parent.has(arrow.source.id) && parent.has(arrow.target.id)) {
        union(arrow.source.id, arrow.target.id)
      }
    }
    const result = new Map<string, string>()
    for (const e of entries) result.set(e.el.id, find(e.el.id))
    return result
  }

  /**
   * 扇出/扇入对齐（带防重叠）：
   * - 1→N：source 对齐到 targets 组的 Y 中心
   * - N→1：target 对齐到 sources 组的 Y 中心
   * - 仅当目标元素在同一列（X 相近）且移动不会造成重叠时才对齐
   */
  private autoAlignFanOut(entries: Array<{ el: Element; bounds: Bounds; cx: number; cy: number }>): void {
    const entryMap = new Map(entries.map(e => [e.el.id, e]))

    const outgoing = new Map<string, Element[]>()
    const incoming = new Map<string, Element[]>()

    for (const arrow of this._arrows) {
      const sid = arrow.source.id, tid = arrow.target.id
      if (!outgoing.has(sid)) outgoing.set(sid, [])
      outgoing.get(sid)!.push(arrow.target)
      if (!incoming.has(tid)) incoming.set(tid, [])
      incoming.get(tid)!.push(arrow.source)
    }

    const aligned = new Set<string>()

    // 1→N
    for (const [sid, targets] of outgoing) {
      if (targets.length < 2 || aligned.has(sid)) continue
      const srcEntry = entryMap.get(sid)
      if (!srcEntry) continue

      // 同时也是多个入度的元素跳过（如菱形既接收又发出）
      const inCount = incoming.get(sid)?.length ?? 0
      if (inCount > 0 && targets.length <= 2) continue  // 有入度的非纯扇出跳过

      const tgtEntries = targets.map(t => entryMap.get(t.id)).filter(Boolean) as typeof entries
      if (tgtEntries.length < 2) continue
      const avgTgtX = tgtEntries.reduce((s, e) => s + e.cx, 0) / tgtEntries.length
      if (!tgtEntries.every(e => Math.abs(e.cx - avgTgtX) < 40)) continue

      const minTgtY = Math.min(...tgtEntries.map(e => e.bounds.y))
      const maxTgtY = Math.max(...tgtEntries.map(e => e.bounds.y + e.bounds.height))
      const tgtCenterY = (minTgtY + maxTgtY) / 2
      const dy = tgtCenterY - srcEntry.cy

      if (Math.abs(dy) > 1 && !this.wouldOverlap(srcEntry.el, 0, dy, entries)) {
        this.shiftElement(srcEntry.el, 0, dy)
        srcEntry.cy += dy
        srcEntry.bounds = this.boundsMap.get(sid)!
        aligned.add(sid)
      }
    }

    // N→1
    for (const [tid, sources] of incoming) {
      if (sources.length < 2 || aligned.has(tid)) continue
      const tgtEntry = entryMap.get(tid)
      if (!tgtEntry) continue

      const outCount = outgoing.get(tid)?.length ?? 0
      if (outCount > 0 && sources.length <= 2) continue

      const srcEntries = sources.map(s => entryMap.get(s.id)).filter(Boolean) as typeof entries
      if (srcEntries.length < 2) continue
      const avgSrcX = srcEntries.reduce((s, e) => s + e.cx, 0) / srcEntries.length
      if (!srcEntries.every(e => Math.abs(e.cx - avgSrcX) < 40)) continue

      const minSrcY = Math.min(...srcEntries.map(e => e.bounds.y))
      const maxSrcY = Math.max(...srcEntries.map(e => e.bounds.y + e.bounds.height))
      const srcCenterY = (minSrcY + maxSrcY) / 2
      const dy = srcCenterY - tgtEntry.cy

      if (Math.abs(dy) > 1 && !this.wouldOverlap(tgtEntry.el, 0, dy, entries)) {
        this.shiftElement(tgtEntry.el, 0, dy)
        tgtEntry.cy += dy
        tgtEntry.bounds = this.boundsMap.get(tid)!
        aligned.add(tid)
      }
    }
  }

  /** 检测移动 (dx, dy) 后是否会与其他元素重叠 */
  private wouldOverlap(
    el: Element, dx: number, dy: number,
    entries: Array<{ el: Element; bounds: Bounds }>,
  ): boolean {
    const b = this.boundsMap.get(el.id)
    if (!b) return false
    const moved: Bounds = {
      x: b.x + dx, y: b.y + dy,
      width: b.width, height: b.height,
    }
    // 加 2px 间距避免紧贴
    const padded: Bounds = {
      x: moved.x - 2, y: moved.y - 2,
      width: moved.width + 4, height: moved.height + 4,
    }
    for (const e of entries) {
      if (e.el.id === el.id) continue
      if (e.bounds.width <= 10 && e.bounds.height <= 10) continue
      if (this.bboxOverlap(padded, e.bounds)) return true
    }
    return false
  }

  /** 移动元素及其所有子元素 */
  private shiftElement(el: Element, dx: number, dy: number): void {
    const b = this.boundsMap.get(el.id)
    if (!b) return
    this.boundsMap.set(el.id, {
      x: r(b.x + dx),
      y: r(b.y + dy),
      width: b.width,
      height: b.height,
    })
    for (const child of el.children) {
      this.shiftElement(child, dx, dy)
    }
  }

  /** 预计算箭头标签位置，避免与元素重叠 */
  private resolveArrowLabelPositions(): void {
    if (this.options.antiOverlap === false) return
    this.arrowLabelPositions.clear()

    for (const arrow of this._arrows) {
      const cfg = arrow.config
      if (!cfg.label) continue
      if (cfg.labelOffset !== undefined) continue

      // 计算端点（同 renderArrow 逻辑）+ 自动推断边
      let fromPt: Point, toPt: Point
      let resolvedFromSide: Side | undefined
      let resolvedToSide: Side | undefined

      if (cfg.from && cfg.to) {
        fromPt = this.getAnchor(arrow.source, cfg.from)
        toPt = this.getAnchor(arrow.target, cfg.to)
        resolvedFromSide = typeof cfg.from === 'string' ? cfg.from as Side : (cfg.from as AnchorPoint).side
        resolvedToSide = typeof cfg.to === 'string' ? cfg.to as Side : (cfg.to as AnchorPoint).side
      } else if (cfg.from) {
        fromPt = this.getAnchor(arrow.source, cfg.from)
        resolvedFromSide = typeof cfg.from === 'string' ? cfg.from as Side : (cfg.from as AnchorPoint).side
        const nearest = this.findNearest(arrow.target, fromPt)
        toPt = nearest.point
        resolvedToSide = nearest.side
      } else if (cfg.to) {
        toPt = this.getAnchor(arrow.target, cfg.to)
        resolvedToSide = typeof cfg.to === 'string' ? cfg.to as Side : (cfg.to as AnchorPoint).side
        const nearest = this.findNearest(arrow.source, toPt)
        fromPt = nearest.point
        resolvedFromSide = nearest.side
      } else {
        const snap = this.autoSnap(arrow.source, arrow.target)
        fromPt = snap.from
        toPt = snap.to
        resolvedFromSide = snap.fromSide
        resolvedToSide = snap.toSide
      }

      // 自动拉直（与 renderArrow 保持同步）
      const pathType = cfg.path ?? 'straight'
      ;({ from: fromPt, to: toPt } = this.straightenPoints(fromPt, toPt, pathType))

      let labelPt: Point

      if (pathType === 'curve') {
        const curvature = cfg.curve ?? 40
        const angle = Math.atan2(toPt.y - fromPt.y, toPt.x - fromPt.x)
        const perpAngle = angle - Math.PI / 2
        const cpx = (fromPt.x + toPt.x) / 2 + curvature * Math.cos(perpAngle)
        const cpy = (fromPt.y + toPt.y) / 2 + curvature * Math.sin(perpAngle)
        labelPt = {
          x: (fromPt.x + 2 * cpx + toPt.x) / 4,
          y: (fromPt.y + 2 * cpy + toPt.y) / 4 - 8,
        }
      } else if (pathType === 'polyline') {
        // 使用与 renderArrow 相同的 polyline 路由逻辑构建点
        const fromSide = resolvedFromSide
        const toSide = resolvedToSide
        const startVert = fromSide === 'top' || fromSide === 'bottom'
        let polyPts: Point[]
        if (startVert) {
          const vDir = fromSide === 'top' ? -1 : 1
          const midY = fromPt.y + vDir * (cfg.curve ?? 25)
          if (toSide === 'left' || toSide === 'right') {
            const turnX = (fromPt.x + toPt.x) / 2
            polyPts = [fromPt, { x: fromPt.x, y: midY }, { x: turnX, y: midY }, { x: turnX, y: toPt.y }, toPt]
          } else {
            polyPts = [fromPt, { x: fromPt.x, y: midY }, { x: toPt.x, y: midY }, toPt]
          }
        } else {
          const sameSide = fromSide === toSide && (fromSide === 'left' || fromSide === 'right')
          if (sameSide) {
            const dir = fromSide === 'left' ? -1 : 1
            const midX = fromPt.x + dir * (cfg.curve ?? 30)
            polyPts = [fromPt, { x: midX, y: fromPt.y }, { x: midX, y: toPt.y }, toPt]
          } else {
            const testMidX = (fromPt.x + toPt.x) / 2
            const exitBad = (fromSide === 'left' && testMidX > fromPt.x) ||
                            (fromSide === 'right' && testMidX < fromPt.x)
            const entryBad = (toSide === 'left' && testMidX > toPt.x) ||
                             (toSide === 'right' && testMidX < toPt.x)
            if (exitBad || entryBad) {
              const gap = cfg.curve ?? 25
              const srcB = this.boundsMap.get(arrow.source.id)!
              const tgtB = this.boundsMap.get(arrow.target.id)!
              const fromDir = fromSide === 'left' ? -1 : 1
              const exitX = fromDir < 0
                ? Math.min(srcB.x, tgtB.x) - gap
                : Math.max(srcB.x + srcB.width, tgtB.x + tgtB.width) + gap
              let entryX: number
              if (toSide === 'right') {
                entryX = Math.max(srcB.x + srcB.width, tgtB.x + tgtB.width) + gap
              } else if (toSide === 'left') {
                entryX = Math.min(srcB.x, tgtB.x) - gap
              } else {
                entryX = toPt.x
              }
              const topY = Math.min(srcB.y, tgtB.y) - gap
              const botY = Math.max(srcB.y + srcB.height, tgtB.y + tgtB.height) + gap
              const wrapY = (Math.abs(fromPt.y - topY) <= Math.abs(fromPt.y - botY)) ? topY : botY
              polyPts = [fromPt, { x: exitX, y: fromPt.y }, { x: exitX, y: wrapY }, { x: entryX, y: wrapY }, { x: entryX, y: toPt.y }, toPt]
            } else {
              const midX = testMidX
              polyPts = [fromPt, { x: midX, y: fromPt.y }, { x: midX, y: toPt.y }, toPt]
            }
          }
        }
        const mid = this.polylineLabelPosition(polyPts)
        labelPt = { x: mid.x, y: mid.y - 8 }
      } else {
        labelPt = { x: (fromPt.x + toPt.x) / 2, y: (fromPt.y + toPt.y) / 2 - 8 }
      }

      // 估算标签 bbox
      const fontSize = 11
      const labelW = cfg.label.length * fontSize * 0.6
      const labelH = fontSize * 1.4
      const labelBbox: Bounds = {
        x: labelPt.x - labelW / 2,
        y: labelPt.y - labelH / 2,
        width: labelW,
        height: labelH,
      }

      // 检测重叠
      if (this.bboxOverlapsAny(labelBbox)) {
        const angle = Math.atan2(toPt.y - fromPt.y, toPt.x - fromPt.x)
        const perpAngle = angle - Math.PI / 2

        let resolved = false
        for (let dist = 15; dist <= 60; dist += 10) {
          for (const sign of [-1, 1]) {
            const candidate: Point = {
              x: labelPt.x + sign * dist * Math.cos(perpAngle),
              y: labelPt.y + sign * dist * Math.sin(perpAngle),
            }
            const candidateBbox: Bounds = {
              x: candidate.x - labelW / 2,
              y: candidate.y - labelH / 2,
              width: labelW,
              height: labelH,
            }
            if (!this.bboxOverlapsAny(candidateBbox)) {
              labelPt = candidate
              resolved = true
              break
            }
          }
          if (resolved) break
        }
      }

      // 限制标签在画布内
      labelPt = this.clampLabelToCanvas(labelPt, labelW, labelH)

      this.arrowLabelPositions.set(arrow, labelPt)
    }
  }

  /** 检测 bbox 是否与任何元素重叠 */
  private bboxOverlapsAny(bbox: Bounds): boolean {
    for (const b of this.boundsMap.values()) {
      if (b.width === 0 && b.height === 0) continue
      if (this.bboxOverlap(bbox, b)) return true
    }
    return false
  }

  private bboxOverlap(a: Bounds, b: Bounds): boolean {
    return !(
      a.x + a.width < b.x ||
      b.x + b.width < a.x ||
      a.y + a.height < b.y ||
      b.y + b.height < a.y
    )
  }

  /** 计算所有元素的外接矩形 */
  private calculateContentBounds(): Bounds {
    let minX = Infinity, minY = Infinity
    let maxX = -Infinity, maxY = -Infinity

    for (const b of this.boundsMap.values()) {
      // 跳过零尺寸的文字节点（只有位置点），用一个估算范围
      if (b.width === 0 && b.height === 0) {
        minX = Math.min(minX, b.x - 60)
        minY = Math.min(minY, b.y - 12)
        maxX = Math.max(maxX, b.x + 60)
        maxY = Math.max(maxY, b.y + 12)
      } else {
        minX = Math.min(minX, b.x)
        minY = Math.min(minY, b.y)
        maxX = Math.max(maxX, b.x + b.width)
        maxY = Math.max(maxY, b.y + b.height)
      }
    }

    // 也考虑箭头端点（曲线箭头可能超出元素范围）
    for (const arrow of this._arrows) {
      const cfg = arrow.config
      let fromPt: Point, toPt: Point
      if (cfg.from && cfg.to) {
        fromPt = this.getAnchor(arrow.source, cfg.from)
        toPt = this.getAnchor(arrow.target, cfg.to)
      } else {
        const snap = this.autoSnap(arrow.source, arrow.target)
        fromPt = snap.from
        toPt = snap.to
      }
      minX = Math.min(minX, fromPt.x, toPt.x)
      minY = Math.min(minY, fromPt.y, toPt.y)
      maxX = Math.max(maxX, fromPt.x, toPt.x)
      maxY = Math.max(maxY, fromPt.y, toPt.y)

      // 曲线控制点也要纳入
      if (cfg.path === 'curve') {
        const curvature = cfg.curve ?? 40
        const angle = Math.atan2(toPt.y - fromPt.y, toPt.x - fromPt.x)
        const perpAngle = angle - Math.PI / 2
        const cpx = (fromPt.x + toPt.x) / 2 + curvature * Math.cos(perpAngle)
        const cpy = (fromPt.y + toPt.y) / 2 + curvature * Math.sin(perpAngle)
        minX = Math.min(minX, cpx)
        minY = Math.min(minY, cpy)
        maxX = Math.max(maxX, cpx)
        maxY = Math.max(maxY, cpy)
      }
    }

    // Fork 箭头端点
    for (const fork of this._forks) {
      const cfg = fork.config
      const fromSpec = cfg.from ?? 'top'
      const toSpec = cfg.to ?? 'left'
      const srcPt = this.getAnchor(fork.source, fromSpec)
      minX = Math.min(minX, srcPt.x)
      minY = Math.min(minY, srcPt.y)
      maxX = Math.max(maxX, srcPt.x)
      maxY = Math.max(maxY, srcPt.y)
      for (const target of fork.targets) {
        const tgt = this.getAnchor(target, toSpec)
        minX = Math.min(minX, tgt.x)
        minY = Math.min(minY, tgt.y)
        maxX = Math.max(maxX, tgt.x)
        maxY = Math.max(maxY, tgt.y)
      }
    }

    // Cuboid 3D 延伸超出 boundsMap 的正面范围
    const expandCuboids = (els: Element[]) => {
      for (const el of els) {
        if (el.type === 'cuboid') {
          const cb = this.boundsMap.get(el.id)
          if (cb) {
            const depth = el.config.depth ?? 15
            maxX = Math.max(maxX, cb.x + cb.width + depth)
            minY = Math.min(minY, cb.y - depth)
          }
        }
        if (el.children.length > 0) expandCuboids(el.children)
      }
    }
    expandCuboids(this.children)

    // Stack 偏移层超出 boundsMap 的前面矩形范围
    const expandStacks = (els: Element[]) => {
      for (const el of els) {
        if (el.type === 'stack') {
          const sb = this.boundsMap.get(el.id)
          if (sb) {
            const count = el.config.count ?? 3
            const [dx, dy] = el.config.stackOffset ?? [6, -6]
            const backDx = dx * (count - 1)
            const backDy = dy * (count - 1)
            // 扩展到包含最后面一层矩形
            minX = Math.min(minX, sb.x + Math.min(0, backDx))
            minY = Math.min(minY, sb.y + Math.min(0, backDy))
            maxX = Math.max(maxX, sb.x + sb.width + Math.max(0, backDx))
            maxY = Math.max(maxY, sb.y + sb.height + Math.max(0, backDy))
          }
        }
        if (el.children.length > 0) expandStacks(el.children)
      }
    }
    expandStacks(this.children)

    if (!isFinite(minX)) return { x: 0, y: 0, width: this.width, height: this.height }
    return { x: minX, y: minY, width: maxX - minX, height: maxY - minY }
  }

  /** 渲染为 SVG 字符串 */
  render(options?: ExportOptions): string {
    this.boundsMap.clear()
    this.defs = []
    this.arrowLabelPositions.clear()
    this.textLayer = []
    this.resolveAll(this.children, this.bounds)

    // 计算分组框的位置（包裹成员元素）
    this.computeGroupBounds()

    // 自动行对齐
    this.autoAlignRows()

    // 对齐后重新计算分组框
    if (this.groups.length > 0) this.computeGroupBounds()

    // 箭头标签防重叠
    this.resolveArrowLabelPositions()

    // 计算视口
    let vx = 0, vy = 0, vw = this.width, vh = this.height
    if (options?.fit) {
      const cb = this.calculateContentBounds()
      const margin = options.margin ?? 20
      vx = r(cb.x - margin)
      vy = r(cb.y - margin)
      vw = r(cb.width + margin * 2)
      vh = r(cb.height + margin * 2)
    }

    const parts: string[] = []
    parts.push(
      `<svg xmlns="http://www.w3.org/2000/svg" width="${vw}" height="${vh}" ` +
      `viewBox="${vx} ${vy} ${vw} ${vh}">`,
    )

    // 背景（'none' / 'transparent' / 未设置 → 透明）
    const bg = this.options.bg
    if (bg && bg !== 'none' && bg !== 'transparent') {
      parts.push(`  <rect x="${vx}" y="${vy}" width="${vw}" height="${vh}" fill="${bg}" />`)
    }

    // 元素
    for (const child of this.children) {
      parts.push(this.renderElement(child))
    }

    // 箭头
    for (const a of this._arrows) {
      parts.push(this.renderArrow(a))
    }

    // Fork 箭头
    for (const f of this._forks) {
      parts.push(this.renderFork(f))
    }

    // 文字层（渲染在最上层，确保文字不被形状或箭头遮挡）
    for (const t of this.textLayer) {
      parts.push(t)
    }

    // 字体导入（只对有 URL 的字体生成 @import，本地字体不需要）
    const remoteFonts = this.registeredFonts.filter(f => f.url)
    if (remoteFonts.length > 0) {
      const imports = remoteFonts.map(f => `      @import url('${f.url}');`).join('\n')
      this.defs.unshift(`    <style>\n${imports}\n    </style>`)
    }

    // defs 插入到 svg 开头后面
    if (this.defs.length > 0) {
      const defsBlock = `  <defs>\n${this.defs.join('\n')}\n  </defs>`
      parts.splice(1, 0, defsBlock)
    }

    parts.push('</svg>')
    return parts.join('\n')
  }

  /** 导出文件，格式根据扩展名自动判断（.svg / .png / .jpg / .webp / .pdf） */
  async export(filePath: string, options?: ExportOptions): Promise<void> {
    const ext = path.extname(filePath).toLowerCase()

    if (ext === '.svg') {
      const svg = this.render(options)
      fs.writeFileSync(filePath, svg, 'utf-8')
      console.log(`Exported → ${filePath}`)
      return
    }

    // 渲染 SVG 并计算实际尺寸
    const svg = this.render(options)

    // 从 SVG 中提取宽高
    const wMatch = svg.match(/width="(\d+\.?\d*)"/)
    const hMatch = svg.match(/height="(\d+\.?\d*)"/)
    const svgW = wMatch ? parseFloat(wMatch[1]) : this.width
    const svgH = hMatch ? parseFloat(hMatch[1]) : this.height

    if (ext === '.pdf') {
      // 矢量 PDF：使用 pdfkit + svg-to-pdfkit
      let PDFDocument: any
      let SVGtoPDF: any
      try {
        PDFDocument = (await import('pdfkit')).default
        SVGtoPDF = (await import('svg-to-pdfkit')).default
      } catch {
        throw new Error(
          `导出 PDF 格式需要 pdfkit 和 svg-to-pdfkit。请运行: npm install pdfkit svg-to-pdfkit`,
        )
      }

      const doc = new PDFDocument({ size: [svgW, svgH], margin: 0 })
      const stream = doc.pipe(fs.createWriteStream(filePath))
      SVGtoPDF(doc, svg, 0, 0, { width: svgW, height: svgH, preserveAspectRatio: 'xMidYMid meet' })
      doc.end()
      await new Promise<void>((resolve, reject) => {
        stream.on('finish', resolve)
        stream.on('error', reject)
      })

      console.log(`Exported → ${filePath}`)
      return
    }

    // 光栅格式需要 sharp
    let sharp: typeof import('sharp')
    try {
      sharp = (await import('sharp')).default as any
    } catch {
      throw new Error(
        `导出 ${ext} 格式需要 sharp 包。请运行: npm install sharp`,
      )
    }

    const scale = options?.scale ?? 2
    const quality = options?.quality ?? 90
    const svgBuf = Buffer.from(svg)
    const outW = Math.round(svgW * scale)
    const outH = Math.round(svgH * scale)

    if (ext === '.png') {
      await sharp(svgBuf, { density: 72 * scale })
        .resize(outW, outH)
        .png()
        .toFile(filePath)
    } else if (ext === '.jpg' || ext === '.jpeg') {
      // JPG 不支持透明，加白色背景
      await sharp(svgBuf, { density: 72 * scale })
        .resize(outW, outH)
        .flatten({ background: '#ffffff' })
        .jpeg({ quality })
        .toFile(filePath)
    } else if (ext === '.webp') {
      await sharp(svgBuf, { density: 72 * scale })
        .resize(outW, outH)
        .webp({ quality })
        .toFile(filePath)
    } else {
      throw new Error(`不支持的格式: ${ext}。支持 .svg / .png / .jpg / .webp / .pdf`)
    }

    console.log(`Exported → ${filePath}`)
  }
}

/** 四舍五入到 2 位小数，返回数字 */
function r(n: number): number {
  return Math.round(n * 100) / 100
}

/** 四舍五入到 2 位小数，返回字符串 */
function r2(n: number): string {
  return r(n).toString()
}

/** 点坐标转为 SVG points 格式 "x,y" */
function pt(p: Point): string {
  return `${r2(p.x)},${r2(p.y)}`
}

/** 从 origin 沿 angle 方向偏移 dist，返回 "x,y" */
function pt2(origin: Point, angle: number, dist: number): string {
  return `${r2(origin.x + dist * Math.cos(angle))},${r2(origin.y + dist * Math.sin(angle))}`
}
