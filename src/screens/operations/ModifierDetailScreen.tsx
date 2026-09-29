import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import {
  ArrowLeft,
  Plus,
  X,
  Trash2,
  Sliders,
  Check,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ModifierGroup, ModifierOption } from '../../types';

interface ModifierDetailScreenProps {
  initialGroups: ModifierGroup[];
  onBack: () => void;
  onSave: (groups: ModifierGroup[]) => void;
}

export const ModifierDetailScreen: React.FC<ModifierDetailScreenProps> = ({
  initialGroups,
  onBack,
  onSave,
}) => {
  const insets = useSafeAreaInsets();
  const dynamicPaddingBottom = insets.bottom > 0 ? Math.max(insets.bottom - 16, 6) : 6;
  const contentPaddingBottom = dynamicPaddingBottom + 78;

  const [modifierGroups, setModifierGroups] = useState<ModifierGroup[]>(
    JSON.parse(JSON.stringify(initialGroups))
  );
  const [isAddingGroup, setIsAddingGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newOptionInputs, setNewOptionInputs] = useState<
    Record<string, { name: string; extraPrice: string }>
  >({});

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
  };

  const addSugarTemplate = () => {
    if (modifierGroups.some((g) => g.name.toLowerCase().includes('đường'))) {
      Alert.alert('Đã có mục Đường', 'Món ăn này đã có mục tuỳ chỉnh Đường.');
      return;
    }
    const newGroup: ModifierGroup = {
      id: `mg_sugar_${Date.now()}`,
      name: 'Đường',
      options: [
        { id: `opt_${Date.now()}_1`, name: '100%' },
        { id: `opt_${Date.now()}_2`, name: '70%' },
        { id: `opt_${Date.now()}_3`, name: '50%' },
        { id: `opt_${Date.now()}_4`, name: '30%' },
        { id: `opt_${Date.now()}_5`, name: '0%' },
      ],
    };
    setModifierGroups([...modifierGroups, newGroup]);
  };

  const addIceTemplate = () => {
    if (modifierGroups.some((g) => g.name.toLowerCase().includes('đá'))) {
      Alert.alert('Đã có mục Đá', 'Món ăn này đã có mục tuỳ chỉnh Đá.');
      return;
    }
    const newGroup: ModifierGroup = {
      id: `mg_ice_${Date.now()}`,
      name: 'Đá',
      options: [
        { id: `opt_${Date.now()}_1`, name: '100%' },
        { id: `opt_${Date.now()}_2`, name: '70%' },
        { id: `opt_${Date.now()}_3`, name: '50%' },
        { id: `opt_${Date.now()}_4`, name: 'Không đá' },
      ],
    };
    setModifierGroups([...modifierGroups, newGroup]);
  };

  const addSizeTemplate = () => {
    if (modifierGroups.some((g) => g.name.toLowerCase().includes('size') || g.name.toLowerCase().includes('kích cỡ'))) {
      Alert.alert('Đã có mục Size', 'Món ăn này đã có mục tuỳ chỉnh Size.');
      return;
    }
    const newGroup: ModifierGroup = {
      id: `mg_size_${Date.now()}`,
      name: 'Kích cỡ (Size)',
      options: [
        { id: `opt_${Date.now()}_1`, name: 'Vừa (M)', extraPrice: 0 },
        { id: `opt_${Date.now()}_2`, name: 'Lớn (L)', extraPrice: 6000 },
      ],
    };
    setModifierGroups([...modifierGroups, newGroup]);
  };

  const addToppingTemplate = () => {
    if (modifierGroups.some((g) => g.name.toLowerCase().includes('topping'))) {
      Alert.alert('Đã có mục Topping', 'Món ăn này đã có mục tuỳ chỉnh Topping.');
      return;
    }
    const newGroup: ModifierGroup = {
      id: `mg_top_${Date.now()}`,
      name: 'Topping thêm',
      options: [
        { id: `opt_${Date.now()}_1`, name: 'Trân châu hoàng kim', extraPrice: 5000 },
        { id: `opt_${Date.now()}_2`, name: 'Kem Cheese béo ngậy', extraPrice: 10000 },
        { id: `opt_${Date.now()}_3`, name: 'Thạch dừa giòn', extraPrice: 5000 },
      ],
    };
    setModifierGroups([...modifierGroups, newGroup]);
  };

  const handleAddNewGroup = () => {
    const trimmed = newGroupName.trim();
    if (!trimmed) {
      Alert.alert('Thiếu tên mục', 'Vui lòng nhập tên mục tuỳ chỉnh (VD: Đường, Đá, Size...).');
      return;
    }
    const newGroup: ModifierGroup = {
      id: `mg_${Date.now()}`,
      name: trimmed,
      options: [],
    };
    setModifierGroups([...modifierGroups, newGroup]);
    setNewGroupName('');
    setIsAddingGroup(false);
  };

  const handleDeleteGroup = (groupId: string) => {
    setModifierGroups(modifierGroups.filter((g) => g.id !== groupId));
  };

  const handleAddOptionToGroup = (groupId: string) => {
    const input = newOptionInputs[groupId];
    if (!input || !input.name.trim()) {
      Alert.alert('Thiếu tên lựa chọn', 'Vui lòng nhập tên lựa chọn (VD: 50%, Không đá...).');
      return;
    }
    const trimmedName = input.name.trim();
    const parsedExtra = parseInt(input.extraPrice?.replace(/[^0-9]/g, '') || '0', 10);
    const newOption: ModifierOption = {
      id: `opt_${Date.now()}`,
      name: trimmedName,
      extraPrice: parsedExtra > 0 ? parsedExtra : undefined,
    };
    setModifierGroups(
      modifierGroups.map((g) =>
        g.id === groupId ? { ...g, options: [...g.options, newOption] } : g
      )
    );
    setNewOptionInputs({
      ...newOptionInputs,
      [groupId]: { name: '', extraPrice: '' },
    });
  };

  const handleDeleteOptionFromGroup = (groupId: string, optionId: string) => {
    setModifierGroups(
      modifierGroups.map((g) =>
        g.id === groupId
          ? { ...g, options: g.options.filter((opt) => opt.id !== optionId) }
          : g
      )
    );
  };

  const handleSave = () => {
    onSave(modifierGroups);
    onBack();
  };

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
        <View className="flex-1">
          <View className="flex-row items-center gap-2">
            <Text className="text-[20px] font-extrabold text-textMain">Tuỳ Chỉnh Món Ăn</Text>
            <View className="bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200">
              <Text className="text-[11px] font-bold text-emerald-600">{modifierGroups.length} mục</Text>
            </View>
          </View>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 16, paddingBottom: contentPaddingBottom, gap: 14 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Hàng mẫu nhanh */}
        <Text className="text-xs font-bold text-slate-600 mb-0.5">Thêm nhanh từ mẫu</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8, paddingVertical: 2 }}
        >
          <TouchableOpacity className="flex-row items-center gap-1 bg-white px-3 py-2 rounded-full border border-slate-300" onPress={addSugarTemplate} activeOpacity={0.75}>
            <Plus size={12} color="#059669" />
            <Text className="text-xs font-semibold text-slate-700">Mẫu Đường</Text>
          </TouchableOpacity>
          <TouchableOpacity className="flex-row items-center gap-1 bg-white px-3 py-2 rounded-full border border-slate-300" onPress={addIceTemplate} activeOpacity={0.75}>
            <Plus size={12} color="#059669" />
            <Text className="text-xs font-semibold text-slate-700">Mẫu Đá</Text>
          </TouchableOpacity>
          <TouchableOpacity className="flex-row items-center gap-1 bg-white px-3 py-2 rounded-full border border-slate-300" onPress={addSizeTemplate} activeOpacity={0.75}>
            <Plus size={12} color="#059669" />
            <Text className="text-xs font-semibold text-slate-700">Mẫu Size</Text>
          </TouchableOpacity>
          <TouchableOpacity className="flex-row items-center gap-1 bg-white px-3 py-2 rounded-full border border-slate-300" onPress={addToppingTemplate} activeOpacity={0.75}>
            <Plus size={12} color="#059669" />
            <Text className="text-xs font-semibold text-slate-700">Mẫu Topping</Text>
          </TouchableOpacity>
        </ScrollView>

        {/* Nút thêm mục tuỳ chỉnh */}
        {!isAddingGroup ? (
          <TouchableOpacity
            className="flex-row items-center justify-center gap-1.5 bg-emerald-50 py-2.5 rounded-xl border border-dashed border-emerald-200"
            onPress={() => setIsAddingGroup(true)}
            activeOpacity={0.8}
          >
            <Plus size={16} color="#059669" />
            <Text className="text-[13px] font-bold text-emerald-600">Thêm mục tuỳ chỉnh</Text>
          </TouchableOpacity>
        ) : (
          <View className="bg-white rounded-xl p-3 border border-slate-300 gap-2 shadow-sm">
            <Text className="text-[12.5px] font-bold text-slate-700">Tạo mục tuỳ chỉnh mới</Text>
            <View className="flex-row items-center gap-2">
              <TextInput
                className="flex-1 bg-slate-50 rounded-xl border border-slate-300 px-2.5 py-1.5 text-[13px] text-slate-900"
                placeholder="VD: Độ ngọt, Lượng sữa..."
                placeholderTextColor="#94A3B8"
                value={newGroupName}
                onChangeText={setNewGroupName}
                autoFocus
              />
              <TouchableOpacity
                className="px-3 py-2 rounded-xl bg-slate-100"
                onPress={() => {
                  setIsAddingGroup(false);
                  setNewGroupName('');
                }}
                activeOpacity={0.7}
              >
                <Text className="text-xs font-bold text-slate-500">Huỷ</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="px-3.5 py-2 rounded-xl bg-emerald-600"
                onPress={handleAddNewGroup}
                activeOpacity={0.8}
              >
                <Text className="text-xs font-extrabold text-white">Tạo</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Danh sách nhóm */}
        {modifierGroups.length === 0 ? (
          <View className="py-6 px-4 bg-white rounded-xl border border-border items-center">
            <Text className="text-xs text-textMuted text-center leading-4">Chưa có tuỳ chỉnh nào. Dùng mẫu nhanh hoặc Thêm mục để tạo.</Text>
          </View>
        ) : (
          modifierGroups.map((group) => {
            const currentInput = newOptionInputs[group.id] || { name: '', extraPrice: '' };
            return (
              <View key={group.id} className="bg-white rounded-2xl p-3 border border-border gap-2.5 shadow-sm">
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center gap-1.5">
                    <View className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                    <Text className="text-[13.5px] font-extrabold text-slate-900">{group.name}</Text>
                    <Text className="text-xs text-slate-500">({group.options.length})</Text>
                  </View>
                  <TouchableOpacity
                    className="p-1.5 rounded-md bg-rose-50"
                    onPress={() => handleDeleteGroup(group.id)}
                    activeOpacity={0.7}
                  >
                    <Trash2 size={14} color="#E11D48" />
                  </TouchableOpacity>
                </View>

                <View className="flex-row flex-wrap gap-1.5">
                  {group.options.length === 0 ? (
                    <Text className="text-[11.5px] text-textMuted italic">Chưa có lựa chọn.</Text>
                  ) : (
                    group.options.map((opt) => (
                      <View key={opt.id} className="flex-row items-center gap-1 bg-slate-50 rounded-full px-2.5 py-1 border border-slate-300">
                        <Text className="text-xs font-semibold text-slate-800">{opt.name}</Text>
                        {opt.extraPrice ? <Text className="text-[11px] font-bold text-emerald-600">+{formatCurrency(opt.extraPrice)}</Text> : null}
                        <TouchableOpacity onPress={() => handleDeleteOptionFromGroup(group.id, opt.id)} className="ml-0.5 p-0.5" activeOpacity={0.7}>
                          <X size={12} color="#64748B" />
                        </TouchableOpacity>
                      </View>
                    ))
                  )}
                </View>

                <View className="flex-row items-center gap-1.5 mt-0.5">
                  <TextInput
                    className="flex-[2] bg-slate-50 rounded-xl border border-slate-300 px-2.5 py-1.5 text-[12.5px] text-slate-900"
                    placeholder="Tên lựa chọn"
                    placeholderTextColor="#94A3B8"
                    value={currentInput.name}
                    onChangeText={(text) =>
                      setNewOptionInputs({
                        ...newOptionInputs,
                        [group.id]: { ...currentInput, name: text },
                      })
                    }
                  />
                  <TextInput
                    className="flex-[1.2] bg-slate-50 rounded-xl border border-slate-300 px-2 py-1.5 text-[12.5px] text-slate-900"
                    placeholder="+đ"
                    placeholderTextColor="#94A3B8"
                    keyboardType="numeric"
                    value={currentInput.extraPrice}
                    onChangeText={(text) =>
                      setNewOptionInputs({
                        ...newOptionInputs,
                        [group.id]: { ...currentInput, extraPrice: text },
                      })
                    }
                  />
                  <TouchableOpacity
                    className="flex-row items-center gap-1 bg-emerald-600 px-2.5 py-2 rounded-xl active:bg-emerald-700"
                    onPress={() => handleAddOptionToGroup(group.id)}
                    activeOpacity={0.8}
                  >
                    <Plus size={14} color="#FFFFFF" strokeWidth={2.8} />
                    <Text className="text-white text-xs font-bold">Thêm</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        )}
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

export default ModifierDetailScreen;
