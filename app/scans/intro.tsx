import React from "react";
import { Image, Pressable, ScrollView, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";

import { useAppTheme } from "../../lib/theme";
import { GlassCard, PrimaryButton } from "../../components/ui";

export default function ScanIntroScreen() {
  const router = useRouter();
  const colors = useAppTheme();

  return (
    <View style={{ backgroundColor: colors.background }} className="flex-1">
      {/* Top Header */}
      <View style={{ borderBottomColor: colors.border }} className="border-b px-6 py-4 flex-row items-center justify-between mt-10">
        <Pressable onPress={() => router.back()} className="p-2 -ml-2 rounded-full active:bg-black/5">
          <MaterialIcons name="arrow-back" size={24} color={colors.primary} />
        </Pressable>
        <Text style={{ color: colors.primary }} className="font-display text-[20px] font-bold">
          Smart Glove Scan
        </Text>
        <Text style={{ color: colors.secondaryText }} className="font-body text-[14px]">
          Step 4 of 4
        </Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 40 }} className="flex-1 px-5 pt-6">
        <View className="mb-6 items-center text-center">
          <Text style={{ color: colors.text }} className="font-display text-[28px] font-semibold text-center tracking-tight leading-9">
            Scan Your Hand & Wrist
          </Text>
          <Text style={{ color: colors.secondaryText }} className="mt-2 font-body text-[15px] text-center leading-5 max-w-sm">
            Precision is at the heart of therapy. By scanning your hand anatomy, our Smart Glove system creates a custom biomechanical profile to ensure medical-grade fit.
          </Text>
        </View>

        {/* Info Bento Section */}
        <View className="gap-4 mb-6">
          <GlassCard colors={colors} className="flex-row items-start gap-4 p-4">
            <View style={{ backgroundColor: colors.primarySoft }} className="w-12 h-12 rounded-2xl flex items-center justify-center">
              <MaterialIcons name="straighten" size={24} color={colors.primary} />
            </View>
            <View className="flex-1">
              <Text style={{ color: colors.text }} className="font-display text-[17px] font-bold">
                Precision Fit
              </Text>
              <Text style={{ color: colors.secondaryText }} className="font-body text-[14px] leading-4 mt-0.5">
                Ensures active sensors align perfectly with your tendons.
              </Text>
            </View>
          </GlassCard>

          <GlassCard colors={colors} className="flex-row items-start gap-4 p-4">
            <View style={{ backgroundColor: colors.primarySoft }} className="w-12 h-12 rounded-2xl flex items-center justify-center">
              <MaterialIcons name="analytics" size={24} color={colors.primary} />
            </View>
            <View className="flex-1">
              <Text style={{ color: colors.text }} className="font-display text-[17px] font-bold">
                Live Metrics
              </Text>
              <Text style={{ color: colors.secondaryText }} className="font-body text-[14px] leading-4 mt-0.5">
                Establishes your unique range of motion baseline.
              </Text>
            </View>
          </GlassCard>

          <GlassCard colors={colors} className="flex-row items-start gap-4 p-4">
            <View style={{ backgroundColor: colors.primarySoft }} className="w-12 h-12 rounded-2xl flex items-center justify-center">
              <MaterialIcons name="security" size={24} color={colors.primary} />
            </View>
            <View className="flex-1">
              <Text style={{ color: colors.text }} className="font-display text-[17px] font-bold">
                Secure Data
              </Text>
              <Text style={{ color: colors.secondaryText }} className="font-body text-[14px] leading-4 mt-0.5">
                Biometric data is encrypted and processed via secure CV channels.
              </Text>
            </View>
          </GlassCard>
        </View>

        {/* Scan Visual Card */}
        <GlassCard colors={colors} className="p-4 items-center justify-center min-h-[220px] overflow-hidden mb-8">
          <View style={{ backgroundColor: colors.elevated }} className="absolute inset-0 opacity-10" />
          <Image
            source={{ uri: "https://lh3.googleusercontent.com/aida-public/AB6AXuCR69v1Slfx_0voTG8RxXBULElXlhpKZ3pJlGnbAeIVJC-yUVjDqBSH2VzNKrMAnffgDyTsE9tP3Nq5--w-6KypPG_awuG4T6j5lRKT-94mapjSjk8sRG70vrrCXKu3aEDgsK56jd79vHGbBiNMpp3Dxb0gkOlYINA0XH3zAntoxt4wFC8Kq_BiQ7gyndbW-oT0AOWPdZYaYSR77qziCWsk6CsN5SbY7Dt_Ocy0S0wTwVoQjlW_18ZgRRVlGGUxzpnVarp7Nbdk-ks" }}
            className="w-full h-[180px] object-contain rounded-xl"
          />
        </GlassCard>

        <PrimaryButton
          colors={colors}
          title="Start Hand Scan"
          icon="camera-alt"
          onPress={() => router.push("/scans/camera")}
        />
        <Text style={{ color: colors.secondaryText }} className="text-center mt-3 font-body text-[13px] uppercase tracking-wider">
          Estimated Time: 45 Seconds
        </Text>
      </ScrollView>
    </View>
  );
}
