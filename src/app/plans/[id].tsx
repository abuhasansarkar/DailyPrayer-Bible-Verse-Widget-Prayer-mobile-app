import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { ArrowLeft, CheckCircle, Circle } from '@/components/ui/LucideIcons';
import { ReadingPlanService, SAMPLE_PLANS } from '@/services/reading-plans';
import { useResolvedTheme } from '@/hooks/use-theme';

export default function PlanDetailScreen() {
  const { isDark } = useResolvedTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [completedDays, setCompletedDays] = useState<number[]>([]);

  const plan = SAMPLE_PLANS.find(p => p.id === id) || SAMPLE_PLANS[0];

  const bg = isDark ? '#1E1C18' : '#FFF9EE';
  const cardBg = isDark ? '#2A2720' : '#F5EDD8';
  const doneBg = isDark ? '#263323' : '#E2EAE0';
  const doneBorder = isDark ? '#4C5D44' : '#96AA88';
  const doneCheck = isDark ? '#A8BFA1' : '#617558';
  const iconCircleBg = isDark ? '#1E1C18' : '#FFF9EE';
  const textColor = isDark ? '#F5EDD8' : '#292B28';
  const subTextColor = isDark ? '#B8AD97' : '#77766F';
  const borderColor = isDark ? 'rgba(245,237,216,0.12)' : '#E8DFC9';
  const iconColor = isDark ? '#F5EDD8' : '#292B28';

  useEffect(() => {
    if (id) {
      ReadingPlanService.getProgress(id).then(prog => {
        if (prog) setCompletedDays(prog.completed_days);
      });
    }
  }, [id]);

  const handleToggleDay = async (day: number) => {
    if (!id) return;
    await ReadingPlanService.toggleDayComplete(id, day);
    const prog = await ReadingPlanService.getProgress(id);
    if (prog) setCompletedDays(prog.completed_days);
  };

  const percent = Math.round((completedDays.length / (plan.total_days || 30)) * 100);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: bg }}>
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: borderColor }}>
        <TouchableOpacity onPress={() => router.back()} style={{ padding: 8, borderRadius: 9999, backgroundColor: cardBg, marginRight: 12 }}>
          <ArrowLeft size={20} color={iconColor} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 20, fontWeight: '700', color: textColor }} numberOfLines={1}>{plan.title}</Text>
          <Text style={{ fontSize: 12, color: subTextColor }}>{completedDays.length} of {plan.total_days} days completed ({percent}%)</Text>
        </View>
      </View>

      <ScrollView style={{ flex: 1, paddingHorizontal: 24, paddingTop: 16 }} contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Progress Bar */}
        <View style={{ backgroundColor: cardBg, borderRadius: 16, padding: 16, marginBottom: 24, borderWidth: 1, borderColor }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
            <Text style={{ fontSize: 12, fontWeight: '700', color: textColor }}>Overall Progress</Text>
            <Text style={{ fontSize: 12, fontWeight: '700', color: '#D98262' }}>{percent}%</Text>
          </View>
          <View style={{ height: 12, backgroundColor: isDark ? '#1E1C18' : '#E8DFC9', borderRadius: 9999, overflow: 'hidden' }}>
            <View style={{ height: '100%', backgroundColor: '#F2B84B', borderRadius: 9999, width: `${percent}%` }} />
          </View>
        </View>

        <Text style={{ fontSize: 12, fontWeight: '700', color: subTextColor, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16 }}>Daily Schedule</Text>

        <View style={{ gap: 12 }}>
          {Array.from({ length: Math.min(30, plan.total_days) }).map((_, idx) => {
            const dayNum = idx + 1;
            const isDone = completedDays.includes(dayNum);
            return (
              <TouchableOpacity
                key={dayNum}
                onPress={() => handleToggleDay(dayNum)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: 16,
                  borderRadius: 16,
                  borderWidth: 1,
                  backgroundColor: isDone ? doneBg : cardBg,
                  borderColor: isDone ? doneBorder : borderColor,
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 12 }}>
                  <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: iconCircleBg, alignItems: 'center', justifyContent: 'center', marginRight: 12, borderWidth: 1, borderColor }}>
                    <Text style={{ fontSize: 12, fontWeight: '700', color: textColor }}>{dayNum}</Text>
                  </View>
                  <View>
                    <Text style={{ fontWeight: '700', color: textColor, textDecorationLine: isDone ? 'line-through' : 'none' }}>
                      Day {dayNum} Reading
                    </Text>
                    <Text style={{ fontSize: 12, color: subTextColor }}>Genesis {dayNum * 2 - 1}-{dayNum * 2} • Psalm {dayNum}</Text>
                  </View>
                </View>
                {isDone ? (
                  <CheckCircle size={22} color={doneCheck} />
                ) : (
                  <Circle size={22} color={subTextColor} />
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
