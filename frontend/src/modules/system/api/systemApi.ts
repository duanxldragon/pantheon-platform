import { userApi } from './userApi';
import { deptApi } from './deptApi';
import { roleApi } from './roleApi';
import { menuApi } from './menuApi';
import { positionApi } from './positionApi';
import { logApi } from './logApi';
import { settingApi } from './settingApi';
import { permissionApi } from './permissionApi';
import { dictApi } from './dictApi';
import { monitorApi } from './monitorApi';

export const systemApi = {
  ...userApi,
  ...deptApi,
  ...roleApi,
  ...menuApi,
  ...positionApi,
  ...logApi,
  ...settingApi,
  ...permissionApi,
  ...dictApi,
  ...monitorApi,
};
