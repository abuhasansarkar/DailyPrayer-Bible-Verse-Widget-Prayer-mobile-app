import { Redirect } from 'expo-router';
import { useAppStore } from '@/store/app.store';

// Catch-all route for unmatched paths (e.g. Expo Go deep link /--/)
export default function NotFoundScreen() {
  const { isOnboardingComplete } = useAppStore();

  if (isOnboardingComplete) {
    return <Redirect href="/(tabs)" />;
  }

  return <Redirect href="/(onboarding)/splash" />;
}
