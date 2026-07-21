import React from 'react';
import { View, ViewProps, StyleProp, ViewStyle } from 'react-native';
import { useResolvedTheme } from '@/hooks/use-theme';

export type CardVariant = 'default' | 'elevated' | 'outlined' | 'accent';

interface CardProps extends ViewProps {
  variant?: CardVariant;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
}

export function Card({ variant = 'default', style, children, ...props }: CardProps) {
  const { isDark } = useResolvedTheme();

  const cardBg = isDark ? '#332F26' : '#FFFFFF';
  const borderColor = isDark ? '#423D32' : '#E8DFD1';

  const variantStyles: Record<CardVariant, ViewStyle> = {
    default: {
      backgroundColor: cardBg,
      borderRadius: 20,
      padding: 20,
    },
    elevated: {
      backgroundColor: cardBg,
      borderRadius: 20,
      padding: 20,
      shadowColor: '#292B28',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: isDark ? 0.3 : 0.06,
      shadowRadius: 12,
      elevation: 4,
    },
    outlined: {
      backgroundColor: cardBg,
      borderRadius: 20,
      padding: 20,
      borderWidth: 1,
      borderColor: borderColor,
    },
    accent: {
      backgroundColor: '#F2B84B',
      borderRadius: 24,
      padding: 24,
      shadowColor: '#F2B84B',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.25,
      shadowRadius: 16,
      elevation: 6,
    },
  };

  return (
    <View style={[variantStyles[variant], style]} {...props}>
      {children}
    </View>
  );
}
