import { Redirect } from 'expo-router';
import { useAppStore } from '@/store/app.store';

// Root entry point — redirect based on onboarding state
export default function Index() {
  const { isOnboardingComplete } = useAppStore();

  if (isOnboardingComplete) {
    return <Redirect href="/(tabs)/" />;
  }

  return <Redirect href="/(onboarding)/" />;
}
