import { userApi } from './user_api';
import { deptApi } from './dept_api';
import { roleApi } from './role_api';
import { menuApi } from './menu_api';
import { positionApi } from './position_api';
import { logApi } from './log_api';
import { settingApi } from './setting_api';
import { permissionApi } from './permission_api';
import { dictApi } from './dict_api';
import { monitorApi } from './monitor_api';

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



