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

export const initialHistoryOrders: OrderHistoryItem[] = [];

export const useHistoryStore = create<HistoryState>((set) => ({
  orders: [],
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
