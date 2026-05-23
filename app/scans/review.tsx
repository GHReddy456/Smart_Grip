import React from "react";
import { Image, Pressable, ScrollView, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";

import { useAppTheme } from "../../lib/theme";
import { useAppStore } from "../../store/useAppStore";
import { GlassCard, PrimaryButton, SecondaryButton } from "../../components/ui";

const scanReviews = [
  {
    id: "wrist",
    title: "Wrist Profile",
    step: "Step 1 of 6",
    img: "https://lh3.googleusercontent.com/aida-public/AB6AXuDHO76qInuYYarwRgd5xMotswjXdpEb5ODynY89TyFAzumcHr4_fV3_ORlVYiBZ0-X2aT6E2_yJ4lMtFVkRBKUpgwcQJKXTvl7zOoVnmMYNfR-e9nklB96qEnX8_7-luvvvCl20-OwdZ5GNqY0CkvRAuKB4SvDA67-T_ICv4jwkY3vYFjuCrnihWhvTHel7YG60pkcAvmT30t7Tif6_Zh9nLCSPS2FmHK-JeBva8liRRvstx83dLVzBfmjLMBvxEQc0isswWcshR1c"
  },
  {
    id: "palm-front",
    title: "Open Palm",
    step: "Step 2 of 6",
    img: "https://lh3.googleusercontent.com/aida-public/AB6AXuCBiHh8411Jg43aKZkZsL3Lxm59aR6F17i1TmkrxZaDxrcdO0L0pAezt94t0dnUdlbz3YI8cBLGsM7qfiuwVnFoi6mx6cx_LqRbL0NznVh0T7sMu3QMiVG-J0YYGcAfL9YTe98mqlBd-ZVR-_fNVyI7nA93aLj2OPPwRnN1DpUhOJZ6IinFx2--2GsD8vleLvKqhb9xjRuimEDCGvkhuSHSS_jc6Iws6pgj0GWbBd4lU0tVmALl_z989cHwXCIooA6WLXx1L9q4dEk"
  },
  {
    id: "palm-side",
    title: "Side Profile",
    step: "Step 3 of 6",
    img: "https://lh3.googleusercontent.com/aida-public/AB6AXuCIJMh8KPRTiglrCdmiQJY2nh60W4pHn7b3DfvZ7YrxDmsh0tRH9Vfomm1NWhhEs98SoGY2efTANlNZAd7o8x-oact4Y-2NR6nrUyiBMdXnt1xJfk6AliaLL2qnRp47nzS87KmTxBTVk_m4_4dhjaflHiOVoJzFLWZiWswbhwRV_-tMTB_OC2n-tJRGvzpkMtZUkfbOWq7WL0zsFnO057SnfIB4KlpFoawYh3_b42lqX6d8BGCSvdNUSxVS_iovar6sqQAARQA53Nw"
  },
  {
    id: "fingers",
    title: "Extended Fingers",
    step: "Step 4 of 6",
    img: "https://lh3.googleusercontent.com/aida-public/AB6AXuDw8KCl5C2YlWlpQXQxB5HI2FU5yMYzqIOaDiKnz9p39SzI0Y-nzoHiF1H1xjBf_8zmc9_sQA-57LMcou9agBkcimCh_pp6jKjbyT7XvKrMQXAYhxUpCdnDAUbsV_h9h8BSX7cJlP0lVadx4pB9v4gyaVSEmJ_Qdya2JwM7MVy36FQ0nsdhuv_Qt9Z9vUckJ1PydSzspRC0IqPYZ3MSmilrxMGKJzbtidp_OZJPviAP9azGBPuVZErlalVEMGyV8HMUe-gib8FH8oE"
  },
  {
    id: "fist",
    title: "Closed Fist",
    step: "Step 5 of 6",
    img: "https://lh3.googleusercontent.com/aida-public/AB6AXuBPMNXsAMm7lzvf1BXe68-YzlOOFnuG5EtVGSdgTbs-xsjIhgn8fGWsTywYiYtcpbPV2uyV3VLKNJGCNPbyRs7ehXr9u2eFvJ7mDhqXNN4J38RlEz4m08fHSthURWMLk9imoGouAYKUog9xTgRv27lYFRgb4QX-cqP2cjXL5Qxmh2--YPV7nPrccXYMqRW3JtV45il_R4OKjsWdOlYiyzaim7mSG-eoBnB_bTkSvD3dKrOKWWZD_9mS-aDYhfgWJQd_MZnf2wLJkF0"
  },
  {
    id: "wrist-rotation",
    title: "Tendon Rotation",
    step: "Step 6 of 6",
    img: "https://lh3.googleusercontent.com/aida-public/AB6AXuDmTOu_B4m0ibL7wk9beorKYI5OhlRUn8uTQfVHybNgDExEza0XU0adc_o1W623GNxgEV-01500lsG6rJwetAGwxipNw4VSRwgRkyWM3WMrD0NitZ8K8mwOZ-GYB1isk897LqEtwTGa0bWKENXv7hie_UQ5psPZip0AwecA_1ld349I_1ktjBHIQVVx_OZUVCeiFp0KOvwaZfnTAw1zkmK0DvdGZO7YN803xBcoNPEwkACPHMJcfnDRnk7eMBKEGf4SdfKtX_Co10I"
  }
];

export default function ReviewCapturesScreen() {
  const router = useRouter();
  const colors = useAppTheme();
  const gloveHand = useAppStore((state) => state.glove_hand) || "right";

  const handleUploadAll = () => {
    router.push("/scans/upload");
  };

  return (
    <View style={{ backgroundColor: colors.background }} className="flex-1">
      {/* Top Header */}
      <View style={{ borderBottomColor: colors.border }} className="border-b px-6 py-4 flex-row items-center justify-between mt-10">
        <Pressable onPress={() => router.back()} className="p-2 -ml-2 rounded-full active:bg-black/5">
          <MaterialIcons name="arrow-back" size={24} color={colors.primary} />
        </Pressable>
        <Text style={{ color: colors.primary }} className="font-display text-[20px] font-bold">
          Review Scan
        </Text>
        <View className="w-10 h-10" />
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 40 }} className="flex-1 px-5 pt-6">
        <View className="mb-6">
          <Text style={{ color: colors.text }} className="font-display text-[28px] font-semibold tracking-tight">
            Review Captures
          </Text>
          <Text style={{ color: colors.secondaryText }} className="mt-2 font-body text-[15px] leading-5 max-w-sm">
            Confirm your {gloveHand} hand scan steps. Ensure all positions are clearly visible for precise calibration of the assistive sensors.
          </Text>
        </View>

        {/* Bento/Grid list of captures */}
        <View className="gap-5">
          {scanReviews.map((item) => (
            <GlassCard key={item.id} colors={colors} className="overflow-hidden p-0 gap-0">
              <View className="relative h-44 w-full bg-black/10">
                <Image source={{ uri: item.img }} className="w-full h-full object-cover" />
                <View style={{ backgroundColor: colors.primary }} className="absolute top-4 right-4 w-9 h-9 rounded-full items-center justify-center border-2 border-white">
                  <MaterialIcons name="check" size={18} color="#FFFFFF" />
                </View>
              </View>
              <View className="flex-row justify-between items-center p-4">
                <View>
                  <Text style={{ color: colors.text }} className="font-display text-[17px] font-bold">
                    {item.title}
                  </Text>
                  <Text style={{ color: colors.secondaryText }} className="font-body text-[13px]">
                    {item.step}
                  </Text>
                </View>
                <Pressable
                  onPress={() => router.push("/scans/camera")}
                  style={{ borderColor: colors.border }}
                  className="px-4 py-2 border rounded-xl active:bg-black/5"
                >
                  <Text style={{ color: colors.text }} className="font-display text-[13px] font-bold">
                    RETAKE
                  </Text>
                </Pressable>
              </View>
            </GlassCard>
          ))}
        </View>

        {/* Action Buttons */}
        <View className="mt-8 gap-3">
          <PrimaryButton
            colors={colors}
            title="Upload Scan Data"
            icon="cloud-upload"
            onPress={handleUploadAll}
          />
          <SecondaryButton
            colors={colors}
            title="Cancel Session"
            onPress={() => router.replace("/home")}
          />
        </View>
      </ScrollView>
    </View>
  );
}
