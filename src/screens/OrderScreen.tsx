import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Modal,
  Animated,
  Alert,
} from 'react-native';
import {
  Search,
  Plus,
  Minus,
  ShoppingCart,
  Check,
  X,
  Sparkles,
  ArrowLeft,
  Banknote,
  CreditCard,
  QrCode,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useMenuStore } from '../data/menuStore';
import { useHistoryStore } from '../data/historyStore';
import { MenuItem, CartItem } from '../types';
import { ItemOptionsScreen } from './operations/ItemOptionsScreen';

interface OrderScreenProps {
  cart: CartItem[];
  onAddToCart: (item: MenuItem, selectedModifiers?: Record<string, string>, note?: string, quantity?: number) => void;
  onRemoveFromCart: (cartItemId: string) => void;
  onClearCart: () => void;
  onBack?: () => void;
  onBackToHistory?: () => void;
}

export const OrderScreen: React.FC<OrderScreenProps> = ({
  cart,
  onAddToCart,
  onRemoveFromCart,
  onClearCart,
  onBack,
  onBackToHistory,
}) => {
  const insets = useSafeAreaInsets();
  const { items: menuItems, categories, fetchMenuItems } = useMenuStore();
  const { orders, editingOrderId, setEditingOrderId, updateOrder } = useHistoryStore();
  const editingOrder = orders.find((o) => o.id === editingOrderId) || null;

  useEffect(() => {
    if (menuItems.length === 0) {
      fetchMenuItems();
    }
  }, [fetchMenuItems, menuItems.length]);

  const [selectedCategory, setSelectedCategory] = useState('Tất cả');
  const [searchQuery, setSearchQuery] = useState('');
  const [orderNote, setOrderNote] = useState('');
  const [isCartModalOpen, setIsCartModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('Tiền mặt');
  const [orderSuccessModal, setOrderSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState({
    title: 'Đã Tiếp Nhận Đơn Món!',
    sub: 'Đơn hàng đã được ghi nhận và chuyển cho bếp làm ngay.',
  });
  // Món đang chờ chọn tuỳ chọn trước khi vào giỏ
  const [pendingItem, setPendingItem] = useState<MenuItem | null>(null);

  // Đồng bộ phương thức thanh toán & ghi chú từ đơn đang sửa
  useEffect(() => {
    if (editingOrder) {
      setSelectedPaymentMethod(editingOrder.method || 'Tiền mặt');
      if (editingOrder.note) {
        setOrderNote(editingOrder.note);
      }
    }
  }, [editingOrderId]);

  const dynamicPaddingBottom = insets.bottom > 0 ? Math.max(insets.bottom - 16, 6) : 6;

  // Animation: card giỏ hàng trượt từ dưới lên
  const slideAnim = useRef(new Animated.Value(400)).current;
  useEffect(() => {
    if (isCartModalOpen) {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        damping: 22,
        stiffness: 220,
      }).start();
    } else {
      slideAnim.setValue(400);
    }
  }, [isCartModalOpen, slideAnim]);

  // Animation: card phương thức thanh toán trượt từ dưới lên
  const paymentSlideAnim = useRef(new Animated.Value(400)).current;
  useEffect(() => {
    if (isPaymentModalOpen) {
      Animated.spring(paymentSlideAnim, {
        toValue: 0,
        useNativeDriver: true,
        damping: 22,
        stiffness: 220,
      }).start();
    } else {
      paymentSlideAnim.setValue(400);
    }
  }, [isPaymentModalOpen, paymentSlideAnim]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  // Lọc món theo category & search
  const filteredItems = menuItems.filter((item) => {
    const matchCategory = selectedCategory === 'Tất cả' || item.category === selectedCategory;
    const matchSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCategory && matchSearch;
  });

  // Tính tổng số lượng và tổng tiền (dùng unitPrice nếu có)
  const totalCartCount = cart.reduce((sum, c) => sum + c.quantity, 0);
  const totalCartPrice = cart.reduce(
    (sum, c) => sum + c.quantity * (c.unitPrice ?? c.item.price),
    0
  );
  const contentPaddingBottom = dynamicPaddingBottom + 16;

  // Tổng số lượng theo item.id (gộp tất cả entry cùng món)
  const getItemQuantity = (itemId: string) => {
    return cart.filter((c) => c.item.id === itemId).reduce((sum, c) => sum + c.quantity, 0);
  };

  // Nhấn xác nhận trong giỏ hàng -> Mở modal chọn/sửa phương thức thanh toán
  const handleConfirmOrder = () => {
    setIsCartModalOpen(false);
    setIsPaymentModalOpen(true);
  };

  const handleBackPress = () => {
    if (editingOrder) {
      Alert.alert('Huỷ thay đổi?', `Bạn có chắc muốn huỷ các thay đổi cho đơn ${editingOrder.id} và quay lại lịch sử?`, [
        { text: 'Tiếp tục sửa', style: 'cancel' },
        {
          text: 'Xác nhận huỷ',
          style: 'destructive',
          onPress: () => {
            setEditingOrderId(null);
            onClearCart();
            setOrderNote('');
            if (onBackToHistory) onBackToHistory();
            else if (onBack) onBack();
          },
        },
      ]);
    } else {
      if (onBack) onBack();
    }
  };

  // Nhấn xác nhận phương thức thanh toán -> Lưu đơn & hiển thị thông báo
  const handleFinalConfirmPayment = () => {
    const wasEditing = !!editingOrder;
    const editingId = editingOrder?.id;
    setIsPaymentModalOpen(false);
    if (editingOrder) {
      const updatedItems = cart.map((c) => ({
        name: c.item.name,
        qty: c.quantity,
        price: c.unitPrice ?? c.item.price,
        note: c.note,
      }));
      updateOrder(editingOrder.id, {
        items: updatedItems,
        total: totalCartPrice,
        method: selectedPaymentMethod,
        note: orderNote || editingOrder.note,
      });
      setSuccessMessage({
        title: `Đã Cập Nhật Đơn ${editingOrder.id}!`,
        sub: `Đơn hàng đã được lưu với phương thức ${selectedPaymentMethod}.`,
      });
      setEditingOrderId(null);
    } else {
      setSuccessMessage({
        title: 'Đã Tiếp Nhận Đơn Món!',
        sub: `Đơn đã được ghi nhận (${selectedPaymentMethod}) và chuyển cho bếp.`,
      });
    }
    setOrderSuccessModal(true);
    setTimeout(() => {
      onClearCart();
      setOrderNote('');
      setOrderSuccessModal(false);
      if (wasEditing) {
        if (onBackToHistory) onBackToHistory();
        else if (onBack) onBack();
      }
    }, 1600);
  };

  return (
    <View className="flex-1 bg-background">
      {/* Header Bar */}
      <View className="px-4 pt-2.5 pb-3 bg-white border-b border-[#F1F5F9]">
        <View className="flex-row justify-between items-center mb-2.5">
          <View className="flex-row items-center flex-1 mr-2">
            {onBack && (
              <TouchableOpacity
                className="w-9 h-9 rounded-xl bg-[#F1F5F9] items-center justify-center mr-3 border border-border"
                onPress={handleBackPress}
                activeOpacity={0.7}
              >
                <ArrowLeft size={18} color="#0F172A" />
              </TouchableOpacity>
            )}
            <View>
              <Text className="text-[20px] font-extrabold text-textMain">
                {editingOrder ? `Sửa Đơn ${editingOrder.id}` : 'Thao Tác Gọi Món'}
              </Text>
              {editingOrder && (
                <Text className="text-[12px] text-textSecondary mt-0.5">
                  Bàn: {editingOrder.table} • Phương thức: {editingOrder.method}
                </Text>
              )}
            </View>
          </View>

          {/* Icon giỏ hàng màu xanh không bọc border */}
          <TouchableOpacity
            className="p-1.5 relative items-center justify-center"
            onPress={() => setIsCartModalOpen(true)}
            activeOpacity={0.75}
          >
            <ShoppingCart size={24} color="#059669" strokeWidth={2.3} />
            {totalCartCount > 0 && (
              <View className="absolute -top-0.5 -right-1 bg-primary min-w-[18px] h-[18px] rounded-full items-center justify-center px-1 border-2 border-white">
                <Text className="text-white text-[9.5px] font-black">{totalCartCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View className="flex-row items-center bg-[#F8FAFC] rounded-xl px-3.5 h-[40px] border border-border gap-2">
          <Search size={16} color="#94A3B8" />
          <TextInput
            placeholder="Tìm kiếm..."
            placeholderTextColor="#94A3B8"
            className="flex-1 text-[13.5px] text-textMain p-0 font-medium"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <X size={16} color="#94A3B8" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Horizontal Category Filter Pills */}
      <View className="bg-white py-2.5 border-b border-[#F1F5F9]">
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}>
          {categories.map((cat) => {
            const isActive = cat === selectedCategory;
            return (
              <TouchableOpacity
                key={cat}
                className={`px-3.5 py-[7px] rounded-full ${isActive ? 'bg-primary' : 'bg-[#F1F5F9]'}`}
                onPress={() => setSelectedCategory(cat)}
                activeOpacity={0.8}
              >
                <Text className={`text-[12.5px] ${isActive ? 'text-white font-bold' : 'font-semibold text-textSecondary'}`}>
                  {cat}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Menu Item Grid */}
      <ScrollView
        contentContainerStyle={{ padding: 12, paddingBottom: contentPaddingBottom }}
        showsVerticalScrollIndicator={false}
      >
        <View className="flex-row flex-wrap gap-3">
          {filteredItems.map((item) => {
            const qty = getItemQuantity(item.id);
            return (
              <View
                key={item.id}
                className="bg-white rounded-[18px] p-3 border border-border relative"
                style={{
                  width: '48%',
                  shadowColor: '#0F172A',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.05,
                  shadowRadius: 10,
                  elevation: 2,
                }}
              >
                {item.isPopular && (
                  <View className="absolute top-2 left-2 bg-[#EF4444] flex-row items-center gap-1 px-1.5 py-0.5 rounded-[6px] z-10">
                    <Sparkles size={10} color="#FFFFFF" />
                    <Text className="text-white text-[9px] font-extrabold">Bán chạy</Text>
                  </View>
                )}

                <Image source={{ uri: item.imageUrl }} className="w-full h-[105px] rounded-[12px] mb-2" resizeMode="cover" />

                <Text className="text-[13.5px] font-bold text-textMain min-h-[36px]" numberOfLines={2}>{item.name}</Text>
                <Text className="text-[11px] text-textMuted mt-0.5 mb-1.5">
                  {typeof item.category === 'object' && item.category !== null ? (item.category as any).name : item.category}
                </Text>

                <View className="flex-row justify-between items-center mt-1">
                  <Text className="text-[13.5px] font-extrabold text-primaryDark">{formatCurrency(item.price)}</Text>

                  {/* Stepper hoặc Add */}
                  {qty === 0 ? (
                    <TouchableOpacity
                      className="w-[30px] h-[30px] rounded-full bg-primary items-center justify-center"
                      onPress={() => setPendingItem(item)}
                      activeOpacity={0.8}
                    >
                      <Plus size={16} color="#FFFFFF" strokeWidth={2.5} />
                    </TouchableOpacity>
                  ) : (
                    <View className="flex-row items-center bg-primary rounded-full px-1.5 py-[3px] gap-1.5">
                      <TouchableOpacity
                        onPress={() => {
                          const target = cart.find((c) => c.item.id === item.id);
                          if (target?.cartItemId) onRemoveFromCart(target.cartItemId);
                          else if (target) onRemoveFromCart(target.item.id);
                        }}
                        className="p-0.5"
                      >
                        <Minus size={12} color="#FFFFFF" strokeWidth={2.5} />
                      </TouchableOpacity>
                      <Text className="text-white text-[12px] font-extrabold min-w-[14px] text-center">{qty}</Text>
                      <TouchableOpacity
                        onPress={() => setPendingItem(item)}
                        className="p-0.5"
                      >
                        <Plus size={12} color="#FFFFFF" strokeWidth={2.5} />
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>

      {/* Modal Xem Giỏ Hàng & Xác Nhận Order */}
      <Modal visible={isCartModalOpen} transparent animationType="fade" statusBarTranslucent>
        <View className="flex-1 bg-[rgba(15,23,42,0.5)] justify-end">
          <TouchableOpacity
            className="absolute inset-0"
            activeOpacity={1}
            onPress={() => setIsCartModalOpen(false)}
          />
          <Animated.View className="bg-white rounded-t-[28px] p-5" style={{ maxHeight: '80%', transform: [{ translateY: slideAnim }] }}>
            <View className="flex-row justify-between items-center mb-4">
              <View>
                <Text className="text-[18px] font-extrabold text-textMain">Xác Nhận Đơn Món</Text>
                <Text className="text-[12px] text-textSecondary mt-0.5">
                  {totalCartCount} món đã chọn
                </Text>
              </View>
              <TouchableOpacity onPress={() => setIsCartModalOpen(false)}>
                <X size={22} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            {/* Ghi chú đơn hàng */}
            <View className="mb-3.5">
              <TextInput
                className="bg-[#F8FAFC] rounded-[12px] px-3.5 py-[9px] text-[12.5px] text-textMain border border-border"
                placeholder="Ghi chú đơn (vd: ít ngọt, nhiều đá, chia 2 túi...)"
                placeholderTextColor="#94A3B8"
                value={orderNote}
                onChangeText={setOrderNote}
              />
            </View>

            <ScrollView style={{ maxHeight: 280 }} showsVerticalScrollIndicator={false}>
              {cart.map((c) => (
                <View key={c.cartItemId ?? c.item.id} className="flex-row items-center py-2.5 border-b border-[#F1F5F9]">
                  <Image source={{ uri: c.item.imageUrl }} className="w-11 h-11 rounded-[10px]" />
                  <View className="flex-1 ml-3">
                    <Text className="text-[13.5px] font-bold text-textMain">{c.item.name}</Text>
                    {c.selectedModifiers && Object.keys(c.selectedModifiers).length > 0 && (
                      <Text className="text-[11px] text-primaryDark font-semibold mt-0.5">
                        {Object.entries(c.selectedModifiers)
                          .map(([k, v]) => `${k}: ${v}`)
                          .join(' • ')}
                      </Text>
                    )}
                    {c.note ? (
                      <Text className="text-[11px] text-[#F59E0B] font-semibold mt-[1px]">Ghi chú: {c.note}</Text>
                    ) : null}
                    <Text className="text-[13px] font-extrabold text-primaryDark mt-0.5">
                      {formatCurrency(c.unitPrice ?? c.item.price)}
                    </Text>
                  </View>
                  <View className="flex-row items-center bg-primary rounded-full px-2 py-1 gap-2">
                    <TouchableOpacity
                      onPress={() => onRemoveFromCart(c.cartItemId ?? c.item.id)}
                      className="p-0.5"
                    >
                      <Minus size={14} color="#FFFFFF" />
                    </TouchableOpacity>
                    <Text className="text-white text-[13px] font-extrabold min-w-[16px] text-center">{c.quantity}</Text>
                    <TouchableOpacity
                      onPress={() => setPendingItem(c.item)}
                      className="p-0.5"
                    >
                      <Plus size={14} color="#FFFFFF" />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </ScrollView>

            <View className="pt-4 border-t border-[#F1F5F9]">
              <View className="flex-row justify-between items-center mb-3.5">
                <Text className="text-[14px] font-semibold text-textSecondary">Tổng Thanh Toán:</Text>
                <Text className="text-[20px] font-black text-primaryDark">{formatCurrency(totalCartPrice)}</Text>
              </View>

              <TouchableOpacity
                className="bg-primary rounded-full py-[15px] items-center"
                onPress={handleConfirmOrder}
                activeOpacity={0.85}
              >
                <Text className="text-white text-[15px] font-extrabold">
                  Xác nhận ({totalCartCount})
                </Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </Modal>

      {/* Modal Chọn / Sửa Phương Thức Thanh Toán */}
      <Modal visible={isPaymentModalOpen} transparent animationType="fade" statusBarTranslucent>
        <View className="flex-1 bg-[rgba(15,23,42,0.5)] justify-end">
          <TouchableOpacity
            className="absolute inset-0"
            activeOpacity={1}
            onPress={() => setIsPaymentModalOpen(false)}
          />
          <Animated.View className="bg-white rounded-t-[28px] p-5" style={{ maxHeight: '80%', transform: [{ translateY: paymentSlideAnim }] }}>
            <View className="flex-row justify-between items-center mb-4">
              <View>
                <Text className="text-[18px] font-extrabold text-textMain">
                  {editingOrder ? 'Sửa Phương Thức Thanh Toán' : 'Phương Thức Thanh Toán'}
                </Text>
                <Text className="text-[12px] text-textSecondary mt-0.5">
                  {editingOrder ? `Đơn ${editingOrder.id} • ${editingOrder.table}` : `${totalCartCount} món đã chọn`}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setIsPaymentModalOpen(false)}>
                <X size={22} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            {/* Danh sách phương thức */}
            <View className="gap-2.5 mb-4">
              {[
                {
                  id: 'Tiền mặt',
                  label: 'Tiền mặt',
                  desc: 'Thanh toán tiền mặt trực tiếp tại quầy',
                  icon: Banknote,
                  color: '#059669',
                  bgColor: '#ECFDF5',
                },
                {
                  id: 'VietQR',
                  label: 'VietQR / Chuyển khoản',
                  desc: 'Quét mã QR chuyển khoản ngân hàng 24/7',
                  icon: QrCode,
                  color: '#2563EB',
                  bgColor: '#EFF6FF',
                },
              ].map((method) => {
                const isSelected = selectedPaymentMethod === method.id;
                const IconComp = method.icon;
                return (
                  <TouchableOpacity
                    key={method.id}
                    className={`flex-row items-center p-3 rounded-[14px] border ${isSelected ? 'border-primary bg-[#F0FDF4]' : 'border-border bg-[#F8FAFC]'}`}
                    style={{ borderWidth: 1.5 }}
                    onPress={() => setSelectedPaymentMethod(method.id)}
                    activeOpacity={0.8}
                  >
                    <View className="w-11 h-11 rounded-[12px] items-center justify-center mr-3" style={{ backgroundColor: method.bgColor }}>
                      <IconComp size={22} color={method.color} strokeWidth={2.2} />
                    </View>
                    <View className="flex-1">
                      <Text className={`text-[14px] font-bold ${isSelected ? 'text-primaryDark' : 'text-textMain'}`}>
                        {method.label}
                      </Text>
                      <Text className="text-[11px] text-textSecondary mt-0.5">{method.desc}</Text>
                    </View>
                    <View
                      className={`w-[22px] h-[22px] rounded-full border-2 items-center justify-center ${isSelected ? 'bg-primary border-primary' : 'border-[#CBD5E1]'}`}
                    >
                      {isSelected && <Check size={13} color="#FFFFFF" strokeWidth={3} />}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Tóm tắt đơn */}
            <View className="bg-[#F8FAFC] rounded-[14px] p-3 border border-border mb-3">
              <View className="flex-row justify-between items-center py-0.5">
                <Text className="text-[12.5px] text-textSecondary">Bàn / Đơn:</Text>
                <Text className="text-[12.5px] font-semibold text-textMain">
                  {editingOrder ? `${editingOrder.table} (${editingOrder.id})` : 'Mang về / Tại bàn'}
                </Text>
              </View>
              <View className="flex-row justify-between items-center py-0.5">
                <Text className="text-[12.5px] text-textSecondary">Số lượng:</Text>
                <Text className="text-[12.5px] font-semibold text-textMain">{totalCartCount} món</Text>
              </View>
              <View className="flex-row justify-between items-center mt-1.5 pt-2 border-t border-border">
                <Text className="text-[13.5px] font-bold text-textMain">Tổng thanh toán:</Text>
                <Text className="text-[16px] font-black text-primary">
                  {formatCurrency(totalCartPrice)}
                </Text>
              </View>
            </View>

            <View className="pt-4 border-t border-[#F1F5F9]">
              <TouchableOpacity
                className="bg-primary rounded-full py-[15px] items-center"
                onPress={handleFinalConfirmPayment}
                activeOpacity={0.85}
              >
                <Text className="text-white text-[15px] font-extrabold">
                  Xác nhận
                </Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </Modal>

      {/* Modal Thông Báo Đặt / Sửa Thành Công */}
      <Modal visible={orderSuccessModal} transparent animationType="fade">
        <View className="flex-1 bg-[rgba(15,23,42,0.5)] justify-center items-center p-5">
          <View className="bg-white rounded-[24px] p-6 items-center w-[85%]">
            <View className="w-16 h-16 rounded-full bg-primary items-center justify-center mb-3.5">
              <Check size={36} color="#FFFFFF" strokeWidth={3} />
            </View>
            <Text className="text-[18px] font-extrabold text-textMain mb-1.5 text-center">{successMessage.title}</Text>
            <Text className="text-[13px] text-textSecondary text-center leading-[18px]">{successMessage.sub}</Text>
          </View>
        </View>
      </Modal>

      {/* Màn hình tuỳ chọn món ăn */}
      {pendingItem && (
        <Modal visible={true} animationType="slide">
          <ItemOptionsScreen
            item={pendingItem}
            onCancel={() => setPendingItem(null)}
            onConfirm={(item, selectedModifiers, note, quantity) => {
              onAddToCart(item, selectedModifiers, note, quantity);
              setPendingItem(null);
            }}
          />
        </Modal>
      )}
    </View>
  );
};
