import React, { useEffect } from 'react';
import { View, ViewStyle } from 'react-native';
import Svg, { Path, Circle, Ellipse, G } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
} from 'react-native-reanimated';

export type MascotPose =
  | 'greeting'
  | 'praying'
  | 'celebrating'
  | 'thinking'
  | 'peaceful'
  | 'premium';

interface MascotProps {
  pose?: MascotPose;
  size?: number;
  animated?: boolean;
  style?: ViewStyle;
}

const AnimatedView = Animated.createAnimatedComponent(View);

export function Mascot({
  pose = 'greeting',
  size = 120,
  animated = true,
  style,
}: MascotProps) {
  const floatY = useSharedValue(0);
  const wingRotate = useSharedValue(0);
  const haloScale = useSharedValue(1);

  useEffect(() => {
    if (animated) {
      floatY.value = withRepeat(
        withSequence(
          withTiming(-6, { duration: 1800, easing: Easing.inOut(Easing.quad) }),
          withTiming(0, { duration: 1800, easing: Easing.inOut(Easing.quad) })
        ),
        -1,
        true
      );

      wingRotate.value = withRepeat(
        withSequence(
          withTiming(8, { duration: 1200, easing: Easing.inOut(Easing.sin) }),
          withTiming(-4, { duration: 1200, easing: Easing.inOut(Easing.sin) })
        ),
        -1,
        true
      );

      haloScale.value = withRepeat(
        withSequence(
          withTiming(1.08, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );
    }
  }, [animated]);

  const floatAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: floatY.value }],
  }));

  const strokeColor = '#292B28';
  const bodyColor = '#FFFFFF';
  const accentColor = '#F2B84B'; // Gold
  const sageColor = '#96AA88';

  return (
    <AnimatedView
      style={[
        { width: size, height: size, alignItems: 'center', justifyContent: 'center' },
        animated && floatAnimatedStyle,
        style,
      ]}
    >
      <Svg width={size} height={size} viewBox="0 0 120 120" fill="none">
        {/* Soft Shadow Base */}
        <Ellipse cx="60" cy="108" rx="28" ry="5" fill="rgba(41,43,40,0.08)" />

        {/* Halo / Aura */}
        {(pose === 'greeting' || pose === 'praying' || pose === 'premium') && (
          <G opacity={0.6}>
            <Circle
              cx="60"
              cy="34"
              r="24"
              stroke={accentColor}
              strokeWidth="2.5"
              strokeDasharray="4 3"
              fill="rgba(242,184,75,0.08)"
            />
          </G>
        )}

        {/* Crown accent for Premium */}
        {pose === 'premium' && (
          <G transform="translate(48, 12)">
            <Path
              d="M3 14L6 4L12 9L18 4L21 14H3Z"
              fill={accentColor}
              stroke={strokeColor}
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
            <Circle cx="6" cy="3" r="1.5" fill={accentColor} />
            <Circle cx="12" cy="7" r="1.5" fill={accentColor} />
            <Circle cx="18" cy="3" r="1.5" fill={accentColor} />
          </G>
        )}

        {/* Stars/Sparkles for Celebrating */}
        {pose === 'celebrating' && (
          <G fill={accentColor}>
            <Path d="M22 25L24 20L26 25L31 27L26 29L24 34L22 29L17 27L22 25Z" />
            <Path d="M92 22L93.5 18L95 22L99 23.5L95 25L93.5 29L92 25L88 23.5L92 22Z" />
            <Path d="M85 75L86 72L87 75L90 76L87 77L86 80L85 77L82 76L85 75Z" />
          </G>
        )}

        {/* Dove Body Tail Feathers */}
        <Path
          d="M36 76C28 82 20 80 18 74C24 74 30 72 34 68Z"
          fill={bodyColor}
          stroke={strokeColor}
          strokeWidth="2"
          strokeLinejoin="round"
        />

        {/* Main Torso */}
        <Path
          d="M40 46C40 34 50 26 60 26C70 26 80 34 80 46C80 62 76 86 60 86C44 86 40 62 40 46Z"
          fill={bodyColor}
          stroke={strokeColor}
          strokeWidth="2"
        />

        {/* Soft Cheek Blush */}
        <Circle cx="49" cy="46" r="3.5" fill="rgba(217,130,98,0.3)" />
        <Circle cx="71" cy="46" r="3.5" fill="rgba(217,130,98,0.3)" />

        {/* Beak */}
        <Path
          d="M57 47L60 54L63 47Z"
          fill={accentColor}
          stroke={strokeColor}
          strokeWidth="1.5"
          strokeLinejoin="round"
        />

        {/* Olive Branch in Beak for Peaceful / Greeting */}
        {(pose === 'greeting' || pose === 'peaceful') && (
          <G transform="translate(62, 50)">
            <Path d="M0 0C6 2 12 -2 16 -6" stroke={sageColor} strokeWidth="1.5" strokeLinecap="round" />
            <Ellipse cx="8" cy="-1" rx="3" ry="1.5" fill={sageColor} transform="rotate(-20 8 -1)" />
            <Ellipse cx="14" cy="-5" rx="3" ry="1.5" fill={sageColor} transform="rotate(-30 14 -5)" />
          </G>
        )}

        {/* Eyes according to pose */}
        {pose === 'peaceful' || pose === 'praying' ? (
          <G stroke={strokeColor} strokeWidth="2" strokeLinecap="round">
            <Path d="M47 43C49 45 52 45 54 43" />
            <Path d="M66 43C68 45 71 45 73 43" />
          </G>
        ) : pose === 'thinking' ? (
          <G>
            <Circle cx="50" cy="40" r="3" fill={strokeColor} />
            <Circle cx="70" cy="40" r="3" fill={strokeColor} />
          </G>
        ) : (
          <G>
            <Circle cx="50" cy="42" r="3" fill={strokeColor} />
            <Circle cx="70" cy="42" r="3" fill={strokeColor} />
            <Circle cx="51" cy="41" r="1" fill="#FFFFFF" />
            <Circle cx="71" cy="41" r="1" fill="#FFFFFF" />
          </G>
        )}

        {/* Wings according to pose */}
        {pose === 'praying' ? (
          <G stroke={strokeColor} strokeWidth="2" fill={bodyColor}>
            <Path d="M42 56C48 58 56 68 58 74C52 74 44 68 40 60Z" />
            <Path d="M78 56C72 58 64 68 62 74C68 74 76 68 80 60Z" />
          </G>
        ) : pose === 'celebrating' ? (
          <G stroke={strokeColor} strokeWidth="2" fill={bodyColor} strokeLinejoin="round">
            <Path d="M40 52C28 42 22 28 26 24C34 26 40 40 44 48Z" />
            <Path d="M80 52C92 42 98 28 94 24C86 26 80 40 76 48Z" />
          </G>
        ) : (
          <G stroke={strokeColor} strokeWidth="2" fill={bodyColor} strokeLinejoin="round">
            <Path d="M41 54C32 58 24 64 22 72C28 72 36 66 42 60Z" />
            <Path d="M79 54C88 58 96 64 98 72C92 72 84 66 78 60Z" />
          </G>
        )}

        {/* Feet */}
        <G stroke={strokeColor} strokeWidth="2" strokeLinecap="round">
          <Path d="M52 86V92M50 92H54" />
          <Path d="M68 86V92M66 92H70" />
        </G>
      </Svg>
    </AnimatedView>
  );
}
