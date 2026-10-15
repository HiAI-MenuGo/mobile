import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, RefreshControl } from 'react-native';
import { 
  TrendingUp, 
  UtensilsCrossed, 
  CheckCircle2, 
  Flame,
  Receipt,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TabType, OperationSubView } from '../types';
import { useAuthStore } from '../data/authStore';
import { useMenuStore } from '../data/menuStore';
import { api } from '../services/api';
import { createTaggedLogger } from '../utils/logger';
const log = createTaggedLogger('HOME');

interface HomeScreenProps {
  onNavigate: (tab: TabType, subView?: OperationSubView) => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ onNavigate }) => {
  const insets = useSafeAreaInsets();
  const dynamicContentPaddingBottom = (insets.bottom > 0 ? Math.max(insets.bottom - 16, 6) : 6) + 76;
  const user = useAuthStore((s) => s.user);
  const { items: menuItems, fetchMenuItems } = useMenuStore();

  const [summary, setSummary] = useState({
    pendingOrders: 3,
    pendingPayment: 2,
    soldOutCount: 0,
    menuItemCount: 26,
  });
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      await fetchMenuItems();
      const sumData = await api.getActiveSummary();
      if (sumData) {
        setSummary(sumData);
      }
    } catch (err: unknown) {
      log.warn('[HomeScreen] loadData error:', (err as Error).message);
    }
  }, [fetchMenuItems]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const popularDishes = menuItems.slice(0, 4);

  return (
    <View className="flex-1 bg-background">
      {/* Header Bar */}
      <View className="bg-white px-4 pt-2.5 pb-3 border-b border-[#F1F5F9]">
        <View className="flex-row justify-between items-center">
          <View>
            <Text className="text-[20px] font-extrabold text-textMain">Trang Chủ</Text>
            <Text className="text-[12px] text-textSecondary mt-0.5">
              Xin chào, {user?.name || 'Quản trị viên'} 👋
            </Text>
          </View>
          <TouchableOpacity 
            className="flex-row items-center gap-2"
            onPress={() => onNavigate('settings')}
            activeOpacity={0.8}
          >
            <View className="flex-row items-center gap-1.5 bg-[#ECFDF5] px-2.5 py-1 rounded-full border border-[#A7F3D0]">
              <View className="w-2 h-2 rounded-full bg-primary" />
              <Text className="text-[11.5px] font-bold text-primaryDark">
                {user?.role === 'ADMIN' ? 'Admin' : user?.role === 'CASHIER' ? 'Nhân viên' : 'Đang mở ca'}
              </Text>
            </View>
            <Image
              source={{ uri: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&q=80' }}
              className="w-9 h-9 rounded-xl border border-primaryLight"
            />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 16, paddingTop: 14, paddingBottom: dynamicContentPaddingBottom }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#00A389']} />}
      >
        {/* Hero Revenue Glance */}
        <View
          className="bg-white rounded-[20px] p-[18px] border border-border mb-4"
          style={{
            shadowColor: '#0F172A',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.05,
            shadowRadius: 10,
            elevation: 2,
          }}
        >
          <View className="flex-row justify-between items-center">
            <Text className="text-[11px] font-extrabold text-textMuted tracking-[0.8px]">TỔNG QUAN HÔM NAY</Text>
            <View className="bg-[#ECFDF5] px-2 py-[3px] rounded-full">
              <Text className="text-primaryDark text-[12px] font-bold">Trực tuyến</Text>
            </View>
          </View>
          <Text className="text-[28px] font-black text-primaryDark my-2 tracking-[-0.5px]">
            {summary.menuItemCount} Món Thực Đơn
          </Text>
          <View className="pt-2.5 border-t border-[#F1F5F9]">
            <Text className="text-[12px] text-textSecondary">
              {summary.pendingOrders} đơn đang chờ chế biến • {summary.pendingPayment} bàn chờ tính tiền
            </Text>
          </View>
        </View>

        {/* 3 Metric Mini Cards */}
        <View className="flex-row gap-2.5 mb-5">
          <TouchableOpacity
            className="flex-1 bg-white rounded-[16px] p-3 border border-border items-center"
            onPress={() => onNavigate('order', 'orders')}
            activeOpacity={0.75}
          >
            <View className="w-9 h-9 rounded-[10px] justify-center items-center mb-2 bg-[#ECFDF5]">
              <UtensilsCrossed size={18} color="#00A389" />
            </View>
            <Text className="text-[15px] font-extrabold text-textMain">{summary.pendingOrders} đơn</Text>
            <Text className="text-[10.5px] text-textSecondary mt-0.5 text-center">Đơn chờ xử lý</Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="flex-1 bg-white rounded-[16px] p-3 border border-border items-center"
            onPress={() => onNavigate('order', 'cashier')}
            activeOpacity={0.75}
          >
            <View className="w-9 h-9 rounded-[10px] justify-center items-center mb-2 bg-[#FAF5FF]">
              <Receipt size={18} color="#7C3AED" />
            </View>
            <Text className="text-[15px] font-extrabold text-textMain">{summary.pendingPayment} bàn</Text>
            <Text className="text-[10.5px] text-textSecondary mt-0.5 text-center">Chờ thanh toán</Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="flex-1 bg-white rounded-[16px] p-3 border border-border items-center"
            onPress={() => onNavigate('order', 'tables')}
            activeOpacity={0.75}
          >
            <View className="w-9 h-9 rounded-[10px] justify-center items-center mb-2 bg-[#EFF6FF]">
              <CheckCircle2 size={18} color="#2563EB" />
            </View>
            <Text className="text-[15px] font-extrabold text-textMain">Quản lý bàn</Text>
            <Text className="text-[10.5px] text-textSecondary mt-0.5 text-center">Quản lý phòng bàn</Text>
          </TouchableOpacity>
        </View>

        {/* Quick Actions */}
        <View className="flex-row items-center justify-between mb-3">
          <Text className="text-[16px] font-extrabold text-textMain">Lối Tắt Thao Tác</Text>
        </View>

        <View className="flex-row gap-3 mb-[22px]">
          <TouchableOpacity 
            className="flex-1 bg-primary rounded-[18px] p-4"
            style={{
              shadowColor: '#00A389',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.2,
              shadowRadius: 10,
              elevation: 3,
            }}
            onPress={() => onNavigate('order', 'order')}
            activeOpacity={0.85}
          >
            <UtensilsCrossed size={22} color="#FFFFFF" />
            <Text className="text-white text-[15px] font-extrabold mt-2.5">Tạo Order Món</Text>
            <Text className="text-white/85 text-[11px] mt-0.5">Gọi món tại bàn & mang về</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            className="flex-1 bg-white rounded-[18px] p-4 border border-border"
            style={{
              shadowColor: '#0F172A',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.05,
              shadowRadius: 10,
              elevation: 2,
            }}
            onPress={() => onNavigate('revenue')}
            activeOpacity={0.85}
          >
            <TrendingUp size={22} color="#00A389" />
            <Text className="text-textMain text-[15px] font-extrabold mt-2.5">Doanh Thu</Text>
            <Text className="text-textSecondary text-[11px] mt-0.5">Thống kê ca & ngày</Text>
          </TouchableOpacity>
        </View>

        {/* Live Popular Dishes from DB */}
        <View className="flex-row items-center justify-between mb-3">
          <Text className="text-[16px] font-extrabold text-textMain">Món Ăn Thực Đơn</Text>
          <View className="flex-row items-center gap-1 bg-[#FEE2E2] px-2 py-0.5 rounded-full">
            <Flame size={12} color="#EF4444" />
            <Text className="text-[11px] font-bold text-[#EF4444]">Thực đơn</Text>
          </View>
        </View>

        <View className="bg-white rounded-[18px] p-3.5 border border-border">
          {popularDishes.length === 0 ? (
            <Text className="text-[13px] text-textMuted text-center py-4">Đang tải món ăn từ máy chủ...</Text>
          ) : (
            popularDishes.map((dish, idx) => (
              <React.Fragment key={dish.id}>
                {idx > 0 && <View className="h-[1px] bg-[#F1F5F9] my-3" />}
                <View className="flex-row items-center">
                  <Image
                    source={{ uri: dish.imageUrl }}
                    className="w-[54px] h-[54px] rounded-[12px] bg-slate-100"
                  />
                  <View className="flex-1 ml-3">
                    <Text className="text-[14px] font-bold text-textMain" numberOfLines={1}>
                      {dish.name}
                    </Text>
                    <Text className="text-[11px] text-textMuted mt-0.5">
                      {typeof dish.category === 'object' && dish.category !== null ? (dish.category as any).name : dish.category}
                    </Text>
                    <Text className="text-[13px] font-extrabold text-primaryDark mt-0.5">
                      {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(dish.price)}
                    </Text>
                  </View>
                  <TouchableOpacity 
                    className="bg-[#ECFDF5] px-3 py-1.5 rounded-full"
                    onPress={() => onNavigate('order', 'order')}
                    activeOpacity={0.8}
                  >
                    <Text className="text-primaryDark text-[12px] font-bold">Order</Text>
                  </TouchableOpacity>
                </View>
              </React.Fragment>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
};
