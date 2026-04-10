import { http } from '../utils/axios_client';

/**
 * 支持的语言类型
 */
export type SupportedLanguage = 'zh' | 'en' | 'ja' | 'ko';

/**
 * 翻译项
 */
export interface Translation {
  id?: number;
  module: string;
  key: string;
  language: SupportedLanguage;
  value: string;
  tenantId?: string;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * 翻译响应（后端返回的数据结构）
 */
interface TranslationResponse {
  items: Translation[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
  };
}

/**
 * i18n API 客户端
 * 用于从后端动态加载翻译数据
 */
export const i18nApi = {
  /**
   * 获取所有翻译
   */
  getTranslations: async (
    language: SupportedLanguage,
    options?: {
      module?: string;
      includeGlobal?: boolean;
    }
  ): Promise<Record<string, string>> => {
    const params: Record<string, string> = { language };
    if (options?.module) {
      params.module = options.module;
    }

    const resp = await http.get<TranslationResponse>('/v1/i18n/translations', { params });

    // 将后端返回的翻译数组转换为嵌套对象格式
    const translations: Record<string, string> = {};
    for (const item of resp.data.items) {
      // 格式: module.key (如 "system.user.create.success")
      const fullKey = `${item.module}.${item.key}`;
      translations[fullKey] = item.value;
    }

    return translations;
  },

  /**
   * 按模块获取翻译
   */
  getTranslationsByModule: async (
    module: string,
    language: SupportedLanguage
  ): Promise<Record<string, string>> => {
    return i18nApi.getTranslations(language, { module });
  },

  /**
   * 获取单个翻译
   */
  getTranslation: async (
    module: string,
    key: string,
    language: SupportedLanguage
  ): Promise<string | null> => {
    try {
      const resp = await http.get<Translation>(
        `/v1/i18n/translations/${language}/${module}/${key}`
      );
      return resp.data.value;
    } catch {
      return null;
    }
  },

  /**
   * 获取支持的模块列表
   */
  getModules: async (): Promise<string[]> => {
    const resp = await http.get<string[]>('/v1/i18n/modules');
    return resp.data || [];
  },

  /**
   * 获取指定模块的所有键
   */
  getKeys: async (module: string): Promise<string[]> => {
    const resp = await http.get<string[]>('/v1/i18n/keys', {
      params: { module },
    });
    return resp.data || [];
  },

  /**
   * 获取支持的语言列表
   */
  getSupportedLanguages: async (): Promise<SupportedLanguage[]> => {
    const resp = await http.get<SupportedLanguage[]>('/v1/i18n/languages');
    return resp.data || ['zh', 'en', 'ja', 'ko'];
  },

  /**
   * 导出翻译（用于备份）
   */
  exportTranslations: async (
    language?: SupportedLanguage,
    module?: string
  ): Promise<Translation[]> => {
    const params: Record<string, string> = {};
    if (language) params.language = language;
    if (module) params.module = module;

    const resp = await http.get<Translation[]>('/v1/i18n/translations/export', { params });
    return resp.data || [];
  },

  /**
   * 导入翻译（用于批量更新）
   */
  importTranslations: async (translations: Translation[]): Promise<void> => {
    await http.post('/v1/i18n/translations/import', { translations });
  },
};

/**
 * 翻译加载器
 * 负责从后端加载翻译并更新到 i18next
 */
export class TranslationLoader {
  private cache = new Map<string, Record<string, string>>();

  /**
   * 加载指定语言的翻译
   */
  async loadLanguage(language: SupportedLanguage): Promise<Record<string, string>> {
    // 检查缓存
    const cacheKey = language;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    // 从后端加载
    const translations = await i18nApi.getTranslations(language);

    // 更新缓存
    this.cache.set(cacheKey, translations);

    return translations;
  }

  /**
   * 加载指定模块的翻译
   */
  async loadModule(
    module: string,
    language: SupportedLanguage
  ): Promise<Record<string, string>> {
    const cacheKey = `${language}:${module}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    const translations = await i18nApi.getTranslationsByModule(module, language);
    this.cache.set(cacheKey, translations);

    return translations;
  }

  /**
   * 清除缓存
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * 清除指定语言的缓存
   */
  clearLanguage(language: SupportedLanguage): void {
    const keysToDelete: string[] = [];
    for (const key of this.cache.keys()) {
      if (key.startsWith(language)) {
        keysToDelete.push(key);
      }
    }
    keysToDelete.forEach(key => this.cache.delete(key));
  }
}

// 导出单例
export const translationLoader = new TranslationLoader();
