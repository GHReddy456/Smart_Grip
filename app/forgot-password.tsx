import { useMemo, useState } from "react";
import { Text, View } from "react-native";
import { useRouter } from "expo-router";

import { GlassCard, MedicalInput, PrimaryButton, SecondaryButton } from "../components/ui";
import { useAppTheme } from "../lib/theme";

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const colors = useAppTheme();
  const [email, setEmail] = useState("");

  return (
    <View style={{ backgroundColor: colors.background }} className="flex-1 justify-center px-5 py-6">
      <GlassCard colors={colors} className="mx-auto w-full max-w-md gap-5 p-5">
        <View className="gap-2">
          <Text style={{ color: colors.text }} className="font-display text-[30px] font-semibold tracking-tight">
            Reset password
          </Text>
          <Text style={{ color: colors.secondaryText }} className="font-body text-[16px] leading-6">
            Enter your email and we will send a secure reset link.
          </Text>
        </View>

        <View className="gap-4">
          <MedicalInput colors={colors} label="Email address" value={email} onChangeText={setEmail} placeholder="alex@example.com" icon="mail-outline" keyboardType="email-address" />
          <PrimaryButton colors={colors} title="Send reset link" icon="mark-email-unread" onPress={() => router.replace("/login")} />
          <SecondaryButton colors={colors} title="Back to sign in" onPress={() => router.back()} />
        </View>
      </GlassCard>
    </View>
  );
}
