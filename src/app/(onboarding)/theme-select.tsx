import { View, Text, Pressable } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '@/store/app.store';
import { AppTheme } from '@/types/user';

const THEMES: { id: AppTheme; label: string; icon: string; bg: string; surface: string; text: string }[] = [
  { id: 'light', label: 'Light', icon: '☀️', bg: '#FFF9EE', surface: '#F1E6D3', text: '#292B28' },
  { id: 'dark', label: 'Dark', icon: '🌙', bg: '#1E1C18', surface: '#2A2720', text: '#F5EDD8' },
  { id: 'system', label: 'System', icon: '⚙️', bg: '#FFFFFF', surface: '#F0F0F0', text: '#292B28' },
];

export default function ThemeSelectScreen() {
  const { t } = useTranslation();
  const { colorScheme, setColorScheme } = useAppStore();

  return (
    <SafeAreaView className="flex-1 bg-cream dark:bg-bg-dark">
      <View style={{ flex: 1, padding: 24 }}>
        <Pressable onPress={router.back} style={{ marginBottom: 24, alignSelf: 'flex-start' }}>
          <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 15, color: '#77766F' }}>← Back</Text>
        </Pressable>

        <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 30, lineHeight: 38, letterSpacing: -0.5, color: '#292B28', marginBottom: 8 }}>
          {t('onboarding.theme.title')}
        </Text>
        <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 16, lineHeight: 24, color: '#77766F', marginBottom: 40 }}>
          You can change this any time in settings.
        </Text>

        {/* Theme cards */}
        <View style={{ gap: 16 }}>
          {THEMES.map((theme) => {
            const selected = colorScheme === theme.id;
            return (
              <Pressable
                key={theme.id}
                onPress={() => setColorScheme(theme.id)}
                style={{
                  borderRadius: 20,
                  borderWidth: 2,
                  borderColor: selected ? '#F2B84B' : 'transparent',
                  overflow: 'hidden',
                }}
              >
                {/* Preview mini phone */}
                <View style={{ backgroundColor: theme.bg, padding: 20, gap: 10 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <Text style={{ fontSize: 22 }}>{theme.icon}</Text>
                    <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 16, color: theme.text }}>
                      {theme.label}
                    </Text>
                    {selected && (
                      <View style={{
                        marginLeft: 'auto', width: 24, height: 24, borderRadius: 12,
                        backgroundColor: '#F2B84B', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <Text style={{ color: '#292B28', fontSize: 13 }}>✓</Text>
                      </View>
                    )}
                  </View>
                  {/* Mini verse preview */}
                  <View style={{ backgroundColor: theme.surface, padding: 12, borderRadius: 12 }}>
                    <Text style={{ fontFamily: 'Lora_400Regular', fontSize: 13, color: theme.text, lineHeight: 20, fontStyle: 'italic' }}>
                      &quot;For I know the plans I have for you...&quot;
                    </Text>
                    <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 11, color: theme.text, opacity: 0.6, marginTop: 4 }}>
                      Jeremiah 29:11
                    </Text>
                  </View>
                </View>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* CTA */}
      <View style={{
        paddingHorizontal: 24, paddingBottom: 40, paddingTop: 16,
        backgroundColor: '#FFF9EE', borderTopWidth: 1, borderTopColor: 'rgba(41,43,40,0.07)',
      }}>
        <Pressable
          onPress={() => router.push('/(onboarding)/ready')}
          style={{ height: 56, borderRadius: 20, backgroundColor: '#F2B84B', alignItems: 'center', justifyContent: 'center' }}
        >
          <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 17, color: '#292B28' }}>
            {t('common.continue')}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
