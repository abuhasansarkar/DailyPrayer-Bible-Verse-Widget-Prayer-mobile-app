# DailyPrayer

An offline-first daily devotional app — a Bible verse, a guided prayer, a
journal and a streak, built with Expo (SDK 57) and React Native.

## Getting started

```bash
npm install
cp .env.example .env    # fill in your own values
npx expo start
```

`npx expo start` opens the dev menu for a development build, an iOS simulator,
or an Android emulator. Some features need native modules (notifications,
SQLite, in-app purchases) and will degrade gracefully in Expo Go — use a
[development build](https://docs.expo.dev/develop/development-builds/introduction/)
for the full app.

## Scripts

| Command | What it does |
| --- | --- |
| `npm start` | Start the Expo dev server |
| `npm run ios` / `npm run android` | Build and run natively |
| `npm run web` | Run the web build |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint via `expo lint` |
| `npm test` | Jest suite |
| `npm run check` | typecheck + lint + tests (use before pushing) |

## Project layout

```
src/
  app/            expo-router routes (this is the router root, not /app)
    (onboarding)/ first-run flow
    (tabs)/       Today, Explore, Prayer Wall, Pray, Journal, Library
    (auth)/       optional Supabase sign-in
  components/     UI, split by feature
  constants/      theme, entitlements, env, Bible book list
  db/             SQLite schema, migrations, seed data
  hooks/          data-loading and app hooks
  i18n/           en + fr locales
  services/       Bible API, notifications, audio, purchases, sync
  store/          zustand stores (app, user, subscription)
  types/          shared types
```

Routes live in `src/app`, not a top-level `app/` — Expo's Metro config prefers
`src/app` when it exists.

## Architecture notes

**Offline-first.** SQLite is the source of truth. The app seeds content on
first launch and works fully offline; the network only enriches it (fetching
uncached Bible chapters). Schema changes go in `src/db/schema.ts` as a new
numbered entry in `MIGRATIONS` with `DB_VERSION` bumped.

**Bible text.** Only public-domain translations ship: KJV, ASV and WEB, served
from the [wldeh/bible-api](https://github.com/wldeh/bible-api) CDN. Do not add
NIV, ESV, NLT, CSB, NKJV or MSG — they are copyrighted and need a publisher
licence. See `BibleTranslation` in `src/types/verse.ts`.

**Entitlements.** `src/constants/entitlements.ts` holds both the free-tier
limits and the paywall copy, so the marketing text cannot drift from what is
actually enforced. Add a gate before adding a claim.

**React Compiler** is enabled (`app.json` → `experiments.reactCompiler`).
Effects must not call `setState` synchronously; use `useAsyncData`
(`src/hooks/use-async-data.ts`) for data loading, or adjust state during render
for prop-change resets.

## Environment

All config is read through `src/constants/env.ts`. Every key is `EXPO_PUBLIC_`,
which means **it is inlined into the JS bundle and readable by anyone who
downloads the app** — only publishable values belong in `.env`:

| Variable | Purpose |
| --- | --- |
| `EXPO_PUBLIC_SUPABASE_URL` / `..._ANON_KEY` | Optional cloud backup. Unset = local-only. |
| `EXPO_PUBLIC_REVENUECAT_API_KEY_IOS` / `..._ANDROID` | Public RevenueCat SDK keys. |
| `EXPO_PUBLIC_BIBLE_API_VERSION` | Override the default CDN translation id. |
| `EXPO_PUBLIC_AI_PROXY_URL` | Optional server proxy for the AI assistant. |

The AI assistant key is deliberately **not** an env var. Users enter their own
key in Settings (stored in `expo-secure-store`), or you run a proxy that holds
the key server-side and point `EXPO_PUBLIC_AI_PROXY_URL` at it.

Without a RevenueCat key, `__DEV__` builds fall back to preview packages so the
paywall can be worked on; release builds disable purchases instead of granting
entitlements.

## Building

EAS is configured in `eas.json`. The project is not yet linked — run
`eas init` once to create the project and populate `extra.eas.projectId`.

```bash
eas build --profile preview --platform ios
```

## License

See [LICENSE](LICENSE).
