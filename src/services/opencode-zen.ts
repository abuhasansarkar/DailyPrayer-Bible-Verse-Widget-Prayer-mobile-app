import * as SecureStore from 'expo-secure-store';

const API_KEY_STORAGE_KEY = 'opencode_zen_api_key';
const MODEL_STORAGE_KEY = 'opencode_zen_model';
export const OPENCODE_ZEN_CHAT_ENDPOINT = 'https://opencode.ai/zen/v1/chat/completions';

export const OPENCODE_ZEN_FREE_MODELS = [
  { id: 'mimo-v2.5-free', name: 'MiMo V2.5 Free' },
  { id: 'north-mini-code-free', name: 'North Mini Code Free' },
  { id: 'nemotron-3-ultra-free', name: 'Nemotron 3 Ultra Free' },
  { id: 'deepseek-v4-flash-free', name: 'DeepSeek V4 Flash Free' },
] as const;

export type OpenCodeZenModelId = (typeof OPENCODE_ZEN_FREE_MODELS)[number]['id'];

export async function getOpenCodeZenApiKey(): Promise<string | null> {
  try {
    const stored = await SecureStore.getItemAsync(API_KEY_STORAGE_KEY);
    if (stored && stored.trim()) {
      return stored.trim();
    }
  } catch (err) {
    console.warn('[OpenCode Zen] SecureStore read failed:', err);
  }
  const envKey = process.env.EXPO_PUBLIC_OPENCODE_API_KEY || process.env.OPENCODE_API_KEY;
  return envKey && envKey.trim() ? envKey.trim() : null;
}

export async function setOpenCodeZenApiKey(apiKey: string): Promise<void> {
  const trimmed = apiKey.trim();
  if (!trimmed) {
    await SecureStore.deleteItemAsync(API_KEY_STORAGE_KEY);
    return;
  }
  await SecureStore.setItemAsync(API_KEY_STORAGE_KEY, trimmed);
}

export async function getOpenCodeZenModel(): Promise<OpenCodeZenModelId> {
  try {
    const stored = await SecureStore.getItemAsync(MODEL_STORAGE_KEY);
    const match = OPENCODE_ZEN_FREE_MODELS.find((model) => model.id === stored);
    if (match) return match.id;
  } catch (err) {
    console.warn('[OpenCode Zen] SecureStore model read failed:', err);
  }
  return 'deepseek-v4-flash-free';
}

export async function setOpenCodeZenModel(modelId: OpenCodeZenModelId): Promise<void> {
  await SecureStore.setItemAsync(MODEL_STORAGE_KEY, modelId);
}

export async function askOpenCodeZen(prompt: string, options?: { system?: string; model?: OpenCodeZenModelId }): Promise<string> {
  const apiKey = await getOpenCodeZenApiKey();
  const model = options?.model ?? await getOpenCodeZenModel();
  const messages = [
    ...(options?.system ? [{ role: 'system', content: options.system }] : []),
    { role: 'user', content: prompt },
  ];

  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (apiKey) {
      headers.Authorization = `Bearer ${apiKey}`;
    }

    const response = await fetch(OPENCODE_ZEN_CHAT_ENDPOINT, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model,
        messages,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;
      if (typeof content === 'string' && content.trim()) {
        return content.trim();
      } else if (Array.isArray(content)) {
        const extracted = content.map((part: any) => (typeof part === 'string' ? part : part?.text || '')).join('').trim();
        if (extracted) return extracted;
      }
    } else {
      const errBody = await response.text().catch(() => '');
      console.warn(`[OpenCode Zen] API HTTP ${response.status}:`, errBody);
    }
  } catch (err) {
    console.warn('[OpenCode Zen] Remote request skipped/failed:', err);
  }

  // Graceful fallback spiritual reflection & prayer generator
  return generateCompanionFallback(prompt, options?.system);
}

function generateCompanionFallback(prompt: string, system?: string): string {
  const lowerPrompt = prompt.toLowerCase();
  
  if (lowerPrompt.includes('prayer') || lowerPrompt.includes('pray') || system?.includes('prayer')) {
    return `Heavenly Father,\n\nWe come before You with thankful hearts, seeking Your guidance, wisdom, and peace. You know every care and thought on our hearts today.\n\n"Do not be anxious about anything, but in every situation, by prayer and petition, with thanksgiving, present your requests to God." — Philippians 4:6\n\nGrant courage and clarity in every step today. May Your grace overflow and Your peace guard our hearts and minds in Christ Jesus.\n\nAmen.`;
  }
  
  if (lowerPrompt.includes('verse') || lowerPrompt.includes('scripture') || lowerPrompt.includes('explain')) {
    return `Scripture Reflection:\n\n"The Lord is my light and my salvation—whom shall I fear? The Lord is the stronghold of my life—of whom shall I be afraid?" — Psalm 27:1\n\nKey Takeaway:\nGod's presence provides both direction (light) and security (stronghold). Whatever challenge you face today, remember that God's truth goes before you and surrounds you with unshakeable love.`;
  }

  return `Spiritual Insight & Reflection:\n\nWalk faithfully today knowing that God's grace is renewed every morning. Take a moment in prayer to surrender your worries and reflect on Psalm 46:10 — "Be still, and know that I am God."\n\nMay peace, strength, and joy fill your spirit today.`;
}