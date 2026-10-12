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
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import {
  ArrowLeft,
  Tag,
  CheckCircle2,
  Flame,
  X,
  ImageIcon,
  Camera,
  Plus,
  Cloud,
} from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useMenuStore } from '../../data/menuStore';
import { MenuItem, ModifierGroup } from '../../types';
import { ModifierDetailScreen } from './ModifierDetailScreen';
import { PrepTimeDetailScreen } from './PrepTimeDetailScreen';
import { api } from '../../services/api';

interface MenuItemFormScreenProps {
  initialItem?: MenuItem | null;
  onBack: () => void;
  onSaved?: () => void;
}

const PRESET_IMAGES = [
  { label: 'Cà phê', url: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=300&q=80' },
  { label: 'Bạc xỉu', url: 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=300&q=80' },
  { label: 'Trà đào', url: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=300&q=80' },
  { label: 'Trà trái cây', url: 'https://images.unsplash.com/photo-1595981267035-7b04ca84a82d?w=300&q=80' },
  { label: 'Trà sữa', url: 'https://images.unsplash.com/photo-1558857563-b37d1e89f816?w=300&q=80' },
  { label: 'Bánh ngọt', url: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=300&q=80' },
  { label: 'Bánh mì', url: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=300&q=80' },
];

export const MenuItemFormScreen: React.FC<MenuItemFormScreenProps> = ({
  initialItem,
  onBack,
  onSaved,
}) => {
  const insets = useSafeAreaInsets();
  const contentPaddingBottom = Math.max(insets.bottom, 16) + 24;

  const { categories, addItem, updateItem, addCategory } = useMenuStore();

  const isEditing = !!initialItem;

  // Form State
  const [name, setName] = useState(initialItem?.name || '');
  const [price, setPrice] = useState(initialItem?.price ? initialItem.price.toString() : '');
  const [category, setCategory] = useState(
    initialItem?.category || categories.find((c) => c !== 'Tất cả') || 'Cà phê'
  );
  const [isCustomCategory, setIsCustomCategory] = useState(
    initialItem ? !categories.includes(initialItem.category) : false
  );
  const [customCategoryName, setCustomCategoryName] = useState(
    initialItem && !categories.includes(initialItem.category) ? initialItem.category : ''
  );
  const [description, setDescription] = useState(initialItem?.description || '');
  const [imageUrl, setImageUrl] = useState(initialItem?.imageUrl || PRESET_IMAGES[0].url);
  const [isPopular, setIsPopular] = useState(!!initialItem?.isPopular);
  const [isUploading, setIsUploading] = useState(false);

  // Modifier Groups State (Tuỳ chỉnh món: Đường, Đá, Size, Topping...)
  const [modifierGroups, setModifierGroups] = useState<ModifierGroup[]>(
    initialItem?.modifierGroups
      ? JSON.parse(JSON.stringify(initialItem.modifierGroups))
      : []
  );
  const [showModifierDetail, setShowModifierDetail] = useState(false);

  // Prep time - thời gian chế biến đếm ngược (phút)
  const [prepTime, setPrepTime] = useState<number>(initialItem?.prepTimeMinutes ?? 10);
  const [showPrepTimeDetail, setShowPrepTimeDetail] = useState(false);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
  };

  const parsedPrice = parseInt(price.replace(/[^0-9]/g, '') || '0', 10);

  // Quick price buttons
  const addQuickPrice = (amount: number) => {
    const current = parseInt(price.replace(/[^0-9]/g, '') || '0', 10);
    setPrice((current + amount).toString());
  };

  const uploadSelectedAsset = async (asset: ImagePicker.ImagePickerAsset) => {
    setImageUrl(asset.uri);
    setIsUploading(true);
    try {
      const uploaded = await api.uploadImage(
        asset.uri,
        asset.fileName || undefined,
        asset.mimeType || undefined
      );
      if (uploaded?.url) {
        setImageUrl(uploaded.url);
      }
    } catch (err: any) {
      console.warn('Upload image error:', err?.message);
      Alert.alert(
        'Tải ảnh lên máy chủ',
        'Không thể tải ảnh lên Cloudinary lúc này, ảnh sẽ được lưu tạm cục bộ: ' + (err?.message || '')
      );
    } finally {
      setIsUploading(false);
    }
  };

  const pickFromLibrary = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Cần quyền truy cập', 'Vui lòng cho phép truy cập thư viện ảnh để chọn ảnh món ăn.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets?.[0]?.uri) {
      await uploadSelectedAsset(result.assets[0]);
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Cần quyền camera', 'Vui lòng cho phép truy cập camera để chụp ảnh món ăn.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets?.[0]?.uri) {
      await uploadSelectedAsset(result.assets[0]);
    }
  };

  const handleSave = () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập tên món ăn.');
      return;
    }

    if (parsedPrice <= 0) {
      Alert.alert('Giá không hợp lệ', 'Vui lòng nhập giá bán lớn hơn 0đ.');
      return;
    }

    let finalCategory = category;
    if (isCustomCategory) {
      const trimmedCustom = customCategoryName.trim();
      if (!trimmedCustom) {
        Alert.alert('Thiếu danh mục', 'Vui lòng nhập tên danh mục mới.');
        return;
      }
      finalCategory = trimmedCustom;
      addCategory(trimmedCustom);
    }

    if (isEditing && initialItem) {
      updateItem(initialItem.id, {
        name: trimmedName,
        price: parsedPrice,
        category: finalCategory,
        description: description.trim() || undefined,
        imageUrl: imageUrl.trim() || PRESET_IMAGES[0].url,
        isPopular,
        modifierGroups: modifierGroups.length > 0 ? modifierGroups : undefined,
        prepTimeMinutes: prepTime,
      });
    } else {
      addItem({
        name: trimmedName,
        price: parsedPrice,
        category: finalCategory,
        description: description.trim() || undefined,
        imageUrl: imageUrl.trim() || PRESET_IMAGES[0].url,
        isPopular,
        modifierGroups: modifierGroups.length > 0 ? modifierGroups : undefined,
        prepTimeMinutes: prepTime,
      });
    }

    if (onSaved) {
      onSaved();
    } else {
      onBack();
    }
  };

  const handleBackPress = () => {
    Alert.alert(
      'Xác nhận thoát',
      'Các thông tin món ăn chưa lưu sẽ bị mất. Bạn có chắc chắn muốn thoát?',
      [
        { text: 'Tiếp tục sửa', style: 'cancel' },
        {
          text: 'Thoát',
          style: 'destructive',
          onPress: () => {
            onBack();
          },
        },
      ]
    );
  };

  if (showModifierDetail) {
    return (
      <ModifierDetailScreen
        initialGroups={modifierGroups}
        onBack={() => setShowModifierDetail(false)}
        onSave={(groups) => setModifierGroups(groups)}
      />
    );
  }

  if (showPrepTimeDetail) {
    return (
      <PrepTimeDetailScreen
        initialMinutes={prepTime}
        onBack={() => setShowPrepTimeDetail(false)}
        onSave={(m) => setPrepTime(m)}
      />
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      className="flex-1 bg-background"
    >
      {/* Header Bar */}
      <View className="bg-white px-4 pt-2.5 pb-3 border-b border-[#F1F5F9] flex-row items-center justify-between">
        <View className="flex-row items-center flex-1 mr-2.5">
          <TouchableOpacity
            className="w-9 h-9 rounded-xl bg-slate-100 items-center justify-center mr-3 border border-border"
            onPress={handleBackPress}
            activeOpacity={0.7}
          >
            <ArrowLeft size={18} color="#0F172A" />
          </TouchableOpacity>
          <View className="flex-1">
            <Text className="text-[20px] font-extrabold text-textMain">
              {isEditing ? 'Chỉnh Sửa Món Ăn' : 'Thêm Món Ăn Mới'}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          className="w-9 h-9 items-center justify-center ml-2"
          onPress={handleSave}
          activeOpacity={0.7}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Plus size={24} color="#10B981" strokeWidth={2.5} />
        </TouchableOpacity>
      </View>

      {/* Body Form */}
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 16, paddingBottom: contentPaddingBottom, gap: 16 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Tên món */}
        <View className="gap-1.5">
          <Text className="text-[13.5px] font-bold text-slate-700">
            Tên món ăn <Text className="text-rose-600">*</Text>
          </Text>
          <View className="flex-row items-center bg-white rounded-2xl border border-slate-300 px-3.5 py-2.5 shadow-sm">
            <TextInput
              className="flex-1 text-sm text-slate-900 p-0"
              placeholder="VD: Cà Phê Muối Hoàng Gia, Trà Đào..."
              placeholderTextColor="#94A3B8"
              value={name}
              onChangeText={setName}
            />
            {name.length > 0 && (
              <TouchableOpacity onPress={() => setName('')}>
                <X size={16} color="#94A3B8" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Giá bán (VND) */}
        <View className="gap-1.5">
          <View className="flex-row items-center justify-between">
            <Text className="text-[13.5px] font-bold text-slate-700">
              Giá bán (VND) <Text className="text-rose-600">*</Text>
            </Text>
            {parsedPrice > 0 && (
              <Text className="text-[13px] font-extrabold text-emerald-600">
                {formatCurrency(parsedPrice)}
              </Text>
            )}
          </View>

          <View className="flex-row items-center bg-white rounded-2xl border border-slate-300 px-3.5 py-2.5 shadow-sm">
            <Text className="text-base font-black text-emerald-600 mr-1.5">₫</Text>
            <TextInput
              className="flex-1 text-sm text-slate-900 p-0"
              placeholder="VD: 35000"
              placeholderTextColor="#94A3B8"
              keyboardType="numeric"
              value={price}
              onChangeText={setPrice}
            />
          </View>

          {/* Nút gợi ý cộng nhanh giá tiền */}
          <View className="flex-row items-center gap-2 mt-1">
            <TouchableOpacity
              className="px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200"
              onPress={() => addQuickPrice(5000)}
              activeOpacity={0.7}
            >
              <Text className="text-[11px] font-bold text-emerald-600">+5.000đ</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200"
              onPress={() => addQuickPrice(10000)}
              activeOpacity={0.7}
            >
              <Text className="text-[11px] font-bold text-emerald-600">+10.000đ</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200"
              onPress={() => addQuickPrice(20000)}
              activeOpacity={0.7}
            >
              <Text className="text-[11px] font-bold text-emerald-600">+20.000đ</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200"
              onPress={() => addQuickPrice(50000)}
              activeOpacity={0.7}
            >
              <Text className="text-[11px] font-bold text-emerald-600">+50.000đ</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Danh mục */}
        <View className="gap-1.5">
          <View className="flex-row items-center justify-between">
            <Text className="text-[13.5px] font-bold text-slate-700">
              Danh mục món <Text className="text-rose-600">*</Text>
            </Text>
            <TouchableOpacity
              onPress={() => setIsCustomCategory(!isCustomCategory)}
              activeOpacity={0.7}
            >
              <Text className="text-xs font-bold text-emerald-600">
                {isCustomCategory ? '← Chọn' : '+ Thêm'}
              </Text>
            </TouchableOpacity>
          </View>

          {isCustomCategory ? (
            <View className="flex-row items-center bg-white rounded-2xl border border-slate-300 px-3.5 py-2.5 shadow-sm">
              <Tag size={16} color="#059669" />
              <TextInput
                className="flex-1 text-sm text-slate-900 p-0 ml-1.5"
                placeholder="VD: Nước Ép Tươi, Sinh Tố, Ăn Vặt..."
                placeholderTextColor="#94A3B8"
                value={customCategoryName}
                onChangeText={setCustomCategoryName}
              />
            </View>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 8, paddingVertical: 2 }}
            >
              {categories
                .filter((c) => c !== 'Tất cả')
                .map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    className={`px-3.5 py-2 rounded-full border ${
                      category === cat ? 'bg-emerald-50 border-emerald-500' : 'bg-white border-border'
                    }`}
                    onPress={() => setCategory(cat)}
                    activeOpacity={0.75}
                  >
                    <Text
                      className={`text-[12.5px] ${
                        category === cat ? 'text-emerald-600 font-extrabold' : 'text-slate-500 font-semibold'
                      }`}
                    >
                      {cat}
                    </Text>
                  </TouchableOpacity>
                ))}
            </ScrollView>
          )}
        </View>

        {/* Tuỳ chỉnh món ăn */}
        <View className="gap-1.5">
          <View className="flex-row items-center justify-between">
            <Text className="text-[13.5px] font-bold text-slate-700">Tuỳ chỉnh món</Text>
            <TouchableOpacity onPress={() => setShowModifierDetail(true)} activeOpacity={0.7}>
              <Text className="text-xs font-bold text-emerald-600">+ Thêm</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 8, paddingVertical: 2 }}
          >
            {modifierGroups.length === 0 ? (
              <View className="px-3.5 py-1.5 rounded-full bg-slate-50 border border-dashed border-border">
                <Text className="text-xs font-semibold text-textMuted">Chưa có tuỳ chỉnh</Text>
              </View>
            ) : (
              modifierGroups.map((group) => (
                <View key={group.id} className="flex-row items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-border">
                  <Text className="text-[12.5px] font-semibold text-slate-700">{group.name}</Text>
                  <View className="bg-emerald-50 px-1.5 py-0.5 rounded-md border border-emerald-200 min-w-[22px] items-center">
                    <Text className="text-[10.5px] font-extrabold text-emerald-600">{group.options.length}</Text>
                  </View>
                </View>
              ))
            )}
          </ScrollView>
        </View>

        {/* Thời gian chế biến */}
        <View className="gap-1.5">
          <View className="flex-row items-center justify-between">
            <Text className="text-[13.5px] font-bold text-slate-700">Thời gian chế biến</Text>
            <TouchableOpacity onPress={() => setShowPrepTimeDetail(true)} activeOpacity={0.7}>
              <Text className="text-xs font-bold text-emerald-600">+ Thêm</Text>
            </TouchableOpacity>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 8, paddingVertical: 2 }}
          >
            {[5, 7, 10, 12, 15, 20, 30].map((m) => (
              <TouchableOpacity
                key={m}
                className={`px-3.5 py-2 rounded-full border ${
                  prepTime === m ? 'bg-emerald-50 border-emerald-500' : 'bg-white border-border'
                }`}
                onPress={() => setPrepTime(m)}
                activeOpacity={0.75}
              >
                <Text
                  className={`text-[12.5px] ${
                    prepTime === m ? 'text-emerald-600 font-extrabold' : 'text-slate-500 font-semibold'
                  }`}
                >
                  {m} phút
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Ảnh minh hoạ món */}
        <View className="gap-1.5">
          <View className="flex-row items-center justify-between">
            <Text className="text-[13.5px] font-bold text-slate-700">Ảnh minh hoạ</Text>
          </View>

          <View className="flex-row gap-2 mb-0.5">
            <TouchableOpacity
              className="flex-1 flex-row items-center justify-center gap-1.5 py-2 rounded-xl bg-emerald-50 border border-emerald-200"
              onPress={pickFromLibrary}
              activeOpacity={0.75}
            >
              <ImageIcon size={14} color="#059669" strokeWidth={2.2} />
              <Text className="text-[12.5px] font-bold text-emerald-600">Thư viện</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="flex-1 flex-row items-center justify-center gap-1.5 py-2 rounded-xl bg-emerald-50 border border-emerald-200"
              onPress={takePhoto}
              activeOpacity={0.75}
            >
              <Camera size={14} color="#059669" strokeWidth={2.2} />
              <Text className="text-[12.5px] font-bold text-emerald-600">Chụp ảnh</Text>
            </TouchableOpacity>
          </View>

          {isUploading && (
            <View className="flex-row items-center justify-center gap-2 py-2.5 px-3 bg-emerald-50 rounded-xl border border-emerald-200">
              <ActivityIndicator size="small" color="#059669" />
              <Text className="text-xs font-bold text-emerald-700">Đang tải ảnh lên Cloudinary...</Text>
            </View>
          )}

          {imageUrl ? (
            <View className="flex-row items-center bg-white rounded-2xl p-2 border border-emerald-200 gap-2.5 shadow-sm">
              <Image source={{ uri: imageUrl }} className="w-14 h-14 rounded-xl bg-slate-100" />
              <View className="flex-1">
                <View className="flex-row items-center gap-1.5">
                  <Text className="text-[12.5px] font-bold text-slate-900">Ảnh món ăn</Text>
                  {imageUrl.includes('cloudinary') ? (
                    <View className="flex-row items-center gap-1 bg-emerald-100 px-1.5 py-0.5 rounded-md">
                      <Cloud size={10} color="#059669" />
                      <Text className="text-[9.5px] font-bold text-emerald-700">Cloudinary</Text>
                    </View>
                  ) : imageUrl.startsWith('http') ? (
                    <View className="flex-row items-center gap-1 bg-blue-50 px-1.5 py-0.5 rounded-md">
                      <CheckCircle2 size={10} color="#2563EB" />
                      <Text className="text-[9.5px] font-bold text-blue-700">Online</Text>
                    </View>
                  ) : (
                    <View className="flex-row items-center gap-1 bg-amber-50 px-1.5 py-0.5 rounded-md">
                      <Text className="text-[9.5px] font-bold text-amber-700">Cục bộ</Text>
                    </View>
                  )}
                </View>
                <TouchableOpacity onPress={() => setImageUrl('')} activeOpacity={0.7}>
                  <Text className="text-[11.5px] font-semibold text-rose-500 mt-1">Xoá ảnh</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View className="py-4 px-3 rounded-xl bg-slate-50 border border-dashed border-border items-center">
              <Text className="text-xs text-textMuted text-center">Chưa có ảnh — bấm Thư viện hoặc Chụp ảnh</Text>
            </View>
          )}
        </View>

        {/* Mô tả món ăn */}
        <View className="gap-1.5">
          <Text className="text-[13.5px] font-bold text-slate-700">Mô tả món ăn (Tuỳ chọn)</Text>
          <View className="flex-row items-start bg-white rounded-2xl border border-slate-300 px-3.5 pt-2.5 min-h-[80px] shadow-sm">
            <TextInput
              className="flex-1 text-sm text-slate-900 p-0 min-h-[60px]"
              placeholder="VD: Cà phê phin truyền thống thơm ngon kết hợp cùng sữa đặc béo ngậy..."
              placeholderTextColor="#94A3B8"
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              value={description}
              onChangeText={setDescription}
            />
          </View>
        </View>

        {/* Nổi bật */}
        <View className="flex-row items-center justify-between bg-orange-50 rounded-2xl p-3.5 border border-orange-200 shadow-sm">
          <View className="flex-row items-center gap-1.5">
            <Flame size={17} color="#EA580C" />
            <Text className="text-[13.5px] font-bold text-orange-700">Nổi bật</Text>
          </View>
          <Switch
            value={isPopular}
            onValueChange={setIsPopular}
            trackColor={{ false: '#E2E8F0', true: '#FDBA74' }}
            thumbColor={isPopular ? '#EA580C' : '#94A3B8'}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default MenuItemFormScreen;
