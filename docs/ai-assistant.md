# AI assistant

The AI companion (the floating ✨ button → **AI Prayer Features**) is
implemented in [`src/services/ai-assistant.ts`](../src/services/ai-assistant.ts).

## What changed and why

It used to be `services/opencode-zen.ts`, which asked each user to paste their
own OpenCode Zen API key into **Settings → OpenCode Zen → API Key**. That has
been removed:

- asking a devotional-app user for an LLM API key is not a usable consumer flow;
- the key-entry screen only worked on iOS — it used `Alert.prompt`, which does
  not exist on Android, so Android users got a developer-facing message;
- it exposed raw model identifiers ("Nemotron 3 Ultra") in Settings.

The app now talks to **one server proxy** that holds the credential:

```
app  ──►  EXPO_PUBLIC_AI_PROXY_URL  ──►  provider
```

This is the only safe way to ship a hosted key. Every `EXPO_PUBLIC_` value is
inlined into the JS bundle at build time and can be read out of any installed
copy of the app, so a provider key must never reach the device.

## Proxy contract

Set `EXPO_PUBLIC_AI_PROXY_URL` in `.env` to an endpoint that accepts an
OpenAI-shaped chat completion:

```http
POST <EXPO_PUBLIC_AI_PROXY_URL>
Content-Type: application/json

{
  "model": "mimo-v2.5-free",
  "messages": [
    { "role": "system",    "content": "…" },
    { "role": "user",      "content": "…" },
    { "role": "assistant", "content": "…" }
  ]
}
```

Respond with `{ "choices": [{ "message": { "content": "…" } }] }`. A content
array of `{ text }` parts is also accepted.

The app sends **no `Authorization` header** — the proxy attaches the real key.

**The proxy must enforce the per-user rate limit.** The in-app limiter (20
requests / 10 minutes) lives in memory, resets on app restart, and only exists
to stop a runaway loop and give the user a clear message. A client-side limit
is not abuse protection.

With `EXPO_PUBLIC_AI_PROXY_URL` unset, the assistant reports itself unavailable
and shows offline reflections. It does not silently pass canned text off as a
generated answer.

## Behaviour

| Concern | Handling |
| --- | --- |
| **Crisis disclosure** | Checked **before** anything is sent. Returns helpline resources (988, Samaritans 116 123, findahelpline.com) instead of a model completion — and the disclosure is never transmitted to a third party. |
| **Timeout** | 25s per attempt via `AbortController`. Previously there was none, so a hung request hung the modal forever. |
| **Retry** | Up to 3 attempts on 408/429/5xx and network errors, exponential backoff with jitter, honours `Retry-After`. |
| **Cancellation** | The modal aborts the in-flight request when it closes, so a late reply never lands on an unmounted screen. |
| **Rate limit** | 20 requests / 10 min per device, with a "try again in N minutes" message. |
| **Chat memory** | The last 10 turns are sent with each message. The old code sent each message in isolation, so the "chat" could not follow up on anything. |
| **Malformed responses** | `extractContent()` returns `null` rather than throwing on an unexpected payload shape. |

## Honest labelling

`askAi()` returns a `source`, and the UI labels anything that is not `model`:

```ts
type AiSource = 'model' | 'offline' | 'crisis' | 'rate-limited' | 'unavailable';
```

Only `source: 'model'` is a real generated reply. The others render with a
caption ("Offline reflection — the AI companion could not be reached") so a
user is never shown canned text believing a model wrote it.

## Scripture licensing

All offline text quotes the **King James Version** (public domain), and every
system prompt instructs the model to do the same.

The previous fallback quoted the **NIV** (Philippians 4:6 and Psalm 27:1),
which is copyrighted — and it contradicted the public-domain-only rule the app
enforces everywhere else, including
[`normalizeVersion()`](../src/services/bibleApi.ts). `src/__tests__/ai-assistant.test.ts`
asserts that NIV wording cannot come back.

## Models

Three general-purpose models are selectable inside the AI sheet. The old list
included `north-mini-code-free`, a **code-completion** model that produced poor
devotional output; it has been dropped.

## Still open

Before shipping the AI feature publicly (see `plan.md` H4):

- [ ] Stand up the proxy and enforce a real per-user rate limit there
- [ ] Disclose the third-party AI in the privacy policy and in-app before first use
- [ ] Add moderation on the proxy side
