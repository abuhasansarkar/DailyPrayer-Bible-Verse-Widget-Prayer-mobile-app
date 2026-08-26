import * as SecureStore from 'expo-secure-store';

import { ENV } from '@/constants/env';

// ─────────────────────────────────────────────────────────────────────────────
// AI assistant
//
// Replaces the old services/opencode-zen.ts, which required each user to paste
// their own API key into Settings. That is not a workable consumer flow, and
// the key-entry screen only ever worked on iOS (it used Alert.prompt).
//
// The app now talks to a server proxy that holds the key:
//
//     app  ──►  EXPO_PUBLIC_AI_PROXY_URL  ──►  provider
//
// This is the only safe way to ship a hosted key. An EXPO_PUBLIC_ value is
// inlined into the JS bundle at build time and can be read out of any
// installed copy of the app, so the key must never be on the device.
//
// With no proxy configured the assistant reports itself unavailable rather
// than quietly returning canned text dressed up as a model answer.
// ─────────────────────────────────────────────────────────────────────────────

const MODEL_STORAGE_KEY = 'ai_assistant_model';
const REQUEST_TIMEOUT_MS = 25_000;
const MAX_ATTEMPTS = 3;

const AI_PROXY_URL = ENV.EXPO_PUBLIC_AI_PROXY_URL.trim() || null;

/**
 * Models offered to the user.
 *
 * The previous list included `north-mini-code-free`, a code-completion model,
 * which produced poor devotional output. Only general-purpose chat models
 * belong here.
 */
export const AI_MODELS = [
  { id: 'deepseek-v4-flash-free', name: 'Swift', description: 'Fastest replies' },
  { id: 'mimo-v2.5-free', name: 'Balanced', description: 'Good all-round quality' },
  { id: 'nemotron-3-ultra-free', name: 'Thoughtful', description: 'Deepest reflection, slower' },
] as const;

export type AiModelId = (typeof AI_MODELS)[number]['id'];

export const DEFAULT_MODEL: AiModelId = 'mimo-v2.5-free';

export interface AiMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

/** Where a reply came from. The UI must not present a non-`model` reply as AI. */
export type AiSource = 'model' | 'offline' | 'crisis' | 'rate-limited' | 'unavailable';

export interface AiReply {
  text: string;
  source: AiSource;
  /** True when the text did not come from the model and should be labelled. */
  isFallback: boolean;
}

// ── Availability ─────────────────────────────────────────────────────────────

/** True when a proxy is configured and the assistant can reach a model. */
export function isAiConfigured(): boolean {
  return AI_PROXY_URL !== null;
}

// ── Model preference ─────────────────────────────────────────────────────────

export async function getAiModel(): Promise<AiModelId> {
  try {
    const stored = await SecureStore.getItemAsync(MODEL_STORAGE_KEY);
    const match = AI_MODELS.find((model) => model.id === stored);
    if (match) return match.id;
  } catch (err) {
    console.warn('[AI] Could not read the stored model:', err);
  }
  return DEFAULT_MODEL;
}

export async function setAiModel(modelId: AiModelId): Promise<void> {
  try {
    await SecureStore.setItemAsync(MODEL_STORAGE_KEY, modelId);
  } catch (err) {
    console.warn('[AI] Could not store the model preference:', err);
  }
}

// ── Crisis handling ──────────────────────────────────────────────────────────

/**
 * Phrases that indicate the person may be in danger.
 *
 * A prayer app attracts disclosures a devotional model should not be the one
 * answering. This is intentionally a blunt keyword check: a false positive
 * costs a caring message with helpline numbers, a false negative costs
 * routing someone in crisis to a generic model completion.
 */
const CRISIS_PATTERNS: RegExp[] = [
  /\bkill(ing)?\s+my ?self\b/i,
  /\bkill\s+me\b/i,
  /\bsuicid(e|al)\b/i,
  /\bend(ing)?\s+(my|it)\s+(life|all)\b/i,
  /\btake\s+my\s+own\s+life\b/i,
  /\bwant\s+to\s+die\b/i,
  /\bdon'?t\s+want\s+to\s+(live|be\s+alive)\b/i,
  /\bbetter\s+off\s+dead\b/i,
  /\bself[-\s]?harm\b/i,
  /\bhurt(ing)?\s+my ?self\b/i,
  /\bcut(ting)?\s+my ?self\b/i,
  /\bno\s+reason\s+to\s+live\b/i,
];

export function detectCrisis(text: string): boolean {
  return CRISIS_PATTERNS.some((pattern) => pattern.test(text));
}

/**
 * Shown instead of a model reply when `detectCrisis` fires.
 *
 * Every resource named here is real and free. Scripture is King James
 * (public domain), matching the rest of the app.
 */
export const CRISIS_RESPONSE = [
  'I am really glad you told me, and I do not want to answer this one with a generated prayer.',
  '',
  'Please talk to a person who can help right now:',
  '',
  '• United States — call or text 988 (Suicide & Crisis Lifeline)',
  '• United Kingdom & Ireland — call 116 123 (Samaritans)',
  '• Anywhere else — findahelpline.com lists free helplines by country',
  '• If you are in immediate danger, call your local emergency number',
  '',
  'If there is someone nearby you trust — a friend, a family member, your pastor — please tell them how you are feeling tonight.',
  '',
  '"The LORD is nigh unto them that are of a broken heart; and saveth such as be of a contrite spirit." — Psalm 34:18',
  '',
  'You are not a burden, and you do not have to carry this alone.',
].join('\n');

// ── Rate limiting ────────────────────────────────────────────────────────────

/**
 * Sliding-window limiter.
 *
 * This protects the user from a runaway loop and gives a clear message
 * instead of a wall of failures. It is NOT abuse protection: it lives in
 * memory and resets when the app restarts. The real per-user limit has to be
 * enforced by the proxy, which is the only place a client cannot bypass.
 */
export class RateLimiter {
  private timestamps: number[] = [];

  constructor(
    private readonly maxRequests: number,
    private readonly windowMs: number,
    private readonly now: () => number = Date.now
  ) {}

  /** Records a request and returns whether it is allowed. */
  tryAcquire(): boolean {
    const cutoff = this.now() - this.windowMs;
    this.timestamps = this.timestamps.filter((t) => t > cutoff);

    if (this.timestamps.length >= this.maxRequests) return false;

    this.timestamps.push(this.now());
    return true;
  }

  /** Milliseconds until the next request would be allowed. 0 when allowed now. */
  retryAfterMs(): number {
    const cutoff = this.now() - this.windowMs;
    const live = this.timestamps.filter((t) => t > cutoff);
    if (live.length < this.maxRequests) return 0;
    return Math.max(0, live[0]! + this.windowMs - this.now());
  }

  reset(): void {
    this.timestamps = [];
  }
}

/** 20 requests per 10 minutes — generous for real use, stops runaway loops. */
const limiter = new RateLimiter(20, 10 * 60 * 1000);

export function resetRateLimit(): void {
  limiter.reset();
}

function describeWait(ms: number): string {
  const minutes = Math.ceil(ms / 60_000);
  if (minutes <= 1) return 'a minute';
  return `${minutes} minutes`;
}

// ── Request ──────────────────────────────────────────────────────────────────

const RETRYABLE_STATUS = new Set([408, 429, 500, 502, 503, 504]);

function parseRetryAfter(header: string | null): number | null {
  if (!header) return null;
  const seconds = Number(header);
  return Number.isFinite(seconds) && seconds >= 0 ? seconds * 1000 : null;
}

function backoffMs(attempt: number): number {
  // 500ms, 1s, 2s … with jitter so retries from many devices do not align.
  return 2 ** attempt * 500 + Math.floor(Math.random() * 250);
}

function delay(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(resolve, ms);
    signal?.addEventListener(
      'abort',
      () => {
        clearTimeout(timer);
        reject(new DOMException('Aborted', 'AbortError'));
      },
      { once: true }
    );
  });
}

/** Pulls the assistant text out of an OpenAI-shaped chat completion. */
export function extractContent(payload: unknown): string | null {
  const content = (payload as { choices?: { message?: { content?: unknown } }[] })?.choices?.[0]
    ?.message?.content;

  if (typeof content === 'string') {
    return content.trim() || null;
  }

  if (Array.isArray(content)) {
    const text = content
      .map((part) => (typeof part === 'string' ? part : ((part as { text?: string })?.text ?? '')))
      .join('')
      .trim();
    return text || null;
  }

  return null;
}

/**
 * One request to the proxy, with its own timeout.
 *
 * The caller's `signal` (screen closed) and the timeout are combined, so
 * either one aborts the fetch.
 */
async function requestOnce(
  messages: AiMessage[],
  model: AiModelId,
  signal?: AbortSignal
): Promise<{ ok: true; text: string } | { ok: false; retryable: boolean; retryAfterMs?: number }> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  const onExternalAbort = () => controller.abort();
  signal?.addEventListener('abort', onExternalAbort, { once: true });

  try {
    const response = await fetch(AI_PROXY_URL!, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      // No Authorization header: the proxy holds the credential. Never
      // forward a key from the device.
      body: JSON.stringify({ model, messages }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const body = await response.text().catch(() => '');
      console.warn(`[AI] HTTP ${response.status}:`, body.slice(0, 300));
      return {
        ok: false,
        retryable: RETRYABLE_STATUS.has(response.status),
        retryAfterMs: parseRetryAfter(response.headers.get('retry-after')) ?? undefined,
      };
    }

    const text = extractContent(await response.json());
    if (!text) {
      console.warn('[AI] Response contained no usable content.');
      return { ok: false, retryable: false };
    }

    return { ok: true, text };
  } catch (err) {
    // A caller-initiated abort must propagate, not be retried.
    if (signal?.aborted) throw err;
    console.warn('[AI] Request failed:', err);
    return { ok: false, retryable: true };
  } finally {
    clearTimeout(timeout);
    signal?.removeEventListener('abort', onExternalAbort);
  }
}

export interface AskOptions {
  system?: string;
  model?: AiModelId;
  /** Prior turns, oldest first. Lets the chat tab actually remember context. */
  history?: AiMessage[];
  /** Abort when the screen closes, so a reply never lands on an unmounted view. */
  signal?: AbortSignal;
}

/**
 * Ask the assistant.
 *
 * Never throws for an expected condition — the returned `source` says what
 * happened, so the caller can label the reply honestly. It does re-throw an
 * AbortError when the caller cancelled, which callers should ignore.
 */
export async function askAi(prompt: string, options: AskOptions = {}): Promise<AiReply> {
  // Crisis routing happens before anything is sent anywhere, so a disclosure
  // is not transmitted to a third party just to be answered generically.
  if (detectCrisis(prompt)) {
    return { text: CRISIS_RESPONSE, source: 'crisis', isFallback: true };
  }

  if (!isAiConfigured()) {
    return {
      text: 'The AI companion is not available in this build. Everything else in DailyPrayer works offline.',
      source: 'unavailable',
      isFallback: true,
    };
  }

  if (!limiter.tryAcquire()) {
    return {
      text: `You have made a lot of requests just now. Please try again in ${describeWait(limiter.retryAfterMs())}.`,
      source: 'rate-limited',
      isFallback: true,
    };
  }

  const model = options.model ?? (await getAiModel());
  const messages: AiMessage[] = [
    ...(options.system ? [{ role: 'system' as const, content: options.system }] : []),
    ...(options.history ?? []),
    { role: 'user' as const, content: prompt },
  ];

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const result = await requestOnce(messages, model, options.signal);

    if (result.ok) {
      return { text: result.text, source: 'model', isFallback: false };
    }

    const isLastAttempt = attempt === MAX_ATTEMPTS - 1;
    if (!result.retryable || isLastAttempt) break;

    await delay(result.retryAfterMs ?? backoffMs(attempt), options.signal);
  }

  return { text: offlineReflection(prompt, options.system), source: 'offline', isFallback: true };
}

// ── Offline content ──────────────────────────────────────────────────────────

/**
 * Shown when the model could not be reached.
 *
 * Returned with `source: 'offline'` so the UI labels it rather than passing
 * it off as a generated answer. All scripture here is King James Version
 * (public domain) — the previous version quoted the NIV, which is
 * copyrighted and contradicted the app's public-domain-only policy.
 */
export function offlineReflection(prompt: string, system?: string): string {
  const haystack = `${prompt} ${system ?? ''}`.toLowerCase();

  if (/\bpray(er|ing)?\b/.test(haystack)) {
    return [
      'Heavenly Father,',
      '',
      'We come before You with thankful hearts, seeking Your guidance, wisdom and peace. You know every care and thought we carry today.',
      '',
      '"Be careful for nothing; but in every thing by prayer and supplication with thanksgiving let your requests be made known unto God." — Philippians 4:6',
      '',
      'Grant courage and clarity in every step today. May Your grace overflow, and may Your peace keep our hearts and minds through Christ Jesus.',
      '',
      'Amen.',
    ].join('\n');
  }

  if (/\bverse|scripture|explain|meaning\b/.test(haystack)) {
    return [
      'Scripture Reflection',
      '',
      '"The LORD is my light and my salvation; whom shall I fear? the LORD is the strength of my life; of whom shall I be afraid?" — Psalm 27:1',
      '',
      'God\'s presence gives both direction (light) and security (strength). Whatever you face today, His truth goes before you and surrounds you.',
    ].join('\n');
  }

  return [
    'A Moment of Stillness',
    '',
    '"Be still, and know that I am God." — Psalm 46:10',
    '',
    'God\'s mercies are new every morning. Take a moment to set down what you are carrying and rest in His presence.',
  ].join('\n');
}
