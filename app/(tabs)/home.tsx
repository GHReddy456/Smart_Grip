import React, { useMemo } from "react";
import { Image, Pressable, ScrollView, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";

import { useAppTheme } from "../../lib/theme";
import { useAppStore, type FabricationStatus } from "../../store/useAppStore";
import { GlassCard, PrimaryButton, ProgressRing, SectionTitle, StatusBadge } from "../../components/ui";

const fabricationTimelineSteps = [
  { id: "1", status: "Processing", title: "Scan Processing", detail: "3D point cloud and tendon vectors generated.", completed: true },
  { id: "2", status: "Fabricating", title: "Smart Glove Fabrication", detail: "Printing flexible biomechanical base and routing haptic actuator pads.", completed: false },
  { id: "3", status: "Shipped", title: "Delivery & Transit", detail: "Glove has been packed and handed over to carrier.", completed: false },
  { id: "4", status: "Delivered", title: "Delivery Complete", detail: "Package arrived at patient address.", completed: false }
];

export default function HomeScreen() {
  const router = useRouter();
  const colors = useAppTheme();

  const authenticated = useAppStore((state) => state.authenticated);
  const scanCompleted = useAppStore((state) => state.scan_completed);
  const gloveDelivered = useAppStore((state) => state.glove_delivered);
  const gloveConnected = useAppStore((state) => state.glove_connected);
  const fabricationStatus = useAppStore((state) => state.fabrication_status);
  const gloveHand = useAppStore((state) => state.glove_hand);
  const medicalCondition = useAppStore((state) => state.medical_condition);
  const patientDetails = useAppStore((state) => state.patient_details);

  const devices = useAppStore((state) => state.devices);
  const toggleDevicePower = useAppStore((state) => state.toggleDevicePower);
  const setDeviceIntensity = useAppStore((state) => state.setDeviceIntensity);
  const gestures = useAppStore((state) => state.gestures);
  const sosEvents = useAppStore((state) => state.sos_events);

  // 1. STATE: Before Scan Complete
  if (!scanCompleted) {
    return (
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }} className="flex-1 px-5 pt-12">
        <SectionTitle colors={colors} title="System Onboarding" subtitle="Complete the final setup steps to request your medical device." />
        <GlassCard colors={colors} className="mt-6 items-center p-6 gap-5">
          <View style={{ backgroundColor: colors.primarySoft }} className="w-16 h-16 rounded-full items-center justify-center">
            <MaterialIcons name="camera-alt" size={30} color={colors.primary} />
          </View>
          <View className="items-center">
            <Text style={{ color: colors.text }} className="font-display text-[20px] font-bold text-center">
              Complete Your Hand Scan
            </Text>
            <Text style={{ color: colors.secondaryText }} className="mt-2 text-center font-body text-[15px] leading-5">
              We require a high-precision 3D scan of your hand and wrist to size and print your customized assistive smart glove.
            </Text>
          </View>
          <PrimaryButton
            colors={colors}
            title="Start Hand Scan"
            icon="arrow-forward"
            onPress={() => router.push("/scans/intro")}
          />
        </GlassCard>
      </ScrollView>
    );
  }

  // 2. STATE: Scan completed but glove not delivered yet (Fabrication Tracking Screen)
  if (scanCompleted && !gloveDelivered) {
    // Determine active index in timeline based on fabrication_status
    let activeTimelineIdx = 0;
    if (fabricationStatus === "Processing") activeTimelineIdx = 0;
    if (fabricationStatus === "Fabricating") activeTimelineIdx = 1;
    if (fabricationStatus === "Shipped") activeTimelineIdx = 2;
    if (fabricationStatus === "Delivered" || fabricationStatus === "Connected") activeTimelineIdx = 3;

    const progressPercent = Math.round(((activeTimelineIdx + 1) / 4) * 100);

    return (
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }} className="flex-1 px-5 pt-12">
        <SectionTitle 
          colors={colors} 
          title="Fabrication Tracking" 
          subtitle="Your custom glove is being engineered using your hand scan measurements." 
        />

        {/* Progress Ring Card */}
        <GlassCard colors={colors} className="mt-6 flex-row items-center gap-6 p-5">
          <ProgressRing 
            colors={colors} 
            progress={progressPercent} 
            size={90} 
            strokeWidth={10} 
            label="fabrication progress" 
          />
          <View className="flex-1 gap-1">
            <Text style={{ color: colors.text }} className="font-display text-[22px] font-bold">
              {fabricationStatus}
            </Text>
            <Text style={{ color: colors.secondaryText }} className="font-body text-[14px]">
              Tendon sizing mesh completed. Dynamic haptic pads configuration in progress.
            </Text>
          </View>
        </GlassCard>

        {/* Timeline Cards */}
        <View className="mt-6 gap-4">
          <Text style={{ color: colors.text }} className="font-display text-[18px] font-bold">
            Glove Queue Status
          </Text>
          
          {fabricationTimelineSteps.map((step, idx) => {
            const isCompleted = idx < activeTimelineIdx;
            const isActive = idx === activeTimelineIdx;
            const isPending = idx > activeTimelineIdx;

            return (
              <GlassCard 
                key={step.id} 
                colors={colors} 
                style={{
                  borderColor: isActive ? colors.primary : colors.border,
                  borderWidth: isActive ? 2 : 1
                }}
                className="flex-row items-start gap-4 p-4"
              >
                <View 
                  style={{ 
                    backgroundColor: isCompleted 
                      ? colors.successSoft 
                      : isActive 
                        ? colors.primarySoft 
                        : colors.elevated 
                  }} 
                  className="w-10 h-10 rounded-xl items-center justify-center"
                >
                  <MaterialIcons 
                    name={isCompleted ? "check-circle" : isActive ? "radio-button-checked" : "schedule"} 
                    size={22} 
                    color={isCompleted ? colors.success : isActive ? colors.primary : colors.secondaryText} 
                  />
                </View>
                <View className="flex-grow flex-1 gap-0.5">
                  <Text style={{ color: colors.text }} className="font-display text-[16px] font-bold">
                    {step.title}
                  </Text>
                  <Text style={{ color: colors.secondaryText }} className="font-body text-[14px] leading-4">
                    {step.detail}
                  </Text>
                </View>
                {isActive && (
                  <StatusBadge colors={colors} label="Active" tone="primary" />
                )}
              </GlassCard>
            );
          })}
        </View>

        {/* Demo Helper to bypass Fabrication queue via Admin switch */}
        <GlassCard colors={colors} className="mt-6 p-4 border border-dashed border-sky-400/30 gap-3">
          <Text style={{ color: colors.text }} className="font-display text-[15px] font-semibold text-center">
            🧪 Demo Mode Instruction
          </Text>
          <Text style={{ color: colors.secondaryText }} className="font-body text-[13px] text-center">
            Go to the **Profile tab** and switch to **Admin Dashboard** to change the fabrication status or mark it as Delivered!
          </Text>
        </GlassCard>
      </ScrollView>
    );
  }

  // 3. STATE: Glove Delivered but not Connected (Pairing Prompt)
  if (gloveDelivered && !gloveConnected) {
    return (
      <View style={{ backgroundColor: colors.background }} className="flex-1 justify-center px-5">
        <GlassCard colors={colors} className="p-6 gap-5 items-center">
          <View style={{ backgroundColor: colors.primarySoft }} className="w-16 h-16 rounded-full items-center justify-center">
            <MaterialIcons name="bluetooth-searching" size={30} color={colors.primary} />
          </View>
          <View className="items-center">
            <Text style={{ color: colors.text }} className="font-display text-[22px] font-bold">
              Pair Smart Glove
            </Text>
            <Text style={{ color: colors.secondaryText }} className="mt-2 text-center font-body text-[15px] leading-5">
              Your custom glove has been delivered! Pair it via Bluetooth to calibrate sensors and configure custom gestures.
            </Text>
          </View>
          <PrimaryButton
            colors={colors}
            title="Connect Smart Glove"
            icon="bluetooth"
            onPress={() => router.push("/glove/connect")}
          />
        </GlassCard>
      </View>
    );
  }

  // 4. STATE: Full Glove Connected Dashboard
  const handIcon = gloveHand === "left" ? "Left Hand" : "Right Hand";
  const gloveHandImage = gloveHand === "left" 
    ? "https://lh3.googleusercontent.com/aida-public/AB6AXuC-8erfF2cjZ0s7pNddR6kZtZv8JwMM6auXcWRZXTzXOWbfnHb4Rld_8aPjxAx8HklRcMVkM_uO161MH1BTtaFchwqn21SYRVyMYQ2jqlJuyr_1CC-4MhpPxzZyQWqikHGoA_TktHHQrPi6Wngt7wxgqsjGQaP4z5Ttr3qj1fR26WSKfkRTC7UIDhYNRvHpKQ6hrxvjEdi-9juJzKNY7b89fXZujke8RgGYxIyH3I_VRYKikS5WtATayrCYAXxXtRXT1cbiG9E4HQ8"
    : "https://lh3.googleusercontent.com/aida-public/AB6AXuAzYMppMnONV70qDhplMCxFsmH5ROkmP2rM4TsPXNDawbbhHAzKEy3tfcrjwzeelfW2_LYDbRo4FzQ1JhMvX9uLLOxjF77ka_rfCGAxuG8kuCjc_JvAlR4_46erw2li933EIORl6zyZZ8On3zWUGjg7Y_zOLoZGyX9ttonH24OUZjJ8CHLMrjQ8sOfvXW2p8l3iXzhsslD1nLNoKfIBMCcUub-rALuFwi9A54htcLSNP4sPTVLCO_gRPZNtVIxTpZRkJ_9UnPY7lSQ";

  return (
    <ScrollView contentContainerStyle={{ paddingBottom: 40 }} className="flex-1 px-5 pt-12">
      <SectionTitle 
        colors={colors} 
        title={`Hello, ${patientDetails?.fullName.split(" ")[0] || "Patient"}`} 
        subtitle="Your smart glove is calibrated, connected, and operating normally." 
      />

      {/* Biomechanical Summary Card */}
      <GlassCard colors={colors} className="mt-4 gap-4">
        <View className="flex-row items-center justify-between gap-4">
          <View className="flex-1 gap-1.5">
            <Text style={{ color: colors.text }} className="font-display text-[20px] font-bold">
              {medicalCondition || "Post-stroke mobility"}
            </Text>
            <Text style={{ color: colors.secondaryText }} className="font-body text-[15px]">
              Glove: {handLabel(gloveHand)}
            </Text>
            <StatusBadge colors={colors} label="Glove Calibrated" tone="success" />
          </View>
          <View className="w-20 h-20 items-center justify-center rounded-2xl bg-black/5 p-1">
            <Image source={{ uri: gloveHandImage }} className="w-full h-full object-contain" />
          </View>
        </View>

        <View className="flex-row gap-2 mt-2">
          <View style={{ backgroundColor: colors.elevated }} className="flex-1 rounded-2xl p-3">
            <Text style={{ color: colors.secondaryText }} className="font-body text-[12px] uppercase">
              Battery
            </Text>
            <Text style={{ color: colors.text }} className="font-display text-[18px] font-bold mt-0.5">
              82%
            </Text>
          </View>
          <View style={{ backgroundColor: colors.elevated }} className="flex-1 rounded-2xl p-3">
            <Text style={{ color: colors.secondaryText }} className="font-body text-[12px] uppercase">
              Signal
            </Text>
            <Text style={{ color: colors.text }} className="font-display text-[18px] font-bold mt-0.5">
              Strong
            </Text>
          </View>
          <View style={{ backgroundColor: colors.elevated }} className="flex-1 rounded-2xl p-3">
            <Text style={{ color: colors.secondaryText }} className="font-body text-[12px] uppercase">
              Gestures
            </Text>
            <Text style={{ color: colors.text }} className="font-display text-[18px] font-bold mt-0.5">
              {gestures.length} Configured
            </Text>
          </View>
        </View>
      </GlassCard>

      {/* Quick Action Navigation Grid */}
      <View className="mt-6 gap-3">
        <Text style={{ color: colors.text }} className="font-display text-[18px] font-bold">
          Quick Tools
        </Text>
        <View className="flex-row gap-3">
          <Pressable
            onPress={() => router.push("/gestures")}
            style={{ backgroundColor: colors.card, borderColor: colors.border }}
            className="flex-1 p-4 rounded-3xl border gap-4"
          >
            <View style={{ backgroundColor: colors.primarySoft }} className="w-12 h-12 rounded-2xl items-center justify-center">
              <MaterialIcons name="gesture" size={24} color={colors.primary} />
            </View>
            <Text style={{ color: colors.text }} className="font-display text-[16px] font-bold">
              Gestures
            </Text>
          </Pressable>

          <Pressable
            onPress={() => router.push("/devices")}
            style={{ backgroundColor: colors.card, borderColor: colors.border }}
            className="flex-1 p-4 rounded-3xl border gap-4"
          >
            <View style={{ backgroundColor: colors.primarySoft }} className="w-12 h-12 rounded-2xl items-center justify-center">
              <MaterialIcons name="precision-manufacturing" size={24} color={colors.primary} />
            </View>
            <Text style={{ color: colors.text }} className="font-display text-[16px] font-bold">
              Devices
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Connected Smart Devices Section */}
      <View className="mt-6 gap-3">
        <Text style={{ color: colors.text }} className="font-display text-[18px] font-bold">
          Quick Device Actions
        </Text>
        {devices.map((dev) => (
          <GlassCard key={dev.id} colors={colors} className="flex-row items-center justify-between p-4">
            <View className="flex-row items-center gap-3">
              <View style={{ backgroundColor: dev.active ? colors.primarySoft : colors.elevated }} className="w-11 h-11 rounded-xl items-center justify-center">
                <MaterialIcons 
                  name={dev.type === "Smart light" ? "lightbulb-outline" : dev.type === "Smart fan" ? "toys" : "speaker"} 
                  size={22} 
                  color={dev.active ? colors.primary : colors.secondaryText} 
                />
              </View>
              <View>
                <Text style={{ color: colors.text }} className="font-display text-[16px] font-bold">
                  {dev.name}
                </Text>
                <Text style={{ color: colors.secondaryText }} className="font-body text-[13px]">
                  {dev.type}
                </Text>
              </View>
            </View>
            <Pressable
              onPress={() => toggleDevicePower(dev.id)}
              style={{ backgroundColor: dev.active ? colors.primary : colors.elevated }}
              className="px-4 py-2 rounded-xl"
            >
              <Text style={{ color: dev.active ? "#FFFFFF" : colors.text }} className="font-display text-[13px] font-bold">
                {dev.active ? "ON" : "OFF"}
              </Text>
            </Pressable>
          </GlassCard>
        ))}
      </View>

      {/* Dynamic Recalibration and Therapy trigger */}
      <GlassCard colors={colors} className="mt-6 p-5 gap-4">
        <View>
          <Text style={{ color: colors.text }} className="font-display text-[18px] font-bold">
            Recalibration & Therapy
          </Text>
          <Text style={{ color: colors.secondaryText }} className="font-body text-[14px] leading-5 mt-1">
            Recalibrate sensors to improve gesture confidence limits.
          </Text>
        </View>
        <View className="flex-row gap-3">
          <PrimaryButton
            colors={colors}
            title="Recalibrate"
            icon="settings-backup-restore"
            fullWidth={false}
            onPress={() => router.push("/glove/connect")}
          />
        </View>
      </GlassCard>
    </ScrollView>
  );
}

function handLabel(hand: string) {
  if (hand === "left") return "Left Hand";
  if (hand === "right") return "Right Hand";
  return "Not Selected";
}
