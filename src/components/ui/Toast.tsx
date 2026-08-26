import { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  runOnJS,
  Easing,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';


export type ToastVariant = 'success' | 'error' | 'info' | 'warning';

interface ToastProps {
  visible: boolean;
  message: string;
  variant?: ToastVariant;
  duration?: number;
  onHide?: () => void;
  action?: { label: string; onPress: () => void };
}

const VARIANT_META: Record<ToastVariant, { bg: string; icon: string; textColor: string }> = {
  success: { bg: '#617558', icon: '✓', textColor: '#FFFFFF' },
  error:   { bg: '#C0492B', icon: '✕', textColor: '#FFFFFF' },
  warning: { bg: '#F2B84B', icon: '⚠', textColor: '#292B28' },
  info:    { bg: '#2A2720', icon: 'ℹ', textColor: '#F5EDD8' },
};

export function Toast({
  visible,
  message,
  variant = 'success',
  duration = 3000,
  onHide,
  action,
}: ToastProps) {
  const insets = useSafeAreaInsets();
  const translateY = useSharedValue(100);
  const opacity = useSharedValue(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const meta = VARIANT_META[variant];

  function hide() {
    translateY.value = withTiming(100, { duration: 250, easing: Easing.in(Easing.cubic) });
    opacity.value = withTiming(0, { duration: 250 }, (done) => {
      if (done && onHide) runOnJS(onHide)();
    });
  }

  useEffect(() => {
    if (visible) {
      translateY.value = withSpring(0, { damping: 18, stiffness: 200 });
      opacity.value = withTiming(1, { duration: 200 });

      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(hide, duration);
    } else {
      hide();
    }
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [visible, duration]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[{
        position: 'absolute',
        bottom: insets.bottom + 16,
        left: 16, right: 16,
        zIndex: 9999,
        pointerEvents: visible ? 'box-none' : 'none',
      }, animStyle]}
    >
      <View style={{
        backgroundColor: meta.bg,
        borderRadius: 16,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingHorizontal: 16,
        paddingVertical: 14,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.18,
        shadowRadius: 12,
        elevation: 8,
      }}>
        <View style={{
          width: 28, height: 28, borderRadius: 14,
          backgroundColor: 'rgba(255,255,255,0.2)',
          alignItems: 'center', justifyContent: 'center',
        }}>
          <Text style={{ fontSize: 13, color: meta.textColor, fontFamily: 'Inter_700Bold' }}>
            {meta.icon}
          </Text>
        </View>

        <Text style={{
          flex: 1,
          fontFamily: 'Inter_500Medium',
          fontSize: 14,
          color: meta.textColor,
          lineHeight: 20,
        }}>
          {message}
        </Text>

        {action && (
          <Pressable onPress={() => { action.onPress(); hide(); }}>
            <Text style={{
              fontFamily: 'Inter_700Bold',
              fontSize: 13,
              color: meta.textColor,
              opacity: 0.85,
              textDecorationLine: 'underline',
            }}>
              {action.label}
            </Text>
          </Pressable>
        )}

        <Pressable onPress={hide} hitSlop={8}>
          <Text style={{ fontSize: 14, color: meta.textColor, opacity: 0.6, fontFamily: 'Inter_700Bold' }}>✕</Text>
        </Pressable>
      </View>
    </Animated.View>
  );
}

export function useToast() {
  const [state, setState] = useState<{
    visible: boolean;
    message: string;
    variant: ToastVariant;
    action?: { label: string; onPress: () => void };
  }>({ visible: false, message: '', variant: 'success' });

  const show = useCallback((message: string, variant: ToastVariant = 'success', action?: { label: string; onPress: () => void }) => {
    setState({ visible: true, message, variant, action });
  }, []);

  const hide = useCallback(() => {
    setState((s) => ({ ...s, visible: false }));
  }, []);

  return { toastProps: { ...state, onHide: hide }, show, hide };
}
