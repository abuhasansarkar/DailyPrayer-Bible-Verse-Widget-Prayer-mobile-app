import { z } from 'zod';

// ─────────────────────────────────────────────────────────────────────────────
// Environment configuration
//
// Single source of truth for every EXPO_PUBLIC_ value the app reads. Services
// import ENV from here rather than touching process.env directly, so missing
// or malformed config fails in one predictable place.
//
// IMPORTANT: EXPO_PUBLIC_ values are inlined into the JS bundle at build time
// and are readable by anyone who downloads the app. Only publishable values
// belong here — never a secret key.
// ─────────────────────────────────────────────────────────────────────────────

const EnvSchema = z.object({
  EXPO_PUBLIC_SUPABASE_URL: z.string().default(''),
  EXPO_PUBLIC_SUPABASE_ANON_KEY: z.string().default(''),
  EXPO_PUBLIC_REVENUECAT_API_KEY_IOS: z.string().default(''),
  EXPO_PUBLIC_REVENUECAT_API_KEY_ANDROID: z.string().default(''),
  /** Test Store key ("test_…"). Development only — see constants/revenuecat.ts. */
  EXPO_PUBLIC_REVENUECAT_API_KEY_TEST: z.string().default(''),
  EXPO_PUBLIC_BIBLE_API_VERSION: z.string().default(''),
  EXPO_PUBLIC_AI_PROXY_URL: z.string().default(''),
});

const EMPTY_ENV: z.infer<typeof EnvSchema> = {
  EXPO_PUBLIC_SUPABASE_URL: '',
  EXPO_PUBLIC_SUPABASE_ANON_KEY: '',
  EXPO_PUBLIC_REVENUECAT_API_KEY_IOS: '',
  EXPO_PUBLIC_REVENUECAT_API_KEY_ANDROID: '',
  EXPO_PUBLIC_REVENUECAT_API_KEY_TEST: '',
  EXPO_PUBLIC_BIBLE_API_VERSION: '',
  EXPO_PUBLIC_AI_PROXY_URL: '',
};

// Each key must be read as a full static `process.env.X` expression — the Expo
// babel transform inlines these literally and cannot resolve dynamic lookups.
const parsed = EnvSchema.safeParse({
  EXPO_PUBLIC_SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL,
  EXPO_PUBLIC_SUPABASE_ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
  EXPO_PUBLIC_REVENUECAT_API_KEY_IOS: process.env.EXPO_PUBLIC_REVENUECAT_API_KEY_IOS,
  EXPO_PUBLIC_REVENUECAT_API_KEY_ANDROID: process.env.EXPO_PUBLIC_REVENUECAT_API_KEY_ANDROID,
  EXPO_PUBLIC_REVENUECAT_API_KEY_TEST: process.env.EXPO_PUBLIC_REVENUECAT_API_KEY_TEST,
  EXPO_PUBLIC_BIBLE_API_VERSION: process.env.EXPO_PUBLIC_BIBLE_API_VERSION,
  EXPO_PUBLIC_AI_PROXY_URL: process.env.EXPO_PUBLIC_AI_PROXY_URL,
});

if (!parsed.success) {
  console.warn('[ENV] Invalid environment configuration:', parsed.error.flatten().fieldErrors);
}

export const ENV = parsed.success ? parsed.data : EMPTY_ENV;

/** Supabase sync is only attempted when both URL and anon key are present. */
export const IS_SUPABASE_CONFIGURED =
  Boolean(ENV.EXPO_PUBLIC_SUPABASE_URL && ENV.EXPO_PUBLIC_SUPABASE_ANON_KEY) &&
  !ENV.EXPO_PUBLIC_SUPABASE_URL.includes('placeholder');
