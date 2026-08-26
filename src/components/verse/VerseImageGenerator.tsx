import React, { useState, useRef } from 'react';
import { View, Text, Modal, Pressable, ScrollView, StyleSheet, Share } from 'react-native';
import { router } from 'expo-router';
import * as Sharing from 'expo-sharing';
import * as Haptics from 'expo-haptics';
import { FREE_LIMITS, useIsPremium } from '@/constants/entitlements';

/** Minimal surface of react-native-view-shot's ref that this screen uses. */
type ViewShotHandle = { capture?: () => Promise<string> };

// Loaded defensively: capture is a native module, and the modal should still
// open (falling back to text sharing) if it is unavailable.
let ViewShotComponent: React.ComponentType<any> = View;
try {
  ViewShotComponent = require('react-native-view-shot').default || require('react-native-view-shot');
} catch {
  ViewShotComponent = View;
}

interface VerseImageGeneratorProps {
  visible: boolean;
  onClose: () => void;
  verseText: string;
  reference: string;
  translation?: string;
}

type ThemeId = 'gold' | 'sage' | 'terracotta' | 'dark' | 'minimal';
type AspectRatio = 'square' | 'story';
type FontStyle = 'serif' | 'sans';

const THEMES: Record<ThemeId, { name: string; bg: string; text: string; subtext: string; accent: string }> = {
  gold: { name: 'Warm Gold', bg: '#F2B84B', text: '#292B28', subtext: '#4A4843', accent: '#D98262' },
  sage: { name: 'Sage Meadow', bg: '#96AA88', text: '#FFF9EE', subtext: '#E2ECD8', accent: '#F2B84B' },
  terracotta: { name: 'Terracotta', bg: '#D98262', text: '#FFF9EE', subtext: '#F5DCD3', accent: '#F2B84B' },
  dark: { name: 'Midnight', bg: '#1E1C18', text: '#F5EDD8', subtext: '#B8AD97', accent: '#F2B84B' },
  minimal: { name: 'Editorial', bg: '#FFFFFF', text: '#292B28', subtext: '#77766F', accent: '#96AA88' },
};

export default function VerseImageGenerator({
  visible,
  onClose,
  verseText,
  reference,
  translation = 'KJV',
}: VerseImageGeneratorProps) {
  const viewShotRef = useRef<ViewShotHandle>(null);
  const isPremiumUser = useIsPremium();
  const [themeId, setThemeId] = useState<ThemeId>('gold');
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('story');
  const [fontStyle, setFontStyle] = useState<FontStyle>('serif');
  const [isExporting, setIsExporting] = useState(false);

  const theme = THEMES[themeId];

  async function handleExport() {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setIsExporting(true);

      if (viewShotRef.current && viewShotRef.current.capture) {
        const uri = await viewShotRef.current.capture();
        const isAvailable = await Sharing.isAvailableAsync();
        if (isAvailable) {
          await Sharing.shareAsync(uri, {
            mimeType: 'image/png',
            dialogTitle: `Share ${reference}`,
            UTI: 'public.png',
          });
        } else {
          await Share.share({
            message: `"${verseText}"\n— ${reference} (${translation})\n\nShared via DailyPrayer`,
          });
        }
      } else {
        await Share.share({
          message: `"${verseText}"\n— ${reference} (${translation})\n\nShared via DailyPrayer`,
        });
      }
    } catch (error) {
      console.warn('Image capture failed, falling back to text share:', error);
      await Share.share({
        message: `"${verseText}"\n— ${reference} (${translation})\n\nShared via DailyPrayer`,
      });
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <View style={styles.container}>
        {/* Top Navbar */}
        <View style={styles.navBar}>
          <Pressable onPress={onClose} style={styles.navButton}>
            <Text style={styles.navButtonText}>✕ Close</Text>
          </Pressable>
          <Text style={styles.navTitle}>Verse Card Studio</Text>
          <Pressable onPress={handleExport} disabled={isExporting} style={[styles.navButton, styles.exportButton]}>
            <Text style={styles.exportButtonText}>{isExporting ? 'Saving...' : 'Share ↗'}</Text>
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Card Snapshot View */}
          <View style={styles.previewContainer}>
            <ViewShotComponent
              ref={viewShotRef}
              options={{ format: 'png', quality: 1.0 }}
              style={[
                styles.cardCanvas,
                { backgroundColor: theme.bg },
                aspectRatio === 'story' ? styles.cardStory : styles.cardSquare,
              ]}
            >
              <View style={styles.cardHeader}>
                <Text style={[styles.appBadge, { color: theme.subtext }]}>✦ DAILY PRAYER</Text>
                <Text style={[styles.translationBadge, { color: theme.subtext }]}>{translation}</Text>
              </View>

              <View style={styles.cardBody}>
                <Text
                  style={[
                    styles.verseQuote,
                    { color: theme.text },
                    fontStyle === 'serif' ? styles.fontSerif : styles.fontSans,
                  ]}
                >
                  &quot;{verseText}&quot;
                </Text>
              </View>

              <View style={styles.cardFooter}>
                <View style={[styles.accentLine, { backgroundColor: theme.accent }]} />
                <Text style={[styles.referenceText, { color: theme.text }]}>{reference}</Text>
              </View>
            </ViewShotComponent>
          </View>

          {/* Customizer Controls */}
          <View style={styles.controlsSection}>
            {/* Theme Selector */}
            <Text style={styles.controlLabel}>Color Palette</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.themeRow}>
              {(Object.keys(THEMES) as ThemeId[]).map((tId, index) => {
                const locked = !isPremiumUser && index >= FREE_LIMITS.shareThemes;
                return (
                  <Pressable
                    key={tId}
                    onPress={() => {
                      Haptics.selectionAsync();
                      if (locked) {
                        onClose();
                        router.push('/premium');
                        return;
                      }
                      setThemeId(tId);
                    }}
                    style={[
                      styles.themeChip,
                      { backgroundColor: THEMES[tId].bg },
                      themeId === tId && styles.selectedChip,
                    ]}
                  >
                    <Text style={[styles.themeChipText, { color: THEMES[tId].text }]}>
                      {locked ? `🔒 ${THEMES[tId].name}` : THEMES[tId].name}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            {/* Format Selector */}
            <Text style={styles.controlLabel}>Card Format</Text>
            <View style={styles.toggleRow}>
              <Pressable
                onPress={() => setAspectRatio('story')}
                style={[styles.toggleTab, aspectRatio === 'story' && styles.activeTab]}
              >
                <Text style={[styles.toggleTabText, aspectRatio === 'story' && styles.activeTabText]}>
                  📱 Story (9:16)
                </Text>
              </Pressable>
              <Pressable
                onPress={() => setAspectRatio('square')}
                style={[styles.toggleTab, aspectRatio === 'square' && styles.activeTab]}
              >
                <Text style={[styles.toggleTabText, aspectRatio === 'square' && styles.activeTabText]}>
                  🖼️ Square (1:1)
                </Text>
              </Pressable>
            </View>

            {/* Font Style Selector */}
            <Text style={styles.controlLabel}>Typography Style</Text>
            <View style={styles.toggleRow}>
              <Pressable
                onPress={() => setFontStyle('serif')}
                style={[styles.toggleTab, fontStyle === 'serif' && styles.activeTab]}
              >
                <Text style={[styles.toggleTabText, fontStyle === 'serif' && styles.activeTabText]}>
                  ✍️ Classic Serif
                </Text>
              </Pressable>
              <Pressable
                onPress={() => setFontStyle('sans')}
                style={[styles.toggleTab, fontStyle === 'sans' && styles.activeTab]}
              >
                <Text style={[styles.toggleTabText, fontStyle === 'sans' && styles.activeTabText]}>
                  🔤 Modern Sans
                </Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1E1C18',
  },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 54,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2A2720',
  },
  navButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  navButtonText: {
    color: '#F5EDD8',
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
  },
  navTitle: {
    color: '#F5EDD8',
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
  },
  exportButton: {
    backgroundColor: '#F2B84B',
  },
  exportButtonText: {
    color: '#292B28',
    fontFamily: 'Inter_700Bold',
    fontSize: 14,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  previewContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
  },
  cardCanvas: {
    borderRadius: 24,
    padding: 24,
    justifyContent: 'space-between',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
  },
  cardStory: {
    width: 300,
    height: 480,
  },
  cardSquare: {
    width: 320,
    height: 320,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  appBadge: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 11,
    letterSpacing: 1.2,
  },
  translationBadge: {
    fontFamily: 'Inter_700Bold',
    fontSize: 10,
    opacity: 0.8,
  },
  cardBody: {
    flex: 1,
    justifyContent: 'center',
    marginVertical: 16,
  },
  verseQuote: {
    fontSize: 20,
    lineHeight: 32,
    textAlign: 'center',
  },
  fontSerif: {
    fontFamily: 'Lora_400Regular_Italic',
  },
  fontSans: {
    fontFamily: 'Inter_600SemiBold',
  },
  cardFooter: {
    alignItems: 'center',
    gap: 8,
  },
  accentLine: {
    width: 32,
    height: 3,
    borderRadius: 2,
  },
  referenceText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 15,
    textAlign: 'center',
  },
  controlsSection: {
    paddingHorizontal: 20,
    gap: 12,
  },
  controlLabel: {
    color: '#B8AD97',
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginTop: 8,
  },
  themeRow: {
    gap: 10,
  },
  themeChip: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedChip: {
    borderColor: '#F2B84B',
  },
  themeChipText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
  },
  toggleRow: {
    flexDirection: 'row',
    backgroundColor: '#2A2720',
    borderRadius: 16,
    padding: 4,
    gap: 4,
  },
  toggleTab: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: '#F2B84B',
  },
  toggleTabText: {
    color: '#B8AD97',
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
  },
  activeTabText: {
    color: '#292B28',
  },
});
