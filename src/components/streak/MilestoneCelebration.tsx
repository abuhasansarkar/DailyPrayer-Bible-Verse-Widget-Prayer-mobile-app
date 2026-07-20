import { View, Text, Pressable, Modal } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle,
  withSpring, withDelay, withTiming, withSequence,
} from 'react-native-reanimated';
import { useEffect } from 'react';
import type { StreakMilestone } from '@/types/user';

interface MilestoneCelebrationProps {
  milestone: StreakMilestone | null;
  onDismiss: () => void;
}

export function MilestoneCelebration({ milestone, onDismiss }: MilestoneCelebrationProps) {
  const scale = useSharedValue(0.5);
  const opacity = useSharedValue(0);
  const iconScale = useSharedValue(0);
  const bgOpacity = useSharedValue(0);

  useEffect(() => {
    if (milestone) {
      bgOpacity.value = withTiming(1, { duration: 300 });
      scale.value = withDelay(100, withSpring(1, { damping: 14, stiffness: 150 }));
      opacity.value = withDelay(100, withTiming(1, { duration: 300 }));
      iconScale.value = withDelay(350, withSequence(
        withSpring(1.3, { damping: 8, stiffness: 200 }),
        withSpring(1, { damping: 12, stiffness: 180 }),
      ));
    }
  }, [milestone]);

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: iconScale.value }],
  }));

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: bgOpacity.value,
  }));

  if (!milestone) return null;

  return (
    <Modal visible transparent animationType="none" statusBarTranslucent>
      <Animated.View style={[{
        flex: 1, backgroundColor: 'rgba(0,0,0,0.6)',
        alignItems: 'center', justifyContent: 'center',
        paddingHorizontal: 32,
      }, overlayStyle]}>
        <Animated.View style={[{
          backgroundColor: '#FFF9EE',
          borderRadius: 28, padding: 36,
          alignItems: 'center', width: '100%',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 12 },
          shadowOpacity: 0.25,
          shadowRadius: 30,
          elevation: 16,
        }, cardStyle]}>
          {/* Gold accent */}
          <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: '#F2B84B', marginBottom: 24 }} />

          {/* Milestone icon */}
          <Animated.Text style={[{ fontSize: 72, marginBottom: 16 }, iconStyle]}>
            {milestone.icon}
          </Animated.Text>

          {/* Title */}
          <Text style={{
            fontFamily: 'Inter_700Bold', fontSize: 26, color: '#292B28',
            letterSpacing: -0.5, textAlign: 'center', marginBottom: 8,
          }}>
            {milestone.title}
          </Text>

          {/* Days badge */}
          <View style={{
            backgroundColor: '#F2B84B', borderRadius: 20,
            paddingHorizontal: 16, paddingVertical: 6, marginBottom: 20,
          }}>
            <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 15, color: '#292B28' }}>
              🔥 {milestone.days} days streak
            </Text>
          </View>

          {/* Message */}
          <Text style={{
            fontFamily: 'Lora_400Regular_Italic', fontSize: 16, lineHeight: 25,
            color: '#77766F', textAlign: 'center', marginBottom: 32,
          }}>
            "{milestone.message}"
          </Text>

          {/* CTA */}
          <Pressable
            onPress={onDismiss}
            style={{
              backgroundColor: '#292B28', borderRadius: 18,
              paddingVertical: 16, paddingHorizontal: 40,
              width: '100%', alignItems: 'center',
            }}
          >
            <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 16, color: '#F5EDD8' }}>
              Keep going 🙏
            </Text>
          </Pressable>

          <Pressable onPress={onDismiss} style={{ marginTop: 16, padding: 8 }}>
            <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 13, color: '#77766F' }}>
              Dismiss
            </Text>
          </Pressable>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}
