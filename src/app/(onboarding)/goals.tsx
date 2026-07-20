import { View, Text, Pressable, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '@/store/app.store';
import { GOAL_META, SpiritualGoal } from '@/types/user';

const GOALS: SpiritualGoal[] = [
  'morning-devotion',
  'evening-reflection',
  'bible-reading',
  'daily-prayer',
  'gratitude',
  'verse-memorization',
  'faith-journaling',
];

export default function GoalsScreen() {
  const { t } = useTranslation();
  const { preferences, toggleGoal } = useAppStore();

  return (
    <SafeAreaView className="flex-1 bg-cream dark:bg-bg-dark">
      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 120 }}>
        {/* Back */}
        <Pressable onPress={router.back} className="mb-6 self-start">
          <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 15, color: '#77766F' }}>← Back</Text>
        </Pressable>

        {/* Header */}
        <Text
          style={{ fontFamily: 'Inter_700Bold', fontSize: 30, lineHeight: 38, letterSpacing: -0.5, color: '#292B28', marginBottom: 8 }}
        >
          {t('onboarding.goals.title')}
        </Text>
        <Text
          style={{ fontFamily: 'Inter_400Regular', fontSize: 16, lineHeight: 24, color: '#77766F', marginBottom: 32 }}
        >
          {t('onboarding.goals.subtitle')}
        </Text>

        {/* Goal cards */}
        <View style={{ gap: 12 }}>
          {GOALS.map((goal) => {
            const meta = GOAL_META[goal];
            const selected = preferences.goals.includes(goal);
            return (
              <Pressable
                key={goal}
                onPress={() => toggleGoal(goal)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 16,
                  padding: 16,
                  borderRadius: 16,
                  backgroundColor: selected ? '#F2B84B20' : '#F1E6D3',
                  borderWidth: 2,
                  borderColor: selected ? '#F2B84B' : 'transparent',
                }}
              >
                <Text style={{ fontSize: 28 }}>{meta.icon}</Text>
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      fontFamily: 'Inter_600SemiBold',
                      fontSize: 16,
                      color: '#292B28',
                      marginBottom: 2,
                    }}
                  >
                    {meta.label}
                  </Text>
                  <Text
                    style={{ fontFamily: 'Inter_400Regular', fontSize: 14, color: '#77766F' }}
                  >
                    {meta.description}
                  </Text>
                </View>
                {/* Checkbox */}
                <View
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: 12,
                    borderWidth: 2,
                    borderColor: selected ? '#F2B84B' : '#CFCFCA',
                    backgroundColor: selected ? '#F2B84B' : 'transparent',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {selected && <Text style={{ color: '#292B28', fontSize: 14 }}>✓</Text>}
                </View>
              </Pressable>
            );
          })}
        </View>

        <Text
          style={{ fontFamily: 'Inter_400Regular', fontSize: 13, color: '#A8A8A0', textAlign: 'center', marginTop: 16 }}
        >
          {t('onboarding.goals.helperText')}
        </Text>
      </ScrollView>

      {/* Sticky CTA */}
      <View
        style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          paddingHorizontal: 24, paddingBottom: 40, paddingTop: 16,
          backgroundColor: '#FFF9EE',
          borderTopWidth: 1, borderTopColor: 'rgba(41,43,40,0.07)',
        }}
      >
        <Pressable
          onPress={() => router.push('/(onboarding)/translation')}
          style={{
            height: 56, borderRadius: 20, backgroundColor: '#F2B84B',
            alignItems: 'center', justifyContent: 'center',
          }}
        >
          <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 17, color: '#292B28' }}>
            {t('common.continue')} {preferences.goals.length > 0 ? `(${preferences.goals.length})` : ''}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
