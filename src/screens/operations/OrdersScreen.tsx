import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Image,
} from 'react-native';
import {
  ArrowLeft,
  Search,
  Clock,
  CheckCircle2,
  X,
  ChevronRight,
  Check,
  UtensilsCrossed,
  ShoppingBag,
  Timer,
  AlertTriangle,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LiveOrder, LiveOrderStatus } from '../../types';
import { useMenuStore } from '../../data/menuStore';
import { api } from '../../services/api';
import { useSocketEvent } from '../../hooks/useSocket';
import { soundService } from '../../services/sound';

export interface OrdersScreenProps {
  orders?: LiveOrder[];
  onBack: () => void;
  onNewOrder?: () => void;
}

export const initialMockOrders: LiveOrder[] = [
  {
    id: 'ord-101',
    code: '#ĐH-101',
    time: '2 phút trước',
    status: 'PENDING',
    customerName: 'Khách hẹn lấy đơn',
    items: [
      {
        id: 'i1',
        name: 'Cà Phê Muối Hoàng Gia',
        quantity: 2,
        price: 39000,
        note: 'Ít đường, nhiều đá',
        imageUrl: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=120&q=80',
      },
      {
        id: 'i2',
        name: 'Bạc Xỉu Sài Gòn',
        quantity: 1,
        price: 35000,
        note: 'Sữa tươi nhiều',
        imageUrl: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=120&q=80',
      },
    ],
    note: 'Lấy quai xách mang về & 3 ống hút',
    total: 113000,
    paymentStatus: 'UNPAID',
    paymentMethod: 'CASH',
  },
  {
    id: 'ord-102',
    code: '#ĐH-102',
    time: '5 phút trước',
    status: 'PENDING',
    customerName: 'Khách bàn ghế xanh',
    items: [
      {
        id: 'i3',
        name: 'Trà Đào Cam Sả',
        quantity: 2,
        price: 42000,
        note: 'Nhiều đào miếng',
        imageUrl: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=120&q=80',
      },
      {
        id: 'i4',
        name: 'Trà Sen Vàng Macchiato',
        quantity: 1,
        price: 49000,
        note: 'Ít ngọt',
        imageUrl: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=120&q=80',
      },
    ],
    note: 'Ngồi ghế góc ngoài vỉa hè',
    total: 133000,
    paymentStatus: 'UNPAID',
    paymentMethod: 'VIETQR',
  },
  {
    id: 'ord-103',
    code: '#ĐH-103',
    time: '8 phút trước',
    status: 'PENDING',
    customerName: 'Khách xe máy ghé lấy',
    items: [
      {
        id: 'i5',
        name: 'Cà Phê Đen Đá',
        quantity: 2,
        price: 29000,
        note: 'Đậm vị, không đường',
        imageUrl: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=120&q=80',
      },
    ],
    note: 'Khách đang đứng chờ ngoài xe',
    total: 58000,
    paymentStatus: 'PAID',
    paymentMethod: 'VIETQR',
  },
  {
    id: 'ord-104',
    code: '#ĐH-104',
    time: '12 phút trước',
    status: 'CONFIRMED',
    countdownSeconds: 245,
    customerName: 'Khách Grab ghé lấy',
    items: [
      {
        id: 'i6',
        name: 'Trà Sữa Trân Châu Hoàng Kim',
        quantity: 2,
        price: 45000,
        note: '50% đường, 70% đá',
        imageUrl: 'https://images.unsplash.com/photo-1525385133512-2f3bdd039054?w=120&q=80',
      },
      {
        id: 'i7',
        name: 'Matcha Latte Kem Cheese',
        quantity: 1,
        price: 48000,
        imageUrl: 'https://images.unsplash.com/photo-1536256263959-770b48d82b0a?w=120&q=80',
      },
    ],
    note: 'Đóng nắp chắc chắn để đi xa',
    total: 138000,
    paymentStatus: 'PAID',
    paymentMethod: 'VIETQR',
  },
  {
    id: 'ord-105',
    code: '#ĐH-105',
    time: '15 phút trước',
    status: 'CONFIRMED',
    countdownSeconds: 0,
    customerName: 'Khách ngồi trước quán',
    items: [
      {
        id: 'i8',
        name: 'Bạc Xỉu Sài Gòn',
        quantity: 2,
        price: 35000,
        imageUrl: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=120&q=80',
      },
      {
        id: 'i9',
        name: 'Bánh Mì Chảo Đặc Biệt',
        quantity: 1,
        price: 55000,
        note: 'Trứng lòng đào, thêm pate',
        imageUrl: 'https://images.unsplash.com/photo-1509722747041-616f39b57569?w=120&q=80',
      },
    ],
    note: 'Làm nóng bánh mì giòn',
    total: 125000,
    paymentStatus: 'UNPAID',
    paymentMethod: 'CASH',
  },
  {
    id: 'ord-106',
    code: '#ĐH-106',
    time: '18 phút trước',
    status: 'CONFIRMED',
    countdownSeconds: 25,
    customerName: 'Nhóm bạn 3 người',
    items: [
      {
        id: 'i10',
        name: 'Nước Ép Cam Tươi',
        quantity: 3,
        price: 38000,
        note: 'Không đường hóa học',
        imageUrl: 'https://images.unsplash.com/photo-1613478223719-2ab802602423?w=120&q=80',
      },
    ],
    note: 'Cho 3 ly đá riêng',
    total: 114000,
    paymentStatus: 'PAID',
    paymentMethod: 'CASH',
  },
  {
    id: 'ord-107',
    code: '#ĐH-107',
    time: '24 phút trước',
    status: 'DONE',
    customerName: 'Anh Tuấn văn phòng',
    items: [
      {
        id: 'i11',
        name: 'Cà Phê Muối Hoàng Gia',
        quantity: 3,
        price: 39000,
        imageUrl: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=120&q=80',
      },
    ],
    note: 'Đã hoàn tất, sẵn sàng giao',
    total: 117000,
    paymentStatus: 'PAID',
    paymentMethod: 'VIETQR',
  },
  {
    id: 'ord-108',
    code: '#ĐH-108',
    time: '30 phút trước',
    status: 'DONE',
    customerName: 'Khách bàn số 2',
    items: [
      {
        id: 'i12',
        name: 'Trà Đào Cam Sả',
        quantity: 1,
        price: 42000,
        imageUrl: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=120&q=80',
      },
      {
        id: 'i13',
        name: 'Cà Phê Sữa Đá Sài Gòn',
        quantity: 1,
        price: 32000,
        imageUrl: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=120&q=80',
      },
    ],
    note: 'Đã bưng ra bàn cho khách',
    total: 74000,
    paymentStatus: 'PAID',
    paymentMethod: 'CASH',
  },
];

export const OrdersScreen: React.FC<OrdersScreenProps> = ({
  orders: externalOrders,
  onBack,
  onNewOrder,
}) => {
  const insets = useSafeAreaInsets();
  const dynamicPaddingBottom = insets.bottom > 0 ? Math.max(insets.bottom - 16, 6) : 6;
  const contentPaddingBottom = dynamicPaddingBottom + 16;

  const [orders, setOrders] = useState<LiveOrder[]>(externalOrders || []);
  const [activeTab, setActiveTab] = useState<LiveOrderStatus>('PENDING');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<LiveOrder | null>(null);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
  };

  const formatCountdown = (seconds?: number) => {
    if (seconds === undefined || seconds === null) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setOrders((prev) =>
        prev.map((ord) => {
          if (ord.status === 'CONFIRMED' && ord.countdownSeconds !== undefined) {
            return {
              ...ord,
              countdownSeconds: Math.max(0, ord.countdownSeconds - 1),
            };
          }
          return ord;
        })
      );
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const pendingOrders = orders.filter((o) => o.status === 'PENDING');
  const confirmedOrders = orders.filter((o) => o.status === 'CONFIRMED');
  const doneOrders = orders.filter((o) => o.status === 'DONE');

  const currentTabOrders = orders.filter((o) => {
    const matchStatus = o.status === activeTab;
    const matchSearch =
      searchQuery.trim() === '' ||
      o.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (o.customerName && o.customerName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      o.items.some((it) => it.name.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchStatus && matchSearch;
  });

  // Tải danh sách đơn active từ API khi mount (Task B-006)
  useEffect(() => {
    api.getActiveOrders()
      .then((data) => {
        if (data) {
          setOrders(data);
        }
      })
      .catch((err) => {
        console.log('[OrdersScreen] Active orders API fallback:', err.message);
      });
  }, []);

  // Lắng nghe Socket.IO sự kiện đơn hàng live (Task B-006 & Task B-003)
  useSocketEvent('order:new', (newOrder: LiveOrder) => {
    console.log('⚡ [OrdersScreen] New order received via Socket:', newOrder.code);
    soundService.playNewOrderAlert();
    setOrders((prev) => [newOrder, ...prev.filter((o) => o.id !== newOrder.id)]);
  });

  useSocketEvent('order:updated', (payload: { orderId: string; status: LiveOrderStatus }) => {
    console.log('⚡ [OrdersScreen] Order status updated via Socket:', payload);
    setOrders((prev) =>
      prev.map((o) => (o.id === payload.orderId ? { ...o, status: payload.status } : o))
    );
  });

  useSocketEvent('order:voided', (payload: { orderId: string }) => {
    console.log('⚡ [OrdersScreen] Order voided via Socket:', payload);
    setOrders((prev) => prev.filter((o) => o.id !== payload.orderId));
    if (selectedOrder?.id === payload.orderId) {
      setSelectedOrder(null);
    }
  });

  const handleUpdateOrderStatus = (orderId: string, nextStatus: LiveOrderStatus) => {
    const menuItems = useMenuStore.getState().items;
    const getPrepSecondsForOrder = (order: LiveOrder) => {
      const maxMinutes = Math.max(
        ...order.items.map((it) => {
          const menu = menuItems.find((m) => m.name === it.name || m.id === it.id);
          return menu?.prepTimeMinutes ?? 10;
        }),
        10
      );
      return maxMinutes * 60;
    };

    // Cập nhật optimistic local state
    setOrders((prev) =>
      prev.map((o) => {
        if (o.id === orderId) {
          return {
            ...o,
            status: nextStatus,
            countdownSeconds: nextStatus === 'CONFIRMED' ? getPrepSecondsForOrder(o) : o.countdownSeconds,
          };
        }
        return o;
      })
    );

    if (selectedOrder && selectedOrder.id === orderId) {
      setSelectedOrder((prev) =>
        prev
          ? {
              ...prev,
              status: nextStatus,
              countdownSeconds: nextStatus === 'CONFIRMED' ? getPrepSecondsForOrder(prev) : prev.countdownSeconds,
            }
          : null
      );
    }

    // Gọi API cập nhật trạng thái đơn (Task B-007)
    api.updateOrderStatus(orderId, nextStatus).catch((err) => {
      console.warn('[OrdersScreen] Failed to update order status via API:', err.message);
    });
  };

  const handleCancelOrder = (orderId: string) => {
    Alert.alert('Huỷ Đơn Hàng', 'Bạn có chắc chắn muốn huỷ đơn này không?', [
      { text: 'Quay lại', style: 'cancel' },
      {
        text: 'Xác nhận huỷ',
        style: 'destructive',
        onPress: () => {
          setOrders((prev) => prev.filter((o) => o.id !== orderId));
          setSelectedOrder(null);
          // Gọi API hủy đơn và hoàn kho (Task B-007)
          api.voidOrder(orderId, 'Hủy bởi thu ngân trên Mobile').catch((err) => {
            console.warn('[OrdersScreen] Failed to void order via API:', err.message);
          });
        },
      },
    ]);
  };

  // TRANG CHI TIẾT RIÊNG BIỆT
  if (selectedOrder) {
    const activeOrder = orders.find((o) => o.id === selectedOrder.id) || selectedOrder;
    const totalItemsCount = activeOrder.items.reduce((s, it) => s + it.quantity, 0);
    const isConfirmed = activeOrder.status === 'CONFIRMED';
    const countdown = activeOrder.countdownSeconds ?? 0;
    const isOverdue = isConfirmed && countdown === 0;
    const hasBottomAction = activeOrder.status === 'PENDING' || activeOrder.status === 'CONFIRMED';
    const detailContentPaddingBottom = hasBottomAction ? dynamicPaddingBottom + 78 : dynamicPaddingBottom + 16;

    return (
      <View className="flex-1 bg-background">
        {/* Header Trang Chi Tiết */}
        <View className="bg-white px-4 pt-2.5 pb-3 border-b border-[#F1F5F9]">
          <View className="flex-row items-center">
            <TouchableOpacity
              className="w-9 h-9 rounded-xl bg-[#F1F5F9] items-center justify-center mr-3 border border-border"
              onPress={() => setSelectedOrder(null)}
              activeOpacity={0.7}
            >
              <ArrowLeft size={18} color="#0F172A" />
            </TouchableOpacity>
            <View className="flex-1">
              <View className="flex-row items-center gap-2">
                <Text className="text-[20px] font-extrabold text-textMain">{activeOrder.code}</Text>
                {isConfirmed && (
                  <View
                    className={`flex-row items-center gap-1 px-2 py-0.5 rounded-full ${
                      isOverdue ? 'bg-[#EF4444]' : 'bg-[#ECFDF5]'
                    }`}
                  >
                    {isOverdue ? (
                      <AlertTriangle size={12} color="#FFFFFF" />
                    ) : (
                      <Timer size={12} color="#059669" />
                    )}
                    <Text
                      className={`text-[11px] font-bold ${
                        isOverdue ? 'text-white' : 'text-primaryDark'
                      }`}
                    >
                      {isOverdue ? '0:00 (Quá hạn!)' : formatCountdown(countdown)}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </View>
        </View>

        {/* Nội dung chi tiết */}
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ padding: 16, paddingBottom: detailContentPaddingBottom, gap: 14 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Card Thông tin khách hàng */}
          <View className="bg-white rounded-[20px] p-4 border border-border">
            <Text className="text-[11px] font-extrabold text-textMuted tracking-[0.8px] mb-3">THÔNG TIN PHỤC VỤ</Text>
            <View className="flex-row justify-between items-center py-1.5">
              <Text className="text-[13px] text-textSecondary">Khách hàng / Vị trí:</Text>
              <Text className="text-[13.5px] font-bold text-textMain">
                {activeOrder.customerName || 'Khách hàng'}
              </Text>
            </View>
            <View className="flex-row justify-between items-center py-1.5 border-t border-[#F8FAFC]">
              <Text className="text-[13px] text-textSecondary">Trạng thái thanh toán:</Text>
              <View
                className={`px-2.5 py-0.5 rounded-full ${
                  activeOrder.paymentStatus === 'PAID' ? 'bg-[#ECFDF5]' : 'bg-[#FEF3C7]'
                }`}
              >
                <Text
                  className={`text-[11px] font-bold ${
                    activeOrder.paymentStatus === 'PAID' ? 'text-primaryDark' : 'text-[#D97706]'
                  }`}
                >
                  {activeOrder.paymentStatus === 'PAID'
                    ? `Đã thanh toán (${activeOrder.paymentMethod === 'VIETQR' ? 'VietQR' : 'Tiền mặt'})`
                    : `Chưa thanh toán (${activeOrder.paymentMethod === 'VIETQR' ? 'VietQR' : 'Tiền mặt'})`}
                </Text>
              </View>
            </View>
          </View>

          {/* Card Danh sách món */}
          <View className="bg-white rounded-[20px] p-4 border border-border">
            <Text className="text-[11px] font-extrabold text-textMuted tracking-[0.8px] mb-3">
              DANH SÁCH MÓN ĐÃ GỌI ({totalItemsCount} món)
            </Text>

            {activeOrder.items.map((it, idx) => (
              <View key={idx} className="flex-row items-center py-2.5 border-b border-[#F8FAFC]">
                {it.imageUrl ? (
                  <Image source={{ uri: it.imageUrl }} className="w-11 h-11 rounded-[10px] bg-[#F1F5F9]" />
                ) : (
                  <View className="w-11 h-11 rounded-[10px] bg-[#F1F5F9] items-center justify-center">
                    <UtensilsCrossed size={16} color="#94A3B8" />
                  </View>
                )}
                <View className="flex-1 ml-3">
                  <Text className="text-[13.5px] font-bold text-textMain">{it.name}</Text>
                  {it.note ? (
                    <Text className="text-[11px] text-[#F59E0B] font-semibold mt-0.5">• Ghi chú: {it.note}</Text>
                  ) : null}
                  <Text className="text-[12px] text-textSecondary mt-0.5">
                    {formatCurrency(it.price)} x {it.quantity}
                  </Text>
                </View>
                <Text className="text-[13.5px] font-extrabold text-textMain">
                  {formatCurrency(it.price * it.quantity)}
                </Text>
              </View>
            ))}
          </View>

          {/* Card Ghi chú */}
          {activeOrder.note ? (
            <View className="bg-[#FFFBEB] rounded-[16px] p-3.5 border border-[#FDE68A]">
              <Text className="text-[12px] font-bold text-[#92400E]">Ghi chú cho quán / pha chế:</Text>
              <Text className="text-[13px] text-[#78350F] mt-1 font-semibold">📝 {activeOrder.note}</Text>
            </View>
          ) : null}

          {/* Tổng kết tiền */}
          <View className="bg-white rounded-[20px] p-4 border border-border">
            <View className="flex-row justify-between items-center py-1">
              <Text className="text-[13px] text-textSecondary">Tạm tính ({totalItemsCount} món):</Text>
              <Text className="text-[13.5px] font-bold text-textMain">{formatCurrency(activeOrder.total)}</Text>
            </View>
            <View className="flex-row justify-between items-center py-1">
              <Text className="text-[13px] text-textSecondary">Giảm giá / Khuyến mãi:</Text>
              <Text className="text-[13.5px] font-bold text-[#10B981]">0 đ</Text>
            </View>
            <View className="flex-row justify-between items-center pt-2.5 mt-1.5 border-t border-[#F1F5F9]">
              <Text className="text-[14.5px] font-extrabold text-textMain">Tổng thanh toán:</Text>
              <Text className="text-[18px] font-black text-primaryDark">
                {formatCurrency(activeOrder.total)}
              </Text>
            </View>
          </View>
        </ScrollView>

        {/* Thanh tác vụ đáy */}
        {hasBottomAction && (
          <View className="absolute bottom-0 left-0 right-0 bg-transparent items-center px-4" style={{ paddingBottom: dynamicPaddingBottom }}>
            <View
              className="w-full max-w-[500px] h-[62px] bg-white rounded-[31px] px-3.5 border border-primaryLight flex-row items-center justify-between"
              style={{
                borderWidth: 1.5,
                shadowColor: '#059669',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.12,
                shadowRadius: 12,
                elevation: 8,
              }}
            >
              {activeOrder.status === 'PENDING' && (
                <View className="flex-1 flex-row items-center gap-2.5">
                  <TouchableOpacity
                    className="bg-[#FFF1F2] px-5 py-[11px] rounded-full border border-[#FECDD3]"
                    onPress={() => handleCancelOrder(activeOrder.id)}
                    activeOpacity={0.8}
                  >
                    <Text className="text-[#E11D48] text-[13.5px] font-bold">Huỷ Đơn</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    className="flex-1 flex-row items-center justify-center gap-1.5 bg-primaryDark py-[11px] rounded-full"
                    onPress={() => handleUpdateOrderStatus(activeOrder.id, 'CONFIRMED')}
                    activeOpacity={0.85}
                  >
                    <Check size={16} color="#FFFFFF" strokeWidth={2.5} />
                    <Text className="text-white text-[13.5px] font-extrabold">Xác Nhận</Text>
                  </TouchableOpacity>
                </View>
              )}

              {activeOrder.status === 'CONFIRMED' && (
                <View className="flex-1">
                  <TouchableOpacity
                    className="flex-row items-center justify-center gap-1.5 bg-primaryDark py-[11px] rounded-full"
                    onPress={() => handleUpdateOrderStatus(activeOrder.id, 'DONE')}
                    activeOpacity={0.85}
                  >
                    <CheckCircle2 size={18} color="#FFFFFF" strokeWidth={2.5} />
                    <Text className="text-white text-[13.5px] font-extrabold">Hoàn Thành</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        )}
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      {/* Header */}
      <View className="bg-white px-4 pt-2.5 pb-3 border-b border-[#F1F5F9]">
        <View className="flex-row items-center mb-2.5">
          <TouchableOpacity className="w-9 h-9 rounded-xl bg-[#F1F5F9] items-center justify-center mr-3 border border-border" onPress={onBack} activeOpacity={0.7}>
            <ArrowLeft size={18} color="#0F172A" />
          </TouchableOpacity>
          <View className="flex-1">
            <Text className="text-[20px] font-extrabold text-textMain">Quản Lý Đơn Hàng</Text>
          </View>
        </View>

        {/* Search */}
        <View className="flex-row items-center bg-[#F8FAFC] rounded-xl px-3.5 h-[40px] border border-border gap-2 mb-3">
          <Search size={16} color="#94A3B8" />
          <TextInput
            placeholder="Tìm kiếm..."
            placeholderTextColor="#94A3B8"
            className="flex-1 text-[13.5px] text-textMain p-0 font-medium"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <X size={16} color="#94A3B8" />
            </TouchableOpacity>
          )}
        </View>

        {/* 3 Mục (Tabs) */}
        <View className="flex-row bg-[#F1F5F9] p-1 rounded-[14px]">
          <TouchableOpacity
            className={`flex-1 flex-row items-center justify-center gap-1.5 py-2 rounded-[10px] ${
              activeTab === 'PENDING' ? 'bg-white' : ''
            }`}
            onPress={() => setActiveTab('PENDING')}
            activeOpacity={0.8}
          >
            <View className="w-2 h-2 rounded-full bg-[#F59E0B]" />
            <Text
              className={`text-[12px] ${
                activeTab === 'PENDING' ? 'text-[#D97706] font-extrabold' : 'font-semibold text-textSecondary'
              }`}
            >
              Đang chờ
            </Text>
            <View
              className={`px-1.5 py-0.5 rounded-full ${
                activeTab === 'PENDING' ? 'bg-[#F59E0B]' : 'bg-[#FEF3C7]'
              }`}
            >
              <Text
                className={`text-[10px] font-extrabold ${
                  activeTab === 'PENDING' ? 'text-white' : 'text-[#D97706]'
                }`}
              >
                {pendingOrders.length}
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            className={`flex-1 flex-row items-center justify-center gap-1.5 py-2 rounded-[10px] ${
              activeTab === 'CONFIRMED' ? 'bg-white' : ''
            }`}
            onPress={() => setActiveTab('CONFIRMED')}
            activeOpacity={0.8}
          >
            <View className="w-2 h-2 rounded-full bg-[#2563EB]" />
            <Text
              className={`text-[12px] ${
                activeTab === 'CONFIRMED' ? 'text-[#2563EB] font-extrabold' : 'font-semibold text-textSecondary'
              }`}
            >
              Đã xác nhận
            </Text>
            <View
              className={`px-1.5 py-0.5 rounded-full ${
                activeTab === 'CONFIRMED' ? 'bg-[#2563EB]' : 'bg-[#EFF6FF]'
              }`}
            >
              <Text
                className={`text-[10px] font-extrabold ${
                  activeTab === 'CONFIRMED' ? 'text-white' : 'text-[#2563EB]'
                }`}
              >
                {confirmedOrders.length}
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            className={`flex-1 flex-row items-center justify-center gap-1.5 py-2 rounded-[10px] ${
              activeTab === 'DONE' ? 'bg-white' : ''
            }`}
            onPress={() => setActiveTab('DONE')}
            activeOpacity={0.8}
          >
            <View className="w-2 h-2 rounded-full bg-[#059669]" />
            <Text
              className={`text-[12px] ${
                activeTab === 'DONE' ? 'text-primaryDark font-extrabold' : 'font-semibold text-textSecondary'
              }`}
            >
              Làm xong
            </Text>
            <View
              className={`px-1.5 py-0.5 rounded-full ${
                activeTab === 'DONE' ? 'bg-primaryDark' : 'bg-[#ECFDF5]'
              }`}
            >
              <Text
                className={`text-[10px] font-extrabold ${
                  activeTab === 'DONE' ? 'text-white' : 'text-primaryDark'
                }`}
              >
                {doneOrders.length}
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {/* Danh sách đơn hàng */}
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 16, paddingBottom: contentPaddingBottom, gap: 12 }}
        showsVerticalScrollIndicator={false}
      >
        {currentTabOrders.length === 0 ? (
          <View className="bg-white rounded-[20px] p-8 items-center border border-border">
            <View className="w-14 h-14 rounded-full bg-[#F1F5F9] items-center justify-center mb-3">
              <ShoppingBag size={28} color="#94A3B8" />
            </View>
            <Text className="text-[15px] font-bold text-textMain mb-1">Không có đơn hàng nào</Text>
            <Text className="text-[12.5px] text-textSecondary text-center">
              {activeTab === 'PENDING'
                ? 'Hiện chưa có đơn mới đang chờ tiếp nhận'
                : activeTab === 'CONFIRMED'
                ? 'Không có đơn nào đang trong quá trình chế biến'
                : 'Chưa có đơn làm xong trong danh sách'}
            </Text>
          </View>
        ) : (
          currentTabOrders.map((order) => {
            const totalItemsCount = order.items.reduce((s, it) => s + it.quantity, 0);

            return (
              <TouchableOpacity
                key={order.id}
                className="bg-white rounded-[18px] p-3.5 border border-border"
                style={{
                  shadowColor: '#0F172A',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.05,
                  shadowRadius: 10,
                  elevation: 2,
                }}
                onPress={() => setSelectedOrder(order)}
                activeOpacity={0.85}
              >
                {/* Header Card */}
                <View className="flex-row justify-between items-center mb-2">
                  <View className="flex-row items-center gap-2">
                    <Text className="text-[15px] font-extrabold text-textMain">{order.code}</Text>
                    {order.status === 'CONFIRMED' && (
                      <View
                        className={`flex-row items-center gap-1 px-2 py-0.5 rounded-full ${
                          order.countdownSeconds === 0 ? 'bg-[#EF4444]' : 'bg-[#ECFDF5]'
                        }`}
                      >
                        {order.countdownSeconds === 0 ? (
                          <AlertTriangle size={10} color="#FFFFFF" />
                        ) : (
                          <Timer size={10} color="#059669" />
                        )}
                        <Text
                          className={`text-[10px] font-bold ${
                            order.countdownSeconds === 0 ? 'text-white' : 'text-primaryDark'
                          }`}
                        >
                          {order.countdownSeconds === 0
                            ? '0:00 (Quá hạn)'
                            : formatCountdown(order.countdownSeconds)}
                        </Text>
                      </View>
                    )}
                  </View>

                  <View className="flex-row items-center gap-1 bg-[#F1F5F9] px-2 py-0.5 rounded-full">
                    <Clock size={11} color="#64748B" />
                    <Text className="text-[11px] text-textSecondary">{order.time}</Text>
                  </View>
                </View>

                {/* Tên khách */}
                {order.customerName && (
                  <Text className="text-[12px] font-semibold text-textSecondary mb-2">{order.customerName}</Text>
                )}

                {/* Danh sách tóm tắt */}
                <View className="bg-[#F8FAFC] rounded-[12px] p-2.5 mb-2.5 gap-1.5">
                  {order.items.map((it, idx) => (
                    <View key={idx} className="flex-row justify-between items-center">
                      <Text className="text-[12px] font-black text-primaryDark mr-1.5">{it.quantity}x</Text>
                      <Text className="text-[12.5px] font-semibold text-textMain flex-1" numberOfLines={1}>
                        {it.name}
                      </Text>
                      <Text className="text-[12px] font-bold text-textSecondary">
                        {formatCurrency(it.price * it.quantity)}
                      </Text>
                    </View>
                  ))}
                </View>

                {/* Ghi chú */}
                {order.note ? (
                  <View className="bg-[#FFFBEB] rounded-[8px] px-2.5 py-1 mb-2.5 border border-[#FEF3C7]">
                    <Text className="text-[11px] text-[#92400E] font-medium" numberOfLines={1}>
                      📝 {order.note}
                    </Text>
                  </View>
                ) : null}

                {/* Footer Card */}
                <View className="flex-row justify-between items-center pt-2.5 border-t border-[#F1F5F9]">
                  <View>
                    <Text className="text-[11px] text-textMuted">
                      {totalItemsCount} món • Tổng tiền
                    </Text>
                    <Text className="text-[14.5px] font-extrabold text-primaryDark">{formatCurrency(order.total)}</Text>
                  </View>

                  <View className="flex-row items-center gap-2">
                    <View
                      className={`px-2.5 py-0.5 rounded-full ${
                        order.paymentStatus === 'PAID' ? 'bg-[#ECFDF5]' : 'bg-[#FEF3C7]'
                      }`}
                    >
                      <Text
                        className={`text-[11px] font-bold ${
                          order.paymentStatus === 'PAID' ? 'text-primaryDark' : 'text-[#D97706]'
                        }`}
                      >
                        {order.paymentStatus === 'PAID' ? 'Đã thu tiền' : 'Chưa thanh toán'}
                      </Text>
                    </View>

                    <ChevronRight size={16} color="#94A3B8" />
                  </View>
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
    </View>
  );
};
