import React, { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";

import { useAppTheme } from "../../lib/theme";
import { useAppStore, type GloveConnectionState } from "../../store/useAppStore";
import { GlassCard, PrimaryButton, SecondaryButton } from "../../components/ui";

export default function GloveConnectScreen() {
  const router = useRouter();
  const colors = useAppTheme();
  
  const gloveHand = useAppStore((state) => state.glove_hand) || "right";
  const gloveState = useAppStore((state) => state.glove_connection_state);
  const setGloveConnectionState = useAppStore((state) => state.setGloveConnectionState);
  const setFabricationStatus = useAppStore((state) => state.setFabricationStatus);

  const [connectingProgress, setConnectingProgress] = useState(0);

  const startConnection = () => {
    setGloveConnectionState("Searching");
    setConnectingProgress(0);
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (gloveState === "Searching") {
      interval = setInterval(() => {
        setConnectingProgress((prev) => {
          if (prev >= 40) {
            setGloveConnectionState("Pairing");
            return 50;
          }
          return prev + 10;
        });
      }, 500);
    } else if (gloveState === "Pairing") {
      interval = setInterval(() => {
        setConnectingProgress((prev) => {
          if (prev >= 90) {
            setGloveConnectionState("Connected");
            setFabricationStatus("Connected");
            clearInterval(interval);
            return 100;
          }
          return prev + 10;
        });
      }, 500);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [gloveState]);

  useEffect(() => {
    if (gloveState === "Connected") {
      const timer = setTimeout(() => {
        router.replace("/home");
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [gloveState]);

  const handLabel = gloveHand === "left" ? "Left Hand" : "Right Hand";

  return (
    <View style={{ backgroundColor: colors.background }} className="flex-1 justify-center px-5 py-6">
      <GlassCard colors={colors} className="w-full max-w-md gap-6 p-6 shadow-xl items-center mx-auto">
        <View style={{ backgroundColor: colors.primarySoft }} className="w-20 h-20 rounded-full items-center justify-center">
          <MaterialIcons 
            name={gloveState === "Connected" ? "bluetooth-connected" : "bluetooth-searching"} 
            size={40} 
            color={colors.primary} 
          />
        </View>

        <View className="items-center gap-2">
          <Text style={{ color: colors.text }} className="font-display text-[26px] font-bold text-center">
            {gloveState === "Connected" ? "Glove Connected" : `Connect Smart Glove`}
          </Text>
          <Text style={{ color: colors.secondaryText }} className="font-body text-[15px] text-center leading-5 px-2">
            {gloveState === "Disconnected" && `Power on your custom ${handLabel} smart glove to start Bluetooth pairing.`}
            {gloveState === "Searching" && `Searching for ${handLabel} Smart Glove (BLE)...`}
            {gloveState === "Pairing" && `Pairing with Smart Glove (Haptic Mesh)...`}
            {gloveState === "Connected" && `Biomechanical link fully established. Calibrated and ready.`}
            {gloveState === "Failed" && `Pairing failed. Ensure Bluetooth is enabled and glove is powered.`}
          </Text>
        </View>

        {/* Visual State Indicators */}
        {gloveState !== "Disconnected" && gloveState !== "Failed" && gloveState !== "Connected" && (
          <View className="items-center gap-3 w-full">
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={{ color: colors.primary }} className="font-display text-[14px] font-semibold uppercase tracking-wider">
              {gloveState} STATE ({connectingProgress}%)
            </Text>
          </View>
        )}

        {gloveState === "Connected" && (
          <View style={{ backgroundColor: colors.successSoft }} className="w-full flex-row items-center gap-3 p-4 rounded-2xl border border-emerald-500/20">
            <MaterialIcons name="check-circle" size={24} color={colors.success} />
            <View>
              <Text style={{ color: colors.text }} className="font-display text-[15px] font-bold">
                Connected & Calibrated
              </Text>
              <Text style={{ color: colors.secondaryText }} className="font-body text-[13px]">
                Battery: 82% | Signal: Strong
              </Text>
            </View>
          </View>
        )}

        <View className="w-full gap-3 mt-2">
          {gloveState === "Disconnected" || gloveState === "Failed" ? (
            <PrimaryButton
              colors={colors}
              title="Search & Connect"
              icon="bluetooth"
              onPress={startConnection}
            />
          ) : gloveState === "Connected" ? (
            <PrimaryButton
              colors={colors}
              title="Go to Dashboard"
              icon="dashboard"
              onPress={() => router.replace("/home")}
            />
          ) : (
            <SecondaryButton
              colors={colors}
              title="Cancel Connection"
              onPress={() => setGloveConnectionState("Disconnected")}
            />
          )}

          <Pressable 
            onPress={() => {
              const store = useAppStore.getState();
              store.resetOnboarding();
              router.replace("/onboarding/condition");
            }}
            className="self-center py-2"
          >
            <Text style={{ color: colors.secondaryText }} className="font-body text-[14px] underline">
              Back to Onboarding setup
            </Text>
          </Pressable>
        </View>
      </GlassCard>
    </View>
  );
}
