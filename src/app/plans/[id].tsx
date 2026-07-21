import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { ArrowLeft, CheckCircle, Circle, BookOpen } from '@/components/ui/LucideIcons';
import { ReadingPlanService, SAMPLE_PLANS } from '@/services/reading-plans';

export default function PlanDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [completedDays, setCompletedDays] = useState<number[]>([]);

  const plan = SAMPLE_PLANS.find(p => p.id === id) || SAMPLE_PLANS[0];

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
    <SafeAreaView className="flex-1 bg-[#FFF9EE]">
      {/* Header */}
      <View className="flex-row items-center px-6 py-4 border-b border-[#E8DFC9]">
        <TouchableOpacity onPress={() => router.back()} className="p-2 rounded-full bg-[#F5EDD8] mr-3">
          <ArrowLeft size={20} color="#292B28" />
        </TouchableOpacity>
        <View className="flex-1">
          <Text className="text-xl font-bold text-[#292B28]" numberOfLines={1}>{plan.title}</Text>
          <Text className="text-xs text-[#77766F]">{completedDays.length} of {plan.total_days} days completed ({percent}%)</Text>
        </View>
      </View>

      <ScrollView className="flex-1 px-6 pt-4" contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Progress Bar */}
        <View className="bg-[#F5EDD8] rounded-2xl p-4 mb-6 border border-[#E8DFC9]">
          <View className="flex-row justify-between mb-2">
            <Text className="text-xs font-bold text-[#292B28]">Overall Progress</Text>
            <Text className="text-xs font-bold text-[#D98262]">{percent}%</Text>
          </View>
          <View className="h-3 bg-[#E8DFC9] rounded-full overflow-hidden">
            <View className="h-full bg-[#F2B84B] rounded-full" style={{ width: `${percent}%` }} />
          </View>
        </View>

        <Text className="text-xs font-bold text-[#77766F] uppercase tracking-wider mb-4">Daily Schedule</Text>

        <View className="gap-3">
          {Array.from({ length: Math.min(30, plan.total_days) }).map((_, idx) => {
            const dayNum = idx + 1;
            const isDone = completedDays.includes(dayNum);
            return (
              <TouchableOpacity
                key={dayNum}
                onPress={() => handleToggleDay(dayNum)}
                className={`flex-row items-center justify-between p-4 rounded-2xl border ${
                  isDone ? 'bg-[#E2EAE0] border-[#96AA88]' : 'bg-[#F5EDD8] border-[#E8DFC9]'
                }`}
              >
                <View className="flex-row items-center flex-1 mr-3">
                  <View className="w-8 h-8 rounded-full bg-[#FFF9EE] items-center justify-center mr-3 border border-[#E8DFC9]">
                    <Text className="text-xs font-bold text-[#292B28]">{dayNum}</Text>
                  </View>
                  <View>
                    <Text className={`font-bold ${isDone ? 'text-[#1E2E1A] line-through' : 'text-[#292B28]'}`}>
                      Day {dayNum} Reading
                    </Text>
                    <Text className="text-xs text-[#77766F]">Genesis {dayNum * 2 - 1}-{dayNum * 2} • Psalm {dayNum}</Text>
                  </View>
                </View>
                {isDone ? (
                  <CheckCircle size={22} color="#617558" />
                ) : (
                  <Circle size={22} color="#B8AD97" />
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
