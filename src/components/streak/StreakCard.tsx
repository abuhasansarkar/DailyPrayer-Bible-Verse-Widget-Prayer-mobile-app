import { View, Text, Pressable, useColorScheme } from 'react-native';
import Animated, { FadeInUp, useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { router } from 'expo-router';
import { useAppStore } from '@/store/app.store';
import { ProgressRing } from '@/components/ui/ProgressRing';
import type { StreakData, StreakMilestone } from '@/types/user';

interface StreakCardProps {
  streak: StreakData;
  milestones?: StreakMilestone[];
  onPress?: () => void;
  compact?: boolean;
}

const MILESTONE_DAYS = [3, 7, 14, 30, 50, 100, 365];

export function StreakCard({ streak, milestones = [], onPress, compact = false }: StreakCardProps) {
  const systemScheme = useColorScheme();
  const { colorScheme } = useAppStore();
  const isDark = (colorScheme === 'system' ? systemScheme : colorScheme) === 'dark';

  const cardBg = isDark ? '#332F26' : '#FFFFFF';
  const textPrimary = isDark ? '#F5EDD8' : '#292B28';
  const textSecondary = isDark ? '#B8AD97' : '#77766F';
  const surfaceBg = isDark ? '#2A2720' : '#F1E6D3';

  const dayNames = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  const todayDate = new Date().toISOString().split('T')[0]!;

  const nextMilestone = MILESTONE_DAYS.find((d) => d > streak.currentStreak) ?? null;
  const daysToNext = nextMilestone ? nextMilestone - streak.currentStreak : null;
  const progressToNext = nextMilestone
    ? Math.min((streak.currentStreak / nextMilestone) * 100, 100)
    : 100;

  return (
    <Pressable
      onPress={onPress}
      style={{
        backgroundColor: cardBg,
        borderRadius: 20,
        padding: compact ? 16 : 20,
        shadowColor: '#292B28',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 2,
      }}
    >
      {/* Header row */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <View>
          <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 12, color: textSecondary, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4 }}>
            Faith Streak
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4 }}>
            <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 36, color: '#F2B84B', letterSpacing: -1 }}>
              {streak.currentStreak}
            </Text>
            <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 16, color: textSecondary }}>days</Text>
          </View>
        </View>

        {/* Progress ring */}
        <View style={{ alignItems: 'center' }}>
          <ProgressRing
            size={compact ? 56 : 64}
            strokeWidth={5}
            progress={progressToNext}
            color="#F2B84B"
            backgroundColor={surfaceBg}
          />
          <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 10, color: textSecondary, marginTop: 4, textAlign: 'center' }}>
            {daysToNext ? `${daysToNext} to ${nextMilestone}🎯` : '🏆 Max!'}
          </Text>
        </View>
      </View>

      {/* Weekly dots */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        {streak.thisWeek.map((day, i) => {
          const date = new Date(day.date + 'T00:00:00');
          const isToday = day.date === todayDate;
          return (
            <View key={i} style={{ alignItems: 'center', gap: 5, flex: 1 }}>
              <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 10, color: textSecondary }}>
                {dayNames[date.getDay()]}
              </Text>
              <View style={{
                width: 28, height: 28, borderRadius: 14,
                backgroundColor: day.isComplete ? '#F2B84B' : isToday ? '#F2B84B22' : surfaceBg,
                borderWidth: isToday && !day.isComplete ? 1.5 : 0,
                borderColor: '#F2B84B',
                alignItems: 'center', justifyContent: 'center',
              }}>
                {day.isComplete && (
                  <Text style={{ fontSize: 12, color: '#292B28' }}>✓</Text>
                )}
              </View>
            </View>
          );
        })}
      </View>

      {/* Stats row */}
      {!compact && (
        <View style={{
          flexDirection: 'row', marginTop: 16, paddingTop: 16,
          borderTopWidth: 1, borderTopColor: isDark ? 'rgba(245,237,216,0.06)' : 'rgba(41,43,40,0.06)',
          gap: 24,
        }}>
          <View>
            <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 18, color: textPrimary }}>{streak.longestStreak}</Text>
            <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 11, color: textSecondary }}>Longest</Text>
          </View>
          <View>
            <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 18, color: textPrimary }}>{streak.totalDays}</Text>
            <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 11, color: textSecondary }}>Total days</Text>
          </View>
          {streak.currentStreak > 0 && (
            <View>
              <Text style={{ fontSize: 18 }}>🔥</Text>
              <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 11, color: textSecondary }}>On fire!</Text>
            </View>
          )}
        </View>
      )}
    </Pressable>
  );
}
