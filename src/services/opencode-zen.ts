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
  return SecureStore.getItemAsync(API_KEY_STORAGE_KEY);
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
  const stored = await SecureStore.getItemAsync(MODEL_STORAGE_KEY);
  const match = OPENCODE_ZEN_FREE_MODELS.find((model) => model.id === stored);
  return match?.id ?? 'deepseek-v4-flash-free';
}

export async function setOpenCodeZenModel(modelId: OpenCodeZenModelId): Promise<void> {
  await SecureStore.setItemAsync(MODEL_STORAGE_KEY, modelId);
}

export async function askOpenCodeZen(prompt: string, options?: { system?: string; model?: OpenCodeZenModelId }) {
  const apiKey = await getOpenCodeZenApiKey();
  if (!apiKey) {
    throw new Error('OpenCode Zen API key is not configured.');
  }

  const model = options?.model ?? await getOpenCodeZenModel();
  const messages = [
    ...(options?.system ? [{ role: 'system', content: options.system }] : []),
    { role: 'user', content: prompt },
  ];

  const response = await fetch(OPENCODE_ZEN_CHAT_ENDPOINT, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ model, messages }),
  });

  if (!response.ok) {
    throw new Error(`OpenCode Zen request failed with ${response.status}`);
  }

  const json = await response.json();
  return json?.choices?.[0]?.message?.content ?? '';
}