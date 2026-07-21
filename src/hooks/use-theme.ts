import { useColorScheme as useNativeColorScheme } from 'react-native';
import { Colors } from '@/constants/theme';
import { useAppStore } from '@/store/app.store';

export function useResolvedTheme() {
  const systemScheme = useNativeColorScheme();
  const { colorScheme } = useAppStore();

  const resolvedScheme =
    colorScheme === 'system' ? (systemScheme ?? 'light') : colorScheme;
  const isDark = resolvedScheme === 'dark';
  const theme = isDark ? 'dark' : 'light';

  return {
    isDark,
    theme,
    colors: Colors[theme],
    colorScheme,
  };
}

export function useTheme() {
  const { colors } = useResolvedTheme();
  return colors;
}
