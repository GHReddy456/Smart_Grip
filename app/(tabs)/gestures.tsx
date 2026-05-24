import React, { useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";

import { useAppTheme } from "../../lib/theme";
import { useAppStore, type Gesture, type ActionMapping } from "../../store/useAppStore";
import { GlassCard, PrimaryButton, ProgressRing, SecondaryButton } from "../../components/ui";

export default function GesturesScreen() {
  const router = useRouter();
  const colors = useAppTheme();

  const gestures = useAppStore((state) => state.gestures);
  const devices = useAppStore((state) => state.devices);
  const mappings = useAppStore((state) => state.mappings);
  const addTrainedGesture = useAppStore((state) => state.addTrainedGesture);
  const addMapping = useAppStore((state) => state.addMapping);
  const removeMapping = useAppStore((state) => state.removeMapping);

  // Flow control states: "list" | "train" | "map"
  const [activeFlow, setActiveFlow] = useState<"list" | "train" | "map">("list");

  // Train Flow states
  const [trainStep, setTrainStep] = useState(1); // 1: Intro, 2: Name/Template, 3: Capture Repeat (1-3), 4: Test, 5: Done
  const [newGestureName, setNewGestureName] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState("Pinch");
  const [samplesCount, setSamplesCount] = useState(0); // 0 to 3
  const [testConfidence, setTestConfidence] = useState(0);
  const [isRecording, setIsRecording] = useState(false);

  // Mapping Flow states
  const [selectedGestureId, setSelectedGestureId] = useState("");
  const [selectedDeviceId, setSelectedDeviceId] = useState("");
  const [selectedAction, setSelectedAction] = useState("Toggle Power");

  // 1. HELPER: Start training
  const startTrainingFlow = () => {
    setActiveFlow("train");
    setTrainStep(1);
    setNewGestureName("");
    setSelectedTemplate("Pinch");
    setSamplesCount(0);
    setTestConfidence(0);
    setIsRecording(false);
  };

  const handleRecordSample = () => {
    setIsRecording(true);
    setTimeout(() => {
      setIsRecording(false);
      setSamplesCount((prev) => {
        const next = prev + 1;
        if (next === 3) {
          setTrainStep(4); // Move to testing
        }
        return next;
      });
    }, 1200);
  };

  const simulateTestGesture = () => {
    setIsRecording(true);
    setTimeout(() => {
      setIsRecording(false);
      setTestConfidence(Math.floor(Math.random() * (99 - 88 + 1)) + 88);
    }, 1000);
  };

  const saveNewGesture = () => {
    const id = newGestureName.toLowerCase().replace(/\s+/g, "-") || `gesture-${Date.now()}`;
    const newGesture: Gesture = {
      id,
      name: newGestureName || `${selectedTemplate} Custom`,
      samples: 3,
      isTrained: true,
      confidence: testConfidence || 94
    };
    addTrainedGesture(newGesture);
    setActiveFlow("list");
  };

  // 2. HELPER: Start action mapping
  const startMappingFlow = () => {
    if (gestures.length === 0) return;
    setActiveFlow("map");
    setSelectedGestureId(gestures[0].id);
    setSelectedDeviceId(devices[0].id);
    setSelectedAction("Toggle Power");
  };

  const saveGestureMapping = () => {
    if (selectedGestureId && selectedDeviceId) {
      const mapping: ActionMapping = {
        gestureId: selectedGestureId,
        deviceId: selectedDeviceId,
        actionName: selectedAction
      };
      addMapping(mapping);
      setActiveFlow("list");
    }
  };

  return (
    <ScrollView contentContainerStyle={{ paddingBottom: 40 }} className="flex-1 px-5 pt-12">
      {/* HEADER */}
      <View className="mb-6 flex-row justify-between items-center">
        <View>
          <Text style={{ color: colors.text }} className="font-display text-[28px] font-bold tracking-tight">
            Gesture Profiles
          </Text>
          <Text style={{ color: colors.secondaryText }} className="font-body text-[15px] leading-5">
            Calibrate smart glove motions and link them to smart assistive devices.
          </Text>
        </View>
        {activeFlow !== "list" && (
          <Pressable 
            onPress={() => setActiveFlow("list")} 
            style={{ backgroundColor: colors.elevated }} 
            className="w-10 h-10 rounded-full items-center justify-center active:scale-95"
          >
            <MaterialIcons name="close" size={20} color={colors.text} />
          </Pressable>
        )}
      </View>

      {/* FLOW 1: LIST FLOW */}
      {activeFlow === "list" && (
        <View className="gap-6">
          {/* Action Cards */}
          <View className="flex-row gap-3">
            <Pressable 
              onPress={startTrainingFlow}
              style={{ backgroundColor: colors.primarySoft }} 
              className="flex-1 p-4 rounded-3xl items-center justify-center gap-2 active:scale-98"
            >
              <MaterialIcons name="model-training" size={28} color={colors.primary} />
              <Text style={{ color: colors.primary }} className="font-display text-[15px] font-bold">
                Train Motion
              </Text>
            </Pressable>

            <Pressable 
              onPress={startMappingFlow}
              style={{ backgroundColor: colors.elevated }} 
              className="flex-1 p-4 rounded-3xl items-center justify-center gap-2 active:scale-98"
            >
              <MaterialIcons name="link" size={28} color={colors.text} />
              <Text style={{ color: colors.text }} className="font-display text-[15px] font-bold">
                Link Action
              </Text>
            </Pressable>
          </View>

          {/* Gestures List */}
          <View className="gap-3">
            <Text style={{ color: colors.text }} className="font-display text-[18px] font-bold">
              Calibrated Gestures
            </Text>
            
            {gestures.map((gesture) => {
              // Find device mapping for this gesture
              const matchingMappings = mappings.filter(m => m.gestureId === gesture.id);
              
              return (
                <GlassCard key={gesture.id} colors={colors} className="p-4 gap-3">
                  <View className="flex-row justify-between items-center">
                    <View className="flex-row items-center gap-3">
                      <View style={{ backgroundColor: colors.primarySoft }} className="w-10 h-10 rounded-xl items-center justify-center">
                        <MaterialIcons name="gesture" size={20} color={colors.primary} />
                      </View>
                      <View>
                        <Text style={{ color: colors.text }} className="font-display text-[16px] font-bold">
                          {gesture.name}
                        </Text>
                        <Text style={{ color: colors.secondaryText }} className="font-body text-[13px]">
                          Confidence: {gesture.confidence}% | Calibrated
                        </Text>
                      </View>
                    </View>
                    <StatusBadge colors={colors} label="Ready" tone="success" />
                  </View>

                  {/* Render mappings */}
                  {matchingMappings.length > 0 ? (
                    <View className="border-t border-black/5 dark:border-white/5 pt-3 gap-2">
                      <Text style={{ color: colors.secondaryText }} className="font-body text-[12px] uppercase">
                        Associated Actions
                      </Text>
                      {matchingMappings.map((map) => {
                        const devName = devices.find(d => d.id === map.deviceId)?.name || "Smart Device";
                        return (
                          <View key={map.deviceId} className="flex-row items-center justify-between bg-black/5 dark:bg-white/5 px-3 py-2 rounded-xl">
                            <Text style={{ color: colors.text }} className="font-body text-[14px]">
                              👉 {map.actionName} on **{devName}**
                            </Text>
                            <Pressable onPress={() => removeMapping(gesture.id, map.deviceId)} className="p-1">
                              <MaterialIcons name="delete-outline" size={18} color={colors.danger} />
                            </Pressable>
                          </View>
                        );
                      })}
                    </View>
                  ) : (
                    <Text style={{ color: colors.secondaryText }} className="font-body text-[13px] italic">
                      No linked smart actions. Tap "Link Action" to configure.
                    </Text>
                  )}
                </GlassCard>
              );
            })}
          </View>
        </View>
      )}

      {/* FLOW 2: TRAINING FLOW */}
      {activeFlow === "train" && (
        <View className="gap-6">
          {trainStep === 1 && (
            <GlassCard colors={colors} className="p-5 gap-4">
              <Text style={{ color: colors.text }} className="font-display text-[20px] font-bold">
                Biomechanical Gesture Calibrator
              </Text>
              <Text style={{ color: colors.secondaryText }} className="font-body text-[14px] leading-5">
                We will record three samples of your custom motion using the smart glove's flex sensors to build a custom neural profile.
              </Text>
              <PrimaryButton 
                colors={colors} 
                title="Begin Calibration" 
                icon="arrow-forward" 
                onPress={() => setTrainStep(2)} 
              />
            </GlassCard>
          )}

          {trainStep === 2 && (
            <GlassCard colors={colors} className="p-5 gap-4">
              <Text style={{ color: colors.text }} className="font-display text-[18px] font-bold">
                Gesture Name & Template
              </Text>
              <View className="gap-2">
                <Text style={{ color: colors.secondaryText }} className="font-body text-[13px] font-bold">
                  Select Baseline Movement
                </Text>
                <View className="flex-row flex-wrap gap-2">
                  {["Pinch", "Fist Clench", "Wrist Tilt", "Finger Flex", "Double Tap"].map((baseline) => (
                    <Pressable
                      key={baseline}
                      onPress={() => setSelectedTemplate(baseline)}
                      style={{
                        backgroundColor: selectedTemplate === baseline ? colors.primarySoft : colors.elevated,
                        borderColor: selectedTemplate === baseline ? colors.primary : colors.border,
                        borderWidth: 1.5
                      }}
                      className="px-4 py-2.5 rounded-full active:scale-95"
                    >
                      <Text style={{ color: selectedTemplate === baseline ? colors.primary : colors.text }} className="font-display text-[13px] font-bold">
                        {baseline}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              <View className="gap-1 mt-2">
                <Text style={{ color: colors.secondaryText }} className="font-body text-[13px] font-bold">
                  Custom Label
                </Text>
                <TextInput
                  value={newGestureName}
                  onChangeText={setNewGestureName}
                  placeholder="e.g. Turn Living Room Lights On"
                  style={{
                    backgroundColor: colors.elevated,
                    borderColor: colors.border,
                    borderWidth: 1,
                    color: colors.text,
                    padding: 12,
                    borderRadius: 16,
                    fontFamily: "Atkinson Hyperlegible Next"
                  }}
                />
              </View>

              <PrimaryButton 
                colors={colors} 
                title="Start Recording samples" 
                icon="mic-none" 
                disabled={!newGestureName}
                onPress={() => setTrainStep(3)} 
              />
            </GlassCard>
          )}

          {trainStep === 3 && (
            <GlassCard colors={colors} className="p-5 gap-5 items-center">
              <Text style={{ color: colors.text }} className="font-display text-[18px] font-bold text-center">
                Sample Captures: {samplesCount} of 3
              </Text>
              
              <ProgressRing 
                colors={colors} 
                progress={Math.round((samplesCount / 3) * 100)} 
                size={120} 
                strokeWidth={10} 
                label={`${samplesCount}/3 samples`}
              />

              <Text style={{ color: colors.secondaryText }} className="font-body text-[14px] text-center px-4 leading-5">
                Perform your custom gesture sequence with your glove, then tap **Record Sample**. Hold the posture for 1 second.
              </Text>

              {isRecording ? (
                <View className="flex-row items-center gap-2">
                  <ActivityIndicator size="small" color={colors.primary} />
                  <Text style={{ color: colors.primary }} className="font-display text-[14px] font-bold uppercase">
                    Recoding glove sensors...
                  </Text>
                </View>
              ) : (
                <PrimaryButton 
                  colors={colors} 
                  title={`Record Sample ${samplesCount + 1}`} 
                  icon="videocam" 
                  onPress={handleRecordSample} 
                />
              )}
            </GlassCard>
          )}

          {trainStep === 4 && (
            <GlassCard colors={colors} className="p-5 gap-4 items-center">
              <View style={{ backgroundColor: colors.successSoft }} className="w-14 h-14 rounded-full items-center justify-center">
                <MaterialIcons name="done" size={28} color={colors.success} />
              </View>
              <Text style={{ color: colors.text }} className="font-display text-[20px] font-bold text-center">
                Calibration Finished
              </Text>
              <Text style={{ color: colors.secondaryText }} className="font-body text-[14px] text-center leading-5 px-2">
                We've established your gesture baseline parameters. Let's do a live test run to verify sensor precision.
              </Text>

              {testConfidence > 0 ? (
                <View style={{ backgroundColor: colors.primarySoft }} className="w-full p-4 rounded-2xl items-center">
                  <Text style={{ color: colors.text }} className="font-display text-[16px] font-bold">
                    Test Performance: {testConfidence}% Confidence
                  </Text>
                  <Text style={{ color: colors.secondaryText }} className="font-body text-[13px] mt-0.5">
                    Signal resolution: Optimal
                  </Text>
                </View>
              ) : isRecording ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <SecondaryButton 
                  colors={colors} 
                  title="Perform Test Gesture" 
                  icon="speed" 
                  onPress={simulateTestGesture} 
                />
              )}

              <PrimaryButton 
                colors={colors} 
                title="Save & Store Profile" 
                icon="save" 
                disabled={testConfidence === 0}
                onPress={saveNewGesture} 
              />
            </GlassCard>
          )}
        </View>
      )}

      {/* FLOW 3: ACTION MAPPING FLOW */}
      {activeFlow === "map" && (
        <View className="gap-6">
          <GlassCard colors={colors} className="p-5 gap-4">
            <Text style={{ color: colors.text }} className="font-display text-[18px] font-bold">
              Link Gesture to Smart Action
            </Text>

            {/* Gesture Selection */}
            <View className="gap-1.5">
              <Text style={{ color: colors.secondaryText }} className="font-body text-[13px] font-bold">
                1. Choose Gesture
              </Text>
              <View className="gap-1.5">
                {gestures.map((gesture) => {
                  const isSelected = selectedGestureId === gesture.id;
                  return (
                    <Pressable
                      key={gesture.id}
                      onPress={() => setSelectedGestureId(gesture.id)}
                      style={{
                        backgroundColor: isSelected ? colors.primarySoft : colors.elevated,
                        borderColor: isSelected ? colors.primary : colors.border,
                        borderWidth: 1.5
                      }}
                      className="p-3.5 rounded-xl flex-row items-center justify-between"
                    >
                      <Text style={{ color: colors.text }} className="font-display text-[15px] font-bold">
                        {gesture.name}
                      </Text>
                      {isSelected && <MaterialIcons name="check-circle" size={18} color={colors.primary} />}
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* Device Selection */}
            <View className="gap-1.5 mt-2">
              <Text style={{ color: colors.secondaryText }} className="font-body text-[13px] font-bold">
                2. Choose Smart Device
              </Text>
              <View className="gap-1.5">
                {devices.map((device) => {
                  const isSelected = selectedDeviceId === device.id;
                  return (
                    <Pressable
                      key={device.id}
                      onPress={() => setSelectedDeviceId(device.id)}
                      style={{
                        backgroundColor: isSelected ? colors.primarySoft : colors.elevated,
                        borderColor: isSelected ? colors.primary : colors.border,
                        borderWidth: 1.5
                      }}
                      className="p-3.5 rounded-xl flex-row items-center justify-between"
                    >
                      <View className="flex-row items-center gap-2.5">
                        <MaterialIcons 
                          name={device.type === "Smart light" ? "lightbulb-outline" : device.type === "Smart fan" ? "toys" : "speaker"} 
                          size={18} 
                          color={isSelected ? colors.primary : colors.secondaryText} 
                        />
                        <Text style={{ color: colors.text }} className="font-display text-[15px] font-bold">
                          {device.name}
                        </Text>
                      </View>
                      {isSelected && <MaterialIcons name="check-circle" size={18} color={colors.primary} />}
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* Action Selection */}
            <View className="gap-1.5 mt-2">
              <Text style={{ color: colors.secondaryText }} className="font-body text-[13px] font-bold">
                3. Choose Command
              </Text>
              <View className="flex-row gap-2">
                {["Toggle Power", "Increase Intensity", "Decrease Intensity"].map((act) => {
                  const isSelected = selectedAction === act;
                  return (
                    <Pressable
                      key={act}
                      onPress={() => setSelectedAction(act)}
                      style={{
                        backgroundColor: isSelected ? colors.primarySoft : colors.elevated,
                        borderColor: isSelected ? colors.primary : colors.border,
                        borderWidth: 1.5
                      }}
                      className="flex-1 p-2 rounded-lg items-center justify-center"
                    >
                      <Text style={{ color: isSelected ? colors.primary : colors.text }} className="font-display text-[12px] font-bold text-center">
                        {act}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <PrimaryButton 
              colors={colors} 
              title="Save Action Association" 
              icon="link" 
              disabled={!selectedGestureId || !selectedDeviceId}
              onPress={saveGestureMapping} 
            />
          </GlassCard>
        </View>
      )}
    </ScrollView>
  );
}
