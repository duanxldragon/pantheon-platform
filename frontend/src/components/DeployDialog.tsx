import { Button } from './ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { Textarea } from './ui/textarea';
import { Checkbox } from './ui/checkbox';
import { getDialogClassName } from '../shared/constants/dialogSizes';

interface DeployDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DeployDialog({ open, onOpenChange }: DeployDialogProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={getDialogClassName('2xl')}>
        <DialogHeader>
          <DialogTitle>部署组件</DialogTitle>
          <DialogDescription>
            选择组件和目标环境进行部署
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <Label htmlFor="component">选择组件 *</Label>
              <Select required>
                <SelectTrigger id="component">
                  <SelectValue placeholder="选择要部署的组件" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="nginx">Nginx 1.25.3</SelectItem>
                  <SelectItem value="mysql">MySQL 8.0.35</SelectItem>
                  <SelectItem value="redis">Redis 7.2.3</SelectItem>
                  <SelectItem value="docker">Docker 24.0.7</SelectItem>
                  <SelectItem value="prometheus">Prometheus 2.47.2</SelectItem>
                  <SelectItem value="vault">Vault 1.15.2</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="deploy-type">部署类型 *</Label>
              <Select required defaultValue="host">
                <SelectTrigger id="deploy-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="host">主机部署</SelectItem>
                  <SelectItem value="k8s">K8s部署</SelectItem>
                  <SelectItem value="docker">Docker部署</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="target">部署目标 *</Label>
              <Select required>
                <SelectTrigger id="target">
                  <SelectValue placeholder="选择部署目标" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="prod-server-01">prod-server-01</SelectItem>
                  <SelectItem value="prod-server-02">prod-server-02</SelectItem>
                  <SelectItem value="k8s-prod-01">k8s-prod-01</SelectItem>
                  <SelectItem value="k8s-test-01">k8s-test-01</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="install-path">安装路径</Label>
                <Input
                  id="install-path"
                  placeholder="/opt/nginx"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="port">服务端口</Label>
                <Input
                  id="port"
                  placeholder="8080"
                  type="number"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="config">配置参数</Label>
              <Textarea
                id="config"
                placeholder="添加自定义配置参数（JSON格式）..."
                rows={4}
              />
            </div>

            <div className="space-y-3">
              <Label>部署选项</Label>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox id="auto-start" defaultChecked />
                  <label
                    htmlFor="auto-start"
                    className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    自动启动服务
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="backup" defaultChecked />
                  <label
                    htmlFor="backup"
                    className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    部署前备份
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="health-check" defaultChecked />
                  <label
                    htmlFor="health-check"
                    className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    启用健康检查
                  </label>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="deploy-notes">部署说明</Label>
              <Textarea
                id="deploy-notes"
                placeholder="记录本次部署的相关说明..."
                rows={2}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              取消
            </Button>
            <Button type="submit">开始部署</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}