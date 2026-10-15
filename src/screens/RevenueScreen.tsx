import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  useWindowDimensions,
} from 'react-native';
import Svg, {
  Path,
  Defs,
  LinearGradient,
  Stop,
  Line,
} from 'react-native-svg';
import {
  Coins,
  Calendar as CalendarIcon,
  ArrowUpRight,
  ReceiptText,
  X,
  Check,
  RotateCcw,
  QrCode,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { api } from '../services/api';

export const RevenueScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const dynamicContentPaddingBottom = (insets.bottom > 0 ? Math.max(insets.bottom - 16, 6) : 6) + 76;
  const [timeframe, setTimeframe] = useState<'day' | 'month' | 'year'>('day');

  // Quản lý ngày được chọn (mặc định hôm nay)
  const today = new Date();
  const [selectedDay, setSelectedDay] = useState<number>(today.getDate());
  const [selectedMonth, setSelectedMonth] = useState<number>(today.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(today.getFullYear());

  // Modal bộ lọc
  const [isPickerModalOpen, setIsPickerModalOpen] = useState(false);
  const [tempDay, setTempDay] = useState<number>(selectedDay);
  const [tempMonth, setTempMonth] = useState<number>(selectedMonth);
  const [tempYear, setTempYear] = useState<number>(selectedYear);

  // Dữ liệu API thật
  const [loading, setLoading] = useState<boolean>(true);
  const [report, setReport] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  const pad = (n: number) => n.toString().padStart(2, '0');

  // Tính khoảng ngày theo timeframe
  const getDateRange = useCallback(() => {
    if (timeframe === 'day') {
      const dStr = `${selectedYear}-${pad(selectedMonth)}-${pad(selectedDay)}`;
      return { startDate: dStr, endDate: dStr };
    }
    if (timeframe === 'month') {
      const lastDay = new Date(selectedYear, selectedMonth, 0).getDate();
      return {
        startDate: `${selectedYear}-${pad(selectedMonth)}-01`,
        endDate: `${selectedYear}-${pad(selectedMonth)}-${pad(lastDay)}`,
      };
    }
    return {
      startDate: `${selectedYear}-01-01`,
      endDate: `${selectedYear}-12-31`,
    };
  }, [timeframe, selectedDay, selectedMonth, selectedYear]);

  const loadRevenueData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { startDate, endDate } = getDateRange();
      const res = await api.getRevenueReport({ startDate, endDate });
      setReport(res);
    } catch (err: any) {
      setError(err?.message || 'Không tải được báo cáo doanh thu');
    } finally {
      setLoading(false);
    }
  }, [getDateRange]);

  useEffect(() => {
    loadRevenueData();
  }, [loadRevenueData]);

  // Mở modal picker
  const openPicker = () => {
    setTempDay(selectedDay);
    setTempMonth(selectedMonth);
    setTempYear(selectedYear);
    setIsPickerModalOpen(true);
  };

  const applyPicker = () => {
    setSelectedDay(tempDay);
    setSelectedMonth(tempMonth);
    setSelectedYear(tempYear);
    setIsPickerModalOpen(false);
  };

  const resetToToday = () => {
    const now = new Date();
    setSelectedDay(now.getDate());
    setSelectedMonth(now.getMonth() + 1);
    setSelectedYear(now.getFullYear());
    setIsPickerModalOpen(false);
  };

  const getFilterLabel = () => {
    if (timeframe === 'day') {
      return `${pad(selectedDay)}/${pad(selectedMonth)}/${selectedYear}`;
    }
    if (timeframe === 'month') {
      return `Tháng ${pad(selectedMonth)} / ${selectedYear}`;
    }
    return `Năm ${selectedYear}`;
  };

  const summary = report?.summary || {
    totalRevenue: 0,
    orderCount: 0,
    qrRevenue: 0,
    cashRevenue: 0,
    growthPercent: 0,
  };

  const dailyTrend = report?.dailyTrend || [];
  const hourlyTrend = report?.hourlyTrend || [];
  const monthlyTrend = report?.monthlyTrend || [];
  const recentOrders = report?.recentOrders || [];

  const { width: screenWidth } = useWindowDimensions();

  // Ngày → giờ (hourlyTrend 24h), Tháng → ngày (dailyTrend), Năm → tháng (monthlyTrend)
  const trendData = useMemo(() => {
    if (timeframe === 'day') {
      return hourlyTrend.map((h: any) => ({
        label: `${String(h.hour ?? 0).padStart(2, '0')}h`,
        revenue: h.revenue || 0,
      }));
    }
    if (timeframe === 'year') {
      return monthlyTrend.map((m: any) => ({
        label: m.shortLabel || m.label || m.month,
        revenue: m.revenue || 0,
      }));
    }
    return dailyTrend.map((d: any) => {
      const parts = (d.date || '').split('-');
      return {
        label: parts.length === 3 ? `${parts[2]}/${parts[1]}` : d.date,
        revenue: d.revenue || 0,
      };
    });
  }, [timeframe, dailyTrend, hourlyTrend, monthlyTrend]);
  const maxTrendRevenue = useMemo(
    () => Math.max(...trendData.map((d: any) => d.revenue), 1),
    [trendData]
  );

  // Dựng smooth path kiểu monotone giống recharts trên web
  const buildSmoothPath = (pts: Array<{ x: number; y: number }>) => {
    if (pts.length === 0) return '';
    if (pts.length === 1) return `M ${pts[0].x},${pts[0].y}`;
    let d = `M ${pts[0].x},${pts[0].y}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[Math.max(0, i - 1)];
      const p1 = pts[i];
      const p2 = pts[i + 1];
      const p3 = pts[Math.min(pts.length - 1, i + 2)];
      const c1x = p1.x + (p2.x - p0.x) / 6;
      const c1y = p1.y + (p2.y - p0.y) / 6;
      const c2x = p2.x - (p3.x - p1.x) / 6;
      const c2y = p2.y - (p3.y - p1.y) / 6;
      d += ` C ${c1x},${c1y} ${c2x},${c2y} ${p2.x},${p2.y}`;
    }
    return d;
  };

  const daysInCurrentMonth = new Date(tempYear, tempMonth, 0).getDate();
  const daysArray = Array.from({ length: daysInCurrentMonth }, (_, i) => i + 1);
  const monthsArray = Array.from({ length: 12 }, (_, i) => i + 1);
  const yearsArray = [2024, 2025, 2026, 2027];

  return (
    <View className="flex-1 bg-background">
      {/* Header Bar */}
      <View className="bg-white px-4 pt-2.5 pb-3 border-b border-[#F1F5F9]">
        <View className="flex-row justify-between items-center">
          <Text className="text-[20px] font-extrabold text-textMain">Doanh Thu</Text>
          <View className="flex-row items-center gap-2">
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
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 16, paddingTop: 14, paddingBottom: dynamicContentPaddingBottom }}
        showsVerticalScrollIndicator={false}
      >
        {/* Segmented Control: Ngày / Tháng / Năm */}
        <View className="flex-row bg-[#E2E8F0] rounded-full p-1 mb-3">
          <TouchableOpacity
            className={`flex-1 py-[9px] items-center rounded-full ${timeframe === 'day' ? 'bg-white' : ''}`}
            onPress={() => setTimeframe('day')}
            activeOpacity={0.8}
          >
            <Text className={`text-[13px] ${timeframe === 'day' ? 'text-primaryDark font-extrabold' : 'font-semibold text-textSecondary'}`}>
              Ngày
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            className={`flex-1 py-[9px] items-center rounded-full ${timeframe === 'month' ? 'bg-white' : ''}`}
            onPress={() => setTimeframe('month')}
            activeOpacity={0.8}
          >
            <Text className={`text-[13px] ${timeframe === 'month' ? 'text-primaryDark font-extrabold' : 'font-semibold text-textSecondary'}`}>
              Tháng
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            className={`flex-1 py-[9px] items-center rounded-full ${timeframe === 'year' ? 'bg-white' : ''}`}
            onPress={() => setTimeframe('year')}
            activeOpacity={0.8}
          >
            <Text className={`text-[13px] ${timeframe === 'year' ? 'text-primaryDark font-extrabold' : 'font-semibold text-textSecondary'}`}>
              Năm
            </Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <View className="py-16 items-center justify-center">
            <ActivityIndicator size="large" color="#00A389" />
            <Text className="text-xs text-textSecondary font-semibold mt-3">Đang đồng bộ dữ liệu doanh thu...</Text>
          </View>
        ) : error ? (
          <View className="bg-rose-50 border border-rose-200 p-4 rounded-2xl mb-4 items-center">
            <Text className="text-rose-700 text-xs font-bold mb-2">{error}</Text>
            <TouchableOpacity onPress={loadRevenueData} className="bg-rose-600 px-4 py-1.5 rounded-xl">
              <Text className="text-white text-xs font-bold">Thử lại</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
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
                <Text className="text-[11px] font-extrabold text-textMuted tracking-[0.8px]">TỔNG THỰC THU</Text>
                {summary.growthPercent !== 0 && (
                  <View className="flex-row items-center bg-[#ECFDF5] px-2 py-[3px] rounded-full">
                    <ArrowUpRight size={14} color="#047857" />
                    <Text className="text-[#047857] text-[12px] font-bold ml-0.5">
                      {summary.growthPercent > 0 ? `+${summary.growthPercent}%` : `${summary.growthPercent}%`}
                    </Text>
                  </View>
                )}
              </View>

              <Text className="text-[30px] font-black text-textMain my-1.5 tracking-[-0.5px]">
                {formatCurrency(summary.totalRevenue)}
              </Text>
              <Text className="text-[13px] text-textSecondary mb-4">
                {summary.orderCount} đơn hàng hoàn thành trong kỳ
              </Text>

              {/* 2 Kênh Thanh Toán Duy Nhất: VietQR & Tiền Mặt */}
              <View className="flex-row gap-2.5 pt-3.5 border-t border-[#F1F5F9]">
                <View className="flex-1 bg-[#F8FAFC] rounded-[14px] p-3 border border-border">
                  <View className="flex-row items-center gap-1.5 mb-1.5">
                    <View className="w-5 h-5 rounded-full items-center justify-center bg-[#6366F1]">
                      <QrCode size={12} color="#FFFFFF" strokeWidth={2.5} />
                    </View>
                    <Text className="text-[11px] font-semibold text-textSecondary">VietQR</Text>
                  </View>
                  <Text className="text-[15px] font-extrabold text-textMain my-0.5">
                    {formatCurrency(summary.qrRevenue)}
                  </Text>
                  <Text className="text-[10.5px] text-textMuted">
                    {summary.totalRevenue > 0
                      ? `${Math.round((summary.qrRevenue / summary.totalRevenue) * 100)}% tổng thu`
                      : '0% tổng thu'}
                  </Text>
                </View>

                <View className="flex-1 bg-[#F8FAFC] rounded-[14px] p-3 border border-border">
                  <View className="flex-row items-center gap-1.5 mb-1.5">
                    <View className="w-5 h-5 rounded-full items-center justify-center bg-[#F59E0B]">
                      <Coins size={12} color="#FFFFFF" strokeWidth={2.5} />
                    </View>
                    <Text className="text-[11px] font-semibold text-textSecondary">Tiền mặt</Text>
                  </View>
                  <Text className="text-[15px] font-extrabold text-textMain my-0.5">
                    {formatCurrency(summary.cashRevenue)}
                  </Text>
                  <Text className="text-[10.5px] text-textMuted">
                    {summary.totalRevenue > 0
                      ? `${Math.round((summary.cashRevenue / summary.totalRevenue) * 100)}% tổng thu`
                      : '0% tổng thu'}
                  </Text>
                </View>
              </View>
            </View>

            {/* Biểu đồ biến động */}
            {trendData.length > 0 && (() => {
              const n = trendData.length;
              const chartH = 190;
              const padTop = 12;
              const padBottom = 8;
              const innerH = chartH - padTop - padBottom;
              const availW = Math.max(120, screenWidth - 32 - 36);
              const innerW = Math.max(availW, n * 16);
              const step = n > 1 ? innerW / (n - 1) : 0;
              const pts = trendData.map((d: any, i: number) => ({
                x: n > 1 ? i * step : innerW / 2,
                y: padTop + (1 - (d.revenue / maxTrendRevenue)) * innerH,
              }));
              const linePath = buildSmoothPath(pts);
              const areaPath = n > 0 ? `${linePath} L ${pts[n - 1].x},${padTop + innerH} L ${pts[0].x},${padTop + innerH} Z` : '';
              // Năm (12 điểm): hiện đủ 12 nhãn; nhiều điểm hơn: chia đều tối đa 7 nhãn gồm đầu-cuối
              const maxLabels = n <= 12 ? n : 7;
              const visibleIdx = new Set(
                Array.from({ length: maxLabels }, (_, k) =>
                  maxLabels === 1 ? 0 : Math.round((k * (n - 1)) / (maxLabels - 1))
                )
              );
              return (
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
                    <Text className="text-[14px] font-extrabold text-textMain">Biến Động Doanh Thu</Text>
                    <Text className="text-[11px] font-bold text-primaryDark bg-[#ECFDF5] px-2 py-0.5 rounded-full">
                      {getFilterLabel()}
                    </Text>
                  </View>

                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View>
                      <Svg width={innerW} height={chartH + 22}>
                        <Defs>
                          <LinearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                            <Stop offset="0" stopColor="#00A389" stopOpacity={0.4} />
                            <Stop offset="1" stopColor="#00A389" stopOpacity={0} />
                          </LinearGradient>
                        </Defs>
                        {[0, 1, 2, 3].map((i) => {
                          const y = padTop + innerH - (innerH / 3) * i;
                          return (
                            <Line
                              key={i}
                              x1={0}
                              y1={y}
                              x2={innerW}
                              y2={y}
                              stroke="#F1F5F9"
                              strokeWidth={1}
                              strokeDasharray="3 3"
                            />
                          );
                        })}
                        {areaPath !== '' && <Path d={areaPath} fill="url(#revGrad)" />}
                        {linePath !== '' && (
                          <Path d={linePath} fill="none" stroke="#00A389" strokeWidth={3} strokeLinecap="round" />
                        )}
                      </Svg>
                      <View style={{ width: innerW, height: 18, position: 'relative' }}>
                        {trendData.map((d: any, i: number) => {
                          if (!visibleIdx.has(i)) return null;
                          if (i === 0) {
                            return (
                              <Text key={i} style={{ position: 'absolute', left: 0, fontSize: 10, fontWeight: '700', color: '#94A3B8' }}>
                                {d.label}
                              </Text>
                            );
                          }
                          if (i === n - 1) {
                            return (
                              <Text key={i} style={{ position: 'absolute', right: 0, fontSize: 10, fontWeight: '700', color: '#94A3B8' }}>
                                {d.label}
                              </Text>
                            );
                          }
                          return (
                            <Text
                              key={i}
                              style={{
                                position: 'absolute',
                                left: pts[i].x - 20,
                                width: 40,
                                textAlign: 'center',
                                fontSize: 10,
                                fontWeight: '700',
                                color: '#94A3B8',
                              }}
                            >
                              {d.label}
                            </Text>
                          );
                        })}
                      </View>
                    </View>
                  </ScrollView>
                </View>
              );
            })()}

            {/* Danh sách đơn hàng hoàn thành thực tế */}
            <View className="bg-white rounded-[20px] p-4 border border-border">
              <View className="flex-row justify-between items-center mb-3">
                <Text className="text-[14.5px] font-extrabold text-textMain">Đơn Hàng Đã Thanh Toán</Text>
                <ReceiptText size={16} color="#10B981" />
              </View>

              {recentOrders.length === 0 ? (
                <View className="py-6 items-center">
                  <Text className="text-xs text-textMuted font-medium">Chưa có đơn hàng trong khoảng thời gian này</Text>
                </View>
              ) : (
                recentOrders.map((ord: any, idx: number) => (
                  <View key={ord.id || idx}>
                    <View className="flex-row justify-between items-center py-2.5">
                      <View className="flex-row items-center flex-1 mr-2">
                        <View
                          className={`px-2 py-1 rounded-[8px] mr-2.5 ${
                            ord.paymentMethod === 'VIETQR' ? 'bg-[#EEF2FF]' : 'bg-[#FEF3C7]'
                          }`}
                        >
                          <Text
                            className={`text-[10.5px] font-extrabold ${
                              ord.paymentMethod === 'VIETQR' ? 'text-[#4F46E5]' : 'text-[#D97706]'
                            }`}
                          >
                            {ord.paymentMethod === 'VIETQR' ? 'VietQR' : 'Tiền mặt'}
                          </Text>
                        </View>
                        <View className="flex-1">
                          <Text className="text-[13.5px] font-bold text-textMain">
                            {ord.orderCode} • {ord.tableName || 'Mang về'}
                          </Text>
                          <Text className="text-[11px] text-textMuted mt-0.5">
                            {new Date(ord.createdAt).toLocaleTimeString('vi-VN', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </Text>
                        </View>
                      </View>
                      <View className="items-end">
                        <Text className="text-[13.5px] font-extrabold text-primaryDark">
                          +{formatCurrency(ord.totalAmount)}
                        </Text>
                        <Text className="text-[10.5px] text-[#059669] font-semibold">Hoàn tất</Text>
                      </View>
                    </View>
                    {idx < recentOrders.length - 1 && <View className="h-[1px] bg-[#F1F5F9]" />}
                  </View>
                ))
              )}
            </View>
          </>
        )}
      </ScrollView>

      {/* Modal Bộ lọc Ngày / Tháng / Năm */}
      <Modal visible={isPickerModalOpen} transparent animationType="fade">
        <View className="flex-1 bg-[rgba(15,23,42,0.5)] justify-center items-center p-5">
          <View className="bg-white rounded-[24px] p-5 w-full max-w-[400px] max-h-[85%]">
            {/* Modal Header */}
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-[16px] font-extrabold text-textMain">
                {timeframe === 'day' && 'Chọn Ngày'}
                {timeframe === 'month' && 'Chọn Tháng'}
                {timeframe === 'year' && 'Chọn Năm'}
              </Text>
              <TouchableOpacity onPress={() => setIsPickerModalOpen(false)}>
                <X size={20} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            {/* Selector Content */}
            <ScrollView className="max-h-[380px]" showsVerticalScrollIndicator={false}>
              {/* Ngày */}
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

              {/* Tháng */}
              {timeframe === 'month' && (
                <View>
                  <Text className="text-[11px] font-extrabold text-textMuted mb-2">CHỌN NĂM</Text>
                  <View className="flex-row gap-2 mb-4">
                    {yearsArray.map((y) => (
                      <TouchableOpacity
                        key={y}
                        className={`flex-1 py-2 rounded-[12px] items-center border ${tempYear === y ? 'bg-[#ECFDF5] border-primary' : 'bg-[#F8FAFC] border-border'}`}
                        onPress={() => setTempYear(y)}
                      >
                        <Text className={`text-[12.5px] ${tempYear === y ? 'text-primaryDark font-extrabold' : 'font-semibold text-textSecondary'}`}>
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
                          className={`w-[48%] py-3 rounded-[12px] items-center justify-center border ${isSelected ? 'bg-primary border-primary' : 'bg-[#F8FAFC] border-border'}`}
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

              {/* Năm */}
              {timeframe === 'year' && (
                <View>
                  <Text className="text-[11px] font-extrabold text-textMuted mb-2">CHỌN NĂM HOẠT ĐỘNG</Text>
                  <View className="gap-2.5">
                    {yearsArray.map((y) => {
                      const isSelected = tempYear === y;
                      return (
                        <TouchableOpacity
                          key={y}
                          className={`flex-row justify-between items-center p-3.5 rounded-[14px] border ${isSelected ? 'bg-[#ECFDF5] border-primary' : 'bg-[#F8FAFC] border-border'}`}
                          onPress={() => setTempYear(y)}
                        >
                          <Text className={`text-[14px] ${isSelected ? 'text-primaryDark font-extrabold' : 'font-bold text-textMain'}`}>
                            Năm {y}
                          </Text>
                          {isSelected && <Check size={18} color="#059669" strokeWidth={2.5} />}
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              )}
            </ScrollView>

            {/* Modal Actions */}
            <View className="flex-row gap-2.5 mt-5 pt-3.5 border-t border-[#F1F5F9]">
              <TouchableOpacity
                className="flex-row items-center justify-center gap-1.5 py-3 px-4 rounded-[14px] bg-[#F1F5F9] border border-border"
                onPress={resetToToday}
              >
                <RotateCcw size={14} color="#64748B" />
                <Text className="text-[12.5px] font-bold text-textSecondary">Hôm Nay</Text>
              </TouchableOpacity>

              <TouchableOpacity
                className="flex-1 py-3 rounded-[14px] bg-primary items-center justify-center"
                onPress={applyPicker}
              >
                <Text className="text-[13px] font-extrabold text-white">Áp Dụng</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};
