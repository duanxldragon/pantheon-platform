# Pantheon Platform Frontend DESIGN.md

> 灵感参考 `awesome-design-md` 的稳定结构，并额外吸收 `awesome-design-md/design-md/figma/DESIGN.md` 中更专业、克制、排版驱动的特征。  
> 本文件用于给 AI 代理、设计协作者和前端开发提供一致的“看起来应该怎样”的描述。  
> 这不是营销站设计稿；这是多租户后台工作台的设计系统说明。  
> 平台级边界看 `docs/system/UI_DESIGN.md`，前端实现落点看 `frontend/docs/system/UI_IMPLEMENTATION_GUIDE.md`。

## 0. Shared Terms

- **Workspace Shell / 工作台壳层**：sidebar、top bar、tabs、view area 共同构成的运行时外壳
- **Management Page Skeleton / 管理页骨架**：title、filters、actions、results 的标准后台页结构
- **Readonly Detail Flow / 只读详情链路**：summary、state、audit、raw payload 的稳定详情结构
- **Result Feedback / 结果反馈**：submit confirm、success summary、review outcome、empty state next action
- **Semantic Tokens / 语义 token**：用角色表达用途的设计变量，而不是直接写颜色名

## 1. Visual Theme & Atmosphere

Pantheon Platform 的 UI 气质应当像“现代化、可信赖、长期可用的企业工作台”。

### Core Mood
- Professional, calm, efficient
- Medium-high information density
- Precise over decorative
- Semantic over colorful
- Stable shell, flexible content

### Visual Personality
- 主界面以中性底色与弱分层表面为主
- 品牌色只承担主动作与关键强调，不大面积铺底
- 阴影轻，边框细，圆角克制但不生硬
- 动效短、稳、低噪，不做夸张缩放或漂浮感
- 页面首先服务“扫描、判断、操作、恢复”

### Figma-Inspired Adaptation
- 借鉴 Figma 的“中性色界面铬层 + 彩色内容分离”思路：平台壳层尽量中性，彩色只留给状态、图表、业务内容
- 借鉴 Figma 的排版精度：通过细微字重差、稳定行高、略收紧字距建立层级
- 借鉴 Figma 的几何一致性：控件形态保持同一族谱，不在一页里混用多套圆角语言
- 借鉴 Figma 的明确聚焦态：焦点和当前态要一眼可见，但要适配后台工具场景
- 不照搬 Figma 的营销渐变英雄区；Pantheon 只吸收其“专业、清晰、系统化”的部分

### Product Context
- 这是基于React Router的后台管理系统，支持菜单导航和标签页管理
- 用户通过URL导航访问不同功能模块，支持长时间停留和频繁切换
- 权限、租户状态、菜单配置动态变化，路由守卫自动处理访问控制
- 页面结果反馈在当前上下文中展示，而不是完全依赖全局 toast
- 支持浏览器前进/后退、深度链接和书签功能

## 2. Color Palette & Roles

### Core Semantic Palette

| Role | Token | Use |
|------|-------|-----|
| App Background | `--background` | 整体页面底色 |
| Primary Text | `--foreground` | 标题、正文、关键数字 |
| Card Surface | `--card` | 卡片、详情块、表格容器 |
| Card Text | `--card-foreground` | 卡片正文 |
| Popover Surface | `--popover` | 下拉、菜单、弹层 |
| Popover Text | `--popover-foreground` | 浮层文字 |
| Brand Primary | `--primary` | 主按钮、主链接、当前激活态 |
| Primary Contrast | `--primary-foreground` | 主色反白文字 |
| Secondary Surface | `--secondary` | 次级按钮、弱强调块 |
| Muted Surface | `--muted` | 占位区、弱背景、空态辅助块 |
| Muted Text | `--muted-foreground` | 次要说明、时间、辅助字段 |
| Accent | `--accent` | Hover、选中、聚焦时的轻强调 |
| Destructive | `--destructive` | 删除、禁用、不可逆动作 |
| Border | `--border` | 分隔线、表格边界、容器边框 |
| Input | `--input` | 输入控件边框/底色语义 |
| Focus Ring | `--ring` | 键盘聚焦与表单聚焦 |

### Extended Semantic Colors

| Role | Suggested Meaning |
|------|-------------------|
| `success` | 已启用、成功、完成、健康 |
| `warning` | 警示、待关注、即将超期 |
| `info` | 引导、解释、中性反馈 |

### Color Principles
- 禁止在业务页面直接依赖 `slate-*`、`gray-*`、`blue-*` 这类具体色阶作为核心语义
- 亮暗主题必须由 token 切换，不靠页面内写两套条件色
- 品牌色用在“行动”和“当前态”，不用来给所有容器上色
- 危险色要足够明确，但只在高风险操作中高强度使用
- 壳层、工具栏、筛选栏优先保持低饱和中性体系，减少管理后台噪音
- 图表、状态标签、空态插图可以承担有限彩色表达，但不反向污染全局 chrome

## 3. Typography Rules

### Type Personality
- 中文与英文混排时，以清晰和稳定对齐优先
- 层级依靠字号、字重、颜色和间距共同建立，不只靠放大字号
- 管理后台阅读场景以 14px / 16px 为主体
- 借鉴 Figma 的做法，优先通过“细微字重差”建立层级，而不是到处使用厚重标题
- 字距可以略收紧，但不能破坏中文可读性

### Hierarchy

| Role | Size | Weight | Line Height | Use |
|------|------|--------|-------------|-----|
| Page Title | 28-32px | 600-700 | 1.2 | 页面主标题 |
| Section Title | 20-24px | 600 | 1.3 | 卡片区块、详情分组 |
| Card Title | 16-18px | 600 | 1.4 | 列表卡、弹层标题、小模块标题 |
| Body | 14-16px | 400-500 | 1.5 | 表单、表格、正文 |
| Secondary Text | 13-14px | 400-500 | 1.5 | 描述、说明、辅助信息 |
| Caption / Meta | 12-13px | 400-500 | 1.4 | 时间、状态补充、技术字段 |
| Button / Label | 13-14px | 500-600 | 1.2-1.4 | 按钮、筛选项、表单标签 |
| Mono Label | 11-12px | 500 | 1.2 | 技术标签、系统字段、环境标记 |

### Typography Principles
- 页面标题不追求展示型字效，强调稳定与识别
- 表格正文优先 14px-15px，避免因字体过小造成长时间阅读疲劳
- 次要文本通过颜色弱化，不通过极端缩小字号弱化
- 数字、时间、状态值在同列中保持视觉对齐
- 英文标题、技术标签、按钮文案可适度使用更紧的字距
- `Mono Label` 只用于技术标识、环境信息、系统字段，不泛滥到普通正文

## 4. Component Stylings

### Buttons

**Primary Button**
- Use: 主提交、主创建、主确认
- Background: `--primary`
- Text: `--primary-foreground`
- Radius: medium，关键紧凑 CTA 可适度 pill 化
- Motion: 150ms-200ms color transition

**Secondary / Outline Button**
- Use: 辅助操作、取消、返回、普通工具动作
- Border: `--border`
- Background: transparent or weak secondary surface
- Text: `--foreground`
- Dense toolbar 中可进一步采用更安静的单色处理

**Ghost Button**
- Use: 行内轻操作、工具栏、低优先级动作
- Background: transparent
- Hover: light `--accent`

**Destructive Button**
- Use: 删除、停用、重置、踢出会话
- Background: `--destructive`
- Text: high contrast
- Must be paired with clear object-specific wording

**Icon Button**
- Use: 搜索、刷新、更多、面板工具动作
- Shape: icon-only 时优先 circle 或 near-circle
- Background: subtle neutral surface
- Focus: clear focus ring，设计感更强的模块可局部采用 dashed focus

### Cards & Containers
- Background: `--card`
- Border: 1px subtle `--border`
- Radius: medium for page containers, large for special surfaces
- Shadow: soft, restrained
- Use consistent container families for filters, action bars, content results
- Prefer monochrome surfaces; colorful cards should be exception, not default

### Inputs & Forms
- Inputs should feel precise, not oversized
- Focus must be visible through `--ring`
- Placeholder and helper text should use muted text, not low-opacity hacks
- Error state should combine color + message + field association

### Tables
- Header must remain clear and stable
- Dense data uses consistent row height and alignment
- Status columns prefer badge/tag semantics
- Action columns collapse overflow actions into menus
- On narrow screens, preserve identity column first

### Tabs
- Workspace tabs and in-page tabs are different systems
- Workspace tabs emphasize continuity and restoration
- In-page tabs emphasize local content grouping
- In-page segmented controls can borrow pill-like geometry for a more precise, tool-like feel

### Dialogs & Drawers
- Modal layers use larger radius and stronger shadow than page cards
- Confirmation dialogs are concise and decision-oriented
- Long forms prefer dialog/drawer wrappers with fixed header and footer
- Do not overload a confirmation dialog with full workflows

### Feedback Components
- Toasts for lightweight completion/error feedback
- Inline alerts for persistent page-level explanations
- Skeletons for known structures
- Empty states must include reason + next action
- Success / review / confirm states should explain scope, object, and next action

## 5. Layout Principles

### Shell Layout
- Sidebar, top bar, breadcrumb, tab strip, and view area form one system
- Shell should feel stable even when menus or permissions refresh dynamically
- Content area should use consistent page padding and rhythm
- Shell chrome should feel closer to a professional tool than a colorful dashboard: neutral, precise, quiet

### Standard Page Structure

Typical management page order:

1. Page title and summary
2. Filter/search area
3. Action bar
4. Result container
5. Detail/dialog follow-up actions

### Spacing
- Base unit: 8px
- Prefer predictable spacing rhythm over one-off spacing tricks
- Keep enough white space between structural blocks, not necessarily inside every row

### Radius Scale
- Small: inputs, compact buttons, badges
- Medium: cards, table wrappers, filter panels
- Large: dialogs, drawers, highlighted surfaces
- Pill: selected tabs, segmented filters, compact CTAs
- Circle: icon-only actions

## 6. Depth & Elevation

| Level | Treatment | Use |
|-------|-----------|-----|
| Level 0 | Flat background | App canvas, plain page area |
| Level 1 | Border only | Tables, grouped blocks, subtle containers |
| Level 2 | Border + soft shadow | Primary content cards |
| Level 3 | Stronger shadow + larger radius | Dialogs, drawers, focus surfaces |

### Elevation Principles
- 先靠背景与边框分层，再用阴影补足
- 不用过重投影制造“悬浮感”
- 管理后台的数据面优先清晰，不用玻璃化覆盖正文阅读区
- 借鉴 Figma，优先用明暗与排版结构建立秩序，而不是用彩色块制造层级

## 7. Do's and Don'ts

### Do
- Use semantic tokens first
- Keep the shell stable across modules
- Prioritize readable tables, forms, and details
- Design for dynamic permissions and menu refresh
- Check both light and dark theme before merging
- Use typography and spacing as primary professionalism signals
- Keep shell chrome mostly neutral and let content carry limited color

### Don't
- Don’t make admin pages look like marketing hero sections
- Don’t hardcode brand colors inside feature pages
- Don’t create a second visual system for new modules
- Don’t use long-loading full-screen spinners for structured pages
- Don’t rely on color alone to express status or risk
- Don’t import Figma’s landing-page gradients into management chrome
- Don’t force every button into a giant pill regardless of context

## 8. Responsive Behavior

### Breakpoint Strategy
- Desktop first for full management experience
- Tablet retains core actions and key columns
- Mobile prioritizes identity, status, and essential operations

### Tables
- Desktop: full column set
- Tablet: hide low-priority metadata
- Mobile: keep identifier + status + actions, enable horizontal scroll or card fallback

### Interaction
- Touch targets remain comfortable
- Dialog content should remain scrollable with persistent action area
- Long labels may wrap, but page structure must not collapse

## 9. Agent Prompt Guide

### Short Summary
Pantheon Platform should look like a modern enterprise admin workbench with Figma-like professionalism: neutral shell chrome, typography-led hierarchy, restrained monochrome surfaces, selective semantic color, precise tables/forms/dialogs, stable sidebar + tabs shell, and minimal motion.

### Generate UI With These Cues
- “Use semantic token-based admin dashboard styling, not marketing gradients”
- “Prefer calm neutral backgrounds, subtle borders, soft shadows, medium rounded corners”
- “Build a stable management page with title, filters, action bar, results card, and semantic status badges”
- “Use restrained enterprise dialog styling with large radius, fixed header/footer, and clear destructive actions”
- “Design for dynamic menu, permission, and tab runtime instead of static brochure navigation”
- “Borrow Figma-like professionalism through monochrome chrome, tight typography, and pill/circle control geometry, but keep it suitable for enterprise admin pages”
- “Use color sparingly in chrome; reserve stronger colors for charts, states, and content highlights”
- “Keep result feedback inside the current page context with concise scope and next-step guidance”

### Avoid These Cues
- “glassy futuristic hero”
- “high-saturation neon dashboard”
- “landing page section transitions”
- “oversized floating cards everywhere”
- “full Figma marketing gradient hero”
- “all controls as giant pills”
