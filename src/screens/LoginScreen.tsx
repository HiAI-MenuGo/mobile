import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from 'react-native';
import { LogIn } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '../theme';
import { useAuthStore } from '../data/authStore';

export const LoginScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const login = useAuthStore((s) => s.login);
  const [email, setEmail] = useState('admin@menu-go.vn');
  const [password, setPassword] = useState('123456');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      setError('Vui lòng nhập email và mật khẩu.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await login(email, password);
    } catch (err: unknown) {
      setError((err as Error).message || 'Đăng nhập thất bại. Kiểm tra backend port 5000.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={[styles.root, { paddingTop: Math.max(insets.top, 44) }]}
    >
      <View style={styles.card}>
        <Text style={styles.title}>HiAI-MenuGo</Text>
        <Text style={styles.subtitle}>Đăng nhập nhân viên (Thành viên A)</Text>

        <Text style={styles.label}>Email</Text>
        <TextInput
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          placeholder="admin@menu-go.vn"
          placeholderTextColor={theme.colors.textMuted}
          style={styles.input}
        />

        <Text style={styles.label}>Mật khẩu</Text>
        <TextInput
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          placeholder="••••••"
          placeholderTextColor={theme.colors.textMuted}
          style={styles.input}
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <TouchableOpacity style={styles.btn} onPress={handleLogin} disabled={loading} activeOpacity={0.8}>
          {loading ? (
            <ActivityIndicator color={theme.colors.textInverse} />
          ) : (
            <>
              <LogIn size={18} color={theme.colors.textInverse} strokeWidth={2.5} />
              <Text style={styles.btnText}>Đăng nhập</Text>
            </>
          )}
        </TouchableOpacity>

        <Text style={styles.hint}>Demo: admin@menu-go.vn / manager@ / cashier@ / kitchen@ — MK: 123456</Text>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radii.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: 20,
    ...theme.shadows.card,
  },
  title: { fontSize: 22, fontWeight: '800', color: theme.colors.textMain },
  subtitle: { fontSize: 13, color: theme.colors.textSecondary, marginTop: 4, marginBottom: 16 },
  label: { fontSize: 12, fontWeight: '700', color: theme.colors.textSecondary, marginTop: 10, marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radii.md,
    paddingHorizontal: 12,
    height: 46,
    fontSize: 15,
    color: theme.colors.textMain,
    backgroundColor: theme.colors.surface,
  },
  error: { color: theme.colors.danger, fontSize: 13, marginTop: 10 },
  btn: {
    marginTop: 16,
    height: 48,
    borderRadius: theme.radii.pill,
    backgroundColor: theme.colors.primaryDark,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  btnText: { color: theme.colors.textInverse, fontWeight: '800', fontSize: 15 },
  hint: { fontSize: 11, color: theme.colors.textMuted, marginTop: 12, textAlign: 'center' },
});
