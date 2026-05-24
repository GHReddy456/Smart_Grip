import React, { useState } from "react";
import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Feather, Ionicons } from "@expo/vector-icons";
import { useAppStore, Gesture, SmartDevice } from "../../store/useAppStore";

export default function MapGestureScreen() {
  const { themeMode, gestures, devices, addMapping } = useAppStore();
  const isDark = themeMode === "dark";

  const [selectedGesture, setSelectedGesture] = useState<string | null>(null);
  const [selectedDevice, setSelectedDevice] = useState<string | null>(null);
  const [selectedAction, setSelectedAction] = useState<string | null>(null);

  const getDeviceIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case "smart light": return "bulb-outline";
      case "smart fan": return "snow-outline";
      case "television": return "tv-outline";
      case "bluetooth speaker": return "musical-notes-outline";
      default: return "hardware-chip-outline";
    }
  };

  const actions = ["Toggle Power", "Increase Intensity", "Decrease Intensity", "Trigger SOS"];

  const handleSaveMapping = () => {
    if (selectedGesture && selectedDevice && selectedAction) {
      addMapping({
        gestureId: selectedGesture,
        deviceId: selectedDevice,
        actionName: selectedAction
      });
      router.replace("/home");
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
          Map Gesture Action
        </Text>
        <View className="w-10" />
      </View>

      <ScrollView className="flex-1 px-6" contentContainerStyle={{ paddingBottom: 40 }}>
        
        {/* Step 1: Select Gesture */}
        <Text className={`text-sm font-bold uppercase tracking-wider mb-4 mt-2 ${isDark ? "text-slate-500" : "text-slate-400"}`}>
          1. Select Gesture
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-8 overflow-visible">
          {gestures.map((gesture: Gesture) => (
            <TouchableOpacity
              key={gesture.id}
              onPress={() => setSelectedGesture(gesture.id)}
              className={`mr-4 p-4 rounded-2xl border-2 w-36 items-center ${
                selectedGesture === gesture.id 
                  ? "border-blue-500 bg-blue-500/10" 
                  : isDark ? "border-slate-800 bg-slate-900" : "border-slate-200 bg-white"
              }`}
            >
              <Ionicons 
                name="hand-right-outline" 
                size={32} 
                color={selectedGesture === gesture.id ? "#3b82f6" : (isDark ? "#94a3b8" : "#64748b")} 
                className="mb-2" 
              />
              <Text className={`font-semibold text-center ${
                selectedGesture === gesture.id 
                  ? (isDark ? "text-blue-400" : "text-blue-600") 
                  : (isDark ? "text-slate-300" : "text-slate-700")
              }`}>{gesture.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Path Connector */}
        <View className="items-center -mt-6 mb-2">
          <View className={`w-1 h-6 rounded-full ${isDark ? "bg-slate-800" : "bg-slate-200"}`} />
        </View>

        {/* Step 2: Select Device */}
        <Text className={`text-sm font-bold uppercase tracking-wider mb-4 ${isDark ? "text-slate-500" : "text-slate-400"}`}>
          2. Target Device
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-8 overflow-visible">
          {devices.map((device: SmartDevice) => (
            <TouchableOpacity
              key={device.id}
              onPress={() => setSelectedDevice(device.id)}
              className={`mr-4 p-4 rounded-2xl border-2 w-36 items-center ${
                selectedDevice === device.id 
                  ? "border-purple-500 bg-purple-500/10" 
                  : isDark ? "border-slate-800 bg-slate-900" : "border-slate-200 bg-white"
              }`}
            >
              <Ionicons 
                name={getDeviceIcon(device.type) as any} 
                size={32} 
                color={selectedDevice === device.id ? "#a855f7" : (isDark ? "#94a3b8" : "#64748b")} 
                className="mb-2" 
              />
              <Text className={`font-semibold text-center ${
                selectedDevice === device.id 
                  ? (isDark ? "text-purple-400" : "text-purple-600") 
                  : (isDark ? "text-slate-300" : "text-slate-700")
              }`} numberOfLines={1}>{device.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Path Connector */}
        <View className="items-center -mt-6 mb-2">
          <View className={`w-1 h-6 rounded-full ${isDark ? "bg-slate-800" : "bg-slate-200"}`} />
        </View>

        {/* Step 3: Select Action */}
        <Text className={`text-sm font-bold uppercase tracking-wider mb-4 ${isDark ? "text-slate-500" : "text-slate-400"}`}>
          3. Command Action
        </Text>
        <View className="flex-row flex-wrap justify-between">
          {actions.map((action, idx) => (
            <TouchableOpacity
              key={idx}
              onPress={() => setSelectedAction(action)}
              className={`w-[48%] p-4 rounded-2xl border-2 mb-4 items-center ${
                selectedAction === action 
                  ? "border-emerald-500 bg-emerald-500/10" 
                  : isDark ? "border-slate-800 bg-slate-900" : "border-slate-200 bg-white"
              }`}
            >
              <Text className={`font-semibold text-center ${
                selectedAction === action 
                  ? (isDark ? "text-emerald-400" : "text-emerald-600") 
                  : (isDark ? "text-slate-300" : "text-slate-700")
              }`}>{action}</Text>
            </TouchableOpacity>
          ))}
        </View>

      </ScrollView>

      {/* Action Button */}
      <View className={`px-6 pb-8 pt-4 border-t ${isDark ? "bg-slate-950 border-slate-900" : "bg-white border-slate-100"}`}>
        <TouchableOpacity
          onPress={handleSaveMapping}
          disabled={!selectedGesture || !selectedDevice || !selectedAction}
          className={`w-full py-4 rounded-full flex-row items-center justify-center ${
            selectedGesture && selectedDevice && selectedAction ? "bg-blue-600" : (isDark ? "bg-slate-800" : "bg-slate-200")
          }`}
        >
          <Text className={`font-bold text-lg mr-2 ${
            selectedGesture && selectedDevice && selectedAction ? "text-white" : (isDark ? "text-slate-500" : "text-slate-400")
          }`}>Save & Go to Dashboard</Text>
          {(selectedGesture && selectedDevice && selectedAction) && <Feather name="check" size={20} color="white" />}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
