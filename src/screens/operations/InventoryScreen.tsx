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
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import {
  ArrowLeft,
  Package,
  AlertTriangle,
  Plus,
  Search,
  X,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  RotateCcw,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { api } from '../../services/api';
import { useSocketEvent } from '../../hooks/useSocket';

export interface Ingredient {
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
        <Animated.View
          className="absolute inset-0 bg-black/40"
          style={{ opacity: fadeAnim }}
        >
          <TouchableOpacity className="flex-1" activeOpacity={1} onPress={onClose} />
        </Animated.View>

        <Animated.View
          className="bg-white rounded-t-[32px] px-5 pt-4 pb-8 border-t border-slate-100"
          style={{
            transform: [{ translateY: slideAnim }],
          }}
        >
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
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [ingredients, setIngredients] = useState<Ingredient[]>([
    { id: 'ing-1', name: 'Hạt Cà Phê Robusta', stock: '18.5 kg', min: '5.0 kg', unit: 'kg', status: 'OK' },
    { id: 'ing-2', name: 'Sữa Đặc Ngôi Sao', stock: '12 lon', min: '15 lon', unit: 'lon', status: 'WARNING' },
    { id: 'ing-3', name: 'Trà Xanh Oolong', stock: '3.2 kg', min: '4.0 kg', unit: 'kg', status: 'WARNING' },
    { id: 'ing-4', name: 'Sữa Tươi Thanh Trùng Barista', stock: '24 hộp 1L', min: '10 hộp 1L', unit: 'hộp 1L', status: 'OK' },
    { id: 'ing-5', name: 'Đường Mía Tự Nhiên', stock: '45 kg', min: '10 kg', unit: 'kg', status: 'OK' },
    { id: 'ing-6', name: 'Trân Châu Trắng 3Q', stock: '2.5 kg', min: '5.0 kg', unit: 'kg', status: 'WARNING' },
  ]);

  // Load danh sách tồn kho từ API (Task B-012)
  const loadIngredients = async () => {
    try {
      setLoading(true);
      const data = await api.getIngredients();
      if (data && data.length > 0) {
        setIngredients(
          data.map((d: any) => ({
            id: d.id,
            name: d.name,
            stock: `${d.quantity} ${d.unit}`,
            min: `${d.lowStockThreshold} ${d.unit}`,
            unit: d.unit,
            status: d.quantity <= d.lowStockThreshold ? 'WARNING' : 'OK',
          }))
        );
      }
    } catch (err: any) {
      console.log('[InventoryScreen] Fallback to local stock data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadIngredients();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadIngredients();
    setRefreshing(false);
  };

  // Socket: cảnh báo tồn kho sắp hết
  useSocketEvent('inventory:warning', (payload: any) => {
    console.log('⚠️ [InventoryScreen] Low stock warning received:', payload);
    setIngredients((prev) =>
      prev.map((i) =>
        i.id === payload.ingredientId
          ? { ...i, stock: `${payload.currentStock} ${payload.unit}`, status: 'WARNING' }
          : i
      )
    );
  });

  // Socket: cập nhật tồn kho
  useSocketEvent('inventory:updated', (payload: any) => {
    setIngredients((prev) =>
      prev.map((i) =>
        i.id === payload.ingredientId
          ? { ...i, stock: `${payload.quantity} ${i.unit}` }
          : i
      )
    );
  });

  const warningCount = ingredients.filter((i) => i.status === 'WARNING').length;

  // Trang thêm nguyên liệu mới
  const [isAddFormVisible, setIsAddFormVisible] = useState(false);
  const [newIngredient, setNewIngredient] = useState({ name: '', unit: 'kg', stock: '', min: '' });

  // Modal điều chỉnh tồn kho (Android & iOS) (Task B-012)
  const [adjustingItem, setAdjustingItem] = useState<Ingredient | null>(null);
  const [adjustmentValue, setAdjustmentValue] = useState<string>('');
  const [adjustmentType, setAdjustmentType] = useState<'ADD' | 'REMOVE' | 'SET'>('SET');
  const [adjustmentReason, setAdjustmentReason] = useState<string>('Kiểm kê định kỳ');
  const [adjustLoading, setAdjustLoading] = useState(false);

  const handleOpenAdjust = (item: Ingredient) => {
    setAdjustingItem(item);
    const rawQty = item.stock.replace(` ${item.unit}`, '').trim();
    setAdjustmentValue(rawQty);
    setAdjustmentType('SET');
    setAdjustmentReason('Kiểm kê định kỳ');
  };

  const handleConfirmAdjust = async () => {
    if (!adjustingItem) return;
    const num = parseFloat(adjustmentValue);
    if (isNaN(num)) {
      Alert.alert('Lỗi', 'Vui lòng nhập số hợp lệ');
      return;
    }

    try {
      setAdjustLoading(true);
      await api.adjustIngredientStock(adjustingItem.id, {
        adjustment: num,
        type: adjustmentType,
        reason: adjustmentReason,
      });

      // Update local state
      const minVal = parseFloat(adjustingItem.min.replace(` ${adjustingItem.unit}`, ''));
      let finalQty = num;
      const currentQty = parseFloat(adjustingItem.stock.replace(` ${adjustingItem.unit}`, '')) || 0;
      if (adjustmentType === 'ADD') finalQty = currentQty + num;
      if (adjustmentType === 'REMOVE') finalQty = Math.max(0, currentQty - num);

      setIngredients((prev) =>
        prev.map((i) =>
          i.id === adjustingItem.id
            ? {
                ...i,
                stock: `${finalQty} ${i.unit}`,
                status: finalQty <= minVal ? 'WARNING' : 'OK',
              }
            : i
        )
      );

      setAdjustingItem(null);
      Alert.alert('Thành công', `Đã cập nhật tồn kho cho "${adjustingItem.name}"!`);
    } catch (err: any) {
      Alert.alert('Lỗi', err.message || 'Không thể điều chỉnh tồn kho');
    } finally {
      setAdjustLoading(false);
    }
  };

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
      id: `ing-${Date.now()}`,
      name: newIngredient.name.trim(),
      stock: `${newIngredient.stock.trim()} ${newIngredient.unit}`,
      min: `${newIngredient.min.trim()} ${newIngredient.unit}`,
      unit: newIngredient.unit,
      status: stockVal <= minVal ? 'WARNING' : 'OK',
    };
    setIngredients((prev) => [newItem, ...prev]);
    setNewIngredient({ name: '', unit: 'kg', stock: '', min: '' });
    setIsAddFormVisible(false);
  };

  const filteredList = ingredients.filter((item) => {
    const matchSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchFilter = filterType === 'ALL' ? true : item.status === filterType;
    return matchSearch && matchFilter;
  });

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
          <View className="flex-row items-center gap-2">
            <TouchableOpacity
              className="w-9 h-9 rounded-xl bg-slate-100 items-center justify-center border border-border"
              onPress={loadIngredients}
              activeOpacity={0.7}
            >
              {loading ? <ActivityIndicator size="small" color="#0F172A" /> : <RefreshCw size={16} color="#0F172A" />}
            </TouchableOpacity>
            <TouchableOpacity
              className="w-9 h-9 items-center justify-center rounded-xl bg-emerald-50 border border-emerald-200"
              onPress={() => setIsAddFormVisible(true)}
              activeOpacity={0.7}
            >
              <Plus size={20} color="#10B981" strokeWidth={2.5} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Search */}
        <View className="flex-row items-center bg-[#F8FAFC] rounded-xl px-3.5 h-[40px] border border-border gap-2 mb-2.5">
          <Search size={16} color="#94A3B8" />
          <TextInput
            className="flex-1 text-[13.5px] font-medium text-textMain p-0"
            placeholder="Tìm kiếm nguyên liệu..."
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
              filterType === 'WARNING' ? 'bg-rose-100 border-rose-300' : 'bg-slate-50 border-border'
            }`}
            onPress={() => setFilterType('WARNING')}
            activeOpacity={0.75}
          >
            <Text className={`text-[11.5px] font-semibold ${filterType === 'WARNING' ? 'text-rose-700 font-bold' : 'text-textSecondary'}`}>
              Cảnh báo thiếu ({warningCount})
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
              Đủ tồn ({ingredients.length - warningCount})
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Main List */}
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 16, paddingBottom: contentPaddingBottom, gap: 12 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#D97706']} />}
      >
        {filteredList.map((item) => {
          const isWarning = item.status === 'WARNING';

          return (
            <View
              key={item.id}
              className={`bg-white rounded-2xl p-3.5 border shadow-sm ${
                isWarning ? 'border-rose-300 bg-rose-50/25' : 'border-border'
              }`}
            >
              <View className="flex-row justify-between items-start mb-3">
                <View className="flex-row items-center flex-1 mr-2.5">
                  <View className={`w-[38px] h-[38px] rounded-xl items-center justify-center mr-2.5 ${
                    isWarning ? 'bg-rose-100' : 'bg-emerald-50'
                  }`}>
                    {isWarning ? (
                      <AlertTriangle size={18} color="#E11D48" />
                    ) : (
                      <Package size={18} color="#10B981" />
                    )}
                  </View>
                  <View className="flex-1">
                    <Text className="text-sm font-bold text-textMain">{item.name}</Text>
                    <Text className="text-[11px] text-textSecondary mt-0.5">Định mức an toàn: {item.min}</Text>
                  </View>
                </View>

                <View className={`px-2 py-0.5 rounded-lg border ${
                  isWarning ? 'bg-rose-100 border-rose-200' : 'bg-emerald-50 border-emerald-200'
                }`}>
                  <Text className={`text-[11px] font-bold ${
                    isWarning ? 'text-rose-700' : 'text-emerald-600'
                  }`}>
                    {isWarning ? 'Sắp hết' : 'Đủ hàng'}
                  </Text>
                </View>
              </View>

              <View className="flex-row justify-between items-center border-t border-slate-100 pt-2.5">
                <View className="flex-row items-baseline gap-1.5">
                  <Text className="text-xs text-textSecondary">Tồn kho hiện tại:</Text>
                  <Text className={`text-[15px] font-black ${isWarning ? 'text-rose-600' : 'text-textMain'}`}>
                    {item.stock}
                  </Text>
                </View>

                <TouchableOpacity
                  className="bg-slate-100 px-3 py-1.5 rounded-xl border border-border"
                  onPress={() => handleOpenAdjust(item)}
                  activeOpacity={0.8}
                >
                  <Text className="text-xs font-bold text-textMain">Kiểm kê / Sửa</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })}
      </ScrollView>

      {/* Modal Điều Chỉnh Tồn Kho Chuẩn Android / iOS (Task B-012) */}
      {adjustingItem && (
        <Modal visible={!!adjustingItem} transparent animationType="fade">
          <View className="flex-1 bg-slate-900/60 justify-center items-center p-5">
            <View className="w-full max-w-[360px] bg-white rounded-3xl p-5 shadow-xl">
              <View className="flex-row justify-between items-start mb-3">
                <View>
                  <Text className="text-[17px] font-extrabold text-textMain">Điều Chỉnh Tồn Kho</Text>
                  <Text className="text-xs text-textSecondary mt-0.5">{adjustingItem.name}</Text>
                </View>
                <TouchableOpacity
                  className="w-8 h-8 rounded-full bg-slate-100 items-center justify-center"
                  onPress={() => setAdjustingItem(null)}
                >
                  <X size={18} color="#0F172A" />
                </TouchableOpacity>
              </View>

              {/* Loại thao tác: SET / ADD / REMOVE */}
              <View className="flex-row gap-2 mb-3">
                <TouchableOpacity
                  className={`flex-1 py-2 rounded-xl items-center border ${
                    adjustmentType === 'SET' ? 'bg-primary border-primary' : 'bg-slate-50 border-border'
                  }`}
                  onPress={() => setAdjustmentType('SET')}
                >
                  <Text className={`text-xs font-bold ${adjustmentType === 'SET' ? 'text-white' : 'text-textMain'}`}>
                    Cập nhật mới
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  className={`flex-1 py-2 rounded-xl items-center border ${
                    adjustmentType === 'ADD' ? 'bg-emerald-600 border-emerald-600' : 'bg-slate-50 border-border'
                  }`}
                  onPress={() => setAdjustmentType('ADD')}
                >
                  <Text className={`text-xs font-bold ${adjustmentType === 'ADD' ? 'text-white' : 'text-textMain'}`}>
                    + Nhập thêm
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  className={`flex-1 py-2 rounded-xl items-center border ${
                    adjustmentType === 'REMOVE' ? 'bg-rose-600 border-rose-600' : 'bg-slate-50 border-border'
                  }`}
                  onPress={() => setAdjustmentType('REMOVE')}
                >
                  <Text className={`text-xs font-bold ${adjustmentType === 'REMOVE' ? 'text-white' : 'text-textMain'}`}>
                    - Xuất / Hao
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Số lượng */}
              <View className="mb-3">
                <Text className="text-xs font-bold text-textSecondary mb-1.5">
                  Số lượng ({adjustingItem.unit})
                </Text>
                <TextInput
                  className="bg-slate-50 border border-border rounded-xl px-3.5 py-2.5 text-base font-bold text-textMain"
                  keyboardType="numeric"
                  value={adjustmentValue}
                  onChangeText={setAdjustmentValue}
                  placeholder="0"
                />
              </View>

              {/* Lý do */}
              <View className="mb-4">
                <Text className="text-xs font-bold text-textSecondary mb-1.5">Lý do điều chỉnh</Text>
                <View className="flex-row flex-wrap gap-1.5">
                  {['Kiểm kê định kỳ', 'Nhập kho mới', 'Làm đổ / Hỏng', 'Hao hụt tự nhiên'].map((r) => (
                    <TouchableOpacity
                      key={r}
                      className={`px-2.5 py-1 rounded-lg border ${
                        adjustmentReason === r ? 'bg-slate-800 border-slate-800' : 'bg-slate-50 border-border'
                      }`}
                      onPress={() => setAdjustmentReason(r)}
                    >
                      <Text className={`text-[11px] font-semibold ${adjustmentReason === r ? 'text-white' : 'text-textSecondary'}`}>
                        {r}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <TouchableOpacity
                className="bg-primary rounded-xl py-3 items-center justify-center active:bg-primaryDark"
                onPress={handleConfirmAdjust}
                disabled={adjustLoading}
              >
                {adjustLoading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text className="text-white text-xs font-bold">Lưu Thay Đổi Tồn Kho</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}

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
                placeholder="kg, lon, Lít, Hộp, Chai..."
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
              <Text className="text-[13.5px] font-bold text-slate-800 mb-1.5">Định mức an toàn</Text>
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
