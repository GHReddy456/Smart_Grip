import React from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";

import { useAppTheme } from "../../lib/theme";
import { useAppStore } from "../../store/useAppStore";
import { DeviceCard, GlassCard, SectionTitle } from "../../components/ui";

export default function DevicesScreen() {
  const colors = useAppTheme();
  
  const devices = useAppStore((state) => state.devices);
  const toggleDevicePower = useAppStore((state) => state.toggleDevicePower);
  const setDeviceIntensity = useAppStore((state) => state.setDeviceIntensity);

  return (
    <ScrollView contentContainerStyle={{ paddingBottom: 40 }} className="flex-1 px-5 pt-12">
      <SectionTitle colors={colors} title="Assistive Devices" subtitle="Large, accessible controls for smart home appliances." />
      
      <View className="gap-4">
        {devices.map((device) => {
          return (
            <GlassCard key={device.id} colors={colors} className="p-5 gap-4">
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center gap-3">
                  <View style={{ backgroundColor: device.active ? colors.primarySoft : colors.elevated }} className="w-12 h-12 rounded-2xl items-center justify-center">
                    <MaterialIcons 
                      name={device.type === "Smart light" ? "lightbulb-outline" : device.type === "Smart fan" ? "toys" : "speaker"} 
                      size={24} 
                      color={device.active ? colors.primary : colors.secondaryText} 
                    />
                  </View>
                  <View>
                    <Text style={{ color: colors.text }} className="font-display text-[18px] font-bold">
                      {device.name}
                    </Text>
                    <Text style={{ color: colors.secondaryText }} className="font-body text-[14px]">
                      {device.type} • {device.active ? "Connected" : "Inactive"}
                    </Text>
                  </View>
                </View>
                
                <Pressable
                  onPress={() => toggleDevicePower(device.id)}
                  style={{
                    backgroundColor: device.active ? colors.primary : colors.elevated,
                    borderColor: colors.border,
                    borderWidth: 1
                  }}
                  className="px-5 py-2.5 rounded-full active:scale-95 transition-all"
                >
                  <Text style={{ color: device.active ? "#FFFFFF" : colors.text }} className="font-display text-[14px] font-bold">
                    {device.active ? "ON" : "OFF"}
                  </Text>
                </Pressable>
              </View>

              {/* Slider for intensity if active */}
              {device.active && (device.type === "Smart light" || device.type === "Smart fan") && (
                <View className="gap-2 mt-2">
                  <View className="flex-row justify-between">
                    <Text style={{ color: colors.secondaryText }} className="font-body text-[13px]">
                      Control Level
                    </Text>
                    <Text style={{ color: colors.primary }} className="font-display text-[13px] font-bold">
                      {device.intensity}%
                    </Text>
                  </View>
                  
                  {/* Custom Touch Slider Controls */}
                  <View className="flex-row gap-2">
                    {[25, 50, 75, 100].map((val) => {
                      const isVal = device.intensity === val;
                      return (
                        <Pressable
                          key={val}
                          onPress={() => setDeviceIntensity(device.id, val)}
                          style={{
                            backgroundColor: isVal ? colors.primary : colors.elevated,
                            borderColor: colors.border,
                            borderWidth: 1
                          }}
                          className="flex-1 py-2 rounded-xl items-center justify-center active:scale-95"
                        >
                          <Text style={{ color: isVal ? "#FFFFFF" : colors.text }} className="font-display text-[13px] font-semibold">
                            {val}%
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>
              )}
            </GlassCard>
          );
        })}
      </View>

      <GlassCard colors={colors} className="mt-6 gap-3">
        <Text style={{ color: colors.text }} className="font-display text-[18px] font-semibold">
          Connection Integrity
        </Text>
        <Text style={{ color: colors.secondaryText }} className="font-body text-[14px] leading-5">
          Device bridges are operating locally via Bluetooth Low Energy (BLE) smart-mesh. Real-time glove mappings are verified.
        </Text>
      </GlassCard>
    </ScrollView>
  );
}
