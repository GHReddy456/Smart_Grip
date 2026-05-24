import React, { useEffect, useRef } from "react";
import { View, Text, TouchableOpacity, Animated } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useAppStore } from "../../store/useAppStore";

export default function GestureSavedScreen() {
  const { themeMode } = useAppStore();
  const isDark = themeMode === "dark";
  
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      })
    ]).start();
  }, []);

  return (
    <SafeAreaView className={`flex-1 justify-center ${isDark ? "bg-slate-950" : "bg-slate-50"}`}>
      <View className="px-6 flex-1 items-center justify-center">
        
        {/* Success Micro-animation */}
        <Animated.View 
          style={{ transform: [{ scale: scaleAnim }] }}
          className="w-32 h-32 rounded-full bg-emerald-500 items-center justify-center shadow-lg shadow-emerald-500/30 mb-8"
        >
          <Feather name="check" size={64} color="white" />
        </Animated.View>

        <Animated.View style={{ opacity: fadeAnim }} className="items-center w-full">
          <Text className={`text-3xl font-bold mb-4 text-center ${isDark ? "text-white" : "text-slate-900"}`}>
            Gesture Saved!
          </Text>
          
          <Text className={`text-base text-center mb-10 px-4 leading-relaxed ${isDark ? "text-slate-400" : "text-slate-600"}`}>
            Your Smart Grip has successfully learned this motion with a high confidence score. 
          </Text>

          {/* Test Live Preview Block */}
          <View className={`w-full p-6 rounded-3xl mb-8 items-center border ${isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}>
            <Text className={`text-sm font-bold uppercase tracking-wider mb-4 ${isDark ? "text-slate-500" : "text-slate-400"}`}>
              Live Preview
            </Text>
            <View className={`w-full py-4 rounded-xl flex-row items-center justify-center border-2 border-dashed ${isDark ? "border-slate-700 bg-slate-800/50" : "border-slate-300 bg-slate-50"}`}>
              <Text className={`font-semibold mr-2 ${isDark ? "text-slate-300" : "text-slate-600"}`}>
                Perform gesture to test...
              </Text>
              <Feather name="radio" size={18} color={isDark ? "#94a3b8" : "#64748b"} />
            </View>
          </View>
        </Animated.View>

      </View>

      {/* Action Buttons */}
      <Animated.View style={{ opacity: fadeAnim }} className={`px-6 pb-8 pt-4 border-t ${isDark ? "bg-slate-950 border-slate-900" : "bg-white border-slate-100"}`}>
        <TouchableOpacity
          onPress={() => router.push("/devices")}
          className="w-full py-4 rounded-full flex-row items-center justify-center bg-blue-600 mb-3"
        >
          <Text className="text-white font-bold text-lg mr-2">View Smart Devices</Text>
          <Feather name="arrow-right" size={20} color="white" />
        </TouchableOpacity>
        
        <TouchableOpacity
          onPress={() => router.replace("/home")}
          className={`w-full py-4 rounded-full flex-row items-center justify-center border-2 ${isDark ? "border-slate-800 bg-slate-900" : "border-slate-200 bg-white"}`}
        >
          <Text className={`font-bold text-lg ${isDark ? "text-slate-300" : "text-slate-700"}`}>Do it later</Text>
        </TouchableOpacity>
      </Animated.View>
    </SafeAreaView>
  );
}
