import { View, Text, useColorScheme } from 'react-native';
import { useAppStore } from '@/store/app.store';
import { todayDate } from '@/db/client';

interface CalendarActivityProps {
  /** Array of 28-35 day entries for the last 4-5 weeks */
  data: { date: string; isComplete: boolean; activities: string[] }[];
}

export function CalendarActivity({ data }: CalendarActivityProps) {
  const systemScheme = useColorScheme();
  const { colorScheme } = useAppStore();
  const isDark = (colorScheme === 'system' ? systemScheme : colorScheme) === 'dark';

  const textSecondary = isDark ? '#6A6355' : '#B8B2AA';
  const surfaceBg = isDark ? '#2A2720' : '#F1E6D3';
  const todayStr = todayDate();

  const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  // Build weeks grid: pad data to start on Sunday
  const firstDate = data[0] ? new Date(data[0].date + 'T00:00:00') : new Date();
  const startDayOfWeek = firstDate.getDay(); // 0=Sun
  const paddedData = [
    ...Array(startDayOfWeek).fill(null),
    ...data,
  ];

  // Split into weeks
  const weeks: (typeof data[0] | null)[][] = [];
  for (let i = 0; i < paddedData.length; i += 7) {
    weeks.push(paddedData.slice(i, i + 7));
  }

  return (
    <View>
      {/* Day headers */}
      <View style={{ flexDirection: 'row', marginBottom: 6 }}>
        {DAY_LABELS.map((d, i) => (
          <View key={i} style={{ flex: 1, alignItems: 'center' }}>
            <Text style={{
              fontFamily: 'Inter_400Regular',
              fontSize: 10, color: textSecondary,
            }}>
              {d}
            </Text>
          </View>
        ))}
      </View>

      {/* Calendar grid */}
      {weeks.map((week, wi) => (
        <View key={wi} style={{ flexDirection: 'row', marginBottom: 4 }}>
          {week.map((day, di) => {
            if (!day) {
              return <View key={di} style={{ flex: 1, aspectRatio: 1 }} />;
            }
            const isToday = day.date === todayStr;
            const intensity = day.isComplete
              ? day.activities.length >= 3 ? '#E8A020' : '#F2B84B'
              : isToday ? '#F2B84B22' : surfaceBg;

            return (
              <View key={di} style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 2 }}>
                <View style={{
                  width: '100%',
                  aspectRatio: 1,
                  borderRadius: 6,
                  backgroundColor: intensity,
                  borderWidth: isToday ? 1.5 : 0,
                  borderColor: '#F2B84B',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  {isToday && !day.isComplete && (
                    <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: '#F2B84B' }} />
                  )}
                </View>
              </View>
            );
          })}
        </View>
      ))}

      {/* Legend */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 }}>
        <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 10, color: textSecondary }}>Less</Text>
        {[surfaceBg, '#F2B84B88', '#F2B84B', '#E8A020'].map((c, i) => (
          <View key={i} style={{ width: 12, height: 12, borderRadius: 3, backgroundColor: c }} />
        ))}
        <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 10, color: textSecondary }}>More</Text>
      </View>
    </View>
  );
}
