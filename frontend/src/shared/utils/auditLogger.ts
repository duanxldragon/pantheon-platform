/**
 * 增强的审计日志系统
 * @description 提供完整的操作追踪、数据变更对比、风险评估等功能
 */

import type { ID } from '../../modules/system/types';

/**
 * 风险等级
 */
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

/**
 * 数据变更详情
 */
export interface DataChange {
  field: string;
  fieldLabel: string;
  oldValue: any;
  newValue: any;
  valueType: 'string' | 'number' | 'boolean' | 'object' | 'array';
}

/**
 * 审计日志
 */
export interface AuditLog {
  id: ID;
  
  // 用户信息
  userId: ID;
  username: string;
  realName: string;
  
  // 操作信息
  module: string;
  moduleLabel: string;
  action: string;
  actionLabel: string;
  resource: string;
  resourceId: ID | null;
  
  // 变更详情
  changes: DataChange[];
  batchOperation?: {
    total: number;
    success: number;
    failed: number;
    details: Array<{
      resourceId: ID;
      status: 'success' | 'failed';
      error?: string;
    }>;
  };
  
  // 环境信息
  ip: string;
  location?: string;
  device: string;
  browser: string;
  os: string;
  userAgent: string;
  
  // 风险评估
  riskLevel: RiskLevel;
  abnormalFlags: string[];
  securityScore: number; // 0-100
  
  // 时间信息
  timestamp: string;
  duration?: number; // 操作耗时（毫秒）
  
  // 元数据
  metadata: Record<string, any>;
  
  // 关联信息
  relatedLogs?: ID[];
  parentLogId?: ID;
  
  // 状态
  status: 'success' | 'failed' | 'partial';
  errorMessage?: string;
}

/**
 * 审计日志过滤器
 */
export interface AuditLogFilter {
  userId?: ID;
  module?: string;
  action?: string;
  riskLevel?: RiskLevel[];
  startTime?: string;
  endTime?: string;
  searchKeyword?: string;
  status?: ('success' | 'failed' | 'partial')[];
}

/**
 * 审计日志统计
 */
export interface AuditLogStats {
  total: number;
  byRiskLevel: Record<RiskLevel, number>;
  byModule: Record<string, number>;
  byAction: Record<string, number>;
  byUser: Record<string, number>;
  byStatus: Record<string, number>;
  recentTrend: Array<{
    date: string;
    count: number;
  }>;
}

/**
 * 审计日志服务类
 */
export class AuditService {
  private static logs: AuditLog[] = [];
  private static listeners: Array<(log: AuditLog) => void> = [];

  /**
   * 记录操作日志
   */
  static log(params: Omit<AuditLog, 'id' | 'timestamp' | 'riskLevel' | 'abnormalFlags' | 'securityScore'>): void {
    const log: AuditLog = {
      ...params,
      id: this.generateLogId(),
      timestamp: new Date().toISOString(),
      riskLevel: this.assessRiskLevel(params),
      abnormalFlags: this.detectAbnormalities(params),
      securityScore: this.calculateSecurityScore(params),
    };
    
    // 存储日志
    this.logs.push(log);
    
    // 通知监听器
    this.notifyListeners(log);
    
    // 高风险操作发送告警
    if (log.riskLevel === 'critical' || log.riskLevel === 'high') {
      this.sendAlert(log);
    }
    
    // 持久化到后端（实际项目中）
    // await this.persistToBackend(log);
    
    console.log('Audit Log:', log);
  }

  /**
   * 简化的日志记录方法
   */
  static simpleLog(
    userId: ID,
    username: string,
    realName: string,
    module: string,
    action: string,
    resource: string,
    resourceId?: ID,
    changes?: DataChange[],
    metadata?: Record<string, any>
  ): void {
    const deviceInfo = this.getDeviceInfo();
    
    this.log({
      userId,
      username,
      realName,
      module,
      moduleLabel: this.getModuleLabel(module),
      action,
      actionLabel: this.getActionLabel(action),
      resource,
      resourceId: resourceId || null,
      changes: changes || [],
      ip: '127.0.0.1', // 实际应从后端获取
      location: undefined,
      device: deviceInfo.device,
      browser: deviceInfo.browser,
      os: deviceInfo.os,
      userAgent: navigator.userAgent,
      metadata: metadata || {},
      status: 'success',
    });
  }

  /**
   * 记录批量操作
   */
  static logBatchOperation(
    userId: ID,
    username: string,
    realName: string,
    module: string,
    action: string,
    resource: string,
    batchResults: Array<{
      resourceId: ID;
      status: 'success' | 'failed';
      error?: string;
      changes?: DataChange[];
    }>
  ): void {
    const deviceInfo = this.getDeviceInfo();
    
    const successCount = batchResults.filter(r => r.status === 'success').length;
    const failedCount = batchResults.filter(r => r.status === 'failed').length;
    
    // 记录主日志
    const mainLog: Omit<AuditLog, 'id' | 'timestamp' | 'riskLevel' | 'abnormalFlags' | 'securityScore'> = {
      userId,
      username,
      realName,
      module,
      moduleLabel: this.getModuleLabel(module),
      action: `batch_${action}`,
      actionLabel: `批量${this.getActionLabel(action)}`,
      resource,
      resourceId: null,
      changes: [],
      batchOperation: {
        total: batchResults.length,
        success: successCount,
        failed: failedCount,
        details: batchResults.map(r => ({
          resourceId: r.resourceId,
          status: r.status,
          error: r.error,
        })),
      },
      ip: '127.0.0.1',
      device: deviceInfo.device,
      browser: deviceInfo.browser,
      os: deviceInfo.os,
      userAgent: navigator.userAgent,
      metadata: {},
      status: failedCount === 0 ? 'success' : successCount === 0 ? 'failed' : 'partial',
    };
    
    this.log(mainLog);
  }

  /**
   * 数据变更对比
   */
  static compareData(
    oldData: Record<string, any>,
    newData: Record<string, any>,
    fieldLabels?: Record<string, string>
  ): DataChange[] {
    const changes: DataChange[] = [];
    
    // 获取所有字段
    const allFields = new Set([...Object.keys(oldData), ...Object.keys(newData)]);
    
    allFields.forEach(field => {
      const oldValue = oldData[field];
      const newValue = newData[field];
      
      // 跳过相同值
      if (JSON.stringify(oldValue) === JSON.stringify(newValue)) {
        return;
      }
      
      // 跳过敏感字段
      if (this.isSensitiveField(field)) {
        changes.push({
          field,
          fieldLabel: fieldLabels?.[field] || field,
          oldValue: '***',
          newValue: '***',
          valueType: 'string',
        });
        return;
      }
      
      changes.push({
        field,
        fieldLabel: fieldLabels?.[field] || field,
        oldValue: this.formatValue(oldValue),
        newValue: this.formatValue(newValue),
        valueType: this.getValueType(newValue),
      });
    });
    
    return changes;
  }

  /**
   * 评估风险等级
   */
  private static assessRiskLevel(params: any): RiskLevel {
    let score = 0;
    
    // 根据操作类型评分
    const highRiskActions = ['delete', 'batch_delete', 'reset_password', 'change_permission'];
    const mediumRiskActions = ['update', 'create', 'assign_role'];
    
    if (highRiskActions.some(action => params.action.includes(action))) {
      score += 60;
    } else if (mediumRiskActions.some(action => params.action.includes(action))) {
      score += 30;
    }
    
    // 批量操作风险更高
    if (params.batchOperation) {
      score += 20;
    }
    
    // 敏感数据变更
    if (params.changes?.some((c: DataChange) => this.isSensitiveField(c.field))) {
      score += 20;
    }
    
    // 失败操作
    if (params.status === 'failed') {
      score += 10;
    }
    
    // 根据分数返回等级
    if (score >= 80) return 'critical';
    if (score >= 50) return 'high';
    if (score >= 20) return 'medium';
    return 'low';
  }

  /**
   * 检测异常
   */
  private static detectAbnormalities(params: any): string[] {
    const flags: string[] = [];
    
    // 检测批量操作异常
    if (params.batchOperation) {
      const { total, failed } = params.batchOperation;
      const failureRate = failed / total;
      
      if (failureRate > 0.5) {
        flags.push('批量操作失败率过高');
      }
      
      if (total > 100) {
        flags.push('大批量操作');
      }
    }
    
    // 检测敏感操作
    if (params.action.includes('delete') || params.action.includes('reset_password')) {
      flags.push('敏感操作');
    }
    
    // 检测失败操作
    if (params.status === 'failed') {
      flags.push('操作失败');
    }
    
    return flags;
  }

  /**
   * 计算安全评分
   */
  private static calculateSecurityScore(params: any): number {
    let score = 100;
    
    // 失败操作扣分
    if (params.status === 'failed') {
      score -= 30;
    } else if (params.status === 'partial') {
      score -= 15;
    }
    
    // 异常标记扣分
    score -= params.abnormalFlags?.length * 10 || 0;
    
    // 敏感数据变更扣分
    if (params.changes?.some((c: DataChange) => this.isSensitiveField(c.field))) {
      score -= 20;
    }
    
    return Math.max(0, Math.min(100, score));
  }

  /**
   * 发送告警
   */
  private static sendAlert(log: AuditLog): void {
    console.warn('🚨 高风险操作告警:', {
      user: `${log.realName}(${log.username})`,
      action: log.actionLabel,
      resource: log.resource,
      riskLevel: log.riskLevel,
      abnormalFlags: log.abnormalFlags,
      time: log.timestamp,
    });
    
    // 实际项目中应该发送到告警系统
    // - 邮件通知
    // - 短信通知
    // - 企业微信/钉钉通知
    // - Webhook
  }

  /**
   * 添加监听器
   */
  static addListener(listener: (log: AuditLog) => void): void {
    this.listeners.push(listener);
  }

  /**
   * 移除监听器
   */
  static removeListener(listener: (log: AuditLog) => void): void {
    this.listeners = this.listeners.filter(l => l !== listener);
  }

  /**
   * 通知所有监听器
   */
  private static notifyListeners(log: AuditLog): void {
    this.listeners.forEach(listener => {
      try {
        listener(log);
      } catch (error) {
        console.error('Audit listener error:', error);
      }
    });
  }

  /**
   * 查询日志
   */
  static query(filter?: AuditLogFilter): AuditLog[] {
    let results = [...this.logs];
    
    if (!filter) return results;
    
    if (filter.userId) {
      results = results.filter(log => log.userId === filter.userId);
    }
    
    if (filter.module) {
      results = results.filter(log => log.module === filter.module);
    }
    
    if (filter.action) {
      results = results.filter(log => log.action.includes(filter.action));
    }
    
    if (filter.riskLevel && filter.riskLevel.length > 0) {
      results = results.filter(log => filter.riskLevel!.includes(log.riskLevel));
    }
    
    if (filter.status && filter.status.length > 0) {
      results = results.filter(log => filter.status!.includes(log.status));
    }
    
    if (filter.startTime) {
      results = results.filter(log => log.timestamp >= filter.startTime!);
    }
    
    if (filter.endTime) {
      results = results.filter(log => log.timestamp <= filter.endTime!);
    }
    
    if (filter.searchKeyword) {
      const keyword = filter.searchKeyword.toLowerCase();
      results = results.filter(log => 
        log.username.toLowerCase().includes(keyword) ||
        log.realName.toLowerCase().includes(keyword) ||
        log.actionLabel.toLowerCase().includes(keyword) ||
        log.resource.toLowerCase().includes(keyword)
      );
    }
    
    return results.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  /**
   * 获取统计信息
   */
  static getStats(filter?: AuditLogFilter): AuditLogStats {
    const logs = this.query(filter);
    
    const stats: AuditLogStats = {
      total: logs.length,
      byRiskLevel: {
        low: 0,
        medium: 0,
        high: 0,
        critical: 0,
      },
      byModule: {},
      byAction: {},
      byUser: {},
      byStatus: {},
      recentTrend: [],
    };
    
    logs.forEach(log => {
      // 风险等级统计
      stats.byRiskLevel[log.riskLevel]++;
      
      // 模块统计
      stats.byModule[log.moduleLabel] = (stats.byModule[log.moduleLabel] || 0) + 1;
      
      // 操作统计
      stats.byAction[log.actionLabel] = (stats.byAction[log.actionLabel] || 0) + 1;
      
      // 用户统计
      stats.byUser[log.realName] = (stats.byUser[log.realName] || 0) + 1;
      
      // 状态统计
      stats.byStatus[log.status] = (stats.byStatus[log.status] || 0) + 1;
    });
    
    // 近期趋势（最近7天）
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const count = logs.filter(log => log.timestamp.startsWith(dateStr)).length;
      
      stats.recentTrend.push({
        date: dateStr,
        count,
      });
    }
    
    return stats;
  }

  /**
   * 导出日志
   */
  static exportLogs(filter?: AuditLogFilter, format: 'json' | 'csv' = 'json'): string {
    const logs = this.query(filter);
    
    if (format === 'json') {
      return JSON.stringify(logs, null, 2);
    }
    
    // CSV格式
    const headers = [
      '时间',
      '用户',
      '真实姓名',
      '模块',
      '操作',
      '资源',
      '风险等级',
      '状态',
      'IP地址',
      '异常标记',
    ];
    
    const rows = logs.map(log => [
      log.timestamp,
      log.username,
      log.realName,
      log.moduleLabel,
      log.actionLabel,
      log.resource,
      log.riskLevel,
      log.status,
      log.ip,
      log.abnormalFlags.join('; '),
    ]);
    
    return [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
    ].join('\n');
  }

  /**
   * 清空日志（仅用于测试）
   */
  static clear(): void {
    this.logs = [];
  }

  /**
   * 获取模块标签
   */
  private static getModuleLabel(module: string): string {
    const labels: Record<string, string> = {
      user: '用户管理',
      role: '角色管理',
      permission: '权限管理',
      menu: '菜单管理',
      department: '部门管理',
      position: '岗位管理',
      system: '系统设置',
    };
    return labels[module] || module;
  }

  /**
   * 获取操作标签
   */
  private static getActionLabel(action: string): string {
    const labels: Record<string, string> = {
      create: '创建',
      update: '更新',
      delete: '删除',
      view: '查看',
      export: '导出',
      import: '导入',
      assign: '分配',
      reset_password: '重置密码',
      change_status: '状态变更',
      login: '登录',
      logout: '登出',
    };
    return labels[action] || action;
  }

  /**
   * 判断是否为敏感字段
   */
  private static isSensitiveField(field: string): boolean {
    const sensitiveFields = [
      'password',
      'token',
      'secret',
      'key',
      'credential',
      'idCard',
      'bankCard',
    ];
    return sensitiveFields.some(s => field.toLowerCase().includes(s));
  }

  /**
   * 格式化值
   */
  private static formatValue(value: any): string {
    if (value === null || value === undefined) {
      return '-';
    }
    if (typeof value === 'object') {
      return JSON.stringify(value);
    }
    return String(value);
  }

  /**
   * 获取值类型
   */
  private static getValueType(value: any): 'string' | 'number' | 'boolean' | 'object' | 'array' {
    if (Array.isArray(value)) return 'array';
    if (value === null || value === undefined) return 'string';
    const type = typeof value;
    if (type === 'object') return 'object';
    return type as any;
  }

  /**
   * 获取设备信息
   */
  private static getDeviceInfo(): { device: string; browser: string; os: string } {
    const ua = navigator.userAgent;
    
    // 检测设备
    let device = 'Desktop';
    if (/Mobile|Android|iPhone|iPad|iPod/i.test(ua)) {
      device = 'Mobile';
    } else if (/Tablet|iPad/i.test(ua)) {
      device = 'Tablet';
    }
    
    // 检测浏览器
    let browser = 'Unknown';
    if (ua.includes('Chrome')) browser = 'Chrome';
    else if (ua.includes('Firefox')) browser = 'Firefox';
    else if (ua.includes('Safari')) browser = 'Safari';
    else if (ua.includes('Edge')) browser = 'Edge';
    
    // 检测操作系统
    let os = 'Unknown';
    if (ua.includes('Windows')) os = 'Windows';
    else if (ua.includes('Mac')) os = 'macOS';
    else if (ua.includes('Linux')) os = 'Linux';
    else if (ua.includes('Android')) os = 'Android';
    else if (ua.includes('iOS')) os = 'iOS';
    
    return { device, browser, os };
  }

  /**
   * 生成日志ID
   */
  private static generateLogId(): string {
    return `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
