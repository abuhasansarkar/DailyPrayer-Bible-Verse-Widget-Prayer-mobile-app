import { useState, useCallback, useEffect } from 'react';
import * as Haptics from 'expo-haptics';
import { speakText, stopSpeaking, toggleSoundscape, stopSoundscape, SoundscapeId } from '@/services/audio';

export function useAudioPlayer() {
  const [isPlayingSpeech, setIsPlayingSpeech] = useState(false);
  const [speechRate, setSpeechRate] = useState(0.95);
  const [activeSoundscape, setActiveSoundscape] = useState<SoundscapeId>(null);

  useEffect(() => {
    return () => {
      stopSpeaking();
      stopSoundscape();
    };
  }, []);

  const playVerseSpeech = useCallback(
    async (text: string) => {
      Haptics.selectionAsync();
      if (isPlayingSpeech) {
        await stopSpeaking();
        setIsPlayingSpeech(false);
      } else {
        setIsPlayingSpeech(true);
        await speakText(text, {
          rate: speechRate,
          onDone: () => setIsPlayingSpeech(false),
          onError: () => setIsPlayingSpeech(false),
        });
      }
    },
    [isPlayingSpeech, speechRate]
  );

  const changeRate = useCallback((newRate: number) => {
    setSpeechRate(newRate);
  }, []);

  const selectSoundscape = useCallback(
    async (id: SoundscapeId) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      if (activeSoundscape === id) {
        await stopSoundscape();
        setActiveSoundscape(null);
      } else {
        const success = await toggleSoundscape(id);
        if (success) {
          setActiveSoundscape(id);
        } else {
          setActiveSoundscape(null);
        }
      }
    },
    [activeSoundscape]
  );

  return {
    isPlayingSpeech,
    speechRate,
    activeSoundscape,
    playVerseSpeech,
    changeRate,
    selectSoundscape,
  };
}
