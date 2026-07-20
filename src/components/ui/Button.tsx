import React from 'react';
import {
  Pressable,
  Text,
  ActivityIndicator,
  StyleProp,
  ViewStyle,
  TextStyle,
  PressableProps,
} from 'react-native';
import * as Haptics from 'expo-haptics';

export type ButtonVariant = 'primary' | 'secondary' | 'terracotta' | 'outline' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends Omit<PressableProps, 'style'> {
  title: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  haptic?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export function Button({
  title,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  haptic = true,
  onPress,
  style,
  textStyle,
  leftIcon,
  rightIcon,
  ...props
}: ButtonProps) {
  const handlePress = (e: any) => {
    if (disabled || loading) return;
    if (haptic) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }
    onPress?.(e);
  };

  // Base layout styles
  const baseViewStyle: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: size === 'sm' ? 12 : size === 'lg' ? 20 : 16,
    gap: 8,
    opacity: disabled ? 0.5 : 1,
  };

  // Size padding
  const sizeStyles: Record<ButtonSize, ViewStyle> = {
    sm: { paddingHorizontal: 12, paddingVertical: 8 },
    md: { paddingHorizontal: 20, paddingVertical: 14 },
    lg: { paddingHorizontal: 24, paddingVertical: 18 },
  };

  // Variant color styles
  const variantViewStyles: Record<ButtonVariant, ViewStyle> = {
    primary: {
      backgroundColor: '#F2B84B', // Gold
      shadowColor: '#F2B84B',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.25,
      shadowRadius: 8,
      elevation: 4,
    },
    secondary: {
      backgroundColor: '#96AA88', // Sage
    },
    terracotta: {
      backgroundColor: '#D98262', // Terracotta
    },
    outline: {
      backgroundColor: 'transparent',
      borderWidth: 1.5,
      borderColor: '#F2B84B',
    },
    ghost: {
      backgroundColor: 'transparent',
    },
  };

  const baseTextStyle: TextStyle = {
    fontFamily: size === 'lg' ? 'Inter_700Bold' : 'Inter_600SemiBold',
    fontSize: size === 'sm' ? 13 : size === 'lg' ? 17 : 15,
    textAlign: 'center',
  };

  const variantTextStyles: Record<ButtonVariant, TextStyle> = {
    primary: { color: '#292B28' },
    secondary: { color: '#FFFFFF' },
    terracotta: { color: '#FFFFFF' },
    outline: { color: '#292B28' },
    ghost: { color: '#292B28' },
  };

  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled || loading}
      accessibilityRole="button"
      accessibilityLabel={props.accessibilityLabel ?? title}
      accessibilityState={{ disabled: disabled || loading }}
      style={({ pressed }) => [
        baseViewStyle,
        sizeStyles[size],
        variantViewStyles[variant],
        pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] },
        style,
      ]}
      {...props}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'primary' ? '#292B28' : '#FFFFFF'}
        />
      ) : (
        <>
          {leftIcon}
          <Text style={[baseTextStyle, variantTextStyles[variant], textStyle]}>
            {title}
          </Text>
          {rightIcon}
        </>
      )}
    </Pressable>
  );
}
