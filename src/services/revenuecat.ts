import Purchases, { LOG_LEVEL, CustomerInfo, PurchasesPackage } from 'react-native-purchases';
import { Platform } from 'react-native';
import { useSubscriptionStore } from '@/store/subscription.store';

const API_KEY_IOS = process.env.EXPO_PUBLIC_REVENUECAT_API_KEY_IOS ?? '';
const API_KEY_ANDROID = process.env.EXPO_PUBLIC_REVENUECAT_API_KEY_ANDROID ?? '';

export const OFFERING_ID = 'default';
export const PREMIUM_ENTITLEMENT = 'premium';

export async function initRevenueCat(): Promise<void> {
  const apiKey = Platform.select({ ios: API_KEY_IOS, android: API_KEY_ANDROID });
  const isDemoKey = !apiKey || apiKey.includes('YOUR_KEY') || apiKey.includes('demo');

  if (isDemoKey) {
    console.log('[RevenueCat] Running with Demo Test Key. Initializing preview packages mode.');
    loadDemoPackages();
    return;
  }

  if (__DEV__) {
    Purchases.setLogLevel(LOG_LEVEL.DEBUG);
  }

  try {
    Purchases.configure({ apiKey });
    Purchases.addCustomerInfoUpdateListener(handleCustomerInfo);

    const info = await Purchases.getCustomerInfo();
    handleCustomerInfo(info);
    await loadPackages();
  } catch (e) {
    console.warn('[RevenueCat] Remote connection failed, switching to demo mode:', e);
    loadDemoPackages();
  }
}

function handleCustomerInfo(info: CustomerInfo): void {
  const { setTier } = useSubscriptionStore.getState();
  const hasLifetime = info.entitlements.active['lifetime'] != null;
  const hasPremium = info.entitlements.active[PREMIUM_ENTITLEMENT] != null;

  if (hasLifetime) {
    setTier('lifetime');
  } else if (hasPremium) {
    const expiresAt = info.entitlements.active[PREMIUM_ENTITLEMENT]?.expirationDate ?? undefined;
    setTier('premium', undefined, expiresAt ?? undefined);
  } else {
    setTier('free');
  }
}

async function loadPackages(): Promise<void> {
  const { setPackages, setLoading } = useSubscriptionStore.getState();
  setLoading(true);
  try {
    const offerings = await Purchases.getOfferings();
    const current = offerings.current ?? offerings.all[OFFERING_ID];
    if (current && current.availablePackages.length > 0) {
      const packages = current.availablePackages.map((pkg: PurchasesPackage) => ({
        identifier: pkg.identifier,
        productIdentifier: pkg.product.identifier,
        price: pkg.product.priceString,
        period: mapPeriod(pkg.packageType),
        introductoryOffer: pkg.product.introPrice
          ? {
              price: pkg.product.introPrice.priceString,
              duration: `${pkg.product.introPrice.periodNumberOfUnits} ${pkg.product.introPrice.periodUnit}`,
            }
          : undefined,
      }));
      setPackages(packages);
      return;
    }
  } catch (e) {
    console.warn('[RevenueCat] Could not load live packages, loading demo packages:', e);
  }
  loadDemoPackages();
}

function loadDemoPackages(): void {
  const { setPackages, setLoading } = useSubscriptionStore.getState();
  setPackages([
    {
      identifier: '$rc_monthly',
      productIdentifier: 'dailyprayer_monthly_999',
      price: '$9.99/mo',
      period: 'monthly',
      introductoryOffer: { price: '$0.00', duration: '7 days free trial' },
    },
    {
      identifier: '$rc_annual',
      productIdentifier: 'dailyprayer_annual_5999',
      price: '$59.99/yr',
      period: 'annual',
      introductoryOffer: { price: '$0.00', duration: '7 days free trial' },
    },
    {
      identifier: '$rc_lifetime',
      productIdentifier: 'dailyprayer_lifetime_11999',
      price: '$119.99',
      period: 'lifetime',
    },
  ]);
  setLoading(false);
}

function mapPeriod(packageType: string): 'monthly' | 'annual' | 'lifetime' {
  if (packageType.includes('ANNUAL') || packageType.includes('YEARLY')) return 'annual';
  if (packageType.includes('LIFETIME')) return 'lifetime';
  return 'monthly';
}

export async function purchasePackage(pkg: { identifier: string }): Promise<boolean> {
  const apiKey = Platform.select({ ios: API_KEY_IOS, android: API_KEY_ANDROID }) ?? '';
  const isDemoKey = !apiKey || apiKey.includes('YOUR_KEY') || apiKey.includes('demo');

  if (isDemoKey) {
    const { setTier } = useSubscriptionStore.getState();
    const period = pkg.identifier.includes('lifetime') ? 'lifetime' : 'premium';
    setTier(period as any);
    return true;
  }

  try {
    const offerings = await Purchases.getOfferings();
    const current = offerings.current;
    if (!current) return false;

    const rcPkg = current.availablePackages.find(
      (p: PurchasesPackage) => p.identifier === pkg.identifier
    );
    if (!rcPkg) return false;

    const { customerInfo } = await Purchases.purchasePackage(rcPkg);
    handleCustomerInfo(customerInfo);
    return customerInfo.entitlements.active[PREMIUM_ENTITLEMENT] != null;
  } catch (e: any) {
    if (e.userCancelled) return false;
    console.warn('[RevenueCat] Purchase failed:', e);
    return false;
  }
}

export async function restorePurchases(): Promise<boolean> {
  const apiKey = Platform.select({ ios: API_KEY_IOS, android: API_KEY_ANDROID }) ?? '';
  const isDemoKey = !apiKey || apiKey.includes('YOUR_KEY') || apiKey.includes('demo');

  if (isDemoKey) {
    console.log('[RevenueCat] Restore called in demo mode');
    return false;
  }

  try {
    const info = await Purchases.restorePurchases();
    handleCustomerInfo(info);
    return info.entitlements.active[PREMIUM_ENTITLEMENT] != null;
  } catch (e) {
    console.warn('[RevenueCat] Restore failed:', e);
    return false;
  }
}
