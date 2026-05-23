import React, { useState } from "react";
import { ScrollView, Text, TextInput, View } from "react-native";
import { useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";

import { useAppTheme } from "../../lib/theme";
import { useAppStore } from "../../store/useAppStore";
import { GlassCard, PrimaryButton } from "../../components/ui";

export default function DeliveryScreen() {
  const router = useRouter();
  const colors = useAppTheme();
  
  const patientDetails = useAppStore((state) => state.patient_details);
  const setPatientDetails = useAppStore((state) => state.setPatientDetails);
  
  const setScanCompleted = useAppStore((state) => state.setScanCompleted);
  const setFabricationStatus = useAppStore((state) => state.setFabricationStatus);

  const [address, setAddress] = useState("");

  const handlePlaceOrder = () => {
    if (address.trim() && patientDetails) {
      // Update the patient details with the final address
      setPatientDetails({ ...patientDetails, address: address.trim() });
      
      // Officially complete the onboarding pipeline
      setScanCompleted(true);
      setFabricationStatus("Processing");
      
      // Navigate to the operational dashboard
      router.replace("/home");
    }
  };

  return (
    <ScrollView contentContainerStyle={{ paddingBottom: 60 }} className="flex-1 px-5 pt-12">
      <View className="mb-8">
        <Text style={{ color: colors.text }} className="font-display text-[28px] font-bold tracking-tight">
          Delivery Details
        </Text>
        <Text style={{ color: colors.secondaryText }} className="font-body text-[15px] mt-1 leading-5">
          Final Step: Where should we ship your customized Assistive Smart Glove once fabrication is complete?
        </Text>
      </View>

      <GlassCard colors={colors} className="p-5 gap-4 mb-6">
        <View className="flex-row items-center gap-3 border-b border-black/5 dark:border-white/5 pb-3">
          <MaterialIcons name="local-shipping" size={22} color={colors.primary} />
          <Text style={{ color: colors.text }} className="font-display text-[18px] font-bold">
            Shipping Destination
          </Text>
        </View>

        <View className="gap-2">
          <Text style={{ color: colors.secondaryText }} className="font-body text-[13px] font-bold">
            Full Delivery Address
          </Text>
          <TextInput
            value={address}
            onChangeText={setAddress}
            placeholder="e.g. 123 Caregiver Lane, Suite 400, NY"
            multiline
            numberOfLines={3}
            style={{ 
              backgroundColor: colors.elevated, 
              borderColor: colors.border, 
              borderWidth: 1, 
              color: colors.text,
              textAlignVertical: 'top'
            }}
            className="p-3.5 rounded-xl font-body text-[15px] min-h-[80px]"
          />
        </View>
      </GlassCard>

      <GlassCard colors={colors} className="p-5 gap-3 mb-8">
        <Text style={{ color: colors.text }} className="font-display text-[16px] font-bold">
          Order Summary
        </Text>
        <View className="flex-row items-center gap-3 mt-2">
          <MaterialIcons name="check-circle" size={18} color={colors.success} />
          <Text style={{ color: colors.secondaryText }} className="font-body text-[14px]">
            Biometric condition registered
          </Text>
        </View>
        <View className="flex-row items-center gap-3">
          <MaterialIcons name="check-circle" size={18} color={colors.success} />
          <Text style={{ color: colors.secondaryText }} className="font-body text-[14px]">
            Custom sizing mapped & synced
          </Text>
        </View>
        <View className="flex-row items-center gap-3">
          <MaterialIcons name="check-circle" size={18} color={colors.success} />
          <Text style={{ color: colors.secondaryText }} className="font-body text-[14px]">
            3D structural scans encrypted
          </Text>
        </View>
      </GlassCard>

      <PrimaryButton
        colors={colors}
        title="Place Glove Fabrication Order"
        icon="precision-manufacturing"
        disabled={!address.trim()}
        onPress={handlePlaceOrder}
      />
    </ScrollView>
  );
}
