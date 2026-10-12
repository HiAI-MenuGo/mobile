export type TabType = 'home' | 'revenue' | 'order' | 'notifications' | 'settings';

export type OperationSubView =
  | 'hub'
  | 'order'
  | 'tables'
  | 'orders'
  | 'cashier'
  | 'sold_out'
  | 'inventory'
  | 'history'
  | 'staff'
  | 'requests';

export interface OrderItemDetail {
  id: string;
  name: string;
  quantity: number;
  price: number;
  note?: string;
  imageUrl?: string;
}

export type LiveOrderStatus = 'PENDING' | 'CONFIRMED' | 'DONE';

export interface LiveOrder {
  id: string;
  code: string;
  time: string;
  orderType?: 'TAKEAWAY' | 'DINE_IN';
  status: LiveOrderStatus;
  items: OrderItemDetail[];
  note?: string;
  total: number;
  paymentStatus: 'UNPAID' | 'PAID';
  paymentMethod?: 'CASH' | 'VIETQR';
  customerName?: string;
  countdownSeconds?: number;
}

export interface ModifierOption {
  id: string;
  name: string; // VD: "100%", "70%", "50%", "30%", "0%"
  extraPrice?: number; // Phụ thu nếu có (mặc định 0đ)
}

export interface ModifierGroup {
  id: string;
  name: string; // VD: "Đường", "Đá", "Size", "Topping"
  options: ModifierOption[];
}

export interface MenuItem {
  id: string;
  name: string;
  category: string;
  price: number;
  imageUrl: string;
  isPopular?: boolean;
  description?: string;
  modifierGroups?: ModifierGroup[];
  prepTimeMinutes?: number; // Thời gian chế biến đếm ngược khi khách đặt (phút)
}

export interface CartItem {
  cartItemId?: string;
  item: MenuItem;
  quantity: number;
  selectedModifiers?: Record<string, string>; // e.g. { "Đường": "50%", "Đá": "70%" }
  note?: string;
  unitPrice?: number;
}

export interface RevenueData {
  timeframe: 'day' | 'month' | 'year';
  total: number;
  growthPercent: number;
  orderCount: number;
  cashTotal: number;
  transferTotal: number;
  breakdown: Array<{ label: string; value: number }>;
  transactions: Array<{
    id: string;
    time: string;
    amount: number;
    method: 'CASH' | 'VIETQR';
    table: string;
    status: 'COMPLETED' | 'REFUNDED';
  }>;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  time: string;
  type: 'ORDER' | 'PAYMENT' | 'SYSTEM' | 'TABLE';
  isRead: boolean;
}

export interface UserProfile {
  name: string;
  role: string;
  code: string;
  phone: string;
  email: string;
  branch: string;
  avatarUrl: string;
  shift: string;
  dob: string;
}

// ── Auth (Thành viên A quản lý, Task A-002) ──
export type UserRole = 'PLATFORM_ADMIN' | 'ADMIN' | 'MANAGER' | 'KITCHEN' | 'CASHIER';

export interface AuthUser {
  id: string;
  email?: string;
  name: string;
  role: UserRole;
  tenantId: string;
  branchId: string;
  avatarUrl?: string;
}

export interface LoginResponse {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
}

export interface TodayOverview {
  revenue: number;
  orderCount: number;
  pendingOrders: number;
  pendingPayment: number;
  growth: number;
  topItems: MenuItem[];
}
