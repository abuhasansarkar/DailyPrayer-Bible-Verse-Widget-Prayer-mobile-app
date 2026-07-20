import React from 'react';
import { View, Text, ViewStyle, TextStyle, StyleProp } from 'react-native';

export type BadgeVariant = 'gold' | 'sage' | 'terracotta' | 'neutral';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  icon?: string;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

export function Badge({
  label,
  variant = 'gold',
  icon,
  style,
  textStyle,
}: BadgeProps) {
  const variantViewStyles: Record<BadgeVariant, ViewStyle> = {
    gold: { backgroundColor: 'rgba(242,184,75,0.18)' },
    sage: { backgroundColor: 'rgba(150,170,136,0.18)' },
    terracotta: { backgroundColor: 'rgba(217,130,98,0.18)' },
    neutral: { backgroundColor: 'rgba(41,43,40,0.08)' },
  };

  const variantTextStyles: Record<BadgeVariant, TextStyle> = {
    gold: { color: '#B88214' },
    sage: { color: '#4E6642' },
    terracotta: { color: '#A84C2C' },
    neutral: { color: '#55544E' },
  };

  return (
    <View
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          alignSelf: 'flex-start',
          paddingHorizontal: 10,
          paddingVertical: 4,
          borderRadius: 8,
          gap: 4,
        },
        variantViewStyles[variant],
        style,
      ]}
    >
      {icon && <Text style={{ fontSize: 11 }}>{icon}</Text>}
      <Text
        style={[
          {
            fontFamily: 'Inter_600SemiBold',
            fontSize: 11,
            letterSpacing: 0.3,
            textTransform: 'uppercase',
          },
          variantTextStyles[variant],
          textStyle,
        ]}
      >
        {label}
      </Text>
    </View>
  );
}
