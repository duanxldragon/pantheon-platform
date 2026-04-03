/**
 * 组件展示页面 - UI组件库预览
 * 展示所有可用的增强型UI组件
 */

import { useState } from 'react';
import {
  Server,
  Users,
  Activity,
  TrendingUp,
  Plus,
  Download,
  Settings,
  Bell,
} from 'lucide-react';

// 导入所有组件
import {
  PageHeader,
  StatCard,
  SimpleStatCard,
  EmptyState,
  LoadingState,
  Alert,
  Badge,
  CountBadge,
  Tabs,
  Timeline,
  Progress,
  CircleProgress,
  Tooltip,
  Dropdown,
  SelectDropdown,
  ThemedButton,
  ThemedCard,
  ThemedSearchBar,
} from '../components';

import type { Tab, DropdownItem } from '../components';

export function ComponentShowcase() {
  const [searchValue, setSearchValue] = useState('');
  const [activeTab, setActiveTab] = useState('components');
  const [selectedStatus, setSelectedStatus] = useState('all');

  // Tab配置
  const tabs: Tab[] = [
    {
      key: 'components',
      label: '组件展示',
      icon: <Settings className="w-4 h-4" />,
      content: <ComponentsDemo />,
    },
    {
      key: 'stats',
      label: '数据统计',
      icon: <Activity className="w-4 h-4" />,
      badge: 3,
      content: <StatsDemo />,
    },
    {
      key: 'feedback',
      label: '反馈组件',
      icon: <Bell className="w-4 h-4" />,
      content: <FeedbackDemo />,
    },
  ];

  // 时间轴数据
  // 下拉菜单数据
  const dropdownItems: DropdownItem[] = [
    { key: 'edit', label: '编辑', icon: <Settings className="w-4 h-4" /> },
    { key: 'download', label: '下载', icon: <Download className="w-4 h-4" /> },
    { key: 'divider', label: '', divider: true },
    { key: 'delete', label: '删除', danger: true },
  ];

  const statusOptions: DropdownItem[] = [
    { key: 'all', label: '全部状态', icon: <Activity className="w-4 h-4" /> },
    { key: 'online', label: '在线', icon: <Activity className="w-4 h-4" /> },
    { key: 'offline', label: '离线', icon: <Activity className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* 页面头部 */}
        <PageHeader
          title="UI组件库展示"
          description="统一的现代化UI组件系统，支持主题切换和国际化"
          icon={<Settings className="w-6 h-6 text-white" />}
          breadcrumbs={[
            { label: '首页', onClick: () => console.log('首页') },
            { label: '文档' },
            { label: '组件展示' },
          ]}
          actions={
            <>
              <ThemedButton variant="secondary">
                <Download className="w-4 h-4" />
                导出文档
              </ThemedButton>
              <ThemedButton>
                <Plus className="w-4 h-4" />
                添加组件
              </ThemedButton>
            </>
          }
        />

        {/* 搜索和筛选 */}
        <div className="flex gap-4">
          <ThemedSearchBar
            value={searchValue}
            onChange={setSearchValue}
            placeholder="搜索组件..."
            className="flex-1"
          />
          <SelectDropdown
            items={statusOptions}
            value={selectedStatus}
            onChange={setSelectedStatus}
            className="w-48"
          />
          <Dropdown items={dropdownItems} />
        </div>

        {/* 警告提示 */}
        <Alert
          type="info"
          title="开发提示"
          message="本页面展示了所有可用的UI组件，您可以直接复制使用。所有组件都支持主题切换和响应式布局。"
          closable
        />

        {/* 标签页 */}
        <Tabs
          tabs={tabs}
          activeKey={activeTab}
          onChange={setActiveTab}
          type="line"
        />
      </div>
    </div>
  );
}

// 组件展示部分
function ComponentsDemo() {
  return (
    <div className="space-y-8">
      {/* 徽章展示 */}
      <ThemedCard className="p-6">
        <h3 className="text-lg font-semibold mb-4">徽章 (Badge)</h3>
        <div className="flex flex-wrap gap-3">
          <Badge variant="success">成功</Badge>
          <Badge variant="warning">警告</Badge>
          <Badge variant="error">错误</Badge>
          <Badge variant="info">信息</Badge>
          <Badge variant="default" dot>默认</Badge>
          <Badge variant="outline" closable onClose={() => console.log('关闭')}>
            可关闭
          </Badge>
          <div className="flex items-center gap-2">
            <span>消息</span>
            <CountBadge count={99} variant="error" />
          </div>
        </div>
      </ThemedCard>

      {/* 工具提示 */}
      <ThemedCard className="p-6">
        <h3 className="text-lg font-semibold mb-4">工具提示 (Tooltip)</h3>
        <div className="flex gap-4">
          <Tooltip content="这是顶部提示" placement="top">
            <ThemedButton variant="secondary">顶部</ThemedButton>
          </Tooltip>
          <Tooltip content="这是底部提示" placement="bottom">
            <ThemedButton variant="secondary">底部</ThemedButton>
          </Tooltip>
          <Tooltip content="这是左侧提示" placement="left">
            <ThemedButton variant="secondary">左侧</ThemedButton>
          </Tooltip>
          <Tooltip content="这是右侧提示" placement="right">
            <ThemedButton variant="secondary">右侧</ThemedButton>
          </Tooltip>
        </div>
      </ThemedCard>

      {/* 空状态 */}
      <ThemedCard className="p-6">
        <h3 className="text-lg font-semibold mb-4">空状态 (EmptyState)</h3>
        <EmptyState
          type="search"
          action={{
            label: '清除筛选',
            onClick: () => console.log('清除'),
          }}
        />
      </ThemedCard>
    </div>
  );
}

// 数据统计展示
function StatsDemo() {
  return (
    <div className="space-y-8">
      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="总用户数"
          value="12,345"
          icon={Users}
          iconColor="primary"
          trend={{
            value: '+12.5%',
            direction: 'up',
            label: '较上月',
          }}
        />
        <StatCard
          title="在线主机"
          value="856"
          icon={Server}
          iconColor="success"
          trend={{
            value: '+5.2%',
            direction: 'up',
            label: '较上月',
          }}
        />
        <StatCard
          title="活跃集群"
          value="42"
          icon={Activity}
          iconColor="info"
          description="运行中的K8s集群"
        />
        <StatCard
          title="系统性能"
          value="98.5%"
          icon={TrendingUp}
          iconColor="warning"
          trend={{
            value: '-0.3%',
            direction: 'down',
            label: '较昨日',
          }}
        />
      </div>

      {/* 简化统计卡片 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <SimpleStatCard label="CPU使用率" value="45%" />
        <SimpleStatCard label="内存使用" value="8.2GB" />
        <SimpleStatCard label="磁盘空间" value="256GB" />
        <SimpleStatCard label="网络流量" value="1.2TB" />
      </div>

      {/* 时间轴 */}
      <ThemedCard className="p-6">
        <h3 className="text-lg font-semibold mb-6">项目进展</h3>
        <Timeline
          items={[
            {
              id: '1',
              title: '创建项目',
              description: '系统初始化完成',
              time: '2024-01-08 10:00',
              status: 'success',
            },
            {
              id: '2',
              title: '配置环境',
              description: '开发环境配置中',
              time: '2024-01-08 11:30',
              status: 'processing',
            },
            {
              id: '3',
              title: '部署上线',
              description: '等待部署',
              time: '待定',
              status: 'pending',
            },
          ]}
        />
      </ThemedCard>
    </div>
  );
}

// 反馈组件展示
function FeedbackDemo() {
  const [progress, setProgress] = useState(65);

  return (
    <div className="space-y-8">
      {/* 警告提示 */}
      <div className="space-y-4">
        <Alert type="success" message="操作成功！数据已保存。" closable />
        <Alert
          type="warning"
          title="注意"
          message="您有3个待处理的任务需要完成。"
          action={{ label: '立即处理', onClick: () => console.log('处理') }}
        />
        <Alert type="error" message="操作失败，请稍后重试。" />
        <Alert type="info" message="系统将在今晚23:00进行维护，预计持续30分钟。" />
      </div>

      {/* 进度条 */}
      <ThemedCard className="p-6">
        <h3 className="text-lg font-semibold mb-6">进度条</h3>
        <div className="space-y-6">
          <div>
            <p className="text-sm text-muted-foreground mb-2">普通进度</p>
            <Progress percent={progress} status="normal" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-2">成功状态</p>
            <Progress percent={100} status="success" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-2">警告状态</p>
            <Progress percent={75} status="warning" size="lg" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-2">错误状态</p>
            <Progress percent={30} status="error" size="sm" />
          </div>

          {/* 控制按钮 */}
          <div className="flex gap-3">
            <ThemedButton
              size="sm"
              variant="secondary"
              onClick={() => setProgress(Math.max(0, progress - 10))}
            >
              -10%
            </ThemedButton>
            <ThemedButton
              size="sm"
              variant="secondary"
              onClick={() => setProgress(Math.min(100, progress + 10))}
            >
              +10%
            </ThemedButton>
          </div>
        </div>
      </ThemedCard>

      {/* 圆形进度条 */}
      <ThemedCard className="p-6">
        <h3 className="text-lg font-semibold mb-6">圆形进度条</h3>
        <div className="flex justify-around">
          <CircleProgress percent={75} status="success" />
          <CircleProgress percent={50} status="warning" size={100} strokeWidth={6} />
          <CircleProgress percent={25} status="error" size={80} strokeWidth={4} />
        </div>
      </ThemedCard>

      {/* 加载状态 */}
      <ThemedCard className="p-6">
        <h3 className="text-lg font-semibold mb-6">加载状态</h3>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <p className="text-sm text-muted-foreground mb-4">Spinner</p>
            <LoadingState type="spinner" size="md" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-4">Dots</p>
            <LoadingState type="dots" size="md" />
          </div>
        </div>
      </ThemedCard>
    </div>
  );
}

export default ComponentShowcase;
