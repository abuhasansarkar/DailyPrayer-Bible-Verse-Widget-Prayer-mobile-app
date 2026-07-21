import React from 'react';
import { View, Text, Modal, Pressable, StyleSheet } from 'react-native';
import Animated, { ZoomIn, FadeInUp } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

interface MascotCelebrationProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  badgeName?: string;
  badgeEmoji?: string;
}

export default function MascotCelebration({
  visible,
  onClose,
  title = 'Prayer Completed!',
  subtitle = 'May peace rest upon your heart and direct your path today.',
  badgeName,
  badgeEmoji = '🏆',
}: MascotCelebrationProps) {
  function handleDismiss() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onClose();
  }

  return (
    <Modal visible={visible} animationType="fade" transparent={true} onRequestClose={handleDismiss}>
      <View style={styles.overlay}>
        <Animated.View entering={ZoomIn.duration(400)} style={styles.card}>
          {/* Mascot Header */}
          <View style={styles.avatarCircle}>
            <Text style={{ fontSize: 48 }}>{badgeName ? badgeEmoji : '🕊️'}</Text>
          </View>

          <Text style={styles.titleText}>{title}</Text>
          {badgeName && (
            <View style={styles.badgePill}>
              <Text style={styles.badgeText}>Badge Unlocked: {badgeName}</Text>
            </View>
          )}

          <Text style={styles.subtitleText}>{subtitle}</Text>

          <Animated.View entering={FadeInUp.delay(200)}>
            <Pressable onPress={handleDismiss} style={styles.actionButton}>
              <Text style={styles.actionButtonText}>Amen & Continue</Text>
            </Pressable>
          </Animated.View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(30, 28, 24, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  card: {
    width: '100%',
    backgroundColor: '#FFF9EE',
    borderRadius: 28,
    padding: 28,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 10,
  },
  avatarCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#F2B84B33',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    borderWidth: 3,
    borderColor: '#F2B84B',
  },
  titleText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 22,
    color: '#292B28',
    textAlign: 'center',
    marginBottom: 8,
  },
  badgePill: {
    backgroundColor: '#F2B84B',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    marginBottom: 12,
  },
  badgeText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 12,
    color: '#292B28',
  },
  subtitleText: {
    fontFamily: 'Lora_400Regular_Italic',
    fontSize: 16,
    lineHeight: 24,
    color: '#77766F',
    textAlign: 'center',
    marginBottom: 24,
  },
  actionButton: {
    backgroundColor: '#F2B84B',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 20,
  },
  actionButtonText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 15,
    color: '#292B28',
  },
});
