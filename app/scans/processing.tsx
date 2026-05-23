import { useEffect, useMemo, useState } from "react";
import { Text, View } from "react-native";
import { useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";

import { GlassCard, PrimaryButton, ProgressRing, SecondaryButton, SectionTitle, StatusBadge, PageScroll } from "../../components/ui";
import { timeline } from "../../lib/mockData";
import { useAppTheme } from "../../lib/theme";

export default function ProcessingScreen() {
  const router = useRouter();
  const colors = useAppTheme();
  const [progress, setProgress] = useState(70);

  useEffect(() => {
    const interval = setInterval(() => setProgress((value) => Math.min(100, value + 1)), 700);
    return () => clearInterval(interval);
  }, []);

  return (
    <PageScroll>
      <View style={{ backgroundColor: colors.background }} className="min-h-full px-5 pb-8 pt-4">
        <SectionTitle colors={colors} title="Processing" subtitle="A calm waiting screen with realistic status updates and queue details." />

        <GlassCard colors={colors} className="items-center gap-4 py-6">
          <ProgressRing colors={colors} progress={progress} size={180} strokeWidth={12} label="processing" />
          <StatusBadge colors={colors} label="Analyzing hand structure" tone="primary" />
          <Text style={{ color: colors.secondaryText }} className="text-center font-body text-[15px] leading-6">
            The system is measuring motion range, hand shape, and capture consistency.
          </Text>
        </GlassCard>

        <View className="mt-6 gap-4">
          {timeline.map((item) => (
            <GlassCard colors={colors} key={item.id} className="flex-row items-start gap-4">
              <View style={{ backgroundColor: item.state === "active" ? colors.primarySoft : colors.elevated }} className="h-11 w-11 items-center justify-center rounded-2xl">
                <MaterialIcons name={item.state === "done" ? "check" : item.state === "active" ? "hourglass-top" : "schedule"} size={22} color={item.state === "done" ? colors.success : item.state === "active" ? colors.primary : colors.secondaryText} />
              </View>
              <View className="flex-1 gap-1">
                <Text style={{ color: colors.text }} className="font-display text-[18px] font-semibold">{item.title}</Text>
                <Text style={{ color: colors.secondaryText }} className="font-body text-[15px] leading-5">{item.detail}</Text>
              </View>
            </GlassCard>
          ))}
        </View>

        <GlassCard colors={colors} className="mt-6 gap-3">
          <Text style={{ color: colors.text }} className="font-display text-[22px] font-semibold">Estimated completion</Text>
          <Text style={{ color: colors.secondaryText }} className="font-body text-[15px] leading-6">About 40 seconds remaining before the report is ready.</Text>
        </GlassCard>

        <View className="mt-6 gap-3">
          <PrimaryButton colors={colors} title="Return to dashboard" icon="home" onPress={() => router.replace("/home")} />
          <SecondaryButton colors={colors} title="View report queue" icon="list" onPress={() => router.push("/scans/upload")} />
        </View>
      </View>
    </PageScroll>
  );
}
