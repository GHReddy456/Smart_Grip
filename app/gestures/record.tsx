import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, ScrollView, Animated, Easing } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useAppStore } from "../../store/useAppStore";

export default function RecordGestureScreen() {
  const { themeMode, addTrainedGesture } = useAppStore();
  const isDark = themeMode === "dark";

  const [step, setStep] = useState(0); // 0 = idle, 1 = recording 1, 2 = recording 2, 3 = recording 3, 4 = done
  const [timer, setTimer] = useState(3);
  const [pulseAnim] = useState(new Animated.Value(1));
  const [waveAnim] = useState(new Animated.Value(0));

  const startRecordingPhase = () => {
    setStep((prev) => prev + 1);
    setTimer(3);
    
    // Pulse animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.5, duration: 800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 800, easing: Easing.inOut(Easing.ease), useNativeDriver: true })
      ])
    ).start();

    // Waveform simulation
    Animated.loop(
      Animated.sequence([
        Animated.timing(waveAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.timing(waveAnim, { toValue: 0, duration: 500, useNativeDriver: true })
      ])
    ).start();
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (step > 0 && step < 4) {
      if (timer > 0) {
        interval = setInterval(() => setTimer((t) => t - 1), 1000);
      } else {
        pulseAnim.stopAnimation();
        pulseAnim.setValue(1);
        waveAnim.stopAnimation();
        waveAnim.setValue(0);
        
        if (step === 3) {
          setStep(4); // Done
        } else {
          // Auto start next after short delay
          setTimeout(startRecordingPhase, 1500);
        }
      }
    }
    return () => clearInterval(interval);
  }, [step, timer]);

  const handleSave = () => {
    addTrainedGesture({
      id: "custom-" + Date.now(),
      name: "Custom Pinch",
      samples: 3,
      isTrained: true,
      confidence: 94
    });
    router.replace("/gestures/saved");
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
          Record Gesture
        </Text>
        <View className="w-10" />
      </View>

      <ScrollView className="flex-1 px-6" contentContainerStyle={{ paddingBottom: 40, alignItems: 'center' }}>
        
        {/* Sensor Dashboard Area */}
        <View className={`w-full h-72 rounded-3xl mt-4 mb-8 overflow-hidden border ${isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"} shadow-sm relative items-center justify-center`}>
          
          {/* Background grid */}
          <View className="absolute inset-0 opacity-10">
             {/* Simple grid simulation */}
             {[1,2,3,4,5].map(i => <View key={`h-${i}`} className="w-full h-px bg-current absolute" style={{top: `${i*20}%`}} />)}
             {[1,2,3,4,5].map(i => <View key={`v-${i}`} className="h-full w-px bg-current absolute" style={{left: `${i*20}%`}} />)}
          </View>

          {/* Recording UI */}
          {step > 0 && step < 4 ? (
            <>
              <Animated.View 
                style={{ transform: [{ scale: pulseAnim }], opacity: 0.2 }}
                className="absolute w-40 h-40 rounded-full bg-red-500"
              />
              <View className="w-24 h-24 rounded-full bg-red-500 items-center justify-center z-10 shadow-lg shadow-red-500/50">
                <Text className="text-white text-4xl font-bold">{timer}</Text>
              </View>
              <Text className={`absolute bottom-6 font-bold tracking-widest ${isDark ? "text-red-400" : "text-red-500"}`}>
                RECORDING SAMPLE {step}/3
              </Text>
              
              {/* Fake waveforms */}
              <Animated.View style={{ opacity: waveAnim }} className="absolute bottom-16 w-full flex-row justify-center space-x-1 px-10">
                {[...Array(20)].map((_, i) => (
                  <View key={i} className={`w-1 rounded-t-full bg-red-500`} style={{ height: Math.random() * 40 + 10 }} />
                ))}
              </Animated.View>
            </>
          ) : step === 4 ? (
            <View className="items-center">
              <View className="w-24 h-24 rounded-full bg-emerald-500 items-center justify-center z-10 shadow-lg shadow-emerald-500/50 mb-4">
                <Feather name="check" size={40} color="white" />
              </View>
              <Text className={`text-xl font-bold ${isDark ? "text-emerald-400" : "text-emerald-500"}`}>Calibration Complete</Text>
              <Text className={`text-sm mt-2 ${isDark ? "text-slate-400" : "text-slate-500"}`}>Confidence Score: 94%</Text>
            </View>
          ) : (
            <View className="items-center px-6">
              <Feather name="target" size={48} color={isDark ? "#475569" : "#94a3b8"} className="mb-4" />
              <Text className={`text-center text-lg font-medium ${isDark ? "text-slate-300" : "text-slate-600"}`}>
                Get ready to perform the motion. Press start when ready.
              </Text>
            </View>
          )}
        </View>

        {/* Progress Tracker */}
        <View className="flex-row items-center justify-center space-x-4 mb-10 w-full">
          {[1, 2, 3].map((num) => (
            <View key={num} className="items-center flex-1">
              <View className={`w-12 h-12 rounded-full items-center justify-center mb-2 border-2 ${
                step > num || step === 4 ? "bg-emerald-500 border-emerald-500" :
                step === num ? "bg-transparent border-red-500" :
                isDark ? "bg-transparent border-slate-700" : "bg-transparent border-slate-200"
              }`}>
                {step > num || step === 4 ? (
                  <Feather name="check" size={20} color="white" />
                ) : (
                  <Text className={`font-bold ${
                    step === num ? "text-red-500" :
                    isDark ? "text-slate-500" : "text-slate-400"
                  }`}>{num}</Text>
                )}
              </View>
              <Text className={`text-xs font-semibold ${
                step > num || step === 4 ? "text-emerald-500" :
                step === num ? "text-red-500" :
                isDark ? "text-slate-500" : "text-slate-400"
              }`}>SAMPLE {num}</Text>
            </View>
          ))}
        </View>

      </ScrollView>

      {/* Action Button */}
      <View className={`px-6 pb-8 pt-4 border-t ${isDark ? "bg-slate-950 border-slate-900" : "bg-white border-slate-100"}`}>
        {step === 0 ? (
          <TouchableOpacity
            onPress={startRecordingPhase}
            className="w-full py-4 rounded-full flex-row items-center justify-center bg-blue-600"
          >
            <Text className="text-white font-bold text-lg mr-2">Start Recording</Text>
            <Feather name="play-circle" size={20} color="white" />
          </TouchableOpacity>
        ) : step === 4 ? (
          <TouchableOpacity
            onPress={handleSave}
            className="w-full py-4 rounded-full flex-row items-center justify-center bg-emerald-500"
          >
            <Text className="text-white font-bold text-lg mr-2">Save Gesture</Text>
            <Feather name="save" size={20} color="white" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            disabled
            className={`w-full py-4 rounded-full flex-row items-center justify-center ${isDark ? "bg-slate-800" : "bg-slate-200"}`}
          >
            <Text className={`font-bold text-lg mr-2 ${isDark ? "text-slate-500" : "text-slate-400"}`}>Recording in progress...</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}
