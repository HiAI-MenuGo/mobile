import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image } from 'react-native';
import { 
  TrendingUp, 
  UtensilsCrossed, 
  CheckCircle2, 
  ArrowRight,
  Flame,
  Receipt,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TabType, OperationSubView } from '../types';

interface HomeScreenProps {
  onNavigate: (tab: TabType, subView?: OperationSubView) => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ onNavigate }) => {
  const insets = useSafeAreaInsets();
  const dynamicContentPaddingBottom = (insets.bottom > 0 ? Math.max(insets.bottom - 16, 6) : 6) + 76;

  return (
    <View className="flex-1 bg-background">
      {/* Header Bar */}
      <View className="bg-white px-4 pt-2.5 pb-3 border-b border-[#F1F5F9]">
        <View className="flex-row justify-between items-center">
          <View>
            <Text className="text-[20px] font-extrabold text-textMain">Trang Chủ</Text>
            <Text className="text-[12px] text-textSecondary mt-0.5">Xin chào, Trần Tuấn 👋</Text>
          </View>
          <TouchableOpacity 
            className="flex-row items-center gap-2"
            onPress={() => onNavigate('settings')}
            activeOpacity={0.8}
          >
            <View className="flex-row items-center gap-1.5 bg-[#ECFDF5] px-2.5 py-1 rounded-full border border-[#A7F3D0]">
              <View className="w-2 h-2 rounded-full bg-primary" />
              <Text className="text-[11.5px] font-bold text-primaryDark">Đang mở ca</Text>
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
            <Text className="text-[11px] font-extrabold text-textMuted tracking-[0.8px]">DOANH THU HÔM NAY</Text>
            <View className="bg-[#ECFDF5] px-2 py-[3px] rounded-full">
              <Text className="text-primaryDark text-[12px] font-bold">+12.8%</Text>
            </View>
          </View>
          <Text className="text-[32px] font-black text-primaryDark my-2 tracking-[-0.5px]">8.650.000 đ</Text>
          <View className="flex-row justify-between items-center pt-2.5 border-t border-[#F1F5F9]">
            <Text className="text-[12px] text-textSecondary">142 hoá đơn đã thanh toán</Text>
            <TouchableOpacity 
              className="flex-row items-center gap-1"
              onPress={() => onNavigate('revenue')}
              activeOpacity={0.8}
            >
              <Text className="text-[12px] font-bold text-primary">Chi tiết</Text>
              <ArrowRight size={14} color="#10B981" />
            </TouchableOpacity>
          </View>
        </View>

      {/* 3 Metric Mini Cards */}
      <View className="flex-row gap-2.5 mb-5">
        <TouchableOpacity
          className="flex-1 bg-white rounded-[16px] p-3 border border-border items-center"
          onPress={() => onNavigate('order', 'tables')}
          activeOpacity={0.75}
        >
          <View className="w-9 h-9 rounded-[10px] justify-center items-center mb-2 bg-[#ECFDF5]">
            <UtensilsCrossed size={18} color="#10B981" />
          </View>
          <Text className="text-[15px] font-extrabold text-textMain">6 đơn</Text>
          <Text className="text-[10.5px] text-textSecondary mt-0.5 text-center">Đang chờ & chế biến</Text>
        </TouchableOpacity>

        <TouchableOpacity
          className="flex-1 bg-white rounded-[16px] p-3 border border-border items-center"
          onPress={() => onNavigate('order', 'cashier')}
          activeOpacity={0.75}
        >
          <View className="w-9 h-9 rounded-[10px] justify-center items-center mb-2 bg-[#FAF5FF]">
            <Receipt size={18} color="#7C3AED" />
          </View>
          <Text className="text-[15px] font-extrabold text-textMain">3 đơn</Text>
          <Text className="text-[10.5px] text-textSecondary mt-0.5 text-center">Chờ thanh toán</Text>
        </TouchableOpacity>

        <TouchableOpacity
          className="flex-1 bg-white rounded-[16px] p-3 border border-border items-center"
          onPress={() => onNavigate('order', 'history')}
          activeOpacity={0.75}
        >
          <View className="w-9 h-9 rounded-[10px] justify-center items-center mb-2 bg-[#EFF6FF]">
            <CheckCircle2 size={18} color="#2563EB" />
          </View>
          <Text className="text-[15px] font-extrabold text-textMain">142</Text>
          <Text className="text-[10.5px] text-textSecondary mt-0.5 text-center">Đơn hoàn thành</Text>
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
            shadowColor: '#0F172A',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.05,
            shadowRadius: 10,
            elevation: 2,
          }}
          onPress={() => onNavigate('order')}
          activeOpacity={0.85}
        >
          <UtensilsCrossed size={22} color="#FFFFFF" />
          <Text className="text-white text-[15px] font-extrabold mt-2.5">Tạo Order Món</Text>
          <Text className="text-white/85 text-[11px] mt-0.5">Lên đơn mang về & tại chỗ</Text>
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
          <TrendingUp size={22} color="#10B981" />
          <Text className="text-textMain text-[15px] font-extrabold mt-2.5">Xem Báo Cáo</Text>
          <Text className="text-textSecondary text-[11px] mt-0.5">Doanh thu ngày/tháng</Text>
        </TouchableOpacity>
      </View>

      {/* Live Popular Dishes */}
      <View className="flex-row items-center justify-between mb-3">
        <Text className="text-[16px] font-extrabold text-textMain">Món Bán Chạy Hôm Nay</Text>
        <View className="flex-row items-center gap-1 bg-[#FEE2E2] px-2 py-0.5 rounded-full">
          <Flame size={12} color="#EF4444" />
          <Text className="text-[11px] font-bold text-[#EF4444]">Hot</Text>
        </View>
      </View>

      <View className="bg-white rounded-[18px] p-3.5 border border-border">
        {/* Item 1 */}
        <View className="flex-row items-center">
          <Image
            source={{ uri: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=160&q=80' }}
            className="w-[54px] h-[54px] rounded-[12px]"
          />
          <View className="flex-1 ml-3">
            <Text className="text-[14px] font-bold text-textMain">Cà Phê Muối Hoàng Gia</Text>
            <Text className="text-[11px] text-textMuted mt-0.5">Đã phục vụ 48 ly hôm nay</Text>
            <Text className="text-[13px] font-extrabold text-primaryDark mt-0.5">39.000 đ</Text>
          </View>
          <TouchableOpacity 
            className="bg-[#ECFDF5] px-3 py-1.5 rounded-full"
            onPress={() => onNavigate('order')}
          >
            <Text className="text-primaryDark text-[12px] font-bold">Order</Text>
          </TouchableOpacity>
        </View>

        <View className="h-[1px] bg-[#F1F5F9] my-3" />

        {/* Item 2 */}
        <View className="flex-row items-center">
          <Image
            source={{ uri: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=160&q=80' }}
            className="w-[54px] h-[54px] rounded-[12px]"
          />
          <View className="flex-1 ml-3">
            <Text className="text-[14px] font-bold text-textMain">Trà Đào Cam Sả Tươi</Text>
            <Text className="text-[11px] text-textMuted mt-0.5">Đã phục vụ 36 ly hôm nay</Text>
            <Text className="text-[13px] font-extrabold text-primaryDark mt-0.5">45.000 đ</Text>
          </View>
          <TouchableOpacity 
            className="bg-[#ECFDF5] px-3 py-1.5 rounded-full"
            onPress={() => onNavigate('order')}
          >
            <Text className="text-primaryDark text-[12px] font-bold">Order</Text>
          </TouchableOpacity>
        </View>

        <View className="h-[1px] bg-[#F1F5F9] my-3" />

        {/* Item 3 */}
        <View className="flex-row items-center">
          <Image
            source={{ uri: 'https://images.unsplash.com/photo-1558857563-b37d1e89f816?w=160&q=80' }}
            className="w-[54px] h-[54px] rounded-[12px]"
          />
          <View className="flex-1 ml-3">
            <Text className="text-[14px] font-bold text-textMain">Trà Sữa Ô Long Nướng</Text>
            <Text className="text-[11px] text-textMuted mt-0.5">Đã phục vụ 29 ly hôm nay</Text>
            <Text className="text-[13px] font-extrabold text-primaryDark mt-0.5">52.000 đ</Text>
          </View>
          <TouchableOpacity 
            className="bg-[#ECFDF5] px-3 py-1.5 rounded-full"
            onPress={() => onNavigate('order')}
          >
            <Text className="text-primaryDark text-[12px] font-bold">Order</Text>
          </TouchableOpacity>
        </View>

        <View className="h-[1px] bg-[#F1F5F9] my-3" />

        {/* Item 4 */}
        <View className="flex-row items-center">
          <Image
            source={{ uri: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=160&q=80' }}
            className="w-[54px] h-[54px] rounded-[12px]"
          />
          <View className="flex-1 ml-3">
            <Text className="text-[14px] font-bold text-textMain">Croissant Trứng Muối</Text>
            <Text className="text-[11px] text-textMuted mt-0.5">Đã phục vụ 22 cái hôm nay</Text>
            <Text className="text-[13px] font-extrabold text-primaryDark mt-0.5">35.000 đ</Text>
          </View>
          <TouchableOpacity 
            className="bg-[#ECFDF5] px-3 py-1.5 rounded-full"
            onPress={() => onNavigate('order')}
          >
            <Text className="text-primaryDark text-[12px] font-bold">Order</Text>
          </TouchableOpacity>
        </View>
      </View>
      </ScrollView>
    </View>
  );
};
