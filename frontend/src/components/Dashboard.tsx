import { Card } from './ui/card';
import { Server, Box, Activity, AlertCircle, TrendingUp, TrendingDown } from 'lucide-react';
import { useLanguageStore } from '../stores/languageStore';

export function Dashboard() {
  const { t } = useLanguageStore();
  
  const stats = [
    {
      title: t.modules.dashboard.totalHosts,
      value: '48',
      change: '+3',
      icon: Server,
      color: 'blue',
      trend: 'up',
    },
    {
      title: t.modules.dashboard.k8sClusters,
      value: '12',
      change: '+1',
      icon: Box,
      color: 'green',
      trend: 'up',
    },
    {
      title: t.modules.dashboard.runningServices,
      value: '156',
      change: '+12',
      icon: Activity,
      color: 'purple',
      trend: 'up',
    },
    {
      title: t.modules.dashboard.alertCount,
      value: '3',
      change: '-2',
      icon: AlertCircle,
      color: 'red',
      trend: 'down',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-gray-900">{t.modules.dashboard.title}</h2>
          <p className="text-gray-500 mt-1">{t.modules.dashboard.description}</p>
        </div>
        <div className="text-sm text-gray-500">
          {t.modules.dashboard.lastUpdate}: {new Date().toLocaleTimeString()}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          const TrendIcon = stat.trend === 'up' ? TrendingUp : TrendingDown;
          return (
            <Card key={stat.title} className="p-6 hover:shadow-lg transition-shadow duration-200 border-l-4" style={{ borderLeftColor: `var(--${stat.color}-600, #3b82f6)` }}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-gray-500 text-sm">{stat.title}</p>
                  <p className="mt-2 text-gray-900">{stat.value}</p>
                  <div className="flex items-center gap-1 mt-2">
                    <TrendIcon className={`w-4 h-4 ${stat.trend === 'up' ? 'text-green-600' : 'text-red-600'}`} />
                    <p className={`text-sm ${stat.trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                      {stat.change}
                    </p>
                    <span className="text-xs text-gray-500 ml-1">{t.modules.dashboard.comparedToYesterday}</span>
                  </div>
                </div>
                <div className={`p-3 rounded-xl bg-${stat.color}-50 shadow-sm`}>
                  <Icon className={`w-6 h-6 text-${stat.color}-600`} />
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6 hover:shadow-lg transition-shadow duration-200">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-gray-900">{t.modules.dashboard.recentActivities}</h3>
            <span className="text-xs text-blue-600 hover:text-blue-700 cursor-pointer">{t.modules.dashboard.viewAll}</span>
          </div>
          <div className="space-y-4">
            {[
              { action: t.modules.dashboard.activities.addHost, detail: 'prod-server-05', time: `5${t.modules.deploy.time.minutesAgo}`, color: 'blue' },
              { action: t.modules.dashboard.activities.deployApp, detail: 'web-app-v2.3', time: `1${t.modules.deploy.time.hoursAgo}`, color: 'green' },
              { action: t.modules.dashboard.activities.scaleCluster, detail: 'k8s-prod-01', time: `3${t.modules.deploy.time.hoursAgo}`, color: 'purple' },
              { action: t.modules.dashboard.activities.systemUpdate, detail: '20 hosts', time: `5${t.modules.deploy.time.hoursAgo}`, color: 'orange' },
            ].map((activity, index) => (
              <div key={index} className="flex items-start gap-3 pb-4 border-b last:border-0 hover:bg-gray-50 -mx-2 px-2 py-2 rounded transition-colors">
                <div className={`w-2 h-2 bg-${activity.color}-600 rounded-full mt-2 shadow-sm`}></div>
                <div className="flex-1">
                  <p className="text-sm text-gray-900">{activity.action}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{activity.detail}</p>
                </div>
                <p className="text-xs text-gray-400">{activity.time}</p>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6 hover:shadow-lg transition-shadow duration-200">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-gray-900">{t.modules.dashboard.systemAlerts}</h3>
            <span className="text-xs text-blue-600 hover:text-blue-700 cursor-pointer">{t.modules.dashboard.viewAll}</span>
          </div>
          <div className="space-y-4">
            {[
              { level: 'warning', message: `prod-server-03 ${t.modules.dashboard.alerts.cpuWarning}`, time: `10${t.modules.deploy.time.minutesAgo}` },
              { level: 'error', message: `k8s-prod-02 ${t.modules.dashboard.alerts.nodeUnavailable}`, time: `30${t.modules.deploy.time.minutesAgo}` },
              { level: 'info', message: t.modules.dashboard.alerts.storageWarning, time: `1${t.modules.deploy.time.hoursAgo}` },
            ].map((alert, index) => (
              <div key={index} className="flex items-start gap-3 pb-4 border-b last:border-0 hover:bg-gray-50 -mx-2 px-2 py-2 rounded transition-colors">
                <div className={`p-2 rounded-lg ${
                  alert.level === 'error' ? 'bg-red-50' :
                  alert.level === 'warning' ? 'bg-yellow-50' :
                  'bg-blue-50'
                }`}>
                  <AlertCircle className={`w-5 h-5 ${
                    alert.level === 'error' ? 'text-red-600' :
                    alert.level === 'warning' ? 'text-yellow-600' :
                    'text-blue-600'
                  }`} />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-900">{alert.message}</p>
                  <p className="text-xs text-gray-500 mt-1">{alert.time}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}