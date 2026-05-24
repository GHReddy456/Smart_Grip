import React from "react";
import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Feather, Ionicons } from "@expo/vector-icons";
import { useAppStore } from "../../store/useAppStore";

export default function ProfileScreen() {
  const { 
    themeMode, patient_details, medical_condition, glove_hand,
    gestures, devices, resetOnboarding, role
  } = useAppStore();
  
  const isDark = themeMode === "dark";

  const handleLogout = () => {
    resetOnboarding();
    router.replace("/login");
  };

  const handleRescan = () => {
    useAppStore.setState({ scan_completed: false, fabrication_status: "Pending Scan" });
    router.replace("/scans/intro");
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
          Patient Profile
        </Text>
        <TouchableOpacity onPress={() => router.push("/profile/settings")}>
          <Feather name="settings" size={24} color={isDark ? "#94a3b8" : "#64748b"} />
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1 px-6" contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        
        {/* Profile Header */}
        <View className="items-center mt-4 mb-8">
          <View className={`w-24 h-24 rounded-full mb-4 items-center justify-center border-4 ${isDark ? "bg-slate-800 border-slate-700" : "bg-slate-200 border-white"} shadow-sm`}>
             <Feather name="user" size={40} color={isDark ? "#94a3b8" : "#64748b"} />
          </View>
          <Text className={`text-2xl font-bold ${isDark ? "text-white" : "text-slate-900"}`}>
            {patient_details?.fullName || "Patient Name"}
          </Text>
          <Text className={`text-base mt-1 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
            {patient_details?.age || "Age N/A"} • {patient_details?.height || "--"} cm • {patient_details?.weight || "--"} kg
          </Text>
        </View>

        {/* Diagnostics Summary */}
        <Text className={`text-sm font-bold uppercase tracking-wider mb-4 mt-2 ${isDark ? "text-slate-500" : "text-slate-400"}`}>
          Medical Summary
        </Text>
        <View className={`w-full p-5 rounded-3xl mb-8 border flex-row items-center justify-between ${isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"} shadow-sm`}>
          <View>
            <Text className={`text-sm font-medium ${isDark ? "text-slate-400" : "text-slate-500"}`}>Condition</Text>
            <Text className={`text-lg font-bold capitalize ${isDark ? "text-white" : "text-slate-900"}`}>{medical_condition || "Not Specified"}</Text>
          </View>
          <View className={`px-4 py-2 rounded-xl flex-row items-center ${isDark ? "bg-blue-900/20" : "bg-blue-50"}`}>
            <Ionicons name={glove_hand === "left" ? "hand-left" : "hand-right"} size={16} color={isDark ? "#60a5fa" : "#3b82f6"} />
            <Text className={`ml-2 font-bold capitalize ${isDark ? "text-blue-400" : "text-blue-600"}`}>{glove_hand} Hand</Text>
          </View>
        </View>

        {/* Device Metrics */}
        <Text className={`text-sm font-bold uppercase tracking-wider mb-4 ${isDark ? "text-slate-500" : "text-slate-400"}`}>
          System Metrics
        </Text>
        <View className="flex-row justify-between mb-8">
          <View className={`w-[48%] p-4 rounded-3xl border items-center ${isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"} shadow-sm`}>
            <Feather name="activity" size={24} color={isDark ? "#60a5fa" : "#3b82f6"} className="mb-2" />
            <Text className={`text-xl font-bold ${isDark ? "text-white" : "text-slate-900"}`}>{gestures.length}</Text>
            <Text className={`text-xs text-center ${isDark ? "text-slate-400" : "text-slate-500"}`}>Trained Gestures</Text>
          </View>
          <View className={`w-[48%] p-4 rounded-3xl border items-center ${isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"} shadow-sm`}>
            <Feather name="cpu" size={24} color={isDark ? "#a855f7" : "#a855f7"} className="mb-2" />
            <Text className={`text-xl font-bold ${isDark ? "text-white" : "text-slate-900"}`}>{devices.length}</Text>
            <Text className={`text-xs text-center ${isDark ? "text-slate-400" : "text-slate-500"}`}>Active IoT Nodes</Text>
          </View>
        </View>

        {/* Action Group */}
        <Text className={`text-sm font-bold uppercase tracking-wider mb-4 ${isDark ? "text-slate-500" : "text-slate-400"}`}>
          Management Actions
        </Text>
        <View className={`w-full rounded-3xl overflow-hidden border mb-8 ${isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"} shadow-sm`}>
          <TouchableOpacity className="p-5 flex-row items-center justify-between border-b border-slate-200/20">
            <View className="flex-row items-center">
              <Feather name="edit-2" size={20} color={isDark ? "#94a3b8" : "#64748b"} />
              <Text className={`ml-3 font-semibold ${isDark ? "text-slate-200" : "text-slate-700"}`}>Edit Patient Details</Text>
            </View>
            <Feather name="chevron-right" size={20} color={isDark ? "#475569" : "#cbd5e1"} />
          </TouchableOpacity>
          
          <TouchableOpacity onPress={handleRescan} className="p-5 flex-row items-center justify-between border-b border-slate-200/20">
            <View className="flex-row items-center">
              <Feather name="maximize" size={20} color={isDark ? "#94a3b8" : "#64748b"} />
              <Text className={`ml-3 font-semibold ${isDark ? "text-slate-200" : "text-slate-700"}`}>Re-scan Hand Dimensions</Text>
            </View>
            <Feather name="chevron-right" size={20} color={isDark ? "#475569" : "#cbd5e1"} />
          </TouchableOpacity>

          <TouchableOpacity className="p-5 flex-row items-center justify-between">
            <View className="flex-row items-center">
              <Feather name="sliders" size={20} color={isDark ? "#94a3b8" : "#64748b"} />
              <Text className={`ml-3 font-semibold ${isDark ? "text-slate-200" : "text-slate-700"}`}>Recalibrate BLE Sensors</Text>
            </View>
            <Feather name="chevron-right" size={20} color={isDark ? "#475569" : "#cbd5e1"} />
          </TouchableOpacity>
        </View>

        {role === "admin" && (
           <TouchableOpacity 
             onPress={() => router.push("/admin/dashboard")}
             className={`w-full py-4 rounded-2xl flex-row items-center justify-center mb-6 bg-purple-600`}
           >
             <Feather name="shield" size={18} color="white" />
             <Text className="text-white font-bold text-base ml-2">Admin Dashboard</Text>
           </TouchableOpacity>
        )}

        <TouchableOpacity 
          onPress={handleLogout}
          className={`w-full py-4 rounded-2xl flex-row items-center justify-center border-2 ${isDark ? "border-slate-800" : "border-slate-200"}`}
        >
          <Feather name="log-out" size={18} color={isDark ? "#ef4444" : "#ef4444"} />
          <Text className="text-red-500 font-bold text-base ml-2">Log Out</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}
