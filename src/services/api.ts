import { Platform } from 'react-native';
import axios from 'axios';
import { AuthUser, LiveOrder, LiveOrderStatus, LoginResponse } from '../types';
import { createTaggedLogger } from '../utils/logger';
const log = createTaggedLogger('API');

const DEFAULT_URL = Platform.OS === 'android' ? 'http://10.0.2.2:5001' : 'http://localhost:5001';
const rawBase = (process.env.EXPO_PUBLIC_API_URL || DEFAULT_URL).trim().replace(/\/+$/, '');
export const API_HOST_URL = rawBase.replace(/\/api$/, '');
export const API_BASE_URL = `${API_HOST_URL}/api`;

// ── Axios instance (Task A-001) — dùng cho các module mới của A ──
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// Interceptor chuẩn hóa đường dẫn để tránh lặp /api/api
apiClient.interceptors.request.use((config) => {
  if (config.url?.startsWith('/api/')) {
    config.url = config.url.replace(/^\/api/, '');
  }
  return config;
});

// Token & Branch bộ nhớ (được authStore đồng bộ vào mỗi lần login/logout)
let inMemoryToken: string | null = null;
let inMemoryBranchId: string | null = null;

export function setAuthToken(token: string | null) {
  inMemoryToken = token;
  if (token) {
    apiClient.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete apiClient.defaults.headers.common.Authorization;
  }
}
export function getAuthToken() {
  return inMemoryToken;
}

export function setAuthBranchId(branchId: string | null) {
  inMemoryBranchId = branchId;
  if (branchId) {
    apiClient.defaults.headers.common['x-branch-id'] = branchId;
  } else {
    delete apiClient.defaults.headers.common['x-branch-id'];
  }
}
export function getAuthBranchId() {
  return inMemoryBranchId;
}

apiClient.interceptors.response.use(
  (res) => res,
  (err) => {
    log.warn('[API axios]', err?.response?.data?.message || err.message);
    return Promise.reject(err);
  }
);

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = cleanEndpoint.startsWith('/api/') || cleanEndpoint === '/api'
    ? `${API_HOST_URL}${cleanEndpoint}`
    : `${API_BASE_URL}${cleanEndpoint}`;
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...((options.headers as Record<string, string>) || {}),
    };
    if (inMemoryToken && !headers.Authorization) {
      headers.Authorization = `Bearer ${inMemoryToken}`;
    }
    if (inMemoryBranchId && !headers['x-branch-id']) {
      headers['x-branch-id'] = inMemoryBranchId;
    }
    const res = await fetch(url, { ...options, headers });

    const json = await res.json();
    if (!res.ok || json.success === false) {
      const error: Error & { status?: number; errorCode?: string } = new Error(
        json.message || `API error ${res.status}`
      );
      error.status = res.status;
      error.errorCode = json.errorCode;
      throw error;
    }
    return json.data;
  } catch (err: unknown) {
    log.warn(`[API] Error fetching ${endpoint}:`, (err as Error).message);
    throw err;
  }
}

export const api = {
  // 1. Hub Summary (Task B-004)
  getActiveSummary: (branchId: string = 'default-branch') =>
    request<{ pendingOrders: number; pendingPayment: number; soldOutCount: number; menuItemCount: number }>(
      `/api/sessions/active-summary?branchId=${branchId}`
    ),

  // 2. Tables (Task B-005)
  getTables: (branchId: string = 'default-branch') =>
    request<
      Array<{
        id: string;
        name: string;
        status: 'EMPTY' | 'OCCUPIED' | 'RESERVED';
        currentSessionId?: string;
        customerCount?: number;
        scannedCustomerCount?: number;
        totalAmount?: number;
      }>
    >(`/api/tables?branchId=${branchId}`),

  updateTableStatus: (tableId: string, status: 'EMPTY' | 'OCCUPIED' | 'RESERVED', branchId: string = 'default-branch') =>
    request(`/api/tables/${tableId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, branchId }),
    }),

  // 3. Live Orders (Task B-006, B-007)
  getActiveOrders: (branchId: string = 'default-branch') =>
    request<LiveOrder[]>(`/api/orders/active?branchId=${branchId}`),

  updateOrderStatus: (orderId: string, status: LiveOrderStatus, branchId: string = 'default-branch') =>
    request<LiveOrder>(`/api/orders/${orderId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, branchId }),
    }),

  voidOrder: (orderId: string, reason: string, branchId: string = 'default-branch') =>
    request<LiveOrder>(`/api/orders/${orderId}/void`, {
      method: 'POST',
      body: JSON.stringify({ reason, branchId }),
    }),

  // 4. Cashier & VietQR (Task B-008, B-009, B-010)
  getPendingPayments: (branchId: string = 'default-branch') =>
    request<
      Array<{
        sessionId: string;
        tableId: string;
        tableName: string;
        total: number;
        customerName?: string;
        items: any[];
        createdAt: string;
      }>
    >(`/api/sessions/pending-payment?branchId=${branchId}`),

  payCash: (data: { sessionId: string; cashReceived: number; voucherCode?: string; customerId?: string }) =>
    request<{
      success: boolean;
      total: number;
      cashReceived: number;
      change: number;
      pointsEarned: number;
      receiptId: string;
    }>('/api/cashier/pay', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  createVietQR: (data: { sessionId: string; amount: number }) =>
    request<{
      qrCodeUrl: string;
      qrCode: string;
      transactionRef: string;
      amount: number;
      expiresAt: string;
    }>('/api/cashier/create-qr', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Customer Call (Gọi nhân viên từ QR khách)
  sendCustomerCall: (data: { tableId: string; tableName?: string; type: 'PAYMENT' | 'STAFF'; reason?: string; paymentMethod?: 'CASH' | 'VIETQR' }) =>
    request<{
      id: string;
      tenantId: string;
      branchId: string;
      tableId: string;
      tableName: string;
      type: 'PAYMENT' | 'STAFF';
      paymentMethod?: 'CASH' | 'VIETQR';
      reason: string;
      status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'CANCELLED';
      createdAt: string;
      updatedAt: string;
      resolvedAt?: string;
    }>('/api/customer-requests/call', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // 5. Sold Out (Task B-011)
  getMenuItems: (branchId: string = 'default-branch') =>
    request<
      Array<{
        id: string;
        name: string;
        category: string;
        price: number;
        imageUrl: string;
        isSoldOut: boolean;
      }>
    >(`/api/menu/items?branchId=${branchId}`),

  toggleSoldOut: (itemId: string, isSoldOut: boolean, branchId: string = 'default-branch') =>
    request(`/api/menu/items/${itemId}/sold-out`, {
      method: 'PATCH',
      body: JSON.stringify({ isSoldOut, branchId }),
    }),

  // Upload ảnh lên Cloudinary
  uploadImage: async (uri: string, filename?: string, mimeType?: string): Promise<{ url: string; publicId: string }> => {
    const formData = new FormData();
    const name = filename || `dish_${Date.now()}.jpg`;
    const type = mimeType || 'image/jpeg';
    formData.append('file', {
      uri,
      name,
      type,
    } as any);
    formData.append('folder', 'hiai-menugo/menu');

    const url = `${API_BASE_URL}/upload/image`;
    const headers: Record<string, string> = {};
    if (inMemoryToken) {
      headers.Authorization = `Bearer ${inMemoryToken}`;
    }

    const res = await fetch(url, {
      method: 'POST',
      headers,
      body: formData,
    });

    const json = await res.json();
    if (!json.success || !json.data?.url) {
      throw new Error(json.message || 'Tải ảnh lên thất bại');
    }
    return json.data;
  },

  // 6. Inventory (Task B-012)
  getIngredients: (branchId?: string) =>
    request<
      Array<{
        id: string;
        name: string;
        quantity: number;
        unit: string;
        lowStockThreshold: number;
        category?: string;
      }>
    >(`/api/ingredients${branchId ? `?branchId=${encodeURIComponent(branchId)}` : ''}`),

  createIngredient: (
    data: { name: string; quantity: number; unit: string; lowStockThreshold?: number },
    branchId?: string
  ) =>
    request('/api/ingredients', {
      method: 'POST',
      body: JSON.stringify({ ...data, ...(branchId ? { branchId } : {}) }),
    }),

  adjustIngredientStock: (
    id: string,
    data: { adjustment: number; type: 'ADD' | 'REMOVE' | 'SET'; reason: string },
    branchId?: string
  ) =>
    request(`/api/ingredients/${id}/adjust`, {
      method: 'PATCH',
      body: JSON.stringify({ ...data, ...(branchId ? { branchId } : {}) }),
    }),

  deleteIngredient: (id: string, branchId?: string) =>
    request(`/api/ingredients/${id}${branchId ? `?branchId=${encodeURIComponent(branchId)}` : ''}`, {
      method: 'DELETE',
    }),

  // ── Auth (Task A-002, Thành viên A) ──
  login: (email: string, password: string) =>
    request<LoginResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  refreshToken: (refreshToken: string) =>
    request<LoginResponse>('/api/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    }),

  getProfile: () => request<AuthUser>('/api/auth/me'),

  changePassword: (oldPassword: string, newPassword: string) =>
    request<{ changed: boolean }>('/api/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ oldPassword, newPassword }),
    }),

  logout: (refreshToken?: string) =>
    request<{ loggedOut: boolean }>('/api/auth/logout', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    }),

  // 7. History (Task B-013)
  getOrderHistory: (params: { page?: number; limit?: number; search?: string; startDate?: string; endDate?: string } = {}) => {
    const q = new URLSearchParams();
    if (params.page) q.append('page', params.page.toString());
    if (params.limit) q.append('limit', params.limit.toString());
    if (params.search) q.append('search', params.search);
    if (params.startDate) q.append('startDate', params.startDate);
    if (params.endDate) q.append('endDate', params.endDate);
    return request<{
      orders: LiveOrder[];
      total: number;
      page: number;
      totalPages: number;
    }>(`/api/orders/history?${q.toString()}`);
  },

  // 8. Doanh thu & Báo cáo
  getRevenueReport: (params: { startDate?: string; endDate?: string } = {}) => {
    const q = new URLSearchParams();
    if (params.startDate) q.append('startDate', params.startDate);
    if (params.endDate) q.append('endDate', params.endDate);
    return request<{
      branch: { id: string; name: string; code: string };
      tenantName: string;
      dateRange: { startDate: string; endDate: string };
      summary: {
        totalRevenue: number;
        previousRevenue: number;
        growthPercent: number;
        orderCount: number;
        avgOrderValue: number;
        cashRevenue: number;
        qrRevenue: number;
        totalDiscount: number;
      };
      dailyTrend: Array<{
        date: string;
        orders: number;
        revenue: number;
        cash: number;
        vietqr: number;
        discount: number;
      }>;
      hourlyTrend: Array<{
        time: string;
        hour: number;
        orders: number;
        revenue: number;
        cash: number;
        vietqr: number;
      }>;
      monthlyTrend: Array<{
        month: string;
        label: string;
        shortLabel: string;
        orders: number;
        revenue: number;
        cash: number;
        vietqr: number;
      }>;
      paymentBreakdown: Array<{
        method: string;
        label: string;
        amount: number;
        percentage: number;
      }>;
      topItems: Array<{
        name: string;
        soldCount: number;
        revenue: number;
        category: string;
      }>;
      recentOrders: Array<{
        id: string;
        orderCode: string;
        tableName: string;
        createdAt: string;
        totalAmount: number;
        paymentMethod: string;
        status: string;
      }>;
    }>(`/api/analytics/revenue?${q.toString()}`);
  },

  // Customer Requests (Yêu cầu từ khách hàng - dùng chung API web)
  fetchCustomerCalls: (params?: { status?: string; type?: string; branchId?: string }) => {
    const qs = new URLSearchParams();
    if (params?.status && params.status !== 'ALL') qs.set('status', params.status);
    if (params?.type && params.type !== 'ALL') qs.set('type', params.type);
    if (params?.branchId && params.branchId !== 'ALL') qs.set('branchId', params.branchId);
    return request<{ calls: Array<{
      id: string;
      tenantId: string;
      branchId: string;
      tableId: string;
      tableName: string;
      type: 'PAYMENT' | 'STAFF';
      paymentMethod?: 'CASH' | 'VIETQR';
      reason: string;
      status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'CANCELLED';
      createdAt: string;
      updatedAt: string;
      resolvedAt?: string;
    }>; summary: { total: number; pending: number; processing: number } }>(
      `/api/customer-requests/calls${qs.toString() ? `?${qs.toString()}` : ''}`
    );
  },

  updateCustomerCallStatus: (id: string, status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'CANCELLED') =>
    request<{
      id: string;
      tenantId: string;
      branchId: string;
      tableId: string;
      tableName: string;
      type: 'PAYMENT' | 'STAFF';
      paymentMethod?: 'CASH' | 'VIETQR';
      reason: string;
      status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'CANCELLED';
      createdAt: string;
      updatedAt: string;
      resolvedAt?: string;
    }>(`/api/customer-requests/calls/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),

  // 9. Staff / Users (Dùng chung API /admin/users backend với Web)
  getStaffUsers: (params?: { branchId?: string; role?: string; search?: string; isActive?: boolean }) => {
    const q = new URLSearchParams();
    if (params?.branchId && params.branchId !== 'ALL') q.append('branchId', params.branchId);
    if (params?.role && params.role !== 'ALL') q.append('role', params.role);
    if (params?.search) q.append('search', params.search);
    if (params?.isActive !== undefined) q.append('isActive', String(params.isActive));
    const qs = q.toString();
    return request<Array<{
      id: string;
      tenantId: string;
      branchId: string | null;
      email: string;
      name: string;
      phone: string | null;
      role: string;
      isActive: boolean;
      lastLoginAt: string | null;
      createdAt: string;
      branch?: { id: string; name: string; code: string } | null;
    }>>(`/api/admin/users${qs ? `?${qs}` : ''}`);
  },

  getStaffRoles: () =>
    request<Array<{ role: string; label: string; scope: string }>>('/api/admin/users/roles'),

  // 10. Notifications (Thông báo hoạt động)
  getNotifications: (params?: { branchId?: string; type?: string }) => {
    const q = new URLSearchParams();
    if (params?.branchId && params.branchId !== 'ALL') q.append('branchId', params.branchId);
    if (params?.type && params.type !== 'ALL') q.append('type', params.type);
    const qs = q.toString();
    return request<{
      notifications: Array<{
        id: string;
        tenantId?: string;
        branchId?: string;
        title: string;
        message: string;
        time: string;
        type: 'ORDER' | 'PAYMENT' | 'SYSTEM' | 'TABLE';
        isRead: boolean;
        createdAt?: string;
      }>;
      unreadCount: number;
    }>(`/api/notifications${qs ? `?${qs}` : ''}`);
  },

  markNotificationAsRead: (id: string) =>
    request<any>(`/api/notifications/${encodeURIComponent(id)}/read`, {
      method: 'PATCH',
    }),

  markAllNotificationsAsRead: (branchId?: string) =>
    request<{ updatedCount: number }>('/api/notifications/read-all', {
      method: 'POST',
      body: JSON.stringify({ branchId }),
    }),

  // 11. Cài đặt & Tài khoản (Settings & Account)
  getBranches: () =>
    request<
      Array<{
        id: string;
        name: string;
        code: string;
        address?: string | null;
        phone?: string | null;
      }>
    >('/api/branches'),

  updateProfile: (data: { name?: string; phone?: string; branchId?: string }) =>
    request<any>('/api/auth/profile', {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  submitFeedback: (data: {
    category: string;
    title?: string;
    content: string;
    userName?: string;
    userEmail?: string;
    branchId?: string;
  }) =>
    request<any>('/api/customer-requests/feedback', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

