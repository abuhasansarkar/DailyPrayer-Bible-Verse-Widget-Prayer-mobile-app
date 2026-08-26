import { View, Text, ScrollView, Pressable, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { useJournal } from '@/hooks/use-journal';
import { Toast, useToast } from '@/components/ui/Toast';
import { useState } from 'react';
import { useResolvedTheme } from '@/hooks/use-theme';

const GRATITUDE_PROMPTS = [
  'What made you smile today?',
  'Who are you grateful for right now?',
  "What's a small blessing you noticed?",
  'What strength did God give you today?',
  'What beauty did you encounter?',
];

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'short', month: 'short', day: 'numeric',
    });
  } catch { return dateStr; }
}

export default function GratitudeScreen() {
  const { isDark } = useResolvedTheme();
  const { gratitude, loading, addGratitude } = useJournal();
  const { toastProps, show } = useToast();

  const [prompts] = useState(() =>
    [...GRATITUDE_PROMPTS].sort(() => Math.random() - 0.5).slice(0, 3)
  );
  const [text1, setText1] = useState('');
  const [text2, setText2] = useState('');
  const [text3, setText3] = useState('');
  const [saving, setSaving] = useState(false);

  const bg = isDark ? '#1E1C18' : '#FFF9EE';
  const cardBg = isDark ? '#332F26' : '#FFFFFF';
  const surfaceBg = isDark ? '#2A3022' : '#E2EAE0';
  const textPrimary = isDark ? '#F5EDD8' : '#1E2E1A';
  const textSecondary = isDark ? '#A8BFA1' : '#4A6A42';
  const accent = isDark ? '#A8BFA1' : '#617558';

  const handleSave = async () => {
    const items = [text1, text2, text3].map((t) => t.trim()).filter(Boolean);
    if (items.length === 0) {
      show("Write at least one thing you're grateful for", 'warning');
      return;
    }
    setSaving(true);
    await addGratitude(items);
    setText1(''); setText2(''); setText3('');
    show('Gratitude saved! 🙏', 'success');
    setSaving(false);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: bg }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <Animated.View entering={FadeInDown.duration(400)} style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <Pressable
              onPress={() => router.back()}
              style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: surfaceBg, alignItems: 'center', justifyContent: 'center' }}
            >
              <Text style={{ fontSize: 18, color: textSecondary }}>‹</Text>
            </Pressable>
            <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 26, color: textPrimary, letterSpacing: -0.4, flex: 1 }}>
              Gratitude
            </Text>
          </View>
          <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 15, color: textSecondary, lineHeight: 22, paddingLeft: 4 }}>
            &quot;Give thanks in all circumstances.&quot; — 1 Thess 5:18
          </Text>
        </Animated.View>

        {/* Entry form */}
        <Animated.View
          entering={FadeInDown.duration(400).delay(100)}
          style={{ marginHorizontal: 20, marginTop: 16, backgroundColor: surfaceBg, borderRadius: 20, padding: 20, gap: 16 }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Text style={{ fontSize: 22 }}>✨</Text>
            <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 16, color: textPrimary }}>
              Today I&apos;m grateful for...
            </Text>
          </View>

          {[{ value: text1, set: setText1, prompt: prompts[0] },
            { value: text2, set: setText2, prompt: prompts[1] },
            { value: text3, set: setText3, prompt: prompts[2] }].map((item, i) => (
            <View key={i} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
              <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: `${accent}22`, alignItems: 'center', justifyContent: 'center', marginTop: 4 }}>
                <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 12, color: accent }}>{i + 1}</Text>
              </View>
              <TextInput
                value={item.value}
                onChangeText={item.set}
                placeholder={item.prompt}
                placeholderTextColor={isDark ? '#4A6A42' : '#96AA88'}
                multiline
                style={{
                  flex: 1,
                  fontFamily: 'Inter_400Regular',
                  fontSize: 15,
                  color: textPrimary,
                  lineHeight: 22,
                  minHeight: 44,
                  textAlignVertical: 'top',
                  paddingTop: 4,
                }}
              />
            </View>
          ))}

          <Pressable
            onPress={handleSave}
            disabled={saving}
            style={{
              backgroundColor: accent, borderRadius: 14, paddingVertical: 14,
              alignItems: 'center', opacity: saving ? 0.7 : 1, marginTop: 4,
            }}
          >
            <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 15, color: '#FFFFFF' }}>
              {saving ? 'Saving…' : 'Save Gratitude 🙏'}
            </Text>
          </Pressable>
        </Animated.View>

        {/* History */}
        {gratitude.length > 0 && (
          <Animated.View entering={FadeInDown.duration(400).delay(200)} style={{ paddingHorizontal: 20, marginTop: 28 }}>
            <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 17, color: textPrimary, marginBottom: 14 }}>
              Recent Gratitude
            </Text>
            <View style={{ gap: 10 }}>
              {gratitude.slice(0, 10).map((entry) => (
                <View key={entry.id} style={{
                  backgroundColor: cardBg, borderRadius: 16, padding: 16,
                  shadowColor: '#292B28', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1,
                }}>
                  <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 11, color: textSecondary, marginBottom: 10 }}>
                    {formatDate(entry.created_at)}
                  </Text>
                  {entry.items.map((item: string, i: number) => (
                    <View key={i} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: i < entry.items.length - 1 ? 8 : 0 }}>
                      <Text style={{ color: '#96AA88', fontSize: 12, marginTop: 2 }}>✓</Text>
                      <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 14, color: textPrimary, lineHeight: 20, flex: 1 }}>
                        {item}
                      </Text>
                    </View>
                  ))}
                </View>
              ))}
            </View>
          </Animated.View>
        )}

        {!loading && gratitude.length === 0 && (
          <Animated.View entering={FadeInDown.duration(400).delay(200)} style={{ paddingVertical: 32, alignItems: 'center', gap: 6 }}>
            <Text style={{ fontSize: 40 }}>🌱</Text>
            <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 14, color: textSecondary, textAlign: 'center', paddingHorizontal: 32 }}>
              Your gratitude journal will grow here each day
            </Text>
          </Animated.View>
        )}
      </ScrollView>

      <Toast {...toastProps} />
    </SafeAreaView>
  );
}
