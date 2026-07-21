import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Mail, Lock, Sparkles } from '@/components/ui/LucideIcons';
import { supabase } from '@/services/supabase';
import { useUserStore } from '@/store/user.store';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Required', 'Please enter your email and password.');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        Alert.alert('Sign In Failed', error.message);
      } else if (data.user) {
        useUserStore.getState().setProfile(data.user.email?.split('@')[0] || 'User');
        Alert.alert('Welcome Back!', 'Your account has been synced.');
        router.back();
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-[#FFF9EE] px-6 py-4">
      {/* Header */}
      <View className="flex-row items-center mb-8">
        <TouchableOpacity onPress={() => router.back()} className="p-2 rounded-full bg-[#F5EDD8]">
          <ArrowLeft size={20} color="#292B28" />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-[#292B28] ml-4">Sign In</Text>
      </View>

      <View className="items-center mb-8">
        <View className="w-16 h-16 rounded-full bg-[#FEF3D1] items-center justify-center mb-3">
          <Sparkles size={32} color="#F2B84B" />
        </View>
        <Text className="text-2xl font-bold text-[#292B28]">Welcome Back</Text>
        <Text className="text-sm text-[#77766F] mt-1 text-center">
          Sign in to sync your bookmarks, streaks, and prayers across all your devices.
        </Text>
      </View>

      {/* Form */}
      <View className="gap-4">
        <View>
          <Text className="text-xs font-semibold text-[#77766F] uppercase tracking-wider mb-2">Email Address</Text>
          <View className="flex-row items-center bg-[#F5EDD8] rounded-2xl px-4 py-3 border border-[#E8DFC9]">
            <Mail size={18} color="#77766F" className="mr-3" />
            <TextInput
              className="flex-1 text-[#292B28] text-base"
              placeholder="you@example.com"
              placeholderTextColor="#B8AD97"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>
        </View>

        <View>
          <Text className="text-xs font-semibold text-[#77766F] uppercase tracking-wider mb-2">Password</Text>
          <View className="flex-row items-center bg-[#F5EDD8] rounded-2xl px-4 py-3 border border-[#E8DFC9]">
            <Lock size={18} color="#77766F" className="mr-3" />
            <TextInput
              className="flex-1 text-[#292B28] text-base"
              placeholder="••••••••"
              placeholderTextColor="#B8AD97"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>
        </View>

        <TouchableOpacity
          onPress={handleLogin}
          disabled={loading}
          className="bg-[#F2B84B] rounded-2xl py-4 items-center justify-center shadow-sm mt-4"
        >
          {loading ? (
            <ActivityIndicator color="#292B28" />
          ) : (
            <Text className="text-[#292B28] font-bold text-base">Sign In</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Footer Link */}
      <View className="flex-row justify-center mt-8">
        <Text className="text-[#77766F]">Don't have an account? </Text>
        <TouchableOpacity onPress={() => router.replace('/(auth)/signup')}>
          <Text className="text-[#D98262] font-bold">Create One</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
