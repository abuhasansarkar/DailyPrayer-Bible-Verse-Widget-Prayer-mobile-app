import { View, Text, Pressable, useColorScheme } from 'react-native';
import { router } from 'expo-router';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useAppStore } from '@/store/app.store';

const CATEGORY_META: Record<string, { icon: string; color: string }> = {
  morning:         { icon: '🌅', color: '#F2B84B' },
  evening:         { icon: '🌙', color: '#B8A8CC' },
  gratitude:       { icon: '✨', color: '#96AA88' },
  peace:           { icon: '🕊️', color: '#96AA88' },
  anxiety:         { icon: '🤍', color: '#7BB8D4' },
  strength:        { icon: '💪', color: '#D98262' },
  healing:         { icon: '🌿', color: '#96AA88' },
  family:          { icon: '🏡', color: '#D98262' },
  forgiveness:     { icon: '💙', color: '#7BB8D4' },
  guidance:        { icon: '🌅', color: '#F2B84B' },
  'difficult-times': { icon: '🫂', color: '#B8A8CC' },
};

interface PrayerCardProps {
  id: string;
  title: string;
  category: string;
  durationMinutes: number;
  isPremium?: boolean;
  intro?: string;
  isPersonal?: boolean;
  isAnswered?: boolean;
  onPress?: (id: string) => void;
}

export function PrayerCard({
  id, title, category, durationMinutes,
  isPremium = false, intro, isPersonal = false,
  isAnswered = false, onPress,
}: PrayerCardProps) {
  const systemScheme = useColorScheme();
  const { colorScheme } = useAppStore();
  const isDark = (colorScheme === 'system' ? systemScheme : colorScheme) === 'dark';

  const cardBg = isDark ? '#332F26' : '#FFFFFF';
  const textPrimary = isDark ? '#F5EDD8' : '#292B28';
  const textSecondary = isDark ? '#B8AD97' : '#77766F';

  const meta = CATEGORY_META[category] ?? { icon: '🙏', color: '#D98262' };

  const handlePress = () => {
    if (onPress) { onPress(id); return; }
    router.push(`/prayer/${id}`);
  };

  return (
    <Animated.View entering={FadeIn.duration(300)}>
      <Pressable
        onPress={handlePress}
        style={{
          backgroundColor: cardBg,
          borderRadius: 20,
          padding: 18,
          flexDirection: 'row',
          gap: 14,
          shadowColor: '#292B28',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.06,
          shadowRadius: 8,
          elevation: 2,
        }}
      >
        {/* Category icon */}
        <View style={{
          width: 48, height: 48, borderRadius: 14,
          backgroundColor: `${meta.color}22`,
          alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          <Text style={{ fontSize: 24 }}>{meta.icon}</Text>
        </View>

        {/* Text content */}
        <View style={{ flex: 1, minWidth: 0 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <Text style={{
              fontFamily: 'Inter_600SemiBold', fontSize: 15, color: textPrimary, flex: 1,
            }} numberOfLines={1}>
              {title}
            </Text>
            {isPremium && !isPersonal && (
              <View style={{ backgroundColor: '#F2B84B', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 }}>
                <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 9, color: '#292B28' }}>PRO</Text>
              </View>
            )}
            {isAnswered && (
              <View style={{ backgroundColor: '#96AA88', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 }}>
                <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 9, color: '#FFFFFF' }}>Answered</Text>
              </View>
            )}
          </View>

          {intro && (
            <Text style={{
              fontFamily: 'Inter_400Regular', fontSize: 13,
              color: textSecondary, lineHeight: 19,
            }} numberOfLines={2}>
              {intro}
            </Text>
          )}

          {!isPersonal && (
            <Text style={{
              fontFamily: 'Inter_400Regular', fontSize: 11,
              color: textSecondary, marginTop: 6,
            }}>
              {durationMinutes} min · {category.charAt(0).toUpperCase() + category.slice(1)}
            </Text>
          )}
        </View>

        {/* Arrow */}
        <Text style={{ color: textSecondary, fontSize: 16, alignSelf: 'center' }}>›</Text>
      </Pressable>
    </Animated.View>
  );
}
