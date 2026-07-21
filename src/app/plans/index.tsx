import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowLeft, BookOpen, Calendar, CheckCircle2, ChevronRight } from '@/components/ui/LucideIcons';
import { ReadingPlanService, ReadingPlan, SAMPLE_PLANS } from '@/services/reading-plans';

export default function PlansScreen() {
  const [plans, setPlans] = useState<ReadingPlan[]>(SAMPLE_PLANS);

  useEffect(() => {
    ReadingPlanService.getPlans().then(setPlans);
  }, []);

  return (
    <SafeAreaView className="flex-1 bg-[#FFF9EE]">
      {/* Header */}
      <View className="flex-row items-center px-6 py-4 border-b border-[#E8DFC9]">
        <TouchableOpacity onPress={() => router.back()} className="p-2 rounded-full bg-[#F5EDD8] mr-3">
          <ArrowLeft size={20} color="#292B28" />
        </TouchableOpacity>
        <View>
          <Text className="text-xl font-bold text-[#292B28]">Reading Plans</Text>
          <Text className="text-xs text-[#77766F]">Daily Bible reading journeys</Text>
        </View>
      </View>

      <ScrollView className="flex-1 px-6 pt-4" contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Featured Banner */}
        <View className="bg-[#FEF3D1] rounded-3xl p-6 mb-6 border border-[#F2B84B]/30 shadow-sm">
          <View className="flex-row items-center mb-2">
            <BookOpen size={20} color="#F2B84B" className="mr-2" />
            <Text className="text-xs font-bold text-[#F2B84B] uppercase tracking-wider">FEATURED JOURNEY</Text>
          </View>
          <Text className="text-2xl font-bold text-[#292B28] mb-2">Read the Bible in a Year</Text>
          <Text className="text-sm text-[#77766F] leading-relaxed mb-4">
            Build a lifelong daily scripture habit with 15 minutes of structured daily reading.
          </Text>
          <TouchableOpacity
            onPress={() => router.push('/plans/bible-in-a-year' as any)}
            className="bg-[#F2B84B] rounded-2xl py-3 px-5 self-start flex-row items-center"
          >
            <Text className="font-bold text-[#292B28] mr-2">Start Reading</Text>
            <ChevronRight size={16} color="#292B28" />
          </TouchableOpacity>
        </View>

        <Text className="text-xs font-bold text-[#77766F] uppercase tracking-wider mb-4">All Reading Plans</Text>

        <View className="gap-4">
          {plans.map(plan => (
            <TouchableOpacity
              key={plan.id}
              onPress={() => router.push(`/plans/${plan.id}` as any)}
              className="bg-[#F5EDD8] rounded-2xl p-5 border border-[#E8DFC9] flex-row items-center justify-between"
            >
              <View className="flex-1 mr-4">
                <View className="flex-row items-center mb-1">
                  <Text className="text-xs font-bold text-[#D98262] uppercase mr-2">{plan.category}</Text>
                  <Text className="text-xs text-[#77766F]">• {plan.total_days} Days</Text>
                </View>
                <Text className="text-lg font-bold text-[#292B28] mb-1">{plan.title}</Text>
                <Text className="text-xs text-[#77766F]" numberOfLines={2}>
                  {plan.description}
                </Text>
              </View>
              <View className="w-10 h-10 rounded-full bg-[#FFF9EE] items-center justify-center border border-[#E8DFC9]">
                <ChevronRight size={20} color="#77766F" />
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
