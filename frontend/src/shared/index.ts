/**
 * Shared exports
 */

export { ViewManager, useViewManager } from './components/ViewManager';
export { ThemedButton } from './components/ui/ThemedButton';
export { ThemedCard } from './components/ui/ThemedCard';
export { ThemedSearchBar } from './components/ui/ThemedSearchBar';
export { FormDialog as FormDialogWrapper, DetailDialog as DetailDialogWrapper } from './components/ui';
export { designTokens, colorTokens } from './design/tokens';
export { usePermission } from '../hooks/usePermission';
export type { ViewConfig } from './constants/viewsConfig';
export type { Tab } from '../stores/modules/uiStore';
