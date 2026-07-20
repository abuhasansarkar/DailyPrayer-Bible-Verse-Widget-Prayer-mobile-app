// ── Widget Types ──────────────────────────────────────────────────────────────

export type WidgetSize = 'small' | 'medium' | 'large' | 'lockscreen-circular' | 'lockscreen-rectangular' | 'lockscreen-inline';

export type WidgetContentType = 'daily-verse' | 'favorite-verse' | 'daily-prayer' | 'streak' | 'morning-devotion' | 'evening-reflection' | 'gratitude';

export type WidgetFontStyle = 'inter-regular' | 'inter-medium' | 'lora-regular' | 'lora-italic';

export type WidgetTextAlignment = 'left' | 'center' | 'right';

export interface WidgetTheme {
  id: string;
  name: string;
  slug: string;
  bgColor: string;
  textColor: string;
  accentColor: string;
  referenceColor: string;
  illustration?: string;       // asset name for optional illustration
  isDark: boolean;
  isPremium: boolean;
  previewImageUrl?: string;
  category: 'light' | 'dark' | 'seasonal' | 'nature' | 'minimal' | 'photo';
}

export interface WidgetConfig {
  id: string;
  size: WidgetSize;
  contentType: WidgetContentType;
  themeId: string;
  theme: WidgetTheme;
  fontStyle: WidgetFontStyle;
  textAlignment: WidgetTextAlignment;
  showReference: boolean;
  showDate: boolean;
  showMascot: boolean;
  showAppLogo: boolean;
  customPhotoUri?: string;     // user-selected photo background
  verseTranslation: string;
  isActive: boolean;
  createdAt: string;
}

export interface WidgetPreviewProps {
  config: WidgetConfig;
  verseText?: string;
  verseReference?: string;
  date?: string;
  streakCount?: number;
}

// 20 built-in widget themes
export const WIDGET_THEMES: WidgetTheme[] = [
  { id: 'morning-light', name: 'Morning Light', slug: 'morning-light', bgColor: '#FFF9EE', textColor: '#292B28', accentColor: '#F2B84B', referenceColor: '#77766F', isDark: false, isPremium: false, category: 'light' },
  { id: 'warm-cream', name: 'Warm Cream', slug: 'warm-cream', bgColor: '#F1E6D3', textColor: '#292B28', accentColor: '#D98262', referenceColor: '#77766F', isDark: false, isPremium: false, category: 'light' },
  { id: 'soft-sage', name: 'Soft Sage', slug: 'soft-sage', bgColor: '#E2EAE0', textColor: '#1E2E1A', accentColor: '#617558', referenceColor: '#4C5D44', isDark: false, isPremium: false, category: 'nature' },
  { id: 'terracotta', name: 'Terracotta', slug: 'terracotta', bgColor: '#FAE3D9', textColor: '#3C1A0E', accentColor: '#D98262', referenceColor: '#7E3E22', isDark: false, isPremium: true, category: 'light' },
  { id: 'nordic-blue', name: 'Nordic Blue', slug: 'nordic-blue', bgColor: '#DDE8F0', textColor: '#1A2A3A', accentColor: '#4A7CB8', referenceColor: '#2A4A6A', isDark: false, isPremium: true, category: 'light' },
  { id: 'quiet-forest', name: 'Quiet Forest', slug: 'quiet-forest', bgColor: '#C5D5C0', textColor: '#1E2E1A', accentColor: '#4C5D44', referenceColor: '#394531', isDark: false, isPremium: true, category: 'nature' },
  { id: 'golden-hour', name: 'Golden Hour', slug: 'golden-hour', bgColor: '#FEF3D1', textColor: '#292B28', accentColor: '#E09D28', referenceColor: '#BB7E1A', isDark: false, isPremium: true, category: 'light' },
  { id: 'floral', name: 'Floral', slug: 'floral', bgColor: '#F8EDF4', textColor: '#2A102A', accentColor: '#B8A8CC', referenceColor: '#7A5A8A', isDark: false, isPremium: true, category: 'light' },
  { id: 'minimal-white', name: 'Minimal White', slug: 'minimal-white', bgColor: '#FFFFFF', textColor: '#292B28', accentColor: '#292B28', referenceColor: '#77766F', isDark: false, isPremium: false, category: 'minimal' },
  { id: 'deep-charcoal', name: 'Deep Charcoal', slug: 'deep-charcoal', bgColor: '#292B28', textColor: '#F5EDD8', accentColor: '#F2B84B', referenceColor: '#B8AD97', isDark: true, isPremium: false, category: 'dark' },
  { id: 'evening-prayer', name: 'Evening Prayer', slug: 'evening-prayer', bgColor: '#1E1C18', textColor: '#F5EDD8', accentColor: '#D98262', referenceColor: '#B8AD97', isDark: true, isPremium: true, category: 'dark' },
  { id: 'peaceful-sleep', name: 'Peaceful Sleep', slug: 'peaceful-sleep', bgColor: '#1A1A2E', textColor: '#E8E0F0', accentColor: '#B8A8CC', referenceColor: '#8A7A9C', isDark: true, isPremium: true, category: 'dark' },
  { id: 'gratitude', name: 'Gratitude', slug: 'gratitude', bgColor: '#E2EAE0', textColor: '#1E2E1A', accentColor: '#96AA88', referenceColor: '#4C5D44', isDark: false, isPremium: true, category: 'nature' },
  { id: 'hope', name: 'Hope', slug: 'hope', bgColor: '#FEF3D1', textColor: '#292B28', accentColor: '#F2B84B', referenceColor: '#BB7E1A', isDark: false, isPremium: true, category: 'light' },
  { id: 'strength', name: 'Strength', slug: 'strength', bgColor: '#2A2720', textColor: '#F5EDD8', accentColor: '#F2B84B', referenceColor: '#B8AD97', isDark: true, isPremium: true, category: 'dark' },
  { id: 'christmas', name: 'Christmas', slug: 'christmas', bgColor: '#1A2E1A', textColor: '#F0E8D8', accentColor: '#E8A830', referenceColor: '#A8885A', isDark: true, isPremium: true, category: 'seasonal' },
  { id: 'easter', name: 'Easter', slug: 'easter', bgColor: '#F8EDF4', textColor: '#2A1030', accentColor: '#D98262', referenceColor: '#8A5A6A', isDark: false, isPremium: true, category: 'seasonal' },
  { id: 'spring', name: 'Spring', slug: 'spring', bgColor: '#EEF5E8', textColor: '#1A2E1A', accentColor: '#72B880', referenceColor: '#4C5D44', isDark: false, isPremium: true, category: 'seasonal' },
  { id: 'autumn', name: 'Autumn', slug: 'autumn', bgColor: '#F5E8D8', textColor: '#2A1A08', accentColor: '#C4643E', referenceColor: '#7E3E22', isDark: false, isPremium: true, category: 'seasonal' },
  { id: 'personal-photo', name: 'Personal Photo', slug: 'personal-photo', bgColor: 'transparent', textColor: '#FFFFFF', accentColor: '#F2B84B', referenceColor: '#E0D8C8', isDark: true, isPremium: true, category: 'photo' },
];
