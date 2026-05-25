---
AIGC:
    ContentProducer: Minimax Agent AI
    ContentPropagator: Minimax Agent AI
    Label: AIGC
    ProduceID: "00000000000000000000000000000000"
    PropagateID: "00000000000000000000000000000000"
    ReservedCode1: 3045022100e0ee25cbe12f0abd9549c2374de882c84fdd34dc98437126fd7d2dd67fcfca64022017b1fabe3b05ad06517c5e2741624b4acc36b9b6757d5c41432541fed9c43a5d
    ReservedCode2: 30440220407af7f5ffced4be8c9819695d376ecfc9ccd1088478af81e6a39aa6eb3efa0d022006d9e5608d59441cf2a9420300d918b77c33d7b1c9437b7446dc78452b5c2ff2
---

# 大学生课表工具 - 规范文档

## 1. Concept & Vision

一款专为大学生设计的课表管理工具，强调"一眼可辨、触手可及"的交互体验。采用杂志编辑风格，课表如同精心排版的时间期刊——清晰的信息层级、舒适的视觉节奏、无干扰的纯净界面。核心交互理念：导入简单、查看直观、修改便捷。

## 2. Design Language

### 2.1 Aesthetic Direction
现代北欧极简主义 + 学术期刊排版风格。灵感来自Monocle杂志与Notion的结合——留白充足、信息紧凑、功能克制但完整。

### 2.2 Color Palette
```
Primary:      #2D3436 (深炭灰 - 主文字)
Secondary:    #636E72 (石墨灰 - 次要文字)
Background:   #FAFBFC (云白 - 主背景)
Surface:      #FFFFFF (纯白 - 卡片表面)
Border:       #E8ECEF (薄雾灰 - 分割线)
Accent:       #0984E3 (学院蓝 - 强调色)
Success:      #00B894 (薄荷绿 - 成功状态)
Warning:      #FDCB6E (琥珀黄 - 提醒)
Weekend:      #DFE6E9 (淡灰 - 周末标识)

课程颜色方案（柔和饱和度）:
- 蓝: #74B9FF
- 绿: #55EFC4
- 紫: #A29BFE
- 橙: #FFEAA7
- 粉: #FD79A8
- 青: #81ECEC
- 珊瑚: #FF7675
- 橄榄: #A3CB38
```

### 2.3 Typography
- 主字体: `"Inter", -apple-system, BlinkMacSystemFont, sans-serif`
- 中文字体: `"PingFang SC", "Microsoft YaHei", sans-serif`
- 数字/时间: 使用等宽特性强的 `tabular-nums`
- 字重: 400(正文), 500(中等强调), 600(标题), 700(重点)
- 字号:
  - 大标题: 28px / 36px行高
  - 页面标题: 20px / 28px行高
  - 表格时间: 13px / 18px行高
  - 课程名称: 14px / 20px行高
  - 辅助信息: 12px / 16px行高

### 2.4 Spatial System
- 基础单位: 4px
- 间距阶梯: 4, 8, 12, 16, 24, 32, 48, 64px
- 卡片圆角: 12px
- 课表格子圆角: 8px
- 阴影: `0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.03)`

### 2.5 Motion Philosophy
- 入场动画: opacity 0→1, translateY 8px→0, 300ms ease-out, 元素间stagger 50ms
- 交互反馈: hover scale 1.02, 150ms; 点击 scale 0.98, 80ms
- 状态切换: 200ms ease-in-out
- 课程卡片hover: 轻微上浮(translateY -2px) + 阴影加深

### 2.6 Visual Assets
- 图标: Lucide React (线性风格, strokeWidth 1.5)
- 空状态插画: 简洁的几何线条图形
- 课程颜色: 柔和渐变(135deg), 带微妙的内部高光

## 3. Layout & Structure

### 3.1 整体架构
```
┌─────────────────────────────────────────────────┐
│  Header: Logo + 周次选择器 + 操作按钮           │
├─────────────────────────────────────────────────┤
│                                                 │
│  ┌─────────────────────────────────────────┐   │
│  │         Weekly Schedule Table           │   │
│  │  ┌───┬───┬───┬───┬───┬───┬───┐          │   │
│  │  │Mon│Tue│Wed│Thu│Fri│Sat│Sun│          │   │
│  │  ├───┼───┼───┼───┼───┼───┼───┤          │   │
│  │  │   │   │   │   │   │   │   │ 8:00     │   │
│  │  ├───┤   │   │   │   │   │   │          │   │
│  │  │   │   │   │   │   │   │   │ 9:00     │   │
│  │  └───┴───┴───┴───┴───┴───┴───┘          │   │
│  └─────────────────────────────────────────┘   │
│                                                 │
├─────────────────────────────────────────────────┤
│  Footer: 快捷操作栏 (添加课程/导入/导出/重置)   │
└─────────────────────────────────────────────────┘
```

### 3.2 课表表格布局
- 时间轴固定在左侧(宽度80px)
- 星期列均分剩余空间(7列等宽)
- 每节课高度固定80px，一天可显示约12节课
- 课程卡片占据对应时间格，支持跨节合并

### 3.3 响应式策略
- Desktop (>1024px): 完整课表视图
- Tablet (768-1024px): 时间轴收缩，课程信息精简
- Mobile (<768px): 日视图为主，左右滑动切换星期

## 4. Features & Interactions

### 4.1 核心功能

#### 课表导入
- **JSON文件导入**: 支持标准格式课表文件
- **手动添加**: 表单录入单门课程
- **快速导入模板**: 预置常见格式提示

#### 课表展示
- 周视图表格，清晰显示每天课程
- 当前时间指示线(红色虚线)
- 课程卡片显示: 课程名、上课地点、授课教师(缩写)
- 鼠标悬停显示完整信息tooltip

#### 课程管理
- 点击课程卡片: 编辑/删除选项
- 拖拽调整课程时间位置(同日内)
- 课程颜色自动分配(可手动调整)

### 4.2 交互细节

#### 导入流程
1. 点击"导入课表"按钮
2. 弹出模态框，提供两种方式:
   - 文件拖拽上传区
   - 手动添加表单
3. 解析成功后显示预览，确认后写入

#### 课程卡片Hover
- 卡片轻微上浮
- 阴影从 `soft` 变为 `elevated`
- 显示"编辑/删除"操作按钮

#### 课程卡片Click
- 展开详情面板
- 显示完整信息: 课程号、学分、授课教师、上课地点、周次范围
- 提供"编辑"和"删除"按钮

#### 时间指示线
- 红色虚线标识当前时间所在位置
- 每分钟平滑移动
- 非当前周不显示

### 4.3 空状态
- 初始无课程: 优雅的欢迎插画 + "导入你的第一个课表" 引导
- 筛选无结果: 提示"本周无课程安排"

### 4.4 边界处理
- 课程时间重叠: 自动合并显示，点击展开
- 课程节数超限: 滚动显示时间轴
- 长课程名: 截断显示，hover显示完整

## 5. Component Inventory

### 5.1 Header
- Logo区域(左侧)
- 周次选择器(中间): 当前周/总周数，可切换上周/下周
- 操作按钮(右侧): 导入、导出、设置

### 5.2 ScheduleTable
- **TimeColumn**: 左侧时间刻度，每节课一个时间点
- **DayColumn**: 单日课程列
- **CourseCard**: 课程卡片组件

### 5.3 CourseCard
States:
- **Default**: 显示课程名、地点
- **Hover**: 轻微上浮，显示操作按钮
- **Active**: 展开详情侧边栏
- **Multi-section**: 跨节课程，卡片高度自适应

### 5.4 ImportModal
- 文件上传区域(拖拽支持)
- 格式说明文本
- 预览表格(2-3行示例)
- 确认/取消按钮

### 5.5 AddCourseForm
Fields:
- 课程名称(必填)
- 上课星期(下拉选择)
- 开始节次(数字输入)
- 结束节次(数字输入)
- 上课地点(文本输入)
- 授课教师(文本输入)
- 课程颜色(色块选择)

### 5.6 ActionBar
- 添加课程按钮
- 导入课表按钮
- 导出按钮
- 重置(清空)按钮

### 5.7 Tooltip
- 触发: hover 300ms后显示
- 内容: 完整课程信息
- 样式: 白色背景，柔和阴影，圆角

## 6. Technical Approach

### 6.1 技术栈
- React 18 + TypeScript
- Tailwind CSS (样式)
- Lucide React (图标)
- localStorage (数据持久化)
- Vite (构建)

### 6.2 数据模型
```typescript
interface Course {
  id: string;
  name: string;
  teacher?: string;
  location?: string;
  dayOfWeek: 1-7; // 1=周一
  startSection: number; // 开始节次(1-12)
  endSection: number; // 结束节次
  color: string; // 颜色标识
  weeks?: number[]; // 上课周次，默认全学期
}

interface Schedule {
  courses: Course[];
  currentWeek: number;
  totalWeeks: number;
  semesterStart: string; // YYYY-MM-DD
}
```

### 6.3 存储策略
- 使用 localStorage 持久化课表数据
- 键名: `campus_schedule_data`
- 自动保存: 每次修改后延迟500ms保存

### 6.4 导入格式(JSON)
```json
{
  "courses": [
    {
      "name": "高等数学",
      "teacher": "张教授",
      "location": "教学楼A101",
      "dayOfWeek": 1,
      "startSection": 1,
      "endSection": 2,
      "color": "#74B9FF"
    }
  ]
}
```

## 7. 视觉细节规范

### 7.1 课表格子
- 边框: 1px solid #E8ECEF
- Hover状态: 背景变为 #F8F9FA
- 当前时间指示: 2px dashed #E74C3C

### 7.2 课程卡片
- 圆角: 8px
- 内边距: 8px 12px
- 课程名: 14px/500, 深炭灰
- 地点/教师: 12px/400, 石墨灰
- 背景: 课程专属色(带5%透明度)
- 左侧色条: 4px宽，纯色

### 7.3 按钮
- Primary: 学院蓝背景，白色文字，hover变深5%
- Secondary: 白色背景，深炭灰边框，hover背景#F8F9FA
- Danger: 透明背景，红色文字，hover红色背景+白色文字
- 尺寸: padding 8px 16px, 圆角8px

### 7.4 模态框
- 背景遮罩: rgba(0,0,0,0.4), backdrop-blur 4px
- 内容区: 白色背景，圆角16px，最大宽度480px
- 入场动画: fade + scale from 0.95