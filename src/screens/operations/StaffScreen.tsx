import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import {
  ArrowLeft,
  BellRing,
  Users,
  Search,
  ChevronDown,
  X,
  Send,
  UserPlus,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { api } from '../../services/api';
import { useSocketEvent } from '../../hooks/useSocket';

export interface StaffMember {
  id: string;
  name: string;
  role: 'ADMIN' | 'MANAGER' | 'KITCHEN' | 'CASHIER';
  branchId?: string;
  branchName?: string;
  isActive: boolean;
  avatarUrl?: string;
}

interface StaffScreenProps {
  onBack: () => void;
}

export const StaffScreen: React.FC<StaffScreenProps> = ({ onBack }) => {
  const insets = useSafeAreaInsets();
  const dynamicPaddingBottom = insets.bottom > 0 ? Math.max(insets.bottom - 16, 6) : 6;

  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);
  const [showCallModal, setShowCallModal] = useState(false);
  const [callTable, setCallTable] = useState('');
  const [callReason, setCallReason] = useState('Khách gọi phục vụ tại bàn');
  const [callNote, setCallNote] = useState('');
  const [tablesList, setTablesList] = useState<Array<{ id: string; name: string; status: string }>>([]);

  const formatRole = (role: string) => {
    const labels: Record<string, string> = {
      ADMIN: 'Chủ quán',
      MANAGER: 'Quản lý',
      KITCHEN: 'Bếp / Pha chế',
      CASHIER: 'Nhân viên',
    };
    return labels[role] || role;
  };

  const roleColor = (role: string) => {
    const colors: Record<string, string> = {
      ADMIN: 'bg-purple-100 text-purple-700 border-purple-200',
      MANAGER: 'bg-blue-100 text-blue-700 border-blue-200',
      KITCHEN: 'bg-orange-100 text-orange-700 border-orange-200',
      CASHIER: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    };
    return colors[role] || 'bg-slate-100 text-slate-700 border-slate-200';
  };

  const loadStaff = async () => {
    try {
      setLoading(true);
      const data = await api.getProfile();
      if (data) {
        const mockStaff: StaffMember[] = [
          { id: '1', name: 'Nguyễn Văn An', role: 'CASHIER', branchId: 'default-branch', branchName: 'Chi nhánh 1', isActive: true },
          { id: '2', name: 'Trần Thị Bình', role: 'KITCHEN', branchId: 'default-branch', branchName: 'Chi nhánh 1', isActive: true },
          { id: '3', name: 'Lê Văn Cường', role: 'CASHIER', branchId: 'default-branch', branchName: 'Chi nhánh 1', isActive: true },
          { id: '4', name: 'Phạm Thị Dung', role: 'MANAGER', branchId: 'default-branch', branchName: 'Chi nhánh 1', isActive: true },
        ];
        setStaffList(mockStaff);
      }
    } catch (err: any) {
      console.log('[StaffScreen] Using fallback staff data');
      const mockStaff: StaffMember[] = [
        { id: '1', name: 'Nguyễn Văn An', role: 'CASHIER', branchId: 'default-branch', branchName: 'Chi nhánh 1', isActive: true },
        { id: '2', name: 'Trần Thị Bình', role: 'KITCHEN', branchId: 'default-branch', branchName: 'Chi nhánh 1', isActive: true },
        { id: '3', name: 'Lê Văn Cường', role: 'CASHIER', branchId: 'default-branch', branchName: 'Chi nhánh 1', isActive: true },
        { id: '4', name: 'Phạm Thị Dung', role: 'MANAGER', branchId: 'default-branch', branchName: 'Chi nhánh 1', isActive: true },
      ];
      setStaffList(mockStaff);
    } finally {
      setLoading(false);
    }
  };

  const loadTables = async () => {
    try {
      const data = await api.getTables();
      if (data) {
        setTablesList(data.map(t => ({ id: t.id, name: t.name, status: t.status })));
      }
    } catch (err) {
      console.log('[StaffScreen] Tables load failed');
    }
  };

  useEffect(() => {
    loadStaff();
    loadTables();
  }, []);

  useSocketEvent('call_staff:request', (payload: { tableId?: string; tableName?: string; type?: string }) => {
    console.log('🛎️ [StaffScreen] Call staff request:', payload);
  });

  const filteredStaff = staffList.filter((s) => {
    const q = searchQuery.toLowerCase().trim();
    const matchSearch = !q || s.name.toLowerCase().includes(q);
    const matchRole = roleFilter === 'ALL' || s.role === roleFilter;
    return matchSearch && matchRole;
  });

  const handleCallStaff = async () => {
    if (!selectedStaff || !callTable) {
      Alert.alert('Thiếu thông tin', 'Vui lòng chọn bàn');
      return;
    }

    try {
      await api.sendCustomerCall({
        tableId: callTable,
        tableName: callTable,
        type: 'STAFF',
        reason: callReason,
      });
      Alert.alert('Thành công', `Đã gửi yêu cầu gọi nhân viên "${selectedStaff.name}" phục vụ ${callTable}`);
      setShowCallModal(false);
      setSelectedStaff(null);
      setCallTable('');
      setCallNote('');
    } catch (err: any) {
      Alert.alert('Lỗi', err.message || 'Không thể gửi yêu cầu gọi nhân viên');
    }
  };

  const openCallModal = (staff: StaffMember) => {
    setSelectedStaff(staff);
    if (tablesList.length > 0) {
      setCallTable(tablesList[0].id);
    }
    setShowCallModal(true);
  };

  return (
    <View className="flex-1 bg-background">
      {/* Header */}
      <View className="bg-white px-4 pt-2.5 pb-3 border-b border-[#F1F5F9]">
        <View className="flex-row items-center mb-3">
          <TouchableOpacity
            className="w-9 h-9 rounded-xl bg-slate-100 items-center justify-center mr-3 border border-border"
            onPress={onBack}
            activeOpacity={0.7}
          >
            <ArrowLeft size={18} color="#0F172A" />
          </TouchableOpacity>
          <Text className="text-[20px] font-extrabold text-textMain">Nhân Viên</Text>
        </View>

        {/* Search & Filter */}
        <View className="flex-row gap-2">
          <View className="flex-1 flex-row items-center bg-[#F8FAFC] rounded-xl px-3.5 h-[40px] border border-border gap-2">
            <Search size={16} color="#94A3B8" />
            <TextInput
              placeholder="Tìm nhân viên..."
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
          <TouchableOpacity
            className="bg-white h-[40px] px-4 rounded-xl border border-border flex-row items-center gap-2"
            onPress={() => setRoleFilter(roleFilter === 'ALL' ? 'CASHIER' : roleFilter === 'CASHIER' ? 'KITCHEN' : 'ALL')}
          >
            <Text className="text-[12px] font-bold text-textSecondary">Vai trò:</Text>
            <Text className="text-[12px] font-bold text-textMain">{roleFilter === 'ALL' ? 'Tất cả' : formatRole(roleFilter)}</Text>
            <ChevronDown size={14} color="#94A3B8" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Content */}
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 16, paddingBottom: dynamicPaddingBottom + 16 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Staff List */}
        <View className="bg-white rounded-[20px] border border-border overflow-hidden">
          {loading ? (
            <View className="p-8 items-center">
              <ActivityIndicator size="large" color="#059669" />
              <Text className="text-textSecondary mt-3">Đang tải danh sách nhân viên...</Text>
            </View>
          ) : filteredStaff.length === 0 ? (
            <View className="p-8 items-center border-t border-border">
              <Users size={48} color="#94A3B8" className="mb-3" />
              <Text className="text-[15px] font-bold text-textMain mb-1">Chưa có nhân viên</Text>
              <Text className="text-[12.5px] text-textSecondary text-center">
                Chức năng này chỉ hiển thị danh sách để gọi phục vụ
              </Text>
            </View>
          ) : (
            <View>
              {filteredStaff.map((staff, idx) => (
                <TouchableOpacity
                  key={staff.id}
                  className={`flex-row items-center justify-between p-4 border-b border-border ${idx === filteredStaff.length - 1 ? 'border-b-0' : ''}`}
                  activeOpacity={0.7}
                  onPress={() => openCallModal(staff)}
                >
                  <View className="flex-row items-center gap-3 flex-1">
                    <View
                      className="w-11 h-11 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-400 items-center justify-center"
                    >
                      <Text className="text-white font-black text-base">
                        {staff.name.split(' ').map(n => n[0]).slice(0, 2).join('')}
                      </Text>
                    </View>
                    <View>
                      <Text className="text-[15px] font-bold text-textMain">{staff.name}</Text>
                      <View className="flex-row items-center gap-2 mt-1">
                        <View className={`flex-row items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-bold ${roleColor(staff.role)}`}>
                          <Users size={10} />
                          <Text>{formatRole(staff.role)}</Text>
                        </View>
                        {staff.branchName && (
                          <Text className="text-[11px] text-textMuted">{staff.branchName}</Text>
                        )}
                      </View>
                    </View>
                  </View>
                  <TouchableOpacity
                    className="flex-row items-center gap-2 px-4 py-2 bg-teal-50 rounded-xl border border-teal-100"
                    onPress={(e) => { e.stopPropagation(); openCallModal(staff); }}
                    activeOpacity={0.8}
                  >
                    <BellRing size={16} color="#00A389" />
                    <Text className="text-[12px] font-extrabold text-[#00A389]">Gọi NV</Text>
                  </TouchableOpacity>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Info Card */}
        <View className="mt-4 bg-[#E6F7F4] rounded-[16px] p-4 border border-[#00A389]/20">
          <View className="flex-row items-start gap-3">
            <View className="w-10 h-10 rounded-xl bg-[#00A389] items-center justify-center shrink-0 mt-0.5">
              <BellRing size={18} color="white" />
            </View>
            <View className="flex-1">
              <Text className="text-[13px] font-bold text-[#00A389]">Chỉ có chức năng Gọi Nhân Viên</Text>
              <Text className="text-[12px] text-[#008f77] mt-1">
                Màn hình này chỉ dùng để điều phối nhân viên phục vụ bàn. Quản lý tài khoản nhân viên (thêm/sửa/xoá) vui lòng dùng Web Admin.
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Call Staff Modal */}
      {showCallModal && selectedStaff && (
        <Modal visible={true} transparent animationType="fade">
          <View className="flex-1 bg-slate-900/60 justify-center items-center p-5">
            <View className="w-full max-w-[380px] bg-white rounded-3xl p-6 shadow-xl">
              <View className="flex-row justify-between items-start mb-4">
                <View>
                  <View className="flex-row items-center gap-2 text-[#00A389] text-[12px] font-black uppercase tracking-wider mb-1">
                    <BellRing size={14} />
                    <Text>Gọi nhân viên phục vụ</Text>
                  </View>
                  <Text className="font-extrabold text-[18px] text-textMain">{selectedStaff.name}</Text>
                  <Text className="text-[12px] text-textSecondary mt-0.5">Gửi thông báo điều phối trực tiếp</Text>
                </View>
                <TouchableOpacity onPress={() => { setShowCallModal(false); setSelectedStaff(null); }} className="p-1">
                  <X size={20} color="#94A3B8" />
                </TouchableOpacity>
              </View>

              <View className="space-y-4">
                <View>
                  <Text className="text-[12px] font-bold text-textSecondary mb-1.5">Chọn bàn cần phục vụ *</Text>
                  <View className="relative">
                    <TextInput
                      value={tablesList.find(t => t.id === callTable)?.name || ''}
                      editable={false}
                      className="w-full h-11 pl-3.5 pr-10 bg-slate-50 border border-slate-200 rounded-xl text-[13px] font-bold text-textMain"
                    />
                    <ChevronDown size={16} className="text-[#64748B] absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </View>
                  {tablesList.length > 0 && (
                    <View className="mt-2 max-h-40 overflow-y-auto bg-white rounded-xl border border-slate-200">
                      {tablesList.map((t) => (
                        <TouchableOpacity
                          key={t.id}
                          className={`px-3.5 py-2.5 flex-row items-center justify-between border-b border-slate-100 ${callTable === t.id ? 'bg-teal-50' : ''}`}
                          onPress={() => setCallTable(t.id)}
                        >
                          <View className="flex-row items-center gap-2">
                            <View className={`w-2.5 h-2.5 rounded-full ${t.status === 'OCCUPIED' ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                            <Text className="text-[13px] font-bold text-textMain">{t.name}</Text>
                          </View>
                          <Text className={`text-[11px] font-bold ${t.status === 'OCCUPIED' ? 'text-amber-600' : 'text-emerald-600'}`}>
                            {t.status === 'OCCUPIED' ? 'Đang có khách' : 'Trống'}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>

                <View>
                  <Text className="text-[12px] font-bold text-textSecondary mb-1.5">Nhiệm vụ / Yêu cầu *</Text>
                  <View className="relative">
                    <TextInput
                      value={callReason}
                      editable={false}
                      className="w-full h-11 pl-3.5 pr-10 bg-slate-50 border border-slate-200 rounded-xl text-[13px] font-bold text-textMain"
                    />
                    <ChevronDown size={16} className="text-[#64748B] absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </View>
                  <View className="mt-2 max-h-40 overflow-y-auto bg-white rounded-xl border border-slate-200">
                    {['Khách gọi phục vụ tại bàn', 'Khách yêu cầu thanh toán / in bill', 'Dọn dẹp bàn & chuẩn bị đón khách', 'Tiếp thực / Ra món cho khách', 'Hỗ trợ gấp cho khách tại bàn'].map((r) => (
                      <TouchableOpacity
                        key={r}
                        className={`px-3.5 py-2.5 border-b border-slate-100 ${callReason === r ? 'bg-teal-50' : ''}`}
                        onPress={() => setCallReason(r)}
                      >
                        <Text className={`text-[13px] font-bold ${callReason === r ? 'text-[#00A389]' : 'text-textMain'}`}>{r}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View>
                  <Text className="text-[12px] font-bold text-textSecondary mb-1.5">Ghi chú thêm</Text>
                  <TextInput
                    value={callNote}
                    onChangeText={setCallNote}
                    placeholder="Ví dụ: Khách gọi thêm đá, lấy thêm chén..."
                    className="w-full h-11 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-[13px] text-textMain"
                    multiline
                  />
                </View>
              </View>

              <View className="flex-row gap-3 mt-6 pt-4 border-t border-slate-100">
                <TouchableOpacity
                  className="flex-1 h-11 rounded-xl bg-slate-100 items-center justify-center"
                  onPress={() => { setShowCallModal(false); setSelectedStaff(null); }}
                  activeOpacity={0.8}
                >
                  <Text className="text-[13px] font-bold text-textSecondary">Huỷ</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  className="flex-1 h-11 rounded-xl bg-[#00A389] items-center justify-center flex-row gap-2"
                  onPress={handleCallStaff}
                  activeOpacity={0.85}
                >
                  <Send size={14} color="white" />
                  <Text className="text-white text-[13px] font-extrabold">Gửi lệnh gọi</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
};

export default StaffScreen;