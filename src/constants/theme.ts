import { Platform } from 'react-native';

// ── Brand Colors ──────────────────────────────────────────────────────────────
export const BrandColors = {
  gold: '#F2B84B',
  goldLight: '#FDE5A3',
  goldDark: '#E09D28',
  terracotta: '#D98262',
  terracottaLight: '#F4C3AC',
  terracottaDark: '#C4643E',
  sage: '#96AA88',
  sageLight: '#C5D5C0',
  sageDark: '#617558',
  cream: '#FFF9EE',
  beige: '#F1E6D3',
  charcoal: '#292B28',
  warmGray: '#77766F',
} as const;

// ── Semantic Color Tokens ─────────────────────────────────────────────────────
export const Colors = {
  light: {
    // Backgrounds
    bg: '#FFF9EE',
    background: '#FFF9EE',
    surface: '#F1E6D3',
    backgroundElement: '#F1E6D3',
    backgroundSelected: '#FFFFFF',
    elevated: '#FFFFFF',
    // Brand
    brand: '#F2B84B',
    accent: '#D98262',
    growth: '#96AA88',
    // Text
    text: '#292B28',
    textSecondary: '#77766F',
    textTertiary: '#A8A8A0',
    textDisabled: '#CFCFCA',
    textInverse: '#FFF9EE',
    // Borders
    border: 'rgba(41,43,40,0.10)',
    divider: 'rgba(41,43,40,0.07)',
    // Status
    success: '#5C9E6A',
    warning: '#E8A830',
    error: '#D04A3C',
    info: '#4A7CB8',
    // Feature semantic
    prayer: '#D98262',
    scripture: '#F2B84B',
    gratitude: '#96AA88',
    journal: '#7BB8D4',
    premium: '#F2B84B',
    streak: '#E8A830',
    reminder: '#B8A8CC',
  },
  dark: {
    // Backgrounds
    bg: '#1E1C18',
    background: '#1E1C18',
    surface: '#2A2720',
    backgroundElement: '#2A2720',
    backgroundSelected: '#332F26',
    elevated: '#332F26',
    // Brand
    brand: '#F2B84B',
    accent: '#E89070',
    growth: '#A8BFA1',
    // Text
    text: '#F5EDD8',
    textSecondary: '#B8AD97',
    textTertiary: '#7A7264',
    textDisabled: '#4A4740',
    textInverse: '#292B28',
    // Borders
    border: 'rgba(245,237,216,0.10)',
    divider: 'rgba(245,237,216,0.07)',
    // Status
    success: '#72B880',
    warning: '#F0B840',
    error: '#E06050',
    info: '#6A9CC8',
    // Feature semantic
    prayer: '#E89070',
    scripture: '#F2B84B',
    gratitude: '#A8BFA1',
    journal: '#8AC8E4',
    premium: '#F2B84B',
    streak: '#F0B840',
    reminder: '#C8B8DC',
  },
} as const;

export type ThemeColors = typeof Colors.light;
export type ThemeColor = keyof typeof Colors.light;
export type ColorScheme = 'light' | 'dark';

// ── Typography ────────────────────────────────────────────────────────────────
export const FontFamily = Platform.select({
  ios: {
    sans: 'Inter',
    sansMedium: 'Inter_500Medium',
    sansSemibold: 'Inter_600SemiBold',
    sansBold: 'Inter_700Bold',
    serif: 'Lora',
    serifItalic: 'Lora_400Regular_Italic',
    serifMedium: 'Lora_500Medium',
  },
  android: {
    sans: 'Inter',
    sansMedium: 'Inter_500Medium',
    sansSemibold: 'Inter_600SemiBold',
    sansBold: 'Inter_700Bold',
    serif: 'Lora',
    serifItalic: 'Lora_400Regular_Italic',
    serifMedium: 'Lora_500Medium',
  },
  default: {
    sans: 'Inter',
    sansMedium: 'Inter',
    sansSemibold: 'Inter',
    sansBold: 'Inter',
    serif: 'Georgia',
    serifItalic: 'Georgia',
    serifMedium: 'Georgia',
  },
})!;

export const Fonts = {
  sans: FontFamily.sans,
  serif: FontFamily.serif,
  mono: Platform.OS === 'ios' ? 'Courier' : 'monospace',
} as const;

export const FontSize = {
  displayLg: 36,
  displayMd: 28,
  displaySm: 24,
  headlineLg: 22,
  headlineMd: 20,
  headlineSm: 18,
  titleLg: 17,
  titleMd: 16,
  titleSm: 15,
  bodyLg: 17,
  bodyMd: 15,
  bodySm: 14,
  labelLg: 14,
  labelMd: 13,
  labelSm: 12,
  caption: 12,
  scriptureLg: 22,
  scriptureMd: 19,
  scriptureSm: 16,
  prayerLg: 20,
  statLg: 40,
  statMd: 28,
} as const;

export const LineHeight = {
  displayLg: 44,
  displayMd: 36,
  displaySm: 32,
  headlineLg: 28,
  headlineMd: 26,
  headlineSm: 24,
  titleLg: 24,
  titleMd: 22,
  titleSm: 20,
  bodyLg: 26,
  bodyMd: 22,
  bodySm: 20,
  labelLg: 20,
  labelMd: 18,
  labelSm: 16,
  caption: 16,
  scriptureLg: 34,
  scriptureMd: 30,
  scriptureSm: 26,
  prayerLg: 32,
  statLg: 48,
  statMd: 36,
} as const;

// ── Spacing (4pt grid) ────────────────────────────────────────────────────────
export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 12,
  four: 16,
  five: 20,
  six: 24,
  eight: 32,
  ten: 40,
  twelve: 48,
  sixteen: 64,
  twenty: 80,
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  '2xl': 32,
  '3xl': 40,
  '4xl': 48,
  '6xl': 64,
  '8xl': 80,
} as const;

// ── Border Radius ─────────────────────────────────────────────────────────────
export const Radius = {
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  pill: 9999,
} as const;

// ── Shadows ───────────────────────────────────────────────────────────────────
export const Shadow = {
  level0: {},
  level1: Platform.select({
    ios: {
      shadowColor: '#292B28',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.08,
      shadowRadius: 3,
    },
    android: { elevation: 2 },
    default: {},
  }),
  level2: Platform.select({
    ios: {
      shadowColor: '#292B28',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.10,
      shadowRadius: 12,
    },
    android: { elevation: 4 },
    default: {},
  }),
  level3: Platform.select({
    ios: {
      shadowColor: '#292B28',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.12,
      shadowRadius: 24,
    },
    android: { elevation: 8 },
    default: {},
  }),
  level4: Platform.select({
    ios: {
      shadowColor: '#292B28',
      shadowOffset: { width: 0, height: 16 },
      shadowOpacity: 0.14,
      shadowRadius: 48,
    },
    android: { elevation: 16 },
    default: {},
  }),
} as const;

// ── Layout ────────────────────────────────────────────────────────────────────
export const Layout = {
  screenMargin: 20,
  cardPadding: 20,
  maxContentWidth: 480,
  tabBarHeight: Platform.select({ ios: 83, android: 80 }) ?? 80,
  headerHeight: Platform.select({ ios: 44, android: 56 }) ?? 56,
} as const;

export const MaxContentWidth = Layout.maxContentWidth;
