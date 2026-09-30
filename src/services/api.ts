import { Platform } from 'react-native';
import { LiveOrder, LiveOrderStatus } from '../types';

const DEFAULT_URL = Platform.OS === 'android' ? 'http://10.0.2.2:5000' : 'http://localhost:5000';
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || DEFAULT_URL;

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  try {
    const res = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
    });

    const json = await res.json();
    if (!res.ok || json.success === false) {
      throw new Error(json.message || `API error ${res.status}`);
    }
    return json.data;
  } catch (err: any) {
    console.warn(`[API] Error fetching ${endpoint}:`, err.message);
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

  // 6. Inventory (Task B-012)
  getIngredients: (branchId: string = 'default-branch') =>
    request<
      Array<{
        id: string;
        name: string;
        quantity: number;
        unit: string;
        lowStockThreshold: number;
        category: string;
      }>
    >(`/api/ingredients?branchId=${branchId}`),

  adjustIngredientStock: (
    id: string,
    data: { adjustment: number; type: 'ADD' | 'REMOVE' | 'SET'; reason: string },
    branchId: string = 'default-branch'
  ) =>
    request(`/api/ingredients/${id}/adjust`, {
      method: 'PATCH',
      body: JSON.stringify({ ...data, branchId }),
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
};
