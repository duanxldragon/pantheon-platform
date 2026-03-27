import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Activity, AlertCircle, CheckCircle, Clock, Terminal } from 'lucide-react';
import { Button } from './ui/button';
import { useLanguageStore } from '../stores/languageStore';

export function Operations() {
  const { t } = useLanguageStore();
  
  const logs = [
    {
      time: '2024-11-21 14:32:15',
      level: 'info',
      service: 'nginx',
      message: 'Service started successfully on port 80',
    },
    {
      time: '2024-11-21 14:30:42',
      level: 'warning',
      service: 'mysql',
      message: 'High connection count detected: 450/500',
    },
    {
      time: '2024-11-21 14:28:33',
      level: 'error',
      service: 'redis',
      message: 'Connection timeout to redis-prod-01',
    },
    {
      time: '2024-11-21 14:25:18',
      level: 'info',
      service: 'k8s',
      message: 'Pod web-app-5d7c8b9f4-xk2m9 scheduled successfully',
    },
  ];

  const tasks = [
    {
      id: 1,
      name: t.modules.operations.tasks.batchUpdateHosts,
      status: 'running',
      progress: '12/20',
      startTime: '14:00:00',
    },
    {
      id: 2,
      name: t.modules.operations.tasks.databaseBackup,
      status: 'completed',
      progress: '5/5',
      startTime: '02:00:00',
    },
    {
      id: 3,
      name: t.modules.operations.tasks.cleanTempFiles,
      status: 'scheduled',
      progress: '0/30',
      startTime: '20:00:00',
    },
  ];

  const metrics = [
    {
      name: t.modules.operations.metrics.cpuAvgUsage,
      value: '58%',
      status: 'normal',
      change: '+5%',
    },
    {
      name: t.modules.operations.metrics.memoryAvgUsage,
      value: '64%',
      status: 'normal',
      change: '+2%',
    },
    {
      name: t.modules.operations.metrics.diskUsage,
      value: '72%',
      status: 'warning',
      change: '+8%',
    },
    {
      name: t.modules.operations.metrics.networkTraffic,
      value: '2.5GB/s',
      status: 'normal',
      change: '+12%',
    },
  ];

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      case 'warning':
        return <AlertCircle className="w-4 h-4 text-yellow-600" />;
      default:
        return <CheckCircle className="w-4 h-4 text-blue-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'running':
        return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">{t.modules.operations.status.running}</Badge>;
      case 'completed':
        return <Badge className="bg-green-100 text-green-700 hover:bg-green-100">{t.modules.operations.status.completed}</Badge>;
      case 'scheduled':
        return <Badge className="bg-gray-100 text-gray-700 hover:bg-gray-100">{t.modules.operations.status.scheduled}</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2>{t.modules.operations.title}</h2>
        <p className="text-gray-500 mt-1">{t.modules.operations.description}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric) => (
          <Card key={metric.name} className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500">{metric.name}</p>
                <p className="mt-2">{metric.value}</p>
                <p className={`text-sm mt-1 ${
                  metric.status === 'warning' ? 'text-yellow-600' : 'text-green-600'
                }`}>
                  {metric.change}
                </p>
              </div>
              <Activity className={`w-5 h-5 ${
                metric.status === 'warning' ? 'text-yellow-600' : 'text-blue-600'
              }`} />
            </div>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="logs" className="space-y-6">
        <TabsList>
          <TabsTrigger value="logs">{t.modules.operations.systemLogs}</TabsTrigger>
          <TabsTrigger value="tasks">{t.modules.operations.opsTasks}</TabsTrigger>
          <TabsTrigger value="alerts">{t.modules.operations.alertCenter}</TabsTrigger>
        </TabsList>

        <TabsContent value="logs" className="space-y-4">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3>{t.modules.operations.realTimeLogs}</h3>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">{t.modules.operations.filter}</Button>
                <Button variant="outline" size="sm">{t.modules.operations.export}</Button>
              </div>
            </div>

            <div className="space-y-3">
              {logs.map((log, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  {getLevelIcon(log.level)}
                  <div className="flex-1 font-mono text-sm">
                    <div className="flex items-center gap-3 mb-1">
                      <span className="text-gray-500">{log.time}</span>
                      <Badge variant="outline" className="text-xs">{log.service}</Badge>
                      <Badge
                        className={`text-xs ${
                          log.level === 'error'
                            ? 'bg-red-100 text-red-700'
                            : log.level === 'warning'
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-blue-100 text-blue-700'
                        }`}
                      >
                        {log.level.toUpperCase()}
                      </Badge>
                    </div>
                    <p className="text-gray-700">{log.message}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 pt-4 border-t flex items-center justify-center">
              <Button variant="outline" size="sm">{t.modules.operations.loadMoreLogs}</Button>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="tasks" className="space-y-4">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3>{t.modules.operations.opsTaskList}</h3>
              <Button size="sm">{t.modules.operations.createTask}</Button>
            </div>

            <div className="space-y-4">
              {tasks.map((task) => (
                <div key={task.id} className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-start gap-3">
                      <Terminal className="w-5 h-5 text-gray-400 mt-1" />
                      <div>
                        <p>{task.name}</p>
                        <div className="flex items-center gap-3 mt-2">
                          <div className="flex items-center gap-1 text-sm text-gray-500">
                            <Clock className="w-4 h-4" />
                            {task.startTime}
                          </div>
                          <span className="text-sm text-gray-500">{t.modules.operations.progress}: {task.progress}</span>
                        </div>
                      </div>
                    </div>
                    {getStatusBadge(task.status)}
                  </div>
                  {task.status === 'running' && (
                    <div className="mt-3">
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-600 transition-all"
                          style={{ width: '60%' }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3>{t.modules.operations.alertRecords}</h3>
              <Button variant="outline" size="sm">{t.modules.operations.alertSettings}</Button>
            </div>

            <div className="space-y-4">
              {[
                {
                  title: t.modules.operations.alerts.cpuAlert,
                  host: 'prod-server-03',
                  message: 'CPU使用率持续超过80%，已持续15分钟',
                  time: '2026-03-03 14:20:00',
                  level: 'warning',
                },
                {
                  title: t.modules.operations.alerts.nodeUnavailable,
                  host: 'k8s-prod-02',
                  message: 'K8s节点连接失败，服务可能受到影响',
                  time: '2026-03-03 14:00:00',
                  level: 'error',
                },
                {
                  title: t.modules.operations.alerts.diskSpaceAlert,
                  host: 'prod-server-01',
                  message: '磁盘使用率达到75%，建议清理空间',
                  time: '2026-03-03 13:30:00',
                  level: 'warning',
                },
              ].map((alert, index) => (
                <div
                  key={index}
                  className="p-4 border-l-4 bg-white rounded-lg"
                  style={{
                    borderLeftColor: alert.level === 'error' ? '#ef4444' : '#f59e0b',
                  }}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-start gap-3">
                      <AlertCircle
                        className={`w-5 h-5 mt-0.5 ${
                          alert.level === 'error' ? 'text-red-600' : 'text-yellow-600'
                        }`}
                      />
                      <div>
                        <p>{alert.title}</p>
                        <p className="text-sm text-gray-500 mt-1">{t.modules.operations.host}: {alert.host}</p>
                      </div>
                    </div>
                    <span className="text-xs text-gray-500">{alert.time}</span>
                  </div>
                  <p className="text-sm text-gray-600 ml-8">{alert.message}</p>
                  <div className="flex gap-2 mt-3 ml-8">
                    <Button size="sm" variant="outline">{t.modules.operations.viewDetails}</Button>
                    <Button size="sm" variant="outline">{t.modules.operations.markAsRead}</Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}