import React from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";

import { useAppTheme } from "../../lib/theme";
import { useAppStore, type FabricationStatus } from "../../store/useAppStore";
import { GlassCard, ProgressRing, SectionTitle, StatusBadge } from "../../components/ui";

const FABRICATION_STEPS: FabricationStatus[] = [
  "Pending Scan",
  "Processing",
  "Fabricating",
  "Shipped",
  "Delivered"
];

export default function AdminDashboardScreen() {
  const colors = useAppTheme();

  // Read state from Zustand store
  const patientDetails = useAppStore((state) => state.patient_details);
  const condition = useAppStore((state) => state.medical_condition);
  const hand = useAppStore((state) => state.glove_hand);
  const scanCompleted = useAppStore((state) => state.scan_completed);
  const fabricationStatus = useAppStore((state) => state.fabrication_status);
  const sosEvents = useAppStore((state) => state.sos_events);

  // Setters
  const setFabricationStatus = useAppStore((state) => state.setFabricationStatus);

  return (
    <ScrollView contentContainerStyle={{ paddingBottom: 40 }} className="flex-1 px-5 pt-12">
      <SectionTitle 
        colors={colors} 
        title="Admin Control Center" 
        subtitle="Operational monitoring, clinical data validation, and fabrication queue overrides." 
      />

      <GlassCard colors={colors} className="mt-6 mb-2 gap-3">
        <Text style={{ color: colors.secondaryText }} className="font-body text-[13px] uppercase tracking-wide font-bold">
          Quick Navigation
        </Text>
        <View className="flex-row flex-wrap gap-2">
          {(["Patient Pipeline", "Queue Overrides", "Telemetry", "Alert Log"]).map((item, index) => (
            <StatusBadge key={item} colors={colors} label={item} tone={index === 1 ? "primary" : "neutral"} />
          ))}
        </View>
      </GlassCard>

      {/* Patient Profile Snapshot */}
      <GlassCard colors={colors} className="mt-4 gap-4 border border-primary/20">
        <View className="flex-row items-center justify-between">
          <Text style={{ color: colors.text }} className="font-display text-[18px] font-bold">
            Active Patient Pipeline
          </Text>
          <StatusBadge colors={colors} label="Online" tone="success" />
        </View>

        <View className="flex-row items-center gap-4">
          <View style={{ backgroundColor: colors.primarySoft }} className="h-12 w-12 items-center justify-center rounded-full">
            <MaterialIcons name="person" size={24} color={colors.primary} />
          </View>
          <View>
            <Text style={{ color: colors.text }} className="font-display text-[18px] font-bold">
              {patientDetails?.fullName || "Awaiting Onboarding"}
            </Text>
            <Text style={{ color: colors.secondaryText }} className="font-body text-[14px]">
              {condition ? `${condition} • ${hand} hand` : "Condition & Hand not set"}
            </Text>
          </View>
        </View>

        <View className="flex-row gap-2 mt-1">
          <StatusBadge colors={colors} label={scanCompleted ? "Scan Uploaded" : "Scan Missing"} tone={scanCompleted ? "success" : "danger"} />
          <StatusBadge colors={colors} label={`Status: ${fabricationStatus}`} tone="primary" />
        </View>
      </GlassCard>

      {/* Glove Fabrication Queue Override */}
      <GlassCard colors={colors} className="mt-6 gap-3">
        <Text style={{ color: colors.text }} className="font-display text-[18px] font-bold">
          Fabrication Queue Override
        </Text>
        <Text style={{ color: colors.secondaryText }} className="font-body text-[14px] leading-5">
          Manually advance the patient's smart glove through the manufacturing and delivery pipeline to simulate lifecycle progression.
        </Text>
        
        <View className="gap-2 mt-2">
          {FABRICATION_STEPS.map((statusStep) => {
            const isActive = fabricationStatus === statusStep;
            
            // Connected state is handled separately since it's patient-triggered
            return (
              <Pressable
                key={statusStep}
                onPress={() => setFabricationStatus(statusStep)}
                style={{
                  backgroundColor: isActive ? colors.primarySoft : colors.elevated,
                  borderColor: isActive ? colors.primary : colors.border,
                  borderWidth: 1.5
                }}
                className="flex-row items-center justify-between p-4 rounded-xl active:scale-98"
              >
                <View className="flex-row items-center gap-3">
                  <MaterialIcons 
                    name={
                      statusStep === "Pending Scan" ? "pending-actions" :
                      statusStep === "Processing" ? "precision-manufacturing" :
                      statusStep === "Fabricating" ? "build-circle" :
                      statusStep === "Shipped" ? "local-shipping" : "mark-email-read"
                    } 
                    size={22} 
                    color={isActive ? colors.primary : colors.secondaryText} 
                  />
                  <Text style={{ color: isActive ? colors.primary : colors.text }} className="font-display text-[16px] font-bold">
                    Mark as "{statusStep}"
                  </Text>
                </View>
                {isActive && <MaterialIcons name="check-circle" size={20} color={colors.primary} />}
              </Pressable>
            );
          })}
        </View>
      </GlassCard>

      {/* Telemetry Stats */}
      <View className="flex-row flex-wrap gap-3 mt-6">
        <GlassCard colors={colors} className="min-w-[46%] flex-1 gap-2 border-l-4" style={{ borderLeftColor: colors.danger }}>
          <Text style={{ color: colors.secondaryText }} className="font-body text-[13px] uppercase tracking-wide font-bold">
            SOS Triggers
          </Text>
          <Text style={{ color: colors.text }} className="font-display text-[28px] font-semibold">
            {sosEvents.length}
          </Text>
          <StatusBadge colors={colors} label="Live updates" tone="danger" />
        </GlassCard>

        <GlassCard colors={colors} className="min-w-[46%] flex-1 gap-2 border-l-4" style={{ borderLeftColor: colors.primary }}>
          <Text style={{ color: colors.secondaryText }} className="font-body text-[13px] uppercase tracking-wide font-bold">
            Scan Sync
          </Text>
          <Text style={{ color: colors.text }} className="font-display text-[28px] font-semibold">
            {scanCompleted ? "100%" : "0%"}
          </Text>
          <StatusBadge colors={colors} label="Point Cloud" tone="primary" />
        </GlassCard>
      </View>

      {/* System Health Overview */}
      <GlassCard colors={colors} className="mt-6 gap-4">
        <View className="flex-row items-center justify-between">
          <View className="flex-1 pr-4">
            <Text style={{ color: colors.text }} className="font-display text-[20px] font-semibold">
              System Uptime
            </Text>
            <Text style={{ color: colors.secondaryText }} className="font-body text-[14px] leading-5 mt-1">
              Backend routing systems and real-time database syncing are operating normally.
            </Text>
          </View>
          <ProgressRing colors={colors} progress={99} size={90} strokeWidth={8} label="uptime" />
        </View>
      </GlassCard>
    </ScrollView>
  );
}
