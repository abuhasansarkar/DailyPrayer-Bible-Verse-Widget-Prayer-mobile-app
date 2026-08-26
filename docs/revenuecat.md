# RevenueCat setup

DailyPrayer uses RevenueCat for subscriptions: `react-native-purchases` for the
SDK and `react-native-purchases-ui` for the dashboard-designed Paywall and the
Customer Center.

Installed with:

```bash
npm install --save react-native-purchases react-native-purchases-ui
```

Both packages must stay on the **same version** — `react-native-purchases-ui`
declares an exact peer dependency on `react-native-purchases`.

---

## 1. Dashboard configuration

The app and the dashboard have to agree on these strings. They live in one
file, [`src/constants/revenuecat.ts`](../src/constants/revenuecat.ts) — change
them there and nowhere else.

| Thing | Identifier |
| --- | --- |
| Entitlement | `dailyprayer_pro` |
| Offering | `default` (must be marked **Current**) |
| Package | `monthly` → product `dailyprayer_monthly` |
| Package | `yearly` → product `dailyprayer_yearly` |

Steps in [app.revenuecat.com](https://app.revenuecat.com):

1. **Product catalog → Entitlements** → new entitlement `dailyprayer_pro`.
2. **Products** → add your App Store and Play Store product ids.
3. **Offerings** → create `default`, mark it Current, add two packages
   (`monthly`, `yearly`) and attach a store product to each.
4. Back in **Entitlements → dailyprayer_pro**, attach **both** products.
   Skipping this is the single most common setup mistake: the purchase
   succeeds and nothing unlocks.
5. **Paywalls** → build a paywall for the `default` offering and publish it.
6. **Customer Center** → enable it and pick which management options to show.

RevenueCat's own package identifiers are `$rc_monthly` / `$rc_annual`. This
project uses `monthly` / `yearly`, and the code accepts either, so nothing
breaks if a package is recreated with the default id.

---

## 2. API keys

```bash
# .env — gitignored
EXPO_PUBLIC_REVENUECAT_API_KEY_TEST=test_…      # development only
EXPO_PUBLIC_REVENUECAT_API_KEY_IOS=appl_…       # production
EXPO_PUBLIC_REVENUECAT_API_KEY_ANDROID=goog_…   # production
```

A `test_…` key is a [Test Store](https://www.revenuecat.com/docs/test-and-launch/sandbox/test-store)
key: purchases are simulated, subscriptions renew every 5–30 minutes and
cancel after 5 renewals. **RevenueCat's rule is that a binary submitted to
either store must never be configured with one.**

That rule is enforced in code, not left to discipline —
`selectApiKey()` in [`src/constants/revenuecat.ts`](../src/constants/revenuecat.ts):

- a real `appl_`/`goog_` key always wins;
- a `test_` key is accepted only when `__DEV__` is true;
- in a release build a `test_` key is **ignored** and purchases are disabled,
  rather than silently handing every user a fake entitlement.

It also catches a `test_` key pasted into the iOS/Android slot by mistake.
`src/__tests__/revenuecat.test.ts` locks this behaviour down.

**EAS builds:** `eas.json` no longer carries an `env` block. Literal values
there override `.env` during a build, which is how a production binary ends up
shipping `YOUR_RC_IOS_KEY`. Set the real keys as EAS environment variables:

```bash
eas env:create --name EXPO_PUBLIC_REVENUECAT_API_KEY_IOS --value appl_… --environment production
eas env:create --name EXPO_PUBLIC_REVENUECAT_API_KEY_ANDROID --value goog_… --environment production
```

---

## 3. Build requirement

RevenueCat needs native modules, so **Expo Go will not work**. Both packages
fall back to "Preview API Mode" there — mocked responses and a grey
placeholder paywall. The app detects this (`isNativeUiAvailable()`) and shows
its own in-app paywall instead, so Expo Go stays usable for everything else.

```bash
npx expo prebuild --clean
npx expo run:ios      # or: eas build --profile development --platform ios
npx expo run:android
```

No Expo config plugin is required — both packages autolink. `app.json`
declares `com.android.vending.BILLING` for Google Play Billing. On iOS,
confirm the **In-App Purchase** capability on the App ID.

---

## 4. How it is wired

```
app/_layout.tsx
  └─ initRevenueCat()                 configure + customer-info listener
  └─ ensureAuth() → identifyUser(id)  alias the customer to the Supabase user

services/revenuecat.ts     the only module that imports the Purchases SDK
  └─ applyCustomerInfo()   the one place CustomerInfo becomes app state
       └─ subscription.store   ← every screen reads this, synchronously

services/revenuecat-ui.ts  presentPaywall / presentPaywallIfNeeded / Customer Center
```

Because the customer-info **listener** writes the store, renewals, expiries,
refunds and restores made outside the app all land automatically — no polling.

### Checking the entitlement

```ts
import { useSubscription } from '@/hooks/use-subscription';

const { isPro, requirePro } = useSubscription();

// Gate an action — presents the paywall if needed, resolves true if allowed.
if (await requirePro()) {
  unlockTheThing();
}
```

Outside React:

```ts
import { isPremiumNow } from '@/constants/entitlements';
if (isPremiumNow()) { /* … */ }
```

### Purchases

`purchasePeriod('yearly' | 'monthly')` returns a discriminated result rather
than a boolean, so a user backing out is not reported as a failure:

```ts
const result = await purchasePeriod('yearly');
// { status: 'purchased', isPro } | 'cancelled' | 'pending' | { status: 'error', message }
```

`restorePurchases()` reports on the `dailyprayer_pro` entitlement itself, so a
**lifetime** purchase restores correctly. (The previous implementation checked
a subscription-only entitlement and told lifetime buyers there was nothing to
restore.)

### Paywall

`/premium` renders `<RevenueCatUI.Paywall />` — copy, layout, pricing and A/B
tests all change from the dashboard with no app release. Prices always come
from the live offering; the screen never hardcodes a price, because showing one
the store will not charge is a refund and App Review problem.

### Customer Center

`/settings/subscription` embeds `<RevenueCatUI.CustomerCenterView />`: change
plan, cancel, request a refund (iOS), restore, and "I can't find my purchase".
The Settings row routes paying users here and free users to the paywall.

---

## 5. Troubleshooting

### `Purchases-TrackedEvent is not a supported event type for RNPurchases`

The JS package and the installed **native** binary are different versions. The v10
JS registers a `Purchases-TrackedEvent` listener at import time; a native module
built from v8 only knows three events, so it rejects it.

This is not a code bug — it means a dev client built *before* the SDK upgrade is
still installed, and a Metro server is feeding it the new JS bundle. Anything that
changes native dependencies needs a native rebuild, not just a Metro restart:

```bash
# stop every stale Metro / run:ios first — a dev client built before the upgrade
# will keep loading the new JS bundle into the old binary
pkill -f "expo run:ios"; pkill -f "expo start"

npx expo prebuild --clean
npx expo run:ios
```

To confirm which version is actually installed, check the built binary rather than
`package.json`:

```bash
APP=$(find ~/Library/Developer/CoreSimulator/Devices/<UDID>/data/Containers/Bundle/Application \
  -name "DailyPrayer.app" -maxdepth 3 | head -1)
strings -a "$APP/DailyPrayer.debug.dylib" | grep "^Purchases-" | sort -u
```

A correct v10 build lists five events, including `Purchases-TrackedEvent`. Note the
symbols live in `DailyPrayer.debug.dylib`, not the main executable — debug builds
link the app code as a dylib, so the main binary is only ~58KB.

## 6. Testing a purchase

1. Run a development build with the `test_` key.
2. Open **Settings → Subscription** (or any gated feature).
3. The paywall shows a Test Store modal — pick *Purchase success*.
4. Confirm the tier flips to Premium and the gates open.
5. Open **Settings → Subscription** again: the Customer Center should now show
   the active subscription.

Before shipping, repeat against a real sandbox account with the `appl_`/`goog_`
keys — Test Store does not exercise App Store or Play billing.
