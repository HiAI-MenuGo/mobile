import { api } from './api';

/** Layer gọi API Auth cho mobile (Task A-001.2 + A-002). */
export const authService = {
  login: (email: string, password: string) => api.login(email, password),
  refreshToken: (refreshToken: string) => api.refreshToken(refreshToken),
  getProfile: () => api.getProfile(),
  changePassword: (oldPassword: string, newPassword: string) =>
    api.changePassword(oldPassword, newPassword),
  logout: (refreshToken?: string) => api.logout(refreshToken).catch(() => ({ loggedOut: true })),
};
