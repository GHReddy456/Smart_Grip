import React, { useEffect, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";

import { useAppTheme } from "../../lib/theme";
import { useAppStore } from "../../store/useAppStore";
import { GlassCard } from "../../components/ui";

export default function UploadScanScreen() {
  const router = useRouter();
  const colors = useAppTheme();
  const setScanCompleted = useAppStore((state) => state.setScanCompleted);
  const setFabricationStatus = useAppStore((state) => state.setFabricationStatus);

  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState("Encrypting scan frames...");

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer);
          return 100;
        }
        
        // Simulating different upload stages
        if (prev === 20) {
          setStatusMessage("Establishing secure clinician link...");
        } else if (prev === 50) {
          setStatusMessage("Uploading high-resolution point cloud...");
        } else if (prev === 80) {
          setStatusMessage("Generating 3D wrist structural mesh...");
        } else if (prev === 95) {
          setStatusMessage("Completing handshake & checksum...");
        }
        
        return prev + 5;
      });
    }, 150);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (progress === 100) {
      const completionTimer = setTimeout(() => {
        // Redirect to final Delivery / Order placement screen
        router.replace("/scans/delivery");
      }, 800);
      return () => clearTimeout(completionTimer);
    }
  }, [progress]);

  return (
    <View style={{ backgroundColor: colors.background }} className="flex-1 justify-center items-center px-6">
      <GlassCard colors={colors} className="w-full max-w-md items-center p-8 gap-6 shadow-xl">
        <View style={{ backgroundColor: colors.primarySoft }} className="w-20 h-20 rounded-full items-center justify-center animate-bounce">
          <MaterialIcons name="cloud-upload" size={40} color={colors.primary} />
        </View>

        <View className="items-center gap-2">
          <Text style={{ color: colors.text }} className="font-display text-[26px] font-bold text-center">
            Syncing Biometrics
          </Text>
          <Text style={{ color: colors.secondaryText }} className="font-body text-[15px] text-center leading-5 px-2">
            Your anatomical hand measurements are being uploaded securely.
          </Text>
        </View>

        {/* Progress Bar */}
        <View className="w-full gap-2 mt-2">
          <View style={{ backgroundColor: colors.elevated }} className="h-4 w-full rounded-full overflow-hidden">
            <View 
              style={{ 
                backgroundColor: colors.primary, 
                width: `${progress}%` 
              }} 
              className="h-full rounded-full" 
            />
          </View>
          <View className="flex-row justify-between">
            <Text style={{ color: colors.secondaryText }} className="font-body text-[13px]">
              {statusMessage}
            </Text>
            <Text style={{ color: colors.primary }} className="font-display text-[13px] font-bold">
              {progress}%
            </Text>
          </View>
        </View>

        <ActivityIndicator size="small" color={colors.primary} className="mt-2" />
      </GlassCard>
    </View>
  );
}
