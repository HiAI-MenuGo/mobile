/**
 * HiAI-MenuGo — Design Tokens (do Thành viên A quản lý)
 * Chuẩn: mobile/.agents/SKILLS.md §8 + agent.md §5
 * Luật: mọi màn hình import từ theme.colors.*, theme.radii.*, theme.shadows.*
 * TUYỆT ĐỐI KHÔNG hardcode hex rời rạc trong component con.
 */

export const theme = {
  colors: {
    // Primary Brand (Tasty Station Teal / Mint - đồng bộ Web)
    primary: '#00A389',
    primaryDark: '#008770',
    primaryLight: '#E6F7F4',
    primaryTint: '#F0FDF9',

    // Accent & Status
    accent: '#FF7A59',
    accentLight: '#FFF1EE',
    success: '#00A389',
    warning: '#F59E0B',
    danger: '#EF4444',
    info: '#3B82F6',

    // Surfaces & Backgrounds
    background: '#F4F6F8',
    surface: '#FFFFFF',
    surfaceSubtle: '#F8FAFC',

    // Borders & Dividers
    border: '#E2E8F0',
    borderSubtle: '#F1F5F9',

    // Text Colors
    textMain: '#0F172A',
    textSecondary: '#475569',
    textMuted: '#94A3B8',
    textInverse: '#FFFFFF',
  },
  radii: {
    pill: 999,
    xl: 24,
    lg: 18,
    md: 14,
    sm: 10,
  },
  shadows: {
    card: {
      shadowColor: '#0F172A',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.05,
      shadowRadius: 10,
      elevation: 2,
    },
    float: {
      shadowColor: '#059669',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.25,
      shadowRadius: 14,
      elevation: 6,
    },
    dock: {
      shadowColor: '#0F172A',
      shadowOffset: { width: 0, height: -4 },
      shadowOpacity: 0.08,
      shadowRadius: 16,
      elevation: 8,
    },
  },
} as const;

export type Theme = typeof theme;
export default theme;
