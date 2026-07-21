import { getDb } from "@/db/client";
import { useAppStore } from "@/store/app.store";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Pressable,
  ScrollView,
  Text,
  useColorScheme,
  View,
} from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

interface FavoriteRow {
  id: string;
  type: string;
  ref_id: string;
  note: string | null;
  created_at: string;
  verse_text?: string;
  verse_reference?: string;
}

export default function LibraryScreen() {
  const { t } = useTranslation();
  const systemScheme = useColorScheme();
  const { colorScheme } = useAppStore();
  const isDark =
    (colorScheme === "system" ? systemScheme : colorScheme) === "dark";
  const [favorites, setFavorites] = useState<FavoriteRow[]>([]);
  const [activeTab, setActiveTab] = useState<
    "favorites" | "collections" | "history"
  >("favorites");

  const bg = isDark ? "#1E1C18" : "#FFF9EE";
  const cardBg = isDark ? "#332F26" : "#FFFFFF";
  const surfaceBg = isDark ? "#2A2720" : "#F1E6D3";
  const textPrimary = isDark ? "#F5EDD8" : "#292B28";
  const textSecondary = isDark ? "#B8AD97" : "#77766F";

  useEffect(() => {
    async function loadFavorites() {
      const db = getDb();
      const rows = await db.getAllAsync<FavoriteRow>(`
        SELECT f.*, v.text as verse_text, v.reference as verse_reference
        FROM favorites f
        LEFT JOIN verses v ON f.ref_id = v.id AND f.type = 'verse'
        ORDER BY f.created_at DESC
        LIMIT 50
      `);
      setFavorites(rows);
    }
    if (activeTab === "favorites") loadFavorites();
  }, [activeTab]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: bg }}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 110 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Animated.View
          entering={FadeInDown.duration(400)}
          style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 16 }}
        >
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Text
              style={{
                fontFamily: "Inter_700Bold",
                fontSize: 28,
                color: textPrimary,
                letterSpacing: -0.5,
              }}
            >
              {t("library.title")}
            </Text>
            <Pressable onPress={() => router.push("/settings/screen")}>
              <View
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
              </View>
            </Pressable>
          </View>
        </Animated.View>

        {/* Segment */}
        <Animated.View
          entering={FadeInDown.duration(400).delay(100)}
          style={{ paddingHorizontal: 20, marginBottom: 20 }}
        >
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 8 }}
          >
            {(["favorites", "collections", "history"] as const).map((tab) => (
              <Pressable
                key={tab}
                onPress={() => setActiveTab(tab)}
                style={{
                  paddingHorizontal: 16,
                  paddingVertical: 10,
                  borderRadius: 12,
                  backgroundColor: activeTab === tab ? "#F2B84B" : surfaceBg,
                }}
              >
                <Text
                  style={{
                    fontFamily:
                      activeTab === tab
                        ? "Inter_600SemiBold"
                        : "Inter_400Regular",
                    fontSize: 14,
                    color: activeTab === tab ? "#292B28" : textSecondary,
                  }}
                >
                  {tab === "favorites"
                    ? t("library.favorites")
                    : tab === "collections"
                      ? t("library.collections")
                      : t("library.history")}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </Animated.View>

        {/* Content */}
        <Animated.View
          entering={FadeInDown.duration(400).delay(200)}
          style={{ paddingHorizontal: 20, gap: 12 }}
        >
          {activeTab === "favorites" &&
            (favorites.length === 0 ? (
              <View
                style={{ alignItems: "center", paddingVertical: 60, gap: 12 }}
              >
                <Text style={{ fontSize: 56 }}>🔖</Text>
                <Text
                  style={{
                    fontFamily: "Inter_600SemiBold",
                    fontSize: 18,
                    color: textPrimary,
                  }}
                >
                  {t("library.emptyFavorites.title")}
                </Text>
                <Text
                  style={{
                    fontFamily: "Inter_400Regular",
                    fontSize: 15,
                    color: textSecondary,
                    textAlign: "center",
                    paddingHorizontal: 16,
                  }}
                >
                  {t("library.emptyFavorites.subtitle")}
                </Text>
              </View>
            ) : (
              favorites.map((fav) => (
                <Pressable
                  key={fav.id}
                  style={{
                    backgroundColor: cardBg,
                    borderRadius: 20,
                    padding: 18,
                    shadowColor: "#292B28",
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.06,
                    shadowRadius: 8,
                    elevation: 2,
                  }}
                >
                  {fav.verse_text && (
                    <>
                      <Text
                        style={{
                          fontFamily: "Lora_400Regular_Italic",
                          fontSize: 15,
                          lineHeight: 24,
                          color: textPrimary,
                          marginBottom: 10,
                        }}
                      >
                        "{fav.verse_text.slice(0, 150)}
                        {fav.verse_text.length > 150 ? "..." : ""}"
                      </Text>
                      <Text
                        style={{
                          fontFamily: "Inter_600SemiBold",
                          fontSize: 13,
                          color: textSecondary,
                        }}
                      >
                        {fav.verse_reference}
                      </Text>
                    </>
                  )}
                </Pressable>
              ))
            ))}

          {activeTab === "collections" && (
            <View
              style={{ alignItems: "center", paddingVertical: 60, gap: 12 }}
            >
              <Text style={{ fontSize: 56 }}>📚</Text>
              <Text
                style={{
                  fontFamily: "Inter_600SemiBold",
                  fontSize: 18,
                  color: textPrimary,
                }}
              >
                No collections yet
              </Text>
              <Text
                style={{
                  fontFamily: "Inter_400Regular",
                  fontSize: 15,
                  color: textSecondary,
                  textAlign: "center",
                  paddingHorizontal: 16,
                }}
              >
                Create a collection to group your favorite verses and prayers.
              </Text>
              <Pressable
                style={{
                  height: 48,
                  paddingHorizontal: 24,
                  borderRadius: 24,
                  backgroundColor: "#F2B84B",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text
                  style={{
                    fontFamily: "Inter_600SemiBold",
                    fontSize: 15,
                    color: "#292B28",
                  }}
                >
                  {t("library.createCollection")}
                </Text>
              </Pressable>
            </View>
          )}

          {activeTab === "history" && (
            <View
              style={{ alignItems: "center", paddingVertical: 60, gap: 12 }}
            >
              <Text style={{ fontSize: 56 }}>📖</Text>
              <Text
                style={{
                  fontFamily: "Inter_600SemiBold",
                  fontSize: 18,
                  color: textPrimary,
                }}
              >
                Reading history
              </Text>
              <Text
                style={{
                  fontFamily: "Inter_400Regular",
                  fontSize: 15,
                  color: textSecondary,
                  textAlign: "center",
                }}
              >
                Verses and prayers you've read will appear here.
              </Text>
            </View>
          )}
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}
