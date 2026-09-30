import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { AuthUser } from '../types';
import { authService } from '../services/auth.service';
import { setAuthToken } from '../services/api';

const ACCESS_KEY = 'hiai_access_token';
const REFRESH_KEY = 'hiai_refresh_token';

async function safeGet(key: string): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(key);
  } catch {
    return null;
  }
}
async function safeSet(key: string, value: string) {
  try {
    await SecureStore.setItemAsync(key, value);
  } catch {
    // bỏ qua trên web
  }
}
async function safeDel(key: string) {
  try {
    await SecureStore.deleteItemAsync(key);
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
    await safeDel(ACCESS_KEY);
    await safeDel(REFRESH_KEY);
    set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false, isLoading: false });
  },

  loadFromStorage: async () => {
    set({ isLoading: true });
    const access = await safeGet(ACCESS_KEY);
    const refresh = await safeGet(REFRESH_KEY);
    if (!access) {
      set({ isLoading: false, isAuthenticated: false });
      return;
    }
    setAuthToken(access);
    try {
      // Thử lấy profile; nếu 401 thì thử refresh.
      const user = await authService.getProfile();
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
}));
