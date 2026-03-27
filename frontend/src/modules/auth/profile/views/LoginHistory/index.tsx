import { useEffect, useMemo, useState } from 'react';
import { format } from 'date-fns';
import { enUS, zhCN } from 'date-fns/locale';
import { Badge } from '../../../../../components/ui/badge';
import { Button } from '../../../../../components/ui/button';
import { Input } from '../../../../../components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../../../components/ui/table';
import { systemNotification } from '../../../../../shared/utils/notification';
import { useLanguageStore } from '../../../../../stores/languageStore';
import { useThemeStore } from '../../../../../stores/themeStore';
import { authApi } from '../../../api/authApi';
import { useProfilePreferenceSettings } from '../../hooks/useProfilePreferenceSettings';

interface LoginRecord {
  id: string;
  username: string;
  ip: string;
  location: string;
  browser: string;
  os: string;
  status: string;
  message: string;
  login_at: string;
  logout_at?: string;
}

export function LoginHistory() {
  const { theme } = useThemeStore();
  const { language, t } = useLanguageStore();
  const preferenceSettings = useProfilePreferenceSettings();
  const zh = language === 'zh';
  const locale = zh ? zhCN : enUS;

  const [keyword, setKeyword] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(Number(preferenceSettings.pageSize) || 20);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<{ items: LoginRecord[]; pagination: { page: number; page_size: number; total: number } } | null>(null);

  const loadLoginHistory = async () => {
    setLoading(true);
    try {
      const response = await authApi.getLoginHistory({ page, page_size: pageSize });
      setData(response.data);
    } catch (error: any) {
      systemNotification.error(
        error?.response?.data?.message || (zh ? '加载登录历史失败' : 'Failed to load login history'),
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadLoginHistory();
  }, [page, pageSize]);

  useEffect(() => {
    const nextPageSize = Number(preferenceSettings.pageSize) || 20;
    setPageSize(nextPageSize);
    setPage(1);
  }, [preferenceSettings.pageSize]);

  useEffect(() => {
    setPage(1);
  }, [keyword]);

  useEffect(() => {
    if (!preferenceSettings.autoRefresh) {
      return;
    }

    const timer = window.setInterval(() => {
      void loadLoginHistory();
    }, 30000);

    return () => window.clearInterval(timer);
  }, [page, pageSize, preferenceSettings.autoRefresh]);

  const filteredHistory = useMemo(() => {
    if (!data) return [];
    return data.items.filter((record) =>
      [record.ip, record.location, record.browser, record.os].join(' ').toLowerCase().includes(keyword.toLowerCase()),
    );
  }, [data, keyword]);

  const stats = useMemo(() => {
    const items = data?.items || [];
    return {
      total: data?.pagination?.total || 0,
      success: items.filter((item) => item.status === 'success').length,
      failed: items.filter((item) => item.status === 'failure').length,
    };
  }, [data]);

  const totalPages = Math.max(1, Math.ceil((data?.pagination?.total || 0) / pageSize));

  useEffect(() => {
    if (!data?.pagination?.total) {
      return;
    }

    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [data?.pagination?.total, page, totalPages]);

  return (
    <div className={preferenceSettings.compactMode ? 'space-y-3' : 'space-y-4'}>
      <div className="flex items-center justify-between gap-4">
        <Input
          value={keyword}
          onChange={(event) => setKeyword(event.target.value)}
          placeholder={zh ? '搜索 IP、地点、浏览器或系统' : 'Search IP, location, browser, or OS'}
          className="max-w-sm"
        />
        <Button onClick={loadLoginHistory} disabled={loading} style={{ backgroundColor: theme.colors.primary, color: theme.colors.primaryForeground }}>
          {loading ? (zh ? '加载中...' : 'Loading...') : zh ? '刷新' : 'Refresh'}
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-lg border p-4" style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.border }}>
          <div className="text-sm" style={{ color: theme.colors.textSecondary }}>{zh ? '总登录次数' : 'Total Logins'}</div>
          <div className="mt-1 text-2xl font-semibold" style={{ color: theme.colors.text }}>{stats.total}</div>
        </div>
        <div className="rounded-lg border p-4" style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.border }}>
          <div className="text-sm" style={{ color: theme.colors.textSecondary }}>{zh ? '成功登录' : 'Successful Logins'}</div>
          <div className="mt-1 text-2xl font-semibold" style={{ color: theme.colors.success }}>{stats.success}</div>
        </div>
        <div className="rounded-lg border p-4" style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.border }}>
          <div className="text-sm" style={{ color: theme.colors.textSecondary }}>{zh ? '失败登录' : 'Failed Logins'}</div>
          <div className="mt-1 text-2xl font-semibold" style={{ color: theme.colors.danger }}>{stats.failed}</div>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border" style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.border }}>
        <Table>
          <TableHeader>
            <TableRow style={{ borderColor: theme.colors.border }}>
              <TableHead>{t.profile.loginTime}</TableHead>
              <TableHead>{t.profile.ipAddress}</TableHead>
              <TableHead>{t.profile.location}</TableHead>
              <TableHead>{t.profile.browser}</TableHead>
              <TableHead>{t.profile.os}</TableHead>
              <TableHead>{t.user.status}</TableHead>
              <TableHead>{zh ? '消息' : 'Message'}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="py-8 text-center">{zh ? '加载中...' : 'Loading...'}</TableCell>
              </TableRow>
            ) : filteredHistory.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="py-8 text-center">{t.common.noData}</TableCell>
              </TableRow>
            ) : (
              filteredHistory.map((record) => (
                <TableRow key={record.id} style={{ borderColor: theme.colors.border }}>
                  <TableCell>{format(new Date(record.login_at), 'yyyy-MM-dd HH:mm:ss', { locale })}</TableCell>
                  <TableCell>{record.ip}</TableCell>
                  <TableCell>{record.location}</TableCell>
                  <TableCell>{record.browser}</TableCell>
                  <TableCell>{record.os}</TableCell>
                  <TableCell>
                    <Badge variant={record.status === 'success' ? 'default' : 'destructive'}>
                      {record.status === 'success' ? (zh ? '成功' : 'Success') : zh ? '失败' : 'Failed'}
                    </Badge>
                  </TableCell>
                  <TableCell>{record.message}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {data && data.pagination.total > pageSize && (
        <div className="flex items-center justify-center gap-2">
          <Button variant="outline" onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={page <= 1 || loading}>
            {zh ? '上一页' : 'Previous'}
          </Button>
          <span className="text-sm" style={{ color: theme.colors.textSecondary }}>
            {zh ? '第' : 'Page'} {page} {zh ? '页，共' : ' of'} {totalPages} {zh ? '页' : 'pages'}
          </span>
          <Button variant="outline" onClick={() => setPage((current) => Math.min(totalPages, current + 1))} disabled={page >= totalPages || loading}>
            {zh ? '下一页' : 'Next'}
          </Button>
        </div>
      )}

      <div className="rounded-lg border-l-4 p-4" style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.warning }}>
        <div className="font-medium" style={{ color: theme.colors.text }}>{zh ? '安全提示' : 'Security Tips'}</div>
        <p className="mt-2 text-sm" style={{ color: theme.colors.textSecondary }}>
          {zh ? '如果发现异常登录，请及时修改密码并终止相关会话。' : 'If you notice suspicious activity, change your password and revoke related sessions immediately.'}
        </p>
      </div>
    </div>
  );
}
