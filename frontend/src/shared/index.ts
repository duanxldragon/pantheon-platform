/**
 * 共享资源统一导出文件
 * 
 * 使用方式：
 * import { ThemedButton, StatCard, designTokens } from '@/shared';
 */

// ==================== 组件导出 ====================
export * from './components';

// ==================== 设计系统导出 ====================
export * from './design';

// ==================== 模板导出 ====================
export * from './templates';

// ==================== 工具函数导出 ====================
export * from './utils';
export * from './hooks';

// ==================== 常量导出 ====================
export * from './constants';

// ==================== 验证导出 ====================
export * from './validation';

// ==================== ViewManager 导出 ====================
export { ViewManager, useViewManager } from './components/ViewManager';

// ==================== 类型导出 ====================
export type { ViewConfig } from './constants/viewsConfig';
export type { Tab } from '../stores/modules/uiStore';