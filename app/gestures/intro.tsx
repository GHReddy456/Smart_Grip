import React from "react";
import { View, Text, TouchableOpacity, ScrollView, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Feather, Ionicons } from "@expo/vector-icons";
import { useAppStore } from "../../store/useAppStore";

export default function GestureIntroScreen() {
  const { themeMode } = useAppStore();
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
          Gesture Training
        </Text>
        <View className="w-10" />
      </View>

      <ScrollView className="flex-1 px-6" contentContainerStyle={{ paddingBottom: 40 }}>
        
        {/* Hero Visual */}
        <View className={`w-full h-48 rounded-3xl mb-8 items-center justify-center overflow-hidden ${isDark ? "bg-blue-900/20" : "bg-blue-50"}`}>
           {/* Placeholder for hand vector */}
           <Ionicons name="hand-right-outline" size={80} color={isDark ? "#3b82f6" : "#2563eb"} />
           <View className="absolute bottom-4 flex-row items-center space-x-1">
             <View className={`w-2 h-8 rounded-full ${isDark ? "bg-blue-500/80" : "bg-blue-500/80"}`} />
             <View className={`w-2 h-12 rounded-full ${isDark ? "bg-blue-400/80" : "bg-blue-400/80"}`} />
             <View className={`w-2 h-6 rounded-full ${isDark ? "bg-blue-300/80" : "bg-blue-300/80"}`} />
             <View className={`w-2 h-10 rounded-full ${isDark ? "bg-blue-500/80" : "bg-blue-500/80"}`} />
             <View className={`w-2 h-4 rounded-full ${isDark ? "bg-blue-400/80" : "bg-blue-400/80"}`} />
           </View>
        </View>

        <Text className={`text-2xl font-bold mb-4 ${isDark ? "text-white" : "text-slate-900"}`}>
          Train Your Glove
        </Text>
        <Text className={`text-base mb-8 leading-relaxed ${isDark ? "text-slate-300" : "text-slate-600"}`}>
          To control smart home devices, we need to teach your Smart Grip what your specific hand movements look like.
        </Text>

        {/* Instructional Cards */}
        <View className="space-y-4">
          <View className={`p-5 rounded-2xl flex-row items-start ${isDark ? "bg-slate-900" : "bg-white"} shadow-sm`}>
            <View className={`w-10 h-10 rounded-full items-center justify-center mr-4 ${isDark ? "bg-blue-500/20" : "bg-blue-100"}`}>
              <Text className={`font-bold ${isDark ? "text-blue-400" : "text-blue-600"}`}>1</Text>
            </View>
            <View className="flex-1">
              <Text className={`text-lg font-bold mb-1 ${isDark ? "text-white" : "text-slate-900"}`}>Choose a movement</Text>
              <Text className={`text-sm leading-relaxed ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                Pick a natural motion like a pinch, wrist rotation, or double-tap.
              </Text>
            </View>
          </View>

          <View className={`p-5 rounded-2xl flex-row items-start ${isDark ? "bg-slate-900" : "bg-white"} shadow-sm`}>
            <View className={`w-10 h-10 rounded-full items-center justify-center mr-4 ${isDark ? "bg-blue-500/20" : "bg-blue-100"}`}>
              <Text className={`font-bold ${isDark ? "text-blue-400" : "text-blue-600"}`}>2</Text>
            </View>
            <View className="flex-1">
              <Text className={`text-lg font-bold mb-1 ${isDark ? "text-white" : "text-slate-900"}`}>Repeat three times</Text>
              <Text className={`text-sm leading-relaxed ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                Multi-sample calibration ensures the glove accurately recognizes your unique range of motion.
              </Text>
            </View>
          </View>

          <View className={`p-5 rounded-2xl flex-row items-start ${isDark ? "bg-slate-900" : "bg-white"} shadow-sm`}>
            <View className={`w-10 h-10 rounded-full items-center justify-center mr-4 ${isDark ? "bg-emerald-500/20" : "bg-emerald-100"}`}>
              <Text className={`font-bold ${isDark ? "text-emerald-400" : "text-emerald-600"}`}>3</Text>
            </View>
            <View className="flex-1">
              <Text className={`text-lg font-bold mb-1 ${isDark ? "text-white" : "text-slate-900"}`}>Assign actions</Text>
              <Text className={`text-sm leading-relaxed ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                Once saved, you can map these gestures to control lights, fans, or send emergency alerts.
              </Text>
            </View>
          </View>
        </View>

      </ScrollView>

      {/* Action Button */}
      <View className={`px-6 pb-8 pt-4 border-t ${isDark ? "bg-slate-950 border-slate-900" : "bg-white border-slate-100"}`}>
        <TouchableOpacity
          onPress={() => router.push("/gestures/record")}
          className="w-full py-4 rounded-full flex-row items-center justify-center bg-blue-600"
        >
          <Text className="text-white font-bold text-lg mr-2">Start Training</Text>
          <Feather name="activity" size={20} color="white" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
