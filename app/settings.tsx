import React from "react";
import { Pressable, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";

import { AccessibilityToggle, GlassCard, SectionTitle, PageScroll } from "../components/ui";
import { useAppTheme } from "../lib/theme";
import { useAppStore } from "../store/useAppStore";

export default function SettingsScreen() {
  const router = useRouter();
  const themeMode = useAppStore((state) => state.themeMode);
  const highContrast = useAppStore((state) => state.highContrast);
  const setThemeMode = useAppStore((state) => state.setThemeMode);
  const voiceInstructions = useAppStore((state) => state.voiceInstructions);
  const hapticsEnabled = useAppStore((state) => state.hapticsEnabled);
  const reducedMotion = useAppStore((state) => state.reducedMotion);
  const colors = useAppTheme();

  return (
    <PageScroll>
      <View style={{ backgroundColor: colors.background }} className="min-h-full px-5 pb-8 pt-12">
        {/* Header */}
        <View className="mb-6 flex-row items-center justify-between">
          <Pressable onPress={() => router.back()} className="p-2 -ml-2 rounded-full active:bg-black/5">
            <MaterialIcons name="arrow-back" size={24} color={colors.primary} />
          </Pressable>
          <View className="w-10 h-10" />
        </View>

        <SectionTitle colors={colors} title="System Settings" subtitle="Accessibility, notification, and voice preferences." />

        <View className="gap-4 mt-6">
          <AccessibilityToggle colors={colors} label="High contrast" description="Increase separation between surfaces and text." value={highContrast} onValueChange={() => useAppStore.getState().toggleHighContrast()} />
          <AccessibilityToggle colors={colors} label="Voice instructions" description="Speak scan directions and state changes aloud." value={voiceInstructions} onValueChange={() => useAppStore.getState().toggleVoiceInstructions()} />
          <AccessibilityToggle colors={colors} label="Haptic feedback" description="Provide tactile confirmation for buttons and toggles." value={hapticsEnabled} onValueChange={() => useAppStore.getState().toggleHaptics()} />
          <AccessibilityToggle colors={colors} label="Reduced motion" description="Lower animation energy for calmer interaction." value={reducedMotion} onValueChange={() => useAppStore.getState().toggleReducedMotion()} />
        </View>

        <GlassCard colors={colors} className="mt-6 gap-4">
          <Text style={{ color: colors.text }} className="font-display text-[20px] font-semibold">
            Theme Environment
          </Text>
          <Text style={{ color: colors.secondaryText }} className="font-body text-[14px] leading-5">
            The clinical UI is tuned for a calm medical aesthetic with light and dark mode support.
          </Text>
          <View style={{ backgroundColor: colors.elevated }} className="flex-row gap-2 rounded-3xl p-2">
            {(["system", "light", "dark"] as const).map((mode) => {
              const active = themeMode === mode;
              return (
                <Pressable
                  key={mode}
                  onPress={() => setThemeMode(mode)}
                  style={{ backgroundColor: active ? colors.primary : "transparent" }}
                  className="flex-1 rounded-2xl px-3 py-3"
                >
                  <Text style={{ color: active ? "#FFFFFF" : colors.secondaryText }} className="text-center font-body text-[14px] font-semibold capitalize">
                    {mode}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </GlassCard>
      </View>
    </PageScroll>
  );
}
