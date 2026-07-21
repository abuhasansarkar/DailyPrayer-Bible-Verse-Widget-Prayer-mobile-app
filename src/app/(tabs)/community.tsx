import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Heart, MessageCircle, Send, Users, Sparkles } from '@/components/ui/LucideIcons';

interface CommunityPrayer {
  id: string;
  author: string;
  location: string;
  request: string;
  prayedCount: number;
  timeAgo: string;
  isPrayed?: boolean;
}

const INITIAL_PRAYERS: CommunityPrayer[] = [
  {
    id: '1',
    author: 'Hannah M.',
    location: 'Texas, USA',
    request: 'Please pray for my mother who is undergoing surgery tomorrow morning. Praying for peace for our family.',
    prayedCount: 42,
    timeAgo: '2h ago',
  },
  {
    id: '2',
    author: 'David K.',
    location: 'London, UK',
    request: 'Asking for wisdom and clarity as I make a major career transition this month.',
    prayedCount: 18,
    timeAgo: '4h ago',
  },
  {
    id: '3',
    author: 'Anonymous',
    location: 'Sydney, AU',
    request: 'Grateful for God’s healing in my daughter’s health tests this week. Thank you all for your prayers!',
    prayedCount: 65,
    timeAgo: '6h ago',
  },
];

export default function CommunityScreen() {
  const [prayers, setPrayers] = useState<CommunityPrayer[]>(INITIAL_PRAYERS);
  const [newRequest, setNewRequest] = useState('');

  const handlePray = (id: string) => {
    setPrayers(prev =>
      prev.map(p => {
        if (p.id === id) {
          const isPrayed = !p.isPrayed;
          return {
            ...p,
            isPrayed,
            prayedCount: isPrayed ? p.prayedCount + 1 : p.prayedCount - 1,
          };
        }
        return p;
      })
    );
  };

  const handlePostRequest = () => {
    if (!newRequest.trim()) return;
    const created: CommunityPrayer = {
      id: String(Date.now()),
      author: 'You',
      location: 'Local',
      request: newRequest.trim(),
      prayedCount: 1,
      timeAgo: 'Just now',
      isPrayed: true,
    };
    setPrayers([created, ...prayers]);
    setNewRequest('');
    Alert.alert('Posted', 'Your prayer request has been shared on the Community Wall.');
  };

  return (
    <SafeAreaView className="flex-1 bg-[#FFF9EE]">
      {/* Header */}
      <View className="flex-row items-center justify-between px-6 py-4 border-b border-[#E8DFC9]">
        <View className="flex-row items-center">
          <View className="w-10 h-10 rounded-full bg-[#FEF3D1] items-center justify-center mr-3">
            <Users size={20} color="#F2B84B" />
          </View>
          <View>
            <Text className="text-xl font-bold text-[#292B28]">Prayer Wall</Text>
            <Text className="text-xs text-[#77766F]">Join believers worldwide in prayer</Text>
          </View>
        </View>
      </View>

      <ScrollView className="flex-1 px-6 pt-4" contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Post Input */}
        <View className="bg-[#F5EDD8] rounded-2xl p-4 mb-6 border border-[#E8DFC9]">
          <Text className="text-xs font-bold text-[#77766F] uppercase tracking-wider mb-2">Share a Prayer Request</Text>
          <TextInput
            className="bg-[#FFF9EE] rounded-xl p-3 text-[#292B28] text-sm mb-3 border border-[#E8DFC9]"
            placeholder="How can the community pray for you today?"
            placeholderTextColor="#B8AD97"
            multiline
            numberOfLines={3}
            value={newRequest}
            onChangeText={setNewRequest}
          />
          <TouchableOpacity
            onPress={handlePostRequest}
            className="bg-[#F2B84B] rounded-xl py-3 items-center justify-center flex-row shadow-sm"
          >
            <Send size={16} color="#292B28" className="mr-2" />
            <Text className="font-bold text-[#292B28]">Post Request</Text>
          </TouchableOpacity>
        </View>

        <Text className="text-xs font-bold text-[#77766F] uppercase tracking-wider mb-4">Recent Prayer Requests</Text>

        <View className="gap-4">
          {prayers.map(item => (
            <View key={item.id} className="bg-[#F5EDD8] rounded-2xl p-5 border border-[#E8DFC9]">
              <View className="flex-row justify-between items-center mb-2">
                <View className="flex-row items-center">
                  <View className="w-8 h-8 rounded-full bg-[#E2EAE0] items-center justify-center mr-2">
                    <Text className="text-xs font-bold text-[#1E2E1A]">{item.author[0]}</Text>
                  </View>
                  <View>
                    <Text className="font-bold text-[#292B28] text-sm">{item.author}</Text>
                    <Text className="text-[10px] text-[#77766F]">{item.location} • {item.timeAgo}</Text>
                  </View>
                </View>
              </View>

              <Text className="text-sm text-[#292B28] leading-relaxed mb-4">{item.request}</Text>

              <TouchableOpacity
                onPress={() => handlePray(item.id)}
                className={`flex-row items-center justify-between p-3 rounded-xl border ${
                  item.isPrayed ? 'bg-[#FEF3D1] border-[#F2B84B]' : 'bg-[#FFF9EE] border-[#E8DFC9]'
                }`}
              >
                <View className="flex-row items-center">
                  <Heart size={18} color={item.isPrayed ? '#D98262' : '#77766F'} fill={item.isPrayed ? '#D98262' : 'none'} className="mr-2" />
                  <Text className={`text-xs font-bold ${item.isPrayed ? 'text-[#D98262]' : 'text-[#77766F]'}`}>
                    {item.isPrayed ? 'You Prayed For This' : 'I Prayed For This'}
                  </Text>
                </View>
                <Text className="text-xs font-bold text-[#292B28]">{item.prayedCount} Believers</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
