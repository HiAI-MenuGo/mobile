import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { 
  UtensilsCrossed, 
  QrCode, 
  AlertTriangle, 
  Users, 
  CheckCheck,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NotificationItem } from '../types';
import { useSocketEvent } from '../hooks/useSocket';

export const NotificationScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const dynamicContentPaddingBottom = (insets.bottom > 0 ? Math.max(insets.bottom - 16, 6) : 6) + 76;
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [filterType, setFilterType] = useState<'ALL' | 'ORDER' | 'PAYMENT' | 'SYSTEM'>('ALL');

  useSocketEvent('order:new', (newOrder: any) => {
    setNotifications((prev) => [
      {
        id: `noti-${Date.now()}`,
        type: 'ORDER',
        title: `Đơn hàng mới: ${newOrder?.code || '#ĐH'}`,
        message: `Bàn ${newOrder?.tableName || 'Mang về'} • ${newOrder?.items?.length || 1} món`,
        time: 'Vừa xong',
        isRead: false,
      },
      ...prev,
    ]);
  });

  const filteredList = notifications.filter((item) => {
    if (filterType === 'ALL') return true;
    return item.type === filterType;
  });

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const markAllAsRead = () => {
    setNotifications(notifications.map((n) => ({ ...n, isRead: true })));
  };

  const markAsRead = (id: string) => {
    setNotifications(
      notifications.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
  };

  const renderIcon = (type: NotificationItem['type']) => {
    switch (type) {
      case 'ORDER':
        return <UtensilsCrossed size={18} color="#059669" />;
      case 'PAYMENT':
        return <QrCode size={18} color="#2563EB" />;
      case 'TABLE':
        return <Users size={18} color="#D97706" />;
      case 'SYSTEM':
      default:
        return <AlertTriangle size={18} color="#DC2626" />;
    }
  };

  const getIconBg = (type: NotificationItem['type']) => {
    switch (type) {
      case 'ORDER':
        return 'bg-[#ECFDF5]';
      case 'PAYMENT':
        return 'bg-[#EFF6FF]';
      case 'TABLE':
        return 'bg-[#FEF3C7]';
      case 'SYSTEM':
      default:
        return 'bg-[#FEE2E2]';
    }
  };

  return (
    <View className="flex-1 bg-background">
      {/* Header */}
      <View className="bg-white px-4 pt-2.5 pb-3 border-b border-[#F1F5F9]">
        <View className="flex-row justify-between items-center mb-2.5">
          <Text className="text-[20px] font-extrabold text-textMain">Thông Báo Hoạt Động</Text>
          {unreadCount > 0 && (
            <TouchableOpacity 
              className="flex-row items-center gap-1 bg-[#ECFDF5] px-2.5 py-1 rounded-full border border-[#A7F3D0]"
              onPress={markAllAsRead}
              activeOpacity={0.8}
            >
              <CheckCheck size={13} color="#059669" />
              <Text className="text-[11.5px] font-bold text-primaryDark">Đã đọc hết</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Filter Pills */}
        <View className="flex-row gap-2">
          <TouchableOpacity
            className={`px-3 py-1.5 rounded-full ${filterType === 'ALL' ? 'bg-primary' : 'bg-[#F1F5F9]'}`}
            onPress={() => setFilterType('ALL')}
          >
            <Text className={`text-[12px] ${filterType === 'ALL' ? 'text-white font-bold' : 'font-semibold text-textSecondary'}`}>Tất cả</Text>
          </TouchableOpacity>

          <TouchableOpacity
            className={`px-3 py-1.5 rounded-full ${filterType === 'ORDER' ? 'bg-primary' : 'bg-[#F1F5F9]'}`}
            onPress={() => setFilterType('ORDER')}
          >
            <Text className={`text-[12px] ${filterType === 'ORDER' ? 'text-white font-bold' : 'font-semibold text-textSecondary'}`}>Đơn mới</Text>
          </TouchableOpacity>

          <TouchableOpacity
            className={`px-3 py-1.5 rounded-full ${filterType === 'PAYMENT' ? 'bg-primary' : 'bg-[#F1F5F9]'}`}
            onPress={() => setFilterType('PAYMENT')}
          >
            <Text className={`text-[12px] ${filterType === 'PAYMENT' ? 'text-white font-bold' : 'font-semibold text-textSecondary'}`}>Thanh toán</Text>
          </TouchableOpacity>

          <TouchableOpacity
            className={`px-3 py-1.5 rounded-full ${filterType === 'SYSTEM' ? 'bg-primary' : 'bg-[#F1F5F9]'}`}
            onPress={() => setFilterType('SYSTEM')}
          >
            <Text className={`text-[12px] ${filterType === 'SYSTEM' ? 'text-white font-bold' : 'font-semibold text-textSecondary'}`}>Cảnh báo</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Notifications List */}
      <ScrollView
        contentContainerStyle={{ padding: 16, paddingTop: 14, paddingBottom: dynamicContentPaddingBottom, gap: 10 }}
        showsVerticalScrollIndicator={false}
      >
        {filteredList.map((item) => (
          <TouchableOpacity
            key={item.id}
            className={`flex-row rounded-[18px] p-3.5 border ${
              !item.isRead ? 'bg-[#F9FEFB] border-[#A7F3D0]' : 'bg-white border-border'
            }`}
            style={{
              shadowColor: '#0F172A',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.05,
              shadowRadius: 10,
              elevation: 2,
            }}
            activeOpacity={0.85}
            onPress={() => markAsRead(item.id)}
          >
            <View className={`w-[42px] h-[42px] rounded-[12px] justify-center items-center ${getIconBg(item.type)}`}>
              {renderIcon(item.type)}
            </View>

            <View className="flex-1 ml-3">
              <View className="flex-row justify-between items-center mb-1">
                <Text className="text-[13.5px] font-bold text-textMain flex-1">{item.title}</Text>
                {!item.isRead && <View className="w-2 h-2 rounded-full bg-primary ml-1.5" />}
              </View>
              <Text className="text-[12.5px] text-textSecondary leading-[18px]">{item.message}</Text>
              <Text className="text-[11px] text-textMuted mt-1.5">{item.time}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};
