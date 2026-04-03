import type { Language } from '../../../../stores/languageStore';

export interface SettingsSectionCopy {
  title: string;
  description: string;
  settings: {
    systemName?: string;
    systemNameDescription?: string;
    systemSubtitle?: string;
    systemSubtitleDescription?: string;
    defaultLanguage?: string;
    defaultLanguageDescription?: string;
    enable2fa?: string;
    enable2faDescription?: string;
    maxLoginAttempts?: string;
    maxLoginAttemptsDescription?: string;
    minPasswordLength?: string;
    minPasswordLengthDescription?: string;
    smtpHost?: string;
    smtpHostDescription?: string;
    smtpPort?: string;
    smtpPortDescription?: string;
    smtpUsername?: string;
    smtpUsernameDescription?: string;
    enableSystemNotice?: string;
    enableSystemNoticeDescription?: string;
    enableEmailNotice?: string;
    enableEmailNoticeDescription?: string;
    webhook?: string;
    webhookDescription?: string;
    uploadPath?: string;
    uploadPathDescription?: string;
    maxUploadSize?: string;
    maxUploadSizeDescription?: string;
    allowedExtensions?: string;
    allowedExtensionsDescription?: string;
  };
}

export interface SystemSettingsCopy {
  entity: {
    zh: string;
    en: string;
  };
  page: {
    title: string;
    description: string;
  };
  actions: {
    import: string;
    export: string;
    save: string;
    syncNow: string;
  };
  messages: {
    invalidFile: string;
    importReload: string;
  };
  logic: {
    loading: string;
    success: string;
    error: string;
    reset: string;
  };
  form: {
    required: string;
    enabled: string;
    disabled: string;
  };
  sidebar: {
    title: string;
  };
  float: {
    pendingSync: string;
    pendingSyncCount: string;
    resetChanges: string;
    syncNow: string;
  };
  sections: {
    basic: SettingsSectionCopy;
    security: SettingsSectionCopy;
    email: SettingsSectionCopy;
    notification: SettingsSectionCopy;
    storage: SettingsSectionCopy;
  };
}

const zhCopy: SystemSettingsCopy = {
  entity: {
    zh: '系统设置',
    en: 'Settings',
  },
  page: {
    title: '系统设置',
    description: '统一管理系统基础、安全、通知、邮件和存储配置。',
  },
  actions: {
    import: '导入',
    export: '导出',
    save: '保存',
    syncNow: '立即同步',
  },
  messages: {
    invalidFile: '无效的配置文件格式',
    importReload: '系统设置导入成功，页面即将刷新',
  },
  logic: {
    loading: '正在同步系统配置...',
    success: '系统配置已更新',
    error: '配置同步失败，请重试',
    reset: '已还原所有未保存的修改',
  },
  form: {
    required: '必填',
    enabled: '启用',
    disabled: '禁用',
  },
  sidebar: {
    title: '系统设置',
  },
  float: {
    pendingSync: '待同步变更',
    pendingSyncCount: '项待提交',
    resetChanges: '还原修改',
    syncNow: '立即同步',
  },
  sections: {
    basic: {
      title: '基础设置',
      description: '维护系统基础信息、品牌标识和默认语言。',
      settings: {
        systemName: '系统名称',
        systemNameDescription: '用于页面标题和导航栏展示。',
        systemSubtitle: '系统副标题',
        systemSubtitleDescription: '用于登录页和欢迎页文案。',
        defaultLanguage: '默认语言',
        defaultLanguageDescription: '新用户首次进入系统时使用。',
      },
    },
    security: {
      title: '安全设置',
      description: '控制登录安全、密码策略和二次认证。',
      settings: {
        enable2fa: '启用二次认证',
        enable2faDescription: '允许用户在个人中心绑定二次认证。',
        maxLoginAttempts: '最大登录失败次数',
        maxLoginAttemptsDescription: '超过次数后触发临时锁定。',
        minPasswordLength: '密码最小长度',
        minPasswordLengthDescription: '影响密码校验和重置流程。',
      },
    },
    email: {
      title: '邮件设置',
      description: '用于通知邮件、验证码和告警邮件发送。',
      settings: {
        smtpHost: 'SMTP 主机',
        smtpHostDescription: '邮件服务主机地址。',
        smtpPort: 'SMTP 端口',
        smtpPortDescription: '常见值为 25、465 或 587。',
        smtpUsername: 'SMTP 用户名',
        smtpUsernameDescription: '用于邮件发送认证。',
      },
    },
    notification: {
      title: '通知设置',
      description: '控制系统内部通知、邮件通知和告警推送。',
      settings: {
        enableSystemNotice: '启用系统通知',
        enableSystemNoticeDescription: '站内消息和顶部提醒开关。',
        enableEmailNotice: '启用邮件通知',
        enableEmailNoticeDescription: '关键事件通过邮件发送。',
        webhook: 'Webhook 地址',
        webhookDescription: '用于第三方告警集成。',
      },
    },
    storage: {
      title: '存储设置',
      description: '配置文件上传、静态资源和备份路径。',
      settings: {
        uploadPath: '上传目录',
        uploadPathDescription: '头像、附件等文件的保存目录。',
        maxUploadSize: '最大上传大小 (MB)',
        maxUploadSizeDescription: '限制上传附件大小。',
        allowedExtensions: '允许的扩展名',
        allowedExtensionsDescription: '逗号分隔的文件扩展名。',
      },
    },
  },
};

const enCopy: SystemSettingsCopy = {
  entity: {
    zh: '系统设置',
    en: 'Settings',
  },
  page: {
    title: 'System Settings',
    description: 'Manage base, security, notification, email, and storage settings.',
  },
  actions: {
    import: 'Import',
    export: 'Export',
    save: 'Save',
    syncNow: 'Sync Now',
  },
  messages: {
    invalidFile: 'Invalid configuration file format',
    importReload: 'Settings imported successfully, reloading...',
  },
  logic: {
    loading: 'Syncing system settings...',
    success: 'System settings updated',
    error: 'Failed to sync settings',
    reset: 'Reverted all unsaved changes',
  },
  form: {
    required: 'Required',
    enabled: 'Enabled',
    disabled: 'Disabled',
  },
  sidebar: {
    title: 'System Settings',
  },
  float: {
    pendingSync: 'Pending Sync',
    pendingSyncCount: 'items pending',
    resetChanges: 'Reset Changes',
    syncNow: 'Sync Now',
  },
  sections: {
    basic: {
      title: 'Basic Settings',
      description: 'Maintain base system info and default locale.',
      settings: {
        systemName: 'System Name',
        systemNameDescription: 'Displayed in the page title and navigation.',
        systemSubtitle: 'System Subtitle',
        systemSubtitleDescription: 'Used on login and welcome pages.',
        defaultLanguage: 'Default Language',
        defaultLanguageDescription: 'Used when new users first visit the platform.',
      },
    },
    security: {
      title: 'Security Settings',
      description: 'Control login security, password policy, and MFA.',
      settings: {
        enable2fa: 'Enable 2FA',
        enable2faDescription: 'Allow users to bind two-factor authentication.',
        maxLoginAttempts: 'Max Login Attempts',
        maxLoginAttemptsDescription: 'Triggers a temporary lock after repeated failures.',
        minPasswordLength: 'Minimum Password Length',
        minPasswordLengthDescription: 'Used by password validation and reset flows.',
      },
    },
    email: {
      title: 'Email Settings',
      description: 'Used for notifications, verification codes, and alerts.',
      settings: {
        smtpHost: 'SMTP Host',
        smtpHostDescription: 'Mail server host.',
        smtpPort: 'SMTP Port',
        smtpPortDescription: 'Common values are 25, 465, or 587.',
        smtpUsername: 'SMTP Username',
        smtpUsernameDescription: 'Used to authenticate email sending.',
      },
    },
    notification: {
      title: 'Notification Settings',
      description: 'Control in-app, email, and alert notifications.',
      settings: {
        enableSystemNotice: 'Enable In-App Notifications',
        enableSystemNoticeDescription: 'Toggle in-app messages and top-bar alerts.',
        enableEmailNotice: 'Enable Email Notifications',
        enableEmailNoticeDescription: 'Send important events by email.',
        webhook: 'Webhook URL',
        webhookDescription: 'Used for third-party alert integrations.',
      },
    },
    storage: {
      title: 'Storage Settings',
      description: 'Configure uploads, static assets, and backup paths.',
      settings: {
        uploadPath: 'Upload Path',
        uploadPathDescription: 'Storage path for avatars and attachments.',
        maxUploadSize: 'Max Upload Size (MB)',
        maxUploadSizeDescription: 'Limits attachment upload size.',
        allowedExtensions: 'Allowed Extensions',
        allowedExtensionsDescription: 'Comma-separated allowed extensions.',
      },
    },
  },
};

export function getSystemSettingsCopy(language: Language): SystemSettingsCopy {
  return language === 'zh' ? zhCopy : enCopy;
}
