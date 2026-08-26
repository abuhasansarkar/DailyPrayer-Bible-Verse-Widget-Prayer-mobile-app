import { canAddMore, FREE_LIMITS, FREE_FEATURES, PREMIUM_FEATURES } from '../constants/entitlements';
import { useSubscriptionStore } from '../store/subscription.store';

describe('canAddMore', () => {
  afterEach(() => useSubscriptionStore.getState().setTier('free'));

  it('allows a free user up to the limit', () => {
    useSubscriptionStore.getState().setTier('free');
    expect(canAddMore('collections', 0)).toBe(true);
    expect(canAddMore('collections', FREE_LIMITS.collections - 1)).toBe(true);
  });

  it('blocks a free user at the limit', () => {
    useSubscriptionStore.getState().setTier('free');
    expect(canAddMore('collections', FREE_LIMITS.collections)).toBe(false);
    expect(canAddMore('favorites', FREE_LIMITS.favorites)).toBe(false);
  });

  it('never blocks premium or lifetime', () => {
    useSubscriptionStore.getState().setTier('premium');
    expect(canAddMore('collections', 999)).toBe(true);

    useSubscriptionStore.getState().setTier('lifetime');
    expect(canAddMore('favorites', 999)).toBe(true);
  });
});

describe('paywall copy', () => {
  it('does not advertise features that are not built', () => {
    // These were listed on the paywall with no enforcement or implementation.
    const unbuilt = [
      /photo/i,
      /\bads?\b/i,
      /watermark/i,
      /cloud sync/i,
      /streak insights/i,
      /unlimited.*reminder/i,
    ];
    const copy = [...FREE_FEATURES, ...PREMIUM_FEATURES.map((f) => f.text)].join(' | ');
    for (const pattern of unbuilt) {
      expect(copy).not.toMatch(pattern);
    }
  });

  it('quotes the same numbers the limits enforce', () => {
    const copy = FREE_FEATURES.join(' | ');
    expect(copy).toContain(String(FREE_LIMITS.favorites));
    expect(copy).toContain(String(FREE_LIMITS.collections));
  });
});
