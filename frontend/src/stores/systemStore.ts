import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import {
  User,
  Department,
  Role,
  Menu,
  OperationLog,
  SystemSetting,
  Position,
} from '../modules/system/types';
import { systemApi } from '../modules/system/api';

interface SystemState {
  users: User[];
  departments: Department[];
  roles: Role[];
  menus: Menu[];
  positions: Position[];
  operationLogs: OperationLog[];
  systemSettings: SystemSetting[];
  isLoading: boolean;
  error: string | null;
  initialize: () => Promise<void>;
  setUsers: (users: User[]) => void;
  addUser: (user: User) => void;
  updateUser: (id: string, user: Partial<User>) => void;
  deleteUser: (id: string) => void;
  batchDeleteUsers: (ids: string[]) => void;
  setDepartments: (departments: Department[]) => void;
  addDepartment: (dept: Department) => void;
  updateDepartment: (id: string, dept: Partial<Department>) => void;
  deleteDepartment: (id: string) => void;
  setPositions: (positions: Position[]) => void;
  addPosition: (position: Position) => void;
  updatePosition: (id: string, position: Partial<Position>) => void;
  deletePosition: (id: string) => void;
  setRoles: (roles: Role[]) => void;
  addRole: (role: Role) => void;
  updateRole: (id: string, role: Partial<Role>) => void;
  deleteRole: (id: string) => void;
  setMenus: (menus: Menu[]) => void;
  addMenu: (menu: Menu) => void;
  updateMenu: (id: string, menu: Partial<Menu>) => void;
  deleteMenu: (id: string) => void;
  addOperationLog: (log: OperationLog) => void;
  updateSystemSetting: (key: string, value: string) => void;
  reset: () => void;
}

function cleanupLegacySystemState(): void {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.removeItem('system-storage');
}

cleanupLegacySystemState();

export const useSystemStore = create<SystemState>()(
  devtools(
    (set, _get) => ({
        users: [],
        departments: [],
        roles: [],
        menus: [],
        positions: [],
        operationLogs: [],
        systemSettings: [],
        isLoading: false,
        error: null,

        initialize: async () => {
          set({ isLoading: true, error: null });

          const results = await Promise.allSettled([
            systemApi.getUsers(),
            systemApi.getDepartments(),
            systemApi.getRoles(),
            systemApi.getCurrentUserMenus(),
            systemApi.getPositions(),
            systemApi.getOperationLogs(),
            systemApi.getSettings(),
          ]);

          const rejected = results.filter((r) => r.status === 'rejected');
          set({
            users: results[0].status === 'fulfilled' ? results[0].value : [],
            departments: results[1].status === 'fulfilled' ? results[1].value : [],
            roles: results[2].status === 'fulfilled' ? results[2].value : [],
            menus: results[3].status === 'fulfilled' ? results[3].value : [],
            positions: results[4].status === 'fulfilled' ? results[4].value : [],
            operationLogs: results[5].status === 'fulfilled' ? results[5].value.items : [],
            systemSettings: results[6].status === 'fulfilled' ? results[6].value : [],
            isLoading: false,
            error: rejected.length > 0 ? 'Failed to load some system data.' : null,
          });
        },

        setUsers: (users) => set({ users }),
        addUser: (user) => {
          set((state) => ({ users: [...state.users, user] }));
        },
        updateUser: (id, updates) => {
          set((state) => ({ users: state.users.map((u) => (String(u.id) === String(id) ? { ...u, ...updates } : u)) }));
        },
        deleteUser: (id) => {
          set((state) => ({ users: state.users.filter((u) => String(u.id) !== String(id)) }));
        },
        batchDeleteUsers: (ids) => {
          set((state) => ({ users: state.users.filter((u) => !ids.some((id) => String(id) === String(u.id))) }));
        },

        setDepartments: (departments) => set({ departments }),
        addDepartment: (dept) => {
          set((state) => ({ departments: [...state.departments, dept] }));
        },
        updateDepartment: (id, updates) => {
          set((state) => ({
            departments: state.departments.map((d) => (String(d.id) === String(id) ? { ...d, ...updates } : d)),
          }));
        },
        deleteDepartment: (id) => {
          set((state) => ({ departments: state.departments.filter((d) => String(d.id) !== String(id)) }));
        },

        setPositions: (positions) => set({ positions }),
        addPosition: (position) => {
          set((state) => ({ positions: [...state.positions, position] }));
        },
        updatePosition: (id, updates) => {
          set((state) => ({
            positions: state.positions.map((p) => (String(p.id) === String(id) ? { ...p, ...updates } : p)),
          }));
        },
        deletePosition: (id) => {
          set((state) => ({ positions: state.positions.filter((p) => String(p.id) !== String(id)) }));
        },

        setRoles: (roles) => set({ roles }),
        addRole: (role) => {
          set((state) => ({ roles: [...state.roles, role] }));
        },
        updateRole: (id, updates) => {
          set((state) => ({ roles: state.roles.map((r) => (String(r.id) === String(id) ? { ...r, ...updates } : r)) }));
        },
        deleteRole: (id) => {
          set((state) => ({ roles: state.roles.filter((r) => String(r.id) !== String(id)) }));
        },

        setMenus: (menus) => set({ menus }),
        addMenu: (menu) => {
          set((state) => ({ menus: [...state.menus, menu] }));
        },
        updateMenu: (id, updates) => {
          set((state) => ({ menus: state.menus.map((m) => (String(m.id) === String(id) ? { ...m, ...updates } : m)) }));
        },
        deleteMenu: (id) => {
          set((state) => ({ menus: state.menus.filter((m) => String(m.id) !== String(id)) }));
        },

        addOperationLog: (log) => {
          set((state) => ({ operationLogs: [log, ...state.operationLogs] }));
        },

        updateSystemSetting: (key, value) => {
          set((state) => ({
            systemSettings: state.systemSettings.map((s) => (s.key === key ? { ...s, value } : s)),
          }));
        },

        reset: () => {
          set({
            users: [],
            departments: [],
            roles: [],
            menus: [],
            positions: [],
            operationLogs: [],
            systemSettings: [],
            isLoading: false,
            error: null,
          });
        },
      }),
    { name: 'SystemStore' }
  )
);
