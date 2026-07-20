import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { router } from 'expo-router';

interface StreakBadgeProps {
  count: number;
  label?: string;
  onPress?: () => void;
}

export function StreakBadge({ count, label = 'days', onPress }: StreakBadgeProps) {
  return (
    <Pressable
      onPress={onPress ?? (() => router.push('/(tabs)'))}
      style={({ pressed }) => [
        styles.container,
        pressed && { opacity: 0.8 },
      ]}
    >
      <Text style={styles.icon}>🔥</Text>
      <Text style={styles.count}>{count}</Text>
      {label ? <Text style={styles.label}>{label}</Text> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2B84B20',
    borderWidth: 1.5,
    borderColor: '#F2B84B',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    gap: 4,
  },
  icon: {
    fontSize: 14,
  },
  count: {
    fontFamily: 'Inter_700Bold',
    fontSize: 14,
    color: '#D98262',
  },
  label: {
    fontFamily: 'Inter_500Medium',
    fontSize: 11,
    color: '#77766F',
  },
});
