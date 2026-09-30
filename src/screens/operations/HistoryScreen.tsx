import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import {
  ArrowLeft,
  Search,
  X,
  Clock,
  User,
  Pencil,
  RotateCcw,
  Trash2,
  MoreVertical,
  RefreshCw,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useHistoryStore, OrderHistoryItem } from '../../data/historyStore';
import { api } from '../../services/api';
export { OrderHistoryItem };

interface HistoryScreenProps {
  onBack: () => void;
  onEditOrder?: (order: OrderHistoryItem) => void;
}

export const HistoryScreen: React.FC<HistoryScreenProps> = ({ onBack, onEditOrder }) => {
  const insets = useSafeAreaInsets();
  const dynamicPaddingBottom = insets.bottom > 0 ? Math.max(insets.bottom - 16, 6) : 6;
  const { orders, voidOrder, restoreOrder } = useHistoryStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'COMPLETED' | 'VOIDED'>('ALL');
  const [detailOrderId, setDetailOrderId] = useState<string | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
  };

  const loadHistory = useCallback(async (search?: string) => {
    try {
      setLoading(true);
      const res = await api.getOrderHistory({ search, limit: 20 });
      if (res && res.orders && res.orders.length > 0) {
        const addOrder = useHistoryStore.getState().addOrder;
        res.orders.forEach((o) => {
          if (!orders.some((existing) => existing.id === o.code || existing.id === o.id)) {
            addOrder({
              id: o.code,
              table: (o as any).tableName || ((o as any).tableId ? `Bàn ${(o as any).tableId}` : o.customerName || 'Mang về'),
              time: o.time,
              total: o.total,
              status: o.status === 'DONE' ? 'COMPLETED' : 'VOIDED',
              method: o.paymentMethod === 'VIETQR' ? 'VietQR' : 'Tiền mặt',
              staff: o.customerName || 'Nhân viên',
              items: o.items.map((it) => ({ name: it.name, qty: it.quantity, price: it.price })),
            });
          }
        });
      }
    } catch (err: any) {
      console.log('[HistoryScreen] Local history fallback:', err.message);
    } finally {
      setLoading(false);
    }
  }, [orders]);

  useEffect(() => {
    loadHistory(searchQuery);
  }, [searchQuery, loadHistory]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadHistory(searchQuery);
    setRefreshing(false);
  };

  const completedCount = orders.filter((o) => o.status === 'COMPLETED').length;
  const voidedCount = orders.filter((o) => o.status === 'VOIDED').length;

  const filteredOrders = orders.filter((order) => {
    const matchSearch =
      order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.table.toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatus =
      filterStatus === 'ALL' ? true : order.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const handleVoidOrder = (order: OrderHistoryItem) => {
    Alert.alert('Huỷ đơn', `Bạn có chắc muốn huỷ ${order.id} (${order.table})?`, [
      { text: 'Không', style: 'cancel' },
      {
        text: 'Huỷ đơn',
        style: 'destructive',
        onPress: () => {
          voidOrder(order.id);
        },
      },
    ]);
  };

  const handleEditOrder = (order: OrderHistoryItem) => {
    if (onEditOrder) {
      onEditOrder(order);
    }
  };

  const handleRestoreOrder = (order: OrderHistoryItem) => {
    Alert.alert('Hoàn tác', `Khôi phục ${order.id} về trạng thái thành công?`, [
      { text: 'Không', style: 'cancel' },
      {
        text: 'Hoàn tác',
        onPress: () => {
          restoreOrder(order.id);
        },
      },
    ]);
  };

  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const detailOrder = orders.find((o) => o.id === detailOrderId) || null;

  const contentPaddingBottom = dynamicPaddingBottom + 16;

  // TRANG CHI TIẾT RIÊNG - bấm 1 lần vào đơn là vào, góc phải có 3 chấm dọc
  if (detailOrder) {
    return (
      <View className="flex-1 bg-background">
        {/* Header với nút back và menu 3 chấm dọc */}
        <View className="bg-white px-4 pt-2.5 pb-3 border-b border-[#F1F5F9] flex-row items-center justify-between">
          <View className="flex-row items-center flex-1">
            <TouchableOpacity className="w-9 h-9 rounded-xl bg-[#F1F5F9] items-center justify-center mr-3 border border-border" onPress={() => setDetailOrderId(null)} activeOpacity={0.7}>
              <ArrowLeft size={18} color="#0F172A" />
            </TouchableOpacity>
            <View className="flex-1">
              <Text className="text-[20px] font-extrabold text-textMain">Chi tiết {detailOrder.id}</Text>
              <Text className="text-[12px] text-textSecondary mt-0.5">{detailOrder.table} • {detailOrder.time} • {detailOrder.staff} • {detailOrder.method}</Text>
            </View>
          </View>
          <TouchableOpacity
            className="w-9 h-9 items-center justify-center ml-2"
            onPress={() => setIsMenuOpen(true)}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <MoreVertical size={20} color="#0F172A" />
          </TouchableOpacity>
        </View>

        <ScrollView
          className="flex-1"
          contentContainerStyle={{ padding: 16, paddingBottom: contentPaddingBottom, gap: 14 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Thông tin chung */}
          <View className="bg-white rounded-[20px] p-4 border border-border">
            <View className="flex-row justify-between items-center py-2">
              <Text className="text-[13px] text-textSecondary">Mã đơn</Text>
              <Text className="text-[13.5px] font-bold text-textMain">{detailOrder.id}</Text>
            </View>
            <View className="h-[1px] bg-[#F1F5F9]" />
            <View className="flex-row justify-between items-center py-2">
              <Text className="text-[13px] text-textSecondary">Bàn</Text>
              <Text className="text-[13.5px] font-bold text-textMain">{detailOrder.table}</Text>
            </View>
            <View className="h-[1px] bg-[#F1F5F9]" />
            <View className="flex-row justify-between items-center py-2">
              <Text className="text-[13px] text-textSecondary">Thời gian</Text>
              <Text className="text-[13.5px] font-bold text-textMain">{detailOrder.time}</Text>
            </View>
            <View className="h-[1px] bg-[#F1F5F9]" />
            <View className="flex-row justify-between items-center py-2">
              <Text className="text-[13px] text-textSecondary">Thu ngân</Text>
              <Text className="text-[13.5px] font-bold text-textMain">{detailOrder.staff}</Text>
            </View>
            <View className="h-[1px] bg-[#F1F5F9]" />
            <View className="flex-row justify-between items-center py-2">
              <Text className="text-[13px] text-textSecondary">Trạng thái</Text>
              <View className={`px-2 py-0.5 rounded-full ${detailOrder.status === 'VOIDED' ? 'bg-[#FEE2E2]' : 'bg-[#ECFDF5]'}`}>
                <Text className={`text-[11px] font-bold ${detailOrder.status === 'VOIDED' ? 'text-[#DC2626]' : 'text-[#059669]'}`}>
                  {detailOrder.status === 'VOIDED' ? 'Đã huỷ' : 'Thành công'}
                </Text>
              </View>
            </View>
          </View>

          {/* Danh sách món */}
          <View className="bg-white rounded-[20px] p-4 border border-border">
            <Text className="text-[14px] font-extrabold text-textMain mb-3">Món đã gọi ({detailOrder.items.length})</Text>
            {detailOrder.items.map((item, idx) => (
              <View key={idx} className="flex-row justify-between items-center py-2 border-b border-[#F8FAFC]">
                <View className="flex-row items-center flex-1 mr-2">
                  <Text className="text-[13px] font-black text-primaryDark mr-2">{item.qty}x</Text>
                  <Text className="text-[13.5px] font-semibold text-textMain flex-1">{item.name}</Text>
                </View>
                <Text className="text-[13.5px] font-bold text-textMain">{formatCurrency(item.qty * item.price)}</Text>
              </View>
            ))}
            <View className="flex-row justify-between items-center pt-3 mt-1">
              <Text className="text-[14px] font-bold text-textSecondary">Tổng cộng ({detailOrder.method}):</Text>
              <Text className="text-[18px] font-black text-primaryDark">{formatCurrency(detailOrder.total)}</Text>
            </View>
          </View>
        </ScrollView>

        {/* Menu 3 chấm dọc - chỉ sổ xuống tại chỗ, không làm xám màn hình */}
        {isMenuOpen && (
          <>
            <TouchableOpacity className="absolute inset-0 z-10" activeOpacity={1} onPress={() => setIsMenuOpen(false)} />
            <View className="absolute top-[56px] right-4 bg-white rounded-2xl border border-border overflow-hidden min-w-[160px] z-20" style={{ shadowColor: '#0F172A', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10, elevation: 8 }}>
              {detailOrder.status === 'COMPLETED' ? (
                <>
                  <TouchableOpacity
                    className="flex-row items-center gap-2.5 px-4 py-3 active:bg-slate-50"
                    onPress={() => {
                      setIsMenuOpen(false);
                      handleVoidOrder(detailOrder);
                    }}
                    activeOpacity={0.7}
                  >
                    <Trash2 size={16} color="#E11D48" />
                    <Text className="text-[13px] font-bold text-[#E11D48]">Huỷ đơn</Text>
                  </TouchableOpacity>
                  <View className="h-[1px] bg-slate-100" />
                  <TouchableOpacity
                    className="flex-row items-center gap-2.5 px-4 py-3 active:bg-slate-50"
                    onPress={() => {
                      setIsMenuOpen(false);
                      const t = detailOrder;
                      setDetailOrderId(null);
                      handleEditOrder(t);
                    }}
                    activeOpacity={0.7}
                  >
                    <Pencil size={16} color="#0F172A" />
                    <Text className="text-[13px] font-bold text-textMain">Sửa đơn</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <TouchableOpacity
                  className="flex-row items-center gap-2.5 px-4 py-3 active:bg-slate-50"
                  onPress={() => {
                    setIsMenuOpen(false);
                    handleRestoreOrder(detailOrder);
                  }}
                  activeOpacity={0.7}
                >
                  <RotateCcw size={16} color="#059669" />
                  <Text className="text-[13px] font-bold text-[#059669]">Hoàn tác</Text>
                </TouchableOpacity>
              )}
            </View>
          </>
        )}
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      {/* Header Bar */}
      <View className="bg-white px-4 pt-2.5 pb-3 border-b border-[#F1F5F9]">
        <View className="flex-row items-center mb-2.5">
          <TouchableOpacity className="w-9 h-9 rounded-xl bg-[#F1F5F9] items-center justify-center mr-3 border border-border" onPress={onBack} activeOpacity={0.7}>
            <ArrowLeft size={18} color="#0F172A" />
          </TouchableOpacity>
          <View className="flex-1">
            <Text className="text-[20px] font-extrabold text-textMain">Lịch Sử Đơn</Text>
          </View>
        </View>

        {/* Search */}
        <View className="flex-row items-center bg-[#F8FAFC] rounded-xl px-3.5 h-[40px] border border-border gap-2 mb-2.5">
          <Search size={16} color="#94A3B8" />
          <TextInput
            className="flex-1 text-[13.5px] font-medium text-textMain p-0"
            placeholder="Tìm kiếm..."
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <X size={16} color="#94A3B8" />
            </TouchableOpacity>
          )}
        </View>

        {/* Filter Pills */}
        <View className="flex-row gap-2">
          {[
            { key: 'ALL', label: `Tất cả (${orders.length})` },
            { key: 'COMPLETED', label: `Đã thanh toán (${completedCount})` },
            { key: 'VOIDED', label: `Đã huỷ (${voidedCount})` },
          ].map((tab) => (
            <TouchableOpacity
              key={tab.key}
              className={`px-3 py-1.5 rounded-full border ${
                filterStatus === tab.key ? 'bg-[#F0FDFA] border-[#99F6E4]' : 'bg-[#F8FAFC] border-border'
              }`}
              onPress={() => setFilterStatus(tab.key as any)}
              activeOpacity={0.75}
            >
              <Text
                className={`text-[11.5px] ${
                  filterStatus === tab.key ? 'text-[#0D9488] font-bold' : 'font-semibold text-textSecondary'
                }`}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* List */}
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 16, paddingBottom: contentPaddingBottom, gap: 12 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#0D9488']} />}
      >
        {filteredOrders.map((order) => {
          const isVoided = order.status === 'VOIDED';

          return (
            <TouchableOpacity
              key={order.id}
              className={`bg-white rounded-[18px] p-3.5 border min-h-[92px] justify-center ${
                isVoided ? 'bg-[#FFF5F5] border-[#FECDD3]' : 'border-border'
              }`}
              style={{
                shadowColor: '#0F172A',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.05,
                shadowRadius: 10,
                elevation: 2,
              }}
              onPress={() => setDetailOrderId(order.id)}
              activeOpacity={0.8}
            >
              <View className="flex-row justify-between items-center">
                <View className="flex-1 mr-2">
                  <View className="flex-row items-center gap-2 mb-1.5">
                    <Text className="text-[15px] font-extrabold text-textMain">{order.id}</Text>
                    <View className="bg-[#F1F5F9] px-2 py-0.5 rounded-full">
                      <Text className="text-[11px] font-bold text-textSecondary">{order.table}</Text>
                    </View>
                  </View>
                  <View className="flex-row items-center gap-1.5">
                    <Clock size={12} color="#475569" />
                    <Text className="text-[11px] text-textSecondary">{order.time}</Text>
                    <Text className="text-textMuted">•</Text>
                    <User size={12} color="#475569" />
                    <Text className="text-[11px] text-textSecondary">{order.staff}</Text>
                    <Text className="text-textMuted">•</Text>
                    <Text className="text-[11px] text-textSecondary">{order.method}</Text>
                  </View>
                </View>

                <View className="items-end">
                  <Text className={`text-[15px] font-black ${isVoided ? 'text-[#94A3B8] line-through' : 'text-primaryDark'}`}>
                    {formatCurrency(order.total)}
                  </Text>
                  <View
                    className={`px-2 py-0.5 rounded-full mt-1 ${
                      isVoided ? 'bg-[#FEE2E2]' : 'bg-[#ECFDF5]'
                    }`}
                  >
                    <Text
                      className={`text-[10.5px] font-bold ${
                        isVoided ? 'text-[#DC2626]' : 'text-[#059669]'
                      }`}
                    >
                      {isVoided ? 'Đã huỷ' : 'Thành công'}
                    </Text>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};
