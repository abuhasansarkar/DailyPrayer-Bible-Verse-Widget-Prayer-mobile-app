import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Mail, Lock, User, Sparkles } from '@/components/ui/LucideIcons';
import { supabase } from '@/services/supabase';
import { useUserStore } from '@/store/user.store';
import { useResolvedTheme } from '@/hooks/use-theme';

export default function SignupScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { isDark } = useResolvedTheme();

  // These screens previously hardcoded the light palette, so in dark mode they
  // rendered as a white sheet with dark-on-dark text.
  const bg = isDark ? '#1E1C18' : '#FFF9EE';
  const fieldBg = isDark ? '#2A2720' : '#F5EDD8';
  const fieldBorder = isDark ? '#3D382E' : '#E8DFC9';
  const textPrimary = isDark ? '#F5EDD8' : '#292B28';
  const textSecondary = isDark ? '#B8AD97' : '#77766F';
  const placeholder = isDark ? '#7A7263' : '#B8AD97';
  const accentSurface = isDark ? '#332A18' : '#FEF3D1';

  const handleSignup = async () => {
    if (!email || !password || !name) {
      Alert.alert('Required', 'Please fill in all fields.');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { display_name: name },
        },
      });

      if (error) {
        Alert.alert('Sign Up Failed', error.message);
      } else if (data.user) {
        useUserStore.getState().setProfile(name);
        Alert.alert('Account Created!', 'Please check your email to confirm your sign-up.');
        router.back();
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ backgroundColor: bg }} className="flex-1 px-6 py-4">
      {/* Header */}
      <View className="flex-row items-center mb-8">
        <TouchableOpacity onPress={() => router.back()} style={{ backgroundColor: fieldBg }} className="p-2 rounded-full">
          <ArrowLeft size={20} color={textPrimary} />
        </TouchableOpacity>
        <Text style={{ color: textPrimary }} className="text-xl font-bold ml-4">Create Account</Text>
      </View>

      <View className="items-center mb-8">
        <View style={{ backgroundColor: accentSurface }} className="w-16 h-16 rounded-full items-center justify-center mb-3">
          <Sparkles size={32} color="#F2B84B" />
        </View>
        <Text style={{ color: textPrimary }} className="text-2xl font-bold">Join DailyPrayer</Text>
        <Text style={{ color: textSecondary }} className="text-sm mt-1 text-center">
          Create an account to keep your faith journey backed up safely in the cloud.
        </Text>
      </View>

      {/* Form */}
      <View className="gap-4">
        <View>
          <Text style={{ color: textSecondary }} className="text-xs font-semibold uppercase tracking-wider mb-2">Your Name</Text>
          <View style={{ backgroundColor: fieldBg, borderColor: fieldBorder }} className="flex-row items-center rounded-2xl px-4 py-3 border">
            <User size={18} color={textSecondary} className="mr-3" />
            <TextInput
              style={{ color: textPrimary }} className="flex-1 text-base"
              placeholder="Sarah Jenkins"
              placeholderTextColor={placeholder}
              value={name}
              onChangeText={setName}
            />
          </View>
        </View>

        <View>
          <Text style={{ color: textSecondary }} className="text-xs font-semibold uppercase tracking-wider mb-2">Email Address</Text>
          <View style={{ backgroundColor: fieldBg, borderColor: fieldBorder }} className="flex-row items-center rounded-2xl px-4 py-3 border">
            <Mail size={18} color={textSecondary} className="mr-3" />
            <TextInput
              style={{ color: textPrimary }} className="flex-1 text-base"
              placeholder="you@example.com"
              placeholderTextColor={placeholder}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>
        </View>

        <View>
          <Text style={{ color: textSecondary }} className="text-xs font-semibold uppercase tracking-wider mb-2">Password</Text>
          <View style={{ backgroundColor: fieldBg, borderColor: fieldBorder }} className="flex-row items-center rounded-2xl px-4 py-3 border">
            <Lock size={18} color={textSecondary} className="mr-3" />
            <TextInput
              style={{ color: textPrimary }} className="flex-1 text-base"
              placeholder="At least 6 characters"
              placeholderTextColor={placeholder}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>
        </View>

        <TouchableOpacity
          onPress={handleSignup}
          disabled={loading}
          className="bg-[#F2B84B] rounded-2xl py-4 items-center justify-center shadow-sm mt-4"
        >
          {loading ? (
            <ActivityIndicator color="#292B28" />
          ) : (
            <Text className="text-[#292B28] font-bold text-base">Create Account</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Footer Link */}
      <View className="flex-row justify-center mt-8">
        <Text style={{ color: textSecondary }} className="">Already have an account? </Text>
        <TouchableOpacity onPress={() => router.replace('/(auth)/login')}>
          <Text className="text-[#D98262] font-bold">Sign In</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
