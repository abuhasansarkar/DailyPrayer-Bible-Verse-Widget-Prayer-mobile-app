import { useSyncExternalStore } from 'react';
import { useColorScheme as useRNColorScheme } from 'react-native';

// Hydration is tracked with useSyncExternalStore rather than a
// setState-in-effect: the app builds with React Compiler enabled, which treats
// a synchronous state write inside an effect as a cascading render.
// getServerSnapshot returns false, getSnapshot returns true, so the value
// flips exactly once when the client takes over.
const emptySubscribe = () => () => {};

function useHasHydrated(): boolean {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
}

/**
 * To support static rendering, this value needs to be re-calculated on the
 * client side for web.
 */
export function useColorScheme() {
  const hasHydrated = useHasHydrated();
  const colorScheme = useRNColorScheme();

  return hasHydrated ? colorScheme : 'light';
}
