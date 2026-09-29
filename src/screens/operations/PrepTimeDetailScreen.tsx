import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { ArrowLeft, Clock, Check } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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

  // Sync custom input typing -> highlight if matches preset
  const parsedCustom = parseInt(customInput.replace(/[^0-9]/g, '') || '0', 10);

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
        <Text className="text-xs font-bold text-slate-600">Chọn nhanh</Text>
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

        {/* Preview đếm ngược */}
        <View className="bg-white rounded-2xl p-3.5 border border-border gap-2 shadow-sm">
          <Text className="text-xs font-bold text-slate-500">Xem trước đếm ngược</Text>
          <View className="flex-row items-center gap-2">
            <View className="flex-row items-center gap-1 bg-emerald-50 px-2.5 py-1.5 rounded-full border border-emerald-200">
              <Clock size={14} color="#059669" />
              <Text className="text-sm font-extrabold text-emerald-600">{parsedCustom || 0}:00</Text>
            </View>
            <Text className="text-[11px] text-textMuted flex-1">sẽ hiển thị ở header đơn khi “Đã xác nhận”</Text>
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
            <Text className="text-[13px] font-extrabold text-white">Xong</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

export default PrepTimeDetailScreen;
