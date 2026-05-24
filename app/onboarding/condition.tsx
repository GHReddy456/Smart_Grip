import React from "react";
import { Image, Pressable, ScrollView, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";

import { useAppTheme } from "../../lib/theme";
import { useAppStore } from "../../store/useAppStore";
import { GlassCard, PrimaryButton } from "../../components/ui";

const conditions = [
  {
    id: "stroke",
    name: "Stroke",
    desc: "Post-stroke recovery and hemiparesis management.",
    icon: "neurology" as any,
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDSVbnjg-tjJd3R5p9g7plF5pPkQDkPNSYV22Y4N9wJ1i3Wxb49O8PBW58mOUf6x4IPPEiehDR6r0PoZO2fNLksp7FzYZH22BlIqhvxL0piNMZdH8d4WBcUUXHVrb3enOPBb1Isa7C29ZKjjvXPvKPMWyEOrPYW9VFnOzwFszCrd_vLAwEgRkl10m9eRZYwaQEi9y8XoCZaZf4hEuQOSAT150aMmlcum6np7KXutS5C0o3YeudUvVp3ndwxfLbXNcKZ_TkmxTpYtlM"
  },
  {
    id: "als",
    name: "ALS",
    desc: "Amyotrophic Lateral Sclerosis support and assistance.",
    icon: "park" as any,
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDkkY0Gz_wedJSapKzZzyjIAV68O2nGhwNUtiMqgsG1fdY1cx3i6hizXQrTsRA27ztQoJfzHBRaxDb8XhDoLbw50X5nOgTDBlPzRERAISNyv6rqUVXDNqpI6ieG7fSW9HcexI48RMJWv2ASt-8PH2Q-TgMugQQ6wSkzSXOoxRRdEm2NDyiWdlhgQwXRGVn7Py7jcw9l68WMxHji8o6v8iUOWVWxeXMaa8keMD1_RgJXRhiUdCMZc0k_gNws0q3U9p-SIoXz4Yt_jJc"
  },
  {
    id: "sci",
    name: "Spinal Cord Injury",
    desc: "Mobility restoration for SCI patients.",
    icon: "accessibility" as any,
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuCnduy0IZM7kTN3EbvUeECtXn00SQnxdiP5_jLheJhrTK1JGSTdAHXoo_w7sghqan5HeNiShnp4p_NYtxufBicHxN349Mf_HaJ4xcvllfKctJPxz1g7ntp4JSErfO9jkuj6-o8jryzYqKye8aAgecd4zFQfgy96kahyUWrqFIx3wWZXPvcQS3hypLzk6z-hMwdxw-oW5Vd0LzjL-_kGss37k2qxo4LfDNRLsPWf_CMT4KW-01uj6aX1MIxYcYOpW_4nfcduXj_XL8I"
  },
  {
    id: "mnd",
    name: "Motor Neuron Disorder",
    desc: "General motor neuron related movement assistance.",
    icon: "timeline" as any,
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDYPJ1sHAqObXIEDFrleuhlI29s4B2hTMQBY-8KFqFLlSVLt4bka7_frBS122M3Ll1UVLiqwYoLtACgiCiI4TtCmxhNrUymocEZ_bJJYbCz9VNL_-MQpSXN0yB89UvhrojLG21OgzHmNVYz3hTahvohBeU0H4X4luAuAt6JRbM3zu1KnbewdPASEFoPvieeMIUSkzDfciYMe1Elce6FgTmOV6IBRrWHOiyk-8Yh8LoB2IElkBRM-wLvBqndD61I9MsGMl6g6eR4R9w"
  },
  {
    id: "paralysis",
    name: "Hand Paralysis",
    desc: "Targeted assistance for localized hand paralysis.",
    icon: "back-hand" as any,
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBjCwgWOInp9p8Xnday91TxK8F6R3DnMJ5aSVeMZZ2ednYp6J0oS-JzKnbSHKiuuVDEWeZzNnqe3yTdePOveFPo_bnykxoF4krStnTrrYcj5A-7kBM_4tHyDZRt5Su5GQIMXqjiaH8vHDSQuMSFgnDy8fdYR5R_5lhdnoo3-q_aLDy6LWYNZVjPP2z4CMYa6-JWUw4NgAFKX5Ij815ozTiZ-dBOJKHXmagimNiHbqH0vhOgOiBBy7--xYyaeoC-kWJvAH01luQI56k"
  },
  {
    id: "other",
    name: "Other",
    desc: "Specify a condition not listed above.",
    icon: "help-outline" as any,
    image: null
  }
];

export default function ConditionScreen() {
  const router = useRouter();
  const colors = useAppTheme();
  const selectedCondition = useAppStore((state) => state.medical_condition);
  const setMedicalCondition = useAppStore((state) => state.setMedicalCondition);

  const handleContinue = () => {
    if (selectedCondition) {
      router.push("/onboarding/hand");
    }
  };

  return (
    <View style={{ backgroundColor: colors.background }} className="flex-1">
      {/* Top Header */}
      <View style={{ borderBottomColor: colors.border }} className="border-b px-6 py-4 flex-row items-center justify-between mt-10">
        <View className="flex-row items-center gap-2">
          <MaterialIcons name="settings-input-component" size={24} color={colors.primary} />
          <Text style={{ color: colors.primary }} className="font-display text-[20px] font-bold">
            Smart Glove
          </Text>
        </View>
        <Text style={{ color: colors.secondaryText }} className="font-body text-[14px]">
          Step 1 of 4
        </Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 40 }} className="flex-1 px-5 pt-6">
        <View className="mb-8 items-center text-center">
          <Text style={{ color: colors.text }} className="font-display text-[32px] font-semibold text-center tracking-tight">
            Select Your Condition
          </Text>
          <Text style={{ color: colors.secondaryText }} className="mt-2 font-body text-[16px] text-center leading-6 max-w-md">
            Customizing your therapy starts here. Choose the condition that best describes your current mobility needs.
          </Text>
        </View>

        <View className="flex-row flex-wrap gap-4">
          {conditions.map((item) => {
            const isSelected = selectedCondition === item.name;
            return (
              <Pressable
                key={item.id}
                onPress={() => setMedicalCondition(item.name)}
                style={{
                  backgroundColor: isSelected ? colors.primarySoft : colors.card,
                  borderColor: isSelected ? colors.primary : colors.border,
                  borderWidth: 2
                }}
                className="w-[47%] flex-grow rounded-3xl p-4 shadow-sm active:scale-95 transition-all flex flex-col justify-between min-h-[190px]"
              >
                <View className="flex-row justify-between items-start mb-3">
                  <View style={{ backgroundColor: isSelected ? "rgba(0,74,198,0.1)" : colors.elevated }} className="w-10 h-10 rounded-xl flex items-center justify-center">
                    <MaterialIcons name={item.icon} size={22} color={colors.primary} />
                  </View>
                  {isSelected && (
                    <View style={{ backgroundColor: colors.primary }} className="w-6 h-6 rounded-full flex items-center justify-center">
                      <MaterialIcons name="check" size={14} color="#FFFFFF" />
                    </View>
                  )}
                </View>

                <View>
                  <Text style={{ color: colors.text }} className="font-display text-[18px] font-semibold">
                    {item.name}
                  </Text>
                  <Text style={{ color: colors.secondaryText }} className="mt-1 font-body text-[13px] leading-4">
                    {item.desc}
                  </Text>
                </View>

                {item.image ? (
                  <View className="mt-3 h-12 w-full rounded-lg overflow-hidden bg-black/5 opacity-80">
                    <Image source={{ uri: item.image }} className="w-full h-full object-cover" />
                  </View>
                ) : (
                  <View style={{ borderColor: colors.border }} className="mt-3 h-12 w-full rounded-lg border border-dashed flex items-center justify-center">
                    <Text style={{ color: colors.secondaryText }} className="font-body text-[12px]">
                      Custom details
                    </Text>
                  </View>
                )}
              </Pressable>
            );
          })}
        </View>

        <View className="mt-8 gap-4">
          <PrimaryButton
            colors={colors}
            title="Continue"
            icon="arrow-forward"
            disabled={!selectedCondition}
            onPress={handleContinue}
          />
        </View>
      </ScrollView>
    </View>
  );
}
