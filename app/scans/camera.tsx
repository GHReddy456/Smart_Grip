import React, { useEffect, useState } from "react";
import { Image, Pressable, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";

import { useAppTheme } from "../../lib/theme";
import { useAppStore } from "../../store/useAppStore";
import { GlassCard, PrimaryButton, SecondaryButton } from "../../components/ui";

const scanPostures = [
  { id: "wrist", title: "Wrist Scan", desc: "Align your wrist and lower forearm with the horizontal guides." },
  { id: "palm-front", title: "Palm Front", desc: "Face your open palm directly towards the camera guide." },
  { id: "palm-side", title: "Palm Side", desc: "Turn your hand sideways to show the thumb and profile edge." },
  { id: "fingers", title: "Fingers Extended", desc: "Spread all fingers open and keep them completely flat." },
  { id: "fist", title: "Closed Fist", desc: "Gently make a closed fist with your thumb wrapped outside." },
  { id: "wrist-rotation", title: "Wrist Rotation", desc: "Rotate your wrist 45 degrees to capture side sensors." }
];

export default function CameraScanScreen() {
  const router = useRouter();
  const colors = useAppTheme();
  const gloveHand = useAppStore((state) => state.glove_hand) || "right";
  const captureScanStep = useAppStore((state) => state.captureScanStep);

  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [precision, setPrecision] = useState(94);

  const currentPosture = scanPostures[currentStepIndex];

  useEffect(() => {
    // Simulate high-tech precision value oscillation
    const interval = setInterval(() => {
      setPrecision(Math.floor(Math.random() * (98 - 92 + 1)) + 92);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const handleCapture = () => {
    // Record mock capture uri
    const mockUri = `mock-uri-for-${currentPosture.id}-${gloveHand}`;
    captureScanStep(currentPosture.id, mockUri);

    if (currentStepIndex < scanPostures.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1);
    } else {
      router.push("/scans/review");
    }
  };

  const handleRetake = () => {
    // Reset precision mock
    setPrecision(88);
  };

  // Flip silhouette if left hand selected
  const isLeftHand = gloveHand === "left";

  return (
    <View style={{ backgroundColor: "#02040A" }} className="flex-1">
      {/* Top Header */}
      <View style={{ borderBottomColor: "rgba(255,255,255,0.1)" }} className="absolute top-0 left-0 right-0 z-50 flex-row items-center justify-between px-5 pt-12 pb-4 bg-black/40 backdrop-blur-md border-b">
        <Pressable onPress={() => router.back()} className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 active:scale-95">
          <MaterialIcons name="close" size={24} color="#FFFFFF" />
        </Pressable>
        <Text className="font-display text-[18px] font-bold text-white uppercase tracking-wider">
          {gloveHand.toUpperCase()} HAND SCAN
        </Text>
        <View className="w-10 h-10 flex items-center justify-center bg-white/10 rounded-full">
          <MaterialIcons name="info-outline" size={22} color="#FFFFFF" />
        </View>
      </View>

      {/* Camera Mock Image */}
      <Image
        source={{ uri: "https://lh3.googleusercontent.com/aida-public/AB6AXuAx38pydJuGw1x0dbFWl2Ru26QtKis7_w47ZareFOMk5H1zKBWTMakvJYUDO3Cepk5nNNZnCw_odzn2IvT2msIhcpT_8wCqjunFQLwneFsehVtlko1Poo_4_LjpYfmllUaBFExOrE532E1EtDSPAjo_36c5C2CmTFCp8ZMYgXMWO-SzbI9XDQeNIzWL6TBzafQY_5EXZpMSNaZgNfOcRvmBoHhGU7cUFhFt58JxUomWa4OMDqaEPfcNlKgfPhTtGX2OY41FhFnYMGo" }}
        className="absolute inset-0 w-full h-full object-cover opacity-70"
      />
      <View className="absolute inset-0 bg-black/30 pointer-events-none" />

      {/* Step Tracker Segmented Progress */}
      <View className="absolute top-[100px] left-0 right-0 z-40 px-5 flex-row gap-1">
        {scanPostures.map((p, idx) => (
          <View
            key={p.id}
            style={{
              backgroundColor: idx <= currentStepIndex ? colors.primary : "rgba(255,255,255,0.2)"
            }}
            className="flex-1 h-1 rounded-full"
          />
        ))}
      </View>

      {/* Futuristic Scanner Guides & Overlays */}
      <View className="absolute inset-0 z-20 flex items-center justify-center">
        <View className="relative w-[280px] h-[380px] md:w-[320px] md:h-[440px]">
          {/* Corner brackets */}
          <View style={{ borderColor: colors.primary }} className="w-10 h-10 border-t-4 border-l-4 rounded-tl-3xl absolute top-0 left-0" />
          <View style={{ borderColor: colors.primary }} className="w-10 h-10 border-t-4 border-r-4 rounded-tr-3xl absolute top-0 right-0" />
          <View style={{ borderColor: colors.primary }} className="w-10 h-10 border-b-4 border-l-4 rounded-bl-3xl absolute bottom-0 left-0" />
          <View style={{ borderColor: colors.primary }} className="w-10 h-10 border-b-4 border-r-4 rounded-br-3xl absolute bottom-0 right-0" />

          {/* Animated Hand Silhouette (Flipped for Left Hand dynamically) */}
          <View
            style={{
              transform: [{ scaleX: isLeftHand ? -1 : 1 }],
              opacity: 0.65
            }}
            className="absolute inset-0 items-center justify-center"
          >
            <MaterialIcons
              name={currentPosture.id === "fist" ? "back-hand" : "back-hand"}
              size={220}
              color={colors.primary}
            />
          </View>

          {/* Glowing Scanner HUD lines */}
          <View className="absolute left-[-20px] top-1/2 -translate-y-1/2 flex-col gap-6 opacity-60">
            <View style={{ backgroundColor: colors.primary }} className="w-1.5 h-6 rounded-full" />
            <View style={{ backgroundColor: colors.primary }} className="w-2.5 h-10 rounded-full" />
            <View style={{ backgroundColor: colors.primary }} className="w-1.5 h-6 rounded-full" />
          </View>

          {/* Moving Scan Line */}
          <View style={{ backgroundColor: colors.primary, shadowColor: colors.primary, shadowRadius: 10, shadowOpacity: 0.8 }} className="absolute w-full h-[3px] rounded-full top-[40%] opacity-80" />
        </View>
      </View>

      {/* Floating HUD Information Banner */}
      <View className="absolute top-[125px] left-5 right-5 z-40 items-center pointer-events-none">
        <View className="bg-black/60 px-5 py-3 rounded-full border border-white/10 flex-row items-center gap-2">
          <MaterialIcons name="center-focus-weak" size={20} color={colors.primary} />
          <Text className="font-body text-[14px] text-white font-medium">
            Align {gloveHand} hand: {currentPosture.title}
          </Text>
        </View>
      </View>

      {/* Bottom Panel Container */}
      <View className="absolute bottom-0 left-0 right-0 z-50 p-5 pb-8">
        <GlassCard colors={colors} className="bg-black/65 border-white/10 p-5 gap-4">
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-2">
              <View className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <Text className="font-display text-[13px] text-white/85 uppercase tracking-wide">
                CV Align: {precision}%
              </Text>
            </View>
            <Text className="font-display text-[12px] text-white/50 uppercase">
              POSTURE {currentStepIndex + 1} OF 6
            </Text>
          </View>

          <View className="gap-1.5">
            <Text style={{ color: "#FFFFFF" }} className="font-display text-[20px] font-bold">
              {currentPosture.title} ({gloveHand} hand)
            </Text>
            <Text style={{ color: "rgba(255,255,255,0.7)" }} className="font-body text-[14px] leading-5">
              {currentPosture.desc}
            </Text>
          </View>

          <View className="flex-row gap-3 pt-2">
            <View className="flex-1">
              <SecondaryButton
                colors={colors}
                title="Retake"
                icon="refresh"
                className="bg-transparent border-white/20 text-white min-h-[50]"
                onPress={handleRetake}
              />
            </View>
            <View className="flex-[2]">
              <PrimaryButton
                colors={colors}
                title="Capture Frame"
                icon="camera-alt"
                className="min-h-[50]"
                onPress={handleCapture}
              />
            </View>
          </View>
        </GlassCard>
      </View>
    </View>
  );
}
