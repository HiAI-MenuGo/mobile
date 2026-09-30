/**
 * HiAI-MenuGo — Design Tokens (do Thành viên A quản lý)
 * Chuẩn: mobile/.agents/SKILLS.md §8 + agent.md §5
 * Luật: mọi màn hình import từ theme.colors.*, theme.radii.*, theme.shadows.*
 * TUYỆT ĐỐI KHÔNG hardcode hex rời rạc trong component con.
 */

export const theme = {
  colors: {
    // Primary Brand (Emerald / Mint)
    primary: '#10B981',
    primaryDark: '#059669',
    primaryLight: '#D1FAE5',
    primaryTint: '#ECFDF5',

    // Accent & Status
    accent: '#0284C7',
    accentLight: '#E0F2FE',
    success: '#10B981',
    warning: '#F59E0B',
    danger: '#EF4444',
    info: '#3B82F6',

    // Surfaces & Backgrounds
    background: '#F8FAFC',
    surface: '#FFFFFF',
    surfaceSubtle: '#F1F5F9',

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
