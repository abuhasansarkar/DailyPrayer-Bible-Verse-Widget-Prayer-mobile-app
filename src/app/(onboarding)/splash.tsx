import { useEffect } from 'react';
import { View, Text, Dimensions } from 'react-native';
import { router } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSpring,
  Easing,
} from 'react-native-reanimated';
import { StatusBar } from 'expo-status-bar';
import { Mascot } from '@/components/mascot/Mascot';

const { width } = Dimensions.get('window');

export default function SplashScreen() {
  const bgOpacity = useSharedValue(0);
  const mascotY = useSharedValue(80);
  const mascotOpacity = useSharedValue(0);
  const mascotScale = useSharedValue(0.7);
  const logoOpacity = useSharedValue(0);
  const logoY = useSharedValue(20);
  const shimmerX = useSharedValue(-width);

  function navigateToWelcome() {
    router.replace('/(onboarding)');
  }

  useEffect(() => {
    // Background fade in
    bgOpacity.value = withTiming(1, { duration: 400 });

    // Mascot rises from bottom
    mascotOpacity.value = withDelay(200, withTiming(1, { duration: 600 }));
    mascotY.value = withDelay(200, withSpring(0, { damping: 14, stiffness: 100 }));
    mascotScale.value = withDelay(200, withSpring(1, { damping: 12, stiffness: 90 }));

    // Logo fades in
    logoOpacity.value = withDelay(700, withTiming(1, { duration: 500 }));
    logoY.value = withDelay(700, withTiming(0, { duration: 400, easing: Easing.out(Easing.cubic) }));

    // Shimmer sweep
    shimmerX.value = withDelay(900, withTiming(width * 2, { duration: 900 }));

    // Navigate after animation
    const timer = setTimeout(() => navigateToWelcome(), 2400);
    return () => clearTimeout(timer);
  }, []);

  const bgStyle = useAnimatedStyle(() => ({ opacity: bgOpacity.value }));
  const mascotStyle = useAnimatedStyle(() => ({
    opacity: mascotOpacity.value,
    transform: [{ translateY: mascotY.value }, { scale: mascotScale.value }],
  }));
  const logoStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ translateY: logoY.value }],
  }));
  const shimmerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shimmerX.value }],
  }));

  return (
    <View style={{ flex: 1, backgroundColor: '#FFF9EE' }}>
      <StatusBar style="dark" />

      {/* Animated background */}
      <Animated.View style={[{ flex: 1, alignItems: 'center', justifyContent: 'center' }, bgStyle]}>
        {/* Subtle radial glow behind mascot */}
        <View style={{
          position: 'absolute',
          width: 280, height: 280,
          borderRadius: 140,
          backgroundColor: '#F2B84B',
          opacity: 0.08,
          top: '50%',
          marginTop: -200,
        }} />

        {/* Mascot rising */}
        <Animated.View style={[mascotStyle, { marginBottom: 24 }]}>
          <Mascot pose="greeting" size={150} />
        </Animated.View>

        {/* App name + tagline */}
        <Animated.View style={[logoStyle, { alignItems: 'center' }]}>
          {/* Gold accent bar */}
          <View style={{
            width: 40, height: 3, borderRadius: 2,
            backgroundColor: '#F2B84B', marginBottom: 14,
          }} />

          <Text style={{
            fontFamily: 'Inter_700Bold',
            fontSize: 32,
            color: '#292B28',
            letterSpacing: -0.5,
          }}>
            DailyPrayer
          </Text>

          <Text style={{
            fontFamily: 'Lora_400Regular_Italic',
            fontSize: 15,
            color: '#77766F',
            marginTop: 6,
            textAlign: 'center',
          }}>
            A quiet moment with God, every day
          </Text>
        </Animated.View>

        {/* Shimmer effect over the logo area */}
        <View
          style={{
            position: 'absolute',
            bottom: 0, left: 0, right: 0, top: 0,
            overflow: 'hidden',
            pointerEvents: 'none',
          }}
        >
          <Animated.View
            style={[
              shimmerStyle,
              {
                position: 'absolute',
                top: 0, bottom: 0,
                width: 80,
                backgroundColor: 'rgba(242,184,75,0.08)',
                transform: [{ skewX: '-20deg' }],
              },
            ]}
          />
        </View>
      </Animated.View>

      {/* Bottom version */}
      <View style={{ paddingBottom: 32, alignItems: 'center' }}>
        <Text style={{
          fontFamily: 'Inter_400Regular',
          fontSize: 11,
          color: '#77766F',
          opacity: 0.5,
          letterSpacing: 0.5,
        }}>
          v1.0.0
        </Text>
      </View>
    </View>
  );
}
