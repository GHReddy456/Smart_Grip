import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { apiUrl } from "../../lib/api";
import { useAppStore, FabricationStatus } from "../../store/useAppStore";

const timelineSteps: { status: FabricationStatus; label: string; icon: keyof typeof Feather.glyphMap; description: string }[] = [
  { status: "Pending Scan", label: "Scan Pending", icon: "camera", description: "Waiting for hand scan dimensions." },
  { status: "Scan Uploaded", label: "Analyzing", icon: "cpu", description: "Validating dimensions and proportions." },
  { status: "Processing", label: "Processing", icon: "layers", description: "Generating 3D model blueprint." },
  { status: "Fabricating", label: "Fabricating", icon: "printer", description: "3D printing the smart glove." },
  { status: "Shipped", label: "Shipped", icon: "truck", description: "Package is on the way." },
  { status: "Delivered", label: "Delivered", icon: "package", description: "Glove has been delivered." },
];

export default function DeliveryScreen() {
  const { fabrication_status, themeMode, patient_id } = useAppStore();
  const isDark = themeMode === "dark";
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Poll backend for real-time status
  const fetchStatus = async () => {
    if (!patient_id) return;
    setIsRefreshing(true);
    try {
      const res = await fetch(apiUrl("/api/v1/patients"));
      if (res.ok) {
        const patients = await res.json();
        const myProfile = patients.find((p: any) => p.id === patient_id);
        if (myProfile && myProfile.fabrication_status) {
          useAppStore.getState().setFabricationStatus(myProfile.fabrication_status as FabricationStatus);
        }
      }
    } catch (e) {
      console.warn("Failed to fetch real-time status", e);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 5000);
    return () => clearInterval(interval);
  }, [patient_id]);

  // Calculate current step index
  const currentIndex = timelineSteps.findIndex((s) => s.status === fabrication_status);
  const activeIndex = currentIndex === -1 && fabrication_status === "Connected" ? timelineSteps.length - 1 : currentIndex;

  const isDelivered = activeIndex >= timelineSteps.length - 1;

  return (
    <SafeAreaView className={`flex-1 ${isDark ? "bg-slate-950" : "bg-slate-50"}`}>
      <View className="px-6 pt-6 pb-4 flex-row items-center justify-between">
        <TouchableOpacity 
          onPress={() => router.replace("/(tabs)")}
          className={`w-10 h-10 items-center justify-center rounded-full ${isDark ? "bg-slate-800" : "bg-white"} shadow-sm`}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Back to Home"
        >
          <Feather name="arrow-left" size={20} color={isDark ? "#f8fafc" : "#0f172a"} />
        </TouchableOpacity>
        <Text 
          className={`text-lg font-semibold ${isDark ? "text-slate-100" : "text-slate-900"}`}
          accessible={true}
          accessibilityRole="header"
        >
          Order Status
        </Text>
        <View className="w-10" />
      </View>

      <ScrollView className="flex-1 px-6" contentContainerStyle={{ paddingBottom: 40 }}>
        
        {/* Tracking Card */}
        <View 
          className={`w-full p-6 rounded-3xl mb-8 border ${isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"} shadow-sm`}
          accessible={true}
          accessibilityLabel={`Order number GLV-8924-XT. Current status: ${fabrication_status}. ${isDelivered ? "Your custom glove has been delivered." : "Your custom glove is currently being prepared."}`}
        >
          <View className="flex-row items-center justify-between mb-4">
            <View>
              <Text className={`text-sm font-medium ${isDark ? "text-slate-400" : "text-slate-500"}`}>Order #</Text>
              <Text className={`text-lg font-bold ${isDark ? "text-white" : "text-slate-900"}`}>GLV-8924-XT</Text>
            </View>
            <View className={`px-3 py-1.5 rounded-full ${isDelivered ? "bg-emerald-500/10" : "bg-blue-500/10"}`}>
              <Text className={`text-sm font-semibold ${isDelivered ? "text-emerald-500" : "text-blue-500"}`}>
                {fabrication_status}
              </Text>
            </View>
          </View>
          
          <Text className={`text-base leading-relaxed ${isDark ? "text-slate-300" : "text-slate-700"}`} importantForAccessibility="no">
            {isDelivered 
              ? "Your custom glove has been delivered. You can now pair it with your device."
              : "Your custom glove is currently being prepared. We are precision-engineering it to your exact millimeter specifications."}
          </Text>
        </View>

        {/* Timeline */}
        <View className="px-2">
          <Text className={`text-lg font-bold mb-6 ${isDark ? "text-slate-100" : "text-slate-900"}`}>
            Fabrication Timeline
          </Text>
          
          {timelineSteps.map((step, index) => {
            const isCompleted = index <= activeIndex;
            const isCurrent = index === activeIndex;
            const isLast = index === timelineSteps.length - 1;

            return (
              <View 
                key={step.status} 
                className="flex-row"
                accessible={true}
                accessibilityRole="text"
                accessibilityLabel={`Timeline step ${index + 1}: ${step.label}. Status: ${isCurrent ? "In progress" : isCompleted ? "Completed" : "Pending"}. ${step.description}`}
              >
                {/* Timeline Line & Dot */}
                <View className="items-center mr-4" importantForAccessibility="no-hide-descendants">
                  <View className={`w-8 h-8 rounded-full items-center justify-center ${
                    isCurrent ? "bg-blue-500" : 
                    isCompleted ? "bg-emerald-500" : 
                    isDark ? "bg-slate-800" : "bg-slate-200"
                  }`}>
                    <Feather 
                      name={isCompleted && !isCurrent ? "check" : step.icon} 
                      size={14} 
                      color={isCompleted || isCurrent ? "white" : (isDark ? "#94a3b8" : "#64748b")} 
                    />
                  </View>
                  {!isLast && (
                    <View className={`w-0.5 h-12 my-1 rounded-full ${
                      index < activeIndex ? "bg-emerald-500" : 
                      isDark ? "bg-slate-800" : "bg-slate-200"
                    }`} />
                  )}
                </View>
                
                {/* Timeline Content */}
                <View className={`flex-1 pb-6 pt-1 ${!isCompleted ? "opacity-50" : ""}`} importantForAccessibility="no-hide-descendants">
                  <Text className={`text-base font-bold ${
                    isCurrent ? "text-blue-500" : 
                    isDark ? "text-slate-100" : "text-slate-900"
                  }`}>
                    {step.label}
                  </Text>
                  <Text className={`text-sm mt-1 ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                    {step.description}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>

      {/* Action Button */}
      <View className={`px-6 pb-8 pt-4 border-t ${isDark ? "bg-slate-950 border-slate-900" : "bg-white border-slate-100"}`}>
        <TouchableOpacity
          onPress={() => router.replace("/home")}
          className="w-full py-4 rounded-full flex-row items-center justify-center bg-blue-600"
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Go to Home Dashboard"
        >
          <Text className="text-white font-bold text-lg mr-2" importantForAccessibility="no">
            Go to Dashboard
          </Text>
          <Feather name="arrow-right" size={20} color="white" importantForAccessibility="no" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
