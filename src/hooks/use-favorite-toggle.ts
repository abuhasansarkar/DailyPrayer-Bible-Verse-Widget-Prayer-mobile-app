import { useCallback } from 'react';
import { Alert } from 'react-native';
import { router } from 'expo-router';
import { useUserStore } from '@/store/user.store';
import { GATE_MESSAGES } from '@/constants/entitlements';

/**
 * Toggle a favourite, surfacing the paywall when a free user hits the limit.
 *
 * Returns `true` if the item was added, `false` if removed, and `null` if the
 * action was blocked (the alert has already been shown). Callers should return
 * early on `null` rather than reporting success.
 */
export function useFavoriteToggle() {
  const toggleFavorite = useUserStore((s) => s.toggleFavorite);

  return useCallback(
    async (type: string, id: string): Promise<boolean | null> => {
      const result = await toggleFavorite(type, id);

      if (!result.ok) {
        Alert.alert('Favourite limit reached', GATE_MESSAGES.favorites, [
          { text: 'Not now', style: 'cancel' },
          { text: 'See Premium', onPress: () => router.push('/premium') },
        ]);
        return null;
      }

      return result.added;
    },
    [toggleFavorite]
  );
}
