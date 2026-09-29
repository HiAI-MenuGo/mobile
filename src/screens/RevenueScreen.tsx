import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Modal,
} from 'react-native';
import {
  CreditCard,
  Coins,
  Calendar as CalendarIcon,
  ArrowUpRight,
  ReceiptText,
  ChevronLeft,
  ChevronRight,
  X,
  Check,
  RotateCcw,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export const RevenueScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const dynamicContentPaddingBottom = (insets.bottom > 0 ? Math.max(insets.bottom - 16, 6) : 6) + 76;
  const [timeframe, setTimeframe] = useState<'day' | 'month' | 'year'>('day');

  // State quản lý ngày, tháng, năm được chọn
  const [selectedDay, setSelectedDay] = useState<number>(18);
  const [selectedMonth, setSelectedMonth] = useState<number>(9);
  const [selectedYear, setSelectedYear] = useState<number>(2026);

  // State mở modal chọn chi tiết
  const [isPickerModalOpen, setIsPickerModalOpen] = useState(false);

  // Temporary state trong modal trước khi nhấn Áp dụng
  const [tempDay, setTempDay] = useState<number>(selectedDay);
  const [tempMonth, setTempMonth] = useState<number>(selectedMonth);
  const [tempYear, setTempYear] = useState<number>(selectedYear);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  // Hàm chuyển nhanh ngày/tháng/năm bằng nút mũi tên < >
  const handlePrevious = () => {
    if (timeframe === 'day') {
      if (selectedDay > 1) {
        setSelectedDay((prev) => prev - 1);
      } else if (selectedMonth > 1) {
        setSelectedMonth((prev) => prev - 1);
        setSelectedDay(30);
      }
    } else if (timeframe === 'month') {
      if (selectedMonth > 1) {
        setSelectedMonth((prev) => prev - 1);
      } else {
        setSelectedYear((prev) => prev - 1);
        setSelectedMonth(12);
      }
    } else {
      setSelectedYear((prev) => prev - 1);
    }
  };

  const handleNext = () => {
    if (timeframe === 'day') {
      if (selectedDay < 31) {
        setSelectedDay((prev) => prev + 1);
      } else if (selectedMonth < 12) {
        setSelectedMonth((prev) => prev + 1);
        setSelectedDay(1);
      }
    } else if (timeframe === 'month') {
      if (selectedMonth < 12) {
        setSelectedMonth((prev) => prev + 1);
      } else {
        setSelectedYear((prev) => prev + 1);
        setSelectedMonth(1);
      }
    } else {
      setSelectedYear((prev) => prev + 1);
    }
  };

  // Mở modal picker
  const openPicker = () => {
    setTempDay(selectedDay);
    setTempMonth(selectedMonth);
    setTempYear(selectedYear);
    setIsPickerModalOpen(true);
  };

  // Áp dụng lựa chọn từ modal
  const applyPicker = () => {
    setSelectedDay(tempDay);
    setSelectedMonth(tempMonth);
    setSelectedYear(tempYear);
    setIsPickerModalOpen(false);
  };

  // Đặt về ngày hiện tại
  const resetToToday = () => {
    setSelectedDay(18);
    setSelectedMonth(9);
    setSelectedYear(2026);
    setIsPickerModalOpen(false);
  };

  // Nhãn hiển thị ngày/tháng/năm đã chọn
  const getFilterLabel = () => {
    const pad = (n: number) => n.toString().padStart(2, '0');
    if (timeframe === 'day') {
      return `${pad(selectedDay)}/${pad(selectedMonth)}/${selectedYear}`;
    }
    if (timeframe === 'month') {
      return `Tháng ${pad(selectedMonth)} / ${selectedYear}`;
    }
    return `Năm ${selectedYear}`;
  };

  // Tính toán dữ liệu doanh thu tương ứng theo ngày/tháng/năm
  const getComputedRevenue = () => {
    if (timeframe === 'day') {
      const base = 7500000 + ((selectedDay * 170000) % 2200000);
      const transfer = Math.round(base * 0.65);
      const cash = base - transfer;
      return {
        total: base,
        growthPercent: selectedDay % 2 === 0 ? 12.8 : 8.5,
        orderCount: 110 + (selectedDay % 35),
        cashTotal: cash,
        transferTotal: transfer,
        breakdown: [
          { label: '07h', value: Math.round(base * 0.08) },
          { label: '09h', value: Math.round(base * 0.16) },
          { label: '11h', value: Math.round(base * 0.22) },
          { label: '13h', value: Math.round(base * 0.12) },
          { label: '15h', value: Math.round(base * 0.18) },
          { label: '17h', value: Math.round(base * 0.14) },
          { label: '19h', value: Math.round(base * 0.10) },
        ],
        transactions: [
          { id: `HD-${selectedDay}842`, time: '14:32', amount: 145000, method: 'VIETQR', table: 'Bàn 03' },
          { id: `HD-${selectedDay}841`, time: '14:15', amount: 84000, method: 'CASH', table: 'Đơn #8841' },
          { id: `HD-${selectedDay}840`, time: '13:50', amount: 220000, method: 'VIETQR', table: 'Bàn VIP 1' },
          { id: `HD-${selectedDay}839`, time: '13:12', amount: 98000, method: 'CARD', table: 'Bàn 02' },
          { id: `HD-${selectedDay}838`, time: '12:45', amount: 310000, method: 'VIETQR', table: 'Bàn 01' },
        ],
      };
    }

    if (timeframe === 'month') {
      const base = 220000000 + ((selectedMonth * 6500000) % 45000000);
      const transfer = Math.round(base * 0.7);
      const cash = base - transfer;
      return {
        total: base,
        growthPercent: 18.5,
        orderCount: 3400 + selectedMonth * 80,
        cashTotal: cash,
        transferTotal: transfer,
        breakdown: [
          { label: 'Tuần 1', value: Math.round(base * 0.24) },
          { label: 'Tuần 2', value: Math.round(base * 0.27) },
          { label: 'Tuần 3', value: Math.round(base * 0.23) },
          { label: 'Tuần 4', value: Math.round(base * 0.26) },
        ],
        transactions: [
          { id: `HD-T${selectedMonth}-01`, time: `Tuần 4`, amount: 64900000, method: 'VIETQR', table: 'Tổng hợp' },
          { id: `HD-T${selectedMonth}-02`, time: `Tuần 3`, amount: 61200000, method: 'VIETQR', table: 'Tổng hợp' },
          { id: `HD-T${selectedMonth}-03`, time: `Tuần 2`, amount: 64500000, method: 'CARD', table: 'Tổng hợp' },
          { id: `HD-T${selectedMonth}-04`, time: `Tuần 1`, amount: 58000000, method: 'CASH', table: 'Tổng hợp' },
        ],
      };
    }

    // Theo Năm
    const base = 2600000000 + ((selectedYear - 2023) * 250000000);
    const transfer = Math.round(base * 0.72);
    const cash = base - transfer;
    return {
      total: base,
      growthPercent: 24.2,
      orderCount: 42000 + (selectedYear - 2023) * 3200,
      cashTotal: cash,
      transferTotal: transfer,
      breakdown: [
        { label: 'Quý 1', value: Math.round(base * 0.23) },
        { label: 'Quý 2', value: Math.round(base * 0.26) },
        { label: 'Quý 3', value: Math.round(base * 0.28) },
        { label: 'Quý 4', value: Math.round(base * 0.23) },
      ],
      transactions: [
        { id: `NĂM-${selectedYear}-Q4`, time: 'Quý 4', amount: Math.round(base * 0.23), method: 'VIETQR', table: 'Toàn chi nhánh' },
        { id: `NĂM-${selectedYear}-Q3`, time: 'Quý 3', amount: Math.round(base * 0.28), method: 'VIETQR', table: 'Toàn chi nhánh' },
        { id: `NĂM-${selectedYear}-Q2`, time: 'Quý 2', amount: Math.round(base * 0.26), method: 'CARD', table: 'Toàn chi nhánh' },
        { id: `NĂM-${selectedYear}-Q1`, time: 'Quý 1', amount: Math.round(base * 0.23), method: 'CASH', table: 'Toàn chi nhánh' },
      ],
    };
  };

  const data = getComputedRevenue();
  const maxValue = Math.max(...data.breakdown.map((item) => item.value));

  // Số ngày tối đa trong tháng đang chọn
  const daysInCurrentMonth = new Date(tempYear, tempMonth, 0).getDate();
  const daysArray = Array.from({ length: daysInCurrentMonth }, (_, i) => i + 1);
  const monthsArray = Array.from({ length: 12 }, (_, i) => i + 1);
  const yearsArray = [2023, 2024, 2025, 2026, 2027];

  return (
    <View className="flex-1 bg-background">
      {/* Header Bar */}
      <View className="bg-white px-4 pt-2.5 pb-3 border-b border-[#F1F5F9]">
        <View className="flex-row justify-between items-center">
          <Text className="text-[20px] font-extrabold text-textMain">Báo Cáo Doanh Thu</Text>
          <TouchableOpacity
            className="flex-row items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#F1F5F9] border border-border"
            onPress={openPicker}
            activeOpacity={0.75}
          >
            <CalendarIcon size={14} color="#059669" />
            <Text className="text-[12px] font-bold text-textMain">{getFilterLabel()}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 16, paddingTop: 14, paddingBottom: dynamicContentPaddingBottom }}
        showsVerticalScrollIndicator={false}
      >
        {/* Segmented Control: NGÀY / THÁNG / NĂM */}
      <View className="flex-row bg-[#E2E8F0] rounded-full p-1 mb-3">
        <TouchableOpacity
          className={`flex-1 py-[9px] items-center rounded-full ${timeframe === 'day' ? 'bg-white' : ''}`}
          onPress={() => setTimeframe('day')}
          activeOpacity={0.8}
        >
          <Text className={`text-[13px] ${timeframe === 'day' ? 'text-primaryDark font-extrabold' : 'font-semibold text-textSecondary'}`}>
            Theo Ngày
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          className={`flex-1 py-[9px] items-center rounded-full ${timeframe === 'month' ? 'bg-white' : ''}`}
          onPress={() => setTimeframe('month')}
          activeOpacity={0.8}
        >
          <Text className={`text-[13px] ${timeframe === 'month' ? 'text-primaryDark font-extrabold' : 'font-semibold text-textSecondary'}`}>
            Theo Tháng
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          className={`flex-1 py-[9px] items-center rounded-full ${timeframe === 'year' ? 'bg-white' : ''}`}
          onPress={() => setTimeframe('year')}
          activeOpacity={0.8}
        >
          <Text className={`text-[13px] ${timeframe === 'year' ? 'text-primaryDark font-extrabold' : 'font-semibold text-textSecondary'}`}>
            Theo Năm
          </Text>
        </TouchableOpacity>
      </View>

      {/* Main Revenue Card */}
      <View
        className="bg-white rounded-[20px] p-[18px] border border-border mb-4"
        style={{
          shadowColor: '#0F172A',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.05,
          shadowRadius: 10,
          elevation: 2,
        }}
      >
        <View className="flex-row justify-between items-center">
          <Text className="text-[11px] font-extrabold text-textMuted tracking-[0.8px]">TỔNG TIỀN THU VÀO</Text>
          <View className="flex-row items-center bg-[#ECFDF5] px-2 py-[3px] rounded-full">
            <ArrowUpRight size={14} color="#047857" />
            <Text className="text-[#047857] text-[12px] font-bold ml-0.5">+{data.growthPercent}%</Text>
          </View>
        </View>

        <Text className="text-[30px] font-black text-textMain my-1.5 tracking-[-0.5px]">{formatCurrency(data.total)}</Text>
        <Text className="text-[13px] text-textSecondary mb-4">{data.orderCount} lượt giao dịch trong kỳ</Text>

        {/* Method Breakdown */}
        <View className="flex-row gap-2.5 pt-3.5 border-t border-[#F1F5F9]">
          <View className="flex-1 bg-[#F8FAFC] rounded-[14px] p-3 border border-border">
            <View className="flex-row items-center gap-1.5 mb-1.5">
              <View className="w-5 h-5 rounded-full items-center justify-center bg-[#2563EB]">
                <CreditCard size={12} color="#FFFFFF" strokeWidth={2.5} />
              </View>
              <Text className="text-[11px] font-semibold text-textSecondary">VietQR / Thẻ</Text>
            </View>
            <Text className="text-[15px] font-extrabold text-textMain my-0.5">{formatCurrency(data.transferTotal)}</Text>
            <Text className="text-[10.5px] text-textMuted">
              {Math.round((data.transferTotal / data.total) * 100)}% tổng thu
            </Text>
          </View>

          <View className="flex-1 bg-[#F8FAFC] rounded-[14px] p-3 border border-border">
            <View className="flex-row items-center gap-1.5 mb-1.5">
              <View className="w-5 h-5 rounded-full items-center justify-center bg-primaryDark">
                <Coins size={12} color="#FFFFFF" strokeWidth={2.5} />
              </View>
              <Text className="text-[11px] font-semibold text-textSecondary">Tiền mặt (Cash)</Text>
            </View>
            <Text className="text-[15px] font-extrabold text-textMain my-0.5">{formatCurrency(data.cashTotal)}</Text>
            <Text className="text-[10.5px] text-textMuted">
              {Math.round((data.cashTotal / data.total) * 100)}% tổng thu
            </Text>
          </View>
        </View>
      </View>

      {/* Visual Chart / Breakdown */}
      <View
        className="bg-white rounded-[20px] p-[18px] border border-border mb-4"
        style={{
          shadowColor: '#0F172A',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.05,
          shadowRadius: 10,
          elevation: 2,
        }}
      >
        <View className="flex-row justify-between items-center mb-3.5">
          <Text className="text-[14px] font-extrabold text-textMain">Biểu Đồ Theo Mốc {timeframe === 'day' ? 'Giờ' : timeframe === 'month' ? 'Tuần' : 'Quý'}</Text>
          <Text className="text-[11px] font-bold text-primaryDark bg-[#ECFDF5] px-2 py-0.5 rounded-full">{getFilterLabel()}</Text>
        </View>

        <View className="flex-row items-end justify-between h-[120px] pt-3 px-1">
          {data.breakdown.map((bar, idx) => {
            const heightPercent = maxValue > 0 ? (bar.value / maxValue) * 100 : 10;
            return (
              <View key={idx} className="items-center flex-1">
                <View className="w-4 h-[90px] bg-[#F1F5F9] rounded-full justify-end overflow-hidden">
                  <View
                    className="w-full bg-primary rounded-full"
                    style={{ height: `${Math.max(heightPercent, 12)}%` }}
                  />
                </View>
                <Text className="text-[10px] font-bold text-textMuted mt-1.5">{bar.label}</Text>
              </View>
            );
          })}
        </View>
      </View>

      {/* Transactions List */}
      <View className="bg-white rounded-[20px] p-4 border border-border">
        <View className="flex-row justify-between items-center mb-3">
          <Text className="text-[14.5px] font-extrabold text-textMain">Lịch Sử Giao Dịch Nhận Tiền</Text>
          <ReceiptText size={16} color="#10B981" />
        </View>

        {data.transactions.map((tx, idx) => (
          <View key={tx.id}>
            <View className="flex-row justify-between items-center py-2.5">
              <View className="flex-row items-center flex-1 mr-2">
                <View className="px-2 py-1 rounded-[8px] bg-[#ECFDF5] mr-2.5">
                  <Text className="text-[10.5px] font-extrabold text-primaryDark">{tx.method}</Text>
                </View>
                <View className="flex-1">
                  <Text className="text-[13.5px] font-bold text-textMain">{tx.id} • {tx.table}</Text>
                  <Text className="text-[11px] text-textMuted mt-0.5">{tx.time}</Text>
                </View>
              </View>
              <View className="items-end">
                <Text className="text-[13.5px] font-extrabold text-primaryDark">+{formatCurrency(tx.amount)}</Text>
                <Text className="text-[10.5px] text-[#059669] font-semibold">Thành công</Text>
              </View>
            </View>
            {idx < data.transactions.length - 1 && <View className="h-[1px] bg-[#F1F5F9]" />}
          </View>
        ))}
      </View>

      {/* Modal Bộ lọc chi tiết Ngày / Tháng / Năm */}
      <Modal visible={isPickerModalOpen} transparent animationType="fade">
        <View className="flex-1 bg-[rgba(15,23,42,0.5)] justify-center items-center p-5">
          <View className="bg-white rounded-[24px] p-5 w-full max-w-[400px] max-h-[85%]">
            {/* Modal Header */}
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-[16px] font-extrabold text-textMain">
                {timeframe === 'day' && 'Chọn Ngày Cần Xem'}
                {timeframe === 'month' && 'Chọn Tháng Cần Xem'}
                {timeframe === 'year' && 'Chọn Năm Cần Xem'}
              </Text>
              <TouchableOpacity onPress={() => setIsPickerModalOpen(false)}>
                <X size={20} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            {/* Selector Content */}
            <ScrollView className="max-h-[380px]" showsVerticalScrollIndicator={false}>
              {/* Theo Ngày */}
              {timeframe === 'day' && (
                <View>
                  <Text className="text-[11px] font-extrabold text-textMuted mb-2">THÁNG & NĂM</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, marginBottom: 10 }}>
                    {monthsArray.map((m) => (
                      <TouchableOpacity
                        key={m}
                        className={`px-3 py-1.5 rounded-full ${tempMonth === m ? 'bg-primary' : 'bg-[#F1F5F9]'}`}
                        onPress={() => setTempMonth(m)}
                      >
                        <Text className={`text-[12px] ${tempMonth === m ? 'text-white font-bold' : 'font-semibold text-textSecondary'}`}>
                          Thg {m}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>

                  <View className="flex-row gap-2 mb-3">
                    {yearsArray.map((y) => (
                      <TouchableOpacity
                        key={y}
                        className={`flex-1 py-1.5 rounded-[10px] items-center border ${tempYear === y ? 'bg-[#ECFDF5] border-primary' : 'bg-[#F8FAFC] border-border'}`}
                        onPress={() => setTempYear(y)}
                      >
                        <Text className={`text-[11.5px] ${tempYear === y ? 'text-primaryDark font-extrabold' : 'font-semibold text-textSecondary'}`}>
                          {y}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <Text className="text-[11px] font-extrabold text-textMuted mb-2">NGÀY TRONG THÁNG {tempMonth}/{tempYear}</Text>
                  <View className="flex-row flex-wrap gap-2">
                    {daysArray.map((d) => {
                      const isSelected = tempDay === d;
                      return (
                        <TouchableOpacity
                          key={d}
                          className={`w-[44px] h-[40px] rounded-[10px] items-center justify-center border ${isSelected ? 'bg-primary border-primary' : 'bg-[#F8FAFC] border-border'}`}
                          onPress={() => setTempDay(d)}
                        >
                          <Text className={`text-[13px] ${isSelected ? 'text-white font-extrabold' : 'font-bold text-textMain'}`}>
                            {d}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              )}

              {/* Theo Tháng */}
              {timeframe === 'month' && (
                <View>
                  <Text className="text-[11px] font-extrabold text-textMuted mb-2">NĂM</Text>
                  <View className="flex-row gap-2 mb-3">
                    {yearsArray.map((y) => (
                      <TouchableOpacity
                        key={y}
                        className={`flex-1 py-1.5 rounded-[10px] items-center border ${tempYear === y ? 'bg-[#ECFDF5] border-primary' : 'bg-[#F8FAFC] border-border'}`}
                        onPress={() => setTempYear(y)}
                      >
                        <Text className={`text-[11.5px] ${tempYear === y ? 'text-primaryDark font-extrabold' : 'font-semibold text-textSecondary'}`}>
                          {y}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <Text className="text-[11px] font-extrabold text-textMuted mb-2">CÁC THÁNG TRONG NĂM {tempYear}</Text>
                  <View className="flex-row flex-wrap gap-2">
                    {monthsArray.map((m) => {
                      const isSelected = tempMonth === m;
                      return (
                        <TouchableOpacity
                          key={m}
                          className={`w-[30%] py-2.5 rounded-[12px] items-center border ${isSelected ? 'bg-primary border-primary' : 'bg-[#F8FAFC] border-border'}`}
                          onPress={() => setTempMonth(m)}
                        >
                          <Text className={`text-[13px] ${isSelected ? 'text-white font-extrabold' : 'font-bold text-textMain'}`}>
                            Tháng {m}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              )}

              {/* Theo Năm */}
              {timeframe === 'year' && (
                <View>
                  <Text className="text-[11px] font-extrabold text-textMuted mb-2">CHỌN NĂM TÀI CHÍNH</Text>
                  <View className="gap-2">
                    {yearsArray.map((y) => {
                      const isSelected = tempYear === y;
                      return (
                        <TouchableOpacity
                          key={y}
                          className={`flex-row justify-between items-center p-3 rounded-[14px] border ${isSelected ? 'bg-primary border-primary' : 'bg-[#F8FAFC] border-border'}`}
                          onPress={() => setTempYear(y)}
                        >
                          <Text className={`text-[14px] ${isSelected ? 'text-white font-extrabold' : 'font-bold text-textMain'}`}>
                            Năm {y}
                          </Text>
                          {isSelected && <Check size={18} color="#FFFFFF" strokeWidth={2.5} />}
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              )}
            </ScrollView>

            {/* Modal Actions Footer */}
            <View className="flex-row gap-2.5 pt-3.5 mt-2 border-t border-[#F1F5F9]">
              <TouchableOpacity className="flex-row items-center gap-1.5 px-4 py-3 rounded-full bg-[#F1F5F9]" onPress={resetToToday} activeOpacity={0.8}>
                <RotateCcw size={15} color="#475569" />
                <Text className="text-[13px] font-bold text-textSecondary">Hiện tại</Text>
              </TouchableOpacity>

              <TouchableOpacity className="flex-1 flex-row items-center justify-center gap-1.5 py-3 rounded-full bg-primary" onPress={applyPicker} activeOpacity={0.85}>
                <Check size={16} color="#FFFFFF" strokeWidth={2.5} />
                <Text className="text-[13.5px] font-extrabold text-white">Áp Dụng Bộ Lọc</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      </ScrollView>
    </View>
  );
};
