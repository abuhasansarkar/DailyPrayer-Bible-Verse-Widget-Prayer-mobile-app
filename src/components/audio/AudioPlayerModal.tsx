import React, { useState } from 'react';
import { View, Text, Modal, TouchableOpacity } from 'react-native';
import { Play, Square, X, Music, Sparkles } from '@/components/ui/LucideIcons';
import { speakText, stopSpeaking, toggleSoundscape, stopSoundscape, SOUNDSCAPES, SoundscapeId } from '@/services/audio';

interface AudioPlayerModalProps {
  visible: boolean;
  onClose: () => void;
  verseText?: string;
  verseReference?: string;
}

export function AudioPlayerModal({ visible, onClose, verseText, verseReference }: AudioPlayerModalProps) {
  const [isPlayingText, setIsPlayingText] = useState(false);
  const [activeSoundscape, setActiveSoundscape] = useState<SoundscapeId>(null);

  const handleToggleSpeak = async () => {
    if (isPlayingText) {
      await stopSpeaking();
      setIsPlayingText(false);
    } else if (verseText) {
      setIsPlayingText(true);
      const textToRead = `${verseReference ? verseReference + '. ' : ''}${verseText}`;
      await speakText(textToRead, {
        onDone: () => setIsPlayingText(false),
        onError: () => setIsPlayingText(false),
      });
    }
  };

  const handleSelectSoundscape = async (id: SoundscapeId) => {
    if (activeSoundscape === id) {
      await stopSoundscape();
      setActiveSoundscape(null);
    } else {
      setActiveSoundscape(id);
      await toggleSoundscape(id);
    }
  };

  const handleClose = async () => {
    await stopSpeaking();
    setIsPlayingText(false);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View className="flex-1 bg-black/60 justify-end">
        <View className="bg-[#FFF9EE] dark:bg-[#1E1C18] rounded-t-3xl p-6 border-t border-[#E8DFC9] dark:border-[#332E25]">
          {/* Header */}
          <View className="flex-row items-center justify-between mb-6">
            <View className="flex-row items-center">
              <View className="w-10 h-10 rounded-full bg-[#FEF3D1] dark:bg-[#332A18] items-center justify-center mr-3">
                <Music size={20} color="#F2B84B" />
              </View>
              <View>
                <Text className="text-lg font-bold text-[#292B28] dark:text-[#F5EDD8]">Audio Companion</Text>
                <Text className="text-xs text-[#77766F] dark:text-[#A09E95]">Listen to Scripture & Guided Audio</Text>
              </View>
            </View>
            <TouchableOpacity onPress={handleClose} className="p-2 rounded-full bg-[#F5EDD8] dark:bg-[#2A2720]">
              <X size={20} color="#292B28" />
            </TouchableOpacity>
          </View>

          {/* Verse Reading Section */}
          {verseText && (
            <View className="bg-[#F5EDD8] dark:bg-[#2A2720] rounded-2xl p-4 mb-6 border border-[#E8DFC9] dark:border-[#332E25]">
              <Text className="text-xs font-bold text-[#D98262] uppercase mb-1">Text To Speech</Text>
              <Text className="text-sm font-semibold text-[#292B28] dark:text-[#F5EDD8] mb-3" numberOfLines={2}>
                {verseReference}: &quot;{verseText}&quot;
              </Text>
              <TouchableOpacity
                onPress={handleToggleSpeak}
                className="flex-row items-center justify-center bg-[#F2B84B] rounded-xl py-3"
              >
                {isPlayingText ? (
                  <View className="flex-row items-center">
                    <View style={{ marginRight: 8 }}>
                      <Square size={18} color="#292B28" />
                    </View>
                    <Text className="font-bold text-[#292B28]">Stop Reading</Text>
                  </View>
                ) : (
                  <View className="flex-row items-center">
                    <View style={{ marginRight: 8 }}>
                      <Play size={18} color="#292B28" />
                    </View>
                    <Text className="font-bold text-[#292B28]">Read Verse Aloud</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          )}

          {/* Ambient Soundscapes */}
          <Text className="text-xs font-bold text-[#77766F] dark:text-[#A09E95] uppercase tracking-wider mb-3">
            Ambient Meditation Soundscapes
          </Text>
          <View className="gap-2 mb-6">
            {(Object.keys(SOUNDSCAPES) as NonNullable<SoundscapeId>[]).map(key => {
              const item = SOUNDSCAPES[key];
              const isSelected = activeSoundscape === key;
              return (
                <TouchableOpacity
                  key={key}
                  onPress={() => handleSelectSoundscape(key)}
                  className={`flex-row items-center p-3 rounded-2xl border ${
                    isSelected
                      ? 'bg-[#FEF3D1] dark:bg-[#332A18] border-[#F2B84B]'
                      : 'bg-[#F5EDD8] dark:bg-[#2A2720] border-[#E8DFC9] dark:border-[#332E25]'
                  }`}
                >
                  <Text className="text-2xl mr-3">{item.icon}</Text>
                  <View className="flex-1">
                    <Text className="font-bold text-[#292B28] dark:text-[#F5EDD8]">{item.title}</Text>
                    <Text className="text-xs text-[#77766F] dark:text-[#A09E95]">{item.description}</Text>
                  </View>
                  {isSelected && <Sparkles size={20} color="#F2B84B" />}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </View>
    </Modal>
  );
}
