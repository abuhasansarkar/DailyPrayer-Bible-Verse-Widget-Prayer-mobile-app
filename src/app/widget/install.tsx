import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useAppStore } from '@/store/app.store';

export default function WidgetInstallGuideScreen() {
  const { t } = useTranslation();
  const systemScheme = useColorScheme();
  const { colorScheme } = useAppStore();
  const isDark = (colorScheme === 'system' ? systemScheme : colorScheme) === 'dark';
  const [platform, setPlatform] = useState<'ios' | 'android'>('ios');

  const bg = isDark ? '#1E1C18' : '#FFF9EE';
  const surfaceBg = isDark ? '#2A2720' : '#F1E6D3';
  const cardBg = isDark ? '#332F26' : '#FFFFFF';
  const textPrimary = isDark ? '#F5EDD8' : '#292B28';
  const textSecondary = isDark ? '#B8AD97' : '#77766F';

  const iosSteps = [
    { step: 1, title: 'Enter Jiggle Mode', desc: 'From your Home Screen, touch and hold an empty area or widget until apps jiggle.' },
    { step: 2, title: 'Tap the Add (+) Button', desc: 'Tap the (+) button in the top-left corner of your screen.' },
    { step: 3, title: 'Search DailyPrayer', desc: 'Scroll down or search for "DailyPrayer" in the widget gallery.' },
    { step: 4, title: 'Choose Widget Size', desc: 'Swipe left to choose from Small, Medium, or Large, then tap Add Widget.' },
    { step: 5, title: 'Place & Customize', desc: 'Drag your widget to your preferred spot, then tap Done in the top right.' },
  ];

  const androidSteps = [
    { step: 1, title: 'Long-press Home Screen', desc: 'On your Home Screen, touch and hold an empty space.' },
    { step: 2, title: 'Tap Widgets', desc: 'Tap the "Widgets" icon from the menu at the bottom.' },
    { step: 3, title: 'Find DailyPrayer', desc: 'Scroll down the app list to find "DailyPrayer".' },
    { step: 4, title: 'Touch and Hold', desc: 'Touch and hold your preferred DailyPrayer widget size.' },
    { step: 5, title: 'Drag & Drop', desc: 'Drag the widget to where you want it on your screen and release.' },
  ];

  const steps = platform === 'ios' ? iosSteps : androidSteps;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: bg }}>
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingVertical: 16 }}>
        <Pressable onPress={router.back} style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: surfaceBg, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontSize: 18, color: textPrimary }}>←</Text>
        </Pressable>
        <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 20, color: textPrimary }}>How to Add Widgets</Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 60 }} showsVerticalScrollIndicator={false}>
        {/* Platform Selector */}
        <View style={{ flexDirection: 'row', backgroundColor: surfaceBg, borderRadius: 14, padding: 4, marginBottom: 24 }}>
          <Pressable
            onPress={() => setPlatform('ios')}
            style={{ flex: 1, paddingVertical: 10, borderRadius: 11, alignItems: 'center', backgroundColor: platform === 'ios' ? cardBg : 'transparent' }}
          >
            <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 15, color: platform === 'ios' ? textPrimary : textSecondary }}>
               iPhone / iOS
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setPlatform('android')}
            style={{ flex: 1, paddingVertical: 10, borderRadius: 11, alignItems: 'center', backgroundColor: platform === 'android' ? cardBg : 'transparent' }}
          >
            <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 15, color: platform === 'android' ? textPrimary : textSecondary }}>
              🤖 Android
            </Text>
          </Pressable>
        </View>

        {/* Steps */}
        <View style={{ gap: 16 }}>
          {steps.map((s, index) => (
            <Animated.View key={s.step} entering={FadeInDown.duration(400).delay(index * 80)} style={{ backgroundColor: cardBg, borderRadius: 20, padding: 20, flexDirection: 'row', gap: 16, alignItems: 'flex-start' }}>
              <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#F2B84B', alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 16, color: '#292B28' }}>{s.step}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 16, color: textPrimary, marginBottom: 4 }}>
                  {s.title}
                </Text>
                <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 14, lineHeight: 22, color: textSecondary }}>
                  {s.desc}
                </Text>
              </View>
            </Animated.View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
