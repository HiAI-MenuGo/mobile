import { create } from 'zustand';

export interface OrderHistoryItem {
  id: string;
  table: string;
  time: string;
  total: number;
  status: 'COMPLETED' | 'VOIDED';
  method: string;
  staff: string;
  items: Array<{ name: string; qty: number; price: number; note?: string }>;
  note?: string;
}

export interface HistoryState {
  orders: OrderHistoryItem[];
  editingOrderId: string | null;
  setEditingOrderId: (id: string | null) => void;
  updateOrder: (id: string, updated: Partial<OrderHistoryItem>) => void;
  addOrder: (order: OrderHistoryItem) => void;
  voidOrder: (id: string) => void;
  restoreOrder: (id: string) => void;
}

export const initialHistoryOrders: OrderHistoryItem[] = [
  {
    id: '#HD-9021',
    table: 'Bàn 03',
    time: '14:42',
    total: 185000,
    status: 'COMPLETED',
    method: 'Tiền mặt',
    staff: 'Trần Tuấn',
    items: [
      { name: 'Cà Phê Muối Hoàng Gia', qty: 2, price: 39000 },
      { name: 'Trà Sữa Ô Long Nướng', qty: 1, price: 52000 },
      { name: 'Croissant Trứng Muối', qty: 1, price: 55000 },
    ],
  },
  {
    id: '#HD-9020',
    table: 'Bàn 08',
    time: '14:38',
    total: 95000,
    status: 'COMPLETED',
    method: 'VietQR',
    staff: 'Nguyễn Vy',
    items: [
      { name: 'Bạc Xỉu Sài Gòn Đá', qty: 2, price: 35000 },
      { name: 'Cà Phê Đen Đá', qty: 1, price: 25000 },
    ],
  },
  {
    id: '#HD-9019',
    table: 'Bàn 01',
    time: '14:25',
    total: 240000,
    status: 'COMPLETED',
    method: 'VietQR',
    staff: 'Trần Tuấn',
    items: [
      { name: 'Trà Đào Cam Sả Tươi', qty: 3, price: 45000 },
      { name: 'Bánh Mousse Chanh Leo', qty: 2, price: 45000 },
      { name: 'Espresso Single', qty: 1, price: 20000 },
    ],
  },
  {
    id: '#HD-9018',
    table: 'Bàn 06',
    time: '14:10',
    total: 65000,
    status: 'VOIDED',
    method: 'Huỷ món',
    staff: 'Quản lý duyệt',
    items: [
      { name: 'Matcha Latte Đá', qty: 1, price: 65000 },
    ],
  },
  {
    id: '#HD-9017',
    table: 'Bàn 14',
    time: '13:55',
    total: 130000,
    status: 'COMPLETED',
    method: 'Tiền mặt',
    staff: 'Nguyễn Vy',
    items: [
      { name: 'Trà Hoa Cúc Mật Ong', qty: 2, price: 45000 },
      { name: 'Bánh Cookie Hạnh Nhân', qty: 2, price: 20000 },
    ],
  },
];

export const useHistoryStore = create<HistoryState>((set) => ({
  orders: initialHistoryOrders,
  editingOrderId: null,
  setEditingOrderId: (id) => set({ editingOrderId: id }),
  updateOrder: (id, updated) =>
    set((state) => ({
      orders: state.orders.map((o) => (o.id === id ? { ...o, ...updated } : o)),
    })),
  addOrder: (order) =>
    set((state) => ({
      orders: [order, ...state.orders],
    })),
  voidOrder: (id) =>
    set((state) => ({
      orders: state.orders.map((o) =>
        o.id === id ? { ...o, status: 'VOIDED', method: 'Huỷ món' } : o
      ),
    })),
  restoreOrder: (id) =>
    set((state) => ({
      orders: state.orders.map((o) =>
        o.id === id ? { ...o, status: 'COMPLETED', method: 'Tiền mặt' } : o
      ),
    })),
}));
