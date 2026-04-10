import { useI18n } from '@/hooks/use_i18n';

/**
 * 国际化使用示例
 */

// ==================== 基础用法 ====================

function BasicExample() {
  const { t } = useI18n();

  return (
    <div>
      <h1>{t('common.save')}</h1>              {/* "保存" */}
      <button>{t('common.cancel')}</button>    {/* "取消" */}
    </div>
  );
}

// ==================== 动态插值 ====================

function InterpolationExample() {
  const { t } = useI18n();

  const userName = '张三';
  const itemCount = 5;

  return (
    <div>
      <p>{t('welcome', { name: userName })}</p>                    {/* "欢迎, 张三!" */}
      <p>{t('itemCount', { count: itemCount })}</p>                {/* "您有 5 个项目" */}
    </div>
  );
}

// ==================== 语言切换 ====================

function LanguageSwitcherExample() {
  const { currentLanguage, changeLanguage, languages } = useI18n();

  return (
    <div>
      <p>当前语言: {currentLanguage}</p>
      <select
        value={currentLanguage}
        onChange={(e) => changeLanguage(e.target.value)}
      >
        {languages.map((lang) => (
          <option key={lang.code} value={lang.code}>
            {lang.flag} {lang.name}
          </option>
        ))}
      </select>
    </div>
  );
}

// ==================== 表单验证 ====================

function FormExample() {
  const { t } = useI18n();
  const [errors, setErrors] = useState({});

  const validateForm = (data: FormData) => {
    const newErrors = {};

    if (!data.username) {
      newErrors.username = t('validation.required');
    }
    if (!data.email) {
      newErrors.email = t('validation.email');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  return (
    <form>
      <input name="username" placeholder={t('common.username')} />
      {errors.username && <span className="error">{errors.username}</span>}

      <input name="email" placeholder={t('common.email')} />
      {errors.email && <span className="error">{errors.email}</span>}

      <button type="submit">{t('common.submit')}</button>
    </form>
  );
}

// ==================== 模块化翻译 ====================

// 使用命名空间
function NamespaceExample() {
  const { t } = useI18n('auth'); // 使用auth命名空间

  return (
    <div>
      <h1>{t('login.title')}</h1>        {/* auth.login.title */}
      <input placeholder={t('login.username')} />
      <input placeholder={t('login.password')} />
      <button>{t('login.submit')}</button>
    </div>
  );
}

// ==================== 类型安全翻译 ====================

// 定义翻译键类型
type TranslationKey =
  | 'common.save'
  | 'common.cancel'
  | 'auth.login.title'
  | 'system.user.create';

function TypeSafeExample() {
  const { t } = useI18n();

  // 类型安全的翻译调用
  const saveText = t('common.save' as TranslationKey);
  const title = t('auth.login.title' as TranslationKey);

  return (
    <div>
      <h1>{title}</h1>
      <button>{saveText}</button>
    </div>
  );
}

// ==================== 复数形式 ====================

function PluralExample() {
  const { t } = useI18n();
  const [itemCount, setItemCount] = useState(1);

  return (
    <div>
      <p>{t('items', { count: itemCount })}</p>
      {/* 0: "没有项目" */}
      {/* 1: "1个项目" */}
      {/* 2: "2个项目" */}

      <button onClick={() => setItemCount(itemCount + 1)}>增加</button>
      <button onClick={() => setItemCount(Math.max(0, itemCount - 1))}>减少</button>
    </div>
  );
}

// ==================== 日期时间格式化 ====================

function DateTimeExample() {
  const { currentLanguage } = useI18n();
  const now = new Date();

  const formatDate = (date: Date) => {
    const locale = currentLanguage === 'zh-CN' ? zhCN : enUS;
    return format(date, 'PPPP', { locale });
  };

  return (
    <div>
      <p>当前时间: {formatDate(now)}</p>
      {/* zh-CN: "2024年4月9日星期二" */}
      {/* en-US: "Tuesday, April 9, 2024" */}
    </div>
  );
}

// ==================== 数字格式化 ====================

function NumberFormatExample() {
  const { currentLanguage } = useI18n();
  const price = 1234.56;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(currentLanguage, {
      style: 'currency',
      currency: currentLanguage === 'zh-CN' ? 'CNY' : 'USD'
    }).format(amount);
  };

  return (
    <div>
      <p>价格: {formatCurrency(price)}</p>
      {/* zh-CN: "¥1,234.56" */}
      {/* en-US: "$1,234.56" */}
    </div>
  );
}

// ==================== 错误消息 ====================

function ErrorMessageExample() {
  const { t } = useI18n();
  const [error, setError] = useState<Error | null>(null);

  const handleError = (error: Error) => {
    let message = t('errors.unknown');

    if (error.message.includes('network')) {
      message = t('errors.network');
    } else if (error.message.includes('server')) {
      message = t('errors.server');
    } else if (error.message.includes('unauthorized')) {
      message = t('errors.unauthorized');
    }

    setError({ ...error, message });
  };

  return (
    <div>
      {error && <div className="error">{error.message}</div>}
    </div>
  );
}

// ==================== 布局方向 (RTL/LTR) ====================

function DirectionExample() {
  const { isRTL, changeLanguage } = useI18n();

  return (
    <div dir={isRTL ? 'rtl' : 'ltr'}>
      <button onClick={() => changeLanguage('ar')}>切换到阿拉伯语(RTL)</button>
      <button onClick={() => changeLanguage('en-US')}>切换到英语(LTR)</button>

      <div className={isRTL ? 'rtl-layout' : 'ltr-layout'}>
        <p>内容会根据语言方向自动调整</p>
      </div>
    </div>
  );
}

// ==================== 翻译文件示例 ====================

/*
// 对应的翻译文件结构

{
  "common": {
    "save": "保存",
    "cancel": "取消",
    "username": "用户名",
    "email": "邮箱",
    "submit": "提交"
  },
  "welcome": "欢迎, {{name}}!",
  "itemCount": "您有 {{count}} 个项目",
  "items": "没有项目 | 1个项目 | {{count}}个项目",
  "validation": {
    "required": "此字段为必填项",
    "email": "请输入有效的邮箱地址"
  },
  "auth": {
    "login": {
      "title": "登录",
      "username": "用户名",
      "password": "密码",
      "submit": "登录"
    }
  },
  "errors": {
    "unknown": "未知错误",
    "network": "网络错误",
    "server": "服务器错误",
    "unauthorized": "未授权访问"
  }
}
*/

// ==================== 完整的组件示例 ====================

function CompleteExample() {
  const { t, currentLanguage, changeLanguage, isRTL, languages } = useI18n();

  return (
    <div dir={isRTL ? 'rtl' : 'ltr'} className="min-h-screen p-6">
      {/* 语言切换器 */}
      <div className="mb-6">
        <label className="block text-sm font-medium mb-2">
          {t('common.language')}:
        </label>
        <select
          value={currentLanguage}
          onChange={(e) => changeLanguage(e.target.value)}
          className="border rounded px-3 py-2"
        >
          {languages.map((lang) => (
            <option key={lang.code} value={lang.code}>
              {lang.flag} {lang.name}
            </option>
          ))}
        </select>
      </div>

      {/* 表单示例 */}
      <div className="max-w-md mx-auto bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold mb-6">
          {t('auth.login.title')}
        </h2>

        <form className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              {t('auth.login.username')}
            </label>
            <input
              type="text"
              className="w-full border rounded px-3 py-2"
              placeholder={t('auth.login.username')}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              {t('auth.login.password')}
            </label>
            <input
              type="password"
              className="w-full border rounded px-3 py-2"
              placeholder={t('auth.login.password')}
            />
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              className="flex-1 bg-blue-500 text-white py-2 rounded"
            >
              {t('auth.login.submit')}
            </button>
            <button
              type="button"
              className="flex-1 border py-2 rounded"
            >
              {t('common.cancel')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CompleteExample;
