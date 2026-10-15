import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  RefreshControl, 
  ActivityIndicator 
} from 'react-native';
import { 
  UtensilsCrossed, 
  QrCode, 
  AlertTriangle, 
  Users, 
  CheckCheck,
  BellOff,
  Bell,
  Package,  // for inventory
  BellRing, // for staff call
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NotificationItem } from '../types';
import { useSocketEvent } from '../hooks/useSocket';
import { useNotificationStore } from '../data/notificationStore';
import { useAuthStore } from '../data/authStore';
import { soundService } from '../services/sound';
import { createTaggedLogger } from '../utils/logger';

const log = createTaggedLogger('NOTIF');

export const NotificationScreen: React.FC = () => {
  const insets = useSafeAreaInsets();


  const dynamicContentPaddingBottom = (insets.bottom > 0 ? Math.max(insets.bottom - 16, 6) : 6) + 76;
  const user = useAuthStore((s) => s.user);

  const notifications = useNotificationStore((s) => s.notifications);
  const unreadCount = useNotificationStore((s) => s.unreadCount);
  const isLoading = useNotificationStore((s) => s.isLoading);
  const fetchNotifications = useNotificationStore((s) => s.fetchNotifications);
  const markAsRead = useNotificationStore((s) => s.markAsRead);
  const markAllAsRead = useNotificationStore((s) => s.markAllAsRead);
  const addNotification = useNotificationStore((s) => s.addNotification);

  const [filterType, setFilterType] = useState<'ALL' | 'ORDER' | 'PAYMENT' | 'SYSTEM' | 'INVENTORY'>('ALL');
  const [refreshing, setRefreshing] = useState(false);

  // Tải danh sách thông báo từ backend khi mount
  useEffect(() => {
    fetchNotifications(user?.branchId);
  }, [fetchNotifications, user?.branchId]);

  // Lắng nghe socket sự kiện thời gian thực
  useSocketEvent('notification:new', (newNoti: any) => {
    if (newNoti && newNoti.id) {
      addNotification(newNoti);
    }
  });

  useSocketEvent('order:new', (newOrder: any) => {
    addNotification({
      id: `noti-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      type: 'ORDER',
      title: `Đơn hàng mới: ${newOrder?.code || '#ĐH'}`,
      message: `Bàn ${newOrder?.tableName || 'Mang về'} • ${newOrder?.items?.length || 1} món`,
      time: 'Vừa xong',
      isRead: false,
      createdAt: new Date().toISOString(),
    });
    soundService.play('new_order');
  });

  useSocketEvent('order:updated', (data: any) => {
    // Thông báo khi đơn chuyển trạng thái (PREPARING, READY, DONE)
    if (data?.status === 'PREPARING' || data?.status === 'READY' || data?.status === 'DONE') {
      const statusLabel = data?.status === 'PREPARING' ? 'Đang chế biến' : 
                          data?.status === 'READY' ? 'Sẵn sàng phục vụ' : 'Hoàn thành';
      addNotification({
        id: `noti-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        type: 'ORDER',
        title: `Đơn ${data?.code || '#ĐH'} - ${statusLabel}`,
        message: `Bàn ${data?.tableName || ''} đã chuyển sang ${statusLabel}`,
        time: 'Vừa xong',
        isRead: false,
        createdAt: new Date().toISOString(),
      });
    }
  });

  useSocketEvent('payment:completed', (paymentData: any) => {
    addNotification({
      id: `noti-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      type: 'PAYMENT',
      title: `Thanh toán thành công: ${paymentData?.tableName || 'Khách hàng'}`,
      message: `Đã thu ${
        paymentData?.amount ? `${Number(paymentData.amount).toLocaleString('vi-VN')} đ` : ''
      } • ${paymentData?.method || 'Thành công'}`,
      time: 'Vừa xong',
      isRead: false,
      createdAt: new Date().toISOString(),
    });
    soundService.play('payment_complete');
  });

  useSocketEvent('call_staff:request', (data: any) => {
    addNotification({
      id: `noti-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      type: data?.type === 'PAYMENT' ? 'PAYMENT' : 'ORDER',
      title: `Yêu cầu từ khách: ${data?.tableName || 'Bàn'}`,
      message:
        data?.reason || (data?.type === 'PAYMENT' ? 'Yêu cầu thanh toán' : 'Khách gọi nhân viên'),
      time: 'Vừa xong',
      isRead: false,
      createdAt: new Date().toISOString(),
    });
    soundService.play('staff_call');
  });

  // Mới: Sold out
  useSocketEvent('sold_out:updated', (data: any) => {
    if (data?.isSoldOut) {
      addNotification({
        id: `noti-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        type: 'SYSTEM',
        title: 'Món đã hết hàng',
        message: `Món ${data?.itemName || 'không xác định'} đã được đánh dấu hết hàng`,
        time: 'Vừa xong',
        isRead: false,
        createdAt: new Date().toISOString(),
      });
      soundService.play('sold_out');
    }
  });

  // Mới: Cảnh báo nguyên liệu sắp hết
  useSocketEvent('inventory:warning', (data: any) => {
    addNotification({
      id: `noti-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      type: 'SYSTEM',
      title: 'Cảnh báo nguyên liệu thấp',
      message: `${data?.name || 'Nguyên liệu'} còn ${data?.currentStock} ${data?.unit || ''} (ngưỡng ${data?.threshold})`,
      time: 'Vừa xong',
      isRead: false,
      createdAt: new Date().toISOString(),
    });
    soundService.play('low_stock');
  });

  // Mới: Cập nhật kho (có thể dùng để refresh UI)
  useSocketEvent('inventory:updated', (data: any) => {
    // Chỉ log, không tạo notification để tránh spam
    log.info('Inventory updated', data);
  });

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchNotifications(user?.branchId);
    setRefreshing(false);
  };

  const handleMarkAllAsRead = async () => {
    await markAllAsRead(user?.branchId);
  };

  const filteredList = notifications.filter((item) => {
    if (filterType === 'ALL') return true;
    if (filterType === 'SYSTEM') return item.type === 'SYSTEM' || item.type === 'TABLE';
    if (filterType === 'INVENTORY') return item.type === 'SYSTEM'; // inventory warnings use SYSTEM type
    return item.type === filterType;
  });

  const formatRelativeTime = (createdAt?: string, fallback?: string) => {
    if (!createdAt) return fallback || 'Vừa xong';
    try {
      const diff = Math.floor((Date.now() - new Date(createdAt).getTime()) / 1000);
      if (diff < 60) return 'Vừa xong';
      if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`;
      if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`;
      return `${Math.floor(diff / 86400)} ngày trước`;
    } catch {
      return fallback || 'Vừa xong';
    }
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
          <View className="flex-row items-center gap-2">
            <Text className="text-[20px] font-extrabold text-textMain">Thông Báo Hoạt Động</Text>
            {unreadCount > 0 && (
              <View className="bg-[#EF4444] px-2 py-0.5 rounded-full">
                <Text className="text-[11px] font-bold text-white">{unreadCount}</Text>
              </View>
            )}
          </View>
          {unreadCount > 0 && (
            <TouchableOpacity 
              className="flex-row items-center gap-1 bg-[#ECFDF5] px-2.5 py-1 rounded-full border border-[#A7F3D0]"
              onPress={handleMarkAllAsRead}
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
            activeOpacity={0.8}
          >
            <Text className={`text-[12px] ${filterType === 'ALL' ? 'text-white font-bold' : 'font-semibold text-textSecondary'}`}>
              Tất cả
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            className={`px-3 py-1.5 rounded-full ${filterType === 'ORDER' ? 'bg-primary' : 'bg-[#F1F5F9]'}`}
            onPress={() => setFilterType('ORDER')}
            activeOpacity={0.8}
          >
            <Text className={`text-[12px] ${filterType === 'ORDER' ? 'text-white font-bold' : 'font-semibold text-textSecondary'}`}>
              Đơn mới
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            className={`px-3 py-1.5 rounded-full ${filterType === 'PAYMENT' ? 'bg-primary' : 'bg-[#F1F5F9]'}`}
            onPress={() => setFilterType('PAYMENT')}
            activeOpacity={0.8}
          >
            <Text className={`text-[12px] ${filterType === 'PAYMENT' ? 'text-white font-bold' : 'font-semibold text-textSecondary'}`}>
              Thanh toán
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            className={`px-3 py-1.5 rounded-full ${filterType === 'SYSTEM' ? 'bg-primary' : 'bg-[#F1F5F9]'}`}
            onPress={() => setFilterType('SYSTEM')}
            activeOpacity={0.8}
          >
            <Text className={`text-[12px] ${filterType === 'SYSTEM' ? 'text-white font-bold' : 'font-semibold text-textSecondary'}`}>
              Cảnh báo
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            className={`px-3 py-1.5 rounded-full ${filterType === 'INVENTORY' ? 'bg-primary' : 'bg-[#F1F5F9]'}`}
            onPress={() => setFilterType('INVENTORY')}
            activeOpacity={0.8}
          >
            <Text className={`text-[12px] ${filterType === 'INVENTORY' ? 'text-white font-bold' : 'font-semibold text-textSecondary'}`}>
              Kho
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Notifications List */}
      <ScrollView
        contentContainerStyle={{ 
          padding: 16, 
          paddingTop: 14, 
          paddingBottom: dynamicContentPaddingBottom, 
          gap: 10,
          flexGrow: 1,
        }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={handleRefresh}
            colors={['#10B981']}
            tintColor="#10B981"
          />
        }
      >
        {isLoading && notifications.length === 0 ? (
          <View className="py-20 items-center justify-center">
            <ActivityIndicator size="large" color="#10B981" />
            <Text className="text-[13px] text-textMuted mt-3 font-medium">Đang tải thông báo từ máy chủ...</Text>
          </View>
        ) : filteredList.length === 0 ? (
          <View className="py-24 items-center justify-center px-6">
            <View className="w-16 h-16 rounded-full bg-[#F1F5F9] items-center justify-center mb-3.5">
              <BellOff size={28} color="#94A3B8" />
            </View>
            <Text className="text-[15.5px] font-bold text-textMain mb-1.5">Không có thông báo nào</Text>
            <Text className="text-[12.5px] text-textMuted text-center leading-[19px]">
              Tất cả thông báo đơn hàng, thanh toán và cảnh báo hệ thống sẽ tự động cập nhật tại đây.
            </Text>
          </View>
        ) : (
          filteredList.map((item) => (
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
                <Text className="text-[11px] text-textMuted mt-1.5">{formatRelativeTime(item.createdAt, item.time)}</Text>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </View>
  );
};

export default NotificationScreen;
