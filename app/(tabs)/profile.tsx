import React from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";

import { useAppTheme } from "../../lib/theme";
import { useAppStore } from "../../store/useAppStore";
import { AccessibilityToggle, GlassCard, PrimaryButton, StatusBadge } from "../../components/ui";

export default function ProfileScreen() {
  const router = useRouter();
  const colors = useAppTheme();

  // Load state and actions
  const patientDetails = useAppStore((state) => state.patient_details);
  const medicalCondition = useAppStore((state) => state.medical_condition);
  const gloveHand = useAppStore((state) => state.glove_hand);
  const fabricationStatus = useAppStore((state) => state.fabrication_status);
  const gloveConnected = useAppStore((state) => state.glove_connected);
  
  const role = useAppStore((state) => state.role);
  const setRole = useAppStore((state) => state.setRole);

  const voiceInstructions = useAppStore((state) => state.voiceInstructions);
  const reducedMotion = useAppStore((state) => state.reducedMotion);
  const highContrast = useAppStore((state) => state.highContrast);
  const hapticsEnabled = useAppStore((state) => state.hapticsEnabled);

  const toggleVoiceInstructions = useAppStore((state) => state.toggleVoiceInstructions);
  const toggleReducedMotion = useAppStore((state) => state.toggleReducedMotion);
  const toggleHighContrast = useAppStore((state) => state.toggleHighContrast);
  const toggleHaptics = useAppStore((state) => state.toggleHaptics);

  const setScanCompleted = useAppStore((state) => state.setScanCompleted);
  const setGloveConnected = useAppStore((state) => state.setGloveConnected);
  const setAuthenticated = useAppStore((state) => state.setAuthenticated);
  const resetOnboarding = useAppStore((state) => state.resetOnboarding);

  const handleRescanHand = () => {
    // Reset scan state and route back to scan intro
    setScanCompleted(false);
    router.replace("/scans/intro");
  };

  const handleRecalibrateGlove = () => {
    // Reset pairing and route to connect screen
    setGloveConnected(false);
    router.replace("/glove/connect");
  };

  const handleLogout = () => {
    setAuthenticated(false);
    resetOnboarding();
    router.replace("/login");
  };

  const handleSwitchRole = () => {
    const newRole = role === "patient" ? "admin" : "patient";
    setRole(newRole);
    if (newRole === "admin") {
      router.replace("/admin");
    } else {
      router.replace("/home");
    }
  };

  const handLabel = gloveHand === "left" ? "Left Hand" : gloveHand === "right" ? "Right Hand" : "Not Selected";

  return (
    <ScrollView contentContainerStyle={{ paddingBottom: 40 }} className="flex-1 px-5 pt-12">
      {/* HEADER */}
      <View className="mb-6">
        <Text style={{ color: colors.text }} className="font-display text-[28px] font-bold tracking-tight">
          Clinical Profile
        </Text>
        <Text style={{ color: colors.secondaryText }} className="font-body text-[15px]">
          Patient credentials, device parameters, and accessibility settings.
        </Text>
      </View>

      {/* Patient Card */}
      <GlassCard colors={colors} className="p-5 gap-4">
        <View className="flex-row items-center gap-4">
          <View style={{ backgroundColor: colors.primarySoft }} className="h-16 w-16 items-center justify-center rounded-full">
            <MaterialIcons name="person" size={32} color={colors.primary} />
          </View>
          <View className="flex-1 gap-1">
            <Text style={{ color: colors.text }} className="font-display text-[20px] font-bold">
              {patientDetails?.fullName || "Alex Morgan"}
            </Text>
            <Text style={{ color: colors.secondaryText }} className="font-body text-[14px]">
              Condition: {medicalCondition || "Not Selected"}
            </Text>
          </View>
        </View>

        <View className="flex-row flex-wrap gap-2 pt-1">
          <StatusBadge colors={colors} label={handLabel} tone="primary" />
          <StatusBadge colors={colors} label={gloveConnected ? "Connected" : fabricationStatus} tone={gloveConnected ? "success" : "neutral"} />
          <StatusBadge colors={colors} label={`Role: ${role.toUpperCase()}`} tone="warning" />
        </View>
      </GlassCard>

      {/* Biometric parameters summary */}
      {patientDetails && (
        <GlassCard colors={colors} className="mt-6 p-4 gap-3">
          <Text style={{ color: colors.text }} className="font-display text-[16px] font-bold">
            Physical Metrics Sizing
          </Text>
          <View className="flex-row justify-between border-b border-black/5 dark:border-white/5 pb-2">
            <Text style={{ color: colors.secondaryText }} className="font-body text-[14px]">Age</Text>
            <Text style={{ color: colors.text }} className="font-display text-[14px] font-bold">{patientDetails.age} years</Text>
          </View>
          <View className="flex-row justify-between border-b border-black/5 dark:border-white/5 pb-2">
            <Text style={{ color: colors.secondaryText }} className="font-body text-[14px]">Height / Weight</Text>
            <Text style={{ color: colors.text }} className="font-display text-[14px] font-bold">{patientDetails.height} cm / {patientDetails.weight} kg</Text>
          </View>
          <View className="flex-row justify-between border-b border-black/5 dark:border-white/5 pb-2">
            <Text style={{ color: colors.secondaryText }} className="font-body text-[14px]">Delivery Destination</Text>
            <Text style={{ color: colors.text }} className="font-display text-[14px] font-bold text-right flex-1 ml-4" numberOfLines={1}>{patientDetails.address}</Text>
          </View>
          <View className="flex-row justify-between">
            <Text style={{ color: colors.secondaryText }} className="font-body text-[14px]">Caregiver Contact</Text>
            <Text style={{ color: colors.text }} className="font-display text-[14px] font-bold">{patientDetails.emergencyContactName}</Text>
          </View>
        </GlassCard>
      )}

      {/* Accessibility Toggles */}
      <View className="mt-6 gap-3">
        <Text style={{ color: colors.text }} className="font-display text-[18px] font-bold">
          Accessibility Settings
        </Text>
        <AccessibilityToggle
          colors={colors}
          label="Voice Guidance"
          description="Speak biomechanical scan directions aloud."
          value={voiceInstructions}
          onValueChange={toggleVoiceInstructions}
        />
        <AccessibilityToggle
          colors={colors}
          label="Reduced Motion"
          description="Minimises rapid transitions and animation scopes."
          value={reducedMotion}
          onValueChange={toggleReducedMotion}
        />
        <AccessibilityToggle
          colors={colors}
          label="High Contrast"
          description="Increases outline boundaries and text thickness."
          value={highContrast}
          onValueChange={toggleHighContrast}
        />
        <AccessibilityToggle
          colors={colors}
          label="Haptics Feedback"
          description="Vibrates upon successful device handshake actions."
          value={hapticsEnabled}
          onValueChange={toggleHaptics}
        />
      </View>

      {/* Action Shortcuts */}
      <GlassCard colors={colors} className="mt-6 gap-4">
        <Text style={{ color: colors.text }} className="font-display text-[18px] font-bold">
          Clinical Actions
        </Text>

        <Pressable 
          onPress={handleSwitchRole}
          style={{ backgroundColor: colors.elevated }} 
          className="flex-row items-center justify-between rounded-2xl px-4 py-3.5 active:scale-98"
        >
          <Text style={{ color: colors.text }} className="font-body text-[15px] font-semibold">
            {role === "patient" ? "Switch to Admin Dashboard" : "Switch to Patient Interface"}
          </Text>
          <MaterialIcons name="swap-horiz" size={24} color={colors.primary} />
        </Pressable>

        {role === "patient" && (
          <>
            <Pressable 
              onPress={handleRecalibrateGlove}
              style={{ backgroundColor: colors.elevated }} 
              className="flex-row items-center justify-between rounded-2xl px-4 py-3.5 active:scale-98"
            >
              <Text style={{ color: colors.text }} className="font-body text-[15px] font-semibold">
                Recalibrate Glove (Bluetooth)
              </Text>
              <MaterialIcons name="settings-backup-restore" size={24} color={colors.secondaryText} />
            </Pressable>

            <Pressable 
              onPress={handleRescanHand}
              style={{ backgroundColor: colors.elevated }} 
              className="flex-row items-center justify-between rounded-2xl px-4 py-3.5 active:scale-98"
            >
              <Text style={{ color: colors.text }} className="font-body text-[15px] font-semibold">
                Re-scan Biometrics
              </Text>
              <MaterialIcons name="camera-alt" size={24} color={colors.secondaryText} />
            </Pressable>
          </>
        )}

        <PrimaryButton 
          colors={colors} 
          title="Sign Out" 
          icon="exit-to-app" 
          className="bg-zinc-800"
          onPress={handleLogout} 
        />
      </GlassCard>
    </ScrollView>
  );
}
