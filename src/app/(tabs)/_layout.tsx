import { AppIcon, AppIconName } from "@/components/ui/AppIcon";
import { useAppStore } from "@/store/app.store";
import * as Haptics from "expo-haptics";
import { Tabs } from "expo-router";
import React from "react";
import { useTranslation } from "react-i18next";
import { Pressable, Text, useColorScheme, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { FloatingAiButton } from "@/components/ai/FloatingAiButton";

type TabBarProps = {
  state: { index: number; routes: { key: string; name: string }[] };
  descriptors: Record<string, unknown>;
  navigation: any;
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function TabItem({
  routeKey,
  focused,
  isDark,
  label,
  iconName,
  onPress,
}: {
  routeKey: string;
  focused: boolean;
  isDark: boolean;
  label: string;
  iconName: AppIconName;
  onPress: () => void;
}) {
  const scale = useSharedValue(focused ? 1.04 : 1);

  React.useEffect(() => {
    scale.value = withSpring(focused ? 1.05 : 1, {
      damping: 14,
      stiffness: 220,
    });
  }, [focused, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const activeBg = "#F2B84B";
  const inactiveIconColor = isDark ? "#A39785" : "#77766F";
  const activeIconColor = "#1E1C18";

  return (
    <AnimatedPressable
      key={routeKey}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={focused ? { selected: true } : {}}
      style={[
        {
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          paddingVertical: 5,
        },
        animatedStyle,
      ]}
    >
      <View
        style={{
          width: 42,
          height: 28,
          borderRadius: 14,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: focused ? activeBg : "transparent",
          marginBottom: 2,
          shadowColor: focused ? "#F2B84B" : "transparent",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: focused ? 0.3 : 0,
          shadowRadius: 5,
          elevation: focused ? 3 : 0,
        }}
      >
        <AppIcon
          name={iconName}
          size={19}
          color={focused ? activeIconColor : inactiveIconColor}
          strokeWidth={focused ? 2.4 : 1.9}
        />
      </View>
      <Text
        style={{
          fontFamily: focused ? "Inter_700Bold" : "Inter_500Medium",
          fontSize: 10.5,
          letterSpacing: 0.1,
          color: focused
            ? isDark
              ? "#F5EDD8"
              : "#1E1C18"
            : isDark
              ? "#8C8374"
              : "#828079",
        }}
        numberOfLines={1}
      >
        {label}
      </Text>
    </AnimatedPressable>
  );
}

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
    community: { label: "Wall", icon: "heart" },
    pray: { label: t("tabs.pray"), icon: "pray" },
    journal: { label: t("tabs.journal"), icon: "journal" },
    library: { label: t("tabs.library"), icon: "library" },
  };

  const visibleRoutes = state.routes.filter(
    (r) => r.name !== "widgets" && tabMeta[r.name],
  );

  return (
    <View
      pointerEvents="box-none"
      style={{
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        paddingHorizontal: 12,
        paddingBottom: Math.max(insets.bottom, 10),
        backgroundColor: "transparent",
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          backgroundColor: isDark
            ? "rgba(38, 35, 29, 0.96)"
            : "rgba(255, 255, 255, 0.96)",
          borderRadius: 26,
          paddingHorizontal: 6,
          paddingVertical: 5,
          borderWidth: 1,
          borderColor: isDark
            ? "rgba(245, 237, 216, 0.12)"
            : "rgba(41, 43, 40, 0.08)",
          shadowColor: "#000000",
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: isDark ? 0.35 : 0.12,
          shadowRadius: 14,
          elevation: 10,
        }}
      >
        {visibleRoutes.map((route) => {
          const focused =
            state.index === state.routes.findIndex((r) => r.key === route.key);
          const meta = tabMeta[route.name] ?? {
            label: route.name,
            icon: "grid" as AppIconName,
          };

          const onPress = () => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(
              () => {},
            );
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
            <TabItem
              key={route.key}
              routeKey={route.key}
              focused={focused}
              isDark={isDark}
              label={meta.label}
              iconName={meta.icon}
              onPress={onPress}
            />
          );
        })}
      </View>
    </View>
  );
}

export default function TabsLayout() {
  return (
    <View style={{ flex: 1 }}>
      <Tabs
        tabBar={(props) => <DailyPrayerTabBar {...props} />}
        screenOptions={{
          headerShown: false,
        }}
      >
        <Tabs.Screen name="index" />
        <Tabs.Screen name="explore" />
        <Tabs.Screen name="community" />
        <Tabs.Screen name="pray" />
        <Tabs.Screen name="journal" />
        <Tabs.Screen name="library" />
      </Tabs>
      <FloatingAiButton />
    </View>
  );
}
