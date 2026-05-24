import React, { useState, useRef } from "react";
import { View, Text, TouchableOpacity, ScrollView, Animated } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Feather, Ionicons } from "@expo/vector-icons";
import { useAppStore, SosEvent } from "../../store/useAppStore";

export default function SosScreen() {
  const { themeMode, patient_details, addSosEvent, sos_events } = useAppStore();
  const isDark = themeMode === "dark";

  const [isPressing, setIsPressing] = useState(false);
  const [activated, setActivated] = useState(false);
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  const handlePressIn = () => {
    setIsPressing(true);
    Animated.parallel([
      Animated.timing(scaleAnim, { toValue: 0.95, duration: 150, useNativeDriver: true }),
      Animated.timing(progressAnim, { toValue: 1, duration: 3000, useNativeDriver: false }) // 3 second long press
    ]).start(({ finished }) => {
      if (finished) {
        triggerSos();
      }
    });
  };

  const handlePressOut = () => {
    if (!activated) {
      setIsPressing(false);
      Animated.parallel([
        Animated.spring(scaleAnim, { toValue: 1, friction: 5, useNativeDriver: true }),
        Animated.timing(progressAnim, { toValue: 0, duration: 200, useNativeDriver: false })
      ]).start();
    }
  };

  const triggerSos = () => {
    setActivated(true);
    const newEvent: SosEvent = {
      id: "sos-" + Date.now(),
      time: new Date().toLocaleTimeString(),
      location: "37.7749° N, 122.4194° W (Home)",
      resolved: false
    };
    addSosEvent(newEvent);
  };

  const cancelSos = () => {
    setActivated(false);
    setIsPressing(false);
    progressAnim.setValue(0);
    scaleAnim.setValue(1);
    // Mark last event as resolved for demo
    if (sos_events.length > 0) {
      useAppStore.setState((state) => {
        const newEvents = [...state.sos_events];
        newEvents[0].resolved = true;
        return { sos_events: newEvents };
      });
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
          Emergency SOS
        </Text>
        <View className="w-10" />
      </View>

      <ScrollView className="flex-1 px-6" contentContainerStyle={{ paddingBottom: 40, alignItems: 'center' }}>
        
        <Text className={`text-center mb-8 px-4 ${isDark ? "text-slate-400" : "text-slate-600"}`}>
          Press and hold for 3 seconds to alert your emergency contacts and local authorities.
        </Text>

        {/* SOS Button Area */}
        <View className="w-full h-80 items-center justify-center mb-6 relative">
          
          {/* Progress Ring Background */}
          <View className={`absolute w-72 h-72 rounded-full border-8 ${isDark ? "border-slate-800" : "border-slate-200"}`} />
          
          {/* Progress Bar (Simulated with absolute position wrapper for React Native without complex SVG) */}
          <Animated.View style={{ 
              position: 'absolute', width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center',
              opacity: progressAnim.interpolate({ inputRange: [0, 0.1, 1], outputRange: [0, 1, 1] })
            }}>
             <View className={`absolute w-72 h-72 rounded-full border-8 border-red-500`} style={{ borderTopColor: 'transparent', borderRightColor: 'transparent', transform: [{ rotate: '-45deg' }] }} />
             <View className={`absolute w-72 h-72 rounded-full border-8 border-red-500`} style={{ borderBottomColor: 'transparent', borderLeftColor: 'transparent', transform: [{ rotate: '135deg' }] }} />
          </Animated.View>

          {/* Main Button */}
          <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
            <TouchableOpacity 
              activeOpacity={1}
              onPressIn={handlePressIn}
              onPressOut={handlePressOut}
              disabled={activated}
              className={`w-60 h-60 rounded-full items-center justify-center shadow-2xl shadow-red-500/50 ${activated ? "bg-red-700" : "bg-red-500"}`}
            >
              {activated ? (
                <>
                  <Ionicons name="warning" size={64} color="white" className="mb-2" />
                  <Text className="text-white text-2xl font-bold tracking-widest">ACTIVATED</Text>
                </>
              ) : (
                <>
                  <Text className="text-white text-5xl font-bold tracking-widest">SOS</Text>
                  <Text className="text-red-200 font-semibold uppercase tracking-wider mt-2">Hold 3 Seconds</Text>
                </>
              )}
            </TouchableOpacity>
          </Animated.View>
        </View>

        {/* Status Verification */}
        {activated && (
          <View className="w-full p-6 rounded-3xl mb-8 bg-red-100 border border-red-200">
            <Text className="text-red-800 text-lg font-bold text-center mb-2">Emergency Signal Sent</Text>
            <Text className="text-red-700 text-center mb-4 leading-relaxed">
              Alert dispatched to {patient_details?.emergencyContactName || "Emergency Contact"} at {patient_details?.emergencyContactPhone || "911"}. Location data transmitted.
            </Text>
            <TouchableOpacity 
              onPress={cancelSos}
              className="w-full py-3 rounded-full bg-red-600 items-center"
            >
              <Text className="text-white font-bold">Cancel Alarm</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* GPS Placeholder */}
        <View className={`w-full p-5 rounded-3xl border mb-6 flex-row items-center justify-between ${isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}>
          <View className="flex-row items-center">
            <Feather name="map-pin" size={20} color={isDark ? "#64748b" : "#94a3b8"} />
            <Text className={`ml-3 font-semibold ${isDark ? "text-slate-300" : "text-slate-700"}`}>Current Location</Text>
          </View>
          <Text className={`text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}>37.7749° N, 122.4194° W</Text>
        </View>

        {/* Contact Info */}
        <View className={`w-full p-5 rounded-3xl border ${isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}>
          <Text className={`text-sm font-bold uppercase tracking-wider mb-4 ${isDark ? "text-slate-500" : "text-slate-400"}`}>
            Primary Contact
          </Text>
          <View className="flex-row justify-between items-center">
            <View>
              <Text className={`text-lg font-bold ${isDark ? "text-white" : "text-slate-900"}`}>
                {patient_details?.emergencyContactName || "Not Set"}
              </Text>
              <Text className={`text-base ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                {patient_details?.emergencyContactPhone || "Not Set"}
              </Text>
            </View>
            <TouchableOpacity className={`w-12 h-12 rounded-full items-center justify-center ${isDark ? "bg-blue-900/30" : "bg-blue-50"}`}>
              <Feather name="phone" size={20} color={isDark ? "#60a5fa" : "#3b82f6"} />
            </TouchableOpacity>
          </View>
        </View>

        {/* History Log */}
        {sos_events.length > 0 && (
          <View className="w-full mt-8">
            <Text className={`text-sm font-bold uppercase tracking-wider mb-4 ${isDark ? "text-slate-500" : "text-slate-400"}`}>
              Recent Alerts
            </Text>
            {sos_events.map((event) => (
              <View key={event.id} className="flex-row justify-between items-center py-3 border-b border-slate-200/20">
                <View>
                  <Text className={`font-semibold ${isDark ? "text-slate-300" : "text-slate-700"}`}>{event.time}</Text>
                  <Text className={`text-xs ${isDark ? "text-slate-500" : "text-slate-400"}`}>{event.location}</Text>
                </View>
                <View className={`px-3 py-1 rounded-full ${event.resolved ? "bg-emerald-500/10" : "bg-red-500/10"}`}>
                  <Text className={`text-xs font-bold ${event.resolved ? "text-emerald-500" : "text-red-500"}`}>
                    {event.resolved ? "Resolved" : "Active"}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}
