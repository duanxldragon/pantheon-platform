/**
 * Pantheon Platform V2 - 统一导出入口
 * @description 聚合主要模块与共享能力的统一导出
 *
 * 结构说明：
 * - 模块化目录：`modules/{name}/`
 * - 共享能力：`shared/{utils|validation|components}/`
 * - 类型定义：`modules/{name}/types/`
 */

// 系统模块
export * from './modules/system';

// 租户模块
export * from './modules/tenant';

// 认证与个人中心模块
export * from './modules/auth';

// 共享校验能力
export * from './shared/validation';

// 公共类型
export type { ID } from './modules/system/types';
