// System module view IDs
export const SYSTEM_VIEWS = {
  DASHBOARD: 'system-dashboard',
  USERS: 'system-users',
  DEPARTMENTS: 'system-departments',
  POSITIONS: 'system-positions',
  ROLES: 'system-roles',
  MENUS: 'system-menus',
  PERMISSIONS: 'system-permissions',
  LOGS: 'system-logs',
  LOGIN_LOG: 'system-loginlog',
  AUDIT_LOG: 'system-audit',
  SETTINGS: 'system-settings',
  DICTIONARY: 'system-dictionary',
  MONITOR: 'system-monitor',
} as const;

// Profile module view IDs
export const PROFILE_VIEWS = {
  CENTER: 'profile-center',
} as const;

// All view IDs
export const VIEW_IDS = {
  ...SYSTEM_VIEWS,
  ...PROFILE_VIEWS,
} as const;

// View ID type
export type ViewId = typeof VIEW_IDS[keyof typeof VIEW_IDS];

// Module names
export const MODULE_NAMES = {
  SYSTEM: 'system',
  PROFILE: 'profile',
  TENANT: 'tenant',
} as const;

// Status constants
export const STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  PENDING: 'pending',
} as const;

// User roles
export const USER_ROLES = {
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
  USER: 'user',
} as const;

// Permission types
export const PERMISSION_TYPES = {
  MENU: 'menu',
  BUTTON: 'button',
  API: 'api',
} as const;

// Data scope types
export const DATA_SCOPE = {
  ALL: 'all',
  DEPARTMENT: 'department',
  SELF: 'self',
} as const;

// Theme modes
export const THEME_MODES = {
  LIGHT: 'light',
  DARK: 'dark',
  SYSTEM: 'system',
} as const;

// Language codes
export const LANGUAGES = {
  ZH: 'zh',
  EN: 'en',
} as const;

// Pagination defaults
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 10,
  DEFAULT_CURRENT_PAGE: 1,
} as const;

// Toast positions
export const TOAST_POSITIONS = {
  TOP_LEFT: 'top-left',
  TOP_RIGHT: 'top-right',
  TOP_CENTER: 'top-center',
  BOTTOM_LEFT: 'bottom-left',
  BOTTOM_RIGHT: 'bottom-right',
  BOTTOM_CENTER: 'bottom-center',
} as const;

// Dialog sizes
export const DIALOG_SIZES = {
  SM: 'sm',
  MD: 'md',
  LG: 'lg',
  XL: 'xl',
  FULL: 'full',
} as const;

// Table column alignments
export const COLUMN_ALIGN = {
  LEFT: 'left',
  CENTER: 'center',
  RIGHT: 'right',
} as const;