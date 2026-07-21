let SpeechModule: typeof import('expo-speech') | null = null;
let AudioModule: typeof import('expo-av') | null = null;

function getSpeech() {
  if (SpeechModule) return SpeechModule;
  try {
    SpeechModule = require('expo-speech');
    return SpeechModule;
  } catch {
    return null;
  }
}

function getAudio() {
  if (AudioModule) return AudioModule;
  try {
    AudioModule = require('expo-av');
    return AudioModule;
  } catch {
    return null;
  }
}

export interface AudioState {
  isSpeaking: boolean;
  rate: number;
  pitch: number;
  currentSoundscape: SoundscapeId | null;
}

export type SoundscapeId = 'rain' | 'sanctuary' | 'waves' | 'organ' | null;

export const SOUNDSCAPES: Record<NonNullable<SoundscapeId>, { title: string; icon: string; description: string; url: string }> = {
  rain: {
    title: 'Gentle Rainfall',
    icon: '🌧️',
    description: 'Soft raindrops creating a soothing atmosphere',
    url: 'https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3?filename=soft-rain-ambient-111154.mp3',
  },
  sanctuary: {
    title: 'Peaceful Sanctuary',
    icon: '🕊️',
    description: 'Deep calming resonance for sacred focus',
    url: 'https://cdn.pixabay.com/download/audio/2022/03/15/audio_c8c886e30b.mp3?filename=meditation-piano-10821.mp3',
  },
  waves: {
    title: 'Morning Waves',
    icon: '🌊',
    description: 'Rhythmic sea waves bringing stillness',
    url: 'https://cdn.pixabay.com/download/audio/2022/01/18/audio_d0a13f69d2.mp3?filename=ocean-waves-ambient-110624.mp3',
  },
  organ: {
    title: 'Sacred Organ',
    icon: '🎹',
    description: 'Warm acoustic harmony for prayer',
    url: 'https://cdn.pixabay.com/download/audio/2021/08/09/audio_88307223b3.mp3?filename=church-organ-pad-7193.mp3',
  },
};

let activeSound: any = null;

export async function speakText(
  text: string,
  options?: { rate?: number; onDone?: () => void; onError?: (err: any) => void }
): Promise<void> {
  const Speech = getSpeech();
  if (!Speech) {
    console.warn('[AudioService] expo-speech module is not available.');
    options?.onError?.(new Error('expo-speech unavailable'));
    return;
  }

  try {
    const isSpeaking = await Speech.isSpeakingAsync();
    if (isSpeaking) {
      await Speech.stop();
    }

    Speech.speak(text, {
      language: 'en-US',
      rate: options?.rate ?? 0.95,
      pitch: 1.0,
      onDone: options?.onDone,
      onError: options?.onError,
    });
  } catch (err) {
    console.warn('[AudioService] Speak error:', err);
    options?.onError?.(err);
  }
}

export async function stopSpeaking(): Promise<void> {
  const Speech = getSpeech();
  if (!Speech) return;
  try {
    const isSpeaking = await Speech.isSpeakingAsync();
    if (isSpeaking) {
      await Speech.stop();
    }
  } catch {
    // Ignore stop error
  }
}

export async function toggleSoundscape(soundscapeId: SoundscapeId): Promise<boolean> {
  const Audio = getAudio()?.Audio;
  if (!Audio) {
    console.warn('[AudioService] expo-av Audio module unavailable.');
    return false;
  }

  try {
    if (activeSound) {
      await activeSound.unloadAsync();
      activeSound = null;
    }

    if (!soundscapeId || !SOUNDSCAPES[soundscapeId]) {
      return false;
    }

    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: true,
      shouldDuckAndroid: true,
    });

    const soundUrl = SOUNDSCAPES[soundscapeId].url;
    const { sound } = await Audio.Sound.createAsync(
      { uri: soundUrl },
      { shouldPlay: true, isLooping: true, volume: 0.5 }
    );

    activeSound = sound;
    return true;
  } catch (error) {
    console.warn('Soundscape play failed:', error);
    return false;
  }
}

export async function stopSoundscape(): Promise<void> {
  if (activeSound) {
    try {
      await activeSound.stopAsync();
      await activeSound.unloadAsync();
    } catch {
      // Ignore unload errors
    } finally {
      activeSound = null;
    }
  }
}
