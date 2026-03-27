export const OS_OPTIONS = [
  { value: 'ubuntu-22', label: 'Ubuntu 22.04' },
  { value: 'ubuntu-20', label: 'Ubuntu 20.04' },
  { value: 'centos-7', label: 'CentOS 7.9' },
  { value: 'centos-8', label: 'CentOS 8' },
  { value: 'debian-11', label: 'Debian 11' },
];

export const LOCATION_OPTIONS = [
  { value: 'beijing', label: '北京机房' },
  { value: 'shanghai', label: '上海机房' },
  { value: 'shenzhen', label: '深圳机房' },
  { value: 'guangzhou', label: '广州机房' },
];

export const ENV_OPTIONS = [
  { value: 'prod', label: '生产环境' },
  { value: 'test', label: '测试环境' },
  { value: 'dev', label: '开发环境' },
];

export const K8S_VERSION_OPTIONS = [
  { value: 'v1.28.2', label: 'v1.28.2' },
  { value: 'v1.27.5', label: 'v1.27.5' },
  { value: 'v1.26.8', label: 'v1.26.8' },
  { value: 'v1.25.12', label: 'v1.25.12' },
];

export const AUTH_METHOD_OPTIONS = [
  { value: 'password', label: '密码认证' },
  { value: 'ssh-key', label: 'SSH密钥' },
];

export const K8S_AUTH_TYPE_OPTIONS = [
  { value: 'token', label: 'Bearer Token' },
  { value: 'kubeconfig', label: 'KubeConfig' },
  { value: 'cert', label: '证书认证' },
];

export const DEPLOY_TYPE_OPTIONS = [
  { value: 'host', label: '主机部署' },
  { value: 'k8s', label: 'K8s部署' },
  { value: 'docker', label: 'Docker部署' },
];

export const COMPONENT_OPTIONS = [
  { value: 'nginx', label: 'Nginx 1.25.3' },
  { value: 'mysql', label: 'MySQL 8.0.35' },
  { value: 'redis', label: 'Redis 7.2.3' },
  { value: 'docker', label: 'Docker 24.0.7' },
  { value: 'prometheus', label: 'Prometheus 2.47.2' },
  { value: 'vault', label: 'Vault 1.15.2' },
];
