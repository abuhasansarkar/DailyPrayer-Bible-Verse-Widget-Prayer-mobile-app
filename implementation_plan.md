# DailyPrayer — Bible Verse Widget & Prayer
## Production-Ready Expo App — Implementation Plan

### Overview

Transform the current Expo v57 starter project (`c:\AbuHasan\Android\DailyPrayer\app`) into a premium, production-ready Christian spiritual lifestyle app. The app combines daily Bible verses, guided prayer, journaling, streaks, home-screen widgets, and a warm Scandinavian UI into a cohesive experience that competes with Headspace, Calm, and Finch on the App Store and Google Play.

**Current State**: Bare Expo v57 project with a basic tab scaffold, minimal theme tokens, NativeWind-compatible global.css, and no app-specific features.

**Target State**: Full V1 feature set — all screens, navigation, data layer, state management, notifications, widgets, and subscription paywall — built with clean architecture and ready for EAS Build.

---

## User Review Required

> [!IMPORTANT]
> **Supabase**: The prompt lists Supabase PostgreSQL as "Optional". The plan includes it for cloud sync and admin content (verses, prayers, topics seeded server-side). If you do **not** want Supabase, the entire data layer stays local with SQLite only. Please confirm.

> [!IMPORTANT]
> **Prisma ORM on React Native**: Prisma's standard query engine does not run on-device in React Native. The plan uses **Prisma only for server-side migrations/seeding** (a small Node.js Supabase admin script), and uses **expo-sqlite** with typed DAO helpers on-device. This is the correct approach for RN + Expo.

> [!WARNING]
> **RevenueCat**: Integration requires a RevenueCat account, App Store Connect product IDs, and Google Play billing product IDs. The plan wires the full SDK; you must supply your own `REVENUECAT_API_KEY_IOS` and `REVENUECAT_API_KEY_ANDROID` in `.env`.

> [!WARNING]
> **Home Screen Widgets (iOS/Android)**: True native home-screen widgets require native code beyond Expo Go. The plan uses **`@bndkt/react-native-app-clip`** for iOS WidgetKit via a custom native module approach, and Android App Widget via **`@bndkt/react-native-widget`** (if Expo SDK 57 compatible). If pure Expo managed workflow is required, widgets are shown as in-app previews with deep-link instructions — real widget delivery requires a development build (`expo-dev-client`). Please confirm if a development build is acceptable.

> [!IMPORTANT]
> **EAS Build / Updates**: The plan assumes you have an Expo account and EAS CLI. The `eas.json` will be configured for development, preview, and production profiles. EAS submission config is included but API keys must be supplied separately.

---

## Open Questions

1. **Authentication model**: Is Google/Apple Sign-In required for V1, or is anonymous/guest mode + optional email sufficient?
2. **Bible API vs. local DB**: Should Bible content (full chapters) be fetched from a free API (bible.api.bible or scripture.api.bible) or stored entirely in SQLite on-device? The plan defaults to API + offline cache for full chapters, with curated verses seeded locally.
3. **i18n languages for V1**: Which languages beyond English should be translated at launch? The plan scaffolds i18next with English + French as the baseline.
4. **Mascot assets**: The plan generates placeholder mascot SVG/PNG assets using the image generation tool. Final production assets should be replaced by a professional illustrator.
5. **Analytics provider**: Should Sentry (error tracking) + PostHog/Mixpanel (product analytics) be included, or just console/Expo error boundary for V1?

---

## Tech Stack Decisions

| Concern | Choice | Rationale |
|---|---|---|
| Framework | Expo SDK 57 + Expo Router v4 | Already installed, file-based routing |
| Styling | NativeWind v4 (Tailwind CSS) | Requested; utility-first, dark mode easy |
| State | Zustand | Lightweight, typed, devtools support |
| Server state | TanStack Query v5 | Caching, sync, suspense |
| Forms | React Hook Form + Zod | Type-safe validation |
| Local DB | expo-sqlite (Drizzle ORM) | Prisma doesn't run on RN device |
| Cloud DB | Supabase PostgreSQL | Auth, sync, admin content |
| Notifications | expo-notifications | Push + local scheduling |
| Secure storage | expo-secure-store | Token/key storage |
| Image picker | expo-image-picker | Widget photo backgrounds |
| Sharing | expo-sharing | Verse image sharing |
| Localization | expo-localization + i18next | Multi-language |
| Subscriptions | RevenueCat | Cross-platform IAP |
| Fonts | expo-font (Inter + Lora) | Warm editorial typography |
| Icons | @expo/vector-icons + custom SVG | SF Symbols parity |
| Build | EAS Build + EAS Update | CI/CD |

---

## Proposed Changes

### Phase 1 — Foundation & Design System

#### [MODIFY] [package.json](file:///c:/AbuHasan/Android/DailyPrayer/app/package.json)
Add all required dependencies:
- `nativewind`, `tailwindcss`
- `@tanstack/react-query`
- `zustand`
- `react-hook-form`, `zod`, `@hookform/resolvers`
- `expo-sqlite`, `drizzle-orm`, `drizzle-kit`
- `@supabase/supabase-js`
- `expo-notifications`
- `expo-secure-store`
- `expo-image-picker`
- `expo-sharing`
- `expo-localization`, `i18next`, `react-i18next`
- `react-native-purchases` (RevenueCat)
- `expo-font`
- `@expo/vector-icons`
- `react-native-svg`
- `date-fns`
- `expo-image` (already present)
- `expo-haptics`
- `expo-av` (for ambient audio)

#### [MODIFY] [app.json](file:///c:/AbuHasan/Android/DailyPrayer/app/app.json)
- Rename app to "DailyPrayer", slug to "dailyprayer"
- Update scheme to `dailyprayer`
- Update icon/splash to DailyPrayer brand
- Add plugins: `expo-notifications`, `expo-font`, `expo-secure-store`, `expo-image-picker`
- Set `backgroundColor: "#FFF9EE"` (Warm Cream)
- Add `bundleIdentifier` for iOS and `package` for Android

#### [NEW] `tailwind.config.js`
Full DailyPrayer design token configuration:
```js
// Brand colors, spacing scale, font families, border radius tokens
theme.extend.colors = {
  cream: { DEFAULT: '#FFF9EE', ... },
  gold: { DEFAULT: '#F2B84B', ... },
  terracotta: { DEFAULT: '#D98262', ... },
  sage: { DEFAULT: '#96AA88', ... },
  charcoal: { DEFAULT: '#292B28', ... },
  // ...semantic tokens
}
```

#### [NEW] `babel.config.js`
Configure NativeWind v4 Babel preset.

#### [MODIFY] [`src/global.css`](file:///c:/AbuHasan/Android/DailyPrayer/app/src/global.css)
Add full DailyPrayer NativeWind CSS with font imports, base tokens, and dark mode support.

#### [MODIFY] [`src/constants/theme.ts`](file:///c:/AbuHasan/Android/DailyPrayer/app/src/constants/theme.ts)
Replace with complete DailyPrayer design tokens (colors, spacing, radii, shadows, typography scale).

---

### Phase 2 — Project Architecture

```
src/
├── app/                          # Expo Router screens
│   ├── (onboarding)/             # Splash, welcome, setup flow
│   │   ├── _layout.tsx
│   │   ├── splash.tsx
│   │   ├── welcome.tsx
│   │   ├── goals.tsx
│   │   ├── translation.tsx
│   │   ├── reminder.tsx
│   │   ├── theme-select.tsx
│   │   └── ready.tsx
│   ├── (tabs)/                   # Main 5-tab shell
│   │   ├── _layout.tsx
│   │   ├── index.tsx             # Today
│   │   ├── explore.tsx           # Bible + Topics
│   │   ├── pray.tsx              # Prayer hub
│   │   ├── widgets.tsx           # Widget gallery
│   │   └── library.tsx           # Favorites + Collections
│   ├── verse/[id].tsx            # Verse detail
│   ├── prayer/[id].tsx           # Prayer detail
│   ├── journal/new.tsx
│   ├── journal/[id].tsx
│   ├── bible/[book]/[chapter].tsx
│   ├── collection/[id].tsx
│   ├── widget/[id]/customize.tsx
│   ├── premium/index.tsx         # Paywall
│   ├── settings/                 # Settings screens
│   └── _layout.tsx               # Root layout with providers
├── components/
│   ├── ui/                       # Design system primitives
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Input.tsx
│   │   ├── Badge.tsx
│   │   ├── Toggle.tsx
│   │   ├── ProgressRing.tsx
│   │   ├── StreakBadge.tsx
│   │   ├── Toast.tsx
│   │   ├── BottomSheet.tsx
│   │   ├── Skeleton.tsx
│   │   └── EmptyState.tsx
│   ├── verse/
│   │   ├── VerseCard.tsx
│   │   ├── VerseHero.tsx
│   │   └── VerseShareCard.tsx
│   ├── prayer/
│   │   ├── PrayerCard.tsx
│   │   ├── GuidedPrayer.tsx
│   │   └── PrayerJournalEntry.tsx
│   ├── widget/
│   │   ├── WidgetPreview.tsx
│   │   ├── WidgetThemeCard.tsx
│   │   └── WidgetCustomizer.tsx
│   ├── mascot/
│   │   ├── Mascot.tsx
│   │   └── mascot-assets/
│   ├── navigation/
│   │   ├── TabBar.tsx
│   │   └── Header.tsx
│   └── streak/
│       ├── StreakCard.tsx
│       └── CalendarActivity.tsx
├── hooks/
│   ├── useTheme.ts
│   ├── useDailyVerse.ts
│   ├── usePrayers.ts
│   ├── useStreak.ts
│   ├── useNotifications.ts
│   ├── useSubscription.ts
│   ├── useJournal.ts
│   └── useBible.ts
├── services/
│   ├── bible-api.ts              # Scripture API client
│   ├── supabase.ts               # Supabase client
│   ├── notifications.ts          # Scheduling helpers
│   ├── revenuecat.ts             # IAP service
│   └── analytics.ts              # Sentry/PostHog
├── store/
│   ├── user.store.ts             # Profile, prefs, streak
│   ├── app.store.ts              # UI state, theme, onboarding
│   └── subscription.store.ts     # Premium status
├── db/
│   ├── schema.ts                 # Drizzle ORM schema
│   ├── migrations/               # SQL migrations
│   ├── client.ts                 # SQLite client init
│   └── seed.ts                   # Local data seeding
├── i18n/
│   ├── index.ts
│   └── locales/
│       ├── en.json
│       └── fr.json
├── types/
│   ├── verse.ts
│   ├── prayer.ts
│   ├── journal.ts
│   └── widget.ts
└── utils/
    ├── date.ts
    ├── share.ts
    └── verse-image.ts
```

---

### Phase 3 — Database Schema (Drizzle + SQLite)

#### [NEW] `src/db/schema.ts`
Core tables:
- `verses` — id, reference, text, translation, book, chapter, verse_number, topics[]
- `prayers` — id, title, body, category, scripture_ref, duration_minutes, is_guided, is_premium
- `topics` — id, name, slug, icon, description, color
- `user_favorites` — id, type (verse/prayer/devotional), ref_id, created_at
- `user_collections` — id, name, description, items[]
- `journal_entries` — id, type (prayer/gratitude), title, body, mood, is_answered, created_at
- `reminders` — id, title, time, days_of_week, type, is_active, verse_id
- `streak_log` — id, date, activities[]
- `widget_configs` — id, size, theme_id, verse_id, font, alignment, show_reference
- `widget_themes` — id, name, bg_color, text_color, accent, illustration

#### [NEW] `prisma/schema.prisma` (server-side only)
Mirrors the above for Supabase PostgreSQL — used only for migrations from Node.js, not on-device.

---

### Phase 4 — Navigation & Layouts

#### [MODIFY] [`src/app/_layout.tsx`](file:///c:/AbuHasan/Android/DailyPrayer/app/src/app/_layout.tsx)
Root layout wraps:
1. `QueryClientProvider` (TanStack Query)
2. `GestureHandlerRootView`
3. `SafeAreaProvider`
4. `ThemeProvider` (custom, not expo-router's)
5. `RevenueCat` init
6. `i18next` init
7. Onboarding gate (redirect to `/(onboarding)/welcome` if first launch)

#### [NEW] `src/app/(onboarding)/_layout.tsx`
Stack navigator, no tab bar, cream background.

#### [NEW] `src/app/(tabs)/_layout.tsx`
Five-tab navigator: **Today · Explore · Pray · Widgets · Library**
- Custom animated tab bar using `BottomTabBar` with DailyPrayer icons
- Badge count on Pray tab for pending reminders

---

### Phase 5 — Core Screens (30 High-Fidelity)

#### Onboarding Flow (7 screens)
1. **Splash** — Logo animation on cream, mascot rises, fade to welcome
2. **Welcome** — "A quiet moment with God, every day" + mascot greeting pose
3. **Spiritual Goals** — Card grid: Morning devotion, Evening reflection, Bible reading, Prayer, Gratitude
4. **Translation** — ESV, NIV, KJV, NLT selector with search
5. **Reminder Setup** — Time picker + day selector (morning/evening/custom)
6. **Theme Select** — Light / Dark / System + cream color swatch preview
7. **Plan Ready** — Mascot celebrating, personalization complete

#### Today Tab (home)
8. **Today Home** — Personalized greeting, date, hero verse card, reflection prompt, streak, gratitude entry, mascot encouragement widget

#### Verse Experience
9. **Verse of the Day** — Full-screen hero verse with save/share/audio actions
10. **Verse Detail** — Verse, reflection text, related verses, prayer, topics

#### Prayer Experience
11. **Prayer Home (Pray tab)** — Category grid, prayer journal, gratitude, reminders list
12. **Prayer Category** — List of guided prayers in a category
13. **Guided Prayer Detail** — Title, intro, prayer text, scripture, "Mark Prayed" CTA
14. **Create Personal Prayer** — Form: title, text, category, reminder
15. **Prayer Journal List** — Timeline with answered/active status
16. **Gratitude Journal** — 3 gratitude prompts + entry history

#### Bible / Explore
17. **Explore Home** — Search bar, topic chips, featured collections, daily devotional
18. **Topic Detail** — Verses, prayers, devotionals for a topic
19. **Scripture Search Results** — Verse list with highlight
20. **Bible Book Selector** — OT/NT grid
21. **Chapter Reader** — Full chapter with verse highlighting + save

#### Widgets
22. **Widget Gallery** — Size categories (small/medium/large/lock screen)
23. **Widget Theme Detail** — Preview + 20 theme cards
24. **Widget Customizer** — Live preview panel + font/color/content controls
25. **Widget Installation Guide** — Step-by-step iOS/Android instructions

#### Library
26. **Favorites** — Verse, prayer, devotional tabs
27. **Collections** — Grid + create collection CTA
28. **Saved Prayers** — Personal prayer list

#### Settings & Profile
29. **Profile & Settings** — Avatar, name, streak summary, notifications, appearance, translation, accessibility, privacy, subscription

#### Premium
30. **Premium Paywall** — Monthly vs. Annual plan, free trial, feature list, mascot premium pose

---

### Phase 6 — Streaks & Achievements

#### [NEW] `src/components/streak/StreakCard.tsx`
- Shows current streak count, longest streak
- Weekly activity calendar (7-day row)
- Animated progress ring
- Encouraging messaging (never guilt-language)

#### [NEW] Milestone illustrations for 3, 7, 14, 30, 50, 100, 365 days
- Generated as SVG assets using the image generation tool
- Mascot in "celebrating" pose per milestone

---

### Phase 7 — Notifications

#### [NEW] `src/services/notifications.ts`
- Register for push permissions (expo-notifications)
- Schedule local notifications for morning/evening/custom reminders
- Handle timezone shifts for reminder times
- Notification tap → deep link to `/(tabs)/pray` or verse detail
- Cancel/reschedule on settings change

---

### Phase 8 — Widgets

#### In-App Widget System (Preview + Install Guide)
Widget home-screen features require a **development build** (`expo-dev-client`). The plan delivers:

1. **In-app widget preview** — pixel-accurate React Native renderings of all widget sizes/themes
2. **Widget customizer** — live editing with real-time preview
3. **Installation guide** — screen-by-screen walkthrough with screenshots
4. **Native widget stub** (EAS build only):
   - iOS: WidgetKit extension via Expo config plugin
   - Android: App Widget Provider via Expo config plugin
   - Widget data refreshed from SQLite via App Group (iOS) / shared preferences (Android)

---

### Phase 9 — Subscription (RevenueCat)

#### [NEW] `src/services/revenuecat.ts`
- Initialize with platform-specific API keys
- Fetch available packages (monthly, annual, lifetime)
- Purchase flow with loading/error states
- Restore purchases
- Entitlement check hook: `useSubscription()`

#### [NEW] `src/app/premium/index.tsx`
- Full-width paywall with mascot "premium" pose
- Feature comparison (Free vs. Premium)
- Monthly / Annual toggle with savings badge
- Free trial indicator (no fake countdown)
- CTA: "Start Free Trial" / "Subscribe"
- Restore link in footer

---

### Phase 10 — Cloud Sync (Supabase)

#### [NEW] `src/services/supabase.ts`
Supabase client with:
- Anonymous auth (guest) + optional email auth
- Sync queue: favorites, journal entries, reminders, streak log, user preferences
- Conflict resolution: last-write-wins with `updated_at` timestamp
- Offline-first: changes written to SQLite first, synced when online

#### Supabase Tables (server-side)
- `users` — id, display_name, avatar_url, created_at
- `user_preferences` — user_id, translation, theme, goals[], reminders[]
- `sync_favorites` — user_id, type, ref_id, synced_at
- `sync_journal_entries` — user_id, entry_json, synced_at
- `sync_streaks` — user_id, date, activities[], synced_at
- `content_verses` — admin-managed daily verse schedule
- `content_prayers` — guided prayers (admin)
- `content_topics` — topics + metadata (admin)
- `content_devotionals` — morning/evening devotionals (admin)

---

### Phase 11 — Internationalization

#### [NEW] `src/i18n/index.ts`
- i18next + react-i18next
- expo-localization for device locale detection
- Namespaces: `common`, `onboarding`, `verse`, `prayer`, `streak`, `settings`
- English (en) complete, French (fr) scaffolded

---

### Phase 12 — Design System Completion

#### Color Tokens (Light Theme)
| Token | Value |
|---|---|
| `--color-bg` | `#FFF9EE` (Warm Cream) |
| `--color-surface` | `#F1E6D3` (Natural Beige) |
| `--color-brand` | `#F2B84B` (Morning Gold) |
| `--color-accent` | `#D98262` (Soft Terracotta) |
| `--color-growth` | `#96AA88` (Gentle Sage) |
| `--color-text` | `#292B28` (Deep Charcoal) |
| `--color-text-secondary` | `#77766F` (Warm Gray) |

#### Dark Theme
| Token | Value |
|---|---|
| `--color-bg` | `#1E1C18` (Deep Charcoal warm) |
| `--color-surface` | `#2A2720` (Dark Olive) |
| `--color-brand` | `#F2B84B` (Gold unchanged) |
| `--color-text` | `#F5EDD8` (Soft Cream) |

#### Typography Scale
| Style | Font | Size | Weight |
|---|---|---|---|
| Display Large | Inter | 36sp | 700 |
| Headline | Inter | 24sp | 600 |
| Body Large | Inter | 17sp | 400 |
| Scripture Large | Lora | 22sp | 400 italic |
| Prayer Body | Lora | 18sp | 400 |
| Caption | Inter | 12sp | 400 |

---

## Verification Plan

### Automated Tests
- `npx expo lint` — TypeScript + ESLint
- `npx jest` — Unit tests for Zustand stores, Zod schemas, date utilities, streak logic

### Manual Verification
1. Run `expo start` → scan with Expo Go → verify home screen renders with DailyPrayer theme
2. Navigate all 5 tabs — confirm tab bar labels and icons
3. Complete onboarding flow — confirm Zustand stores persist
4. Set a reminder → verify notification fires at correct time
5. Mark verse as favorite → confirm SQLite write + Supabase sync (if enabled)
6. Open widget gallery → verify preview renders matching theme
7. Trigger paywall → verify RevenueCat package loads (sandbox)
8. Toggle dark mode → verify warm dark theme applies correctly
9. Switch language (if FR enabled) → verify translations load
10. Kill app, reopen → verify streak increments on next day

### EAS Build Verification
```bash
eas build --profile development --platform android
eas build --profile development --platform ios
```
Confirm dev client boots and all native modules initialize.

---

## Implementation Phases & Order

```
Phase 1: Foundation (package.json, tailwind, babel, theme tokens)       [~2h]
Phase 2: Architecture (folder structure, types, DB schema)               [~2h]
Phase 3: Root layout + providers + navigation shell                      [~2h]
Phase 4: Onboarding flow (7 screens)                                     [~3h]
Phase 5: Today tab + Verse hero                                          [~2h]
Phase 6: Prayer hub + Guided prayer + Journal                            [~3h]
Phase 7: Explore + Bible reader + Search                                 [~3h]
Phase 8: Widget gallery + Customizer + Preview                           [~2h]
Phase 9: Library + Favorites + Collections                               [~1h]
Phase 10: Settings + Profile                                             [~1h]
Phase 11: Streak system + Achievements                                   [~1h]
Phase 12: Notifications service                                          [~1h]
Phase 13: Supabase sync + Auth                                           [~2h]
Phase 14: RevenueCat paywall                                             [~1h]
Phase 15: i18n + Accessibility pass                                      [~1h]
Phase 16: EAS config + eas.json                                          [~0.5h]
Phase 17: DB seeding + sample content                                    [~1h]
```

**Total estimated implementation: ~30 focused hours across multiple sessions.**
