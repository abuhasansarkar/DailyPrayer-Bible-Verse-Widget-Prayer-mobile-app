import { useEffect } from 'react';
import {
  View, Text, Pressable, Modal, Dimensions, TouchableWithoutFeedback,
} from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle,
  withSpring, withTiming, runOnJS, Easing,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useResolvedTheme } from '@/hooks/use-theme';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface BottomSheetProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  snapPoint?: number; // height as fraction of screen, e.g. 0.5
  showHandle?: boolean;
}

export function BottomSheet({
  visible,
  onClose,
  title,
  children,
  snapPoint = 0.5,
  showHandle = true,
}: BottomSheetProps) {
  const insets = useSafeAreaInsets();
  const { isDark } = useResolvedTheme();

  const sheetHeight = SCREEN_HEIGHT * snapPoint;
  const translateY = useSharedValue(sheetHeight);
  const overlayOpacity = useSharedValue(0);

  function close() {
    translateY.value = withTiming(sheetHeight, { duration: 280, easing: Easing.in(Easing.cubic) });
    overlayOpacity.value = withTiming(0, { duration: 250 }, (done) => {
      if (done) runOnJS(onClose)();
    });
  }

  useEffect(() => {
    if (visible) {
      translateY.value = withSpring(0, { damping: 20, stiffness: 180 });
      overlayOpacity.value = withTiming(1, { duration: 250 });
    } else {
      close();
    }
  }, [visible]);

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: overlayOpacity.value,
  }));

  const bg = isDark ? '#2A2720' : '#FFFFFF';
  const textPrimary = isDark ? '#F5EDD8' : '#292B28';
  const handleColor = isDark ? '#4A4640' : '#D5C9B8';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={close}
    >
      <View style={{ flex: 1 }}>
        {/* Overlay */}
        <TouchableWithoutFeedback onPress={close}>
          <Animated.View style={[{
            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
          }, overlayStyle]} />
        </TouchableWithoutFeedback>

        {/* Sheet */}
        <Animated.View style={[{
          position: 'absolute',
          bottom: 0, left: 0, right: 0,
          height: sheetHeight,
          backgroundColor: bg,
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          paddingBottom: insets.bottom,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.15,
          shadowRadius: 20,
          elevation: 12,
        }, sheetStyle]}>
          {/* Handle */}
          {showHandle && (
            <View style={{ alignItems: 'center', paddingTop: 12, paddingBottom: 8 }}>
              <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: handleColor }} />
            </View>
          )}

          {/* Title */}
          {title && (
            <View style={{
              paddingHorizontal: 20,
              paddingBottom: 16,
              borderBottomWidth: 1,
              borderBottomColor: isDark ? 'rgba(245,237,216,0.08)' : 'rgba(41,43,40,0.06)',
            }}>
              <Text style={{
                fontFamily: 'Inter_600SemiBold',
                fontSize: 17,
                color: textPrimary,
                textAlign: 'center',
              }}>
                {title}
              </Text>
            </View>
          )}

          {/* Content */}
          <View style={{ flex: 1, paddingHorizontal: 20, paddingTop: title ? 16 : 8 }}>
            {children}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}
