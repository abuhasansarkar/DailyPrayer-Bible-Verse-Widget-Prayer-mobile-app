import { View, Text, Pressable, useColorScheme } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { router } from 'expo-router';
import { useAppStore } from '@/store/app.store';
import { useUserStore } from '@/store/user.store';
import { Toast, useToast } from '@/components/ui/Toast';
import { useFavoriteToggle } from '@/hooks/use-favorite-toggle';

interface VerseCardProps {
  id: string;
  reference: string;
  text: string;
  book?: string;
  showActions?: boolean;
  onSave?: (id: string) => void;
  onShare?: (id: string) => void;
  compact?: boolean;
}

export function VerseCard({
  id, reference, text, book, showActions = true, onSave, onShare, compact = false
}: VerseCardProps) {
  const systemScheme = useColorScheme();
  const { colorScheme } = useAppStore();
  const { isFavorite } = useUserStore();
  const toggleFavoriteGated = useFavoriteToggle();
  const isDark = (colorScheme === 'system' ? systemScheme : colorScheme) === 'dark';
  const { toastProps, show } = useToast();

  const saved = isFavorite('verse', id);

  const cardBg = isDark ? '#332F26' : '#FFFFFF';
  const textPrimary = isDark ? '#F5EDD8' : '#292B28';
  const textSecondary = isDark ? '#B8AD97' : '#77766F';

  const handleSave = async () => {
    const added = await toggleFavoriteGated('verse', id);
    if (added === null) return; // blocked by the free-tier limit
    show(added ? 'Saved to favorites ✨' : 'Removed from favorites', added ? 'success' : 'info');
    onSave?.(id);
  };

  return (
    <Animated.View entering={FadeIn.duration(300)}>
      <Pressable
        onPress={() => router.push(`/verse/${id}`)}
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
        {/* Book label */}
        {book && (
          <Text style={{
            fontFamily: 'Inter_500Medium', fontSize: 10,
            color: '#F2B84B', letterSpacing: 1,
            textTransform: 'uppercase', marginBottom: 10,
          }}>
            {book}
          </Text>
        )}

        {/* Verse text */}
        <Text style={{
          fontFamily: 'Lora_400Regular_Italic',
          fontSize: compact ? 15 : 17,
          lineHeight: compact ? 23 : 27,
          color: textPrimary,
          marginBottom: 12,
        }} numberOfLines={compact ? 3 : undefined}>
          &quot;{text}&quot;
        </Text>

        {/* Reference + actions */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={{
            fontFamily: 'Inter_600SemiBold', fontSize: 13, color: textSecondary,
          }}>
            {reference}
          </Text>

          {showActions && (
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <Pressable
                onPress={(e) => { e.stopPropagation(); handleSave(); }}
                style={{
                  width: 34, height: 34, borderRadius: 17,
                  backgroundColor: saved ? '#F2B84B22' : isDark ? '#2A2720' : '#F1E6D3',
                  alignItems: 'center', justifyContent: 'center',
                }}
              >
                <Text style={{ fontSize: 15 }}>{saved ? '🔖' : '🔖'}</Text>
              </Pressable>
              <Pressable
                onPress={(e) => { e.stopPropagation(); onShare?.(id); }}
                style={{
                  width: 34, height: 34, borderRadius: 17,
                  backgroundColor: isDark ? '#2A2720' : '#F1E6D3',
                  alignItems: 'center', justifyContent: 'center',
                }}
              >
                <Text style={{ fontSize: 15 }}>↗️</Text>
              </Pressable>
            </View>
          )}
        </View>
      </Pressable>
      <Toast {...toastProps} />
    </Animated.View>
  );
}
