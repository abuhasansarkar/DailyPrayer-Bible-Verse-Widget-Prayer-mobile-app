import React, { useState } from 'react';
import { View, Pressable, StyleSheet, Text, useColorScheme } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Sparkles } from '@/components/ui/LucideIcons';
import { AiAssistantModal } from './AiAssistantModal';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function FloatingAiButton() {
  const isDark = useColorScheme() === 'dark';
  const [modalVisible, setModalVisible] = useState(false);
  const scale = useSharedValue(1);
  const glowOpacity = useSharedValue(0.4);

  React.useEffect(() => {
    glowOpacity.value = withRepeat(
      withSequence(
        withTiming(0.8, { duration: 1500 }),
        withTiming(0.3, { duration: 1500 })
      ),
      -1,
      true
    );
  }, [glowOpacity]);

  const onPressIn = () => {
    scale.value = withSpring(0.92, { damping: 12, stiffness: 200 });
  };

  const onPressOut = () => {
    scale.value = withSpring(1, { damping: 12, stiffness: 200 });
  };

  const handlePress = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setModalVisible(true);
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  return (
    <>
      <View pointerEvents="box-none" style={styles.container}>
        <Animated.View style={[styles.glowRing, glowStyle]} />
        <AnimatedPressable
          onPress={handlePress}
          onPressIn={onPressIn}
          onPressOut={onPressOut}
          style={[styles.button, animatedStyle]}
          accessibilityLabel="Open AI Prayer Assistant"
          accessibilityRole="button"
        >
          <View style={styles.iconContainer}>
            <Sparkles size={22} color="#292B28" />
          </View>
          <Text style={styles.btnText}>AI</Text>
        </AnimatedPressable>
      </View>

      <AiAssistantModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 94,
    right: 18,
    zIndex: 9999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glowRing: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#F2B84B',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#F2B84B',
    paddingHorizontal: 15,
    paddingVertical: 11,
    borderRadius: 28,
    shadowColor: '#292B28',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 1.5,
    borderColor: '#FFF',
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnText: {
    color: '#292B28',
    fontWeight: '800',
    fontSize: 13,
    letterSpacing: 0.5,
  },
});
