import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Vibration,
} from 'react-native';
import { ArrowLeft, Clock, Check, Play, Pause, PlusCircle, RotateCcw } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle } from 'react-native-svg';

interface PrepTimeDetailScreenProps {
  initialMinutes: number;
  onBack: () => void;
  onSave: (minutes: number) => void;
}

const PRESET_MINUTES = [3, 5, 7, 10, 12, 15, 20, 30];

export const PrepTimeDetailScreen: React.FC<PrepTimeDetailScreenProps> = ({
  initialMinutes,
  onBack,
  onSave,
}) => {
  const insets = useSafeAreaInsets();
  const dynamicPaddingBottom = insets.bottom > 0 ? Math.max(insets.bottom - 16, 6) : 6;
  const contentPaddingBottom = dynamicPaddingBottom + 78;
  const [selected, setSelected] = useState<number>(initialMinutes);
  const [customInput, setCustomInput] = useState<string>(String(initialMinutes));

  // Live Countdown Simulation (Task B-015)
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [remainingSeconds, setRemainingSeconds] = useState<number>(initialMinutes * 60);
  const totalSeconds = (parseInt(customInput, 10) || initialMinutes) * 60;

  useEffect(() => {
    setRemainingSeconds((parseInt(customInput, 10) || initialMinutes) * 60);
    setIsRunning(false);
  }, [customInput, initialMinutes]);

  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    if (isRunning && remainingSeconds > 0) {
      timer = setInterval(() => {
        setRemainingSeconds((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            setIsRunning(false);
            Vibration.vibrate([0, 500, 200, 500]);
            Alert.alert('Bếp đã xong!', 'Món ăn đã hết thời gian chế biến, sẵn sàng phục vụ!');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isRunning, remainingSeconds]);

  const handleSelectPreset = (m: number) => {
    setSelected(m);
    setCustomInput(String(m));
  };

  const handleSave = () => {
    const parsed = parseInt(customInput.replace(/[^0-9]/g, '') || '0', 10);
    if (!parsed || parsed <= 0) {
      Alert.alert('Thời gian không hợp lệ', 'Vui lòng nhập số phút lớn hơn 0.');
      return;
    }
    if (parsed > 120) {
      Alert.alert('Thời gian quá dài', 'Vui lòng nhập thời gian dưới 120 phút.');
      return;
    }
    onSave(parsed);
    onBack();
  };

  const parsedCustom = parseInt(customInput.replace(/[^0-9]/g, '') || '0', 10);

  // SVG Circle Progress calculation
  const radius = 50;
  const strokeWidth = 8;
  const circumference = 2 * Math.PI * radius;
  const progressPercent = totalSeconds > 0 ? Math.max(0, Math.min(100, (remainingSeconds / totalSeconds) * 100)) : 0;
  const strokeDashoffset = circumference - (progressPercent / 100) * circumference;

  const mins = Math.floor(remainingSeconds / 60);
  const secs = remainingSeconds % 60;
  const formattedTime = `${mins}:${secs < 10 ? '0' : ''}${secs}`;

  return (
    <View className="flex-1 bg-background">
      {/* Header */}
      <View className="bg-white px-4 pt-2.5 pb-3 border-b border-[#F1F5F9] flex-row items-center">
        <TouchableOpacity
          className="w-9 h-9 rounded-xl bg-slate-100 items-center justify-center mr-3 border border-border"
          onPress={onBack}
          activeOpacity={0.7}
        >
          <ArrowLeft size={18} color="#0F172A" />
        </TouchableOpacity>
        <Text className="flex-1 text-[20px] font-extrabold text-textMain">Thời Gian Chế Biến</Text>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 16, paddingBottom: contentPaddingBottom, gap: 14 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Preset ngang */}
        <Text className="text-xs font-bold text-slate-600">Chọn nhanh định mức</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8, paddingVertical: 2 }}
        >
          {PRESET_MINUTES.map((m) => {
            const isActive = parsedCustom === m;
            return (
              <TouchableOpacity
                key={m}
                className={`px-3.5 py-1.5 rounded-full border ${
                  isActive ? 'bg-emerald-50 border-emerald-500' : 'bg-white border-border'
                }`}
                onPress={() => handleSelectPreset(m)}
                activeOpacity={0.75}
              >
                <Text className={`text-[12.5px] ${isActive ? 'text-emerald-600 font-extrabold' : 'text-slate-500 font-semibold'}`}>
                  {m} phút
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Nhập tuỳ chỉnh */}
        <Text className="text-xs font-bold text-slate-600">Hoặc nhập thời gian tuỳ chỉnh</Text>
        <View className="bg-white rounded-2xl p-3.5 border border-border gap-2.5 shadow-sm">
          <View className="flex-row items-center bg-slate-50 rounded-xl border border-slate-300 px-3 py-2 gap-2">
            <Clock size={18} color="#059669" />
            <TextInput
              className="flex-1 text-base font-bold text-slate-900 p-0"
              value={customInput}
              onChangeText={(t) => {
                setCustomInput(t);
                const v = parseInt(t.replace(/[^0-9]/g, '') || '0', 10);
                if (v > 0 && v <= 120) setSelected(v);
              }}
              placeholder="VD: 10"
              placeholderTextColor="#94A3B8"
              keyboardType="numeric"
              maxLength={3}
            />
            <Text className="text-[13px] font-bold text-emerald-600">phút</Text>
          </View>
          <View className="flex-row gap-2">
            <TouchableOpacity
              className="px-3 py-1.5 rounded-full bg-slate-50 border border-border"
              onPress={() => setCustomInput(String(Math.max(1, parsedCustom - 1)))}
              activeOpacity={0.7}
            >
              <Text className="text-xs font-bold text-slate-600">-1</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="px-3 py-1.5 rounded-full bg-slate-50 border border-border"
              onPress={() => setCustomInput(String(Math.min(120, parsedCustom + 1)))}
              activeOpacity={0.7}
            >
              <Text className="text-xs font-bold text-slate-600">+1</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="px-3 py-1.5 rounded-full bg-slate-50 border border-border"
              onPress={() => setCustomInput(String(Math.min(120, parsedCustom + 5)))}
              activeOpacity={0.7}
            >
              <Text className="text-xs font-bold text-slate-600">+5</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Vòng Tròn Đếm Ngược SVG (Task B-015) */}
        <View className="bg-white rounded-2xl p-4 border border-border items-center shadow-sm">
          <Text className="text-xs font-bold text-slate-600 self-start mb-3">Mô phỏng đồng hồ đếm ngược Bếp</Text>

          <View className="items-center justify-center my-2" style={{ width: 140, height: 140 }}>
            <Svg width="140" height="140" viewBox="0 0 140 140">
              {/* Vòng nền xám */}
              <Circle
                cx="70"
                cy="70"
                r={radius}
                stroke="#E2E8F0"
                strokeWidth={strokeWidth}
                fill="none"
              />
              {/* Vòng tiến độ SVG */}
              <Circle
                cx="70"
                cy="70"
                r={radius}
                stroke={remainingSeconds === 0 ? '#10B981' : remainingSeconds <= 60 ? '#EF4444' : '#059669'}
                strokeWidth={strokeWidth}
                fill="none"
                strokeDasharray={`${circumference} ${circumference}`}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                transform="rotate(-90 70 70)"
              />
            </Svg>

            {/* Chữ hiển thị ở tâm */}
            <View className="absolute items-center justify-center">
              <Text className={`text-2xl font-black ${remainingSeconds === 0 ? 'text-emerald-600' : 'text-textMain'}`}>
                {formattedTime}
              </Text>
              <Text className="text-[10.5px] font-semibold text-textMuted mt-0.5">
                {remainingSeconds === 0 ? 'Đã xong!' : isRunning ? 'Đang nấu' : 'Tạm dừng'}
              </Text>
            </View>
          </View>

          {/* Hàng nút điều khiển đếm ngược */}
          <View className="flex-row items-center gap-2 mt-4">
            <TouchableOpacity
              className={`flex-row items-center gap-1.5 px-4 py-2 rounded-xl ${
                isRunning ? 'bg-amber-500' : 'bg-emerald-600'
              }`}
              onPress={() => setIsRunning(!isRunning)}
              activeOpacity={0.8}
            >
              {isRunning ? <Pause size={15} color="#FFFFFF" /> : <Play size={15} color="#FFFFFF" />}
              <Text className="text-xs font-bold text-white">{isRunning ? 'Tạm dừng' : 'Bắt đầu'}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="flex-row items-center gap-1 px-3 py-2 rounded-xl bg-slate-100 border border-border"
              onPress={() => setRemainingSeconds((prev) => prev + 120)}
              activeOpacity={0.8}
            >
              <PlusCircle size={15} color="#0F172A" />
              <Text className="text-xs font-bold text-textMain">+2 phút</Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="p-2 rounded-xl bg-slate-100 border border-border"
              onPress={() => {
                setIsRunning(false);
                setRemainingSeconds(totalSeconds);
              }}
              activeOpacity={0.8}
            >
              <RotateCcw size={15} color="#475569" />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Bottom dock */}
      <View
        className="absolute bottom-0 left-0 right-0 items-center px-4 bg-transparent"
        style={{ paddingBottom: dynamicPaddingBottom }}
      >
        <View className="w-full max-w-[500px] h-[62px] bg-white rounded-full px-3.5 border-[1.5px] border-emerald-100 flex-row items-center gap-2.5 shadow-lg shadow-emerald-700/10">
          <TouchableOpacity
            className="flex-1 py-2.5 rounded-full bg-slate-100 items-center justify-center border border-border"
            onPress={onBack}
            activeOpacity={0.7}
          >
            <Text className="text-[13px] font-extrabold text-slate-500">Quay lại</Text>
          </TouchableOpacity>
          <TouchableOpacity
            className="flex-[2] flex-row items-center justify-center gap-1.5 py-2.5 rounded-full bg-emerald-600 active:bg-emerald-700"
            onPress={handleSave}
            activeOpacity={0.85}
          >
            <Check size={14} color="#FFFFFF" strokeWidth={2.5} />
            <Text className="text-[13px] font-extrabold text-white">Lưu cấu hình</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

export default PrepTimeDetailScreen;
