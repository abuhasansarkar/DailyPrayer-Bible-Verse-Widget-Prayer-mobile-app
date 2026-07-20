import { Stack } from 'expo-router';
import { useColorScheme } from 'react-native';
import { useAppStore } from '@/store/app.store';

export default function OnboardingLayout() {
  const systemScheme = useColorScheme();
  const { colorScheme } = useAppStore();
  const isDark = (colorScheme === 'system' ? systemScheme : colorScheme) === 'dark';

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: isDark ? '#1E1C18' : '#FFF9EE' },
        animation: 'slide_from_right',
      }}
    />
  );
}
