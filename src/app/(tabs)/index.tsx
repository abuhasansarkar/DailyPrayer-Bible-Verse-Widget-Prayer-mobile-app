import { useCallback, useEffect, useState } from "react";
import { Pressable, RefreshControl, ScrollView, Share, Text, TextInput, View } from "react-native";
import Animated, {
  FadeInDown,
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useTranslation } from "react-i18next";

import { Mascot } from "@/components/mascot/Mascot";
import { MilestoneCelebration } from "@/components/streak/MilestoneCelebration";
import { StreakCard } from "@/components/streak/StreakCard";
import { Toast, useToast } from "@/components/ui/Toast";
import VerseImageGenerator from "@/components/verse/VerseImageGenerator";
import { getDb } from "@/db/client";
import { useDailyVerse } from "@/hooks/use-daily-verse";
import { useFavoriteToggle } from "@/hooks/use-favorite-toggle";
import { useResolvedTheme } from "@/hooks/use-theme";

import { useUserStore } from "@/store/user.store";
import type { StreakMilestone } from "@/types/user";

function getGreeting(name?: string): string {
  const hour = new Date().getHours();
  const first = name ? `, ${name}` : "";
  if (hour < 12) return `Good morning${first} 🌅`;
  if (hour < 17) return `Good afternoon${first} ☀️`;
  return `Good evening${first} 🌙`;
}

export default function TodayScreen() {
  const { t } = useTranslation();
  const { isDark } = useResolvedTheme();
  const {
    streak,
    milestones,
    recordActivity,
    displayName,
    isFavorite,
  } = useUserStore();
  const toggleFavoriteGated = useFavoriteToggle();
  const { toastProps, show } = useToast();

  // Daily verse loading lives in useDailyVerse — this screen used to carry a
  // second copy of the same query, which drifted (no CDN fallback) and set
  // state synchronously inside an effect.
  const { verse: dailyVerse, loading, refresh: refreshVerse } = useDailyVerse();

  const [gratitudeText, setGratitudeText] = useState("");
  const [gratitudeSaved, setGratitudeSaved] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showCardStudio, setShowCardStudio] = useState(false);

  // Derive the milestone banner during render instead of writing it from an
  // effect; `dismissedMilestone` remembers the one the user has closed.
  const [dismissedMilestone, setDismissedMilestone] = useState<number | null>(null);
  const earnedMilestone: StreakMilestone | null =
    milestones.find((m) => m.achieved && m.days === streak.currentStreak) ?? null;
  const milestone =
    earnedMilestone && earnedMilestone.days !== dismissedMilestone ? earnedMilestone : null;

  // UI-thread Reanimated pulse animation for 60fps skeleton rendering
  const pulseOpacity = useSharedValue(1);
  useEffect(() => {
    pulseOpacity.value = withRepeat(
      withTiming(0.45, { duration: 850 }),
      -1,
      true,
    );
  }, [pulseOpacity]);

  const pulseStyle = useAnimatedStyle(() => ({
    opacity: pulseOpacity.value,
  }));

  const saveGratitude = useCallback(async () => {
    if (!gratitudeText.trim()) return;
    try {
      const db = getDb();
      await db.runAsync(
        'INSERT INTO gratitude_entries (id, items, created_at) VALUES (?, ?, datetime("now"))',
        [`grat-${Date.now()}`, JSON.stringify([gratitudeText.trim()])],
      );
      await recordActivity("gratitude");
      setGratitudeSaved(true);
      show("Gratitude saved! ✨", "success");
      setTimeout(() => {
        setGratitudeSaved(false);
        setGratitudeText("");
      }, 2000);
    } catch (e) {
      console.warn(e);
    }
  }, [gratitudeText, recordActivity, show]);

  const handleSaveVerse = useCallback(async () => {
    if (!dailyVerse) return;
    const added = await toggleFavoriteGated("verse", dailyVerse.id);
    if (added === null) return; // blocked by the free-tier limit
    show(
      added ? "Verse saved! 🔖" : "Removed from favorites",
      added ? "success" : "info",
    );
  }, [dailyVerse, show, toggleFavoriteGated]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshVerse();
    setRefreshing(false);
  }, [refreshVerse]);

  const bg = isDark ? "#1E1C18" : "#FFF9EE";
  const surfaceBg = isDark ? "#2A2720" : "#F1E6D3";
  const cardBg = isDark ? "#332F26" : "#FFFFFF";
  const textPrimary = isDark ? "#F5EDD8" : "#292B28";
  const textSecondary = isDark ? "#B8AD97" : "#77766F";
  const skeletonBase = isDark ? "#332F26" : "#EDE3D4";

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: bg }}>
        <ScrollView
          contentContainerStyle={{ paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Header skeleton */}
          <View
            style={{
              paddingHorizontal: 20,
              paddingTop: 16,
              paddingBottom: 8,
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "flex-start",
            }}
          >
            <View>
              <Animated.View
                style={[
                  {
                    width: 200,
                    height: 22,
                    borderRadius: 8,
                    backgroundColor: skeletonBase,
                    marginBottom: 6,
                  },
                  pulseStyle,
                ]}
              />
              <Animated.View
                style={[
                  {
                    width: 130,
                    height: 14,
                    borderRadius: 6,
                    backgroundColor: skeletonBase,
                  },
                  pulseStyle,
                ]}
              />
            </View>
            <Animated.View
              style={[
                {
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: skeletonBase,
                },
                pulseStyle,
              ]}
            />
          </View>

          {/* Verse hero card skeleton */}
          <View style={{ paddingHorizontal: 20, marginTop: 16 }}>
            <Animated.View
              style={[
                {
                  backgroundColor: isDark ? "#3A3028" : "#F2D99A",
                  borderRadius: 24,
                  padding: 24,
                  minHeight: 160,
                },
                pulseStyle,
              ]}
            >
              <View
                style={{
                  width: 80,
                  height: 10,
                  borderRadius: 5,
                  backgroundColor: isDark ? "#4A4030" : "#E8C97A",
                  marginBottom: 14,
                }}
              />
              <View
                style={{
                  width: "100%",
                  height: 14,
                  borderRadius: 6,
                  backgroundColor: isDark ? "#4A4030" : "#E8C97A",
                  marginBottom: 8,
                }}
              />
              <View
                style={{
                  width: "90%",
                  height: 14,
                  borderRadius: 6,
                  backgroundColor: isDark ? "#4A4030" : "#E8C97A",
                  marginBottom: 8,
                }}
              />
              <View
                style={{
                  width: "70%",
                  height: 14,
                  borderRadius: 6,
                  backgroundColor: isDark ? "#4A4030" : "#E8C97A",
                  marginBottom: 20,
                }}
              />
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <View
                  style={{
                    width: 100,
                    height: 14,
                    borderRadius: 6,
                    backgroundColor: isDark ? "#4A4030" : "#E8C97A",
                  }}
                />
                <View style={{ flexDirection: "row", gap: 8 }}>
                  <View
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 18,
                      backgroundColor: isDark ? "#4A4030" : "#E8C97A",
                    }}
                  />
                  <View
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 18,
                      backgroundColor: isDark ? "#4A4030" : "#E8C97A",
                    }}
                  />
                </View>
              </View>
            </Animated.View>
          </View>

          {/* Streak card skeleton */}
          <View style={{ paddingHorizontal: 20, marginTop: 16 }}>
            <Animated.View
              style={[
                {
                  backgroundColor: cardBg,
                  borderRadius: 20,
                  padding: 20,
                  minHeight: 90,
                },
                pulseStyle,
              ]}
            >
              <View
                style={{ flexDirection: "row", gap: 16, alignItems: "center" }}
              >
                <View
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: 16,
                    backgroundColor: skeletonBase,
                  }}
                />
                <View style={{ flex: 1 }}>
                  <View
                    style={{
                      width: 100,
                      height: 14,
                      borderRadius: 6,
                      backgroundColor: skeletonBase,
                      marginBottom: 8,
                    }}
                  />
                  <View
                    style={{
                      width: 160,
                      height: 10,
                      borderRadius: 5,
                      backgroundColor: skeletonBase,
                    }}
                  />
                </View>
              </View>
            </Animated.View>
          </View>

          {/* Prayer CTA skeleton */}
          <View style={{ paddingHorizontal: 20, marginTop: 16 }}>
            <Animated.View
              style={[
                {
                  backgroundColor: isDark ? "#3A3028" : "#FAE3D9",
                  borderRadius: 20,
                  padding: 20,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 16,
                },
                pulseStyle,
              ]}
            >
              <View
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: 16,
                  backgroundColor: isDark ? "#4A3830" : "#F0C8B8",
                }}
              />
              <View style={{ flex: 1 }}>
                <View
                  style={{
                    width: 140,
                    height: 14,
                    borderRadius: 6,
                    backgroundColor: isDark ? "#4A3830" : "#F0C8B8",
                    marginBottom: 8,
                  }}
                />
                <View
                  style={{
                    width: 190,
                    height: 10,
                    borderRadius: 5,
                    backgroundColor: isDark ? "#4A3830" : "#F0C8B8",
                  }}
                />
              </View>
            </Animated.View>
          </View>

          {/* Gratitude skeleton */}
          <View style={{ paddingHorizontal: 20, marginTop: 16 }}>
            <Animated.View
              style={[
                {
                  backgroundColor: isDark ? "#2A3022" : "#E2EAE0",
                  borderRadius: 20,
                  padding: 20,
                  minHeight: 100,
                },
                pulseStyle,
              ]}
            >
              <View
                style={{
                  width: 120,
                  height: 14,
                  borderRadius: 6,
                  backgroundColor: isDark ? "#3A4030" : "#C8D8C0",
                  marginBottom: 14,
                }}
              />
              <View
                style={{
                  width: "100%",
                  height: 10,
                  borderRadius: 5,
                  backgroundColor: isDark ? "#3A4030" : "#C8D8C0",
                  marginBottom: 8,
                }}
              />
              <View
                style={{
                  width: "60%",
                  height: 10,
                  borderRadius: 5,
                  backgroundColor: isDark ? "#3A4030" : "#C8D8C0",
                }}
              />
            </Animated.View>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: bg }}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#F2B84B"
          />
        }
      >
        {/* ── Header ── */}
        <Animated.View
          entering={FadeInDown.duration(400)}
          style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 }}
        >
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "flex-start",
            }}
          >
            <View>
              <Text
                style={{
                  fontFamily: "Inter_700Bold",
                  fontSize: 22,
                  color: textPrimary,
                  letterSpacing: -0.3,
                }}
              >
                {getGreeting(displayName || undefined)}
              </Text>
              <Text
                style={{
                  fontFamily: "Inter_400Regular",
                  fontSize: 14,
                  color: textSecondary,
                  marginTop: 2,
                }}
              >
                {new Date().toLocaleDateString("en-US", {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                })}
              </Text>
            </View>
            <Pressable
              onPress={() => router.push("/settings")}
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: surfaceBg,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text style={{ fontSize: 18 }}>⚙️</Text>
            </Pressable>
          </View>
        </Animated.View>

        {/* ── Daily Verse Hero Card ── */}
        {dailyVerse && (
          <Animated.View
            entering={FadeInDown.duration(500).delay(100)}
            style={{ paddingHorizontal: 20, marginTop: 16 }}
          >
            <Pressable
              onPress={() => router.push(`/verse/${dailyVerse.id}`)}
              style={{
                backgroundColor: "#F2B84B",
                borderRadius: 24,
                padding: 24,
                shadowColor: "#F2B84B",
                shadowOffset: { width: 0, height: 6 },
                shadowOpacity: 0.25,
                shadowRadius: 20,
                elevation: 8,
              }}
            >
              <Text
                style={{
                  fontFamily: "Inter_500Medium",
                  fontSize: 11,
                  color: "#292B28",
                  opacity: 0.7,
                  letterSpacing: 1,
                  textTransform: "uppercase",
                  marginBottom: 12,
                }}
              >
                {t("today.verseOfDay")}
              </Text>
              <Text
                style={{
                  fontFamily: "Lora_400Regular_Italic",
                  fontSize: 20,
                  lineHeight: 30,
                  color: "#292B28",
                  marginBottom: 16,
                }}
              >
                &quot;
                {dailyVerse.verse_text.length > 200
                  ? dailyVerse.verse_text.slice(0, 200) + "…"
                  : dailyVerse.verse_text}
                &quot;
              </Text>
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Text
                  style={{
                    fontFamily: "Inter_600SemiBold",
                    fontSize: 14,
                    color: "#292B28",
                  }}
                >
                  {dailyVerse.verse_reference}
                </Text>
                <View style={{ flexDirection: "row", gap: 8 }}>
                  <Pressable
                    onPress={(e) => {
                      e.stopPropagation();
                      setShowCardStudio(true);
                    }}
                    style={{
                      height: 36,
                      paddingHorizontal: 12,
                      borderRadius: 18,
                      backgroundColor: "rgba(41,43,40,0.18)",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Text style={{ fontFamily: "Inter_700Bold", fontSize: 12, color: "#292B28" }}>
                      🖼️ Studio
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={(e) => {
                      e.stopPropagation();
                      handleSaveVerse();
                    }}
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 18,
                      backgroundColor: isFavorite("verse", dailyVerse.id)
                        ? "rgba(41,43,40,0.25)"
                        : "rgba(41,43,40,0.12)",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Text style={{ fontSize: 16 }}>
                      {isFavorite("verse", dailyVerse.id) ? "🔖" : "🏷️"}
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={async (e) => {
                      e.stopPropagation();
                      if (dailyVerse) {
                        try {
                          await Share.share({
                            message: `"${dailyVerse.verse_text}" — ${dailyVerse.verse_reference}`,
                          });
                        } catch {
                          // Ignore share dismiss
                        }
                      }
                    }}
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 18,
                      backgroundColor: "rgba(41,43,40,0.12)",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Text style={{ fontSize: 16 }}>↗️</Text>
                  </Pressable>
                </View>
              </View>
            </Pressable>
          </Animated.View>
        )}

        {/* ── Reflection ── */}
        {dailyVerse?.reflection ? (
          <Animated.View
            entering={FadeInDown.duration(500).delay(200)}
            style={{ paddingHorizontal: 20, marginTop: 16 }}
          >
            <View
              style={{
                backgroundColor: cardBg,
                borderRadius: 20,
                padding: 20,
                shadowColor: "#292B28",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.06,
                shadowRadius: 8,
                elevation: 2,
              }}
            >
              <Text
                style={{
                  fontFamily: "Inter_600SemiBold",
                  fontSize: 13,
                  color: textSecondary,
                  textTransform: "uppercase",
                  letterSpacing: 0.8,
                  marginBottom: 10,
                }}
              >
                {t("today.reflection")}
              </Text>
              <Text
                style={{
                  fontFamily: "Inter_400Regular",
                  fontSize: 15,
                  lineHeight: 24,
                  color: textPrimary,
                }}
                numberOfLines={4}
              >
                {dailyVerse.reflection}
              </Text>
              <Pressable
                onPress={() => router.push(`/verse/${dailyVerse.id}`)}
                style={{ marginTop: 12 }}
              >
                <Text
                  style={{
                    fontFamily: "Inter_600SemiBold",
                    fontSize: 14,
                    color: "#F2B84B",
                  }}
                >
                  Read more →
                </Text>
              </Pressable>
            </View>
          </Animated.View>
        ) : null}

        {/* ── Faith Streak Card ── */}
        <Animated.View
          entering={FadeInDown.duration(500).delay(300)}
          style={{ paddingHorizontal: 20, marginTop: 16 }}
        >
          <StreakCard streak={streak} milestones={milestones} compact />
        </Animated.View>

        {/* ── Daily Prayer CTA ── */}
        <Animated.View
          entering={FadeInDown.duration(500).delay(400)}
          style={{ paddingHorizontal: 20, marginTop: 16 }}
        >
          <Pressable
            onPress={() => router.push("/(tabs)/pray")}
            style={{
              backgroundColor: isDark ? "#3A3028" : "#FAE3D9",
              borderRadius: 20,
              padding: 20,
              flexDirection: "row",
              alignItems: "center",
              gap: 16,
            }}
          >
            <View
              style={{
                width: 52,
                height: 52,
                borderRadius: 16,
                backgroundColor: "#D98262",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text style={{ fontSize: 26 }}>🙏</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontFamily: "Inter_600SemiBold",
                  fontSize: 16,
                  color: textPrimary,
                  marginBottom: 2,
                }}
              >
                {t("today.prayer")}
              </Text>
              <Text
                style={{
                  fontFamily: "Inter_400Regular",
                  fontSize: 14,
                  color: textSecondary,
                }}
              >
                Tap to open today&apos;s guided prayer
              </Text>
            </View>
            <Text style={{ fontSize: 18, color: textSecondary }}>→</Text>
          </Pressable>
        </Animated.View>

        {/* ── Gratitude prompt ── */}
        <Animated.View
          entering={FadeInDown.duration(500).delay(500)}
          style={{ paddingHorizontal: 20, marginTop: 16 }}
        >
          <View
            style={{
              backgroundColor: isDark ? "#2A3022" : "#E2EAE0",
              borderRadius: 20,
              padding: 20,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 8,
                marginBottom: 12,
                justifyContent: "space-between",
              }}
            >
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
              >
                <Text style={{ fontSize: 20 }}>✨</Text>
                <Text
                  style={{
                    fontFamily: "Inter_600SemiBold",
                    fontSize: 15,
                    color: isDark ? "#A8BFA1" : "#1E2E1A",
                  }}
                >
                  {t("today.gratitude")}
                </Text>
              </View>
              <Pressable onPress={() => router.push("/gratitude")}>
                <Text
                  style={{
                    fontFamily: "Inter_600SemiBold",
                    fontSize: 12,
                    color: isDark ? "#A8BFA1" : "#617558",
                  }}
                >
                  History →
                </Text>
              </Pressable>
            </View>
            <TextInput
              value={gratitudeText}
              onChangeText={setGratitudeText}
              placeholder={t("today.gratitudePlaceholder")}
              placeholderTextColor={isDark ? "#A8BFA1" : "#7A9170"}
              multiline
              style={{
                fontFamily: "Inter_400Regular",
                fontSize: 15,
                lineHeight: 22,
                color: isDark ? "#F5EDD8" : "#1E2E1A",
                minHeight: 60,
                textAlignVertical: "top",
              }}
            />
            {gratitudeText.trim().length > 0 && !gratitudeSaved && (
              <Pressable
                onPress={saveGratitude}
                style={{
                  marginTop: 12,
                  alignSelf: "flex-end",
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                  backgroundColor: "#617558",
                  borderRadius: 12,
                }}
              >
                <Text
                  style={{
                    fontFamily: "Inter_600SemiBold",
                    fontSize: 14,
                    color: "#FFFFFF",
                  }}
                >
                  Save
                </Text>
              </Pressable>
            )}
            {gratitudeSaved && (
              <Text
                style={{
                  fontFamily: "Inter_500Medium",
                  fontSize: 14,
                  color: "#617558",
                  marginTop: 8,
                }}
              >
                Saved! 🙏
              </Text>
            )}
          </View>
        </Animated.View>

        {/* ── Mascot encouragement ── */}
        <Animated.View
          entering={FadeInUp.duration(500).delay(600)}
          style={{ paddingHorizontal: 20, marginTop: 20, alignItems: "center" }}
        >
          <Mascot pose="greeting" size={90} />
          <Text
            style={{
              fontFamily: "Lora_400Regular_Italic",
              fontSize: 15,
              color: textSecondary,
              textAlign: "center",
              marginTop: 8,
            }}
          >
            &quot;{t("today.mascotMessage")}&quot;
          </Text>
        </Animated.View>
      </ScrollView>

      {/* Milestone modal */}
      <MilestoneCelebration
        milestone={milestone}
        onDismiss={() => setDismissedMilestone(earnedMilestone?.days ?? null)}
      />

      {/* Verse Card Exporter Studio Modal */}
      {dailyVerse && (
        <VerseImageGenerator
          visible={showCardStudio}
          onClose={() => setShowCardStudio(false)}
          verseText={dailyVerse.verse_text}
          reference={dailyVerse.verse_reference}
        />
      )}

      <Toast {...toastProps} />
    </SafeAreaView>
  );
}
