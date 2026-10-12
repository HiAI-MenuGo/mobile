import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import {
  ArrowLeft,
  Users,
  Clock,
  DollarSign,
  Plus,
  CreditCard,
  UtensilsCrossed,
  RefreshCw,
  X,
  CheckCircle2,
  User,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { api } from '../../services/api';
import { useSocketEvent } from '../../hooks/useSocket';

export interface TableItem {
  id: string;
  name: string;
  status: 'EMPTY' | 'OCCUPIED' | 'RESERVED';
  currentSessionId?: string;
  customerCount?: number;
  scannedCustomerCount?: number;
  totalAmount?: number;
  updatedAt?: string;
}

interface TablesScreenProps {
  onBack: () => void;
  onNavigateToOrder?: (tableId: string) => void;
  onNavigateToCashier?: (sessionId: string) => void;
}

export const TablesScreen: React.FC<TablesScreenProps> = ({
  onBack,
  onNavigateToOrder,
  onNavigateToCashier,
}) => {
  const insets = useSafeAreaInsets();
  const dynamicPaddingBottom = insets.bottom > 0 ? Math.max(insets.bottom - 16, 6) : 6;

  const [tables, setTables] = useState<TableItem[]>([]);

  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTable, setSelectedTable] = useState<TableItem | null>(null);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
  };

  const renderSeatIcons = (count: number, maxSeats: number = 10) => {
    const displayCount = Math.min(count, maxSeats);
    const icons = [];
    for (let i = 0; i < displayCount; i++) {
      icons.push(
        <User key={i} size={14} color="#D97706" style={{ marginRight: 2 }} />
      );
    }
    if (count > maxSeats) {
      icons.push(
        <Text key="more" className="text-[11px] font-bold text-amber-600 ml-1">+{count - maxSeats}</Text>
      );
    }
    return icons;
  };

  // Tải danh sách bàn từ API
  const loadTables = async () => {
    try {
      setLoading(true);
      const data = await api.getTables();
      if (data && data.length > 0) {
        setTables(data);
      }
    } catch (err: any) {
      console.log('[TablesScreen] Using fallback tables:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTables();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadTables();
    setRefreshing(false);
  };

  // Lắng nghe cập nhật trạng thái bàn qua Socket.IO (Task B-005)
  useSocketEvent('table:status-changed', (payload: { tableId: string; status: 'EMPTY' | 'OCCUPIED' | 'RESERVED'; scannedCustomerCount?: number }) => {
    console.log('⚡ [TablesScreen] Table status changed:', payload);
    setTables((prev) =>
      prev.map((t) => {
        if (t.id === payload.tableId) {
          const updates: any = { status: payload.status };
          if (payload.status === 'OCCUPIED') {
            updates.scannedCustomerCount = payload.scannedCustomerCount ?? (t.scannedCustomerCount || 1);
          } else if (payload.status === 'EMPTY') {
            updates.scannedCustomerCount = 0;
          }
          return { ...t, ...updates };
        }
        return t;
      })
    );
  });

  // Lắng nghe đơn mới để tăng số ghế khi có khách mới order
  useSocketEvent('order:new', (payload: { tableId?: string; tableName?: string }) => {
    if (!payload.tableId) return;
    console.log('⚡ [TablesScreen] New order for table:', payload.tableId);
    setTables((prev) =>
      prev.map((t) => {
        if (t.id === payload.tableId && t.status === 'OCCUPIED') {
          return { ...t, scannedCustomerCount: (t.scannedCustomerCount || 1) + 1 };
        }
        return t;
      })
    );
  });

  const emptyCount = tables.filter((t) => t.status === 'EMPTY').length;
  const occupiedCount = tables.filter((t) => t.status === 'OCCUPIED').length;
  const reservedCount = tables.filter((t) => t.status === 'RESERVED').length;

  const handleTablePress = (table: TableItem) => {
    setSelectedTable(table);
  };

  const handleQuickStatusChange = async (table: TableItem, nextStatus: 'EMPTY' | 'OCCUPIED' | 'RESERVED') => {
    try {
      setTables((prev) =>
        prev.map((t) => (t.id === table.id ? { ...t, status: nextStatus } : t))
      );
      if (selectedTable?.id === table.id) {
        setSelectedTable((prev) => (prev ? { ...prev, status: nextStatus } : null));
      }
      await api.updateTableStatus(table.id, nextStatus);
    } catch (err: any) {
      Alert.alert('Lỗi', 'Không thể đổi trạng thái bàn');
    }
  };

  return (
    <View className="flex-1 bg-background">
      {/* Header Bar */}
      <View className="bg-white px-4 pt-2.5 pb-3 border-b border-[#F1F5F9]">
        <View className="flex-row items-center justify-between mb-3">
          <View className="flex-row items-center">
            <TouchableOpacity
              className="w-9 h-9 rounded-xl bg-slate-100 items-center justify-center mr-3 border border-border"
              onPress={onBack}
              activeOpacity={0.7}
            >
              <ArrowLeft size={18} color="#0F172A" />
            </TouchableOpacity>
            <View>
              <Text className="text-[20px] font-extrabold text-textMain">Sơ Đồ Bàn Ăn</Text>
            </View>
          </View>
        </View>

        {/* Thanh đếm trạng thái bàn */}
        <View className="flex-row gap-2">
          <View className="flex-1 bg-emerald-50 rounded-xl p-2.5 border border-emerald-200 items-center">
            <Text className="text-[11px] font-bold text-emerald-600">TRỐNG</Text>
            <Text className="text-base font-black text-emerald-700 mt-0.5">{emptyCount} bàn</Text>
          </View>
          <View className="flex-1 bg-amber-50 rounded-xl p-2.5 border border-amber-200 items-center">
            <Text className="text-[11px] font-bold text-amber-600">CÓ KHÁCH</Text>
            <Text className="text-base font-black text-amber-700 mt-0.5">{occupiedCount} bàn</Text>
          </View>
          <View className="flex-1 bg-indigo-50 rounded-xl p-2.5 border border-indigo-200 items-center">
            <Text className="text-[11px] font-bold text-indigo-600">ĐẶT TRƯỚC</Text>
            <Text className="text-base font-black text-indigo-700 mt-0.5">{reservedCount} bàn</Text>
          </View>
        </View>
      </View>

      {/* Grid Bàn */}
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 14, paddingBottom: dynamicPaddingBottom + 16 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#2563EB']} />}
      >
        <View className="flex-row flex-wrap justify-between gap-y-3">
          {tables.map((table) => {
            const isEmpty = table.status === 'EMPTY';
            const isOccupied = table.status === 'OCCUPIED';
            const isReserved = table.status === 'RESERVED';

            return (
              <TouchableOpacity
                key={table.id}
                className={`w-[48%] rounded-2xl p-4 border shadow-sm ${
                  isEmpty
                    ? 'bg-white border-border'
                    : isOccupied
                    ? 'bg-amber-50/50 border-amber-300 border-2'
                    : 'bg-indigo-50/50 border-indigo-300'
                }`}
                onPress={() => handleTablePress(table)}
                activeOpacity={0.8}
              >
                {/* Hàng tên & Icon */}
                <View className="flex-row justify-between items-center mb-2">
                  <Text className="text-base font-black text-textMain">{table.name}</Text>
                  <View
                    className={`w-3 h-3 rounded-full ${
                      isEmpty ? 'bg-emerald-500' : isOccupied ? 'bg-amber-500 animate-pulse' : 'bg-indigo-500'
                    }`}
                  />
                </View>

                {/* Thông tin bàn */}
{isOccupied ? (
                    <View className="mt-1">
                      <View className="flex-row items-center gap-1 mb-1">
                        <Users size={12} color="#D97706" />
                        <Text className="text-xs font-semibold text-amber-700">
                          {table.scannedCustomerCount || table.customerCount || 1} khách
                        </Text>
                      </View>
                      <View className="flex-row flex-wrap items-center gap-1 mb-1" style={{ minHeight: 20 }}>
                        {renderSeatIcons(table.scannedCustomerCount || 1, table.customerCount || 4)}
                      </View>
                      <Text className="text-sm font-black text-emerald-600">
                        {formatCurrency(table.totalAmount || 0)}
                      </Text>
                    </View>
                  ) : isReserved ? (
                  <View className="mt-1">
                    <View className="flex-row items-center gap-1 mb-1">
                      <Clock size={12} color="#4F46E5" />
                      <Text className="text-xs font-semibold text-indigo-700">Đã đặt trước</Text>
                    </View>
                    <Text className="text-xs text-textSecondary">{table.customerCount || 4} chỗ ngồi</Text>
                  </View>
                ) : (
                  <View className="mt-1">
                    <Text className="text-xs font-semibold text-emerald-600">Bàn trống</Text>
                    <Text className="text-[11px] text-textMuted mt-0.5">Sẵn sàng nhận khách</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      {/* Modal Chi Tiết Thao Tác Bàn */}
      {selectedTable && (
        <Modal visible={!!selectedTable} transparent animationType="fade">
          <View className="flex-1 bg-slate-900/60 justify-center items-center p-5">
            <View className="w-full max-w-[360px] bg-white rounded-3xl p-5 shadow-xl">
              <View className="flex-row justify-between items-start mb-4">
                <View>
                  <Text className="text-[18px] font-extrabold text-textMain">{selectedTable.name}</Text>
                  <Text className="text-xs text-textSecondary mt-0.5">
                    Trạng thái: <Text className="font-bold text-textMain">{selectedTable.status}</Text>
                  </Text>
                </View>
                <TouchableOpacity
                  className="w-8 h-8 rounded-full bg-slate-100 items-center justify-center"
                  onPress={() => setSelectedTable(null)}
                >
                  <X size={18} color="#0F172A" />
                </TouchableOpacity>
              </View>

              {/* Nút hành động chính */}
              <View className="gap-2.5 mb-4">
                {selectedTable.status === 'OCCUPIED' && (
                  <TouchableOpacity
                    className="bg-purple-600 rounded-xl py-3 flex-row items-center justify-center gap-2"
                    onPress={() => {
                      const sessId = selectedTable.currentSessionId || 'sess-02';
                      setSelectedTable(null);
                      if (onNavigateToCashier) onNavigateToCashier(sessId);
                    }}
                    activeOpacity={0.85}
                  >
                    <CreditCard size={16} color="#FFFFFF" />
                    <Text className="text-white text-xs font-bold">Chuyển Sang Thanh Toán</Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  className="bg-emerald-600 rounded-xl py-3 flex-row items-center justify-center gap-2"
                  onPress={() => {
                    const tblId = selectedTable.id;
                    setSelectedTable(null);
                    if (onNavigateToOrder) onNavigateToOrder(tblId);
                  }}
                  activeOpacity={0.85}
                >
                  <UtensilsCrossed size={16} color="#FFFFFF" />
                  <Text className="text-white text-xs font-bold">
                    {selectedTable.status === 'OCCUPIED' ? 'Gọi Thêm Món' : 'Mở Bàn & Đặt Món'}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Đổi trạng thái bàn thủ công */}
              <Text className="text-[11px] font-bold text-textMuted tracking-wider mb-2">ĐỔI TRẠNG THÁI BÀN</Text>
              <View className="flex-row gap-2">
                <TouchableOpacity
                  className={`flex-1 py-2 rounded-lg items-center border ${
                    selectedTable.status === 'EMPTY' ? 'bg-emerald-600 border-emerald-600' : 'bg-slate-50 border-border'
                  }`}
                  onPress={() => handleQuickStatusChange(selectedTable, 'EMPTY')}
                >
                  <Text className={`text-xs font-bold ${selectedTable.status === 'EMPTY' ? 'text-white' : 'text-textMain'}`}>
                    Trống
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  className={`flex-1 py-2 rounded-lg items-center border ${
                    selectedTable.status === 'OCCUPIED' ? 'bg-amber-500 border-amber-500' : 'bg-slate-50 border-border'
                  }`}
                  onPress={() => handleQuickStatusChange(selectedTable, 'OCCUPIED')}
                >
                  <Text className={`text-xs font-bold ${selectedTable.status === 'OCCUPIED' ? 'text-white' : 'text-textMain'}`}>
                    Có Khách
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  className={`flex-1 py-2 rounded-lg items-center border ${
                    selectedTable.status === 'RESERVED' ? 'bg-indigo-600 border-indigo-600' : 'bg-slate-50 border-border'
                  }`}
                  onPress={() => handleQuickStatusChange(selectedTable, 'RESERVED')}
                >
                  <Text className={`text-xs font-bold ${selectedTable.status === 'RESERVED' ? 'text-white' : 'text-textMain'}`}>
                    Đặt Trước
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
};

export default TablesScreen;
