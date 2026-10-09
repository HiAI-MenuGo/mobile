import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
} from 'react-native';
import {
  LogIn,
  Mail,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  ShieldCheck,
  UserCheck,
  CreditCard,
  ChefHat,
  Sparkles,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { theme } from '../theme';
import { useAuthStore } from '../data/authStore';

const SEEDED_ACCOUNTS = [
  {
    role: 'ADMIN',
    name: 'Ibrahim Kadri',
    email: 'ibrahim.kadri@tastystation.com',
    roleLabel: 'Admin / Chủ quán',
    icon: ShieldCheck,
  },
  {
    role: 'MANAGER',
    name: 'Lê Thanh Hải',
    email: 'manager@tastystation.com',
    roleLabel: 'Quản lý trưởng',
    icon: UserCheck,
  },
  {
    role: 'CASHIER',
    name: 'Nguyễn Thị Mai',
    email: 'cashier@tastystation.com',
    roleLabel: 'Thu ngân ca sáng',
    icon: CreditCard,
  },
  {
    role: 'KITCHEN',
    name: 'Phạm Văn Bếp',
    email: 'kitchen@tastystation.com',
    roleLabel: 'Bếp trưởng KDS',
    icon: ChefHat,
  },
];

export const LoginScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const login = useAuthStore((s) => s.login);

  const [email, setEmail] = useState('ibrahim.kadri@tastystation.com');
  const [password, setPassword] = useState('123456');
  const [showPassword, setShowPassword] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSelectAccount = (accountEmail: string) => {
    setEmail(accountEmail);
    setPassword('123456');
    setError(null);
  };

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      setError('Vui lòng nhập đầy đủ email và mật khẩu.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await login(email.trim(), password);
    } catch (err: unknown) {
      const message = (err as Error).message || 'Đăng nhập thất bại. Vui lòng kiểm tra lại.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.keyboardContainer}
    >
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: Math.max(insets.top + 24, 48),
            paddingBottom: Math.max(insets.bottom + 24, 40),
          },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.card}>
          {/* Logo & Brand Header */}
          <View style={styles.brandContainer}>
            <View style={styles.logoBadge}>
              <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
                <Path
                  d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 12L7.05 7.05C8.42 5.68 10.16 4.8 12 4.8V12ZM12 12L16.95 7.05C18.32 8.42 19.2 10.16 19.2 12H12ZM12 12L16.95 16.95C15.58 18.32 13.84 19.2 12 19.2V12ZM12 12L7.05 16.95C5.68 15.58 4.8 13.84 4.8 12H12Z"
                  fill="#00A389"
                />
              </Svg>
            </View>
            <View style={styles.brandTextCol}>
              <View style={styles.brandTitleRow}>
                <Text style={styles.brandTitle}>MenuGO</Text>
                <View style={styles.hiaiTag}>
                  <Text style={styles.hiaiTagText}>HiAI</Text>
                </View>
              </View>
              <Text style={styles.brandSubtitle}>Tasty Station • POS & KDS</Text>
            </View>
          </View>

          {/* Title */}
          <Text style={styles.title}>Đăng nhập</Text>
          <Text style={styles.subtitle}>Hệ thống vận hành nhân viên & thu ngân</Text>

          {/* Form */}
          <View style={styles.form}>
            {/* Email Field */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Email</Text>
              <View
                style={[
                  styles.inputBox,
                  emailFocused && styles.inputBoxFocused,
                ]}
              >
                <Mail size={16} color={emailFocused ? theme.colors.primary : '#94A3B8'} />
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  onFocus={() => setEmailFocused(true)}
                  onBlur={() => setEmailFocused(false)}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  placeholder="nhap@email.com"
                  placeholderTextColor={theme.colors.textMuted}
                  style={styles.textInput}
                />
              </View>
            </View>

            {/* Password Field */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Mật khẩu</Text>
              <View
                style={[
                  styles.inputBox,
                  passwordFocused && styles.inputBoxFocused,
                ]}
              >
                <Lock size={16} color={passwordFocused ? theme.colors.primary : '#94A3B8'} />
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  onFocus={() => setPasswordFocused(true)}
                  onBlur={() => setPasswordFocused(false)}
                  secureTextEntry={!showPassword}
                  placeholder="••••••"
                  placeholderTextColor={theme.colors.textMuted}
                  style={styles.textInput}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  style={styles.eyeBtn}
                >
                  {showPassword ? (
                    <EyeOff size={16} color="#64748B" />
                  ) : (
                    <Eye size={16} color="#94A3B8" />
                  )}
                </TouchableOpacity>
              </View>
            </View>

            {/* Error Banner */}
            {error ? (
              <View style={styles.errorBox}>
                <AlertCircle size={15} color="#DC2626" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            {/* Login Button */}
            <TouchableOpacity
              style={[styles.loginBtn, loading && styles.loginBtnDisabled]}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <>
                  <LogIn size={16} color="#FFFFFF" strokeWidth={2.5} />
                  <Text style={styles.loginBtnText}>Đăng nhập</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* Seeded Accounts Quick Selection */}
          <View style={styles.quickSection}>
            <View style={styles.quickHeader}>
              <Sparkles size={13} color={theme.colors.primary} />
              <Text style={styles.quickTitle}>Tài khoản mẫu đã seed (MK: 123456)</Text>
            </View>
            <View style={styles.chipsGrid}>
              {SEEDED_ACCOUNTS.map((acc) => {
                const isSelected = email.toLowerCase() === acc.email.toLowerCase();
                const IconComponent = acc.icon;
                return (
                  <TouchableOpacity
                    key={acc.email}
                    onPress={() => handleSelectAccount(acc.email)}
                    style={[
                      styles.chip,
                      isSelected && styles.chipActive,
                    ]}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.chipIconBox, isSelected && styles.chipIconBoxActive]}>
                      <IconComponent
                        size={13}
                        color={isSelected ? theme.colors.primary : '#64748B'}
                      />
                    </View>
                    <View style={styles.chipTextCol}>
                      <Text
                        style={[styles.chipName, isSelected && styles.chipNameActive]}
                        numberOfLines={1}
                      >
                        {acc.name}
                      </Text>
                      <Text
                        style={[styles.chipRole, isSelected && styles.chipRoleActive]}
                        numberOfLines={1}
                      >
                        {acc.roleLabel}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Footer */}
          <Text style={styles.footerText}>powered by HiAI</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  keyboardContainer: {
    flex: 1,
    backgroundColor: '#F4F6F8',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 24,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  brandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  logoBadge: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#E6F7F4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandTextCol: {
    flex: 1,
  },
  brandTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  brandTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  hiaiTag: {
    backgroundColor: '#E6F7F4',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  hiaiTagText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#00A389',
    letterSpacing: 0.5,
  },
  brandSubtitle: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
    marginTop: 2,
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
    marginTop: 4,
    marginBottom: 20,
  },
  form: {
    gap: 14,
  },
  fieldGroup: {
    gap: 6,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
  inputBox: {
    height: 46,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    paddingHorizontal: 12,
    gap: 10,
  },
  inputBoxFocused: {
    borderColor: '#00A389',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
  },
  textInput: {
    flex: 1,
    fontSize: 13.5,
    color: '#0F172A',
    fontWeight: '500',
    padding: 0,
  },
  eyeBtn: {
    padding: 4,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  errorText: {
    flex: 1,
    fontSize: 12.5,
    fontWeight: '600',
    color: '#DC2626',
  },
  loginBtn: {
    height: 48,
    borderRadius: 16,
    backgroundColor: '#00A389',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 4,
    shadowColor: '#00A389',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  loginBtnDisabled: {
    opacity: 0.6,
  },
  loginBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  quickSection: {
    marginTop: 22,
    paddingTop: 18,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  quickHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  quickTitle: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#64748B',
  },
  chipsGrid: {
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  chipActive: {
    backgroundColor: '#E6F7F4',
    borderColor: '#00A389',
  },
  chipIconBox: {
    width: 28,
    height: 28,
    borderRadius: 9,
    backgroundColor: '#EDF2F7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipIconBoxActive: {
    backgroundColor: '#FFFFFF',
  },
  chipTextCol: {
    flex: 1,
  },
  chipName: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#1E293B',
  },
  chipNameActive: {
    color: '#007A66',
  },
  chipRole: {
    fontSize: 10.5,
    fontWeight: '500',
    color: '#64748B',
    marginTop: 1,
  },
  chipRoleActive: {
    color: '#00A389',
  },
  footerText: {
    marginTop: 20,
    textAlign: 'center',
    fontSize: 11,
    fontWeight: '600',
    color: '#94A3B8',
  },
});
