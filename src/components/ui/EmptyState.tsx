import React from 'react';
import { View, Text, StyleSheet, useColorScheme } from 'react-native';
import { Mascot, MascotPose } from '@/components/mascot/Mascot';
import { Button } from './Button';
import { useAppStore } from '@/store/app.store';

interface EmptyStateProps {
  title: string;
  description?: string;
  pose?: MascotPose;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({
  title,
  description,
  pose = 'peaceful',
  actionLabel,
  onAction,
}: EmptyStateProps) {
  const systemScheme = useColorScheme();
  const { colorScheme } = useAppStore();
  const isDark = (colorScheme === 'system' ? systemScheme : colorScheme) === 'dark';

  const textPrimary = isDark ? '#F5EDD8' : '#292B28';
  const textSecondary = isDark ? '#B8AD97' : '#77766F';

  return (
    <View style={styles.container}>
      <Mascot pose={pose} size={110} />
      <Text style={[styles.title, { color: textPrimary }]}>{title}</Text>
      {description ? (
        <Text style={[styles.description, { color: textSecondary }]}>
          {description}
        </Text>
      ) : null}
      {actionLabel && onAction ? (
        <Button
          title={actionLabel}
          onPress={onAction}
          variant="primary"
          size="md"
          style={{ marginTop: 16 }}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 8,
  },
  title: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 18,
    textAlign: 'center',
    marginTop: 12,
  },
  description: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 280,
  },
});
