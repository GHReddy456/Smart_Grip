import { useMemo, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { useRouter } from "expo-router";

import { GlassCard, MedicalInput, PrimaryButton, SecondaryButton } from "../components/ui";
import { useAppTheme } from "../lib/theme";

export default function RegisterScreen() {
  const router = useRouter();
  const colors = useAppTheme();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  return (
    <View style={{ backgroundColor: colors.background }} className="flex-1 justify-center px-5 py-6">
      <GlassCard colors={colors} className="mx-auto w-full max-w-md gap-5 p-5">
        <View className="gap-2">
          <Text style={{ color: colors.text }} className="font-display text-[30px] font-semibold tracking-tight">
            Create access request
          </Text>
          <Text style={{ color: colors.secondaryText }} className="font-body text-[16px] leading-6">
            A clinician or family account can be approved for setup and support.
          </Text>
        </View>

        <View className="gap-4">
          <MedicalInput colors={colors} label="Full name" value={name} onChangeText={setName} placeholder="Alex Morgan" icon="person-outline" />
          <MedicalInput colors={colors} label="Email address" value={email} onChangeText={setEmail} placeholder="alex@example.com" icon="mail-outline" keyboardType="email-address" />
          <MedicalInput colors={colors} label="Mobile number" value={phone} onChangeText={setPhone} placeholder="+1 555 123 4567" icon="call" keyboardType="phone-pad" />
          <PrimaryButton colors={colors} title="Submit request" icon="send" onPress={() => router.replace("/login")} />
          <SecondaryButton colors={colors} title="Back to sign in" onPress={() => router.back()} />
        </View>

        <Pressable onPress={() => router.push("/forgot-password")} className="self-center pt-2">
          <Text style={{ color: colors.primary }} className="font-body text-[15px] font-semibold">
            Need password help?
          </Text>
        </Pressable>
      </GlassCard>
    </View>
  );
}
