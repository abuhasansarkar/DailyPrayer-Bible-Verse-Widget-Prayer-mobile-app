import { View, Text, Pressable, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '@/store/app.store';
import { BibleTranslation } from '@/types/verse';

// Public-domain editions only — see BibleTranslation in @/types/verse.
const TRANSLATIONS: { id: BibleTranslation; name: string; fullName: string; description: string }[] = [
  { id: 'KJV', name: 'KJV', fullName: 'King James Version', description: 'Historic and poetic. Timeless language.' },
  { id: 'WEB', name: 'WEB', fullName: 'World English Bible', description: 'Modern English update of the ASV. Easy to read.' },
  { id: 'ASV', name: 'ASV', fullName: 'American Standard Version', description: 'Accurate and literal. Excellent for study.' },
];

export default function TranslationScreen() {
  const { t } = useTranslation();
  const { preferences, setTranslation } = useAppStore();

  const handleSelect = async (id: BibleTranslation) => {
    setTranslation(id);
    try {
      const { getDb } = await import('@/db/client');
      await getDb().runAsync(
        'UPDATE user_preferences SET preferred_translation = ? WHERE id = 1',
        [id]
      );
    } catch (e) {
      console.warn('[Onboarding] Error saving translation pref:', e);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-cream dark:bg-bg-dark">
      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 120 }}>
        <Pressable onPress={router.back} className="mb-6 self-start">
          <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 15, color: '#77766F' }}>← Back</Text>
        </Pressable>

        <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 30, lineHeight: 38, letterSpacing: -0.5, color: '#292B28', marginBottom: 8 }}>
          {t('onboarding.translation.title')}
        </Text>
        <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 16, lineHeight: 24, color: '#77766F', marginBottom: 32 }}>
          {t('onboarding.translation.subtitle')}
        </Text>

        <View style={{ gap: 10 }}>
          {TRANSLATIONS.map((tr) => {
            const selected = preferences.preferredTranslation === tr.id;
            return (
              <Pressable
                key={tr.id}
                onPress={() => handleSelect(tr.id)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 14,
                  padding: 16,
                  borderRadius: 16,
                  backgroundColor: selected ? '#F2B84B18' : '#F1E6D3',
                  borderWidth: 2,
                  borderColor: selected ? '#F2B84B' : 'transparent',
                }}
              >
                {/* Abbreviation badge */}
                <View
                  style={{
                    width: 48, height: 48, borderRadius: 12,
                    backgroundColor: selected ? '#F2B84B' : '#E5D3B9',
                    alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 13, color: selected ? '#292B28' : '#77766F' }}>
                    {tr.name}
                  </Text>
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 15, color: '#292B28', marginBottom: 2 }}>
                    {tr.fullName}
                  </Text>
                  <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 13, color: '#77766F' }}>
                    {tr.description}
                  </Text>
                </View>

                <View
                  style={{
                    width: 22, height: 22, borderRadius: 11,
                    borderWidth: 2,
                    borderColor: selected ? '#F2B84B' : '#CFCFCA',
                    backgroundColor: selected ? '#F2B84B' : 'transparent',
                    alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  {selected && <Text style={{ color: '#292B28', fontSize: 13 }}>✓</Text>}
                </View>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      <View style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        paddingHorizontal: 24, paddingBottom: 40, paddingTop: 16,
        backgroundColor: '#FFF9EE', borderTopWidth: 1, borderTopColor: 'rgba(41,43,40,0.07)',
      }}>
        <Pressable
          onPress={() => router.push('/(onboarding)/reminder')}
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
