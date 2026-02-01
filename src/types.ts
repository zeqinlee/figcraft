/** 位置值 - 绝对像素 (number) 或百分比 (string, 如 '50%') */
export type PosValue = number | string

/** 位置 [x, y] */
export type Position = [PosValue, PosValue]

/** 尺寸 [width, height] */
export type Size = [PosValue, PosValue]

/** 元素的四条边 */
export type Side = 'top' | 'bottom' | 'left' | 'right'

/** 锚点 - 元素边缘上的连接点 */
export interface AnchorPoint {
  side: Side
  /** 沿边的位置百分比 (0-100)，默认 50 (居中) */
  at?: PosValue
}

/** 锚点可以简写为边名，或者详细指定 */
export type AnchorSpec = Side | AnchorPoint

/** 边框配置 */
export interface StrokeConfig {
  color?: string
  width?: number
  /** 虚线模式，如 [6, 3] 为虚线，[2, 2] 为点线 */
  dash?: number[]
}

/** 阴影配置 */
export interface ShadowConfig {
  dx?: number
  dy?: number
  blur?: number
  color?: string
}

/** 元素通用配置 */
export interface ElementConfig {
  /** 位置。Rect: 左上角；Circle: 圆心 */
  pos?: Position
  /** 尺寸 [宽, 高]，Rect 使用 */
  size?: Size
  /** 填充色，'none' 为透明 */
  fill?: string | 'none'
  /** 填充透明度 (0-1) */
  fillOpacity?: number
  /** 主题色简写 — 同时设置 stroke 颜色和 fontColor */
  color?: string
  /** 边框，'none' 为无边框 */
  stroke?: string | StrokeConfig | 'none'
  /** 圆角半径 (Rect) */
  radius?: number
  /** 圆的半径 (Circle) */
  r?: number
  /** 整体透明度 (0-1) */
  opacity?: number
  /** 阴影。true 使用默认值，或传入详细配置 */
  shadow?: boolean | ShadowConfig
  /** 内边距 */
  padding?: number
  /** 字体大小 */
  fontSize?: number
  /** 字体 */
  fontFamily?: string
  /** 文字颜色（也可用 color 简写） */
  fontColor?: string
  /** 字重 */
  fontWeight?: string | number
  /** 粗体简写，等同于 fontWeight: 'bold' */
  bold?: boolean
  /** 梯形上边与下边的宽度比（0-1），默认 0.6 */
  topRatio?: number
  /** 3D 深度。Cuboid: 挤出距离像素 (默认 15)；Cylinder: 椭圆高度比 (默认 0.15) */
  depth?: number
  /** 叠加层数 (Stack)，默认 3 */
  count?: number
  /** 叠加偏移 [dx, dy] (Stack)，默认 [6, -6]（右上） */
  stackOffset?: [number, number]
}

/** 箭头头部类型 */
export type ArrowHead =
  | 'triangle'       // 实心三角 ▶
  | 'triangle-open'  // 空心三角 ▷
  | 'stealth'        // 尖锐箭头（LaTeX 风格）
  | 'vee'            // V 字形 >
  | 'circle'         // 实心圆 ●
  | 'circle-open'    // 空心圆 ○
  | 'diamond'        // 实心菱形 ◆
  | 'diamond-open'   // 空心菱形 ◇
  | 'bar'            // 竖线 |
  | 'dot'            // 小圆点 •
  | 'none'           // 无箭头

/** 箭头路径类型 */
export type ArrowPath =
  | 'straight'       // 直线
  | 'curve'          // 贝塞尔曲线
  | 'polyline'       // 直角折线

/** 箭头配置 */
export interface ArrowConfig {
  /** 起点锚点 */
  from?: AnchorSpec
  /** 终点锚点 */
  to?: AnchorSpec
  /** 箭头上的文字标签 */
  label?: string
  /** 线型 */
  style?: 'solid' | 'dashed' | 'dotted'
  /** 颜色 */
  color?: string
  /** 线宽 */
  width?: number
  /** 箭头头部类型，默认 'triangle' */
  head?: ArrowHead
  /** 箭头尺寸 */
  headSize?: number
  /** 双向箭头 */
  bidirectional?: boolean
  /** 路径类型，默认 'straight' */
  path?: ArrowPath
  /** 曲线弯曲程度（正=上弯，负=下弯），仅 path='curve' 时有效 */
  curve?: number
  /** 折线拐角圆角半径（仅 path='polyline' 时有效），默认 0 */
  cornerRadius?: number
  /** 标签偏移量（像素），设置后跳过自动防重叠 */
  labelOffset?: number
}

/** 绝对像素边界框 */
export interface Bounds {
  x: number
  y: number
  width: number
  height: number
}

/** 二维点 */
export interface Point {
  x: number
  y: number
}

/** 导出选项 */
export interface ExportOptions {
  /** 分辨率倍数，仅光栅格式有效（默认 2） */
  scale?: number
  /** 自动裁剪到内容边界 */
  fit?: boolean
  /** fit 模式下的边距（默认 20px） */
  margin?: number
  /** JPG / WebP 质量 1-100（默认 90） */
  quality?: number
}
