import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import {
  ArrowLeft,
  UserCheck,
  CheckCircle2,
  CreditCard,
  Clock,
  X,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { api } from '../../services/api';
import { useSocketEvent } from '../../hooks/useSocket';
import { useAuthStore } from '../../data/authStore';
import { soundService } from '../../services/sound';
import { createTaggedLogger } from '../../utils/logger';
const log = createTaggedLogger('REQ');

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

// Định dạng thời gian tương đối đồng bộ như trên Web
const formatTimeAgo = (isoString?: string) => {
  if (!isoString) return '';
  try {
    const diffMs = Date.now() - new Date(isoString).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Vừa xong';
    if (diffMins < 60) return `${diffMins} phút trước`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} giờ trước`;
    const d = new Date(isoString);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  } catch {
    return '';
  }
};

const formatResolvedTime = (isoString?: string) => {
  if (!isoString) return '';
  try {
    const d = new Date(isoString);
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  } catch {
    return '';
  }
};

export const RequestsScreen: React.FC<RequestsScreenProps> = ({ onBack }) => {
  const insets = useSafeAreaInsets();
  const dynamicPaddingBottom = insets.bottom > 0 ? Math.max(insets.bottom - 16, 6) : 6;
  const user = useAuthStore((s) => s.user);

  const [calls, setCalls] = useState<CustomerCall[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Bộ lọc đồng bộ 100% với Web
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'PAYMENT' | 'STAFF'>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'PROCESSING' | 'COMPLETED'>('ALL');

  // Thống kê 3 thẻ KPI
  const [summary, setSummary] = useState({ total: 0, pending: 0, processing: 0 });

  const loadCalls = useCallback(
    async (showLoading = true) => {
      try {
        if (showLoading) setLoading(true);
        const res = await api.fetchCustomerCalls({
          status: statusFilter !== 'ALL' ? statusFilter : undefined,
          type: typeFilter !== 'ALL' ? typeFilter : undefined,
          branchId: user?.branchId || undefined,
        });
        if (res) {
          setCalls(res.calls || []);
          if (res.summary) {
            setSummary(res.summary);
          }
        }
      } catch (err: any) {
        log.warn('[RequestsScreen] Load calls failed:', err.message);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [statusFilter, typeFilter, user?.branchId]
  );

  useEffect(() => {
    loadCalls(true);
  }, [loadCalls]);

  const onRefresh = () => {
    setRefreshing(true);
    loadCalls(false);
  };

  // Lắng nghe sự kiện Socket.IO khi khách gọi phục vụ hoặc cập nhật
  useSocketEvent('call_staff:request', (newCall: any) => {
    soundService.playNewOrderAlert();
    loadCalls(false);
  });

  useSocketEvent('call_staff:updated', () => {
    loadCalls(false);
  });

  useSocketEvent('call_staff:update', () => {
    loadCalls(false);
  });

  // Xử lý cập nhật trạng thái
  const handleUpdateStatus = async (
    callId: string,
    nextStatus: 'PROCESSING' | 'COMPLETED' | 'CANCELLED'
  ) => {
    try {
      setActionLoadingId(callId);
      const updated = await api.updateCustomerCallStatus(callId, nextStatus);

      // Cập nhật danh sách tại chỗ ngay lập tức
      setCalls((prev) => {
        if (statusFilter !== 'ALL' && nextStatus !== statusFilter) {
          return prev.filter((c) => c.id !== callId);
        }
        return prev.map((c) => (c.id === callId ? { ...c, ...updated } : c));
      });

      // Cập nhật thẻ KPI
      setSummary((prev) => {
        const wasPending = calls.find((c) => c.id === callId)?.status === 'PENDING';
        const wasProcessing = calls.find((c) => c.id === callId)?.status === 'PROCESSING';

        let newPending = prev.pending;
        let newProcessing = prev.processing;

        if (nextStatus === 'PROCESSING') {
          if (wasPending) newPending = Math.max(0, newPending - 1);
          newProcessing += 1;
        } else if (nextStatus === 'COMPLETED' || nextStatus === 'CANCELLED') {
          if (wasPending) newPending = Math.max(0, newPending - 1);
          if (wasProcessing) newProcessing = Math.max(0, newProcessing - 1);
        }

        return {
          ...prev,
          pending: newPending,
          processing: newProcessing,
        };
      });
    } catch (err: any) {
      Alert.alert('Lỗi', err.message || 'Không thể cập nhật trạng thái yêu cầu');
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <View className="flex-1 bg-[#F8FAFC]">
      {/* Header đồng bộ chuẩn mobile & web */}
      <View className="bg-white px-4 pt-2.5 pb-3 border-b border-[#E2E8F0]">
        <View className="flex-row items-center gap-3 mb-3">
          <TouchableOpacity
            className="w-9 h-9 rounded-xl bg-slate-100 items-center justify-center border border-border"
            onPress={onBack}
            activeOpacity={0.7}
          >
            <ArrowLeft size={18} color="#0F172A" />
          </TouchableOpacity>
          <Text className="text-[19px] font-black text-[#0F172A]">Yêu Cầu Khách Hàng</Text>
        </View>

        {/* 2 Hàng bộ lọc: Loại & Trạng thái (y hệt Web) */}
        <View className="pt-1 gap-2">
          {/* Hàng 1: Loại */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ alignItems: 'center', gap: 6 }}
          >
            <Text className="text-[11.5px] font-bold text-[#64748B] mr-1">Loại:</Text>
            {[
              { id: 'ALL', label: 'Tất cả' },
              { id: 'PAYMENT', label: '💳 Gọi thanh toán' },
              { id: 'STAFF', label: '🙋 Gọi nhân viên' },
            ].map((t) => {
              const active = typeFilter === t.id;
              return (
                <TouchableOpacity
                  key={t.id}
                  onPress={() => setTypeFilter(t.id as any)}
                  className={`px-3 py-1.5 rounded-xl border ${
                    active ? 'bg-[#00A389] border-[#00A389]' : 'bg-[#F8FAFC] border-[#E2E8F0]'
                  }`}
                  activeOpacity={0.7}
                >
                  <Text className={`text-[11.5px] font-bold ${active ? 'text-white' : 'text-[#475569]'}`}>
                    {t.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Hàng 2: Trạng thái */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ alignItems: 'center', gap: 6 }}
          >
            <Text className="text-[11.5px] font-bold text-[#64748B] mr-1">Trạng thái:</Text>
            {[
              { id: 'ALL', label: 'Tất cả' },
              { id: 'PENDING', label: 'Chờ xử lý' },
              { id: 'PROCESSING', label: 'Đang phục vụ' },
              { id: 'COMPLETED', label: 'Đã hoàn tất' },
            ].map((s) => {
              const active = statusFilter === s.id;
              return (
                <TouchableOpacity
                  key={s.id}
                  onPress={() => setStatusFilter(s.id as any)}
                  className={`px-3 py-1.5 rounded-xl border ${
                    active ? 'bg-slate-800 border-slate-800' : 'bg-[#F8FAFC] border-[#E2E8F0]'
                  }`}
                  activeOpacity={0.7}
                >
                  <Text className={`text-[11.5px] font-bold ${active ? 'text-white' : 'text-[#475569]'}`}>
                    {s.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </View>

      {/* Danh sách yêu cầu (Card structure chuẩn theo Web) */}
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 14, paddingBottom: dynamicPaddingBottom + 20 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#00A389']} />}
      >
        {loading && !refreshing ? (
          <View className="py-20 items-center justify-center">
            <ActivityIndicator size="large" color="#00A389" />
            <Text className="text-[12.5px] font-bold text-slate-400 mt-3">Đang tải danh sách yêu cầu gọi bàn...</Text>
          </View>
        ) : calls.length === 0 ? (
          <View className="py-14 bg-white rounded-3xl border border-dashed border-[#E2E8F0] items-center justify-center p-6">
            <View className="w-14 h-14 rounded-full bg-emerald-50 items-center justify-center mb-3">
              <CheckCircle2 size={28} color="#059669" />
            </View>
            <Text className="text-[16px] font-black text-[#0F172A] text-center">Không có yêu cầu gọi nào</Text>
            <Text className="text-[12.5px] text-[#64748B] text-center max-w-[280px] mt-1 leading-relaxed">
              Hiện tại không có bàn nào đang gọi phục vụ hoặc gọi thanh toán. Khi khách quét mã QR yêu cầu, chuông sẽ reo và hiện tại đây ngay lập tức.
            </Text>
          </View>
        ) : (
          <View className="gap-3.5">
            {calls.map((call, idx) => {
              const isPending = call.status === 'PENDING';
              const isProcessing = call.status === 'PROCESSING';
              const isCompleted = call.status === 'COMPLETED';
              const isCancelled = call.status === 'CANCELLED';
              const isActionLoading = actionLoadingId === call.id;

              const isVietQR =
                call.paymentMethod === 'VIETQR' ||
                call.reason?.toLowerCase().includes('vietqr') ||
                call.reason?.toLowerCase().includes('chuyển khoản');

              return (
                <View
                  key={call.id || `call-${call.tableId}-${idx}`}
                  className={`bg-white rounded-3xl p-4 sm:p-5 border shadow-2xs ${
                    isPending
                      ? 'border-rose-300'
                      : isProcessing
                      ? 'border-blue-300'
                      : 'border-[#E2E8F0] opacity-90'
                  }`}
                >
                  {/* Header: Tên Bàn & Trạng thái */}
                  <View className="flex-row items-start justify-between gap-2 mb-3">
                    <View>
                      <Text className="text-[18px] font-black text-[#0F172A] tracking-tight">
                        {call.tableName}
                      </Text>
                      <View className="flex-row items-center gap-1 mt-0.5">
                        <Clock size={12} color="#94A3B8" />
                        <Text className="text-[11.5px] text-[#64748B]">
                          {formatTimeAgo(call.createdAt)}
                        </Text>
                      </View>
                    </View>

                    {/* Badge trạng thái */}
                    <View
                      className={`px-2.5 py-1 rounded-full border ${
                        isPending
                          ? 'bg-rose-50 border-rose-200'
                          : isProcessing
                          ? 'bg-blue-50 border-blue-200'
                          : isCompleted
                          ? 'bg-emerald-50 border-emerald-200'
                          : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <Text
                        className={`text-[11px] font-black ${
                          isPending
                            ? 'text-rose-700'
                            : isProcessing
                            ? 'text-blue-700'
                            : isCompleted
                            ? 'text-emerald-700'
                            : 'text-slate-600'
                        }`}
                      >
                        {isPending
                          ? '🔴 Chờ xử lý'
                          : isProcessing
                          ? '🟡 Đang phục vụ'
                          : isCompleted
                          ? 'Đã xong'
                          : 'Đã huỷ'}
                      </Text>
                    </View>
                  </View>

                  {/* Khối Nội dung yêu cầu (Chỉ hiển thị đúng loại và nội dung như Web) */}
                  <View
                    className={`p-3.5 rounded-2xl border mb-3 ${
                      call.type === 'PAYMENT'
                        ? 'bg-emerald-50/70 border-emerald-200/80'
                        : 'bg-blue-50/70 border-blue-200/80'
                    }`}
                  >
                    <View className="flex-row items-center gap-1.5 mb-1">
                      {call.type === 'PAYMENT' ? (
                        <>
                          <CreditCard size={14} color="#047857" />
                          <Text className="text-[11px] font-black text-emerald-800 uppercase tracking-wider">
                            Yêu Cầu Thanh Toán
                          </Text>
                        </>
                      ) : (
                        <>
                          <UserCheck size={14} color="#1D4ED8" />
                          <Text className="text-[11px] font-black text-blue-800 uppercase tracking-wider">
                            Yêu Cầu Nhân Viên
                          </Text>
                        </>
                      )}
                    </View>
                    <Text
                      className={`text-[13.5px] font-bold leading-snug ${
                        call.type === 'PAYMENT' ? 'text-emerald-950' : 'text-blue-950'
                      }`}
                    >
                      {call.type === 'PAYMENT'
                        ? `Phương thức: ${isVietQR ? 'Chuyển khoản' : 'Tiền mặt'}`
                        : call.reason}
                    </Text>
                  </View>

                  {/* Nút hành động */}
                  <View className="pt-3 border-t border-slate-100 flex-row items-center gap-2">
                    {isPending && (
                      <TouchableOpacity
                        disabled={isActionLoading}
                        onPress={() => handleUpdateStatus(call.id, 'PROCESSING')}
                        className="flex-1 h-10 rounded-xl bg-blue-600 items-center justify-center shadow-2xs"
                        activeOpacity={0.8}
                      >
                        {isActionLoading ? (
                          <ActivityIndicator size="small" color="#FFFFFF" />
                        ) : (
                          <Text className="text-white font-bold text-[12.5px]">Tiếp nhận</Text>
                        )}
                      </TouchableOpacity>
                    )}

                    {(isPending || isProcessing) && (
                      <TouchableOpacity
                        disabled={isActionLoading}
                        onPress={() => handleUpdateStatus(call.id, 'COMPLETED')}
                        className="flex-1 h-10 rounded-xl bg-[#00A389] items-center justify-center shadow-2xs"
                        activeOpacity={0.8}
                      >
                        {isActionLoading ? (
                          <ActivityIndicator size="small" color="#FFFFFF" />
                        ) : (
                          <Text className="text-white font-bold text-[12.5px]">Xong</Text>
                        )}
                      </TouchableOpacity>
                    )}

                    {isCompleted && (
                      <View className="w-full py-2 bg-emerald-50 rounded-xl items-center justify-center">
                        <Text className="text-[12px] font-bold text-emerald-700">
                          Đã xử lý lúc {formatResolvedTime(call.resolvedAt || call.updatedAt)}
                        </Text>
                      </View>
                    )}

                    {isCancelled && (
                      <View className="w-full py-2 bg-slate-100 rounded-xl items-center justify-center">
                        <Text className="text-[12px] font-bold text-slate-500">
                          Đã huỷ yêu cầu
                        </Text>
                      </View>
                    )}

                    {!isCompleted && !isCancelled && (
                      <TouchableOpacity
                        disabled={isActionLoading}
                        onPress={() => {
                          Alert.alert('Huỷ yêu cầu', 'Bạn có chắc chắn muốn huỷ yêu cầu này?', [
                            { text: 'Giữ lại', style: 'cancel' },
                            {
                              text: 'Huỷ yêu cầu',
                              style: 'destructive',
                              onPress: () => handleUpdateStatus(call.id, 'CANCELLED'),
                            },
                          ]);
                        }}
                        className="w-10 h-10 rounded-xl bg-slate-100 items-center justify-center"
                        activeOpacity={0.7}
                      >
                        <X size={16} color="#64748B" />
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </View>
  );
};