import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Home, TrendingUp, LayoutGrid, Bell, Settings } from 'lucide-react-native';
import { TabType } from '../types';

interface BottomNavProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  cartCount?: number;
  unreadNotificationsCount?: number;
  bottomInset?: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onTabChange,
  cartCount = 0,
  unreadNotificationsCount = 0,
  bottomInset = 0,
}) => {
  // Hạ xuống gần đường viền vật lý một tí (giảm bớt khoảng đệm dư thừa)
  const dynamicPaddingBottom = bottomInset > 0 ? Math.max(bottomInset - 16, 6) : 6;

  return (
    <View
      className="absolute bottom-0 left-0 right-0 bg-transparent items-center px-4"
      style={{ paddingBottom: dynamicPaddingBottom }}
    >
      <View
        className="flex-row items-center justify-between w-full max-w-[500px] h-[60px] bg-white rounded-[30px] px-2 border border-border"
        style={{
          shadowColor: '#0F172A',
          shadowOffset: { width: 0, height: -3 },
          shadowOpacity: 0.08,
          shadowRadius: 12,
          elevation: 8,
        }}
      >
        {/* Tab 1: Trang chủ */}
        <TouchableOpacity
          className="flex-1 h-full items-center justify-center"
          onPress={() => onTabChange('home')}
          activeOpacity={0.7}
        >
          <View
            className={`w-11 h-11 rounded-full items-center justify-center relative ${
              activeTab === 'home' ? 'bg-[#ECFDF5]' : ''
            }`}
          >
            <Home
              size={25}
              color={activeTab === 'home' ? '#10B981' : '#94A3B8'}
              strokeWidth={activeTab === 'home' ? 2.5 : 2}
            />
          </View>
        </TouchableOpacity>

        {/* Tab 2: Doanh thu */}
        <TouchableOpacity
          className="flex-1 h-full items-center justify-center"
          onPress={() => onTabChange('revenue')}
          activeOpacity={0.7}
        >
          <View
            className={`w-11 h-11 rounded-full items-center justify-center relative ${
              activeTab === 'revenue' ? 'bg-[#ECFDF5]' : ''
            }`}
          >
            <TrendingUp
              size={25}
              color={activeTab === 'revenue' ? '#10B981' : '#94A3B8'}
              strokeWidth={activeTab === 'revenue' ? 2.5 : 2}
            />
          </View>
        </TouchableOpacity>

        {/* Tab 3 (CENTER): Thao tác (Order) */}
        <View className="flex-1 items-center justify-center -mt-5">
          <TouchableOpacity
            className={`w-[62px] h-[62px] rounded-[31px] items-center justify-center border-4 border-white ${
              activeTab === 'order' ? 'bg-primaryDark' : 'bg-primary'
            }`}
            style={{
              shadowColor: '#059669',
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: 0.35,
              shadowRadius: 10,
              elevation: 8,
            }}
            onPress={() => onTabChange('order')}
            activeOpacity={0.85}
          >
            <LayoutGrid size={28} color="#FFFFFF" strokeWidth={2.4} />

            {/* Badge */}
            {cartCount > 0 && (
              <View className="absolute -top-1 -right-1 bg-[#EF4444] min-w-[20px] h-[20px] rounded-full items-center justify-center px-1 border-2 border-white">
                <Text className="text-white text-[10px] font-extrabold">
                  {cartCount > 99 ? '99+' : cartCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Tab 4: Thông báo */}
        <TouchableOpacity
          className="flex-1 h-full items-center justify-center"
          onPress={() => onTabChange('notifications')}
          activeOpacity={0.7}
        >
          <View
            className={`w-11 h-11 rounded-full items-center justify-center relative ${
              activeTab === 'notifications' ? 'bg-[#ECFDF5]' : ''
            }`}
          >
            <Bell
              size={25}
              color={activeTab === 'notifications' ? '#10B981' : '#94A3B8'}
              strokeWidth={activeTab === 'notifications' ? 2.5 : 2}
            />
            {unreadNotificationsCount > 0 && (
              <View className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#EF4444] border-[1.5px] border-white" />
            )}
          </View>
        </TouchableOpacity>

        {/* Tab 5: Cài đặt */}
        <TouchableOpacity
          className="flex-1 h-full items-center justify-center"
          onPress={() => onTabChange('settings')}
          activeOpacity={0.7}
        >
          <View
            className={`w-11 h-11 rounded-full items-center justify-center relative ${
              activeTab === 'settings' ? 'bg-[#ECFDF5]' : ''
            }`}
          >
            <Settings
              size={25}
              color={activeTab === 'settings' ? '#10B981' : '#94A3B8'}
              strokeWidth={activeTab === 'settings' ? 2.5 : 2}
            />
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
};
