import { create } from 'zustand';
import { AppTheme, SpiritualGoal, UserPreferences } from '@/types/user';
import { BibleTranslation } from '@/types/verse';

// ─────────────────────────────────────────────────────────────────────────────
// App Store — global UI state, onboarding, preferences
// ─────────────────────────────────────────────────────────────────────────────

interface AppState {
  // Lifecycle
  isDbReady: boolean;
  isOnboardingComplete: boolean;
  isLoading: boolean;
  // Theme
  colorScheme: AppTheme;
  // Preferences
  preferences: UserPreferences;
  // Actions
  setDbReady: (ready: boolean) => void;
  setOnboardingComplete: (complete: boolean) => void;
  setColorScheme: (scheme: AppTheme) => void;
  updatePreferences: (update: Partial<UserPreferences>) => void;
  toggleGoal: (goal: SpiritualGoal) => void;
  setTranslation: (translation: BibleTranslation) => void;
  setLoading: (loading: boolean) => void;
}

const DEFAULT_PREFERENCES: UserPreferences = {
  goals: [],
  preferredTranslation: 'NIV',
  preferredCategories: [],
  appTheme: 'system',
  fontSize: 'default',
  reducedMotion: false,
  highContrast: false,
  language: 'en',
  notificationsEnabled: true,
};

export const useAppStore = create<AppState>((set) => ({
  isDbReady: false,
  isOnboardingComplete: false,
  isLoading: false,
  colorScheme: 'system',
  preferences: DEFAULT_PREFERENCES,

  setDbReady: (ready) => set({ isDbReady: ready }),
  setOnboardingComplete: (complete) => set({ isOnboardingComplete: complete }),
  setColorScheme: (scheme) =>
    set((s) => ({ colorScheme: scheme, preferences: { ...s.preferences, appTheme: scheme } })),
  updatePreferences: (update) =>
    set((s) => ({ preferences: { ...s.preferences, ...update } })),
  toggleGoal: (goal) =>
    set((s) => {
      const current = s.preferences.goals;
      const goals = current.includes(goal)
        ? current.filter((g) => g !== goal)
        : [...current, goal];
      return { preferences: { ...s.preferences, goals } };
    }),
  setTranslation: (translation) =>
    set((s) => ({ preferences: { ...s.preferences, preferredTranslation: translation } })),
  setLoading: (loading) => set({ isLoading: loading }),
}));
