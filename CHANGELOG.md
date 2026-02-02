# Changelog

## v0.1.2 (2026-02-02)

### 内部优化（公共 API 不变）

#### P0: 箭头自动拉直
- 新增 `straightenPoints()` 方法，8px 阈值自动吸附
- 近似水平的箭头 → 完美水平，近似垂直 → 完美垂直
- 适用于 straight 和 polyline 路径，curve 不受影响

#### P1: 形状感知锚点
- Trapezoid：top 边按 `topRatio` 收窄计算，left/right 沿斜边插值
- Cylinder：top/bottom 按椭圆参数方程计算，锚点贴合实际椭圆面
- 其他形状（Rect、Circle、Diamond 等）保持 bounding box 逻辑不变

#### P2: Polyline 标签定位改进
- 新增 `polylineLabelPosition()`：遍历所有段，选最长段的中点放置标签
- 新增 `clampLabelToCanvas()`：将标签限制在画布内，避免溢出

#### P3: 布局方法居中修正
- `row()`、`col()`、`grid()` 对 Circle/Sphere（pos 为圆心）做了偏移修正
- 混合布局（Rect + Circle）视觉中心正确对齐

### 新功能

#### 智能自动路由
- `autoSnap()` 现在返回推断的边信息（fromSide/toSide）
- `findNearest()` 同步返回所选边名
- Polyline 路由自动选择正确的模式（水平起步、垂直起步、同侧绕行）
- 用户无需指定 `from`/`to`，系统根据元素相对位置自动判断最优连接方向

#### U 型环绕路由
- 当出口/入口方向与标准 Z 型折线冲突时（如 `from: 'left', to: 'right'`），自动切换为 U 型环绕
- 环绕方向（上/下）根据可用空间自动选择

#### Polyline 避障系统
- 新增 `avoidPolylineObstacles()`：检测折线段与第三方元素的碰撞
- 垂直段碰撞 → 左右偏移绕行
- 水平段碰撞 → U 型绕行（上/下）
- 多障碍物合并包围盒，单次绕行避免震荡
- 方向选择前检查候选位置是否与其他障碍物冲突

#### 同侧绕行修正
- `from: 'right', to: 'right'` 等同侧场景，bypass 距离超过两端最远锚点
- 垂直同侧（`bottom → bottom`）同理修正

### 支持的形状
所有形状均支持自动路由与避障：
Rect、Circle、Diamond、Trapezoid、Cylinder、Cuboid、Sphere、Stack

### 测试文件
- `examples/optimization-test.ts` — P0~P3 优化验证
- `examples/arrow-through-test.ts` — 直线/折线/曲线穿越对比
- `examples/avoid-direction-test.ts` — 避障方向选择（3 场景）
- `examples/auto-route-test.ts` — 多形状自动路由验证
