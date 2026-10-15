import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View, Platform, Text } from 'react-native';

import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { TabType, CartItem, MenuItem, OperationSubView } from './src/types';
import { theme } from './src/theme';
import { BottomNav } from './src/components/BottomNav';
import { HomeScreen } from './src/screens/HomeScreen';
import { RevenueScreen } from './src/screens/RevenueScreen';
import { OperationsScreen } from './src/screens/OperationsScreen';
import { NotificationScreen } from './src/screens/NotificationScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { LoginScreen } from './src/screens/LoginScreen';
import { useAuthStore } from './src/data/authStore';
import { useNotificationStore } from './src/data/notificationStore';

function MainApp() {
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);
  const unreadNotificationsCount = useNotificationStore((s) => s.unreadCount);
  const fetchNotifications = useNotificationStore((s) => s.fetchNotifications);
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [operationSubView, setOperationSubView] = useState<OperationSubView>('hub');
  const [cart, setCart] = useState<CartItem[]>([]);


  useEffect(() => {
    fetchNotifications(user?.branchId);
  }, [fetchNotifications, user?.branchId]);


  // Thêm món vào giỏ order (hỗ trợ tuỳ chọn từ ItemOptionsScreen)
  const handleAddToCart = (
    item: MenuItem,
    selectedModifiers?: Record<string, string>,
    note?: string,
    quantity: number = 1
  ) => {
    setCart((prev) => {
      // Tạo khóa duy nhất dựa trên id + modifiers + note
      const modKey = selectedModifiers ? JSON.stringify(selectedModifiers) : '';
      const noteKey = note || '';
      const cartItemId = `${item.id}__${modKey}__${noteKey}`;

      // Tính giá đơn vị có phụ thu từ modifiers
      let extraPerItem = 0;
      if (selectedModifiers && item.modifierGroups) {
        item.modifierGroups.forEach((g) => {
          const chosenName = selectedModifiers[g.name];
          const opt = g.options.find((o) => o.name === chosenName);
          if (opt?.extraPrice) extraPerItem += opt.extraPrice;
        });
      }
      const unitPrice = item.price + extraPerItem;

      const existing = prev.find((c) => c.cartItemId === cartItemId);
      if (existing) {
        return prev.map((c) =>
          c.cartItemId === cartItemId ? { ...c, quantity: c.quantity + quantity } : c
        );
      }
      return [
        ...prev,
        {
          cartItemId,
          item,
          quantity,
          selectedModifiers,
          note,
          unitPrice,
        },
      ];
    });
  };

  // Giảm món trong giỏ order (dùng cartItemId để định danh đúng entry)
  const handleRemoveFromCart = (cartItemId: string) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.cartItemId === cartItemId);
      if (!existing) return prev;
      if (existing.quantity <= 1) {
        return prev.filter((c) => c.cartItemId !== cartItemId);
      }
      return prev.map((c) =>
        c.cartItemId === cartItemId ? { ...c, quantity: c.quantity - 1 } : c
      );
    });
  };

  // Xoá sạch giỏ khi đã gửi order thành công
  const handleClearCart = () => {
    setCart([]);
  };

  // Tổng số lượng món trong giỏ
  const totalCartCount = cart.reduce((sum, c) => sum + c.quantity, 0);

  // Điều hướng có hỗ trợ sub-view cho màn hình Thao tác
  const handleNavigate = (tab: TabType, subView?: OperationSubView) => {
    setActiveTab(tab);
    if (tab === 'order') {
      setOperationSubView(subView || 'hub');
    }
  };

  // Điều hướng nội dung theo tab
  const renderScreen = () => {
    switch (activeTab) {
      case 'home':
        return <HomeScreen onNavigate={handleNavigate} />;
      case 'revenue':
        return <RevenueScreen />;
      case 'order':
        return (
          <OperationsScreen
            cart={cart}
            onAddToCart={handleAddToCart}
            onRemoveFromCart={handleRemoveFromCart}
            onClearCart={handleClearCart}
            onSetCart={(newCart) => setCart(newCart)}
            onNavigate={setActiveTab}
            initialSubView={operationSubView}
            onSubViewChange={setOperationSubView}
          />
        );
      case 'notifications':
        return <NotificationScreen />;
      case 'settings':
        return <SettingsScreen />;
      default:
        return <HomeScreen onNavigate={handleNavigate} />;
    }
  };

  // Căn chỉnh khoảng trống đỉnh đầu tránh Dynamic Island / Notch
  const dynamicTop = Math.max(insets.top, Platform.OS === 'android' ? 24 : 44);

  return (
    <View className="flex-1 bg-white relative" style={{ paddingTop: dynamicTop }}>
      <StatusBar style="dark" />
      <View className="flex-1 bg-background">{renderScreen()}</View>

      {/* Chỉ hiển thị thanh BottomNav chính khi ở các tab chính (home, revenue, notifications, settings)
          hoặc ở Hub tổng quan của Thao tác.
          Khi vào từng tính năng con (tables, order, cashier, sold_out, inventory, history),
          thanh đáy sẽ được nhường lại để làm thanh công cụ tác vụ chuyên dụng của tính năng đó.
      */}
      {(activeTab !== 'order' || operationSubView === 'hub') && (
        <BottomNav
          activeTab={activeTab}
          onTabChange={(tab) => handleNavigate(tab, 'hub')}
          cartCount={totalCartCount}
          unreadNotificationsCount={unreadNotificationsCount}
          bottomInset={insets.bottom}
        />
      )}
    </View>
  );
}

function AuthGate() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isLoading = useAuthStore((s) => s.isLoading);
  const loadFromStorage = useAuthStore((s) => s.loadFromStorage);

  useEffect(() => {
    loadFromStorage();
  }, [loadFromStorage]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.background }}>
        <ActivityIndicator size="large" color={theme.colors.primaryDark} />
      </View>
    );
  }


  if (!isAuthenticated) return <LoginScreen />;
  return <MainApp />;
}

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean; error: any }> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }
  componentDidCatch(error: any, info: any) {
    console.error('ErrorBoundary caught:', error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <View style={{ flex: 1, backgroundColor: '#FEE2E2', padding: 30, justifyContent: 'center' }}>
          <Text style={{ color: '#DC2626', fontSize: 18, fontWeight: 'bold' }}>LỖI RENDER:</Text>
          <Text style={{ color: '#991B1B', marginTop: 10 }}>{String(this.state.error?.message || this.state.error)}</Text>
          <Text style={{ color: '#7F1D1D', marginTop: 10, fontSize: 11 }}>{String(this.state.error?.stack || '')}</Text>
        </View>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <AuthGate />
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}




