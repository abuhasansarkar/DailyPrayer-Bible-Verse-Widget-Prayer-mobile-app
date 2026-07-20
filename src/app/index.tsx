import { View } from 'react-native';
import { Redirect } from 'expo-router';
import { useAppStore } from '@/store/app.store';

// Root entry point — redirect based on onboarding state.
// We must wait for isDbReady before redirecting because isOnboardingComplete
// starts as false (store default) and is only set correctly after DB is loaded.
// Without this gate, returning users would briefly see the onboarding flow.
export default function Index() {
  const { isOnboardingComplete, isDbReady } = useAppStore();

  // Splash screen is still visible while DB initialises — render nothing here.
  if (!isDbReady) {
    return <View style={{ flex: 1, backgroundColor: '#FFF9EE' }} />;
  }

  if (isOnboardingComplete) {
    return <Redirect href="/(tabs)" />;
  }

  return <Redirect href="/(onboarding)/splash" />;
}
