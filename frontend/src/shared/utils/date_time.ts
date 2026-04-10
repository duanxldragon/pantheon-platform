/**
 * 日期时间工具函数
 * @description 提供日期格式化、相对时间、时区转换等功能
 */

/**
 * 相对时间显示
 * @param date 日期字符串或Date对象
 * @param locale 语言环境 'zh' | 'en'
 * @returns 相对时间字符串，如"2小时前"、"3天前"
 */
export function formatRelativeTime(
  date: string | Date,
  locale: 'zh' | 'en' = 'zh'
): string {
  const now = new Date();
  const targetDate = typeof date === 'string' ? new Date(date) : date;
  const diffInSeconds = Math.floor((now.getTime() - targetDate.getTime()) / 1000);

  // 未来时间
  if (diffInSeconds < 0) {
    return locale === 'zh' ? '刚刚' : 'just now';
  }

  // 1分钟内
  if (diffInSeconds < 60) {
    return locale === 'zh' ? '刚刚' : 'just now';
  }

  // 1小时内
  if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return locale === 'zh' ? `${minutes}分钟前` : `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  }

  // 24小时内
  if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return locale === 'zh' ? `${hours}小时前` : `${hours} hour${hours > 1 ? 's' : ''} ago`;
  }

  // 30天内
  if (diffInSeconds < 2592000) {
    const days = Math.floor(diffInSeconds / 86400);
    return locale === 'zh' ? `${days}天前` : `${days} day${days > 1 ? 's' : ''} ago`;
  }

  // 1年内
  if (diffInSeconds < 31536000) {
    const months = Math.floor(diffInSeconds / 2592000);
    return locale === 'zh' ? `${months}个月前` : `${months} month${months > 1 ? 's' : ''} ago`;
  }

  // 超过1年
  const years = Math.floor(diffInSeconds / 31536000);
  return locale === 'zh' ? `${years}年前` : `${years} year${years > 1 ? 's' : ''} ago`;
}

/**
 * 格式化日期时间
 * @param date 日期字符串或Date对象
 * @param format 格式化模板
 * @returns 格式化后的字符串
 */
export function formatDateTime(
  date: string | Date,
  format: string = 'YYYY-MM-DD HH:mm:ss'
): string {
  const d = typeof date === 'string' ? new Date(date) : date;

  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');

  return format
    .replace('YYYY', String(year))
    .replace('MM', month)
    .replace('DD', day)
    .replace('HH', hours)
    .replace('mm', minutes)
    .replace('ss', seconds);
}

/**
 * 格式化日期（不含时间）
 */
export function formatDate(date: string | Date, locale: 'zh' | 'en' = 'zh'): string {
  const d = typeof date === 'string' ? new Date(date) : date;

  if (locale === 'zh') {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}年${month}月${day}日`;
  } else {
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }
}

/**
 * 格式化时间（不含日期）
 */
export function formatTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');
  return `${hours}:${minutes}:${seconds}`;
}

/**
 * 解析日期字符串
 */
export function parseDate(dateString: string): Date | null {
  try {
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? null : date;
  } catch {
    return null;
  }
}

/**
 * 检查日期是否有效
 */
export function isValidDate(date: unknown): boolean {
  if (!date) return false;
  const d = typeof date === 'string' ? new Date(date) : date;
  return d instanceof Date && !isNaN(d.getTime());
}

/**
 * 获取日期范围
 */
export function getDateRange(type: 'today' | 'week' | 'month' | 'year'): [Date, Date] {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  switch (type) {
    case 'today':
      return [
        startOfDay,
        new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59),
      ];

    case 'week': {
      const dayOfWeek = now.getDay();
      const startOfWeek = new Date(startOfDay);
      startOfWeek.setDate(startOfDay.getDate() - dayOfWeek);
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      endOfWeek.setHours(23, 59, 59);
      return [startOfWeek, endOfWeek];
    }

    case 'month': {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
      return [startOfMonth, endOfMonth];
    }

    case 'year': {
      const startOfYear = new Date(now.getFullYear(), 0, 1);
      const endOfYear = new Date(now.getFullYear(), 11, 31, 23, 59, 59);
      return [startOfYear, endOfYear];
    }

    default:
      return [startOfDay, now];
  }
}

/**
 * 计算时间差
 */
export function diffDates(
  date1: string | Date,
  date2: string | Date,
  unit: 'seconds' | 'minutes' | 'hours' | 'days' = 'days'
): number {
  const d1 = typeof date1 === 'string' ? new Date(date1) : date1;
  const d2 = typeof date2 === 'string' ? new Date(date2) : date2;
  const diffInMs = Math.abs(d2.getTime() - d1.getTime());

  switch (unit) {
    case 'seconds':
      return Math.floor(diffInMs / 1000);
    case 'minutes':
      return Math.floor(diffInMs / (1000 * 60));
    case 'hours':
      return Math.floor(diffInMs / (1000 * 60 * 60));
    case 'days':
      return Math.floor(diffInMs / (1000 * 60 * 60 * 24));
    default:
      return diffInMs;
  }
}

/**
 * 添加时间
 */
export function addTime(
  date: string | Date,
  amount: number,
  unit: 'seconds' | 'minutes' | 'hours' | 'days' | 'months' | 'years'
): Date {
  const d = typeof date === 'string' ? new Date(date) : new Date(date);

  switch (unit) {
    case 'seconds':
      d.setSeconds(d.getSeconds() + amount);
      break;
    case 'minutes':
      d.setMinutes(d.getMinutes() + amount);
      break;
    case 'hours':
      d.setHours(d.getHours() + amount);
      break;
    case 'days':
      d.setDate(d.getDate() + amount);
      break;
    case 'months':
      d.setMonth(d.getMonth() + amount);
      break;
    case 'years':
      d.setFullYear(d.getFullYear() + amount);
      break;
  }

  return d;
}

/**
 * 判断是否为今天
 */
export function isToday(date: string | Date): boolean {
  const d = typeof date === 'string' ? new Date(date) : date;
  const today = new Date();
  return (
    d.getFullYear() === today.getFullYear() &&
    d.getMonth() === today.getMonth() &&
    d.getDate() === today.getDate()
  );
}

/**
 * 判断是否为昨天
 */
export function isYesterday(date: string | Date): boolean {
  const d = typeof date === 'string' ? new Date(date) : date;
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return (
    d.getFullYear() === yesterday.getFullYear() &&
    d.getMonth() === yesterday.getMonth() &&
    d.getDate() === yesterday.getDate()
  );
}

/**
 * 友好的日期时间显示
 * 今天：显示时间
 * 昨天：显示"昨天 + 时间"
 * 其他：显示完整日期时间
 */
export function formatFriendlyDateTime(
  date: string | Date,
  locale: 'zh' | 'en' = 'zh'
): string {
  const d = typeof date === 'string' ? new Date(date) : date;

  if (isToday(d)) {
    return formatTime(d);
  }

  if (isYesterday(d)) {
    const time = formatTime(d);
    return locale === 'zh' ? `昨天 ${time}` : `Yesterday ${time}`;
  }

  return formatDateTime(d, 'YYYY-MM-DD HH:mm');
}

/**
 * 获取星期几
 */
export function getWeekday(date: string | Date, locale: 'zh' | 'en' = 'zh'): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const day = d.getDay();

  if (locale === 'zh') {
    const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
    return `星期${weekdays[day]}`;
  } else {
    const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return weekdays[day];
  }
}

/**
 * 时间戳转日期
 */
export function timestampToDate(timestamp: number): Date {
  // 支持秒级和毫秒级时间戳
  const ts = timestamp < 10000000000 ? timestamp * 1000 : timestamp;
  return new Date(ts);
}

/**
 * 日期转时间戳
 */
export function dateToTimestamp(date: string | Date, inSeconds: boolean = false): number {
  const d = typeof date === 'string' ? new Date(date) : date;
  const timestamp = d.getTime();
  return inSeconds ? Math.floor(timestamp / 1000) : timestamp;
}

/**
 * 格式化时长
 * @param seconds 秒数
 * @param locale 语言
 * @returns 格式化的时长字符串
 */
export function formatDuration(seconds: number, locale: 'zh' | 'en' = 'zh'): string {
  if (seconds < 60) {
    return locale === 'zh' ? `${seconds}秒` : `${seconds}s`;
  }

  if (seconds < 3600) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    if (remainingSeconds === 0) {
      return locale === 'zh' ? `${minutes}分钟` : `${minutes}m`;
    }
    return locale === 'zh' 
      ? `${minutes}分${remainingSeconds}秒` 
      : `${minutes}m ${remainingSeconds}s`;
  }

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (minutes === 0) {
    return locale === 'zh' ? `${hours}小时` : `${hours}h`;
  }
  return locale === 'zh' 
    ? `${hours}小时${minutes}分钟` 
    : `${hours}h ${minutes}m`;
}

/**
 * 倒计时格式化
 */
export function formatCountdown(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  const parts = [];
  if (hours > 0) parts.push(String(hours).padStart(2, '0'));
  parts.push(String(minutes).padStart(2, '0'));
  parts.push(String(secs).padStart(2, '0'));

  return parts.join(':');
}

/**
 * 时区转换
 */
export function convertTimezone(
  date: string | Date,
  _fromTimezone: string,
  _toTimezone: string
): Date {
  // 这是一个简化版本，实际项目可能需要使用 date-fns-tz 或 moment-timezone
  const d = typeof date === 'string' ? new Date(date) : date;
  // 这里只是示例，实际需要根据时区进行转换
  return d;
}
