import React from "react";
import { Image, Pressable, ScrollView, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";

import { useAppTheme } from "../../lib/theme";
import { useAppStore } from "../../store/useAppStore";
import { PrimaryButton, SecondaryButton } from "../../components/ui";

export default function HandSelectionScreen() {
  const router = useRouter();
  const colors = useAppTheme();
  const selectedHand = useAppStore((state) => state.glove_hand);
  const setGloveHand = useAppStore((state) => state.setGloveHand);

  const handleContinue = () => {
    if (selectedHand) {
      router.push("/onboarding/details");
    }
  };

  return (
    <View style={{ backgroundColor: colors.background }} className="flex-1">
      {/* Top Header */}
      <View style={{ borderBottomColor: colors.border }} className="border-b px-6 py-4 flex-row items-center justify-between mt-10">
        <Pressable onPress={() => router.back()} className="p-2 -ml-2 rounded-full active:bg-black/5">
          <MaterialIcons name="arrow-back" size={24} color={colors.primary} />
        </Pressable>
        <Text style={{ color: colors.primary }} className="font-display text-[20px] font-bold">
          Choose Glove Hand
        </Text>
        <Text style={{ color: colors.secondaryText }} className="font-body text-[14px]">
          Step 2 of 4
        </Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 40, justifyContent: "center" }} className="flex-grow px-5 pt-6">
        <View className="mb-10 text-center items-center">
          <Text style={{ color: colors.text }} className="font-display text-[28px] font-semibold text-center leading-9">
            Choose Hand For Smart Glove
          </Text>
          <Text style={{ color: colors.secondaryText }} className="mt-2 font-body text-[16px] text-center leading-6 max-w-sm">
            We will customize the glove specifically for this hand.
          </Text>
        </View>

        {/* Selection Cards */}
        <View className="flex-row gap-4 mb-10">
          {/* Left Hand */}
          <Pressable
            onPress={() => setGloveHand("left")}
            style={{
              backgroundColor: colors.card,
              borderColor: selectedHand === "left" ? colors.primary : colors.border,
              borderWidth: selectedHand === "left" ? 3 : 2,
              shadowColor: selectedHand === "left" ? colors.primary : "transparent",
              shadowOpacity: selectedHand === "left" ? 0.25 : 0,
              shadowRadius: 10,
              shadowOffset: { width: 0, height: 4 },
              elevation: selectedHand === "left" ? 4 : 0
            }}
            className="flex-1 items-center p-5 rounded-[24px] active:scale-98 min-h-[280px] justify-between"
          >
            <View className="relative w-full aspect-square max-w-[140px] items-center justify-center">
              <View style={{ backgroundColor: selectedHand === "left" ? "rgba(0,74,198,0.08)" : colors.elevated }} className="absolute inset-0 rounded-full" />
              <Image
                source={{ uri: "https://lh3.googleusercontent.com/aida-public/AB6AXuC-8erfF2cjZ0s7pNddR6kZtZv8JwMM6auXcWRZXTzXOWbfnHb4Rld_8aPjxAx8HklRcMVkM_uO161MH1BTtaFchwqn21SYRVyMYQ2jqlJuyr_1CC-4MhpPxzZyQWqikHGoA_TktHHQrPi6Wngt7wxgqsjGQaP4z5Ttr3qj1fR26WSKfkRTC7UIDhYNRvHpKQ6hrxvjEdi-9juJzKNY7b89fXZujke8RgGYxIyH3I_VRYKikS5WtATayrCYAXxXtRXT1cbiG9E4HQ8" }}
                className="w-24 h-24 object-contain"
              />
            </View>
            <View className="items-center">
              <Text style={{ color: colors.text }} className="font-display text-[20px] font-bold">
                Left Hand
              </Text>
              <Text style={{ color: colors.secondaryText }} className="text-center font-body text-[13px] mt-1 leading-4">
                Optimized for left-hand dominant sensors
              </Text>
            </View>
            <View
              style={{
                borderColor: selectedHand === "left" ? colors.primary : colors.border,
                backgroundColor: selectedHand === "left" ? colors.primarySoft : "transparent"
              }}
              className="w-10 h-10 rounded-full border-2 items-center justify-center mt-3"
            >
              {selectedHand === "left" && <MaterialIcons name="check" size={20} color={colors.primary} />}
            </View>
          </Pressable>

          {/* Right Hand */}
          <Pressable
            onPress={() => setGloveHand("right")}
            style={{
              backgroundColor: colors.card,
              borderColor: selectedHand === "right" ? colors.primary : colors.border,
              borderWidth: selectedHand === "right" ? 3 : 2,
              shadowColor: selectedHand === "right" ? colors.primary : "transparent",
              shadowOpacity: selectedHand === "right" ? 0.25 : 0,
              shadowRadius: 10,
              shadowOffset: { width: 0, height: 4 },
              elevation: selectedHand === "right" ? 4 : 0
            }}
            className="flex-1 items-center p-5 rounded-[24px] active:scale-98 min-h-[280px] justify-between"
          >
            <View className="relative w-full aspect-square max-w-[140px] items-center justify-center">
              <View style={{ backgroundColor: selectedHand === "right" ? "rgba(0,74,198,0.08)" : colors.elevated }} className="absolute inset-0 rounded-full" />
              <Image
                source={{ uri: "https://lh3.googleusercontent.com/aida-public/AB6AXuAzYMppMnONV70qDhplMCxFsmH5ROkmP2rM4TsPXNDawbbhHAzKEy3tfcrjwzeelfW2_LYDbRo4FzQ1JhMvX9uLLOxjF77ka_rfCGAxuG8kuCjc_JvAlR4_46erw2li933EIORl6zyZZ8On3zWUGjg7Y_zOLoZGyX9ttonH24OUZjJ8CHLMrjQ8sOfvXW2p8l3iXzhsslD1nLNoKfIBMCcUub-rALuFwi9A54htcLSNP4sPTVLCO_gRPZNtVIxTpZRkJ_9UnPY7lSQ" }}
                className="w-24 h-24 object-contain"
              />
            </View>
            <View className="items-center">
              <Text style={{ color: colors.text }} className="font-display text-[20px] font-bold">
                Right Hand
              </Text>
              <Text style={{ color: colors.secondaryText }} className="text-center font-body text-[13px] mt-1 leading-4">
                Optimized for right-hand dominant sensors
              </Text>
            </View>
            <View
              style={{
                borderColor: selectedHand === "right" ? colors.primary : colors.border,
                backgroundColor: selectedHand === "right" ? colors.primarySoft : "transparent"
              }}
              className="w-10 h-10 rounded-full border-2 items-center justify-center mt-3"
            >
              {selectedHand === "right" && <MaterialIcons name="check" size={20} color={colors.primary} />}
            </View>
          </Pressable>
        </View>

        <PrimaryButton
          colors={colors}
          title="Continue Configuration"
          icon="chevron-right"
          disabled={!selectedHand}
          onPress={handleContinue}
        />
      </ScrollView>
    </View>
  );
}
