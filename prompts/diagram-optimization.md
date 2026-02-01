# Flowing 画图优化提示词模板

> 通用模板：用于指导 AI 使用 Flowing (figcraft) 库生成高质量架构图。

---

## 一、设计前必须确认

1. **用途**：论文 / 演示 / 文档 / 海报？不同场景风格差异大。
2. **核心逻辑**：先和用户讨论图表要表达的**逻辑结构**，而不是急于画图。逻辑错了，样式再好也没用。
3. **布局方向**：上下排布 / 左右排布 / 混合？由用户决定。
4. **重点区域**：哪些模块需要展开细节，哪些只需一个方块概括。

---

## 二、学术论文风格规范

```typescript
const fig = new Figure(width, height, {
  bg: '#ffffff',
  antiOverlap: false,   // 允许元素叠放在背景容器上
  fontFamily: 'Times New Roman',
})
```

### 配色原则
- 使用 Material Design 浅色系（50~100 色阶），避免高饱和度
- 每个功能模块一个颜色，同模块内保持一致
- 边框统一用深灰 `#333`，不用纯黑

```typescript
// 推荐配色模板
const palette = {
  input:   { fill: '#fff3e0', color: '#333' },  // 橙浅 — 输入/数据源
  process: { fill: '#e3f2fd', color: '#333' },  // 蓝浅 — 核心处理
  storage: { fill: '#e8f5e9', color: '#333' },  // 绿浅 — 存储
  output:  { fill: '#b2ebf2', color: '#333' },  // 青浅 — 输出/结果
  agent:   { fill: '#ede7f6', color: '#333' },  // 紫浅 — 智能体/模型
  accent:  { fill: '#e1bee7', color: '#333' },  // 粉紫 — 强调
}
```

---

## 三、背景容器技巧

用**空标签 rect** 做分组背景，配合 `antiOverlap: false`：

```typescript
const envBg = fig.rect('', {
  pos: [x, y], size: [w, h],
  fill: '#f1f8e9',
  stroke: { color: '#a5d6a7', width: 1.5, dash: [6, 3] },  // 虚线边框
  radius: 12,
})
```

- **必须先创建背景容器**，再创建内部元素（SVG 绘制顺序 = 图层顺序）
- 容器标题用 `fig.text()` 手动放在容器顶部
- 多个并列容器**高度保持一致**，视觉更整齐

---

## 四、元素选型 — 象形原则

| 语义 | 推荐形状 | 说明 |
|------|---------|------|
| 数据源 / 数据库 | `fig.cylinder()` | 圆柱体 = 存储直觉 |
| 转换器 / 生成器 | `fig.trapezoid()` | 梯形 = 变换/漏斗 |
| 普通处理步骤 | `fig.rect()` | 矩形，最通用 |
| 判断 / 分支 | `fig.diamond()` | 菱形 = 决策 |
| 核心关键模块 | `fig.rect()` + `bold: true` + 更大尺寸 | 加粗 + 放大突出 |
| 辅助信息 | `fig.text()` | 小字号注释 |

### 小元素文字定位

当元素很小时（如小圆柱），自带标签可能放不下或偏移。改用**空标签 + 手动 text**：

```typescript
const el = fig.cylinder('', { pos: [x, y], size: [130, 30], ...style })
fig.text('标签文字', { pos: [centerX, centerY], fontSize: 9 })
```

---

## 五、箭头对齐 — 保证垂直/水平

### 垂直箭头
两个元素要**中心 X 对齐**，最可靠的方式是让它们**同宽同 X**：

```typescript
const a = fig.rect('A', { pos: [50, 100], size: [290, 36] })
const b = fig.rect('B', { pos: [50, 200], size: [290, 58] })
// 两者 pos[0] 相同、size[0] 相同 → 中心完全对齐 → 箭头垂直
fig.arrow(a, b, { from: 'bottom', to: 'top' })
```

### 不同宽度元素的垂直箭头
用**百分比锚点**精确对齐：

```typescript
// 宽元素 (50, 182, w=290) → 窄元素 (50, 270, w=125)
// 窄元素中心 x = 50 + 62.5 = 112.5
// 百分比 = (112.5 - 50) / 290 = 21.5%
fig.arrow(wide, narrow, {
  from: { side: 'bottom', at: '21.5%' },
  to: 'top',
})
```

### 水平箭头
同理，确保两元素**中心 Y 对齐**，或使用百分比锚点。

---

## 六、Fork 分叉箭头

```typescript
fig.fork(source, [targetA, targetB], {
  from: 'bottom', to: 'top',
  head: 'stealth',
  cornerRadius: 6,    // 转角圆滑度
  curve: 15,           // 控制分叉转弯位置（距源元素的像素距离）
})
```

### curve 参数调节原则
- `curve` = 源元素出口到水平分叉线的距离
- **目标值** = (源底部 Y - 目标顶部 Y) / 2，即放在两元素中间
- 默认值 25 在间距小时会太靠近目标，需要手动缩小

---

## 七、RL / 交互箭头（跨容器）

在两个背景容器之间画交互箭头，用**百分比锚点**控制 Y 位置：

```typescript
fig.arrow(envBg, agentBg, {
  from: { side: 'right', at: '40%' },
  to:   { side: 'left',  at: '40%' },
  label: 'Observation',
  head: 'stealth',
})
```

- 多条交互箭头**均匀分布**（如 40%、65%、86%）
- 不同语义用不同样式区分（实线 / 虚线 `style: 'dashed'`）

---

## 八、子信息标注

在元素内部或下方添加补充信息：

```typescript
// 元素内公式
fig.text("x' = Ax + Bu", {
  pos: [centerX, belowLabelY],
  fontSize: 9, fontColor: '#1565c0',
})

// 元素下方参数
fig.text('1810 m³', {
  pos: [centerX, bottomY],
  fontSize: 8, fontColor: '#555',
})
```

---

## 九、迭代优化检查清单

每次生成图片后，按以下顺序检查：

- [ ] **逻辑正确**：箭头方向是否符合实际数据/控制流？
- [ ] **箭头垂直/水平**：有没有歪斜的箭头？
- [ ] **元素间距均匀**：上下左右间距是否一致？
- [ ] **文字可读**：字号是否过小？文字是否溢出元素？
- [ ] **容器对齐**：并列容器是否等高、顶部对齐？
- [ ] **颜色区分**：不同模块颜色是否有区分度？
- [ ] **关键模块突出**：核心组件是否比辅助组件更显眼？
- [ ] **箭头头部方向**：fork 和 polyline 箭头头部是否朝正确方向？

---

## 十、导出

```typescript
await fig.export('output.svg', { fit: true, margin: 30 })
await fig.export('output.png', { fit: true, margin: 30, scale: 2 })
```

- `fit: true` 自动裁剪空白
- `margin: 30` 四周留白
- `scale: 2` PNG 高清输出（论文用）
