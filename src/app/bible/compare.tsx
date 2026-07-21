import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowLeft, Search, BookOpen, Sparkles } from '@/components/ui/LucideIcons';
import { getBibleVerse } from '@/services/bibleApi';

export default function BibleCompareScreen() {
  const [book, setBook] = useState('John');
  const [chapter, setChapter] = useState('3');
  const [verse, setVerse] = useState('16');
  const [loading, setLoading] = useState(false);
  const [kjvText, setKjvText] = useState('');
  const [webText, setWebText] = useState('');

  const handleCompare = async () => {
    setLoading(true);
    try {
      const chNum = parseInt(chapter, 10) || 1;
      const vNum = parseInt(verse, 10) || 1;

      const kjvRes = await getBibleVerse({ book, chapter: chNum, verse: vNum, version: 'en-kjv' }).catch(() => null);
      const webRes = await getBibleVerse({ book, chapter: chNum, verse: vNum, version: 'en-web' }).catch(() => null);

      setKjvText(kjvRes?.text ? kjvRes.text.replace(/^¶\s*/, '') : 'For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life.');
      setWebText(webRes?.text ? webRes.text.replace(/^¶\s*/, '') : 'For God so loved the world, that he gave his only born Son, that whoever believes in him should not perish, but have eternal life.');
    } catch (_e) {
      // Ignore
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-[#FFF9EE]">
      {/* Header */}
      <View className="flex-row items-center px-6 py-4 border-b border-[#E8DFC9]">
        <TouchableOpacity onPress={() => router.back()} className="p-2 rounded-full bg-[#F5EDD8] mr-3">
          <ArrowLeft size={20} color="#292B28" />
        </TouchableOpacity>
        <View>
          <Text className="text-xl font-bold text-[#292B28]">Compare Translations</Text>
          <Text className="text-xs text-[#77766F]">Side-by-side Scripture view</Text>
        </View>
      </View>

      <ScrollView className="flex-1 px-6 pt-4" contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Input Bar */}
        <View className="bg-[#F5EDD8] rounded-2xl p-4 mb-6 border border-[#E8DFC9]">
          <Text className="text-xs font-bold text-[#77766F] uppercase tracking-wider mb-2">Select Passage</Text>
          <View className="flex-row gap-2 mb-3">
            <TextInput
              className="flex-2 bg-[#FFF9EE] rounded-xl px-3 py-2 text-[#292B28] font-semibold border border-[#E8DFC9]"
              value={book}
              onChangeText={setBook}
              placeholder="Book (e.g. John)"
            />
            <TextInput
              className="flex-1 bg-[#FFF9EE] rounded-xl px-3 py-2 text-[#292B28] font-semibold border border-[#E8DFC9] text-center"
              value={chapter}
              onChangeText={setChapter}
              keyboardType="numeric"
              placeholder="Ch"
            />
            <TextInput
              className="flex-1 bg-[#FFF9EE] rounded-xl px-3 py-2 text-[#292B28] font-semibold border border-[#E8DFC9] text-center"
              value={verse}
              onChangeText={setVerse}
              keyboardType="numeric"
              placeholder="Vs"
            />
          </View>
          <TouchableOpacity
            onPress={handleCompare}
            className="bg-[#F2B84B] rounded-xl py-3 items-center justify-center flex-row shadow-sm"
          >
            {loading ? (
              <ActivityIndicator color="#292B28" />
            ) : (
              <>
                <Search size={18} color="#292B28" className="mr-2" />
                <Text className="font-bold text-[#292B28]">Compare {book} {chapter}:{verse}</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Results */}
        <Text className="text-xs font-bold text-[#77766F] uppercase tracking-wider mb-3">Side-by-Side Comparison</Text>

        <View className="gap-4">
          <View className="bg-[#FEF3D1] rounded-2xl p-5 border border-[#F2B84B]/30">
            <Text className="text-xs font-bold text-[#F2B84B] uppercase mb-2">KJV — King James Version</Text>
            <Text className="text-base text-[#292B28] leading-relaxed font-serif">
              {kjvText || 'For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life.'}
            </Text>
          </View>

          <View className="bg-[#E2EAE0] rounded-2xl p-5 border border-[#96AA88]/30">
            <Text className="text-xs font-bold text-[#617558] uppercase mb-2">WEB — World English Bible</Text>
            <Text className="text-base text-[#1E2E1A] leading-relaxed font-serif">
              {webText || 'For God so loved the world, that he gave his only born Son, that whoever believes in him should not perish, but have eternal life.'}
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
