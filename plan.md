# DailyPrayer — Production Readiness Plan

**Status as of 2026-08-14** · Expo SDK 57 · React Native 0.86.2 · React 19.2.3

---

## 1. Where the project stands

The codebase is now structurally healthy. Everything below is verified, not assumed:

| Check | Result |
| --- | --- |
| `npm install` (clean, no flags) | ✅ passes |
| `npx expo-doctor` | ✅ 20/20 |
| `npm run typecheck` | ✅ 0 errors |
| `npm run lint` | ✅ 0 errors, 50 warnings |
| `npm test` | ✅ 23 passing, 4 suites |
| `npx expo export` iOS + Android | ✅ both bundle |
| CI ([.github/workflows/ci.yml](.github/workflows/ci.yml)) | ✅ lint + typecheck + jest on PR |

**What is genuinely production-quality today:** the offline-first SQLite layer with
versioned migrations, the startup/splash sequencing, Expo Go degradation handling,
i18n infrastructure, the theming system, and the entitlement model.

**What this plan covers:** the gap between "compiles and runs" and "shippable to the
App Store and Play Store". That gap is mostly *unfinished features that are already
advertised* and *store-compliance requirements*, not code defects.

---

## 2. Release blockers

These prevent submission or will get the app rejected. Nothing ships until all are closed.

### B1 — Home-screen widgets do not exist 🔴 *largest decision*

The app has a **Widgets tab**, an install guide, a theme gallery, a per-widget
customiser, 20 defined themes, a `WidgetBridgeService`, and a background refresh
task. There is **no native widget on either platform**:

- No iOS WidgetKit extension anywhere in the project.
- [widget-bridge.ts:34](src/services/widget-bridge.ts#L34) calls
  `NativeModules.DailyPrayerWidgetModule`, which is never implemented.
- `ios/` is a prebuild artifact and gitignored, so any extension must ship as a
  config plugin to survive `expo prebuild`.

This also contradicts the paywall: "All 20 widget themes" is currently a paid
feature for something that cannot render.

**Two options — pick one before anything else, it changes the timeline by weeks:**

| Option | Work | Timeline |
| --- | --- | --- |
| **A. Build it** | iOS WidgetKit extension (Swift) + App Group for shared data; Android `AppWidgetProvider` (Kotlin) + Glance; an Expo config plugin to inject both; replace SecureStore with App Group / SharedPreferences in `WidgetBridgeService` | 2–3 weeks |
| **B. Cut it for v1** | Remove the Widgets tab and `widget/*` routes, drop the widget-theme premium claim from `PREMIUM_FEATURES`, keep the DB table and themes for a later release | 1 day |

**Recommendation: Option B for v1.** Widgets are a strong differentiator for this
category, but they are a full native workstream. Shipping the rest of the app now and
adding widgets in 1.1 is lower risk than delaying launch by a month. Note
`WidgetBridgeService` currently writes the payload to SecureStore, which a widget
extension cannot read — that has to become an App Group regardless.

### B2 — Rotate the leaked credentials

`.env` was committed in `370fbb9`, `311a5e7`, `6b78dca`. It is now untracked, but the
values remain in git history and must be treated as public.

- [ ] Rotate the Supabase anon key (Dashboard → Settings → API)
- [ ] Revoke and reissue the OpenCode Zen key
- [ ] Optionally purge history with `git filter-repo` (rotation is what actually matters)

### B3 — No sign-out and no account deletion

[login.tsx](src/app/(auth)/login.tsx) and [signup.tsx](src/app/(auth)/signup.tsx)
create real Supabase accounts. There is no sign-out anywhere, and no delete-account
path. **App Store Guideline 5.1.1(v) requires in-app account deletion for any app
that supports account creation** — this is an automatic rejection.

- [ ] Add sign-out to Settings → Account
- [ ] Add "Delete account" that removes the Supabase user *and* their synced rows
- [ ] Confirm-destructive dialog; clear local session on success

### B4 — `eas.json` would ship placeholder config

[eas.json](eas.json) sets literal placeholders in `build.production.env`:

```json
"EXPO_PUBLIC_SUPABASE_URL": "YOUR_SUPABASE_URL",
"EXPO_PUBLIC_REVENUECAT_API_KEY_IOS": "YOUR_RC_IOS_KEY"
```

These **override** your local `.env` during an EAS build, so a production binary would
ship with broken Supabase and — because the RevenueCat key matches the demo heuristic —
no working purchases. `submit.production` is likewise all placeholders.

- [ ] Delete the `env` blocks; move values to EAS environment variables / secrets
- [ ] Fill real `appleId`, `ascAppId`, `appleTeamId`, and the Play service-account path

### B5 — Legal and support URLs do not exist

[settings/index.tsx:230-231](src/app/settings/index.tsx#L230) links to
`https://dailyprayer.app/privacy` and `support@dailyprayer.app`. Both stores require a
reachable privacy policy URL; the App Store also requires a support URL.

- [ ] Publish a privacy policy (must disclose: SQLite local storage, Supabase sync,
      RevenueCat purchase data, notification tokens, and the AI assistant sending
      prompt text to a third party)
- [ ] Publish terms of service (required for auto-renewing subscriptions)
- [ ] Stand up the support mailbox
- [ ] Add an in-app "Delete my data" explanation alongside B3

### B6 — Supabase has no schema, no security, and no restore path

- No SQL, migrations, or RLS policies exist anywhere in the repo.
- [supabase.ts](src/services/supabase.ts) is **push-only** — nothing ever reads back.
  Signing in on a new device restores nothing, and a reinstall loses everything.
- Without RLS, the anon key (which is public by design) grants table-wide access.

- [ ] Add `supabase/migrations/*.sql` to the repo with the four sync tables
- [ ] Enable RLS with `auth.uid() = user_id` policies on every table
- [ ] Implement the pull half of sync and a last-write-wins merge
- [ ] Test: install → sign in → data restores

### B7 — Reading plans have no content

[plans/[id].tsx](src/app/plans/[id].tsx) renders `Day N Reading` as a checkbox with no
passage attached. "Read the Bible in a Year" is 365 empty checkboxes.

- [ ] Author day-by-day passage references for each plan, or
- [ ] Cut plans from v1 (they are not currently linked from any tab)

### B8 — Store and billing setup

- [ ] `eas init` to create the project and populate `extra.eas.projectId`
- [ ] App Store Connect app record + bundle ID `com.dailyprayer.app`
- [ ] Play Console app record
- [ ] Create IAP products matching `dailyprayer_monthly_999`,
      `dailyprayer_annual_5999`, `dailyprayer_lifetime_11999`
- [ ] Wire RevenueCat offerings; verify a real sandbox purchase end-to-end
- [ ] Verify `restorePurchases` against a real account

---

## 3. High priority (before public launch)

### H1 — Half the app is English-only

23 of 45 screens never call `useTranslation`, yet Settings offers a French toggle. A
French user gets a half-translated app.

Unlocalised: [search.tsx](src/app/search.tsx), [bible/index.tsx](src/app/bible/index.tsx),
[collection/[id].tsx](src/app/collection/[id].tsx), [topic/[id].tsx](src/app/topic/[id].tsx),
[plans/*](src/app/plans/), [(tabs)/community.tsx](src/app/(tabs)/community.tsx),
[(auth)/*](src/app/(auth)/), [gratitude/index.tsx](src/app/gratitude/index.tsx),
[widget/themes.tsx](src/app/widget/themes.tsx), and others.

- [ ] Extract remaining literals into `en.json` / `fr.json`
- [ ] Add a lint rule or CI check for bare JSX strings
- [ ] Have the French copy reviewed by a native speaker — devotional tone matters here

### H2 — Accessibility is largely absent

376 interactive elements; roughly 5 files set `accessibilityRole` or
`accessibilityLabel`. Icon-only buttons (bookmark, share, audio) are unlabelled. Both
stores are increasingly strict, and this audience skews older.

- [ ] Label every icon-only control
- [ ] Verify VoiceOver and TalkBack on the main flows
- [ ] Honour the existing `reducedMotion` and `fontSize` preferences (stored but never applied)
- [ ] Check contrast in both themes

### H3 — No crash reporting or analytics

Errors go to `console.warn`. [ErrorBoundary](src/components/ui/ErrorBoundary.tsx)
swallows crashes with no reporting, so you would be blind in production.

- [ ] Add Sentry (`@sentry/react-native`) or equivalent
- [ ] Report from `ErrorBoundary.componentDidCatch` and the service-level catches
- [ ] Add funnel analytics: onboarding completion, paywall view → purchase, D1/D7 retention

### H4 — AI assistant guardrails *(mostly closed)*

The service is now [ai-assistant.ts](src/services/ai-assistant.ts) — see
[docs/ai-assistant.md](docs/ai-assistant.md). `opencode-zen.ts` and its
user-supplied-key flow in Settings are gone.

- [x] Prefer the server proxy (`EXPO_PUBLIC_AI_PROXY_URL`) over user-supplied keys —
      it is now the only path; without it the assistant reports itself unavailable
- [x] Rate-limit per device (20 / 10 min, in-app)
- [x] Crisis-resources response path — checked before anything is sent
- [ ] Stand up the proxy and enforce the real per-user limit there (the in-app
      limiter is a runaway-loop guard, not abuse protection)
- [ ] Disclose the third-party AI in the privacy policy and in-app before first use
- [ ] Add moderation on the proxy side

### H5 — Asset and metadata cleanup

`assets/images/` still contains Expo template files: `react-logo.png`,
`react-logo@2x.png`, `react-logo@3x.png`, `expo-badge.png`, `expo-badge-white.png`,
`expo-logo.png`, `tutorial-web.png`.

- [ ] Delete template assets
- [ ] Final app icon, adaptive icon, and splash review at all densities
- [ ] Store screenshots for every required device size
- [ ] App name, subtitle, keywords, description, and what's-new copy

### H6 — Background refresh: deprecated API, not a missing background mode

**Correction to an earlier version of this plan.** It claimed `UIBackgroundModes:
["fetch"]` was missing. It is not: the `expo-background-fetch` config plugin adds it
during prebuild. Verified against the generated `ios/DailyPrayer/Info.plist`, which
contains `UIBackgroundModes = [audio, fetch]`.

The real problem is that `expo-background-fetch` is **deprecated in SDK 57** — "not
receiving patches and will be removed in an upcoming release" — replaced by
[`expo-background-task`](https://docs.expo.dev/versions/v57.0.0/sdk/background-task/),
which needs `processing` plus `BGTaskSchedulerPermittedIdentifiers`.

- [ ] Migrate [background-tasks.ts](src/services/background-tasks.ts) to `expo-background-task`
- [ ] Verify on device — background execution cannot be tested in a simulator
- [ ] Note the task only refreshes a widget payload and no widget exists yet (B1);
      if widgets are cut for v1, drop the task rather than migrating it

---

## 4. Medium priority (post-launch)

- **Test depth.** 23 unit tests cover the streak, Bible-text formatting, translation
  mapping, and entitlements. There are no component or E2E tests. Add Maestro flows for
  onboarding → daily verse → journal → paywall.
- **50 lint warnings** — `require()` in the lazy native-module loaders (intentional) and
  `exhaustive-deps` on stable callbacks. Triage and either fix or `eslint-disable` with
  a reason.
- **Performance** — [(tabs)/index.tsx](src/app/(tabs)/index.tsx) is ~900 lines and
  re-renders broadly. Profile with React DevTools; consider splitting.
- **Bible search** only matches locally cached verses, so results look arbitrarily
  sparse until a chapter has been opened. Consider bundling a full KJV text (~4.5MB).
- **Tablet support** is off (`supportsTablet: false`). Enabling it is cheap reach.
- **Deep links** — `scheme: dailyprayer` is set but there are no universal links or
  App Links for shared verses.
- **Onboarding permission timing** — notification permission is requested during app
  init rather than at the reminder step, which lowers grant rates.

---

## 5. Phased schedule

Estimates assume one full-time engineer and **Option B on widgets**.

### Phase 1 — Unblock submission (1.5–2 weeks)
1. Rotate credentials (B2) — *hours*
2. Decide widgets; if B, strip the feature (B1) — *1 day*
3. Fix `eas.json`, run `eas init` (B4, B8) — *0.5 day*
4. Sign-out + account deletion (B3) — *2 days*
5. Supabase schema, RLS, pull-sync (B6) — *3–4 days*
6. Reading plan content or removal (B7) — *1–3 days*
7. Privacy policy, terms, support mailbox (B5) — *1–2 days*

### Phase 2 — Launch quality (1.5–2 weeks)
8. Finish i18n (H1) — *3 days*
9. Accessibility pass (H2) — *3 days*
10. Sentry + analytics (H3) — *1–2 days*
11. AI guardrails and disclosure (H4) — *2 days*
12. iOS background modes (H6) — *0.5 day*
13. Assets and store metadata (H5) — *2 days*

### Phase 3 — Beta (1–2 weeks)
14. TestFlight + Play internal testing build
15. Sandbox purchase verification on both platforms
16. Device matrix: oldest supported iOS/Android, small and large screens
17. Fresh-install, upgrade, and restore-from-backup paths
18. Fix beta feedback

### Phase 4 — Submit
19. Store review submission (allow 1–2 weeks including a likely rejection cycle)
20. Staged Play rollout; phased iOS release

**Realistic time to store approval: 6–8 weeks.** Add 2–3 weeks for widgets (Option A).

---

## 6. Pre-submission checklist

**Build & config**
- [ ] `extra.eas.projectId` populated; `eas.json` free of placeholders
- [ ] Version and build number strategy agreed (`appVersionSource: local` is set)
- [ ] Production build uses EAS secrets, not committed env values
- [ ] `npm run check` green on the release commit

**Compliance**
- [ ] Privacy policy + terms URLs live
- [ ] Account deletion in-app (5.1.1(v))
- [ ] Subscription terms, price, and renewal disclosed on the paywall
- [ ] Restore Purchases visible (present) and functional against a real account
- [ ] Permission strings accurate for every permission actually requested
- [ ] App Privacy / Data Safety questionnaires match real behaviour, including the AI
- [ ] Religious content rating set appropriately

**Functional**
- [ ] Fresh install → onboarding → daily verse works offline
- [ ] Notifications fire at the scheduled local time
- [ ] Purchase, restore, and expiry all behave (sandbox)
- [ ] Sign in on a second device restores data
- [ ] Export and import round-trip a backup
- [ ] No fabricated content anywhere in shipped copy

---

## 7. Known risks

| Risk | Impact | Mitigation |
| --- | --- | --- |
| Widget scope creep | Weeks of delay | Decide B1 first; default to cutting for v1 |
| Bible text licensing | Legal exposure | Public-domain only (KJV/ASV/WEB) is already enforced in `BibleTranslation` — keep it that way |
| Missing RLS on Supabase | Data exposure via the public anon key | Blocker B6; do not launch sync without it |
| AI crisis disclosures | User harm, store scrutiny | H4 crisis-resources path |
| Store rejection cycle | 1–2 week slip each | Front-load B3, B5, and the privacy questionnaires |
| Prayer wall is device-local | Users expect a shared community | Copy already says "Saved on this device"; keep expectations honest until a backend exists |

---

## 8. Decisions needed from you

1. **Widgets: build (Option A) or cut for v1 (Option B)?** — gates the timeline.
2. **Reading plans: author content or cut?** — currently unreachable from any tab.
3. **Cloud sync: launch with it or go local-only for v1?** — cutting removes B6 and the
   auth screens entirely, saving ~a week and shrinking the privacy surface.
4. **Pricing** — code defaults to $9.99/mo, $59.99/yr, $119.99 lifetime. That is high for
   this category; typical competitors sit at $3–5/mo. Confirm before creating IAP products.
5. **Launch markets** — English-only v1 would defer H1; shipping French requires it.
