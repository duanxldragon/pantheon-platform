import { useState } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Plus, Search, Rocket, Database, Globe, Lock, Activity } from 'lucide-react';
import { DeployDialog } from './DeployDialog';
import { Progress } from './ui/progress';
import { useLanguageStore } from '../stores/languageStore';

export function ComponentDeploy() {
  const [isDeployDialogOpen, setIsDeployDialogOpen] = useState(false);
  const { t } = useLanguageStore();

  const components = [
    {
      name: t.modules.deploy.components.nginx.name,
      icon: Globe,
      description: t.modules.deploy.components.nginx.description,
      version: '1.25.3',
      category: t.modules.deploy.categories.basic,
      color: 'green',
    },
    {
      name: t.modules.deploy.components.mysql.name,
      icon: Database,
      description: t.modules.deploy.components.mysql.description,
      version: '8.0.35',
      category: t.modules.deploy.categories.database,
      color: 'blue',
    },
    {
      name: t.modules.deploy.components.redis.name,
      icon: Database,
      description: t.modules.deploy.components.redis.description,
      version: '7.2.3',
      category: t.modules.deploy.categories.database,
      color: 'red',
    },
    {
      name: t.modules.deploy.components.docker.name,
      icon: Rocket,
      description: t.modules.deploy.components.docker.description,
      version: '24.0.7',
      category: t.modules.deploy.categories.container,
      color: 'blue',
    },
    {
      name: t.modules.deploy.components.prometheus.name,
      icon: Activity,
      description: t.modules.deploy.components.prometheus.description,
      version: '2.47.2',
      category: t.modules.deploy.categories.monitor,
      color: 'orange',
    },
    {
      name: t.modules.deploy.components.vault.name,
      icon: Lock,
      description: t.modules.deploy.components.vault.description,
      version: '1.15.2',
      category: t.modules.deploy.categories.security,
      color: 'yellow',
    },
  ];

  const deployments = [
    {
      id: 1,
      component: 'MySQL 8.0.35',
      target: 'prod-server-01',
      status: 'success',
      progress: 100,
      time: `2 ${t.modules.deploy.time.minutesAgo}`,
    },
    {
      id: 2,
      component: 'Nginx 1.25.3',
      target: 'k8s-prod-01',
      status: 'running',
      progress: 65,
      time: t.modules.deploy.time.inProgress,
    },
    {
      id: 3,
      component: 'Redis 7.2.3',
      target: 'prod-server-02',
      status: 'success',
      progress: 100,
      time: `15 ${t.modules.deploy.time.minutesAgo}`,
    },
    {
      id: 4,
      component: 'Prometheus 2.47.2',
      target: 'k8s-test-01',
      status: 'failed',
      progress: 45,
      time: `1 ${t.modules.deploy.time.hoursAgo}`,
    },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return <Badge className="bg-green-100 text-green-700 hover:bg-green-100">{t.modules.deploy.status.success}</Badge>;
      case 'running':
        return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">{t.modules.deploy.status.running}</Badge>;
      case 'failed':
        return <Badge className="bg-red-100 text-red-700 hover:bg-red-100">{t.modules.deploy.status.failed}</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2>{t.modules.deploy.title}</h2>
          <p className="text-gray-500 mt-1">{t.modules.deploy.description}</p>
        </div>
        <Button onClick={() => setIsDeployDialogOpen(true)} className="gap-2">
          <Rocket className="w-4 h-4" />
          {t.modules.deploy.startDeploy}
        </Button>
      </div>

      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3>{t.modules.deploy.availableComponents}</h3>
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input placeholder={t.modules.deploy.searchComponents} className="pl-10" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {components.map((component) => {
            const Icon = component.icon;
            return (
              <Card key={component.name} className="p-4 hover:shadow-md transition-shadow cursor-pointer">
                <div className="flex items-start gap-4">
                  <div className={`p-3 bg-${component.color}-50 rounded-lg`}>
                    <Icon className={`w-6 h-6 text-${component.color}-600`} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p>{component.name}</p>
                      <Badge variant="outline" className="text-xs">{component.version}</Badge>
                    </div>
                    <p className="text-sm text-gray-500 mb-2">{component.description}</p>
                    <Badge className="text-xs">{component.category}</Badge>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="mb-6">{t.modules.deploy.deployHistory}</h3>
        <div className="space-y-4">
          {deployments.map((deployment) => (
            <div key={deployment.id} className="p-4 border border-gray-200 rounded-lg">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p>{deployment.component}</p>
                  <p className="text-sm text-gray-500 mt-1">{t.modules.deploy.target}: {deployment.target}</p>
                </div>
                <div className="text-right">
                  {getStatusBadge(deployment.status)}
                  <p className="text-xs text-gray-500 mt-1">{deployment.time}</p>
                </div>
              </div>
              {deployment.status === 'running' && (
                <div className="space-y-2">
                  <Progress value={deployment.progress} className="h-2" />
                  <p className="text-xs text-gray-500">{deployment.progress}% {t.modules.deploy.completed}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </Card>

      <DeployDialog open={isDeployDialogOpen} onOpenChange={setIsDeployDialogOpen} />
    </div>
  );
}