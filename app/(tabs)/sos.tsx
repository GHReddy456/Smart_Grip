import React, { useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";

import { useAppTheme } from "../../lib/theme";
import { useAppStore, type SosEvent } from "../../store/useAppStore";
import { ConfirmModal, GlassCard, SOSButton, SectionTitle, StatusBadge } from "../../components/ui";

const defaultEmergencyContacts = [
  { id: "1", name: "Dr. Patel", relation: "Physician", status: "Primary" },
  { id: "2", name: "Nina Morgan", relation: "Caregiver (Emergency Contact)", status: "Secondary" },
  { id: "3", name: "Local Emergency Services", relation: "Emergency First Responder", status: "Fallback" }
];

export default function SosScreen() {
  const colors = useAppTheme();
  
  const sosEvents = useAppStore((state) => state.sos_events);
  const addSosEvent = useAppStore((state) => state.addSosEvent);
  const patientDetails = useAppStore((state) => state.patient_details);

  const [modalVisible, setModalVisible] = useState(false);
  const [triggering, setTriggering] = useState(false);
  const [activeSos, setActiveSos] = useState<SosEvent | null>(null);

  const triggerEmergencyAlert = () => {
    setModalVisible(false);
    setTriggering(true);
    
    // Simulate telemetry lookup and transmission delay
    setTimeout(() => {
      setTriggering(false);
      const newEvent: SosEvent = {
        id: `sos-${Date.now()}`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        location: "37.7749° N, 122.4194° W (Home Address)",
        resolved: false
      };
      addSosEvent(newEvent);
      setActiveSos(newEvent);
    }, 1200);
  };

  return (
    <ScrollView contentContainerStyle={{ paddingBottom: 40 }} className="flex-1 px-5 pt-12">
      <SectionTitle colors={colors} title="Emergency SOS" subtitle="High-visibility emergency controls with multi-step trigger protection." />

      {activeSos ? (
        <GlassCard colors={colors} className="p-5 border-2 border-red-500 bg-red-500/10 gap-4">
          <View className="flex-row items-center gap-3">
            <View style={{ backgroundColor: colors.danger }} className="w-12 h-12 rounded-full items-center justify-center animate-pulse">
              <MaterialIcons name="emergency" size={24} color="#FFFFFF" />
            </View>
            <View className="flex-1">
              <Text className="font-display text-[18px] font-bold text-red-600 dark:text-red-400">
                ACTIVE SOS ALERT
              </Text>
              <Text style={{ color: colors.text }} className="font-body text-[14px]">
                Contacts notified. GPS coordinates shared.
              </Text>
            </View>
          </View>

          <View style={{ backgroundColor: colors.elevated }} className="p-3.5 rounded-xl gap-1">
            <Text style={{ color: colors.secondaryText }} className="font-body text-[12px]">
              Active Beacon Details
            </Text>
            <Text style={{ color: colors.text }} className="font-body text-[14px]">
              📍 Location: {activeSos.location}
            </Text>
            <Text style={{ color: colors.text }} className="font-body text-[14px]">
              ⏰ Broadcast Started: {activeSos.time}
            </Text>
          </View>

          <PrimaryButton
            colors={colors}
            title="Cancel Active Broadcast"
            className="bg-zinc-800"
            onPress={() => setActiveSos(null)}
          />
        </GlassCard>
      ) : (
        <GlassCard colors={colors} className="gap-4 p-5">
          <View className="flex-row items-center justify-between">
            <StatusBadge colors={colors} label="GPS Active" tone="success" />
            <Text style={{ color: colors.secondaryText }} className="font-body text-[13px]">
              Tendon Shock Sensor: Active
            </Text>
          </View>
          
          <Text style={{ color: colors.text }} className="font-display text-[22px] font-semibold">
            Ready to Alert Caregiver
          </Text>
          <Text style={{ color: colors.secondaryText }} className="font-body text-[14px] leading-5">
            Press and hold the SOS button or perform the wrist rotate gesture for 3 seconds to trigger emergency notification.
          </Text>
          
          <SOSButton 
            colors={colors} 
            title={triggering ? "Broadcasting..." : "Hold for SOS"} 
            onPress={() => setModalVisible(true)} 
          />
        </GlassCard>
      )}

      {/* Emergency Contacts */}
      <View className="mt-6 gap-3">
        <Text style={{ color: colors.text }} className="font-display text-[18px] font-bold">
          Configured Caregivers
        </Text>
        
        {/* Dynamic Patient Registered Emergency Contact */}
        {patientDetails && (
          <GlassCard colors={colors} className="flex-row items-center justify-between p-4">
            <View className="flex-row items-center gap-3">
              <View style={{ backgroundColor: colors.primarySoft }} className="w-11 h-11 rounded-xl items-center justify-center">
                <MaterialIcons name="person" size={22} color={colors.primary} />
              </View>
              <View>
                <Text style={{ color: colors.text }} className="font-display text-[16px] font-bold">
                  {patientDetails.emergencyContactName}
                </Text>
                <Text style={{ color: colors.secondaryText }} className="font-body text-[13px]">
                  Registered Emergency Contact ({patientDetails.emergencyContactPhone})
                </Text>
              </View>
            </View>
            <StatusBadge colors={colors} label="Caregiver" tone="primary" />
          </GlassCard>
        )}

        {defaultEmergencyContacts.map((contact) => (
          <GlassCard key={contact.id} colors={colors} className="flex-row items-center justify-between p-4">
            <View className="flex-row items-center gap-3">
              <View style={{ backgroundColor: colors.elevated }} className="w-11 h-11 rounded-xl items-center justify-center">
                <MaterialIcons name="contact-phone" size={22} color={colors.secondaryText} />
              </View>
              <View>
                <Text style={{ color: colors.text }} className="font-display text-[16px] font-bold">
                  {contact.name}
                </Text>
                <Text style={{ color: colors.secondaryText }} className="font-body text-[13px]">
                  {contact.relation}
                </Text>
              </View>
            </View>
            <StatusBadge colors={colors} label={contact.status} tone={contact.status === "Primary" ? "danger" : "neutral"} />
          </GlassCard>
        ))}
      </View>

      {/* Recent Alerts Log */}
      {sosEvents.length > 0 && (
        <View className="mt-6 gap-3">
          <Text style={{ color: colors.text }} className="font-display text-[18px] font-bold">
            Recent Alert Transmissions
          </Text>
          {sosEvents.map((evt) => (
            <GlassCard key={evt.id} colors={colors} className="p-4 flex-row items-center justify-between">
              <View className="flex-row items-center gap-3">
                <MaterialIcons name="history" size={20} color={colors.secondaryText} />
                <View>
                  <Text style={{ color: colors.text }} className="font-display text-[15px] font-bold">
                    Emergency Broadcast Sent
                  </Text>
                  <Text style={{ color: colors.secondaryText }} className="font-body text-[13px]">
                    {evt.time} • GPS Coordinates Shared
                  </Text>
                </View>
              </View>
              <StatusBadge colors={colors} label="Sent" tone="danger" />
            </GlassCard>
          ))}
        </View>
      )}

      <ConfirmModal
        colors={colors}
        visible={modalVisible}
        title="Trigger Emergency Alert?"
        message={`This will immediately dispatch SMS alerts to caregiver ${patientDetails?.emergencyContactName || "Nina Morgan"} and activate live GPS tracking.`}
        primaryAction={{ label: "Dispatch Alert", onPress: triggerEmergencyAlert }}
        secondaryAction={{ label: "Cancel", onPress: () => setModalVisible(false) }}
      />
    </ScrollView>
  );
}
