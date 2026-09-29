import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
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
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface BillItem {
  table: string;
  count: number;
  amount: number;
  time: string;
  staff: string;
}

interface CashierScreenProps {
  onBack: () => void;
}

export const CashierScreen: React.FC<CashierScreenProps> = ({ onBack }) => {
  const insets = useSafeAreaInsets();

  const dynamicPaddingBottom = insets.bottom > 0 ? Math.max(insets.bottom - 16, 6) : 6;

  const [bills, setBills] = useState<BillItem[]>([
    { table: 'Đơn #ĐH-101', count: 3, amount: 113000, time: '14:35', staff: 'Trần Tuấn' },
    { table: 'Đơn #ĐH-102', count: 3, amount: 133000, time: '14:40', staff: 'Nguyễn Vy' },
    { table: 'Đơn #ĐH-105', count: 3, amount: 125000, time: '14:48', staff: 'Trần Tuấn' },
  ]);

  const [selectedTable, setSelectedTable] = useState<string | null>('Đơn #ĐH-101');
  const [activeQrModal, setActiveQrModal] = useState<BillItem | null>(null);

  const targetBill = bills.find((b) => b.table === selectedTable) || bills[0] || null;

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
  };

  const totalPendingAmount = bills.reduce((sum, b) => sum + b.amount, 0);

  const handleCashPayment = (bill: BillItem) => {
    Alert.alert(
      'Thanh toán Tiền mặt',
      `Xác nhận thu ${formatCurrency(bill.amount)} tiền mặt từ ${bill.table}?`,
      [
        { text: 'Huỷ', style: 'cancel' },
        {
          text: 'Xác nhận thu tiền',
          onPress: () => {
            setBills((prev) => prev.filter((b) => b.table !== bill.table));
            Alert.alert('Thành công', `Đã hoàn tất thanh toán tiền mặt cho ${bill.table}!`);
          },
        },
      ]
    );
  };

  return (
    <View className="flex-1 bg-background">
      {/* Header Bar */}
      <View className="bg-white px-4 pt-2.5 pb-3 border-b border-[#F1F5F9]">
        <View className="flex-row items-center mb-2.5">
          <TouchableOpacity
            className="w-9 h-9 rounded-xl bg-slate-100 items-center justify-center mr-3 border border-border"
            onPress={onBack}
            activeOpacity={0.7}
          >
            <ArrowLeft size={18} color="#0F172A" />
          </TouchableOpacity>
          <View className="flex-1">
            <Text className="text-[20px] font-extrabold text-textMain">Quản Lý Thanh Toán</Text>
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
            <Text className="text-[12.5px] text-textSecondary mt-1 text-center">Hiện tại không có đơn nào đang chờ xuất bill</Text>
          </View>
        ) : (
          bills.map((bill, bIdx) => {
            const isSelected = targetBill?.table === bill.table;
            return (
              <TouchableOpacity
                key={bIdx}
                className={`bg-white rounded-2xl p-4 border shadow-sm mb-3 ${
                  isSelected ? 'border-purple-600 border-2 bg-purple-50/40' : 'border-border'
                }`}
                onPress={() => setSelectedTable(bill.table)}
                activeOpacity={0.88}
              >
                <View className="flex-row justify-between items-start mb-3">
                  <View>
                    <View className="flex-row items-center gap-2 mb-1">
                      <Text className="text-[17px] font-extrabold text-textMain">{bill.table}</Text>
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

                  <Text className="text-lg font-extrabold text-emerald-600">{formatCurrency(bill.amount)}</Text>
                </View>

                <View className="flex-row gap-2 border-t border-slate-100 pt-3">
                  <TouchableOpacity
                    className="flex-1 flex-row items-center justify-center gap-1.5 py-2.5 rounded-xl border bg-emerald-50 border-emerald-200"
                    onPress={() => handleCashPayment(bill)}
                    activeOpacity={0.8}
                  >
                    <DollarSign size={16} color="#059669" />
                    <Text className="text-[12.5px] font-bold text-emerald-600">Tiền mặt</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    className="flex-1 flex-row items-center justify-center gap-1.5 py-2.5 rounded-xl border bg-blue-50 border-blue-200"
                    onPress={() => setActiveQrModal(bill)}
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

      {/* Dynamic VietQR Preview Modal */}
      {activeQrModal && (
        <Modal visible={!!activeQrModal} transparent animationType="fade">
          <View className="flex-1 bg-slate-900/60 justify-center items-center p-5">
            <View className="w-full max-w-[360px] bg-white rounded-3xl p-6 shadow-xl">
              <View className="flex-row justify-between items-start mb-5">
                <View>
                  <Text className="text-[17px] font-extrabold text-textMain">VietQR Động - {activeQrModal.table}</Text>
                </View>
                <TouchableOpacity
                  className="w-8 h-8 rounded-full bg-slate-100 items-center justify-center"
                  onPress={() => setActiveQrModal(null)}
                >
                  <X size={18} color="#0F172A" />
                </TouchableOpacity>
              </View>

              <View className="items-center justify-center p-5 bg-slate-50 rounded-2xl border border-border mb-5">
                <QrCode size={140} color="#0F172A" />
                <Text className="text-xl font-black text-primaryDark mt-3.5">{formatCurrency(activeQrModal.amount)}</Text>
                <Text className="text-xs text-textSecondary mt-1 font-semibold">Nội dung: {activeQrModal.table} TT</Text>
              </View>

              <TouchableOpacity
                className="bg-primary rounded-2xl py-3.5 flex-row items-center justify-center gap-2 active:bg-primaryDark"
                onPress={() => {
                  setBills((prev) => prev.filter((b) => b.table !== activeQrModal.table));
                  setActiveQrModal(null);
                  Alert.alert('Thành công', `Đã xác nhận VietQR tự động cho ${activeQrModal.table}!`);
                }}
                activeOpacity={0.85}
              >
                <CheckCircle2 size={16} color="#FFFFFF" />
                <Text className="text-white text-[13.5px] font-bold">Xác nhận khách đã chuyển khoản</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
};

export default CashierScreen;
