import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
} from 'react-native';
import {
  UtensilsCrossed,
  CreditCard,
  Package,
  History,
  ChevronRight,
  ClipboardList,
  BookOpen,
  BellRing,
  Users,
  MessageSquare,
} from 'lucide-react-native';
import { MenuItem, CartItem, TabType, OperationSubView } from '../types';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useMenuStore } from '../data/menuStore';
import { api } from '../services/api';
import { useSocketEvent } from '../hooks/useSocket';
import { OrderScreen } from './OrderScreen';
import { OrdersScreen } from './operations/OrdersScreen';
import { TablesScreen } from './operations/TablesScreen';
import { CashierScreen } from './operations/CashierScreen';
import { SoldOutScreen } from './operations/SoldOutScreen';
import { InventoryScreen } from './operations/InventoryScreen';
import { HistoryScreen } from './operations/HistoryScreen';
import { StaffScreen } from './operations/StaffScreen';
import { RequestsScreen } from './operations/RequestsScreen';
import { useHistoryStore, OrderHistoryItem } from '../data/historyStore';
import { useAuthStore } from '../data/authStore';
import { createTaggedLogger } from '../utils/logger';
const log = createTaggedLogger('OPS');

interface OperationsScreenProps {
  cart: CartItem[];
  onAddToCart: (item: MenuItem, selectedModifiers?: Record<string, string>, note?: string, quantity?: number) => void;
  onRemoveFromCart: (cartItemId: string) => void;
  onClearCart: () => void;
  onSetCart?: (cart: CartItem[]) => void;
  onNavigate?: (tab: TabType) => void;
  initialSubView?: OperationSubView;
  onSubViewChange?: (subView: OperationSubView) => void;
}

export const OperationsScreen: React.FC<OperationsScreenProps> = ({
  cart,
  onAddToCart,
  onRemoveFromCart,
  onClearCart,
  onSetCart,
  initialSubView = 'hub',
  onSubViewChange,
}) => {
  const insets = useSafeAreaInsets();
  const dynamicContentPaddingBottom = (insets.bottom > 0 ? Math.max(insets.bottom - 16, 6) : 6) + 76;
  const currentUser = useAuthStore((s) => s.user);
  const isAdmin = currentUser?.role === 'ADMIN' || currentUser?.role === 'PLATFORM_ADMIN';
  const [currentView, setCurrentView] = useState<OperationSubView>(initialSubView);
  const { items: menuItems } = useMenuStore();

  // Đồng bộ khi initialSubView từ props thay đổi
  useEffect(() => {
    if (initialSubView) {
      setCurrentView(initialSubView);
    }
  }, [initialSubView]);

  const handleSetView = (view: OperationSubView) => {
    setCurrentView(view);
    if (onSubViewChange) {
      onSubViewChange(view);
    }
  };

  // Dữ liệu Báo hết món (Sold-Out)
  const [soldOutState, setSoldOutState] = useState<Record<string, boolean>>({
    'm4': true, // Matcha Latte Tạm hết
    'm6': true, // Trà Hoa Cúc Tạm hết
  });

  const toggleSoldOut = (id: string) => {
    const nextVal = !soldOutState[id];
    setSoldOutState((prev) => ({
      ...prev,
      [id]: nextVal,
    }));

    // Gọi API cập nhật trạng thái hết món (Task B-011)
    api.toggleSoldOut(id, nextVal).catch((err) => {
      log.warn('[OperationsScreen] Failed to toggle sold out via API:', err.message);
    });
  };

  const soldOutCount = Object.values(soldOutState).filter(Boolean).length;
  const totalCartCount = cart.reduce((sum, c) => sum + c.quantity, 0);

  // Số liệu tổng hợp thời gian thực từ API (Task B-004)
  const [summary, setSummary] = useState({
    pendingOrders: 1,
    pendingPayment: 2,
    soldOutCount: 2,
    menuItemCount: menuItems.length,
  });
  const [pendingCallsCount, setPendingCallsCount] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const fetchSummary = useCallback(async () => {
    try {
      const data = await api.getActiveSummary();
      if (data) {
        setSummary(data);
      }
    } catch (err: any) {
      log.info('[OperationsScreen] Fallback to local summary');
    }
  }, []);

  const fetchPendingCalls = useCallback(async () => {
    try {
      const res = await api.fetchCustomerCalls({ status: 'PENDING' });
      if (res) {
        setPendingCallsCount(res.summary?.pending || 0);
      }
    } catch (err) {
      log.info('[OperationsScreen] Fetch pending calls failed');
    }
  }, []);

  useEffect(() => {
    fetchSummary();
    fetchPendingCalls();
  }, [fetchSummary, fetchPendingCalls]);

  // Cập nhật lại badge khi nhận sự kiện Socket.IO (Task B-004, B-011)
  useSocketEvent('order:new', fetchSummary);
  useSocketEvent('order:updated', fetchSummary);
  useSocketEvent('payment:completed', fetchSummary);
  useSocketEvent('sold_out:updated', (payload: { itemId: string; isSoldOut: boolean }) => {
    if (payload?.itemId) {
      setSoldOutState((prev) => ({
        ...prev,
        [payload.itemId]: payload.isSoldOut,
      }));
    }
    fetchSummary();
  });
  useSocketEvent('call_staff:request', fetchPendingCalls);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchSummary();
    await fetchPendingCalls();
    setRefreshing(false);
  };

  // Xử lý khi người dùng chọn "Sửa đơn" từ lịch sử đơn hàng
  const handleEditHistoryOrder = (order: OrderHistoryItem) => {
    useHistoryStore.getState().setEditingOrderId(order.id);

    // Chuyển danh sách món của đơn lịch sử thành CartItem[] cho giỏ hàng
    const convertedCartItems: CartItem[] = order.items.map((it, idx) => {
      const matched = menuItems.find(
        (m) => m.name.toLowerCase().trim() === it.name.toLowerCase().trim()
      );
      const menuItem: MenuItem = matched || {
        id: `hist_item_${idx}_${Date.now()}`,
        name: it.name,
        price: it.price,
        category: 'Đã lưu',
        imageUrl: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=300&q=80',
      };

      return {
        cartItemId: `${menuItem.id}__edit_${Date.now()}_${idx}`,
        item: menuItem,
        quantity: it.qty,
        unitPrice: it.price,
        note: it.note,
      };
    });

    if (onSetCart) {
      onSetCart(convertedCartItems);
    }

    handleSetView('order');
  };

  // SUBVIEWS
  if (currentView === 'order') {
    return (
      <OrderScreen
        cart={cart}
        onAddToCart={onAddToCart}
        onRemoveFromCart={onRemoveFromCart}
        onClearCart={onClearCart}
        onBack={() => handleSetView('hub')}
        onBackToHistory={() => handleSetView('history')}
      />
    );
  }

  if (currentView === 'tables') {
    return (
      <TablesScreen
        onBack={() => handleSetView('hub')}
        onNavigateToOrder={() => handleSetView('order')}
        onNavigateToCashier={() => handleSetView('cashier')}
      />
    );
  }

  if (currentView === 'orders') {
    return (
      <OrdersScreen
        onBack={() => handleSetView('hub')}
        onNewOrder={() => handleSetView('order')}
      />
    );
  }

  if (currentView === 'cashier') {
    return <CashierScreen onBack={() => handleSetView('hub')} />;
  }

  // Phân quyền: Các tính năng quản trị chỉ dành cho ADMIN / PLATFORM_ADMIN
  if (['sold_out', 'inventory', 'staff', 'requests'].includes(currentView) && !isAdmin) {
    return (
      <View className="flex-1 bg-background items-center justify-center p-6">
        <Text className="text-base font-extrabold text-textMain">Không Có Quyền Truy Cập</Text>
        <Text className="text-xs text-textSecondary mt-1.5 text-center px-4">
          Tính năng này chỉ dành riêng cho tài khoản Quản trị viên (Admin).
        </Text>
        <TouchableOpacity
          className="mt-5 bg-[#00A389] px-5 py-2.5 rounded-xl active:opacity-80"
          onPress={() => handleSetView('hub')}
        >
          <Text className="text-white font-bold text-xs">Quay về Trung Tâm Thao Tác</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (currentView === 'sold_out') {
    return (
      <SoldOutScreen
        soldOutState={soldOutState}
        onToggleSoldOut={toggleSoldOut}
        onBack={() => handleSetView('hub')}
      />
    );
  }

  if (currentView === 'inventory') {
    return <InventoryScreen onBack={() => handleSetView('hub')} />;
  }

  if (currentView === 'history') {
    return (
      <HistoryScreen
        onBack={() => handleSetView('hub')}
        onEditOrder={handleEditHistoryOrder}
      />
    );
  }

  if (currentView === 'staff') {
    return <StaffScreen onBack={() => handleSetView('hub')} />;
  }

  if (currentView === 'requests') {
    return <RequestsScreen onBack={() => handleSetView('hub')} />;
  }

  // MAIN VIEW: Trung Tâm Thao Tác (Hub)
  const allFeatures = [
    {
      id: 'order',
      group: 'BÁN HÀNG & PHỤC VỤ',
      title: 'Đặt Món',
      icon: UtensilsCrossed,
      color: '#059669',
      bgColor: '#ECFDF5',
      borderColor: '#A7F3D0',
      action: () => handleSetView('order'),
    },
    {
      id: 'orders',
      group: 'BÁN HÀNG & PHỤC VỤ',
      title: 'Quản Lý Đơn',
      icon: ClipboardList,
      color: '#2563EB',
      bgColor: '#EFF6FF',
      borderColor: '#BFDBFE',
      action: () => handleSetView('orders'),
    },
    {
      id: 'tables',
      group: 'BÁN HÀNG & PHỤC VỤ',
      title: 'Quản Lý Bàn',
      icon: UtensilsCrossed,
      color: '#D97706',
      bgColor: '#FFFBEB',
      borderColor: '#FDE68A',
      action: () => handleSetView('tables'),
    },
    {
      id: 'cashier',
      group: 'BÁN HÀNG & PHỤC VỤ',
      title: 'Quản Lý Thanh Toán',
      icon: CreditCard,
      color: '#7C3AED',
      bgColor: '#FAF5FF',
      borderColor: '#E9D5FF',
      action: () => handleSetView('cashier'),
    },
    ...(isAdmin
      ? [
          {
            id: 'sold_out',
            group: 'THỰC ĐƠN & KHO',
            title: 'Quản Lý Món',
            icon: BookOpen,
            color: '#059669',
            bgColor: '#ECFDF5',
            borderColor: '#A7F3D0',
            action: () => handleSetView('sold_out'),
          },
          {
            id: 'inventory',
            group: 'THỰC ĐƠN & KHO',
            title: 'Quản Lý Nguyên Liệu',
            icon: Package,
            color: '#D97706',
            bgColor: '#FEFCE8',
            borderColor: '#FEF08A',
            action: () => handleSetView('inventory'),
          },
          {
            id: 'staff',
            group: 'NHÂN VIÊN & YÊU CẦU',
            title: 'Quản Lý Nhân Viên',
            icon: Users,
            color: '#00A389',
            bgColor: '#E6F7F4',
            borderColor: '#99F6E4',
            action: () => handleSetView('staff'),
          },
          {
            id: 'requests',
            group: 'NHÂN VIÊN & YÊU CẦU',
            title: 'Yêu Cầu Khách Hàng',
            icon: MessageSquare,
            color: '#F59E0B',
            bgColor: '#FFFBEB',
            borderColor: '#FDE68A',
            action: () => handleSetView('requests'),
          },
        ]
      : []),
    {
      id: 'history',
      group: 'LỊCH SỬ & BÁO CÁO',
      title: 'Lịch Sử Đơn',
      icon: History,
      color: '#0D9488',
      bgColor: '#F0FDFA',
      borderColor: '#99F6E4',
      action: () => handleSetView('history'),
    },
  ];

  // Nhóm các tính năng theo group
  const groupedFeatures: Record<string, typeof allFeatures> = {};
  allFeatures.forEach((f) => {
    if (!groupedFeatures[f.group]) {
      groupedFeatures[f.group] = [];
    }
    groupedFeatures[f.group].push(f);
  });

  return (
    <View className="flex-1 bg-background">
      {/* Header Bar */}
      <View className="bg-white px-4 pt-2.5 pb-3 border-b border-[#F1F5F9]">
        <Text className="text-[20px] font-extrabold text-textMain">Trung Tâm Thao Tác</Text>
      </View>

      {/* Main Content Scroll với RefreshControl (Task B-004) */}
      <ScrollView
        contentContainerStyle={{ padding: 16, paddingTop: 14, paddingBottom: dynamicContentPaddingBottom }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#7C3AED', '#059669']} />}
      >
        {/* Danh sách các tính năng được phân nhóm */}
        {Object.entries(groupedFeatures).map(([groupName, items]) => (
          <View key={groupName} className="mb-[18px]">
            <Text className="text-[11.5px] font-extrabold text-textMuted tracking-[0.8px] mb-2.5 ml-1">{groupName}</Text>
            <View className="gap-2.5">
              {items.map((item) => {
                const IconComponent = item.icon;
                return (
                  <TouchableOpacity
                    key={item.id}
                    className="flex-row items-center bg-white rounded-[18px] p-3.5 border border-border"
                    style={{
                      shadowColor: '#0F172A',
                      shadowOffset: { width: 0, height: 4 },
                      shadowOpacity: 0.05,
                      shadowRadius: 10,
                      elevation: 2,
                    }}
                    onPress={item.action}
                    activeOpacity={0.75}
                  >
                    <View
                      className="w-12 h-12 rounded-[14px] border items-center justify-center"
                      style={{ backgroundColor: item.bgColor, borderColor: item.borderColor }}
                    >
                      <IconComponent size={24} color={item.color} strokeWidth={2.2} />
                    </View>

                    <View className="flex-1 ml-3.5 mr-2">
                      <Text className="text-[14px] font-extrabold text-textMain">{item.title}</Text>
                    </View>

                    <ChevronRight
                      size={18}
                      color="#94A3B8"
                      style={{ marginLeft: 2 }}
                    />
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
};
