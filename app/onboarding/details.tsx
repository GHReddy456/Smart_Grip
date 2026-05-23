import React, { useState } from "react";
import { ScrollView, Text, TextInput, View } from "react-native";
import { useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";

import { useAppTheme } from "../../lib/theme";
import { useAppStore, type PatientDetails } from "../../store/useAppStore";
import { GlassCard, PrimaryButton } from "../../components/ui";

export default function DetailsScreen() {
  const router = useRouter();
  const colors = useAppTheme();
  
  const setPatientDetails = useAppStore((state) => state.setPatientDetails);
  const setOnboardingCompleted = useAppStore((state) => state.setOnboardingCompleted);

  const [form, setForm] = useState<Partial<PatientDetails>>({
    fullName: "",
    age: "",
    height: "",
    weight: "",
    emergencyContactName: "",
    emergencyContactPhone: "",
    voicePreference: "Arthur",
    address: "Pending Selection" // Default so it satisfies the type, we update it later
  });

  const updateForm = (key: keyof PatientDetails, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const isFormValid = 
    form.fullName && 
    form.age && 
    form.height && 
    form.weight && 
    form.emergencyContactName && 
    form.emergencyContactPhone;

  const handleContinue = () => {
    if (isFormValid) {
      setPatientDetails(form as PatientDetails);
      setOnboardingCompleted(true);
      router.replace("/scans/intro");
    }
  };

  return (
    <ScrollView contentContainerStyle={{ paddingBottom: 60 }} className="flex-1 px-5 pt-12">
      <View className="mb-8">
        <Text style={{ color: colors.text }} className="font-display text-[28px] font-bold tracking-tight">
          Patient Biometrics
        </Text>
        <Text style={{ color: colors.secondaryText }} className="font-body text-[15px] mt-1 leading-5">
          Step 3 of 4: These precise details ensure proper smart glove fitment and emergency safety mapping.
        </Text>
      </View>

      {/* Basic Metrics */}
      <GlassCard colors={colors} className="p-5 gap-4 mb-6">
        <View className="flex-row items-center gap-3 border-b border-black/5 dark:border-white/5 pb-3">
          <MaterialIcons name="person-outline" size={22} color={colors.primary} />
          <Text style={{ color: colors.text }} className="font-display text-[18px] font-bold">
            Identity & Sizing
          </Text>
        </View>

        <View className="gap-2">
          <Text style={{ color: colors.secondaryText }} className="font-body text-[13px] font-bold">
            Full Legal Name
          </Text>
          <TextInput
            value={form.fullName}
            onChangeText={(val) => updateForm("fullName", val)}
            placeholder="e.g. Alex Morgan"
            style={{ backgroundColor: colors.elevated, borderColor: colors.border, borderWidth: 1, color: colors.text }}
            className="p-3.5 rounded-xl font-body text-[15px]"
          />
        </View>

        <View className="flex-row gap-3">
          <View className="flex-1 gap-2">
            <Text style={{ color: colors.secondaryText }} className="font-body text-[13px] font-bold">Age</Text>
            <TextInput
              value={form.age}
              onChangeText={(val) => updateForm("age", val)}
              placeholder="Years"
              keyboardType="number-pad"
              style={{ backgroundColor: colors.elevated, borderColor: colors.border, borderWidth: 1, color: colors.text }}
              className="p-3.5 rounded-xl font-body text-[15px]"
            />
          </View>
          <View className="flex-1 gap-2">
            <Text style={{ color: colors.secondaryText }} className="font-body text-[13px] font-bold">Height (cm)</Text>
            <TextInput
              value={form.height}
              onChangeText={(val) => updateForm("height", val)}
              placeholder="e.g. 175"
              keyboardType="number-pad"
              style={{ backgroundColor: colors.elevated, borderColor: colors.border, borderWidth: 1, color: colors.text }}
              className="p-3.5 rounded-xl font-body text-[15px]"
            />
          </View>
          <View className="flex-1 gap-2">
            <Text style={{ color: colors.secondaryText }} className="font-body text-[13px] font-bold">Weight (kg)</Text>
            <TextInput
              value={form.weight}
              onChangeText={(val) => updateForm("weight", val)}
              placeholder="e.g. 70"
              keyboardType="number-pad"
              style={{ backgroundColor: colors.elevated, borderColor: colors.border, borderWidth: 1, color: colors.text }}
              className="p-3.5 rounded-xl font-body text-[15px]"
            />
          </View>
        </View>
      </GlassCard>

      {/* Emergency Contact */}
      <GlassCard colors={colors} className="p-5 gap-4 mb-8">
        <View className="flex-row items-center gap-3 border-b border-black/5 dark:border-white/5 pb-3">
          <MaterialIcons name="health-and-safety" size={22} color={colors.danger} />
          <Text style={{ color: colors.text }} className="font-display text-[18px] font-bold">
            SOS Caregiver Link
          </Text>
        </View>

        <View className="gap-2">
          <Text style={{ color: colors.secondaryText }} className="font-body text-[13px] font-bold">
            Primary Caregiver Name
          </Text>
          <TextInput
            value={form.emergencyContactName}
            onChangeText={(val) => updateForm("emergencyContactName", val)}
            placeholder="e.g. Dr. Sarah Connor"
            style={{ backgroundColor: colors.elevated, borderColor: colors.border, borderWidth: 1, color: colors.text }}
            className="p-3.5 rounded-xl font-body text-[15px]"
          />
        </View>

        <View className="gap-2">
          <Text style={{ color: colors.secondaryText }} className="font-body text-[13px] font-bold">
            Caregiver Phone Number
          </Text>
          <TextInput
            value={form.emergencyContactPhone}
            onChangeText={(val) => updateForm("emergencyContactPhone", val)}
            placeholder="+1 (555) 000-0000"
            keyboardType="phone-pad"
            style={{ backgroundColor: colors.elevated, borderColor: colors.border, borderWidth: 1, color: colors.text }}
            className="p-3.5 rounded-xl font-body text-[15px]"
          />
        </View>
      </GlassCard>

      <PrimaryButton
        colors={colors}
        title="Continue to Hand Scanning"
        icon="camera-alt"
        disabled={!isFormValid}
        onPress={handleContinue}
      />
    </ScrollView>
  );
}
