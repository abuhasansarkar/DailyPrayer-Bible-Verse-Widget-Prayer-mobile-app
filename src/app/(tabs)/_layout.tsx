import { AppIcon, AppIconName } from "@/components/ui/AppIcon";
import { useAppStore } from "@/store/app.store";
import { Tabs } from "expo-router";
import { useTranslation } from "react-i18next";
import { Pressable, Text, useColorScheme, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type TabBarProps = {
  state: { index: number; routes: { key: string; name: string }[] };
  descriptors: Record<string, unknown>;
  navigation: any;
};

function DailyPrayerTabBar({ state, navigation }: TabBarProps) {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const systemScheme = useColorScheme();
  const { colorScheme } = useAppStore();
  const isDark =
    (colorScheme === "system" ? systemScheme : colorScheme) === "dark";

  const tabMeta: Record<string, { label: string; icon: AppIconName }> = {
    index: { label: t("tabs.today"), icon: "home" },
    explore: { label: t("tabs.explore"), icon: "compass" },
    pray: { label: t("tabs.pray"), icon: "pray" },
    journal: { label: t("tabs.journal"), icon: "journal" },
    library: { label: t("tabs.library"), icon: "library" },
  };

  return (
    <View
      style={{
        flexDirection: "row",
        backgroundColor: isDark ? "#2A2720" : "#FFFFFF",
        paddingBottom: Math.max(insets.bottom, 8),
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: isDark
          ? "rgba(245,237,216,0.08)"
          : "rgba(41,43,40,0.08)",
        shadowColor: "#292B28",
        shadowOffset: { width: 0, height: -3 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 10,
      }}
    >
      {state.routes.map((route) => {
        const focused =
          state.index === state.routes.findIndex((r) => r.key === route.key);
        const meta = tabMeta[route.name] ?? {
          label: route.name,
          icon: "grid" as AppIconName,
        };
        const iconColor = focused ? "#292B28" : isDark ? "#7A7264" : "#77766F";

        const onPress = () => {
          const event = navigation.emit({
            type: "tabPress",
            target: route.key,
            canPreventDefault: true,
          });
          if (!focused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        return (
          <Pressable
            key={route.key}
            onPress={onPress}
            accessibilityRole="button"
            accessibilityState={focused ? { selected: true } : {}}
            style={{
              flex: 1,
              alignItems: "center",
              gap: 4,
              paddingVertical: 4,
              minHeight: 48,
            }}
          >
            <View
              style={{
                width: 36,
                height: 28,
                borderRadius: 14,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: focused ? "#F2B84B" : "transparent",
              }}
            >
              <AppIcon
                name={meta.icon}
                size={19}
                color={iconColor}
                strokeWidth={focused ? 2.4 : 2}
              />
            </View>
            <Text
              style={{
                fontFamily: focused ? "Inter_600SemiBold" : "Inter_400Regular",
                fontSize: 10,
                color: focused
                  ? isDark
                    ? "#F5EDD8"
                    : "#292B28"
                  : isDark
                    ? "#7A7264"
                    : "#77766F",
              }}
              numberOfLines={1}
            >
              {meta.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <DailyPrayerTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="explore" />
      <Tabs.Screen name="pray" />
      <Tabs.Screen name="journal" />
      <Tabs.Screen name="library" />
    </Tabs>
  );
}
