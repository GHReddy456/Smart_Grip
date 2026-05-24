import React from "react";
import { View, Text, TouchableOpacity, ScrollView, Switch } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useAppStore } from "../../store/useAppStore";

export default function SettingsScreen() {
  const { 
    themeMode, setThemeMode, 
    highContrast, toggleHighContrast,
    reducedMotion, toggleReducedMotion,
    voiceInstructions, toggleVoiceInstructions,
    hapticsEnabled, toggleHaptics
  } = useAppStore();
  
  const isDark = themeMode === "dark";

  return (
    <SafeAreaView className={`flex-1 ${isDark ? "bg-slate-950" : "bg-slate-50"}`}>
      <View className="px-6 pt-6 pb-4 flex-row items-center justify-between">
        <TouchableOpacity 
          onPress={() => router.back()}
          className={`w-10 h-10 items-center justify-center rounded-full ${isDark ? "bg-slate-800" : "bg-white"} shadow-sm`}
        >
          <Feather name="arrow-left" size={20} color={isDark ? "#f8fafc" : "#0f172a"} />
        </TouchableOpacity>
        <Text className={`text-lg font-semibold ${isDark ? "text-slate-100" : "text-slate-900"}`}>
          Settings & Accessibility
        </Text>
        <View className="w-10" />
      </View>

      <ScrollView className="flex-1 px-6" contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        
        {/* Theme Group */}
        <Text className={`text-sm font-bold uppercase tracking-wider mb-4 mt-2 ${isDark ? "text-slate-500" : "text-slate-400"}`}>
          Appearance
        </Text>
        <View className={`w-full rounded-3xl overflow-hidden border mb-8 ${isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"} shadow-sm`}>
          <View className="p-5 flex-row items-center justify-between border-b border-slate-200/20">
            <View className="flex-row items-center">
              <Feather name="moon" size={20} color={isDark ? "#94a3b8" : "#64748b"} />
              <View className="ml-3">
                <Text className={`font-semibold ${isDark ? "text-slate-200" : "text-slate-700"}`}>Dark Mode</Text>
              </View>
            </View>
            <Switch
              value={isDark}
              onValueChange={(val) => setThemeMode(val ? "dark" : "light")}
              trackColor={{ false: isDark ? "#334155" : "#e2e8f0", true: "#3b82f6" }}
              thumbColor="#ffffff"
            />
          </View>

          <View className="p-5 flex-row items-center justify-between">
            <View className="flex-row items-center">
              <Feather name="eye" size={20} color={isDark ? "#94a3b8" : "#64748b"} />
              <View className="ml-3">
                <Text className={`font-semibold ${isDark ? "text-slate-200" : "text-slate-700"}`}>High Contrast</Text>
                <Text className={`text-xs mt-1 ${isDark ? "text-slate-400" : "text-slate-500"}`}>Increases legibility of UI elements</Text>
              </View>
            </View>
            <Switch
              value={highContrast}
              onValueChange={toggleHighContrast}
              trackColor={{ false: isDark ? "#334155" : "#e2e8f0", true: "#3b82f6" }}
              thumbColor="#ffffff"
            />
          </View>
        </View>

        {/* Accessibility Group */}
        <Text className={`text-sm font-bold uppercase tracking-wider mb-4 ${isDark ? "text-slate-500" : "text-slate-400"}`}>
          Accessibility & Feedback
        </Text>
        <View className={`w-full rounded-3xl overflow-hidden border mb-8 ${isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"} shadow-sm`}>
          <View className="p-5 flex-row items-center justify-between border-b border-slate-200/20">
            <View className="flex-row items-center flex-1">
              <Feather name="volume-2" size={20} color={isDark ? "#94a3b8" : "#64748b"} />
              <View className="ml-3 flex-1 pr-4">
                <Text className={`font-semibold ${isDark ? "text-slate-200" : "text-slate-700"}`}>Voice Instructions</Text>
                <Text className={`text-xs mt-1 leading-tight ${isDark ? "text-slate-400" : "text-slate-500"}`}>Read aloud instructions during scans and gesture training</Text>
              </View>
            </View>
            <Switch
              value={voiceInstructions}
              onValueChange={toggleVoiceInstructions}
              trackColor={{ false: isDark ? "#334155" : "#e2e8f0", true: "#3b82f6" }}
              thumbColor="#ffffff"
            />
          </View>

          <View className="p-5 flex-row items-center justify-between border-b border-slate-200/20">
            <View className="flex-row items-center flex-1">
              <Feather name="smartphone" size={20} color={isDark ? "#94a3b8" : "#64748b"} />
              <View className="ml-3 flex-1 pr-4">
                <Text className={`font-semibold ${isDark ? "text-slate-200" : "text-slate-700"}`}>Haptic Feedback</Text>
                <Text className={`text-xs mt-1 leading-tight ${isDark ? "text-slate-400" : "text-slate-500"}`}>Vibrate on successful connections and saved mappings</Text>
              </View>
            </View>
            <Switch
              value={hapticsEnabled}
              onValueChange={toggleHaptics}
              trackColor={{ false: isDark ? "#334155" : "#e2e8f0", true: "#3b82f6" }}
              thumbColor="#ffffff"
            />
          </View>

          <View className="p-5 flex-row items-center justify-between">
            <View className="flex-row items-center flex-1">
              <Feather name="wind" size={20} color={isDark ? "#94a3b8" : "#64748b"} />
              <View className="ml-3 flex-1 pr-4">
                <Text className={`font-semibold ${isDark ? "text-slate-200" : "text-slate-700"}`}>Reduced Motion</Text>
                <Text className={`text-xs mt-1 leading-tight ${isDark ? "text-slate-400" : "text-slate-500"}`}>Minimize UI animations and pulsing effects</Text>
              </View>
            </View>
            <Switch
              value={reducedMotion}
              onValueChange={toggleReducedMotion}
              trackColor={{ false: isDark ? "#334155" : "#e2e8f0", true: "#3b82f6" }}
              thumbColor="#ffffff"
            />
          </View>
        </View>

        {/* Data & Notifications Group */}
        <Text className={`text-sm font-bold uppercase tracking-wider mb-4 ${isDark ? "text-slate-500" : "text-slate-400"}`}>
          Data & Notifications
        </Text>
        <View className={`w-full rounded-3xl overflow-hidden border mb-8 ${isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"} shadow-sm`}>
          <View className="p-5 flex-row items-center justify-between border-b border-slate-200/20">
            <View className="flex-row items-center">
              <Feather name="bell" size={20} color={isDark ? "#94a3b8" : "#64748b"} />
              <View className="ml-3">
                <Text className={`font-semibold ${isDark ? "text-slate-200" : "text-slate-700"}`}>Push Notifications</Text>
              </View>
            </View>
            <Switch
              value={true}
              onValueChange={() => {}}
              trackColor={{ false: isDark ? "#334155" : "#e2e8f0", true: "#3b82f6" }}
              thumbColor="#ffffff"
            />
          </View>
          <TouchableOpacity className="p-5 flex-row items-center justify-between border-b border-slate-200/20">
            <View className="flex-row items-center">
              <Feather name="cloud" size={20} color={isDark ? "#94a3b8" : "#64748b"} />
              <Text className={`ml-3 font-semibold ${isDark ? "text-slate-200" : "text-slate-700"}`}>Data Upload Parameters</Text>
            </View>
            <Feather name="chevron-right" size={20} color={isDark ? "#475569" : "#cbd5e1"} />
          </TouchableOpacity>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}
