import { useMemo, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";

import { MedicalInput, PrimaryButton, SecondaryButton, GlassCard } from "../components/ui";
import { useAppTheme } from "../lib/theme";
import { useAppStore } from "../store/useAppStore";

export default function LoginScreen() {
  const router = useRouter();
  const setAuthenticated = useAppStore((state) => state.setAuthenticated);
  const colors = useAppTheme();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  return (
    <View style={{ backgroundColor: colors.background }} className="flex-1 justify-center px-5 py-6">
      <View className="absolute inset-0 opacity-40">
        <View style={{ backgroundColor: colors.primarySoft }} className="absolute left-[-15%] top-0 h-72 w-72 rounded-full blur-3xl" />
        <View style={{ backgroundColor: colors.primarySoft }} className="absolute bottom-[-10%] right-[-10%] h-80 w-80 rounded-full blur-3xl" />
      </View>
      <GlassCard colors={colors} className="mx-auto w-full max-w-md gap-5 p-5">
        <View className="items-center gap-3">
          <View style={{ backgroundColor: colors.primarySoft }} className="h-16 w-16 items-center justify-center rounded-full">
            <MaterialIcons name="lock" size={28} color={colors.primary} />
          </View>
          <View className="items-center gap-2">
            <Text style={{ color: colors.text }} className="font-display text-[32px] font-semibold tracking-tight">
              Welcome back
            </Text>
            <Text style={{ color: colors.secondaryText }} className="text-center font-body text-[16px] leading-6">
              Sign in to continue managing scans, gestures, devices, and emergency tools.
            </Text>
          </View>
        </View>

        <View className="gap-4 pt-1">
          <MedicalInput colors={colors} label="Email address" value={email} onChangeText={setEmail} placeholder="alex@example.com" icon="mail-outline" keyboardType="email-address" />
          <MedicalInput
            colors={colors}
            label="Password"
            value={password}
            onChangeText={setPassword}
            placeholder="Enter your password"
            icon="vpn-key"
            secureTextEntry={!showPassword}
            rightAccessory={
              <Pressable onPress={() => setShowPassword((value) => !value)} hitSlop={10} accessibilityRole="button" accessibilityLabel="Toggle password visibility">
                <MaterialIcons name={showPassword ? "visibility-off" : "visibility"} size={22} color={colors.secondaryText} />
              </Pressable>
            }
          />

          <Pressable onPress={() => router.push("/forgot-password")} className="self-end py-1">
            <Text style={{ color: colors.primary }} className="font-body text-[14px] font-semibold">
              Forgot password?
            </Text>
          </Pressable>

          <PrimaryButton
            colors={colors}
            title="Sign in"
            icon="arrow-forward"
            onPress={() => {
              const isAdmin = email.toLowerCase().includes("admin");
              const store = useAppStore.getState();
              store.setRole(isAdmin ? "admin" : "patient");
              setAuthenticated(true);
              if (isAdmin) {
                router.replace("/admin");
              } else {
                router.replace("/home");
              }
            }}
          />
          <SecondaryButton 
            colors={colors} 
            title="Demo Patient Access" 
            icon="visibility" 
            onPress={() => {
              const store = useAppStore.getState();
              store.setRole("patient");
              setAuthenticated(true);
              router.replace("/home");
            }} 
          />
          <SecondaryButton 
            colors={colors} 
            title="Demo Admin Access" 
            icon="settings" 
            onPress={() => {
              const store = useAppStore.getState();
              store.setRole("admin");
              setAuthenticated(true);
              router.replace("/admin");
            }} 
          />
        </View>

        <View className="flex-row items-center justify-center gap-2 pt-2">
          <Text style={{ color: colors.secondaryText }} className="font-body text-[15px]">
            New to the system?
          </Text>
          <Pressable onPress={() => router.push("/register")}>
            <Text style={{ color: colors.primary }} className="font-body text-[15px] font-semibold">
              Request access
            </Text>
          </Pressable>
        </View>
      </GlassCard>
    </View>
  );
}
