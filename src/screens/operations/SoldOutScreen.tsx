import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Switch,
  Image,
  Alert,
} from 'react-native';
import {
  ArrowLeft,
  Search,
  X,
  Plus,
  Pencil,
  Trash2,
  Flame,
  BookOpen,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useMenuStore } from '../../data/menuStore';
import { MenuItem } from '../../types';
import { MenuItemFormScreen } from './MenuItemFormScreen';

interface SoldOutScreenProps {
  soldOutState: Record<string, boolean>;
  onToggleSoldOut: (itemId: string) => void;
  onBack: () => void;
}

export const SoldOutScreen: React.FC<SoldOutScreenProps> = ({
  soldOutState,
  onToggleSoldOut,
  onBack,
}) => {
  const insets = useSafeAreaInsets();
  const dynamicPaddingBottom = insets.bottom > 0 ? Math.max(insets.bottom - 16, 6) : 6;
  const contentPaddingBottom = dynamicPaddingBottom + 16;

  // Zustand Menu Store
  const { items, categories, deleteItem } = useMenuStore();

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Tất cả');

  // Screen Mode: List view or Dedicated Form Screen for Add/Edit
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
  };

  const soldOutCount = Object.values(soldOutState).filter(Boolean).length;

  const allCategories = ['Tất cả', ...categories.filter((c) => c !== 'Tất cả')];

  const filteredItems = items.filter((item) => {
    const matchCategory =
      selectedCategory === 'Tất cả' || item.category === selectedCategory;
    const matchSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.category && item.category.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchCategory && matchSearch;
  });

  // Mở màn hình riêng Thêm Món Mới
  const handleOpenAddForm = () => {
    setEditingItem(null);
    setIsFormVisible(true);
  };

  // Mở màn hình riêng Chỉnh Sửa Món Ăn
  const handleOpenEditForm = (item: MenuItem) => {
    setEditingItem(item);
    setIsFormVisible(true);
  };

  // Xoá món ăn có xác nhận an toàn
  const handleDeleteItem = (item: MenuItem) => {
    Alert.alert(
      'Xoá Món Ăn',
      `Bạn có chắc chắn muốn xoá món "${item.name}" khỏi thực đơn quán?`,
      [
        { text: 'Huỷ bỏ', style: 'cancel' },
        {
          text: 'Xoá món',
          style: 'destructive',
          onPress: () => {
            deleteItem(item.id);
          },
        },
      ]
    );
  };

  // Nếu đang mở màn hình Thêm / Sửa món: Hiển thị trang riêng biệt với nút Back
  if (isFormVisible) {
    return (
      <MenuItemFormScreen
        initialItem={editingItem}
        onBack={() => setIsFormVisible(false)}
        onSaved={() => setIsFormVisible(false)}
      />
    );
  }

  return (
    <View className="flex-1 bg-background">
      {/* Header Bar */}
      <View className="bg-white px-4 pt-2.5 pb-3 border-b border-[#F1F5F9]">
        <View className="flex-row items-center justify-between mb-2.5">
          <View className="flex-row items-center flex-1">
            <TouchableOpacity
              className="w-9 h-9 rounded-xl bg-slate-100 items-center justify-center mr-3 border border-border"
              onPress={onBack}
              activeOpacity={0.7}
            >
              <ArrowLeft size={18} color="#0F172A" />
            </TouchableOpacity>
            <Text className="text-[20px] font-extrabold text-textMain">Quản Lý Thực Đơn</Text>
          </View>
          <TouchableOpacity
            className="w-9 h-9 items-center justify-center ml-2"
            onPress={handleOpenAddForm}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Plus size={22} color="#10B981" strokeWidth={2.5} />
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View className="flex-row items-center bg-[#F8FAFC] rounded-xl px-3.5 h-[40px] border border-border gap-2 mb-2.5">
          <Search size={16} color="#94A3B8" />
          <TextInput
            className="flex-1 text-[13.5px] font-medium text-textMain p-0"
            placeholder="Tìm kiếm..."
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <X size={16} color="#94A3B8" />
            </TouchableOpacity>
          )}
        </View>

        {/* Category Filter Pills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8 }}
        >
          {allCategories.map((cat) => (
            <TouchableOpacity
              key={cat}
              className={`px-3 py-1.5 rounded-full border ${
                selectedCategory === cat ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-border'
              }`}
              onPress={() => setSelectedCategory(cat)}
              activeOpacity={0.75}
            >
              <Text
                className={`text-[11.5px] ${
                  selectedCategory === cat ? 'text-emerald-600 font-bold' : 'text-textSecondary font-semibold'
                }`}
              >
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Main List */}
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 14, paddingBottom: contentPaddingBottom, gap: 10 }}
        showsVerticalScrollIndicator={false}
      >
        {filteredItems.length === 0 ? (
          <View className="items-center justify-center py-12 px-6 bg-white rounded-2xl border border-border mt-2.5">
            <BookOpen size={48} color="#CBD5E1" />
            <Text className="text-[15px] font-bold text-slate-700 mt-3">Không tìm thấy món ăn nào</Text>
            <Text className="text-xs text-slate-500 text-center mt-1 leading-[17px]">
              Thử thay đổi từ khoá tìm kiếm hoặc bấm nút "Thêm món" bên dưới.
            </Text>
            <TouchableOpacity
              className="flex-row items-center gap-1.5 bg-emerald-600 px-4 py-2.5 rounded-xl mt-4 active:bg-emerald-700"
              onPress={handleOpenAddForm}
              activeOpacity={0.8}
            >
              <Plus size={16} color="#FFFFFF" strokeWidth={2.5} />
              <Text className="text-white text-[13px] font-bold">Thêm món ngay</Text>
            </TouchableOpacity>
          </View>
        ) : (
          filteredItems.map((item) => {
            const isSoldOut = !!soldOutState[item.id];

            return (
              <View
                key={item.id}
                className={`bg-white rounded-2xl p-3 border shadow-sm ${
                  isSoldOut ? 'bg-rose-50/40 border-rose-200' : 'border-border'
                }`}
              >
                {/* Ảnh món & Info */}
                <View className="flex-row items-center">
                  <Image source={{ uri: item.imageUrl }} className="w-[52px] h-[52px] rounded-xl bg-slate-100" />

                  <View className="flex-1 ml-3">
                    <View className="flex-row items-center gap-1.5">
                      <Text
                        className={`text-sm font-bold shrink ${isSoldOut ? 'line-through text-textMuted' : 'text-textMain'}`}
                        numberOfLines={1}
                      >
                        {item.name}
                      </Text>
                      {item.isPopular && (
                        <View className="flex-row items-center gap-0.5 bg-orange-100 px-1.5 py-0.5 rounded">
                          <Flame size={10} color="#EA580C" />
                          <Text className="text-[9.5px] font-bold text-orange-700">Bán chạy</Text>
                        </View>
                      )}
                    </View>

                    <Text className="text-[11.5px] text-textSecondary mt-0.5">
                      {typeof item.category === 'object' && item.category !== null ? (item.category as any).name : item.category} • <Text className="font-bold text-emerald-600">{formatCurrency(item.price)}</Text>
                    </Text>
                  </View>
                </View>

                {/* Hàng nút tác vụ: Sửa, Xoá & Switch Báo hết */}
                <View className="flex-row items-center justify-between mt-2.5 pt-2 border-t border-slate-100">
                  {/* Switch Báo Hết */}
                  <View className="flex-row items-center gap-1.5">
                    <Text
                      className={`text-[11.5px] font-bold ${
                        isSoldOut ? 'text-rose-600' : 'text-emerald-600'
                      }`}
                    >
                      {isSoldOut ? 'Tạm hết' : 'Còn hàng'}
                    </Text>
                    <Switch
                      value={!isSoldOut}
                      onValueChange={() => onToggleSoldOut(item.id)}
                      trackColor={{ false: '#FECDD3', true: '#10B981' }}
                      thumbColor={!isSoldOut ? '#FFFFFF' : '#E11D48'}
                    />
                  </View>

                  <View className="flex-row items-center gap-1.5">
                    {/* Nút Sửa -> Chuyển sang màn hình riêng */}
                    <TouchableOpacity
                      className="flex-row items-center gap-1 px-2.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200"
                      onPress={() => handleOpenEditForm(item)}
                      activeOpacity={0.7}
                    >
                      <Pencil size={13} color="#059669" strokeWidth={2.2} />
                      <Text className="text-[11.5px] font-bold text-emerald-600">Sửa</Text>
                    </TouchableOpacity>

                    {/* Nút Xoá */}
                    <TouchableOpacity
                      className="flex-row items-center gap-1 px-2.5 py-1.5 rounded-full bg-rose-50 border border-rose-200"
                      onPress={() => handleDeleteItem(item)}
                      activeOpacity={0.7}
                    >
                      <Trash2 size={13} color="#E11D48" strokeWidth={2.2} />
                      <Text className="text-[11.5px] font-bold text-rose-600">Xoá</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
};

export const MenuManagementScreen = SoldOutScreen;
export default SoldOutScreen;
