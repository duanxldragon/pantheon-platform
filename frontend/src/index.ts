/**
 * Pantheon Platform V2 - 统一导出入口
 * @description 整合主要模块与公共功能的统一导出
 */

export { systemApi } from './modules/system/api';
export { tenantDatabaseApi, default as tenantApi } from './modules/tenant/api';
export { authApi } from './modules/auth/api';
export type { ID } from './modules/system/types';

