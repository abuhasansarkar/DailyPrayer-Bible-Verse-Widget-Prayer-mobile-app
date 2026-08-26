import { Pressable, useColorScheme } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useAppStore } from '@/store/app.store';
import * as Haptics from 'expo-haptics';

interface ToggleProps {
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
  size?: 'sm' | 'md';
}

export function Toggle({ value, onValueChange, disabled = false, size = 'md' }: ToggleProps) {
  const systemScheme = useColorScheme();
  const { colorScheme } = useAppStore();
  const isDark = (colorScheme === 'system' ? systemScheme : colorScheme) === 'dark';

  const trackWidth = size === 'sm' ? 40 : 50;
  const trackHeight = size === 'sm' ? 22 : 28;
  const thumbSize = size === 'sm' ? 16 : 22;
  const thumbTravel = trackWidth - thumbSize - 4;

  const progress = useSharedValue(value ? 1 : 0);

  const thumbStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: withSpring(progress.value * thumbTravel, { damping: 18, stiffness: 200 }) }],
  }));

  const trackStyle = useAnimatedStyle(() => ({
    backgroundColor: withTiming(
      progress.value > 0.5
        ? '#F2B84B'
        : isDark ? '#3A3028' : '#D5C9B8',
      { duration: 150 }
    ),
  }));

  const handlePress = () => {
    if (disabled) return;
    const next = !value;
    progress.value = next ? 1 : 0;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    onValueChange(next);
  };

  return (
    <Pressable onPress={handlePress} disabled={disabled} hitSlop={8}>
      <Animated.View style={[{
        width: trackWidth, height: trackHeight,
        borderRadius: trackHeight / 2,
        padding: 3,
        justifyContent: 'center',
        opacity: disabled ? 0.4 : 1,
      }, trackStyle]}>
        <Animated.View style={[{
          width: thumbSize, height: thumbSize,
          borderRadius: thumbSize / 2,
          backgroundColor: '#FFFFFF',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.2,
          shadowRadius: 2,
          elevation: 2,
        }, thumbStyle]} />
      </Animated.View>
    </Pressable>
  );
}
