import React from "react";
import { View, Text, TouchableOpacity, ScrollView, Switch } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Feather, Ionicons } from "@expo/vector-icons";
import { useAppStore, SmartDevice } from "../../store/useAppStore";

export default function DevicesScreen() {
  const { themeMode, devices, toggleDevicePower } = useAppStore();
  const isDark = themeMode === "dark";

  const getDeviceIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case "smart light": return "bulb-outline";
      case "smart fan": return "snow-outline";
      case "television": return "tv-outline";
      case "bluetooth speaker": return "musical-notes-outline";
      default: return "hardware-chip-outline";
    }
  };

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
          Smart Devices
        </Text>
        <TouchableOpacity 
          className={`w-10 h-10 items-center justify-center rounded-full ${isDark ? "bg-blue-900/30" : "bg-blue-50"} shadow-sm`}
        >
          <Feather name="plus" size={20} color={isDark ? "#60a5fa" : "#3b82f6"} />
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1 px-6" contentContainerStyle={{ paddingBottom: 40 }}>
        <Text className={`text-sm font-medium uppercase tracking-wider mb-4 mt-2 ${isDark ? "text-slate-500" : "text-slate-400"}`}>
          Connected Home
        </Text>

        <View className="space-y-4">
          {devices.map((device: SmartDevice) => (
            <View 
              key={device.id} 
              className={`p-5 rounded-3xl border ${isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"} shadow-sm`}
            >
              <View className="flex-row justify-between items-start mb-4">
                <View className="flex-row items-center flex-1">
                  <View className={`w-12 h-12 rounded-full items-center justify-center mr-4 ${device.active ? (isDark ? "bg-blue-500/20" : "bg-blue-100") : (isDark ? "bg-slate-800" : "bg-slate-100")}`}>
                    <Ionicons 
                      name={getDeviceIcon(device.type) as any} 
                      size={24} 
                      color={device.active ? (isDark ? "#60a5fa" : "#3b82f6") : (isDark ? "#64748b" : "#94a3b8")} 
                    />
                  </View>
                  <View className="flex-1 pr-2">
                    <Text className={`text-lg font-bold mb-1 ${isDark ? "text-white" : "text-slate-900"}`} numberOfLines={1}>
                      {device.name}
                    </Text>
                    <View className="flex-row items-center">
                      <View className={`w-2 h-2 rounded-full mr-2 ${device.status === 'Offline' ? 'bg-red-500' : device.active ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                      <Text className={`text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                        {device.type} • {device.status}
                      </Text>
                    </View>
                  </View>
                </View>

                <Switch
                  value={device.active}
                  onValueChange={() => toggleDevicePower(device.id)}
                  trackColor={{ false: isDark ? "#334155" : "#e2e8f0", true: "#3b82f6" }}
                  thumbColor="#ffffff"
                  disabled={device.status === 'Offline'}
                />
              </View>

              {/* Intensity Slider Mock UI */}
              {device.type.includes("light") || device.type.includes("fan") || device.type.includes("speaker") ? (
                <View className="w-full mt-2">
                  <View className="flex-row justify-between mb-2">
                    <Text className={`text-xs font-semibold ${isDark ? "text-slate-500" : "text-slate-400"}`}>Intensity</Text>
                    <Text className={`text-xs font-bold ${isDark ? "text-slate-300" : "text-slate-600"}`}>{device.intensity}%</Text>
                  </View>
                  <View className={`h-2 w-full rounded-full overflow-hidden ${isDark ? "bg-slate-800" : "bg-slate-100"}`}>
                    <View 
                      className={`h-full ${device.active ? "bg-blue-500" : (isDark ? "bg-slate-600" : "bg-slate-300")}`} 
                      style={{ width: `${device.intensity}%` }} 
                    />
                  </View>
                </View>
              ) : null}
            </View>
          ))}
        </View>

      </ScrollView>

      {/* Action Button */}
      <View className={`px-6 pb-8 pt-4 border-t ${isDark ? "bg-slate-950 border-slate-900" : "bg-white border-slate-100"}`}>
        <TouchableOpacity
          onPress={() => router.push("/devices/map")}
          className="w-full py-4 rounded-full flex-row items-center justify-center bg-blue-600"
        >
          <Text className="text-white font-bold text-lg mr-2">Map a Gesture</Text>
          <Feather name="git-merge" size={20} color="white" />
        </TouchableOpacity>
      </View>

    </SafeAreaView>
  );
}
