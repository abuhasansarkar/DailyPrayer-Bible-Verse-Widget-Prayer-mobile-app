import { useEffect } from 'react';
import { View, Text, Pressable, Image } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSpring,
  Easing,
} from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import { StatusBar } from 'expo-status-bar';

export default function WelcomeScreen() {
  const { t } = useTranslation();

  const logoOpacity = useSharedValue(0);
  const logoY = useSharedValue(30);
  const titleOpacity = useSharedValue(0);
  const titleY = useSharedValue(20);
  const subtitleOpacity = useSharedValue(0);
  const btnOpacity = useSharedValue(0);
  const btnY = useSharedValue(20);

  useEffect(() => {
    logoOpacity.value = withDelay(200, withTiming(1, { duration: 700 }));
    logoY.value = withDelay(200, withSpring(0, { damping: 18, stiffness: 120 }));
    titleOpacity.value = withDelay(600, withTiming(1, { duration: 600 }));
    titleY.value = withDelay(600, withTiming(0, { duration: 500, easing: Easing.out(Easing.cubic) }));
    subtitleOpacity.value = withDelay(900, withTiming(1, { duration: 600 }));
    btnOpacity.value = withDelay(1200, withTiming(1, { duration: 500 }));
    btnY.value = withDelay(1200, withTiming(0, { duration: 400, easing: Easing.out(Easing.cubic) }));
  }, []);

  const logoStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ translateY: logoY.value }],
  }));
  const titleStyle = useAnimatedStyle(() => ({
    opacity: titleOpacity.value,
    transform: [{ translateY: titleY.value }],
  }));
  const subtitleStyle = useAnimatedStyle(() => ({ opacity: subtitleOpacity.value }));
  const btnStyle = useAnimatedStyle(() => ({
    opacity: btnOpacity.value,
    transform: [{ translateY: btnY.value }],
  }));

  return (
    <SafeAreaView className="flex-1 bg-cream dark:bg-bg-dark">
      <StatusBar style="dark" />
      <View className="flex-1 items-center justify-between px-6 pb-10 pt-8">

        {/* Top accent line */}
        <View className="w-10 h-1 rounded-pill bg-gold opacity-50 self-center mt-4" />

        {/* Mascot / Logo area */}
        <View className="flex-1 items-center justify-center">
          <Animated.View style={logoStyle} className="items-center">
            {/* Logo mark */}
            <View className="w-24 h-24 rounded-3xl bg-gold/20 items-center justify-center mb-6">
              <View className="w-16 h-16 rounded-2xl bg-gold items-center justify-center">
                <Text style={{ fontSize: 36 }}>☀️</Text>
              </View>
            </View>

            {/* Wordmark */}
            <Text
              className="text-2xl font-bold text-charcoal dark:text-cream tracking-tight"
              style={{ fontFamily: 'Inter_700Bold' }}
            >
              DailyPrayer
            </Text>
          </Animated.View>
        </View>

        {/* Hero copy */}
        <View className="items-center w-full mb-12">
          <Animated.Text
            style={titleStyle}
            className="text-display-sm font-bold text-charcoal dark:text-cream text-center leading-tight mb-4"
            style={[{ fontFamily: 'Inter_700Bold', fontSize: 30, lineHeight: 38, letterSpacing: -0.5, textAlign: 'center' }]}
          >
            {t('onboarding.welcome.title')}
          </Animated.Text>

          <Animated.Text
            style={subtitleStyle}
            className="text-body-lg text-charcoal-400 dark:text-cream/60 text-center px-4"
            style={[{ fontFamily: 'Inter_400Regular', fontSize: 17, lineHeight: 26, textAlign: 'center', color: '#77766F' }]}
          >
            {t('onboarding.welcome.subtitle')}
          </Animated.Text>
        </View>

        {/* CTAs */}
        <Animated.View style={btnStyle} className="w-full gap-3">
          <Pressable
            onPress={() => router.push('/(onboarding)/goals')}
            className="w-full h-14 rounded-2xl bg-gold items-center justify-center active:scale-95"
            style={{ borderRadius: 20 }}
          >
            <Text
              className="text-charcoal font-semibold text-title-lg"
              style={{ fontFamily: 'Inter_600SemiBold', fontSize: 17, color: '#292B28' }}
            >
              {t('onboarding.welcome.cta')}
            </Text>
          </Pressable>

          <Pressable
            onPress={() => router.push('/(tabs)/')}
            className="w-full h-12 items-center justify-center"
          >
            <Text
              className="text-charcoal-400 text-body-md"
              style={{ fontFamily: 'Inter_400Regular', fontSize: 15, color: '#77766F' }}
            >
              {t('onboarding.welcome.signIn')}
            </Text>
          </Pressable>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}
