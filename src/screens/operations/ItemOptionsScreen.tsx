import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {
  Check,
  CheckCircle2,
  Plus,
  Minus,
  Sparkles,
  Edit3,
  ArrowLeft,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MenuItem } from '../../types';

interface ItemOptionsScreenProps {
  item: MenuItem;
  onCancel: () => void;
  onConfirm: (
    item: MenuItem,
    selectedModifiers: Record<string, string>,
    note: string,
    quantity: number
  ) => void;
}

export const ItemOptionsScreen: React.FC<ItemOptionsScreenProps> = ({
  item,
  onCancel,
  onConfirm,
}) => {
  const insets = useSafeAreaInsets();
  const dynamicPaddingBottom = insets.bottom > 0 ? Math.max(insets.bottom - 16, 6) : 6;
  const contentPaddingBottom = dynamicPaddingBottom + 78;

  // Lấy các nhóm tuỳ chỉnh của món
  const groups = item.modifierGroups || [];

  // Khởi tạo lựa chọn mặc định: chọn option đầu tiên của mỗi group
  const initialModifiers: Record<string, string> = {};
  groups.forEach((g) => {
    if (g.options && g.options.length > 0) {
      initialModifiers[g.name] = g.options[0].name;
    }
  });

  const [selectedModifiers, setSelectedModifiers] = useState<Record<string, string>>(initialModifiers);
  const [note, setNote] = useState('');
  const [quantity, setQuantity] = useState(1);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
  };

  // Tính phụ thu từ các options được chọn
  let extraPerItem = 0;
  groups.forEach((g) => {
    const chosenName = selectedModifiers[g.name];
    const opt = g.options.find((o) => o.name === chosenName);
    if (opt && opt.extraPrice) {
      extraPerItem += opt.extraPrice;
    }
  });

  const singleUnitPrice = item.price + extraPerItem;
  const totalPrice = singleUnitPrice * quantity;

  const handleSelectOption = (groupName: string, optionName: string) => {
    setSelectedModifiers((prev) => ({
      ...prev,
      [groupName]: optionName,
    }));
  };

  const handleIncreaseQty = () => setQuantity((q) => q + 1);
  const handleDecreaseQty = () => setQuantity((q) => (q > 1 ? q - 1 : 1));

  const handleConfirmOrder = () => {
    onConfirm(item, selectedModifiers, note.trim(), quantity);
  };

  return (
    <View className="flex-1 bg-background">
      {/* Header Bar */}
      <View
        className="bg-white px-4 pb-3 border-b border-[#F1F5F9]"
        style={{ paddingTop: Math.max(insets.top, 10) }}
      >
        <View className="flex-row items-center">
          <TouchableOpacity
            className="w-9 h-9 rounded-xl bg-[#F1F5F9] items-center justify-center mr-3 border border-border"
            onPress={onCancel}
            activeOpacity={0.7}
          >
            <ArrowLeft size={18} color="#0F172A" />
          </TouchableOpacity>
          <Text className="flex-1 text-[20px] font-extrabold text-textMain">Tuỳ Chọn Món Ăn</Text>
        </View>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        {/* Nội dung scrollable */}
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ padding: 16, paddingBottom: contentPaddingBottom, gap: 14 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Card Tóm Tắt Món Ăn (Hero Card) */}
          <View
            className="flex-row items-center bg-white rounded-[18px] p-3.5 border border-border"
            style={{
              shadowColor: '#0F172A',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.05,
              shadowRadius: 10,
              elevation: 2,
            }}
          >
            <Image source={{ uri: item.imageUrl }} className="w-[76px] h-[76px] rounded-[14px] bg-[#F1F5F9]" />

            <View className="flex-1 ml-3.5">
              <View className="flex-row items-center gap-1.5 flex-wrap">
                <Text className="text-[15px] font-extrabold text-[#0F172A] shrink" numberOfLines={2}>
                  {item.name}
                </Text>
                {item.isPopular && (
                  <View className="flex-row items-center gap-1 bg-[#FFEDD5] px-2 py-0.5 rounded-full">
                    <Sparkles size={11} color="#C2410C" />
                    <Text className="text-[10.5px] font-bold text-[#C2410C]">Bán chạy</Text>
                  </View>
                )}
              </View>

              <Text className="text-[14.5px] font-black text-primaryDark mt-1">{formatCurrency(singleUnitPrice)}</Text>

              {item.description ? (
                <Text className="text-[12px] text-textSecondary mt-0.5" numberOfLines={2}>
                  {item.description}
                </Text>
              ) : null}
            </View>
          </View>

          {/* Danh sách các Mục Tuỳ Chỉnh */}
          {groups.map((group) => {
            const activeChoice = selectedModifiers[group.name];

            return (
              <View key={group.id} className="bg-white rounded-[18px] p-4 border border-border">
                <View className="flex-row justify-between items-center mb-3">
                  <Text className="text-[14px] font-extrabold text-[#0F172A]">{group.name}</Text>
                  <View className="bg-[#ECFDF5] px-2 py-0.5 rounded-full">
                    <Text className="text-[11px] font-bold text-primaryDark">Chọn 1</Text>
                  </View>
                </View>

                <View className="flex-row flex-wrap gap-2">
                  {group.options.map((opt) => {
                    const isSelected = activeChoice === opt.name;

                    return (
                      <TouchableOpacity
                        key={opt.id}
                        className={`flex-row items-center px-3.5 py-2.5 rounded-[12px] border ${
                          isSelected ? 'bg-[#ECFDF5] border-primary' : 'bg-[#F8FAFC] border-border'
                        }`}
                        onPress={() => handleSelectOption(group.name, opt.name)}
                        activeOpacity={0.8}
                      >
                        {isSelected ? (
                          <View className="w-4 h-4 rounded-full bg-primary items-center justify-center mr-1.5">
                            <Check size={11} color="#FFFFFF" strokeWidth={3} />
                          </View>
                        ) : null}

                        <Text
                          className={`text-[13px] ${
                            isSelected ? 'text-primaryDark font-extrabold' : 'font-semibold text-textMain'
                          }`}
                        >
                          {opt.name}
                        </Text>

                        {opt.extraPrice ? (
                          <Text
                            className={`text-[12px] ml-1 font-bold ${
                              isSelected ? 'text-primaryDark' : 'text-textMuted'
                            }`}
                          >
                            +{formatCurrency(opt.extraPrice)}
                          </Text>
                        ) : null}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            );
          })}

          {/* Ô Nhập Ghi Chú */}
          <View className="bg-white rounded-[18px] p-4 border border-border">
            <View className="flex-row items-center gap-1.5 mb-2.5">
              <Edit3 size={15} color="#059669" />
              <Text className="text-[14px] font-extrabold text-[#0F172A]">Ghi chú cho món này (Tuỳ chọn)</Text>
            </View>
            <View className="bg-[#F8FAFC] rounded-[12px] border border-border p-3">
              <TextInput
                className="text-[13px] text-textMain min-h-[54px]"
                placeholder="VD: Ít ngọt, đậm vị trà, cho đá riêng, mang đi..."
                placeholderTextColor="#94A3B8"
                multiline
                numberOfLines={3}
                value={note}
                onChangeText={setNote}
              />
            </View>
          </View>

          {/* Bộ Chọn Số Lượng */}
          <View className="flex-row justify-between items-center bg-white rounded-[18px] p-4 border border-border">
            <View>
              <Text className="text-[14px] font-extrabold text-[#0F172A]">Số lượng món</Text>
              <Text className="text-[12px] text-textSecondary mt-0.5">
                Đơn giá: {formatCurrency(singleUnitPrice)}
              </Text>
            </View>

            <View className="flex-row items-center bg-[#F1F5F9] rounded-full p-1 border border-border">
              <TouchableOpacity
                className={`w-9 h-9 rounded-full bg-white items-center justify-center ${quantity <= 1 ? 'opacity-40' : ''}`}
                onPress={handleDecreaseQty}
                disabled={quantity <= 1}
                activeOpacity={0.8}
              >
                <Minus size={16} color={quantity <= 1 ? '#CBD5E1' : '#059669'} strokeWidth={2.6} />
              </TouchableOpacity>

              <Text className="text-[15px] font-black text-textMain min-w-[32px] text-center">{quantity}</Text>

              <TouchableOpacity
                className="w-9 h-9 rounded-full bg-white items-center justify-center"
                onPress={handleIncreaseQty}
                activeOpacity={0.8}
              >
                <Plus size={16} color="#059669" strokeWidth={2.6} />
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>

        {/* Thanh Tác Vụ Đáy Cố Định */}
        <View
          className="absolute bottom-0 left-0 right-0 bg-transparent items-center px-4"
          style={{ paddingBottom: dynamicPaddingBottom }}
        >
          <View
            className="w-full max-w-[500px] h-[62px] bg-white rounded-[31px] px-3.5 border border-primaryLight flex-row items-center justify-between"
            style={{
              borderWidth: 1.5,
              shadowColor: '#059669',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.12,
              shadowRadius: 12,
              elevation: 8,
            }}
          >
            {/* Nút Huỷ */}
            <TouchableOpacity
              className="bg-[#F1F5F9] px-5 py-[11px] rounded-full items-center justify-center mr-2.5 border border-border"
              onPress={onCancel}
              activeOpacity={0.7}
            >
              <Text className="text-textSecondary text-[13.5px] font-bold">Huỷ</Text>
            </TouchableOpacity>

            {/* Nút Xác Nhận */}
            <TouchableOpacity
              className="flex-1 flex-row items-center justify-center gap-1.5 bg-primaryDark py-[11px] rounded-full"
              onPress={handleConfirmOrder}
              activeOpacity={0.85}
            >
              <CheckCircle2 size={15} color="#FFFFFF" strokeWidth={2.5} />
              <Text className="text-white text-[13.5px] font-extrabold">
                Xác Nhận • {formatCurrency(totalPrice)}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
};
