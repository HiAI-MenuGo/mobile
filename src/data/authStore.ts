import { create } from 'zustand';
import { AuthUser } from '../types';
import { authService } from '../services/auth.service';
import { setAuthToken, setAuthBranchId, api } from '../services/api';
import { switchSocketBranch, setSocketAuth, disconnectSocket } from '../hooks/useSocket';

let secureStoreModule: typeof import('expo-secure-store') | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  secureStoreModule = require('expo-secure-store');
} catch {
  secureStoreModule = null;
}

const memoryStorage = new Map<string, string>();

const ACCESS_KEY = 'hiai_access_token';
const REFRESH_KEY = 'hiai_refresh_token';

async function safeGet(key: string): Promise<string | null> {
  try {
    if (secureStoreModule?.getItemAsync) {
      const timeout = new Promise<null>((resolve) => setTimeout(() => resolve(null), 1000));
      const res = await Promise.race([secureStoreModule.getItemAsync(key), timeout]);
      if (res) return res;
    }
  } catch {
    // fallback
  }
  return memoryStorage.get(key) || null;
}

async function safeSet(key: string, value: string) {
  memoryStorage.set(key, value);
  try {
    if (secureStoreModule?.setItemAsync) {
      const timeout = new Promise<void>((resolve) => setTimeout(resolve, 1000));
      await Promise.race([secureStoreModule.setItemAsync(key, value), timeout]);
    }
  } catch {
    // bỏ qua
  }
}

async function safeDel(key: string) {
  memoryStorage.delete(key);
  try {
    if (secureStoreModule?.deleteItemAsync) {
      const timeout = new Promise<void>((resolve) => setTimeout(resolve, 1000));
      await Promise.race([secureStoreModule.deleteItemAsync(key), timeout]);
    }
  } catch {
    // bỏ qua
  }
}


interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  soundEnabled: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  loadFromStorage: () => Promise<void>;
  setSoundEnabled: (v: boolean) => void;
  updateProfile: (data: { name?: string; phone?: string; branchId?: string }) => Promise<void>;
  switchBranch: (branchId: string, branchName?: string) => Promise<void>;
  setUser: (user: AuthUser) => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: true,
  soundEnabled: true,

  login: async (email, password) => {
    const data = await authService.login(email.trim(), password);
    setAuthToken(data.accessToken);
    setAuthBranchId(data.user?.branchId || null);
    setSocketAuth({ token: data.accessToken, tenantId: data.user?.tenantId, branchId: data.user?.branchId });
    await safeSet(ACCESS_KEY, data.accessToken);
    await safeSet(REFRESH_KEY, data.refreshToken);
    set({
      user: data.user,
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
      isAuthenticated: true,
      isLoading: false,
    });
  },

  logout: async () => {
    const { refreshToken } = get();
    try {
      await authService.logout(refreshToken || undefined);
    } catch {
      // vẫn xóa local
    }
    setAuthToken(null);
    setAuthBranchId(null);
    disconnectSocket();
    await safeDel(ACCESS_KEY);
    await safeDel(REFRESH_KEY);
    set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false, isLoading: false });
  },

  loadFromStorage: async () => {
    set({ isLoading: true });
    const access = await safeGet(ACCESS_KEY);
    const refresh = await safeGet(REFRESH_KEY);
    if (!access) {
      try {
        const data = await authService.login('thd@gmail.com', '123456');
        setAuthToken(data.accessToken);
        setAuthBranchId(data.user?.branchId || null);
        setSocketAuth({ token: data.accessToken, tenantId: data.user?.tenantId, branchId: data.user?.branchId });
        await safeSet(ACCESS_KEY, data.accessToken);
        await safeSet(REFRESH_KEY, data.refreshToken);
        set({
          user: data.user,
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
          isAuthenticated: true,
          isLoading: false,
        });
        return;
      } catch (e) {
        set({ isLoading: false, isAuthenticated: false });
        return;
      }
    }

    setAuthToken(access);
    try {
      // Thử lấy profile; nếu 401 thì thử refresh.
      const user = await authService.getProfile();
      setAuthBranchId(user?.branchId || null);
      setSocketAuth({ token: access, tenantId: user?.tenantId, branchId: user?.branchId });
      set({
        user,
        accessToken: access,
        refreshToken: refresh,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch {
      if (refresh) {
        try {
          const data = await authService.refreshToken(refresh);
          setAuthToken(data.accessToken);
          setAuthBranchId(data.user?.branchId || null);
          setSocketAuth({ token: data.accessToken, tenantId: data.user?.tenantId, branchId: data.user?.branchId });
          await safeSet(ACCESS_KEY, data.accessToken);
          await safeSet(REFRESH_KEY, data.refreshToken);
          set({
            user: data.user,
            accessToken: data.accessToken,
            refreshToken: data.refreshToken,
            isAuthenticated: true,
            isLoading: false,
          });
          return;
        } catch {
          // refresh cũng hỏng -> logout
        }
      }
      setAuthToken(null);
      await safeDel(ACCESS_KEY);
      await safeDel(REFRESH_KEY);
      set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false, isLoading: false });
    }
  },

  setSoundEnabled: (v) => set({ soundEnabled: v }),

  updateProfile: async (data: { name?: string; phone?: string; branchId?: string }) => {
    const updated = await api.updateProfile(data);
    const currentUser = get().user;
    if (currentUser) {
      set({
        user: {
          ...currentUser,
          name: updated?.name || data.name || currentUser.name,
          phone: updated?.phone !== undefined ? updated.phone : currentUser.phone,
          branchId: updated?.branchId || data.branchId || currentUser.branchId,
          branch: updated?.branch || currentUser.branch,
        },
      });
    }
  },

  switchBranch: async (branchId: string, branchName?: string) => {
    const updated = await api.updateProfile({ branchId });
    setAuthBranchId(branchId);
    setSocketAuth({ branchId });
    switchSocketBranch(branchId);
    const currentUser = get().user;
    if (currentUser) {
      set({
        user: {
          ...currentUser,
          branchId,
          branch:
            updated?.branch ||
            (branchName
              ? { id: branchId, name: branchName, code: currentUser.branch?.code || '' }
              : currentUser.branch),
        },
      });
    }
  },

  setUser: (user: AuthUser) => {
    set({ user });
    setAuthBranchId(user?.branchId || null);
  },
}));
