import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import {
  ArrowLeft,
  BellRing,
  CheckCircle2,
  X,
  ChevronRight,
  Clock,
  DollarSign,
  User,
  Filter,
  RefreshCw,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { api } from '../../services/api';
import { useSocketEvent } from '../../hooks/useSocket';

export interface CustomerCall {
  id: string;
  tenantId: string;
  branchId: string;
  tableId: string;
  tableName: string;
  type: 'PAYMENT' | 'STAFF';
  paymentMethod?: 'CASH' | 'VIETQR';
  reason: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'CANCELLED';
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
}

interface RequestsScreenProps {
  onBack: () => void;
}

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Đang chờ',
  PROCESSING: 'Đang xử lý',
  COMPLETED: 'Hoàn thành',
  CANCELLED: 'Đã huỷ',
};

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-amber-100 text-amber-700 border-amber-200',
  PROCESSING: 'bg-blue-100 text-blue-700 border-blue-200',
  COMPLETED: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  CANCELLED: 'bg-slate-100 text-slate-700 border-slate-200',
};

const TYPE_LABELS: Record<string, string> = {
  PAYMENT: 'Thanh toán',
  STAFF: 'Gọi NV',
};

const TYPE_COLORS: Record<string, string> = {
  PAYMENT: 'bg-green-100 text-green-700',
  STAFF: 'bg-teal-100 text-teal-700',
};

const TYPE_ICONS: Record<string, any> = {
  PAYMENT: DollarSign,
  STAFF: BellRing,
};

const formatTime = (iso: string) => {
  try {
    const d = new Date(iso);
    return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  } catch {
    return iso;
  }
};

const formatDate = (iso: string) => {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  } catch {
    return iso;
  }
};

export const RequestsScreen: React.FC<RequestsScreenProps> = ({ onBack }) => {
  const insets = useSafeAreaInsets();
  const dynamicPaddingBottom = insets.bottom > 0 ? Math.max(insets.bottom - 16, 6) : 6;

  const [calls, setCalls] = useState<CustomerCall[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [selectedCall, setSelectedCall] = useState<CustomerCall | null>(null);
  const [summary, setSummary] = useState({ total: 0, pending: 0, processing: 0 });

  const loadCalls = async () => {
    try {
      setLoading(true);
      const res = await api.fetchCustomerCalls({
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
        type: typeFilter !== 'ALL' ? typeFilter : undefined,
      });
      if (res) {
        setCalls(res.calls || []);
        setSummary(res.summary || { total: 0, pending: 0, processing: 0 });
      }
    } catch (err: any) {
      console.log('[RequestsScreen] Load calls failed:', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadCalls();
  }, [statusFilter, typeFilter]);

  const onRefresh = () => {
    setRefreshing(true);
    loadCalls();
  };

  useSocketEvent('call_staff:request', (payload: any) => {
    console.log('🛎️ [RequestsScreen] New call request:', payload);
    loadCalls();
  });

  const handleStatusChange = async (callId: string, newStatus: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'CANCELLED') => {
    try {
      const updated = await api.updateCustomerCallStatus(callId, newStatus);
      setCalls((prev) => prev.map((c) => (c.id === callId ? updated : c)));
      loadCalls();
    } catch (err: any) {
      Alert.alert('Lỗi', err.message || 'Không thể cập nhật trạng thái');
    }
  };

  const filteredCalls = calls;

  const pendingCount = calls.filter((c) => c.status === 'PENDING').length;
  const processingCount = calls.filter((c) => c.status === 'PROCESSING').length;
  const completedCount = calls.filter((c) => c.status === 'COMPLETED').length;

  return (
    <View className="flex-1 bg-background">
      {/* Header */}
      <View className="bg-white px-4 pt-2.5 pb-3 border-b border-[#F1F5F9]">
        <View className="flex-row items-center mb-3">
          <TouchableOpacity
            className="w-9 h-9 rounded-xl bg-slate-100 items-center justify-center mr-3 border border-border"
            onPress={onBack}
            activeOpacity={0.7}
          >
            <ArrowLeft size={18} color="#0F172A" />
          </TouchableOpacity>
          <Text className="text-[20px] font-extrabold text-textMain">Yêu Cầu Khách Hàng</Text>
        </View>

        {/* Summary Cards */}
        <View className="flex-row gap-2 mb-3">
          <View className="flex-1 bg-amber-50 rounded-xl p-2.5 border border-amber-200 items-center">
            <Text className="text-[11px] font-bold text-amber-600">CHỜ XỬ LÝ</Text>
            <Text className="text-lg font-black text-amber-700 mt-0.5">{pendingCount}</Text>
          </View>
          <View className="flex-1 bg-blue-50 rounded-xl p-2.5 border border-blue-200 items-center">
            <Text className="text-[11px] font-bold text-blue-600">ĐANG XỬ LÝ</Text>
            <Text className="text-lg font-black text-blue-700 mt-0.5">{processingCount}</Text>
          </View>
          <View className="flex-1 bg-emerald-50 rounded-xl p-2.5 border border-emerald-200 items-center">
            <Text className="text-[11px] font-bold text-emerald-600">HOÀN THÀNH</Text>
            <Text className="text-lg font-black text-emerald-700 mt-0.5">{completedCount}</Text>
          </View>
        </View>

        {/* Filters */}
        <View className="flex-row gap-2">
          <TouchableOpacity
            className={`flex-1 flex-row items-center justify-center gap-1.5 py-2 rounded-xl border ${
              statusFilter === 'ALL' ? 'bg-teal-600 border-teal-600' : 'bg-white border-border'
            }`}
            onPress={() => setStatusFilter('ALL')}
          >
            <Filter size={14} color={statusFilter === 'ALL' ? 'white' : '#00A389'} />
            <Text className={`text-[12px] font-bold ${statusFilter === 'ALL' ? 'text-white' : 'text-[#00A389]'}`}>
              Tất cả
            </Text>
          </TouchableOpacity>
          {(['PENDING', 'PROCESSING', 'COMPLETED', 'CANCELLED'] as const).map((s) => (
            <TouchableOpacity
              key={s}
              className={`flex-1 flex-row items-center justify-center gap-1.5 py-2 rounded-xl border ${
                statusFilter === s ? 'bg-teal-600 border-teal-600' : 'bg-white border-border'
              }`}
              onPress={() => setStatusFilter(s)}
            >
              <View className={`w-2 h-2 rounded-full ${STATUS_COLORS[s].includes('amber') ? 'bg-amber-400' : STATUS_COLORS[s].includes('blue') ? 'bg-blue-400' : STATUS_COLORS[s].includes('emerald') ? 'bg-emerald-400' : 'bg-slate-400'}`} />
              <Text className={`text-[11px] font-bold ${statusFilter === s ? 'text-white' : 'text-textSecondary'}`}>
                {STATUS_LABELS[s]}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Content */}
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 16, paddingBottom: dynamicPaddingBottom + 16 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#00A389']} />}
      >
        {loading ? (
          <View className="h-40 items-center justify-center">
            <ActivityIndicator size="large" color="#00A389" />
          </View>
        ) : filteredCalls.length === 0 ? (
          <View className="bg-white rounded-[20px] p-8 items-center border border-border">
            <BellRing size={48} color="#94A3B8" className="mb-3" />
            <Text className="text-[15px] font-bold text-textMain mb-1">Không có yêu cầu nào</Text>
            <Text className="text-[12.5px] text-textSecondary text-center">
              {statusFilter !== 'ALL' ? 'Thử chọn "Tất cả" để xem toàn bộ' : 'Khách hàng chưa gửi yêu cầu nào'}
            </Text>
          </View>
        ) : (
          <View className="gap-3">
            {filteredCalls.map((call) => (
              <TouchableOpacity
                key={call.id}
                className="bg-white rounded-[18px] p-4 border border-border"
                style={{
                  shadowColor: '#0F172A',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.05,
                  shadowRadius: 8,
                  elevation: 2,
                }}
                activeOpacity={0.85}
                onPress={() => setSelectedCall(call)}
              >
                {/* Header */}
                <View className="flex-row justify-between items-start mb-3">
                  <View className="flex-row items-center gap-2">
                    {(() => {
                      const CallIcon = TYPE_ICONS[call.type] || BellRing;
                      return (
                        <View className={`w-9 h-9 rounded-xl items-center justify-center ${TYPE_COLORS[call.type]}`}>
                          <CallIcon size={18} color={TYPE_COLORS[call.type]?.includes('green') ? '#059669' : '#00A389'} />
                        </View>
                      );
                    })()}
                    <View>
                      <View className="flex-row items-center gap-2">
                        <Text className="text-[15px] font-extrabold text-textMain">{call.tableName}</Text>
                        <View className={`flex-row items-center gap-1 px-2 py-0.5 rounded-full ${STATUS_COLORS[call.status]}`}>
                          <Text className="text-[10px] font-bold">{STATUS_LABELS[call.status]}</Text>
                        </View>
                      </View>
                      <Text className="text-[11px] text-textMuted mt-0.5">
                        {formatDate(call.createdAt)} • {formatTime(call.createdAt)}
                      </Text>
                    </View>
                  </View>
                  <View className="flex-row items-center gap-2">
                    <View className={`px-2 py-1 rounded-full ${TYPE_COLORS[call.type]}`}>
                      <Text className="text-[10px] font-bold">{TYPE_LABELS[call.type]}</Text>
                    </View>
                    <ChevronRight size={16} color="#94A3B8" />
                  </View>
                </View>

                {/* Reason */}
                <View className="bg-[#F8FAFC] rounded-xl p-3 mb-3">
                  <Text className="text-[13px] font-bold text-textMain mb-1">{call.reason}</Text>
                  {call.type === 'PAYMENT' && call.paymentMethod && (
                    <Text className="text-[11px] text-textSecondary flex-row items-center gap-1">
                      <DollarSign size={11} />
                      <Text>Thanh toán: {call.paymentMethod === 'VIETQR' ? 'VietQR' : 'Tiền mặt'}</Text>
                    </Text>
                  )}
                </View>

                {/* Footer Actions */}
                <View className="flex-row justify-between items-center pt-2 border-t border-[#F1F5F9]">
                  <View className="flex-row items-center gap-3 text-[11px] text-textMuted">
                    <View className="flex-row items-center gap-1">
                      <User size={12} />
                      <Text>Bàn: {call.tableName}</Text>
                    </View>
                    <View className="flex-row items-center gap-1">
                      <Clock size={12} />
                      <Text>{formatTime(call.createdAt)}</Text>
                    </View>
                  </View>

                  <View className="flex-row items-center gap-2">
                    {call.status === 'PENDING' && (
                      <TouchableOpacity
                        className="px-3 py-1.5 bg-blue-100 rounded-lg border border-blue-200"
                        onPress={() => { handleStatusChange(call.id, 'PROCESSING'); }}
                        activeOpacity={0.8}
                      >
                        <Text className="text-[11px] font-bold text-blue-700">Nhận việc</Text>
                      </TouchableOpacity>
                    )}
                    {call.status === 'PROCESSING' && (
                      <TouchableOpacity
                        className="px-3 py-1.5 bg-emerald-100 rounded-lg border border-emerald-200"
                        onPress={() => { handleStatusChange(call.id, 'COMPLETED'); }}
                        activeOpacity={0.8}
                      >
                        <Text className="text-[11px] font-bold text-emerald-700">Hoàn thành</Text>
                      </TouchableOpacity>
                    )}
                    {(call.status === 'PENDING' || call.status === 'PROCESSING') && (
                      <TouchableOpacity
                        className="px-3 py-1.5 bg-rose-100 rounded-lg border border-rose-200"
                        onPress={() => {
                          Alert.alert('Huỷ yêu cầu', 'Bạn có chắc muốn huỷ yêu cầu này?', [
                            { text: 'Giữ lại', style: 'cancel' },
                            { text: 'Huỷ', style: 'destructive', onPress: () => handleStatusChange(call.id, 'CANCELLED') },
                          ]);
                        }}
                        activeOpacity={0.8}
                      >
                        <Text className="text-[11px] font-bold text-rose-700">Huỷ</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Detail Modal */}
      {selectedCall && (
        <Modal visible={true} transparent animationType="fade">
          <View className="flex-1 bg-slate-900/60 justify-center items-center p-5">
            <View className="w-full max-w-[380px] bg-white rounded-3xl p-6 shadow-xl">
              <View className="flex-row justify-between items-start mb-4">
                <View>
                  <View className="flex-row items-center gap-2 mb-1">
                    {(() => {
                      const SelectedIcon = TYPE_ICONS[selectedCall.type] || BellRing;
                      return (
                        <View className={`w-8 h-8 rounded-xl items-center justify-center ${TYPE_COLORS[selectedCall.type]}`}>
                          <SelectedIcon size={16} color={TYPE_COLORS[selectedCall.type]?.includes('green') ? '#059669' : '#00A389'} />
                        </View>
                      );
                    })()}
                    <Text className="font-extrabold text-[18px] text-textMain">{selectedCall.tableName}</Text>
                  </View>
                  <View className={`flex-row items-center gap-1 px-2 py-0.5 rounded-full ${STATUS_COLORS[selectedCall.status]}`}>
                    <Text className="text-[11px] font-bold">{STATUS_LABELS[selectedCall.status]}</Text>
                  </View>
                </View>
                <TouchableOpacity onPress={() => setSelectedCall(null)} className="p-1">
                  <X size={20} color="#94A3B8" />
                </TouchableOpacity>
              </View>

              <View className="space-y-4">
                <View>
                  <Text className="text-[11px] font-bold text-textMuted uppercase tracking-wider mb-1">LOẠI YÊU CẦU</Text>
                  <View className="flex-row items-center gap-2">
                    <View className={`px-3 py-1.5 rounded-full ${TYPE_COLORS[selectedCall.type]}`}>
                      <Text className="text-[12px] font-bold">{TYPE_LABELS[selectedCall.type]}</Text>
                    </View>
                    {selectedCall.type === 'PAYMENT' && selectedCall.paymentMethod && (
                      <View className="px-3 py-1.5 bg-slate-100 rounded-full">
                        <Text className="text-[11px] font-bold text-textSecondary">
                          {selectedCall.paymentMethod === 'VIETQR' ? 'VietQR' : 'Tiền mặt'}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>

                <View>
                  <Text className="text-[11px] font-bold text-textMuted uppercase tracking-wider mb-1">NỘI DUNG</Text>
                  <Text className="text-[14px] font-semibold text-textMain">{selectedCall.reason}</Text>
                </View>

                <View className="bg-[#F8FAFC] rounded-xl p-3">
                  <View className="flex-row justify-between py-1">
                    <Text className="text-[12px] text-textSecondary flex-row items-center gap-1">
                      <Clock size={12} />
                      <Text>Tạo lúc</Text>
                    </Text>
                    <Text className="text-[12px] font-bold text-textMain">{formatDate(selectedCall.createdAt)} {formatTime(selectedCall.createdAt)}</Text>
                  </View>
                  <View className="flex-row justify-between py-1 border-t border-slate-200">
                    <Text className="text-[12px] text-textSecondary flex-row items-center gap-1">
                      <User size={12} />
                      <Text>Bàn</Text>
                    </Text>
                    <Text className="text-[12px] font-bold text-textMain">{selectedCall.tableName}</Text>
                  </View>
                  {selectedCall.resolvedAt && (
                    <View className="flex-row justify-between py-1 border-t border-slate-200">
                      <Text className="text-[12px] text-textSecondary flex-row items-center gap-1">
                        <CheckCircle2 size={12} />
                        <Text>Giải quyết lúc</Text>
                      </Text>
                      <Text className="text-[12px] font-bold text-textMain">{formatDate(selectedCall.resolvedAt)} {formatTime(selectedCall.resolvedAt)}</Text>
                    </View>
                  )}
                </View>

                {/* Actions */}
                <View className="flex-row gap-2 pt-2 border-t border-[#F1F5F9]">
                  {selectedCall.status === 'PENDING' && (
                    <TouchableOpacity
                      className="flex-1 h-11 rounded-xl bg-blue-600 items-center justify-center"
                      onPress={() => { handleStatusChange(selectedCall.id, 'PROCESSING'); setSelectedCall(null); }}
                      activeOpacity={0.85}
                    >
                      <Text className="text-white text-[13px] font-extrabold">Nhận xử lý</Text>
                    </TouchableOpacity>
                  )}
                  {selectedCall.status === 'PROCESSING' && (
                    <TouchableOpacity
                      className="flex-1 h-11 rounded-xl bg-emerald-600 items-center justify-center"
                      onPress={() => { handleStatusChange(selectedCall.id, 'COMPLETED'); setSelectedCall(null); }}
                      activeOpacity={0.85}
                    >
                      <Text className="text-white text-[13px] font-extrabold">Đã xong</Text>
                    </TouchableOpacity>
                  )}
                  {(selectedCall.status === 'PENDING' || selectedCall.status === 'PROCESSING') && (
                    <TouchableOpacity
                      className="flex-1 h-11 rounded-xl bg-rose-600 items-center justify-center"
                      onPress={() => {
                        Alert.alert('Huỷ yêu cầu', 'Bạn có chắc muốn huỷ?', [
                          { text: 'Giữ lại', style: 'cancel' },
                          { text: 'Huỷ', style: 'destructive', onPress: () => { handleStatusChange(selectedCall.id, 'CANCELLED'); setSelectedCall(null); } },
                        ]);
                      }}
                      activeOpacity={0.8}
                    >
                      <Text className="text-white text-[13px] font-extrabold">Huỷ</Text>
                    </TouchableOpacity>
                  )}
                  {selectedCall.status === 'COMPLETED' && (
                    <TouchableOpacity
                      className="flex-1 h-11 rounded-xl bg-slate-100 items-center justify-center"
                      onPress={() => setSelectedCall(null)}
                      activeOpacity={0.8}
                    >
                      <Text className="text-[13px] font-bold text-textSecondary">Đã hoàn thành</Text>
                    </TouchableOpacity>
                  )}
                  {selectedCall.status === 'CANCELLED' && (
                    <TouchableOpacity
                      className="flex-1 h-11 rounded-xl bg-slate-100 items-center justify-center"
                      onPress={() => setSelectedCall(null)}
                      activeOpacity={0.8}
                    >
                      <Text className="text-[13px] font-bold text-textSecondary">Đã huỷ</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
};

export default RequestsScreen;