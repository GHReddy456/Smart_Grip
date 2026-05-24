import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, ScrollView, Animated, Easing } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Feather, Ionicons } from "@expo/vector-icons";
import { useAppStore } from "../../store/useAppStore";

export default function ConnectScreen() {
  const { themeMode, glove_connection_state, setGloveConnectionState, setGloveConnected } = useAppStore();
  const isDark = themeMode === "dark";
  
  const [pulseAnim] = useState(new Animated.Value(1));
  const [calibrationProgress, setCalibrationProgress] = useState(0);

  useEffect(() => {
    if (glove_connection_state === "Searching") {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          })
        ])
      ).start();

      // Mock sequence: Searching -> Pairing -> Connected
      setTimeout(() => {
        setGloveConnectionState("Pairing");
        setTimeout(() => {
          setGloveConnectionState("Connected");
          setGloveConnected(true);
        }, 2000);
      }, 3000);
    } else {
      pulseAnim.setValue(1);
      pulseAnim.stopAnimation();
    }
  }, [glove_connection_state]);

  useEffect(() => {
    if (glove_connection_state === "Connected") {
      // Simulate calibration
      let progress = 0;
      const interval = setInterval(() => {
        progress += 5;
        if (progress <= 100) {
          setCalibrationProgress(progress);
        } else {
          clearInterval(interval);
        }
      }, 100);
      return () => clearInterval(interval);
    }
  }, [glove_connection_state]);

  const handleStartSearch = () => {
    setGloveConnectionState("Searching");
  };

  const isConnected = glove_connection_state === "Connected";

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
          Pair Glove
        </Text>
        <View className="w-10" />
      </View>

      <ScrollView className="flex-1 px-6" contentContainerStyle={{ paddingBottom: 40, alignItems: 'center' }}>
        
        {/* Glove Graphic Area */}
        <View className="w-full h-64 items-center justify-center my-8">
          <Animated.View 
            style={{ transform: [{ scale: pulseAnim }] }}
            className={`absolute w-48 h-48 rounded-full ${isDark ? "bg-blue-500/10" : "bg-blue-100/50"}`}
          />
          <Animated.View 
            style={{ transform: [{ scale: Animated.multiply(pulseAnim, 1.1) }] }}
            className={`absolute w-64 h-64 rounded-full ${isDark ? "bg-blue-500/5" : "bg-blue-50/50"}`}
          />
          
          {/* Glove Icon Placeholder */}
          <View className={`w-32 h-32 rounded-full items-center justify-center z-10 ${isDark ? "bg-slate-800" : "bg-white"} shadow-lg border ${isDark ? "border-slate-700" : "border-slate-100"}`}>
             <Ionicons name="hand-right" size={64} color={isConnected ? "#10b981" : (isDark ? "#60a5fa" : "#3b82f6")} />
          </View>
        </View>

        {/* Status Text */}
        <Text className={`text-2xl font-bold mb-2 ${isDark ? "text-white" : "text-slate-900"}`}>
          {glove_connection_state === "Disconnected" ? "Ready to Pair" : 
           glove_connection_state === "Searching" ? "Searching for Glove..." :
           glove_connection_state === "Pairing" ? "Pairing..." : 
           glove_connection_state === "Failed" ? "Connection Failed" : "Connected Successfully"}
        </Text>
        
        <Text className={`text-base text-center mb-10 px-4 ${isDark ? "text-slate-400" : "text-slate-600"}`}>
          {glove_connection_state === "Disconnected" ? "Turn on your Smart Grip and tap the button below." : 
           glove_connection_state === "Searching" ? "Keep your glove close to your device." :
           glove_connection_state === "Pairing" ? "Establishing secure connection..." : 
           glove_connection_state === "Failed" ? "Make sure the glove is turned on and try again." : 
           "Your glove is now paired and active."}
        </Text>

        {/* Telemetry Display (Visible only when connected) */}
        {isConnected && (
          <View className="w-full space-y-4">
            <View className="flex-row justify-between w-full">
              <View className={`flex-1 p-4 rounded-2xl mr-2 ${isDark ? "bg-slate-900" : "bg-white"} shadow-sm`}>
                <View className="flex-row items-center mb-2">
                  <Feather name="battery-charging" size={16} color="#10b981" />
                  <Text className={`ml-2 text-sm font-medium ${isDark ? "text-slate-400" : "text-slate-500"}`}>Battery</Text>
                </View>
                <Text className={`text-xl font-bold ${isDark ? "text-white" : "text-slate-900"}`}>82%</Text>
              </View>
              
              <View className={`flex-1 p-4 rounded-2xl ml-2 ${isDark ? "bg-slate-900" : "bg-white"} shadow-sm`}>
                <View className="flex-row items-center mb-2">
                  <Feather name="cpu" size={16} color="#3b82f6" />
                  <Text className={`ml-2 text-sm font-medium ${isDark ? "text-slate-400" : "text-slate-500"}`}>Firmware</Text>
                </View>
                <Text className={`text-xl font-bold ${isDark ? "text-white" : "text-slate-900"}`}>v2.1.4</Text>
              </View>
            </View>

            {/* Calibration Progress */}
            <View className={`w-full p-5 rounded-2xl mt-4 ${isDark ? "bg-slate-900" : "bg-white"} shadow-sm`}>
              <View className="flex-row justify-between mb-3">
                <Text className={`font-semibold ${isDark ? "text-slate-300" : "text-slate-700"}`}>Sensor Calibration</Text>
                <Text className={`font-bold ${calibrationProgress === 100 ? "text-emerald-500" : "text-blue-500"}`}>{calibrationProgress}%</Text>
              </View>
              <View className={`h-2 w-full rounded-full overflow-hidden ${isDark ? "bg-slate-800" : "bg-slate-100"}`}>
                <View 
                  className={`h-full ${calibrationProgress === 100 ? "bg-emerald-500" : "bg-blue-500"}`} 
                  style={{ width: `${calibrationProgress}%` }} 
                />
              </View>
            </View>
          </View>
        )}

      </ScrollView>

      {/* Action Button */}
      <View className={`px-6 pb-8 pt-4 border-t ${isDark ? "bg-slate-950 border-slate-900" : "bg-white border-slate-100"}`}>
        {!isConnected ? (
          <TouchableOpacity
            onPress={handleStartSearch}
            disabled={glove_connection_state === "Searching" || glove_connection_state === "Pairing"}
            className={`w-full py-4 rounded-full flex-row items-center justify-center ${
              glove_connection_state === "Searching" || glove_connection_state === "Pairing" 
                ? "bg-blue-400" 
                : "bg-blue-600"
            }`}
          >
            <Text className="text-white font-bold text-lg mr-2">
              {glove_connection_state === "Searching" ? "Searching..." : 
               glove_connection_state === "Pairing" ? "Pairing..." : "Start Pairing"}
            </Text>
            {glove_connection_state === "Disconnected" || glove_connection_state === "Failed" ? (
              <Feather name="bluetooth" size={20} color="white" />
            ) : null}
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            onPress={() => router.replace("/gestures/intro")}
            disabled={calibrationProgress < 100}
            className={`w-full py-4 rounded-full flex-row items-center justify-center ${
              calibrationProgress < 100 ? "bg-emerald-400" : "bg-emerald-500"
            }`}
          >
            <Text className="text-white font-bold text-lg mr-2">
              {calibrationProgress < 100 ? "Calibrating Sensors..." : "Continue to Training"}
            </Text>
            {calibrationProgress === 100 && <Feather name="arrow-right" size={20} color="white" />}
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}
