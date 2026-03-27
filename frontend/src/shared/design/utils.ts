/**
 * 设计系统 - 工具函数
 */

import { designTokens, colorTokens } from './tokens';

/**
 * 组合类名
 */
export const cn = (...classes: (string | undefined | null | false)[]) => {
  return classes.filter(Boolean).join(' ');
};

/**
 * 获取状态颜色
 */
export const getStatusColor = (status: 'success' | 'warning' | 'error' | 'info', variant: 'light' | 'dark' | 'bg' | 'text' = 'light') => {
  return colorTokens.status[status][variant];
};

/**
 * 获取渐变背景
 */
export const getGradient = (type: keyof typeof colorTokens.gradients) => {
  return colorTokens.gradients[type];
};

/**
 * 生成阴影样式
 */
export const getShadow = (size: keyof typeof designTokens.shadow) => {
  return designTokens.shadow[size];
};

/**
 * 生成过渡样式
 */
export const getTransition = (properties: string[] = ['all'], duration: keyof typeof designTokens.duration = 'normal', easing: keyof typeof designTokens.easing = 'easeInOut') => {
  return {
    transition: properties.map(prop => `${prop} ${designTokens.duration[duration]} ${designTokens.easing[easing]}`).join(', '),
  };
};

/**
 * 响应式断点检查（客户端）
 */
export const useBreakpoint = () => {
  if (typeof window === 'undefined') return 'lg';
  
  const width = window.innerWidth;
  if (width < 640) return 'xs';
  if (width < 768) return 'sm';
  if (width < 1024) return 'md';
  if (width < 1280) return 'lg';
  if (width < 1536) return 'xl';
  return '2xl';
};
