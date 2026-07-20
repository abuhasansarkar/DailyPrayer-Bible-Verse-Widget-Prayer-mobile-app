import { useEffect } from 'react';
import { View, Text, Pressable } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useAppStore } from '@/store/app.store';
import { getDb } from '@/db/client';

export default function ReadyScreen() {
  const { t } = useTranslation();
  const { preferences, setOnboardingComplete } = useAppStore();

  const scale = useSharedValue(0.6);
  const opacity = useSharedValue(0);
  const contentY = useSharedValue(30);
  const contentOpacity = useSharedValue(0);

  useEffect(() => {
    scale.value = withDelay(200, withSpring(1, { damping: 14, stiffness: 180 }));
    opacity.value = withDelay(200, withTiming(1, { duration: 500 }));
    contentY.value = withDelay(600, withTiming(0, { duration: 500 }));
    contentOpacity.value = withDelay(600, withTiming(1, { duration: 500 }));
  }, []);

  const iconStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  const contentStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
    transform: [{ translateY: contentY.value }],
  }));

  const completedGoals = preferences.goals;

  async function handleStart() {
    try {
      const db = getDb();
      await db.runAsync(
        'UPDATE user_preferences SET onboarding_complete = 1, goals = ?, preferred_translation = ? WHERE id = 1',
        [JSON.stringify(completedGoals), preferences.preferredTranslation]
      );
    } catch (e) {
      console.warn('Error saving preferences:', e);
    }
    setOnboardingComplete(true);
    router.replace('/(tabs)/');
  }

  return (
    <SafeAreaView className="flex-1 bg-cream dark:bg-bg-dark">
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>

        {/* Celebration icon */}
        <Animated.View style={[iconStyle, { marginBottom: 32 }]}>
          <View style={{
            width: 120, height: 120, borderRadius: 40, backgroundColor: '#F2B84B20',
            alignItems: 'center', justifyContent: 'center',
          }}>
            <View style={{
              width: 88, height: 88, borderRadius: 28, backgroundColor: '#F2B84B',
              alignItems: 'center', justifyContent: 'center',
            }}>
              <Text style={{ fontSize: 48 }}>🌅</Text>
            </View>
          </View>
        </Animated.View>

        <Animated.View style={[contentStyle, { alignItems: 'center', gap: 12 }]}>
          <Text style={{
            fontFamily: 'Inter_700Bold', fontSize: 32, lineHeight: 40,
            letterSpacing: -0.5, color: '#292B28', textAlign: 'center',
          }}>
            {t('onboarding.ready.title')}
          </Text>
          <Text style={{
            fontFamily: 'Inter_400Regular', fontSize: 17, lineHeight: 26,
            color: '#77766F', textAlign: 'center', paddingHorizontal: 16,
          }}>
            {t('onboarding.ready.subtitle')}
          </Text>

          {/* Goals summary */}
          {completedGoals.length > 0 && (
            <View style={{
              marginTop: 16, backgroundColor: '#F1E6D3', borderRadius: 16, padding: 16, gap: 8, width: '100%',
            }}>
              <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 13, color: '#77766F', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Your goals
              </Text>
              {completedGoals.map((goal) => (
                <View key={goal} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Text style={{ fontSize: 16 }}>✓</Text>
                  <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 15, color: '#292B28' }}>
                    {goal.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </Animated.View>
      </View>

      <View style={{ paddingHorizontal: 24, paddingBottom: 40, paddingTop: 16 }}>
        <Pressable
          onPress={handleStart}
          style={{
            height: 56, borderRadius: 20, backgroundColor: '#F2B84B',
            alignItems: 'center', justifyContent: 'center',
            shadowColor: '#F2B84B', shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.4, shadowRadius: 12, elevation: 8,
          }}
        >
          <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 17, color: '#292B28' }}>
            {t('onboarding.ready.cta')}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
