import React from "react";
import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Feather, Ionicons } from "@expo/vector-icons";
import { useAppStore } from "../../store/useAppStore";

export default function HomeDashboardScreen() {
  const { themeMode, glove_connected, gestures, devices, mappings, glove_battery, fabrication_status } = useAppStore();
  const isDark = themeMode === "dark";

  // Security Lock Rule: Must be paired to view
  if (!glove_connected) {
    if (fabrication_status !== "Delivered") {
      return (
        <SafeAreaView className={`flex-1 items-center justify-center px-6 ${isDark ? "bg-slate-950" : "bg-slate-50"}`}>
          <Feather name="truck" size={48} color={isDark ? "#475569" : "#94a3b8"} className="mb-4" />
          <Text className={`text-xl font-bold text-center mb-2 ${isDark ? "text-white" : "text-slate-900"}`}>Dashboard Locked</Text>
          <Text className={`text-center mb-8 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
            Your Smart Grip is currently in production or transit. You can access the dashboard once it arrives.
          </Text>
          <TouchableOpacity 
            onPress={() => router.push("/scans/delivery")}
            className="px-6 py-3 rounded-full bg-blue-600"
          >
            <Text className="text-white font-bold">Check Order Status</Text>
          </TouchableOpacity>
        </SafeAreaView>
      );
    } else {
      return (
        <SafeAreaView className={`flex-1 items-center justify-center px-6 ${isDark ? "bg-slate-950" : "bg-slate-50"}`}>
          <Feather name="lock" size={48} color={isDark ? "#475569" : "#94a3b8"} className="mb-4" />
          <Text className={`text-xl font-bold text-center mb-2 ${isDark ? "text-white" : "text-slate-900"}`}>Glove Delivered</Text>
          <Text className={`text-center mb-8 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
            Your Smart Grip has arrived! Please pair and calibrate it to unlock your home dashboard.
          </Text>
          <TouchableOpacity 
            onPress={() => router.push("/device/connect")}
            className="px-6 py-3 rounded-full bg-emerald-500"
          >
            <Text className="text-white font-bold">Pair Glove Now</Text>
          </TouchableOpacity>
        </SafeAreaView>
      );
    }
  }

  const activeDevices = devices.filter(d => d.active).length;

  return (
    <SafeAreaView className={`flex-1 ${isDark ? "bg-slate-950" : "bg-slate-50"}`}>
      <View className="px-6 pt-6 pb-4 flex-row items-center justify-between">
        <View>
          <Text className={`text-sm font-medium ${isDark ? "text-slate-400" : "text-slate-500"}`}>
            Welcome back,
          </Text>
          <Text className={`text-2xl font-bold ${isDark ? "text-white" : "text-slate-900"}`}>
            Arthur
          </Text>
        </View>
        <TouchableOpacity 
          onPress={() => router.push("/profile")}
          className={`w-12 h-12 rounded-full overflow-hidden items-center justify-center border-2 ${isDark ? "border-slate-800 bg-slate-900" : "border-slate-200 bg-white"}`}
        >
          <Feather name="user" size={24} color={isDark ? "#94a3b8" : "#64748b"} />
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1 px-6" contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        
        {/* Glove Status Card */}
        <TouchableOpacity 
          onPress={() => router.push("/device/connect")}
          className={`w-full p-5 rounded-3xl mb-6 flex-row items-center border ${isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"} shadow-sm`}
        >
          <View className={`w-12 h-12 rounded-full items-center justify-center mr-4 ${isDark ? "bg-emerald-500/20" : "bg-emerald-100"}`}>
            <Feather name="bluetooth" size={24} color={isDark ? "#34d399" : "#10b981"} />
          </View>
          <View className="flex-1">
            <Text className={`text-base font-bold ${isDark ? "text-white" : "text-slate-900"}`}>Smart Grip Connected</Text>
            <Text className={`text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}>Right Hand • Firmware v2.1.4</Text>
          </View>
          <View className="items-end">
            <View className="flex-row items-center">
              <Text className={`text-sm font-bold mr-1 ${glove_battery > 20 ? (isDark ? "text-emerald-400" : "text-emerald-500") : "text-red-500"}`}>{glove_battery}%</Text>
              <Feather name={glove_battery > 20 ? "battery-charging" : "battery"} size={16} color={glove_battery > 20 ? (isDark ? "#34d399" : "#10b981") : "#ef4444"} />
            </View>
          </View>
        </TouchableOpacity>

        {/* Quick Action Macro Grid */}
        <View className="flex-row justify-between mb-6">
          {/* Gestures Card */}
          <TouchableOpacity 
            onPress={() => router.push("/gestures/saved")}
            className={`w-[48%] p-5 rounded-3xl border ${isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"} shadow-sm`}
          >
            <Ionicons name="hand-right" size={28} color={isDark ? "#60a5fa" : "#3b82f6"} className="mb-3" />
            <Text className={`text-2xl font-bold mb-1 ${isDark ? "text-white" : "text-slate-900"}`}>{gestures.length}</Text>
            <Text className={`text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}>Trained Gestures</Text>
          </TouchableOpacity>
          
          {/* Devices Card */}
          <TouchableOpacity 
            onPress={() => router.push("/devices")}
            className={`w-[48%] p-5 rounded-3xl border ${isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"} shadow-sm`}
          >
            <Feather name="cpu" size={28} color={isDark ? "#a855f7" : "#8b5cf6"} className="mb-3" />
            <Text className={`text-2xl font-bold mb-1 ${isDark ? "text-white" : "text-slate-900"}`}>{activeDevices}/{devices.length}</Text>
            <Text className={`text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}>Active Devices</Text>
          </TouchableOpacity>
        </View>

        {/* Emergency SOS Panel */}
        <TouchableOpacity 
          onPress={() => router.push("/emergency/sos")}
          className="w-full p-6 rounded-3xl mb-8 bg-red-500 shadow-md shadow-red-500/30 flex-row items-center justify-between"
        >
          <View className="flex-1">
            <Text className="text-white text-xl font-bold mb-1">Emergency SOS</Text>
            <Text className="text-red-100 text-sm">Long-press to trigger medical alert</Text>
          </View>
          <View className="w-12 h-12 rounded-full bg-white/20 items-center justify-center">
            <Feather name="alert-triangle" size={24} color="white" />
          </View>
        </TouchableOpacity>

        {/* Mappings / Macros */}
        <View className="flex-row items-center justify-between mb-4">
          <Text className={`text-lg font-bold ${isDark ? "text-slate-100" : "text-slate-900"}`}>Active Macros</Text>
          <TouchableOpacity onPress={() => router.push("/devices/map")}>
            <Text className={`text-sm font-semibold ${isDark ? "text-blue-400" : "text-blue-600"}`}>Add New</Text>
          </TouchableOpacity>
        </View>

        <View className="space-y-3">
          {mappings.map((mapping, idx) => {
            const gesture = gestures.find(g => g.id === mapping.gestureId);
            const device = devices.find(d => d.id === mapping.deviceId);
            if (!gesture || !device) return null;

            return (
              <View key={idx} className={`w-full p-4 rounded-2xl flex-row items-center border ${isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"} shadow-sm`}>
                <View className={`w-10 h-10 rounded-full items-center justify-center mr-3 ${isDark ? "bg-slate-800" : "bg-slate-100"}`}>
                  <Ionicons name="hand-right-outline" size={18} color={isDark ? "#94a3b8" : "#64748b"} />
                </View>
                <View className="flex-1">
                  <Text className={`text-sm font-semibold ${isDark ? "text-white" : "text-slate-900"}`}>{gesture.name}</Text>
                </View>
                <Feather name="arrow-right" size={16} color={isDark ? "#475569" : "#cbd5e1"} className="mx-2" />
                <View className="flex-1 items-end">
                  <Text className={`text-sm font-semibold ${isDark ? "text-white" : "text-slate-900"}`}>{device.name}</Text>
                  <Text className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}>{mapping.actionName}</Text>
                </View>
              </View>
            );
          })}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}
