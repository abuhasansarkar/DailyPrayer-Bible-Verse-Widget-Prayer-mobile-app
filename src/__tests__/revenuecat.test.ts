import {
  selectApiKey,
  tierFromEntitlement,
  isTestStoreKey,
  findPackagePeriod,
  PRO_ENTITLEMENT,
  PACKAGE_IDS,
} from '../constants/revenuecat';

// These cover the two pieces of RevenueCat logic that are ours rather than
// the SDK's: which API key a build is allowed to use, and how the
// `dailyprayer_pro` entitlement becomes an app tier.

describe('selectApiKey', () => {
  const TEST_KEY = 'test_ESZajbvRqudTgIRbLmRCxPdnyyC';

  it('prefers a real platform key in any build', () => {
    expect(selectApiKey({ platformKey: 'appl_realkey', testKey: TEST_KEY, isDev: true }))
      .toEqual({ apiKey: 'appl_realkey', source: 'platform' });

    expect(selectApiKey({ platformKey: 'goog_realkey', testKey: TEST_KEY, isDev: false }))
      .toEqual({ apiKey: 'goog_realkey', source: 'platform' });
  });

  it('uses the Test Store key in development', () => {
    expect(selectApiKey({ platformKey: '', testKey: TEST_KEY, isDev: true }))
      .toEqual({ apiKey: TEST_KEY, source: 'test-store' });
  });

  it('accepts a test key pasted into the platform slot, in development only', () => {
    expect(selectApiKey({ platformKey: TEST_KEY, testKey: '', isDev: true }))
      .toEqual({ apiKey: TEST_KEY, source: 'test-store' });

    expect(selectApiKey({ platformKey: TEST_KEY, testKey: '', isDev: false }))
      .toEqual({ apiKey: '', source: 'none' });
  });

  it('NEVER configures a release build with a Test Store key', () => {
    // RevenueCat's hard rule. A test key in a shipped binary would fake
    // purchases for every user, so purchases are disabled instead.
    for (const input of [
      { platformKey: '', testKey: TEST_KEY },
      { platformKey: TEST_KEY, testKey: TEST_KEY },
      { platformKey: 'YOUR_RC_IOS_KEY', testKey: TEST_KEY },
    ]) {
      expect(selectApiKey({ ...input, isDev: false }).source).toBe('none');
      expect(selectApiKey({ ...input, isDev: false }).apiKey).toBe('');
    }
  });

  it('treats dashboard placeholders as missing', () => {
    expect(selectApiKey({ platformKey: 'YOUR_RC_IOS_KEY', testKey: '', isDev: true }).source).toBe('none');
    expect(selectApiKey({ platformKey: 'appl_your_key_here', testKey: '', isDev: true }).source).toBe('none');
  });

  it('ignores surrounding whitespace from a pasted .env value', () => {
    expect(selectApiKey({ platformKey: '  appl_realkey  ', testKey: '', isDev: false }))
      .toEqual({ apiKey: 'appl_realkey', source: 'platform' });
  });

  it('recognises the test key prefix', () => {
    expect(isTestStoreKey(TEST_KEY)).toBe(true);
    expect(isTestStoreKey('appl_abc')).toBe(false);
  });
});

describe('tierFromEntitlement', () => {
  it('is free with no entitlement', () => {
    expect(tierFromEntitlement(undefined)).toEqual({ tier: 'free' });
    expect(tierFromEntitlement(null)).toEqual({ tier: 'free' });
  });

  it('is free when the entitlement is present but inactive', () => {
    expect(
      tierFromEntitlement({ isActive: false, periodType: 'NORMAL', expirationDate: '2026-01-01T00:00:00Z' })
    ).toEqual({ tier: 'free' });
  });

  it('maps an active subscription to premium and keeps the expiry', () => {
    expect(
      tierFromEntitlement({ isActive: true, periodType: 'NORMAL', expirationDate: '2026-09-01T00:00:00Z' })
    ).toEqual({ tier: 'premium', qualifier: undefined, expiresAt: '2026-09-01T00:00:00Z' });
  });

  it('flags a trial', () => {
    expect(
      tierFromEntitlement({ isActive: true, periodType: 'TRIAL', expirationDate: '2026-09-01T00:00:00Z' })
    ).toEqual({ tier: 'premium', qualifier: 'trial', expiresAt: '2026-09-01T00:00:00Z' });
  });

  it('maps a no-expiry entitlement to lifetime', () => {
    // The bug this guards: checking a subscription-only entitlement reported
    // "nothing to restore" to someone who had actually paid for lifetime.
    expect(tierFromEntitlement({ isActive: true, periodType: 'NORMAL', expirationDate: null }))
      .toEqual({ tier: 'lifetime', qualifier: 'lifetime' });
  });
});

describe('dashboard identifiers', () => {
  it('gates on the dailyprayer_pro entitlement', () => {
    expect(PRO_ENTITLEMENT).toBe('dailyprayer_pro');
  });

  it('accepts both the project and RevenueCat package identifiers', () => {
    expect(PACKAGE_IDS.monthly).toContain('monthly');
    expect(PACKAGE_IDS.yearly).toContain('yearly');
    // RevenueCat's own conventional identifiers must keep working, so the
    // app does not break if a package is recreated with the default id.
    expect(PACKAGE_IDS.monthly).toContain('$rc_monthly');
    expect(PACKAGE_IDS.yearly).toContain('$rc_annual');
  });

  it('resolves a package identifier to a billing period', () => {
    expect(findPackagePeriod('yearly')).toBe('yearly');
    expect(findPackagePeriod('$rc_annual')).toBe('yearly');
    expect(findPackagePeriod('monthly')).toBe('monthly');
    expect(findPackagePeriod('$rc_monthly')).toBe('monthly');
    expect(findPackagePeriod('something_else')).toBeNull();
  });
});
