import { useMemo } from "react";
import { Pressable, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";

import { GlassCard, PrimaryButton, ScanStepCard, SecondaryButton, SectionTitle, StatusBadge, PageScroll } from "../../components/ui";
import { scanSteps } from "../../lib/mockData";
import { useAppTheme } from "../../lib/theme";

export default function ScansScreen() {
  const router = useRouter();
  const colors = useAppTheme();

  return (
    <PageScroll>
      <View style={{ backgroundColor: colors.background }} className="min-h-full px-5 pb-8 pt-4">
        <SectionTitle colors={colors} title="Hand scan" subtitle="Guided capture designed for patients with limited motor control." />

        <GlassCard colors={colors} className="gap-5">
          <View className="flex-row items-start justify-between gap-4">
            <View className="flex-1 gap-2">
              <StatusBadge colors={colors} label="Ready to scan" tone="success" />
              <Text style={{ color: colors.text }} className="font-display text-[27px] font-semibold tracking-tight">
                Start a new hand scan
              </Text>
              <Text style={{ color: colors.secondaryText }} className="font-body text-[16px] leading-6">
                Follow the step-by-step flow for a clean capture, review, upload, and processing.
              </Text>
            </View>
            <View style={{ backgroundColor: colors.primarySoft }} className="h-16 w-16 items-center justify-center rounded-3xl">
              <MaterialIcons name="back-hand" size={34} color={colors.primary} />
            </View>
          </View>
          <View className="flex-row gap-3">
            <PrimaryButton colors={colors} title="Open camera" icon="camera-alt" fullWidth={false} onPress={() => router.push("/scans/camera")} />
            <SecondaryButton colors={colors} title="Review scans" icon="preview" fullWidth={false} onPress={() => router.push("/scans/review")} />
          </View>
        </GlassCard>

        <GlassCard colors={colors} className="mt-4 gap-4">
          <Text style={{ color: colors.text }} className="font-display text-[22px] font-semibold">
            Permissions
          </Text>
          {[
            { label: "Camera access", status: "Granted" },
            { label: "Microphone / voice guidance", status: "Granted" },
            { label: "Haptics", status: "Enabled" }
          ].map((item) => (
            <View key={item.label} className="flex-row items-center justify-between rounded-2xl bg-black/0 px-1 py-1">
              <View>
                <Text style={{ color: colors.text }} className="font-body text-[16px] font-semibold">
                  {item.label}
                </Text>
                <Text style={{ color: colors.secondaryText }} className="font-body text-[13px]">
                  Required for a guided scan flow
                </Text>
              </View>
              <StatusBadge colors={colors} label={item.status} tone="success" />
            </View>
          ))}
        </GlassCard>

        <View className="mt-6 gap-4">
          <Text style={{ color: colors.text }} className="font-display text-[24px] font-semibold">
            Guided steps
          </Text>
          {scanSteps.map((step, index) => (
            <ScanStepCard colors={colors} key={step.id} index={index + 1} title={step.title} description={step.description} active={index === 0} completed={index < 0} />
          ))}
        </View>

        <View className="mt-6 gap-4">
          <Text style={{ color: colors.text }} className="font-display text-[24px] font-semibold">
            Flow shortcuts
          </Text>
          <View className="gap-3">
            <Pressable style={{ backgroundColor: colors.card, borderColor: colors.border }} className="flex-row items-center justify-between rounded-3xl border p-4" onPress={() => router.push("/scans/camera")}>
              <View>
                <Text style={{ color: colors.text }} className="font-display text-[18px] font-semibold">Guided capture</Text>
                <Text style={{ color: colors.secondaryText }} className="font-body text-[14px]">Overlay frame, voice guidance, and scan pulse.</Text>
              </View>
              <MaterialIcons name="arrow-forward" size={24} color={colors.primary} />
            </Pressable>
            <Pressable style={{ backgroundColor: colors.card, borderColor: colors.border }} className="flex-row items-center justify-between rounded-3xl border p-4" onPress={() => router.push("/scans/upload")}>
              <View>
                <Text style={{ color: colors.text }} className="font-display text-[18px] font-semibold">Upload queue</Text>
                <Text style={{ color: colors.secondaryText }} className="font-body text-[14px]">Track queued and failed files before processing.</Text>
              </View>
              <MaterialIcons name="arrow-forward" size={24} color={colors.primary} />
            </Pressable>
          </View>
        </View>
      </View>
    </PageScroll>
  );
}
