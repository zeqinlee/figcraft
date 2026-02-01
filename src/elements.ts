import { ElementConfig, PosValue } from './types'

// --- 工具函数 ---

let _idCounter = 0

export function generateId(prefix: string = 'el'): string {
  return `${prefix}_${++_idCounter}`
}

export function resetIdCounter(): void {
  _idCounter = 0
}

/** 将位置/尺寸值解析为绝对像素 */
export function resolveValue(value: PosValue, reference: number): number {
  if (typeof value === 'number') return value
  if (typeof value === 'string' && value.endsWith('%')) {
    return (parseFloat(value) / 100) * reference
  }
  return parseFloat(String(value))
}

/** 将百分比值解析为 0-1 的比例 */
export function resolvePercent(value: PosValue): number {
  if (typeof value === 'number') return value / 100
  if (typeof value === 'string' && value.endsWith('%')) {
    return parseFloat(value) / 100
  }
  return parseFloat(String(value)) / 100
}

/** XML 特殊字符转义 */
export function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

// --- Markdown 解析 ---

export interface TextSegment {
  text: string
  bold?: boolean
  italic?: boolean
  code?: boolean
  math?: boolean
}

/**
 * 解析标签文字中的 markdown 格式：
 *   **bold**    → 粗体
 *   *italic*    → 斜体
 *   `code`      → 等宽字体
 *   $E=mc^2$    → 数学公式（斜体衬线字体）
 */
export function parseMarkdown(input: string): TextSegment[] {
  const segments: TextSegment[] = []
  const regex = /\*\*(.+?)\*\*|\*(.+?)\*|`(.+?)`|\$(.+?)\$/g
  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = regex.exec(input)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ text: input.slice(lastIndex, match.index) })
    }

    if (match[1] != null)      segments.push({ text: match[1], bold: true })
    else if (match[2] != null) segments.push({ text: match[2], italic: true })
    else if (match[3] != null) segments.push({ text: match[3], code: true })
    else if (match[4] != null) segments.push({ text: match[4], math: true })

    lastIndex = match.index + match[0].length
  }

  if (lastIndex < input.length) {
    segments.push({ text: input.slice(lastIndex) })
  }

  return segments.length > 0 ? segments : [{ text: input }]
}

// --- 元素类 ---

export type ElementType = 'rect' | 'circle' | 'text' | 'image' | 'diamond' | 'trapezoid' | 'cylinder' | 'cuboid' | 'sphere' | 'stack'

/**
 * 所有图形元素的基类。
 * 每个元素都可以作为容器 — 调用 rect()、circle()、text() 创建子元素。
 * 子元素的位置相对于父元素。
 */
export abstract class Element {
  readonly id: string
  readonly type: ElementType
  label: string
  config: ElementConfig
  parent?: Element
  children: Element[] = []

  constructor(type: ElementType, label: string, config: ElementConfig = {}) {
    this.id = generateId(type)
    this.type = type
    this.label = label
    this.config = config
  }

  /** 在内部添加一个子矩形 */
  rect(label: string, config?: ElementConfig): Rect {
    const child = new Rect(label, config)
    child.parent = this
    this.children.push(child)
    return child
  }

  /** 在内部添加一个子圆形 */
  circle(label: string, config?: ElementConfig): Circle {
    const child = new Circle(label, config)
    child.parent = this
    this.children.push(child)
    return child
  }

  /** 在内部添加一个文字元素 */
  text(content: string, config?: ElementConfig): Text {
    const child = new Text(content, config)
    child.parent = this
    this.children.push(child)
    return child
  }

  /** 在内部添加一个图片元素 */
  image(src: string, config?: ElementConfig): Image {
    const child = new Image(src, config)
    child.parent = this
    this.children.push(child)
    return child
  }

  /** 在内部添加一个菱形 */
  diamond(label: string, config?: ElementConfig): Diamond {
    const child = new Diamond(label, config)
    child.parent = this
    this.children.push(child)
    return child
  }

  /** 在内部添加一个梯形 */
  trapezoid(label: string, config?: ElementConfig): Trapezoid {
    const child = new Trapezoid(label, config)
    child.parent = this
    this.children.push(child)
    return child
  }

  /** 在内部添加一个圆柱体 */
  cylinder(label: string, config?: ElementConfig): Cylinder {
    const child = new Cylinder(label, config)
    child.parent = this
    this.children.push(child)
    return child
  }

  /** 在内部添加一个长方体 */
  cuboid(label: string, config?: ElementConfig): Cuboid {
    const child = new Cuboid(label, config)
    child.parent = this
    this.children.push(child)
    return child
  }

  /** 在内部添加一个球体 */
  sphere(label: string, config?: ElementConfig): Sphere {
    const child = new Sphere(label, config)
    child.parent = this
    this.children.push(child)
    return child
  }

  /** 在内部添加一个叠层 */
  stack(label: string, config?: ElementConfig): Stack {
    const child = new Stack(label, config)
    child.parent = this
    this.children.push(child)
    return child
  }
}

/** 矩形 — 支持圆角、虚线边框、无底色、可作为容器 */
export class Rect extends Element {
  constructor(label: string, config?: ElementConfig) {
    super('rect', label, config)
  }
}

/** 圆形 */
export class Circle extends Element {
  constructor(label: string, config?: ElementConfig) {
    super('circle', label, config)
  }

  get r(): number {
    return this.config.r ?? 30
  }
}

/** 文字 */
export class Text extends Element {
  constructor(content: string, config?: ElementConfig) {
    super('text', content, config)
  }
}

/** 图片 */
export class Image extends Element {
  readonly src: string
  constructor(src: string, config?: ElementConfig) {
    super('image', '', config)
    this.src = src
  }
}

/** 菱形 — 流程图判断节点 */
export class Diamond extends Element {
  constructor(label: string, config?: ElementConfig) {
    super('diamond', label, config)
  }
}

/** 梯形 — CNN pooling 层等 */
export class Trapezoid extends Element {
  constructor(label: string, config?: ElementConfig) {
    super('trapezoid', label, config)
  }
}

/** 圆柱体 — CNN feature maps、数据库 */
export class Cylinder extends Element {
  constructor(label: string, config?: ElementConfig) {
    super('cylinder', label, config)
  }
}

/** 长方体 — 3D block layers、tensor */
export class Cuboid extends Element {
  constructor(label: string, config?: ElementConfig) {
    super('cuboid', label, config)
  }
}

/** 球体 — 节点、注意力头 */
export class Sphere extends Element {
  constructor(label: string, config?: ElementConfig) {
    super('sphere', label, config)
  }
  get r(): number {
    return this.config.r ?? 30
  }
}

/** 叠层 — 多层堆叠效果（CNN feature map、Transformer N× 等） */
export class Stack extends Element {
  constructor(label: string, config?: ElementConfig) {
    super('stack', label, config)
  }
}
