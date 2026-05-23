import { useEffect } from "react";
import { View, Text } from "react-native";
import { useRouter } from "expo-router";
import Animated, { Easing, useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from "react-native-reanimated";
import { MaterialIcons } from "@expo/vector-icons";

import { useAppTheme } from "../lib/theme";

export default function SplashRoute() {
  const router = useRouter();
  const colors = useAppTheme();
  const glow = useSharedValue(0);

  useEffect(() => {
    glow.value = withRepeat(
      withSequence(withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.quad) }), withTiming(0, { duration: 1200, easing: Easing.inOut(Easing.quad) })),
      -1,
      true
    );

    const timer = setTimeout(() => {
      router.replace("/login");
    }, 1900);

    return () => clearTimeout(timer);
  }, [glow, router]);

  const glowStyle = useAnimatedStyle(() => ({
    opacity: 0.4 + glow.value * 0.35,
    transform: [{ scale: 1 + glow.value * 0.08 }]
  }));

  return (
    <View style={{ backgroundColor: colors.background }} className="flex-1 items-center justify-center px-6">
      <View className="absolute inset-0 opacity-40">
        <View style={{ backgroundColor: colors.primarySoft }} className="absolute left-[-20%] top-[-10%] h-80 w-80 rounded-full blur-3xl" />
        <View style={{ backgroundColor: colors.primarySoft }} className="absolute bottom-[-10%] right-[-20%] h-80 w-80 rounded-full blur-3xl" />
      </View>
      <Animated.View style={glowStyle} className="items-center justify-center rounded-full">
        <View style={{ backgroundColor: colors.card, shadowColor: colors.primary }} className="h-28 w-28 items-center justify-center rounded-full shadow-2xl">
          <MaterialIcons name="back-hand" size={54} color={colors.primary} />
          <View style={{ backgroundColor: colors.primary }} className="absolute bottom-0 right-0 h-10 w-10 items-center justify-center rounded-full border-4 border-white">
            <MaterialIcons name="add" size={20} color="#FFFFFF" />
          </View>
        </View>
      </Animated.View>
      <Text style={{ color: colors.text }} className="mt-8 font-display text-[34px] font-semibold tracking-tight">
        Assistive Smart Glove
      </Text>
      <Text style={{ color: colors.secondaryText }} className="mt-2 text-center font-body text-[17px] leading-6">
        Medical-grade assistive technology for guided scanning, gesture control, and emergency support.
      </Text>
      <View style={{ backgroundColor: colors.elevated }} className="mt-10 h-2 w-56 overflow-hidden rounded-full">
        <View style={{ backgroundColor: colors.primary }} className="h-2 w-5/6 rounded-full" />
      </View>
      <Text style={{ color: colors.secondaryText }} className="mt-4 font-body text-[14px] uppercase tracking-[0.18em]">
        Initialising clinical environment
      </Text>
    </View>
  );
}
