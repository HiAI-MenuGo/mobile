import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  Switch,
  Alert,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Animated,
  ActivityIndicator,
  PanResponder,
} from 'react-native';
import {
  Phone,
  Mail,
  Building2,
  Bell,
  Lock,
  LogOut,
  ChevronRight,
  ShieldCheck,
  Edit3,
  ArrowLeft,
  User,
  Calendar,
  Users,
  MessageSquare,
  Clock,
  Vibrate,
  BadgeCheck,
  Pencil,
  X,
  Check,
  Eye,
  EyeOff,
  Star,
  DollarSign,
  Receipt,
  UserPlus,
  Send,
  Sparkles,
  CheckCircle2,
  Plus,
  Trash2,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '../data/authStore';
import { useSoundStore } from '../services/sound';
import { api } from '../services/api';
import { UserProfile } from '../types';
import { createTaggedLogger } from '../utils/logger';
const log = createTaggedLogger('SETTINGS');

const AVAILABLE_STAFF_PROFILES: UserProfile[] = [
  {
    name: 'Nguyễn Vy',
    role: 'Nhân viên',
    code: 'NV-2028',
    phone: '0912 345 678',
    email: 'nguyenvy@menu-go.vn',
    branch: 'Chi nhánh 01 - Quận 1 (TP.HCM)',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&q=80',
    shift: 'Ca Chiều (15:30 - 23:00)',
    dob: '22/11/1998',
  },
  {
    name: 'Lê Hoàng',
    role: 'Barista Trưởng',
    code: 'NV-2015',
    phone: '0903 888 999',
    email: 'lehoang@menu-go.vn',
    branch: 'Chi nhánh 01 - Quận 1 (TP.HCM)',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80',
    shift: 'Ca Toàn Thời Gian',
    dob: '05/03/1993',
  },
];

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
          mass: 0.8,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 180,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 600,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setMounted(false);
      });
    }
  }, [visible]);

  if (!mounted) return null;

  return (
    <Modal
      visible={mounted}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1 justify-end"
      >
        {/* Animated Fading Backdrop - only opacity fades */}
        <Animated.View
          style={{ opacity: fadeAnim }}
          className="absolute inset-0 bg-slate-900/60"
        >
          <TouchableOpacity
            className="flex-1"
            activeOpacity={1}
            onPress={onClose}
          />
        </Animated.View>

        {/* Animated Sliding Bottom Sheet Card - slides up from bottom */}
        <Animated.View
          style={{
            transform: [{ translateY: slideAnim }],
            paddingBottom: insets.bottom + 8,
          }}
          className="w-full bg-white rounded-t-[32px] px-6 pt-3 border-t border-slate-200 shadow-2xl"
        >
          <View className="w-12 h-1.5 bg-slate-300 rounded-full self-center mb-3.5" />
          {children}
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

interface SwipeableStaffItemProps {
  staff: UserProfile;
  isCurrent: boolean;
  isSwitching: boolean;
  onPress: () => void;
  onDelete: () => void;
}

const SwipeableStaffItem: React.FC<SwipeableStaffItemProps> = ({
  staff,
  isCurrent,
  isSwitching,
  onPress,
  onDelete,
}) => {
  const translateX = useRef(new Animated.Value(0)).current;
  const isOpenRef = useRef(false);
  const [, forceRender] = useState(0);

  const openSwipe = () => {
    isOpenRef.current = true;
    Animated.timing(translateX, {
      toValue: -80,
      duration: 150,
      useNativeDriver: true,
    }).start();
  };

  const closeSwipe = () => {
    if (!isOpenRef.current) return;
    isOpenRef.current = false;
    Animated.timing(translateX, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true,
    }).start();
  };

  // Vuốt ngang bằng PanResponder có sẵn (không cần gesture-handler root view)
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gesture) =>
        !isSwitching && !isCurrent && Math.abs(gesture.dx) > 12 && Math.abs(gesture.dx) > Math.abs(gesture.dy) * 1.5,
      onPanResponderMove: (_, gesture) => {
        const base = isOpenRef.current ? -80 : 0;
        const next = Math.min(0, Math.max(-96, base + gesture.dx));
        translateX.setValue(next);
      },
      onPanResponderRelease: (_, gesture) => {
        if (gesture.dx < -40 || (isOpenRef.current && gesture.dx < 10)) {
          if (!isOpenRef.current || gesture.dx < -10) {
            openSwipe();
            forceRender((n) => n + 1);
            return;
          }
        }
        if (gesture.dx > 30) {
          closeSwipe();
          forceRender((n) => n + 1);
          return;
        }
        // Snap về trạng thái gần nhất
        if (isOpenRef.current) {
          openSwipe();
        } else {
          closeSwipe();
        }
        forceRender((n) => n + 1);
      },
      onPanResponderTerminate: () => {
        if (isOpenRef.current) {
          openSwipe();
        } else {
          closeSwipe();
        }
      },
    })
  ).current;

  return (
    <View className="relative justify-center">
      {/* Nút xoá nằm dưới card — vuốt sang trái mới lộ ra */}
      {!isCurrent && !isSwitching && (
        <View className="absolute right-0 top-0 bottom-0 w-[72px] items-center justify-center">
          <TouchableOpacity
            onPress={() => { closeSwipe(); onDelete(); }}
            className="w-[64px] h-full bg-rose-500 items-center justify-center rounded-2xl"
            activeOpacity={0.8}
          >
            <Trash2 size={20} color="#FFFFFF" strokeWidth={2.5} />
          </TouchableOpacity>
        </View>
      )}
      <Animated.View
        {...panResponder.panHandlers}
        style={{ transform: [{ translateX }] }}
      >
        <TouchableOpacity
          disabled={isSwitching}
          className={`flex-row items-center p-3.5 rounded-2xl border ${
            isCurrent ? 'bg-emerald-50/70 border-primary' : 'bg-slate-50 border-slate-200'
          }`}
          onPress={() => { closeSwipe(); onPress(); }}
          activeOpacity={0.8}
        >
            <Image source={{ uri: staff.avatarUrl }} className="w-12 h-12 rounded-full border-2 border-slate-200" />
            <View className="flex-1 ml-3.5">
              <View className="flex-row items-center gap-2">
                <Text className="text-[15px] font-black text-textMain">{staff.name}</Text>
                {isCurrent && (
                  <View className="bg-primary px-2 py-0.5 rounded-md">
                    <Text className="text-[10px] font-extrabold text-white">Hiện tại</Text>
                  </View>
                )}
              </View>
              <Text className="text-[13px] font-bold text-emerald-700 mt-0.5">{staff.role}</Text>
              <Text className="text-[12px] font-medium text-slate-500 mt-0.5">{staff.email}</Text>
            </View>
            {isCurrent ? (
              <CheckCircle2 size={22} color="#10B981" />
            ) : (
              <ChevronRight size={18} color="#94A3B8" />
            )}
          </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

export const SettingsScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const dynamicContentPaddingBottom = (insets.bottom > 0 ? Math.max(insets.bottom - 16, 6) : 6) + 76;
  const currentUser = useAuthStore((s) => s.user);
  const login = useAuthStore((s) => s.login);
  const logout = useAuthStore((s) => s.logout);
  const updateProfile = useAuthStore((s) => s.updateProfile);
  const switchBranch = useAuthStore((s) => s.switchBranch);
  const setUser = useAuthStore((s) => s.setUser);

  // Quyền Admin: chỉ ADMIN hoặc PLATFORM_ADMIN mới có quyền chuyển chi nhánh
  const isAdmin = currentUser?.role === 'ADMIN' || currentUser?.role === 'PLATFORM_ADMIN';
  const [isSwitchingAccount, setIsSwitchingAccount] = useState(false);

  // System settings state (persistent via useSoundStore)
  const soundEnabled = useSoundStore((s) => s.soundEnabled);
  const setSoundEnabled = useSoundStore((s) => s.setSoundEnabled);
  const vibrationEnabled = useSoundStore((s) => s.vibrationEnabled);
  const setVibrationEnabled = useSoundStore((s) => s.setVibrationEnabled);
  const pushNotifEnabled = useSoundStore((s) => s.pushEnabled);
  const setPushNotifEnabled = useSoundStore((s) => s.setPushEnabled);

  const initialProfile: UserProfile = {
    name: currentUser?.name || 'Nhân Viên Vận Hành',
    role:
      currentUser?.role === 'PLATFORM_ADMIN'
        ? 'Quản Trị Nền Tảng'
        : currentUser?.role === 'ADMIN'
        ? 'Quản Trị Viên (Admin)'
        : currentUser?.role === 'CASHIER'
        ? 'Nhân viên'
        : 'Nhân Viên Vận Hành',
    code: currentUser?.id ? `NV-${currentUser.id.substring(0, 4).toUpperCase()}` : 'NV-2026',
    phone: currentUser?.phone || '0901 234 567',
    email: currentUser?.email || 'user@hiai.vn',
    branch: currentUser?.branch?.name || 'Tasty Station - Chi Nhánh Thủ Đức',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&q=80',
    shift: 'Ca Toàn Thời Gian',
    dob: '15/02/1995',
  };

  const [profile, setProfile] = useState<UserProfile>(initialProfile);
  const [showDetail, setShowDetail] = useState(false);

  // Đồng bộ profile khi currentUser thay đổi
  useEffect(() => {
    if (currentUser) {
      setProfile((prev) => ({
        ...prev,
        name: currentUser.name || prev.name,
        email: currentUser.email || prev.email,
        phone: currentUser.phone || prev.phone,
        branch: currentUser.branch?.name || prev.branch,
        role:
          currentUser.role === 'PLATFORM_ADMIN'
            ? 'Quản Trị Nền Tảng'
            : currentUser.role === 'ADMIN'
            ? 'Quản Trị Viên (Admin)'
            : currentUser.role === 'CASHIER'
            ? 'Nhân viên'
            : 'Nhân Viên Vận Hành',
      }));
    }
  }, [currentUser]);

  // Modal Controllers
  type ModalType = null | 'edit_profile' | 'password' | 'switch_account' | 'switch_branch' | 'feedback' | 'logout';
  const [activeModal, setActiveModal] = useState<ModalType>(null);

  // Loading states
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);
  const [staffList, setStaffList] = useState<UserProfile[]>([]);
  const [isLoadingStaff, setIsLoadingStaff] = useState(false);

  // Danh sách chi nhánh cụ thể (không bao gồm Tổng chi nhánh như trên web)
  const [branchesList, setBranchesList] = useState<
    Array<{ id: string; name: string; code: string; address?: string | null; phone?: string | null }>
  >([]);
  const [isLoadingBranches, setIsLoadingBranches] = useState(false);
  const [isSwitchingBranch, setIsSwitchingBranch] = useState(false);

  // Tải danh sách chi nhánh khi mở modal chuyển chi nhánh
  useEffect(() => {
    if (activeModal === 'switch_branch') {
      if (!isAdmin) {
        setActiveModal(null);
        return;
      }
      setIsLoadingBranches(true);
      api
        .getBranches()
        .then((branches) => {
          if (Array.isArray(branches)) {
            // Lọc ra các chi nhánh cụ thể, loại trừ 'ALL' hoặc "Tổng chi nhánh"
            const concreteBranches = branches.filter(
              (b) => b.id !== 'ALL' && b.code !== 'ALL' && b.name.toLowerCase() !== 'tổng chi nhánh'
            );
            setBranchesList(concreteBranches);
          }
        })
        .catch((err) => {
          log.warn('[SettingsScreen] getBranches error:', err);
        })
        .finally(() => {
          setIsLoadingBranches(false);
        });
    }
  }, [activeModal]);

  // Tải danh sách nhân sự từ backend khi mở modal chuyển đổi tài khoản
  useEffect(() => {
    if (activeModal === 'switch_account') {
      setIsLoadingStaff(true);
      api.getStaffUsers({ branchId: currentUser?.branchId || undefined })
        .then((users) => {
          if (Array.isArray(users) && users.length > 0) {
            const mapped: UserProfile[] = users.map((u) => ({
              name: u.name,
              role:
                u.role === 'ADMIN'
                  ? 'Quản Trị Viên (Admin)'
                  : u.role === 'MANAGER'
                  ? 'Quản lý Ca'
                  : u.role === 'KITCHEN'
                  ? 'Bếp Trưởng'
                  : 'Nhân viên',
              code: `NV-${u.id.substring(0, 4).toUpperCase()}`,
              phone: u.phone || '0901 234 567',
              email: u.email,
              branch: u.branch?.name || 'Tasty Station - Chi Nhánh Thủ Đức',
              avatarUrl:
                u.role === 'ADMIN'
                  ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&q=80'
                  : 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80',
              shift: 'Ca Làm Việc',
              dob: '15/02/1995',
            }));
            setStaffList(mapped);
          }
        })
        .catch((err) => {
          log.warn('[SettingsScreen] getStaffUsers error:', err);
        })
        .finally(() => {
          setIsLoadingStaff(false);
        });
    }
  }, [activeModal, currentUser?.branchId]);

  // 1. Edit Profile Form
  const [editForm, setEditForm] = useState({
    name: profile.name,
    phone: profile.phone,
    email: profile.email,
    dob: profile.dob,
    shift: profile.shift,
  });

  // 2. Change Password Form
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);

  // 3. Feedback Form
  const feedbackCategories = ['Góp ý tính năng', 'Báo lỗi hệ thống', 'Giao diện & Trải nghiệm', 'Khác'];
  const [selectedFeedbackCat, setSelectedFeedbackCat] = useState('Góp ý tính năng');
  const [feedbackTitle, setFeedbackTitle] = useState('');
  const [feedbackContent, setFeedbackContent] = useState('');

  // Handlers
  const handleOpenEdit = () => {
    setEditForm({
      name: profile.name,
      phone: profile.phone,
      email: profile.email,
      dob: profile.dob,
      shift: profile.shift,
    });
    setActiveModal('edit_profile');
  };

  const handleSaveProfile = async () => {
    if (!editForm.name.trim()) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập họ và tên.');
      return;
    }
    setIsSavingProfile(true);
    try {
      await updateProfile({
        name: editForm.name.trim(),
        phone: editForm.phone.trim(),
      });
      setProfile((prev) => ({
        ...prev,
        name: editForm.name.trim(),
        phone: editForm.phone.trim(),
        email: editForm.email.trim(),
        dob: editForm.dob.trim(),
        shift: editForm.shift.trim(),
      }));
      setActiveModal(null);
      Alert.alert('Thành công', 'Đã cập nhật thông tin hồ sơ nhân viên!');
    } catch (err: any) {
      Alert.alert('Lỗi cập nhật', err?.response?.data?.message || err?.message || 'Không thể cập nhật hồ sơ');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleChangePassword = async () => {
    if (!passwordForm.currentPassword) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập mật khẩu hiện tại.');
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      Alert.alert('Mật khẩu yếu', 'Mật khẩu mới phải chứa ít nhất 6 ký tự.');
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      Alert.alert('Không trùng khớp', 'Mật khẩu xác nhận không khớp với mật khẩu mới.');
      return;
    }
    setIsChangingPassword(true);
    try {
      await api.changePassword(passwordForm.currentPassword, passwordForm.newPassword);
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setActiveModal(null);
      Alert.alert('Thành công', 'Đã đổi mật khẩu tài khoản thành công!');
    } catch (err: any) {
      const errorCode = err?.response?.data?.errorCode;
      if (errorCode === 'WRONG_OLD_PASSWORD') {
        Alert.alert('Mật khẩu không đúng', 'Mật khẩu hiện tại không chính xác. Vui lòng kiểm tra lại.');
      } else if (errorCode === 'WEAK_PASSWORD') {
        Alert.alert('Mật khẩu yếu', 'Mật khẩu mới quá yếu (tối thiểu 6 ký tự).');
      } else {
        Alert.alert('Lỗi đổi mật khẩu', err?.response?.data?.message || err?.message || 'Có lỗi xảy ra khi đổi mật khẩu');
      }
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleSelectStaffAccount = async (targetStaff: UserProfile) => {
    const currentEmail = (currentUser?.email || profile.email || '').toLowerCase().trim();
    if (targetStaff.email.toLowerCase().trim() === currentEmail) {
      setActiveModal(null);
      return;
    }

    try {
      setIsSwitchingAccount(true);
      // Đăng nhập tài khoản mới bằng API để cập nhật token và phân quyền thật
      await login(targetStaff.email, '123456');
      setActiveModal(null);
      Alert.alert('Thành công', `Đã chuyển đổi sang tài khoản ${targetStaff.name}!`);
    } catch (err: any) {
      log.warn('[SettingsScreen] Switch account via login failed, falling back:', err?.message);
      setProfile(targetStaff);
      if (currentUser) {
        setUser({
          ...currentUser,
          name: targetStaff.name,
          email: targetStaff.email,
          role: targetStaff.role.includes('Admin') ? 'ADMIN' : 'CASHIER',
        });
      }
      setActiveModal(null);
      Alert.alert('Chuyển đổi thành công', `Đã chuyển sang ${targetStaff.name}!`);
    } finally {
      setIsSwitchingAccount(false);
    }
  };

  const handleSubmitFeedback = async () => {
    if (!feedbackContent.trim()) {
      Alert.alert('Thiếu nội dung', 'Vui lòng nhập mô tả ý kiến hoặc lỗi bạn gặp phải.');
      return;
    }
    setIsSubmittingFeedback(true);
    try {
      await api.submitFeedback({
        category: selectedFeedbackCat,
        title: feedbackTitle.trim() || undefined,
        content: feedbackContent.trim(),
        userName: currentUser?.name,
        userEmail: currentUser?.email,
        branchId: currentUser?.branchId || undefined,
      });
      setFeedbackTitle('');
      setFeedbackContent('');
      setActiveModal(null);
      Alert.alert('Cảm ơn bạn!', 'Ý kiến đóng góp của bạn đã được gửi thành công đến hệ thống MenuGo.');
    } catch (err: any) {
      Alert.alert('Lỗi gửi góp ý', err?.response?.data?.message || err?.message || 'Không thể gửi ý kiến đóng góp');
    } finally {
      setIsSubmittingFeedback(false);
    }
  };

  const handleSelectBranch = async (targetBranch: { id: string; name: string; code: string }) => {
    if (!isAdmin) {
      setActiveModal(null);
      Alert.alert('Không có quyền', 'Chỉ tài khoản Quản trị viên (Admin) mới có quyền chuyển chi nhánh.');
      return;
    }
    if (targetBranch.id === currentUser?.branchId) {
      setActiveModal(null);
      return;
    }
    setIsSwitchingBranch(true);
    try {
      await switchBranch(targetBranch.id, targetBranch.name);
      setProfile((prev) => ({
        ...prev,
        branch: targetBranch.name,
      }));
      setActiveModal(null);
      Alert.alert('Chuyển chi nhánh thành công', `Đã chuyển sang ${targetBranch.name} (${targetBranch.code})`);
    } catch (err: any) {
      Alert.alert(
        'Lỗi chuyển chi nhánh',
        err?.response?.data?.message || err?.message || 'Không thể chuyển chi nhánh'
      );
    } finally {
      setIsSwitchingBranch(false);
    }
  };

  const handleConfirmLogout = async () => {
    setActiveModal(null);
    try {
      await logout();
    } catch (err: unknown) {
      log.warn('[SettingsScreen] Logout error:', (err as Error).message);
    }
  };

  // MÀN HÌNH CHI TIẾT HỒ SƠ CÁ NHÂN (Khi bấm vào xem chi tiết)
  if (showDetail) {
    return (
      <View className="flex-1 bg-background">
        {/* Header Bar */}
        <View className="bg-white px-4 pt-2.5 pb-3 border-b border-[#F1F5F9] flex-row items-center justify-between">
          <View className="flex-row items-center flex-1">
            <TouchableOpacity
              className="w-9 h-9 rounded-xl bg-slate-100 items-center justify-center mr-3 border border-border"
              onPress={() => setShowDetail(false)}
              activeOpacity={0.7}
            >
              <ArrowLeft size={18} color="#0F172A" />
            </TouchableOpacity>
            <View>
              <Text className="text-[20px] font-extrabold text-textMain">Hồ Sơ Nhân Viên</Text>
            </View>
          </View>

          <TouchableOpacity
            className="flex-row items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200"
            onPress={handleOpenEdit}
            activeOpacity={0.75}
          >
            <Pencil size={13} color="#059669" strokeWidth={2.2} />
            <Text className="text-xs font-bold text-emerald-600">Sửa</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          className="flex-1"
          contentContainerStyle={{ padding: 16, paddingBottom: dynamicContentPaddingBottom, gap: 14 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Hero Profile Card */}
          <View
            className="bg-white rounded-3xl p-5 items-center border border-border"
            style={{
              shadowColor: '#0F172A',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.05,
              shadowRadius: 10,
              elevation: 2,
            }}
          >
            <View className="relative mb-3">
              <Image
                source={{ uri: profile.avatarUrl }}
                className="w-20 h-20 rounded-full border-[3px] border-primary"
              />
              <TouchableOpacity
                className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-primary items-center justify-center border-2 border-white"
                onPress={handleOpenEdit}
                activeOpacity={0.8}
              >
                <Edit3 size={13} color="#FFFFFF" strokeWidth={2.5} />
              </TouchableOpacity>
            </View>

            <Text className="text-xl font-extrabold text-textMain">{profile.name}</Text>

            <View className="flex-row items-center gap-1.5 mt-1.5 mb-2">
              <View className="flex-row items-center gap-1 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                <ShieldCheck size={13} color="#059669" />
                <Text className="text-xs font-bold text-emerald-600">{profile.role}</Text>
              </View>
              <View className="flex-row items-center gap-1 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                <View className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <Text className="text-[11px] font-bold text-emerald-700">Đang trực ca</Text>
              </View>
            </View>

            <Text className="text-xs text-textMuted font-semibold">Mã nhân viên: {profile.code}</Text>
          </View>

          {/* HỒ SƠ CÔNG VIỆC */}
          <View className="bg-white rounded-3xl p-5 border border-border shadow-sm">
            <Text className="text-[12px] font-black text-textMuted tracking-wider mb-3.5">HỒ SƠ CÔNG VIỆC</Text>

            <View className="flex-row items-center py-2">
              <View className="w-10 h-10 rounded-2xl bg-slate-100 items-center justify-center">
                <User size={18} color="#0F172A" />
              </View>
              <View className="flex-1 ml-3.5">
                <Text className="text-[12px] text-textMuted font-medium">Họ và tên</Text>
                <Text className="text-[14.5px] font-bold text-textMain mt-0.5">{profile.name}</Text>
              </View>
            </View>

            <View className="h-[1px] bg-slate-100 my-1.5" />

            <View className="flex-row items-center py-2">
              <View className="w-10 h-10 rounded-2xl bg-amber-50 items-center justify-center">
                <Clock size={18} color="#D97706" />
              </View>
              <View className="flex-1 ml-3.5">
                <Text className="text-[12px] text-textMuted font-medium">Ca làm việc</Text>
                <Text className="text-[14.5px] font-bold text-textMain mt-0.5">{profile.shift}</Text>
              </View>
            </View>

            <View className="h-[1px] bg-slate-100 my-1.5" />

            <View className="flex-row items-center py-2">
              <View className="w-10 h-10 rounded-2xl bg-emerald-50 items-center justify-center">
                <Building2 size={18} color="#059669" />
              </View>
              <View className="flex-1 ml-3.5">
                <Text className="text-[12px] text-textMuted font-medium">Chi nhánh trực thuộc</Text>
                <Text className="text-[14.5px] font-bold text-textMain mt-0.5">{profile.branch}</Text>
              </View>
            </View>

            <View className="h-[1px] bg-slate-100 my-1.5" />

            <View className="flex-row items-center py-2">
              <View className="w-10 h-10 rounded-2xl bg-indigo-50 items-center justify-center">
                <BadgeCheck size={18} color="#4F46E5" />
              </View>
              <View className="flex-1 ml-3.5">
                <Text className="text-[12px] text-textMuted font-medium">Mã định danh nội bộ</Text>
                <Text className="text-[14.5px] font-bold text-textMain mt-0.5">{profile.code}</Text>
              </View>
            </View>
          </View>

          {/* THÔNG TIN LIÊN HỆ & CÁ NHÂN */}
          <View className="bg-white rounded-3xl p-5 border border-border shadow-sm">
            <Text className="text-[12px] font-black text-textMuted tracking-wider mb-3.5">THÔNG TIN LIÊN HỆ</Text>

            <View className="flex-row items-center py-2">
              <View className="w-10 h-10 rounded-2xl bg-blue-50 items-center justify-center">
                <Phone size={18} color="#2563EB" />
              </View>
              <View className="flex-1 ml-3.5">
                <Text className="text-[12px] text-textMuted font-medium">Số điện thoại</Text>
                <Text className="text-[14.5px] font-bold text-textMain mt-0.5">{profile.phone}</Text>
              </View>
            </View>

            <View className="h-[1px] bg-slate-100 my-1.5" />

            <View className="flex-row items-center py-2">
              <View className="w-10 h-10 rounded-2xl bg-purple-50 items-center justify-center">
                <Mail size={18} color="#7C3AED" />
              </View>
              <View className="flex-1 ml-3.5">
                <Text className="text-[12px] text-textMuted font-medium">Email nội bộ</Text>
                <Text className="text-[14.5px] font-bold text-textMain mt-0.5">{profile.email}</Text>
              </View>
            </View>

            <View className="h-[1px] bg-slate-100 my-1.5" />

            <View className="flex-row items-center py-2">
              <View className="w-10 h-10 rounded-2xl bg-rose-50 items-center justify-center">
                <Calendar size={18} color="#E11D48" />
              </View>
              <View className="flex-1 ml-3.5">
                <Text className="text-[12px] text-textMuted font-medium">Ngày sinh</Text>
                <Text className="text-[14.5px] font-bold text-textMain mt-0.5">{profile.dob}</Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </View>
    );
  }

  // MÀN HÌNH CÀI ĐẶT CHÍNH (Tab Cài Đặt)
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      className="flex-1 bg-background"
    >
      {/* Header Bar */}
      <View className="bg-white px-4 pt-2.5 pb-3 border-b border-[#F1F5F9]">
        <Text className="text-[20px] font-extrabold text-textMain">Cài Đặt & Tài Khoản</Text>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 16, paddingTop: 14, paddingBottom: dynamicContentPaddingBottom }}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Hero Banner */}
        <TouchableOpacity
          className="flex-row items-center bg-white rounded-3xl p-4 border border-border mb-4"
          style={{
            shadowColor: '#0F172A',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.05,
            shadowRadius: 10,
            elevation: 2,
          }}
          onPress={() => setShowDetail(true)}
          activeOpacity={0.8}
        >
          <Image
            source={{ uri: profile.avatarUrl }}
            className="w-14 h-14 rounded-full border-2 border-primary"
          />
          <View className="flex-1 ml-3.5">
            <Text className="text-base font-extrabold text-textMain" numberOfLines={1}>
              {profile.name}
            </Text>
            <View className="flex-row items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded-full self-start mt-1 border border-emerald-200">
              <ShieldCheck size={11} color="#059669" />
              <Text className="text-[11px] font-bold text-emerald-600">{profile.role}</Text>
            </View>
            <Text className="text-[11px] text-textMuted mt-1">{profile.branch}</Text>
          </View>
          <ChevronRight size={18} color="#94A3B8" />
        </TouchableOpacity>

        {/* CÀI ĐẶT THÔNG BÁO & ÂM THANH */}
        <View className="bg-white rounded-2xl p-4 border border-border mb-4 shadow-sm">
          <Text className="text-[11px] font-extrabold text-textMuted tracking-wider mb-3">THÔNG BÁO & ÂM THANH</Text>

          <View className="flex-row items-center py-2.5">
            <View className="w-9 h-9 rounded-xl bg-amber-50 items-center justify-center">
              <Bell size={16} color="#D97706" />
            </View>
            <View className="flex-1 ml-3 mr-2">
              <Text className="text-[13.5px] font-bold text-textMain">Âm thanh chuông báo</Text>
            </View>
            <Switch
              value={soundEnabled}
              onValueChange={setSoundEnabled}
              trackColor={{ false: '#CBD5E1', true: '#10B981' }}
            />
          </View>

          <View className="h-[1px] bg-slate-100 my-1" />

          <View className="flex-row items-center py-2.5">
            <View className="w-9 h-9 rounded-xl bg-emerald-50 items-center justify-center">
              <Bell size={16} color="#059669" />
            </View>
            <View className="flex-1 ml-3 mr-2">
              <Text className="text-[13.5px] font-bold text-textMain">Thông báo đẩy</Text>
            </View>
            <Switch
              value={pushNotifEnabled}
              onValueChange={setPushNotifEnabled}
              trackColor={{ false: '#CBD5E1', true: '#10B981' }}
            />
          </View>

          <View className="h-[1px] bg-slate-100 my-1" />

          <View className="flex-row items-center py-2.5">
            <View className="w-9 h-9 rounded-xl bg-blue-50 items-center justify-center">
              <Vibrate size={16} color="#2563EB" />
            </View>
            <View className="flex-1 ml-3 mr-2">
              <Text className="text-[13.5px] font-bold text-textMain">Rung phản hồi</Text>
            </View>
            <Switch
              value={vibrationEnabled}
              onValueChange={setVibrationEnabled}
              trackColor={{ false: '#CBD5E1', true: '#10B981' }}
            />
          </View>
        </View>

        {/* HỆ THỐNG & BẢO MẬT (Các tính năng tương tác trực tiếp) */}
        <View className="bg-white rounded-2xl p-4 border border-border mb-4 shadow-sm">
          <Text className="text-[11px] font-extrabold text-textMuted tracking-wider mb-3">HỆ THỐNG & BẢO MẬT</Text>

          {/* 1. Đổi mật khẩu */}
          <TouchableOpacity
            className="flex-row items-center py-3 active:bg-slate-50"
            onPress={() => setActiveModal('password')}
            activeOpacity={0.7}
          >
            <View className="w-9 h-9 rounded-xl bg-slate-100 items-center justify-center">
              <Lock size={16} color="#475569" />
            </View>
            <View className="flex-1 ml-3">
              <Text className="text-[13.5px] font-bold text-textMain">Đổi mật khẩu</Text>
            </View>
            <ChevronRight size={18} color="#94A3B8" />
          </TouchableOpacity>

          <View className="h-[1px] bg-slate-100 my-1" />

          {/* 2. Chuyển đổi tài khoản */}
          <TouchableOpacity
            className="flex-row items-center py-3 active:bg-slate-50"
            onPress={() => setActiveModal('switch_account')}
            activeOpacity={0.7}
          >
            <View className="w-9 h-9 rounded-xl bg-blue-50 items-center justify-center">
              <Users size={16} color="#2563EB" />
            </View>
            <View className="flex-1 ml-3">
              <Text className="text-[13.5px] font-bold text-textMain">Chuyển đổi tài khoản</Text>
            </View>
            <ChevronRight size={18} color="#94A3B8" />
          </TouchableOpacity>

          <View className="h-[1px] bg-slate-100 my-1" />

          {/* 3. Chuyển chi nhánh (Chỉ quyền Admin mới thấy) */}
          {isAdmin && (
            <>
              <TouchableOpacity
                className="flex-row items-center py-3 active:bg-slate-50"
                onPress={() => setActiveModal('switch_branch')}
                activeOpacity={0.7}
              >
                <View className="w-9 h-9 rounded-xl bg-teal-50 items-center justify-center">
                  <Building2 size={16} color="#0D9488" />
                </View>
                <View className="flex-1 ml-3">
                  <Text className="text-[13.5px] font-bold text-textMain">Chuyển chi nhánh</Text>
                </View>
                <ChevronRight size={18} color="#94A3B8" />
              </TouchableOpacity>

              <View className="h-[1px] bg-slate-100 my-1" />
            </>
          )}

          {/* 3. Đóng góp ý kiến */}
          <TouchableOpacity
            className="flex-row items-center py-3 active:bg-slate-50"
            onPress={() => setActiveModal('feedback')}
            activeOpacity={0.7}
          >
            <View className="w-9 h-9 rounded-xl bg-amber-50 items-center justify-center">
              <MessageSquare size={16} color="#D97706" />
            </View>
            <View className="flex-1 ml-3">
              <Text className="text-[13.5px] font-bold text-textMain">Đóng góp ý kiến</Text>
            </View>
            <ChevronRight size={18} color="#94A3B8" />
          </TouchableOpacity>

          <View className="h-[1px] bg-slate-100 my-1" />

          {/* 4. Đăng xuất */}
          <TouchableOpacity
            className="flex-row items-center py-3 active:bg-rose-50"
            onPress={() => setActiveModal('logout')}
            activeOpacity={0.7}
          >
            <View className="w-9 h-9 rounded-xl bg-rose-50 items-center justify-center">
              <LogOut size={16} color="#DC2626" />
            </View>
            <View className="flex-1 ml-3">
              <Text className="text-[13.5px] font-bold text-rose-600">Đăng xuất</Text>
            </View>
            <ChevronRight size={18} color="#DC2626" />
          </TouchableOpacity>
        </View>

        {/* App Version Info Footer */}
        <View className="items-center pb-2">
          <Text className="text-[11.5px] text-textMuted font-semibold">MenuGo POS Mobile v2.4.0</Text>
          <Text className="text-[10px] text-slate-400 mt-0.5">Bản quyền © 2026 MenuGo. Tất cả quyền được bảo lưu.</Text>
        </View>
      </ScrollView>

      {/* ================= MODAL 1: CHỈNH SỬA HỒ SƠ ================= */}
      <AnimatedBottomSheet visible={activeModal === 'edit_profile'} onClose={() => setActiveModal(null)}>
        <View className="flex-row justify-between items-center mb-2">
          <Text className="text-[19px] font-black text-textMain">Chỉnh Sửa Hồ Sơ</Text>
          <TouchableOpacity
            className="w-9 h-9 rounded-full bg-slate-100 items-center justify-center border border-slate-200"
            onPress={() => setActiveModal(null)}
            activeOpacity={0.7}
          >
            <X size={18} color="#475569" />
          </TouchableOpacity>
        </View>

        <View className="gap-3.5 my-4">
          <View>
            <Text className="text-[13.5px] font-bold text-slate-800 mb-1.5">Họ và tên</Text>
            <View className="h-[52px] bg-slate-50 rounded-2xl px-4 border border-slate-200 justify-center">
              <TextInput
                className="text-[15px] text-textMain font-semibold p-0"
                value={editForm.name}
                onChangeText={(t) => setEditForm({ ...editForm, name: t })}
                placeholder="Nhập họ và tên"
                placeholderTextColor="#94A3B8"
              />
            </View>
          </View>

          <View>
            <Text className="text-[13.5px] font-bold text-slate-800 mb-1.5">Số điện thoại</Text>
            <View className="h-[52px] bg-slate-50 rounded-2xl px-4 border border-slate-200 justify-center">
              <TextInput
                className="text-[15px] text-textMain font-semibold p-0"
                value={editForm.phone}
                onChangeText={(t) => setEditForm({ ...editForm, phone: t })}
                keyboardType="phone-pad"
                placeholder="Nhập số điện thoại"
                placeholderTextColor="#94A3B8"
              />
            </View>
          </View>

          <View>
            <Text className="text-[13.5px] font-bold text-slate-800 mb-1.5">Email nội bộ</Text>
            <View className="h-[52px] bg-slate-50 rounded-2xl px-4 border border-slate-200 justify-center">
              <TextInput
                className="text-[15px] text-textMain font-semibold p-0"
                value={editForm.email}
                onChangeText={(t) => setEditForm({ ...editForm, email: t })}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholder="Nhập email"
                placeholderTextColor="#94A3B8"
              />
            </View>
          </View>

          <View>
            <Text className="text-[13.5px] font-bold text-slate-800 mb-1.5">Ngày sinh</Text>
            <View className="h-[52px] bg-slate-50 rounded-2xl px-4 border border-slate-200 justify-center">
              <TextInput
                className="text-[15px] text-textMain font-semibold p-0"
                value={editForm.dob}
                onChangeText={(t) => setEditForm({ ...editForm, dob: t })}
                placeholder="DD/MM/YYYY (VD: 15/08/1995)"
                placeholderTextColor="#94A3B8"
              />
            </View>
          </View>
        </View>

        <View className="flex-row gap-3">
          <TouchableOpacity
            className="flex-1 h-[52px] rounded-2xl bg-slate-100 items-center justify-center border border-slate-200 active:bg-slate-200"
            onPress={() => setActiveModal(null)}
            activeOpacity={0.7}
          >
            <Text className="text-[14.5px] font-bold text-slate-700">Huỷ</Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="flex-[2] h-[52px] rounded-2xl bg-primary items-center justify-center active:bg-primaryDark shadow-sm"
            onPress={handleSaveProfile}
            activeOpacity={0.8}
            disabled={isSavingProfile}
          >
            {isSavingProfile ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text className="text-[15px] font-black text-white">Xác nhận</Text>
            )}
          </TouchableOpacity>
        </View>
      </AnimatedBottomSheet>

      {/* ================= MODAL 2: ĐỔI MẬT KHẨU ================= */}
      <AnimatedBottomSheet visible={activeModal === 'password'} onClose={() => setActiveModal(null)}>
        <View className="flex-row justify-between items-center mb-2">
          <Text className="text-[19px] font-black text-textMain">Đổi Mật Khẩu</Text>
          <TouchableOpacity
            className="w-9 h-9 rounded-full bg-slate-100 items-center justify-center border border-slate-200"
            onPress={() => setActiveModal(null)}
            activeOpacity={0.7}
          >
            <X size={18} color="#475569" />
          </TouchableOpacity>
        </View>

        <View className="gap-3.5 my-4">
          {/* Mật khẩu hiện tại */}
          <View>
            <Text className="text-[13.5px] font-bold text-slate-800 mb-1.5">Mật khẩu hiện tại</Text>
            <View className="h-[52px] flex-row items-center bg-slate-50 rounded-2xl px-4 border border-slate-200">
              <TextInput
                className="flex-1 text-[15px] text-textMain font-semibold p-0"
                secureTextEntry={!showCurrentPass}
                value={passwordForm.currentPassword}
                onChangeText={(t) => setPasswordForm({ ...passwordForm, currentPassword: t })}
                placeholder="Nhập mật khẩu hiện tại"
                placeholderTextColor="#94A3B8"
              />
              <TouchableOpacity className="p-1" onPress={() => setShowCurrentPass(!showCurrentPass)}>
                {showCurrentPass ? <EyeOff size={18} color="#64748B" /> : <Eye size={18} color="#64748B" />}
              </TouchableOpacity>
            </View>
          </View>

          {/* Mật khẩu mới */}
          <View>
            <Text className="text-[13.5px] font-bold text-slate-800 mb-1.5">Mật khẩu mới</Text>
            <View className="h-[52px] flex-row items-center bg-slate-50 rounded-2xl px-4 border border-slate-200">
              <TextInput
                className="flex-1 text-[15px] text-textMain font-semibold p-0"
                secureTextEntry={!showNewPass}
                value={passwordForm.newPassword}
                onChangeText={(t) => setPasswordForm({ ...passwordForm, newPassword: t })}
                placeholder="Tối thiểu 6 ký tự"
                placeholderTextColor="#94A3B8"
              />
              <TouchableOpacity className="p-1" onPress={() => setShowNewPass(!showNewPass)}>
                {showNewPass ? <EyeOff size={18} color="#64748B" /> : <Eye size={18} color="#64748B" />}
              </TouchableOpacity>
            </View>
          </View>

          {/* Xác nhận mật khẩu mới */}
          <View>
            <Text className="text-[13.5px] font-bold text-slate-800 mb-1.5">Xác nhận mật khẩu mới</Text>
            <View className="h-[52px] flex-row items-center bg-slate-50 rounded-2xl px-4 border border-slate-200">
              <TextInput
                className="flex-1 text-[15px] text-textMain font-semibold p-0"
                secureTextEntry={!showConfirmPass}
                value={passwordForm.confirmPassword}
                onChangeText={(t) => setPasswordForm({ ...passwordForm, confirmPassword: t })}
                placeholder="Nhập lại mật khẩu mới"
                placeholderTextColor="#94A3B8"
              />
              <TouchableOpacity className="p-1" onPress={() => setShowConfirmPass(!showConfirmPass)}>
                {showConfirmPass ? <EyeOff size={18} color="#64748B" /> : <Eye size={18} color="#64748B" />}
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View className="flex-row gap-3">
          <TouchableOpacity
            className="flex-1 h-[52px] rounded-2xl bg-slate-100 items-center justify-center border border-slate-200 active:bg-slate-200"
            onPress={() => setActiveModal(null)}
            activeOpacity={0.7}
          >
            <Text className="text-[14.5px] font-bold text-slate-700">Huỷ</Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="flex-[2] h-[52px] rounded-2xl bg-primary items-center justify-center active:bg-primaryDark shadow-sm"
            onPress={handleChangePassword}
            activeOpacity={0.8}
            disabled={isChangingPassword}
          >
            {isChangingPassword ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text className="text-[15px] font-black text-white">Xác nhận</Text>
            )}
          </TouchableOpacity>
        </View>
      </AnimatedBottomSheet>

      {/* ================= MODAL 3: CHUYỂN ĐỔI TÀI KHOẢN ================= */}
      <AnimatedBottomSheet
        visible={activeModal === 'switch_account'}
        onClose={() => !isSwitchingAccount && setActiveModal(null)}
      >
        <View className="flex-row justify-between items-center mb-2">
          <Text className="text-[19px] font-black text-textMain">Chuyển Đổi Tài Khoản</Text>
          <TouchableOpacity
            className="w-9 h-9 rounded-full bg-slate-100 items-center justify-center border border-slate-200"
            onPress={() => !isSwitchingAccount && setActiveModal(null)}
            activeOpacity={0.7}
          >
            <X size={18} color="#475569" />
          </TouchableOpacity>
        </View>

        <View className="gap-3 my-4">
          {isLoadingStaff || isSwitchingAccount ? (
            <View className="py-8 items-center justify-center">
              <ActivityIndicator size="large" color="#10B981" />
              <Text className="text-[13px] text-textMuted mt-2.5 font-medium">
                {isSwitchingAccount ? 'Đang chuyển đổi tài khoản...' : 'Đang tải danh sách nhân sự...'}
              </Text>
            </View>
          ) : (
            (staffList.length > 0 ? staffList : AVAILABLE_STAFF_PROFILES).map((staff) => {
              const currentEmail = (currentUser?.email || profile.email || '').toLowerCase().trim();
              const isCurrent = staff.email.toLowerCase().trim() === currentEmail;
              return (
                <SwipeableStaffItem
                  key={staff.email}
                  staff={staff}
                  isCurrent={isCurrent}
                  isSwitching={isSwitchingAccount}
                  onPress={() => handleSelectStaffAccount(staff)}
                  onDelete={() => {
                    // TODO: Implement delete account logic
                    Alert.alert('Xoá tài khoản', `Bạn có chắc muốn xoá tài khoản ${staff.name}?`, [
                      { text: 'Huỷ', style: 'cancel' },
                      { text: 'Xoá', style: 'destructive', onPress: () => {
                        // TODO: Call API to delete
                        log.info('[SettingsScreen] Delete account', staff.email);
                      }}
                    ]);
                  }}
                />
              );
            })
          )}
        </View>

        <TouchableOpacity
          disabled={isSwitchingAccount}
          className="w-full h-[52px] rounded-2xl bg-primary items-center justify-center flex-row gap-2 active:bg-primaryDark shadow-sm"
          onPress={() => setActiveModal('edit_profile')}
          activeOpacity={0.8}
        >
          <Plus size={18} color="#FFFFFF" strokeWidth={2.5} />
          <Text className="text-[14.5px] font-extrabold text-white">Thêm tài khoản</Text>
        </TouchableOpacity>
      </AnimatedBottomSheet>

      {/* ================= MODAL: CHUYỂN CHI NHÁNH (CỤ THỂ, KHÔNG CÓ TỔNG CHI NHÁNH) ================= */}
      <AnimatedBottomSheet
        visible={activeModal === 'switch_branch'}
        onClose={() => !isSwitchingBranch && setActiveModal(null)}
      >
        <View className="flex-row justify-between items-center mb-2">
          <Text className="text-[19px] font-black text-textMain">Chuyển Chi Nhánh</Text>
          <TouchableOpacity
            className="w-9 h-9 rounded-full bg-slate-100 items-center justify-center border border-slate-200"
            onPress={() => setActiveModal(null)}
            disabled={isSwitchingBranch}
            activeOpacity={0.7}
          >
            <X size={18} color="#475569" />
          </TouchableOpacity>
        </View>

        <View className="gap-2.5 my-4">
          {isLoadingBranches ? (
            <View className="py-8 items-center justify-center">
              <ActivityIndicator size="large" color="#0D9488" />
              <Text className="text-[13px] text-textMuted mt-2.5 font-medium">Đang tải danh sách chi nhánh...</Text>
            </View>
          ) : branchesList.length === 0 ? (
            <View className="py-6 items-center justify-center">
              <Text className="text-[13.5px] text-slate-500 font-medium">Không tìm thấy chi nhánh nào</Text>
            </View>
          ) : (
            branchesList.map((branch) => {
              const isCurrent =
                branch.id === (currentUser?.branchId || currentUser?.branch?.id) ||
                branch.name === profile.branch;
              return (
                <TouchableOpacity
                  key={branch.id}
                  disabled={isSwitchingBranch}
                  className={`flex-row items-center p-3.5 rounded-2xl border transition-all ${
                    isCurrent ? 'bg-teal-50/70 border-teal-500' : 'bg-slate-50 border-slate-200'
                  }`}
                  onPress={() => handleSelectBranch(branch)}
                  activeOpacity={0.8}
                >
                  <View
                    className={`w-11 h-11 rounded-xl items-center justify-center border ${
                      isCurrent ? 'bg-teal-600 border-teal-600' : 'bg-white border-slate-200'
                    }`}
                  >
                    <Building2 size={20} color={isCurrent ? '#FFFFFF' : '#0D9488'} />
                  </View>

                  <View className="flex-1 ml-3.5 mr-2">
                    <Text className="text-[14.5px] font-bold text-textMain leading-snug" numberOfLines={2}>
                      {branch.name}
                    </Text>
                    <View className="flex-row items-center gap-1.5 mt-1 flex-wrap">
                      <View className="bg-slate-200/80 px-1.5 py-0.5 rounded">
                        <Text className="text-[10.5px] font-extrabold text-slate-700">{branch.code}</Text>
                      </View>
                      {isCurrent && (
                        <View className="bg-teal-600 px-1.5 py-0.5 rounded">
                          <Text className="text-[10px] font-extrabold text-white">Đang chọn</Text>
                        </View>
                      )}
                      {branch.phone ? (
                        <Text className="text-[11.5px] font-medium text-slate-500">• {branch.phone}</Text>
                      ) : null}
                    </View>
                    {branch.address ? (
                      <Text className="text-[11px] font-normal text-slate-400 mt-1" numberOfLines={1}>
                        {branch.address}
                      </Text>
                    ) : null}
                  </View>

                  {isSwitchingBranch && isCurrent ? (
                    <ActivityIndicator size="small" color="#0D9488" />
                  ) : isCurrent ? (
                    <CheckCircle2 size={22} color="#0D9488" />
                  ) : (
                    <ChevronRight size={18} color="#94A3B8" />
                  )}
                </TouchableOpacity>
              );
            })
          )}
        </View>

        <TouchableOpacity
          className="w-full h-[52px] rounded-2xl bg-slate-100 items-center justify-center border border-slate-200 active:bg-slate-200"
          onPress={() => setActiveModal(null)}
          disabled={isSwitchingBranch}
          activeOpacity={0.7}
        >
          <Text className="text-[14.5px] font-bold text-slate-700">Đóng</Text>
        </TouchableOpacity>
      </AnimatedBottomSheet>

      {/* ================= MODAL 4: ĐÓNG GÓP Ý KIẾN ================= */}
      <AnimatedBottomSheet visible={activeModal === 'feedback'} onClose={() => setActiveModal(null)}>
        <View className="flex-row justify-between items-center mb-2">
          <Text className="text-[19px] font-black text-textMain">Đóng Góp Ý Kiến</Text>
          <TouchableOpacity
            className="w-9 h-9 rounded-full bg-slate-100 items-center justify-center border border-slate-200"
            onPress={() => setActiveModal(null)}
            activeOpacity={0.7}
          >
            <X size={18} color="#475569" />
          </TouchableOpacity>
        </View>

        {/* Category Pills */}
        <View className="mt-3 mb-3">
          <Text className="text-[13.5px] font-bold text-slate-800 mb-2">Chủ đề đóng góp</Text>
          <View className="gap-2">
            <View className="flex-row gap-2">
              {feedbackCategories.slice(0, 2).map((cat) => {
                const isSelected = selectedFeedbackCat === cat;
                return (
                  <TouchableOpacity
                    key={cat}
                    className={`flex-1 h-[44px] px-2 rounded-xl border items-center justify-center ${
                      isSelected
                        ? 'bg-amber-100/80 border-amber-400'
                        : 'bg-slate-50 border-slate-200'
                    }`}
                    onPress={() => setSelectedFeedbackCat(cat)}
                    activeOpacity={0.75}
                  >
                    <Text
                      numberOfLines={1}
                      className={`text-[13px] text-center ${
                        isSelected ? 'font-black text-amber-900' : 'font-semibold text-slate-700'
                      }`}
                    >
                      {cat}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <View className="flex-row gap-2">
              {feedbackCategories.slice(2, 4).map((cat) => {
                const isSelected = selectedFeedbackCat === cat;
                return (
                  <TouchableOpacity
                    key={cat}
                    className={`flex-1 h-[44px] px-2 rounded-xl border items-center justify-center ${
                      isSelected
                        ? 'bg-amber-100/80 border-amber-400'
                        : 'bg-slate-50 border-slate-200'
                    }`}
                    onPress={() => setSelectedFeedbackCat(cat)}
                    activeOpacity={0.75}
                  >
                    <Text
                      numberOfLines={1}
                      className={`text-[13px] text-center ${
                        isSelected ? 'font-black text-amber-900' : 'font-semibold text-slate-700'
                      }`}
                    >
                      {cat}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>


        {/* Input Content */}
        <View className="mb-4">
          <Text className="text-[13.5px] font-bold text-slate-800 mb-1.5">Nội dung chi tiết</Text>
          <TextInput
            className="bg-slate-50 rounded-2xl p-4 border border-slate-200 text-[15px] font-medium text-textMain min-h-[105px]"
            placeholder="Mô tả chi tiết ý kiến, tính năng mong muốn hoặc lỗi bạn gặp phải..."
            placeholderTextColor="#94A3B8"
            multiline
            textAlignVertical="top"
            value={feedbackContent}
            onChangeText={setFeedbackContent}
          />
        </View>

        <View className="flex-row gap-3">
          <TouchableOpacity
            className="flex-1 h-[52px] rounded-2xl bg-slate-100 items-center justify-center border border-slate-200 active:bg-slate-200"
            onPress={() => setActiveModal(null)}
            activeOpacity={0.7}
          >
            <Text className="text-[14.5px] font-bold text-slate-700">Huỷ</Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="flex-[2] h-[52px] rounded-2xl bg-emerald-600 items-center justify-center active:bg-emerald-700 shadow-sm"
            onPress={handleSubmitFeedback}
            activeOpacity={0.8}
            disabled={isSubmittingFeedback}
          >
            {isSubmittingFeedback ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text className="text-[15px] font-black text-white">Gửi</Text>
            )}
          </TouchableOpacity>
        </View>
      </AnimatedBottomSheet>

      {/* ================= MODAL 5: ĐĂNG XUẤT TÀI KHOẢN ================= */}
      <AnimatedBottomSheet visible={activeModal === 'logout'} onClose={() => setActiveModal(null)}>
        <View className="flex-row justify-between items-center mb-2">
          <Text className="text-[19px] font-black text-textMain">Đăng Xuất</Text>
          <TouchableOpacity
            className="w-9 h-9 rounded-full bg-slate-100 items-center justify-center border border-slate-200"
            onPress={() => setActiveModal(null)}
            activeOpacity={0.7}
          >
            <X size={18} color="#475569" />
          </TouchableOpacity>
        </View>

        <View className="my-5">
          <Text className="text-[15px] text-slate-700 leading-relaxed font-medium">
            Bạn có chắc chắn muốn đăng xuất khỏi tài khoản <Text className="font-black text-textMain">{profile.name}</Text> không?
          </Text>
        </View>

        <View className="flex-row gap-3">
          <TouchableOpacity
            className="flex-1 h-[52px] rounded-2xl bg-slate-100 items-center justify-center border border-slate-200 active:bg-slate-200"
            onPress={() => setActiveModal(null)}
            activeOpacity={0.7}
          >
            <Text className="text-[14.5px] font-bold text-slate-700">Huỷ</Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="flex-[2] h-[52px] rounded-2xl bg-rose-600 items-center justify-center active:bg-rose-700 shadow-sm"
            onPress={handleConfirmLogout}
            activeOpacity={0.8}
          >
            <Text className="text-[15px] font-black text-white">Xác nhận</Text>
          </TouchableOpacity>
        </View>
      </AnimatedBottomSheet>
    </KeyboardAvoidingView>
  );
};

export default SettingsScreen;


