import { useEffect, useMemo, useState } from 'react';
import { format } from 'date-fns';
import { useCallback } from 'react';
import { enUS, zhCN } from 'date-fns/locale';
import { Badge } from '../../../../../components/ui/badge';
import { Button } from '../../../../../components/ui/button';
import { Input } from '../../../../../components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../../../components/ui/table';
import { systemNotification } from '../../../../../shared/utils/notification';
import { useLanguageStore } from '../../../../../stores/language_store';
import { useThemeStore } from '../../../../../stores/theme_store';
import { authApi, type LoginHistoryItem, type LoginHistoryResponse } from '../../../api/auth_api';
import { useProfilePreferenceSettings } from '../../hooks/use_profile_preference_settings';

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
  const [data, setData] = useState<LoginHistoryResponse | null>(null);
  const [debouncedKeyword, setDebouncedKeyword] = useState('');
  const [searchResults, setSearchResults] = useState<LoginHistoryItem[] | null>(null);

  const loadLoginHistoryPage = useCallback(async () => {
    setLoading(true);
    try {
      const response = await authApi.getLoginHistory({ page, pageSize });
      setData(response.data);
      setSearchResults(null);
    } catch (error: unknown) {
      systemNotification.error(
        error instanceof Error
          ? error.message
          : zh
            ? '加载登录历史失败'
            : 'Failed to load login history',
      );
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, zh]);

  const loadSearchResults = useCallback(async () => {
    const normalizedKeyword = debouncedKeyword.trim().toLowerCase();
    if (!normalizedKeyword) {
      setSearchResults(null);
      return;
    }

    setLoading(true);
    try {
      const searchPageSize = 100;
      const firstResponse = await authApi.getLoginHistory({ page: 1, pageSize: searchPageSize });
      const total = firstResponse.data.pagination?.total || firstResponse.data.items.length;
      const totalPages = Math.max(1, Math.ceil(total / searchPageSize));
      const allItems = [...(firstResponse.data.items || [])];

      for (let currentPage = 2; currentPage <= totalPages; currentPage += 1) {
        const response = await authApi.getLoginHistory({ page: currentPage, pageSize: searchPageSize });
        allItems.push(...(response.data.items || []));
      }

      const filteredItems = allItems.filter((record) =>
        [record.ip, record.location, record.browser, record.os, record.message]
          .join(' ')
          .toLowerCase()
          .includes(normalizedKeyword),
      );

      setSearchResults(filteredItems);
    } catch (error: unknown) {
      systemNotification.error(
        error instanceof Error
          ? error.message
          : zh
            ? '搜索登录历史失败'
            : 'Failed to search login history',
      );
    } finally {
      setLoading(false);
    }
  }, [debouncedKeyword, zh]);

  const loadLoginHistory = useCallback(async () => {
    if (debouncedKeyword.trim()) {
      await loadSearchResults();
      return;
    }

    await loadLoginHistoryPage();
  }, [debouncedKeyword, loadLoginHistoryPage, loadSearchResults]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedKeyword(keyword);
    }, 300);

    return () => window.clearTimeout(timer);
  }, [keyword]);

  useEffect(() => {
    const nextPageSize = Number(preferenceSettings.pageSize) || 20;
    setPageSize(nextPageSize);
    setPage(1);
  }, [preferenceSettings.pageSize]);

  useEffect(() => {
    void loadLoginHistory();
  }, [loadLoginHistory]);

  useEffect(() => {
    if (!preferenceSettings.autoRefresh) {
      return;
    }

    const timer = window.setInterval(() => {
      void loadLoginHistory();
    }, 30000);

    return () => window.clearInterval(timer);
  }, [loadLoginHistory, preferenceSettings.autoRefresh]);

  const filteredHistory = useMemo(() => {
    if (searchResults) {
      return searchResults;
    }
    return data?.items || [];
  }, [data?.items, searchResults]);

  const stats = useMemo(() => {
    const items = filteredHistory;
    return {
      total: debouncedKeyword.trim() ? items.length : data?.pagination?.total || 0,
      success: items.filter((item) => item.status === 'success').length,
      failed: items.filter((item) => item.status === 'failure').length,
    };
  }, [data?.pagination?.total, debouncedKeyword, filteredHistory]);

  const pagedHistory = useMemo(() => {
    if (!debouncedKeyword.trim()) {
      return filteredHistory;
    }

    const start = (page - 1) * pageSize;
    return filteredHistory.slice(start, start + pageSize);
  }, [debouncedKeyword, filteredHistory, page, pageSize]);

  const totalItems = debouncedKeyword.trim() ? filteredHistory.length : data?.pagination?.total || 0;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  useEffect(() => {
    if (!totalItems) {
      return;
    }

    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalItems, totalPages]);

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
              pagedHistory.map((record) => (
                <TableRow key={record.id} style={{ borderColor: theme.colors.border }}>
                  <TableCell>{format(new Date(record.loginAt), 'yyyy-MM-dd HH:mm:ss', { locale })}</TableCell>
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

      {debouncedKeyword.trim() ? (
        <div className="rounded-lg border-l-4 p-4" style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.primary }}>
          <div className="font-medium" style={{ color: theme.colors.text }}>
            {zh ? '搜索范围' : 'Search Scope'}
          </div>
          <p className="mt-2 text-sm" style={{ color: theme.colors.textSecondary }}>
            {zh
              ? `当前关键字会跨整个登录历史执行前端聚合搜索，已命中 ${filteredHistory.length} 条记录。`
              : `The current keyword runs an aggregated search across the full login history and matched ${filteredHistory.length} record(s).`}
          </p>
        </div>
      ) : null}

      {totalItems > pageSize && (
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




