import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowLeft, BookOpen, ChevronRight } from '@/components/ui/LucideIcons';
import { ReadingPlanService, ReadingPlan, SAMPLE_PLANS } from '@/services/reading-plans';
import { useResolvedTheme } from '@/hooks/use-theme';

export default function PlansScreen() {
  const { isDark } = useResolvedTheme();
  const [plans, setPlans] = useState<ReadingPlan[]>(SAMPLE_PLANS);

  const bg = isDark ? '#1E1C18' : '#FFF9EE';
  const cardBg = isDark ? '#2A2720' : '#F5EDD8';
  const bannerBg = isDark ? '#332A18' : '#FEF3D1';
  const iconCircleBg = isDark ? '#1E1C18' : '#FFF9EE';
  const textColor = isDark ? '#F5EDD8' : '#292B28';
  const subTextColor = isDark ? '#B8AD97' : '#77766F';
  const borderColor = isDark ? 'rgba(245,237,216,0.12)' : '#E8DFC9';
  const iconColor = isDark ? '#F5EDD8' : '#292B28';

  useEffect(() => {
    ReadingPlanService.getPlans().then(setPlans);
  }, []);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: bg }}>
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: borderColor }}>
        <TouchableOpacity onPress={() => router.back()} style={{ padding: 8, borderRadius: 9999, backgroundColor: cardBg, marginRight: 12 }}>
          <ArrowLeft size={20} color={iconColor} />
        </TouchableOpacity>
        <View>
          <Text style={{ fontSize: 20, fontWeight: '700', color: textColor }}>Reading Plans</Text>
          <Text style={{ fontSize: 12, color: subTextColor }}>Daily Bible reading journeys</Text>
        </View>
      </View>

      <ScrollView style={{ flex: 1, paddingHorizontal: 24, paddingTop: 16 }} contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Featured Banner */}
        <View style={{ backgroundColor: bannerBg, borderRadius: 24, padding: 24, marginBottom: 24, borderWidth: 1, borderColor: isDark ? 'rgba(242,184,75,0.25)' : 'rgba(242,184,75,0.3)' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
            <BookOpen size={20} color="#F2B84B" style={{ marginRight: 8 }} />
            <Text style={{ fontSize: 12, fontWeight: '700', color: '#F2B84B', textTransform: 'uppercase', letterSpacing: 1 }}>FEATURED JOURNEY</Text>
          </View>
          <Text style={{ fontSize: 24, fontWeight: '700', color: textColor, marginBottom: 8 }}>Read the Bible in a Year</Text>
          <Text style={{ fontSize: 14, color: subTextColor, lineHeight: 22, marginBottom: 16 }}>
            Build a lifelong daily scripture habit with 15 minutes of structured daily reading.
          </Text>
          <TouchableOpacity
            onPress={() => router.push('/plans/bible-in-a-year' as any)}
            style={{ backgroundColor: '#F2B84B', borderRadius: 16, paddingVertical: 12, paddingHorizontal: 20, alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center' }}
          >
            <Text style={{ fontWeight: '700', color: '#292B28', marginRight: 8 }}>Start Reading</Text>
            <ChevronRight size={16} color="#292B28" />
          </TouchableOpacity>
        </View>

        <Text style={{ fontSize: 12, fontWeight: '700', color: subTextColor, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16 }}>All Reading Plans</Text>

        <View style={{ gap: 16 }}>
          {plans.map(plan => (
            <TouchableOpacity
              key={plan.id}
              onPress={() => router.push(`/plans/${plan.id}` as any)}
              style={{ backgroundColor: cardBg, borderRadius: 20, padding: 20, borderWidth: 1, borderColor, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
            >
              <View style={{ flex: 1, marginRight: 16 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                  <Text style={{ fontSize: 12, fontWeight: '700', color: '#D98262', textTransform: 'uppercase', marginRight: 8 }}>{plan.category}</Text>
                  <Text style={{ fontSize: 12, color: subTextColor }}>• {plan.total_days} Days</Text>
                </View>
                <Text style={{ fontSize: 18, fontWeight: '700', color: textColor, marginBottom: 4 }}>{plan.title}</Text>
                <Text style={{ fontSize: 12, color: subTextColor }} numberOfLines={2}>
                  {plan.description}
                </Text>
              </View>
              <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: iconCircleBg, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor }}>
                <ChevronRight size={20} color={subTextColor} />
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
