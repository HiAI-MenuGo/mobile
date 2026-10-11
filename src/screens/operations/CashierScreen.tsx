import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  Image,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import {
  ArrowLeft,
  DollarSign,
  QrCode,
  Clock,
  User,
  CheckCircle2,
  Receipt,
  X,
  RefreshCw,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { api } from '../../services/api';
import { useSocketEvent } from '../../hooks/useSocket';
import { soundService } from '../../services/sound';

export interface PendingBill {
  sessionId: string;
  tableId: string;
  tableName: string;
  total: number;
  count: number;
  time: string;
  staff: string;
  items?: any[];
}

interface CashierScreenProps {
  onBack: () => void;
}

export const CashierScreen: React.FC<CashierScreenProps> = ({ onBack }) => {
  const insets = useSafeAreaInsets();
  const dynamicPaddingBottom = insets.bottom > 0 ? Math.max(insets.bottom - 16, 6) : 6;

  const [bills, setBills] = useState<PendingBill[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedTable, setSelectedTable] = useState<string | null>(null);

  // Modal VietQR
  const [activeQrModal, setActiveQrModal] = useState<PendingBill | null>(null);
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [qrCountdown, setQrCountdown] = useState<number>(60);
  const [qrLoading, setQrLoading] = useState<boolean>(false);

  // Modal Tiền mặt (Cash)
  const [cashModalBill, setCashModalBill] = useState<PendingBill | null>(null);
  const [cashReceivedInput, setCashReceivedInput] = useState<string>('');
  const [cashLoading, setCashLoading] = useState<boolean>(false);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
  };

  // Tải danh sách đơn chờ thanh toán từ API
  const loadPendingBills = async () => {
    try {
      setLoading(true);
      const data = await api.getPendingPayments();
      if (Array.isArray(data)) {
        setBills(
          data.map((d: any) => ({
            sessionId: d.sessionId,
            tableId: d.tableId,
            tableName: d.tableName || d.tableId,
            count: d.items ? d.items.length : 1,
            total: d.total,
            time: new Date(d.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
            staff: d.customerName || 'Nhân viên',
            items: d.items,
          }))
        );
      }
    } catch (err) {
      console.log('[CashierScreen] Could not load pending payments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPendingBills();
  }, []);

  // Lắng nghe sự kiện thanh toán thành công qua Socket.IO (Task B-010 & Task B-003)
  useSocketEvent('payment:completed', (payload: any) => {
    console.log('⚡ [CashierScreen] Payment completed event received:', payload);
    soundService.playPaymentCompleteAlert();
    setBills((prev) => prev.filter((b) => b.sessionId !== payload.sessionId));

    if (activeQrModal && activeQrModal.sessionId === payload.sessionId) {
      setActiveQrModal(null);
      Alert.alert('Thành công', `Khách đã thanh toán ${formatCurrency(payload.amount)} thành công qua VietQR!`);
    }
  });

  useSocketEvent('session:updated', () => {
    loadPendingBills();
  });

  // Countdown cho VietQR Modal (60s)
  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    if (activeQrModal && qrCountdown > 0) {
      timer = setInterval(() => {
        setQrCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [activeQrModal, qrCountdown]);

  // Mở mã VietQR động
  const handleOpenVietQR = async (bill: PendingBill) => {
    setActiveQrModal(bill);
    setQrCountdown(60);
    setQrLoading(true);
    try {
      const res = await api.createVietQR({ sessionId: bill.sessionId, amount: bill.total });
      setQrUrl(res.qrCodeUrl);
    } catch (err) {
      // Fallback QuickLink
      setQrUrl(`https://img.vietqr.io/image/970422-0334888999-compact2.png?amount=${bill.total}&addInfo=${encodeURIComponent(bill.tableName + ' TT')}`);
    } finally {
      setQrLoading(false);
    }
  };

  // Mở modal tiền mặt
  const handleOpenCashModal = (bill: PendingBill) => {
    setCashModalBill(bill);
    setCashReceivedInput(bill.total.toString());
  };

  // Xác nhận thu tiền mặt
  const handleConfirmCashPayment = async () => {
    if (!cashModalBill) return;
    const received = Number(cashReceivedInput) || 0;
    if (received < cashModalBill.total) {
      Alert.alert('Lỗi', 'Số tiền khách đưa chưa đủ!');
      return;
    }

    try {
      setCashLoading(true);
      const res = await api.payCash({
        sessionId: cashModalBill.sessionId,
        cashReceived: received,
      });

      setBills((prev) => prev.filter((b) => b.sessionId !== cashModalBill.sessionId));
      setCashModalBill(null);
      Alert.alert(
        'Thanh toán thành công',
        `Đã thu: ${formatCurrency(received)}\nTiền thối: ${formatCurrency(res.change)}\nĐiểm tích lũy: +${res.pointsEarned} điểm`
      );
    } catch (err: any) {
      Alert.alert('Lỗi', err.message || 'Không thể hoàn tất thanh toán');
    } finally {
      setCashLoading(false);
    }
  };

  const totalPendingAmount = bills.reduce((sum, b) => sum + b.total, 0);
  const targetBill = bills.find((b) => b.tableName === selectedTable) || bills[0] || null;

  return (
    <View className="flex-1 bg-background">
      {/* Header Bar */}
      <View className="bg-white px-4 pt-2.5 pb-3 border-b border-[#F1F5F9]">
        <View className="flex-row items-center justify-between mb-2.5">
          <View className="flex-row items-center">
            <TouchableOpacity
              className="w-9 h-9 rounded-xl bg-slate-100 items-center justify-center mr-3 border border-border"
              onPress={onBack}
              activeOpacity={0.7}
            >
              <ArrowLeft size={18} color="#0F172A" />
            </TouchableOpacity>
            <View>
              <Text className="text-[20px] font-extrabold text-textMain">Quản Lý Thanh Toán</Text>
            </View>
          </View>
        </View>

        {/* Tổng tiền chờ thu */}
        <View className="flex-row justify-between items-center bg-purple-50 rounded-2xl p-3 border border-purple-200">
          <View>
            <Text className="text-[10.5px] font-bold text-purple-600 tracking-wider">TỔNG TIỀN CHỜ THU</Text>
            <Text className="text-lg font-extrabold text-purple-600 mt-0.5">{formatCurrency(totalPendingAmount)}</Text>
          </View>
          <View className="flex-row items-center gap-1.5 bg-white px-2.5 py-1 rounded-full border border-purple-200">
            <Receipt size={14} color="#7C3AED" />
            <Text className="text-xs font-bold text-purple-600">{bills.length} hoá đơn</Text>
          </View>
        </View>
      </View>

      {/* Bill List */}
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 16, paddingBottom: dynamicPaddingBottom + 12, gap: 12 }}
        showsVerticalScrollIndicator={false}
      >
        {bills.length === 0 ? (
          <View className="bg-white rounded-3xl p-8 items-center justify-center border border-dashed border-border">
            <CheckCircle2 size={48} color="#10B981" />
            <Text className="text-base font-extrabold text-textMain mt-3">Tất cả đã thanh toán xong!</Text>
            <Text className="text-[12.5px] text-textSecondary mt-1 text-center">Hiện tại không có bàn nào đang chờ xuất bill</Text>
          </View>
        ) : (
          bills.map((bill, bIdx) => {
            const isSelected = targetBill?.sessionId === bill.sessionId;
            return (
              <TouchableOpacity
                key={bIdx}
                className={`bg-white rounded-2xl p-4 border shadow-sm mb-3 ${
                  isSelected ? 'border-purple-600 border-2 bg-purple-50/40' : 'border-border'
                }`}
                onPress={() => setSelectedTable(bill.tableName)}
                activeOpacity={0.88}
              >
                <View className="flex-row justify-between items-start mb-3">
                  <View>
                    <View className="flex-row items-center gap-2 mb-1">
                      <Text className="text-[17px] font-extrabold text-textMain">{bill.tableName}</Text>
                      <View className={`px-2 py-0.5 rounded-md border ${isSelected ? 'bg-purple-600 border-purple-600' : 'bg-purple-50 border-purple-200'}`}>
                        <Text className={`text-[11px] font-bold ${isSelected ? 'text-white' : 'text-purple-600'}`}>
                          {isSelected ? 'Đang chọn' : 'Chờ tính tiền'}
                        </Text>
                      </View>
                    </View>
                    <View className="flex-row items-center gap-1">
                      <Clock size={12} color="#475569" />
                      <Text className="text-[11.5px] text-textSecondary">Vào lúc {bill.time}</Text>
                      <Text className="text-[10px] text-textMuted">•</Text>
                      <User size={12} color="#475569" />
                      <Text className="text-[11.5px] text-textSecondary">{bill.staff}</Text>
                      <Text className="text-[10px] text-textMuted">•</Text>
                      <Text className="text-[11.5px] text-textSecondary">{bill.count} món</Text>
                    </View>
                  </View>

                  <Text className="text-lg font-extrabold text-emerald-600">{formatCurrency(bill.total)}</Text>
                </View>

                <View className="flex-row gap-2 border-t border-slate-100 pt-3">
                  <TouchableOpacity
                    className="flex-1 flex-row items-center justify-center gap-1.5 py-2.5 rounded-xl border bg-emerald-50 border-emerald-200"
                    onPress={() => handleOpenCashModal(bill)}
                    activeOpacity={0.8}
                  >
                    <DollarSign size={16} color="#059669" />
                    <Text className="text-[12.5px] font-bold text-emerald-600">Tiền mặt</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    className="flex-1 flex-row items-center justify-center gap-1.5 py-2.5 rounded-xl border bg-blue-50 border-blue-200"
                    onPress={() => handleOpenVietQR(bill)}
                    activeOpacity={0.8}
                  >
                    <QrCode size={16} color="#2563EB" />
                    <Text className="text-[12.5px] font-bold text-blue-600">VietQR</Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>

      {/* Dynamic VietQR Preview Modal (Task B-010) */}
      {activeQrModal && (
        <Modal visible={!!activeQrModal} transparent animationType="fade">
          <View className="flex-1 bg-slate-900/60 justify-center items-center p-5">
            <View className="w-full max-w-[360px] bg-white rounded-3xl p-6 shadow-xl">
              <View className="flex-row justify-between items-start mb-4">
                <View>
                  <Text className="text-[17px] font-extrabold text-textMain">VietQR Động — {activeQrModal.tableName}</Text>
                  <Text className="text-xs text-textSecondary mt-0.5">Quét bằng ứng dụng ngân hàng bất kỳ</Text>
                </View>
                <TouchableOpacity
                  className="w-8 h-8 rounded-full bg-slate-100 items-center justify-center"
                  onPress={() => setActiveQrModal(null)}
                >
                  <X size={18} color="#0F172A" />
                </TouchableOpacity>
              </View>

              {/* QR Image Box */}
              <View className="items-center justify-center p-4 bg-slate-50 rounded-2xl border border-border mb-4">
                {qrLoading ? (
                  <View className="h-[200px] justify-center items-center">
                    <ActivityIndicator size="large" color="#2563EB" />
                    <Text className="text-xs text-textSecondary mt-2">Đang sinh mã QR Napas 247...</Text>
                  </View>
                ) : qrUrl ? (
                  <Image source={{ uri: qrUrl }} style={{ width: 200, height: 200 }} resizeMode="contain" />
                ) : (
                  <QrCode size={140} color="#0F172A" />
                )}
                <Text className="text-xl font-black text-primaryDark mt-3">{formatCurrency(activeQrModal.total)}</Text>
                <Text className="text-xs text-textSecondary mt-0.5 font-semibold">Tự động xác nhận sau khi nhận tiền</Text>
              </View>

              {/* Countdown Bar */}
              <View className="flex-row items-center justify-between bg-blue-50 px-3.5 py-2 rounded-xl border border-blue-200 mb-4">
                <View className="flex-row items-center gap-1.5">
                  <Clock size={14} color="#2563EB" />
                  <Text className="text-xs font-bold text-blue-700">Thời gian hiệu lực</Text>
                </View>
                <Text className={`text-xs font-black ${qrCountdown <= 10 ? 'text-red-600' : 'text-blue-700'}`}>
                  {qrCountdown}s
                </Text>
              </View>

              <TouchableOpacity
                className="bg-primary rounded-2xl py-3.5 flex-row items-center justify-center gap-2 active:bg-primaryDark"
                onPress={() => {
                  setBills((prev) => prev.filter((b) => b.sessionId !== activeQrModal.sessionId));
                  setActiveQrModal(null);
                  Alert.alert('Thành công', `Đã xác nhận thủ công cho ${activeQrModal.tableName}!`);
                }}
                activeOpacity={0.85}
              >
                <CheckCircle2 size={16} color="#FFFFFF" />
                <Text className="text-white text-[13.5px] font-bold">Xác nhận đã nhận tiền thủ công</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}

      {/* Cash Payment Modal (Task B-009) */}
      {cashModalBill && (
        <Modal visible={!!cashModalBill} transparent animationType="fade">
          <View className="flex-1 bg-slate-900/60 justify-center items-center p-5">
            <View className="w-full max-w-[360px] bg-white rounded-3xl p-6 shadow-xl">
              <View className="flex-row justify-between items-start mb-4">
                <View>
                  <Text className="text-[17px] font-extrabold text-textMain">Thu Tiền Mặt — {cashModalBill.tableName}</Text>
                  <Text className="text-xs text-textSecondary mt-0.5">Tổng tiền: {formatCurrency(cashModalBill.total)}</Text>
                </View>
                <TouchableOpacity
                  className="w-8 h-8 rounded-full bg-slate-100 items-center justify-center"
                  onPress={() => setCashModalBill(null)}
                >
                  <X size={18} color="#0F172A" />
                </TouchableOpacity>
              </View>

              <View className="mb-4">
                <Text className="text-xs font-bold text-textSecondary mb-1.5">Số tiền khách đưa (VNĐ)</Text>
                <TextInput
                  className="bg-slate-50 border border-border rounded-xl px-3.5 py-2.5 text-lg font-bold text-textMain"
                  keyboardType="number-pad"
                  value={cashReceivedInput}
                  onChangeText={setCashReceivedInput}
                  placeholder="Nhập số tiền..."
                />
              </View>

              {/* Tính tiền thối */}
              <View className="bg-emerald-50 rounded-xl p-3 border border-emerald-200 mb-5">
                <Text className="text-xs font-semibold text-emerald-700">Tiền thối lại cho khách:</Text>
                <Text className="text-xl font-black text-emerald-700 mt-1">
                  {formatCurrency(Math.max(0, (Number(cashReceivedInput) || 0) - cashModalBill.total))}
                </Text>
              </View>

              <TouchableOpacity
                className="bg-emerald-600 rounded-2xl py-3.5 flex-row items-center justify-center gap-2 active:bg-emerald-700"
                onPress={handleConfirmCashPayment}
                disabled={cashLoading}
                activeOpacity={0.85}
              >
                {cashLoading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <DollarSign size={16} color="#FFFFFF" />
                    <Text className="text-white text-[13.5px] font-bold">Xác nhận thu tiền & đóng bàn</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
};

export default CashierScreen;
