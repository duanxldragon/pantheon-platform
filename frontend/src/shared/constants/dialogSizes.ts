/**
 * 对话框尺寸规范
 * @description 统一对话框的尺寸标准，确保UI一致性
 */

/**
 * 对话框尺寸枚举
 */
export const DIALOG_SIZES = {
  xs: 'max-w-xs',        // 最小 (320px)
  sm: 'max-w-sm',        // 小 (384px)
  md: 'max-w-md',        // 中等 (448px)
  lg: 'max-w-lg',        // 大 (512px)
  xl: 'max-w-xl',        // 超大 (576px)
  '2xl': 'max-w-2xl',    // 2倍大 (672px)
  '3xl': 'max-w-3xl',    // 3倍大 (768px)
  '4xl': 'max-w-4xl',    // 4倍大 (896px)
  '5xl': 'max-w-5xl',    // 5倍大 (1024px)
  full: 'max-w-full',    // 全宽
} as const;

export type DialogSize = keyof typeof DIALOG_SIZES;

/**
 * 推荐的对话框尺寸使用场景
 */
export const DIALOG_SIZE_RECOMMENDATIONS = {
  // 确认对话框、提示对话框
  confirmation: 'sm',
  
  // 简单表单（1-3个字段）
  simpleForm: 'md',
  
  // 标准表单（4-8个字段）
  standardForm: 'lg',
  
  // 复杂表单（8+个字段）
  complexForm: '2xl',
  
  // 详情查看
  details: 'xl',
  
  // 多标签页/复杂内容
  tabs: '3xl',
  
  // 个人资料、设置页面
  profile: '4xl',
  
  // 全屏编辑器
  editor: '5xl',
} as const;

/**
 * 对话框通用样式
 */
export const DIALOG_COMMON_STYLES = {
  // 最大高度（避免超出视口）
  maxHeight: 'max-h-[90vh]',
  
  // 内容区域滚动
  overflow: 'overflow-y-auto',
  
  // 圆角
  rounded: 'rounded-lg',
  
  // 边框
  border: 'border',
  
  // 阴影
  shadow: 'shadow-lg',
  
  // 内边距
  padding: 'p-6',
} as const;

/**
 * 获取对话框尺寸类名
 */
export function getDialogSize(size: DialogSize = 'lg'): string {
  return DIALOG_SIZES[size];
}

/**
 * 获取对话框完整类名
 */
export function getDialogClassName(size: DialogSize = 'lg', additionalClasses?: string): string {
  const baseClasses = [
    DIALOG_SIZES[size],
    DIALOG_COMMON_STYLES.maxHeight,
    DIALOG_COMMON_STYLES.overflow,
  ].join(' ');
  
  return additionalClasses ? `${baseClasses} ${additionalClasses}` : baseClasses;
}

/**
 * 对话框位置枚举（所有对话框默认居中，不应使用其他位置）
 */
export const DIALOG_POSITIONS = {
  center: 'center',  // 唯一推荐的位置
  // 不推荐使用其他位置，如left/right/top/bottom
} as const;

/**
 * 使用说明
 * 
 * 1. 所有对话框必须居中显示
 * 2. 根据内容选择合适的尺寸
 * 3. 超长内容使用滚动
 * 4. 保持一致的内边距和样式
 * 
 * @example
 * ```tsx
 * import { getDialogClassName, DIALOG_SIZE_RECOMMENDATIONS } from '@/shared/constants/dialogSizes';
 * 
 * // 简单表单
 * <DialogContent className={getDialogClassName('md')}>
 *   ...
 * </DialogContent>
 * 
 * // 复杂表单
 * <DialogContent className={getDialogClassName('2xl')}>
 *   ...
 * </DialogContent>
 * 
 * // 个人资料（多标签页）
 * <DialogContent className={getDialogClassName('4xl', 'p-0')}>
 *   ...
 * </DialogContent>
 * ```
 */
