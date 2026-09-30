import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  Animated,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {
  ArrowLeft,
  Package,
  AlertTriangle,
  Plus,
  Search,
  X,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface Ingredient {
  id: string;
  name: string;
  stock: string;
  min: string;
  unit: string;
  status: 'OK' | 'WARNING';
}

interface InventoryScreenProps {
  onBack: () => void;
}

// Reusable Bottom Sheet with FADING backdrop & SLIDING form card
const AnimatedBottomSheet: React.FC<{
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
}> = ({ visible, onClose, children }) => {
  const insets = useSafeAreaInsets();
  const [mounted, setMounted] = useState(visible);
  const slideAnim = useRef(new Animated.Value(600)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setMounted(true);
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          damping: 24,
          stiffness: 220,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 600,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start(() => setMounted(false));
    }
  }, [visible]);

  if (!mounted) return null;

  return (
    <Modal visible={mounted} transparent animationType="none" statusBarTranslucent onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1 justify-end"
      >
        {/* Backdrop FADE */}
        <Animated.View
          className="absolute inset-0 bg-black/40"
          style={{ opacity: fadeAnim }}
        >
          <TouchableOpacity className="flex-1" activeOpacity={1} onPress={onClose} />
        </Animated.View>

        {/* Card SLIDE UP */}
        <Animated.View
          className="bg-white rounded-t-[32px] px-5 pt-4 border-t border-slate-100"
          style={{
            transform: [{ translateY: slideAnim }],
            paddingBottom: Math.max(insets.bottom, 16) + 12,
            shadowColor: '#0F172A',
            shadowOffset: { width: 0, height: -4 },
            shadowOpacity: 0.12,
            shadowRadius: 16,
            elevation: 10,
          }}
        >
          <View className="w-10 h-1 rounded-full bg-slate-300 self-center mb-3.5" />
          {children}
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

export const InventoryScreen: React.FC<InventoryScreenProps> = ({ onBack }) => {
  const insets = useSafeAreaInsets();
  const dynamicPaddingBottom = insets.bottom > 0 ? Math.max(insets.bottom - 16, 6) : 6;
  const contentPaddingBottom = dynamicPaddingBottom + 16;
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'ALL' | 'WARNING' | 'OK'>('ALL');

  const [ingredients, setIngredients] = useState<Ingredient[]>([
    { id: '1', name: 'Hạt Cà Phê Robusta Cầu Đất', stock: '12.5 kg', min: '5.0 kg', unit: 'kg', status: 'OK' },
    { id: '2', name: 'Sữa Tươi Thanh Trùng DalatMilk', stock: '3.2 Lít', min: '6.0 Lít', unit: 'Lít', status: 'WARNING' },
    { id: '3', name: 'Trà Đen Phúc Long Thượng Hạng', stock: '8.4 kg', min: '3.0 kg', unit: 'kg', status: 'OK' },
    { id: '4', name: 'Sốt Trứng Muối Hoàng Kim', stock: '0.8 Hộp', min: '2.0 Hộp', unit: 'Hộp', status: 'WARNING' },
    { id: '5', name: 'Siro Đào Monin 700ml', stock: '4 Chai', min: '2 Chai', unit: 'Chai', status: 'OK' },
    { id: '6', name: 'Bột Matcha Uji Nhật Bản', stock: '1.5 kg', min: '1.0 kg', unit: 'kg', status: 'OK' },
    { id: '7', name: 'Đường Nước Mía Tinh Luyện', stock: '15.0 kg', min: '8.0 kg', unit: 'kg', status: 'OK' },
  ]);

  const warningCount = ingredients.filter((i) => i.status === 'WARNING').length;

  // Trang thêm nguyên liệu mới
  const [isAddFormVisible, setIsAddFormVisible] = useState(false);
  const [newIngredient, setNewIngredient] = useState({ name: '', unit: 'kg', stock: '', min: '' });

  const handleAddIngredient = () => {
    if (!newIngredient.name.trim() || !newIngredient.stock.trim() || !newIngredient.min.trim()) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập tên, tồn kho và định mức tối thiểu');
      return;
    }
    const stockVal = parseFloat(newIngredient.stock);
    const minVal = parseFloat(newIngredient.min);
    if (isNaN(stockVal) || isNaN(minVal)) {
      Alert.alert('Lỗi', 'Tồn kho và định mức phải là số');
      return;
    }
    const newItem: Ingredient = {
      id: Date.now().toString(),
      name: newIngredient.name.trim(),
      stock: `${newIngredient.stock.trim()} ${newIngredient.unit}`,
      min: `${newIngredient.min.trim()} ${newIngredient.unit}`,
      unit: newIngredient.unit,
      status: stockVal < minVal ? 'WARNING' : 'OK',
    };
    setIngredients((prev) => [newItem, ...prev]);
    setNewIngredient({ name: '', unit: 'kg', stock: '', min: '' });
    setIsAddFormVisible(false);
  };

  const filteredList = ingredients.filter((item) => {
    const matchSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchFilter =
      filterType === 'ALL' ? true : item.status === filterType;
    return matchSearch && matchFilter;
  });

  const handleQuickAdjust = (item: Ingredient) => {
    Alert.prompt
      ? Alert.prompt(
          'Điều chỉnh tồn kho',
          `Nhập số lượng tồn kho mới cho "${item.name}":`,
          [
            { text: 'Huỷ', style: 'cancel' },
            {
              text: 'Lưu',
              onPress: (val?: string) => {
                if (val) {
                  setIngredients((prev) =>
                    prev.map((i) => (i.id === item.id ? { ...i, stock: `${val} ${i.unit}`, status: 'OK' } : i))
                  );
                }
              },
            },
          ],
          'plain-text',
          item.stock.replace(` ${item.unit}`, '')
        )
      : Alert.alert('Điều chỉnh kho', `Đã cập nhật tồn kho cho "${item.name}"!`);
  };

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
            <Text className="text-[20px] font-extrabold text-textMain">Quản Lý Nguyên Liệu</Text>
          </View>
          <TouchableOpacity
            className="w-9 h-9 items-center justify-center ml-2"
            onPress={() => setIsAddFormVisible(true)}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Plus size={22} color="#10B981" strokeWidth={2.5} />
          </TouchableOpacity>
        </View>

        {/* Search */}
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

        {/* Filter Pills */}
        <View className="flex-row gap-2">
          <TouchableOpacity
            className={`px-3 py-1.5 rounded-full border ${
              filterType === 'ALL' ? 'bg-amber-100 border-amber-200' : 'bg-slate-50 border-border'
            }`}
            onPress={() => setFilterType('ALL')}
            activeOpacity={0.75}
          >
            <Text className={`text-[11.5px] font-semibold ${filterType === 'ALL' ? 'text-amber-700 font-bold' : 'text-textSecondary'}`}>
              Tất cả ({ingredients.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            className={`px-3 py-1.5 rounded-full border ${
              filterType === 'WARNING' ? 'bg-amber-100 border-amber-500' : 'bg-slate-50 border-border'
            }`}
            onPress={() => setFilterType('WARNING')}
            activeOpacity={0.75}
          >
            <Text className={`text-[11.5px] font-semibold ${filterType === 'WARNING' ? 'text-amber-700 font-bold' : 'text-textSecondary'}`}>
              Sắp hết ({warningCount})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            className={`px-3 py-1.5 rounded-full border ${
              filterType === 'OK' ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-border'
            }`}
            onPress={() => setFilterType('OK')}
            activeOpacity={0.75}
          >
            <Text className={`text-[11.5px] font-semibold ${filterType === 'OK' ? 'text-emerald-600 font-bold' : 'text-textSecondary'}`}>
              Đủ hàng ({ingredients.length - warningCount})
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Main List */}
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 16, paddingBottom: contentPaddingBottom, gap: 12 }}
        showsVerticalScrollIndicator={false}
      >
        {filteredList.map((item) => {
          const isWarning = item.status === 'WARNING';

          return (
            <View
              key={item.id}
              className={`bg-white rounded-2xl p-3.5 border shadow-sm ${
                isWarning ? 'border-amber-200 bg-amber-50/30' : 'border-border'
              }`}
            >
              <View className="flex-row justify-between items-start mb-3">
                <View className="flex-row items-center flex-1 mr-2.5">
                  <View className={`w-[38px] h-[38px] rounded-xl items-center justify-center mr-2.5 ${
                    isWarning ? 'bg-amber-100' : 'bg-emerald-50'
                  }`}>
                    {isWarning ? (
                      <AlertTriangle size={18} color="#D97706" />
                    ) : (
                      <Package size={18} color="#10B981" />
                    )}
                  </View>
                  <View className="flex-1">
                    <Text className="text-sm font-bold text-textMain">{item.name}</Text>
                    <Text className="text-[11px] text-textSecondary mt-0.5">Định mức tối thiểu: {item.min}</Text>
                  </View>
                </View>

                <View className={`px-2 py-0.5 rounded-lg border ${
                  isWarning ? 'bg-amber-100 border-amber-200' : 'bg-emerald-50 border-emerald-200'
                }`}>
                  <Text className={`text-[11px] font-bold ${
                    isWarning ? 'text-amber-700' : 'text-emerald-600'
                  }`}>
                    {isWarning ? 'Sắp hết' : 'Đủ hàng'}
                  </Text>
                </View>
              </View>

              <View className="flex-row justify-between items-center border-t border-slate-100 pt-2.5">
                <View className="flex-row items-baseline gap-1.5">
                  <Text className="text-xs text-textSecondary">Tồn kho hiện tại:</Text>
                  <Text className={`text-[15px] font-extrabold ${isWarning ? 'text-amber-600' : 'text-textMain'}`}>
                    {item.stock}
                  </Text>
                </View>

                <TouchableOpacity
                  className="bg-slate-100 px-3 py-1.5 rounded-xl border border-border"
                  onPress={() => handleQuickAdjust(item)}
                  activeOpacity={0.8}
                >
                  <Text className="text-xs font-bold text-textMain">Điều chỉnh tồn</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })}
      </ScrollView>

      {/* Tab trượt từ dưới - Thêm nguyên liệu */}
      <AnimatedBottomSheet visible={isAddFormVisible} onClose={() => setIsAddFormVisible(false)}>
        <View className="flex-row items-center justify-between mb-2">
          <Text className="text-[19px] font-black text-textMain">Thêm Nguyên Liệu</Text>
          <TouchableOpacity
            onPress={() => setIsAddFormVisible(false)}
            className="w-9 h-9 rounded-full bg-slate-100 items-center justify-center border border-slate-200"
            activeOpacity={0.7}
          >
            <X size={18} color="#475569" />
          </TouchableOpacity>
        </View>

        <View className="gap-3.5 my-4">
          <View>
            <Text className="text-[13.5px] font-bold text-slate-800 mb-1.5">Tên nguyên liệu</Text>
            <View className="h-[52px] bg-slate-50 rounded-2xl px-4 border border-slate-200 justify-center">
              <TextInput
                className="text-[15px] text-textMain font-semibold p-0"
                placeholder="VD: Hạt Cà Phê Arabica"
                placeholderTextColor="#94A3B8"
                value={newIngredient.name}
                onChangeText={(t) => setNewIngredient({ ...newIngredient, name: t })}
              />
            </View>
          </View>

          <View>
            <Text className="text-[13.5px] font-bold text-slate-800 mb-1.5">Đơn vị tính</Text>
            <View className="h-[52px] bg-slate-50 rounded-2xl px-4 border border-slate-200 justify-center">
              <TextInput
                className="text-[15px] text-textMain font-semibold p-0"
                placeholder="kg, Lít, Hộp, Chai..."
                placeholderTextColor="#94A3B8"
                value={newIngredient.unit}
                onChangeText={(t) => setNewIngredient({ ...newIngredient, unit: t })}
              />
            </View>
          </View>

          <View className="flex-row gap-3">
            <View className="flex-1">
              <Text className="text-[13.5px] font-bold text-slate-800 mb-1.5">Tồn kho ban đầu</Text>
              <View className="h-[52px] bg-slate-50 rounded-2xl px-4 border border-slate-200 justify-center">
                <TextInput
                  className="text-[15px] text-textMain font-semibold p-0"
                  placeholder="0"
                  placeholderTextColor="#94A3B8"
                  value={newIngredient.stock}
                  onChangeText={(t) => setNewIngredient({ ...newIngredient, stock: t })}
                  keyboardType="numeric"
                />
              </View>
            </View>
            <View className="flex-1">
              <Text className="text-[13.5px] font-bold text-slate-800 mb-1.5">Định mức tối thiểu</Text>
              <View className="h-[52px] bg-slate-50 rounded-2xl px-4 border border-slate-200 justify-center">
                <TextInput
                  className="text-[15px] text-textMain font-semibold p-0"
                  placeholder="0"
                  placeholderTextColor="#94A3B8"
                  value={newIngredient.min}
                  onChangeText={(t) => setNewIngredient({ ...newIngredient, min: t })}
                  keyboardType="numeric"
                />
              </View>
            </View>
          </View>
        </View>

        <View className="flex-row gap-3">
          <TouchableOpacity
            className="flex-1 h-[52px] rounded-2xl bg-slate-100 items-center justify-center border border-slate-200 active:bg-slate-200"
            onPress={() => setIsAddFormVisible(false)}
            activeOpacity={0.7}
          >
            <Text className="text-[14.5px] font-bold text-slate-700">Huỷ</Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="flex-[2] h-[52px] rounded-2xl bg-primary items-center justify-center active:bg-primaryDark shadow-sm"
            onPress={handleAddIngredient}
            activeOpacity={0.8}
          >
            <Text className="text-[15px] font-black text-white">Xác nhận</Text>
          </TouchableOpacity>
        </View>
      </AnimatedBottomSheet>
    </View>
  );
};

export default InventoryScreen;
