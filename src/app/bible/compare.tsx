import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowLeft, Search } from '@/components/ui/LucideIcons';
import { getBibleVerse, formatBibleText } from '@/services/bibleApi';
import { useResolvedTheme } from '@/hooks/use-theme';

export default function BibleCompareScreen() {
  const { isDark } = useResolvedTheme();
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

      setKjvText(kjvRes?.text ? formatBibleText(kjvRes.text) : 'For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life.');
      setWebText(webRes?.text ? formatBibleText(webRes.text) : 'For God so loved the world, that he gave his only born Son, that whoever believes in him should not perish, but have eternal life.');
    } catch {
      // Ignore
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-[#FFF9EE] dark:bg-[#1E1C18]">
      {/* Header */}
      <View className="flex-row items-center px-6 py-4 border-b border-[#E8DFC9] dark:border-[#3D382E]">
        <TouchableOpacity onPress={() => router.back()} className="p-2 rounded-full bg-[#F5EDD8] dark:bg-[#2A2720] mr-3">
          <ArrowLeft size={20} color="#292B28" />
        </TouchableOpacity>
        <View>
          <Text className="text-xl font-bold text-[#292B28] dark:text-[#F5EDD8]">Compare Translations</Text>
          <Text className="text-xs text-[#77766F]">Side-by-side Scripture view</Text>
        </View>
      </View>

      <ScrollView className="flex-1 px-6 pt-4" contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Input Bar */}
        <View className="bg-[#F5EDD8] dark:bg-[#2A2720] rounded-2xl p-4 mb-6 border border-[#E8DFC9] dark:border-[#3D382E]">
          <Text className="text-xs font-bold text-[#77766F] uppercase tracking-wider mb-2">Select Passage</Text>
          <View className="flex-row gap-2 mb-3">
            <TextInput
              className="flex-2 bg-[#FFF9EE] dark:bg-[#1E1C18] rounded-xl px-3 py-2 text-[#292B28] dark:text-[#F5EDD8] font-semibold border border-[#E8DFC9] dark:border-[#3D382E]"
              value={book}
              onChangeText={setBook}
              placeholder="Book (e.g. John)"
              placeholderTextColor={isDark ? '#8C8374' : '#B8B2AA'}
            />
            <TextInput
              className="flex-1 bg-[#FFF9EE] dark:bg-[#1E1C18] rounded-xl px-3 py-2 text-[#292B28] dark:text-[#F5EDD8] font-semibold border border-[#E8DFC9] dark:border-[#3D382E] text-center"
              value={chapter}
              onChangeText={setChapter}
              keyboardType="numeric"
              placeholder="Ch"
              placeholderTextColor={isDark ? '#8C8374' : '#B8B2AA'}
            />
            <TextInput
              className="flex-1 bg-[#FFF9EE] dark:bg-[#1E1C18] rounded-xl px-3 py-2 text-[#292B28] dark:text-[#F5EDD8] font-semibold border border-[#E8DFC9] dark:border-[#3D382E] text-center"
              value={verse}
              onChangeText={setVerse}
              keyboardType="numeric"
              placeholder="Vs"
              placeholderTextColor={isDark ? '#8C8374' : '#B8B2AA'}
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
        <Text className="text-xs font-bold text-[#77766F] dark:text-[#B8AD97] uppercase tracking-wider mb-3">Side-by-Side Comparison</Text>

        <View className="gap-4">
          <View className="bg-[#FEF3D1] dark:bg-[#332A18] rounded-2xl p-5 border border-[#F2B84B]/30">
            <Text className="text-xs font-bold text-[#F2B84B] uppercase mb-2">KJV — King James Version</Text>
            <Text className="text-base text-[#292B28] dark:text-[#F5EDD8] leading-relaxed font-serif">
              {kjvText || 'For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life.'}
            </Text>
          </View>

          <View className="bg-[#E2EAE0] dark:bg-[#23301F] rounded-2xl p-5 border border-[#96AA88]/30">
            <Text className="text-xs font-bold text-[#617558] dark:text-[#A8BFA1] uppercase mb-2">WEB — World English Bible</Text>
            <Text className="text-base text-[#1E2E1A] dark:text-[#DCE8D6] leading-relaxed font-serif">
              {webText || 'For God so loved the world, that he gave his only born Son, that whoever believes in him should not perish, but have eternal life.'}
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
