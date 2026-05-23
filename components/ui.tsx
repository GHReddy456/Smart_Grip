import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated as RNAnimated,
  Modal,
  Pressable,
  ScrollView,
  Switch,
  Text,
  TextInput,
  View
} from "react-native";
import * as Haptics from "expo-haptics";
import { MaterialIcons } from "@expo/vector-icons";
import { Circle, Svg } from "react-native-svg";
import Animated, {
  Easing,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming
} from "react-native-reanimated";

import { cn } from "../lib/cn";
import { layout, type ThemeColors } from "../lib/theme";
import { useAppStore } from "../store/useAppStore";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

type ThemeAwareProps = {
  colors: ThemeColors;
};

type ButtonProps = ThemeAwareProps & {
  title: string;
  onPress?: () => void;
  loading?: boolean;
  icon?: keyof typeof MaterialIcons.glyphMap;
  disabled?: boolean;
  className?: string;
  fullWidth?: boolean;
  accessibilityLabel?: string;
};

function usePressFeedback(shouldHaptic = true) {
  const hapticsEnabled = useAppStore((state) => state.hapticsEnabled);

  return () => {
    if (shouldHaptic && hapticsEnabled) {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };
}

export function SectionTitle({ colors, title, subtitle }: ThemeAwareProps & { title: string; subtitle?: string }) {
  return (
    <View className="mb-4 gap-1">
      <Text style={{ color: colors.text }} className="font-display text-[26px] font-semibold tracking-tight">
        {title}
      </Text>
      {subtitle ? (
        <Text style={{ color: colors.secondaryText }} className="font-body text-[16px] leading-6">
          {subtitle}
        </Text>
      ) : null}
    </View>
  );
}

import type { ViewStyle, StyleProp } from "react-native";

export function GlassCard({ colors, children, className, style }: ThemeAwareProps & { children: React.ReactNode; className?: string; style?: StyleProp<ViewStyle> }) {
  return (
    <View
      style={[{ backgroundColor: colors.card, borderColor: colors.border, shadowColor: colors.shadow }, style]}
      className={cn("rounded-3xl border p-4 shadow-lg", className)}
    >
      {children}
    </View>
  );
}

export function PrimaryButton({ colors, title, onPress, loading, icon, disabled, className, fullWidth = true, accessibilityLabel }: ButtonProps) {
  const runFeedback = usePressFeedback();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      disabled={disabled || loading}
      onPress={() => {
        runFeedback();
        onPress?.();
      }}
      style={{ minHeight: 56, backgroundColor: disabled ? colors.primarySoft : colors.primary }}
      className={cn(
        "flex-row items-center justify-center gap-3 rounded-2xl px-4 py-3 active:opacity-90",
        fullWidth ? "w-full" : "self-start",
        className
      )}
    >
      {loading ? <ActivityIndicator color={colors.inverseText} /> : icon ? <MaterialIcons name={icon} size={22} color={colors.inverseText} /> : null}
      <Text style={{ color: colors.inverseText }} className="font-display text-[18px] font-semibold">
        {title}
      </Text>
    </Pressable>
  );
}

export function SecondaryButton({ colors, title, onPress, loading, icon, disabled, className, fullWidth = true, accessibilityLabel }: ButtonProps) {
  const runFeedback = usePressFeedback();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      disabled={disabled || loading}
      onPress={() => {
        runFeedback();
        onPress?.();
      }}
      style={{ minHeight: 56, backgroundColor: colors.card, borderColor: colors.border }}
      className={cn(
        "flex-row items-center justify-center gap-3 rounded-2xl border px-4 py-3 active:opacity-90",
        fullWidth ? "w-full" : "self-start",
        className
      )}
    >
      {loading ? <ActivityIndicator color={colors.primary} /> : icon ? <MaterialIcons name={icon} size={22} color={colors.primary} /> : null}
      <Text style={{ color: colors.text }} className="font-display text-[18px] font-semibold">
        {title}
      </Text>
    </Pressable>
  );
}

export function SOSButton({ colors, title, onPress, loading, disabled, className, accessibilityLabel }: ThemeAwareProps & Omit<ButtonProps, "icon">) {
  const runFeedback = usePressFeedback();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      disabled={disabled || loading}
      onPress={() => {
        runFeedback();
        onPress?.();
      }}
      style={{ minHeight: 88, backgroundColor: colors.danger }}
      className={cn("items-center justify-center rounded-3xl px-5 py-4 active:opacity-90", className)}
    >
      {loading ? <ActivityIndicator color={colors.inverseText} /> : <MaterialIcons name="emergency" size={34} color={colors.inverseText} />}
      <Text style={{ color: colors.inverseText }} className="mt-2 font-display text-[24px] font-semibold tracking-tight">
        {title}
      </Text>
    </Pressable>
  );
}

export function StatusBadge({
  colors,
  label,
  tone = "neutral"
}: ThemeAwareProps & { label: string; tone?: "neutral" | "primary" | "success" | "warning" | "danger" }) {
  const palette = {
    neutral: { backgroundColor: colors.elevated, textColor: colors.secondaryText },
    primary: { backgroundColor: colors.primarySoft, textColor: colors.primary },
    success: { backgroundColor: colors.successSoft, textColor: colors.success },
    warning: { backgroundColor: colors.warningSoft, textColor: colors.warning },
    danger: { backgroundColor: colors.dangerSoft, textColor: colors.danger }
  }[tone];

  return (
    <View style={{ backgroundColor: palette.backgroundColor }} className="self-start rounded-full px-3 py-1.5">
      <Text style={{ color: palette.textColor }} className="font-body text-[13px] font-semibold uppercase tracking-wide">
        {label}
      </Text>
    </View>
  );
}

export function MedicalInput({
  colors,
  label,
  value,
  onChangeText,
  placeholder,
  icon,
  secureTextEntry,
  rightAccessory,
  keyboardType,
  autoCapitalize = "none"
}: ThemeAwareProps & {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  icon?: keyof typeof MaterialIcons.glyphMap;
  secureTextEntry?: boolean;
  rightAccessory?: React.ReactNode;
  keyboardType?: "default" | "email-address" | "numeric" | "phone-pad";
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
}) {
  return (
    <View className="gap-2">
      <Text style={{ color: colors.secondaryText }} className="font-body text-[14px] font-semibold">
        {label}
      </Text>
      <View style={{ backgroundColor: colors.card, borderColor: colors.border }} className="flex-row items-center rounded-2xl border px-4">
        {icon ? <MaterialIcons name={icon} size={20} color={colors.secondaryText} /> : null}
        <TextInput
          allowFontScaling
          autoCapitalize={autoCapitalize}
          autoCorrect={false}
          keyboardType={keyboardType}
          placeholder={placeholder}
          placeholderTextColor={colors.secondaryText}
          secureTextEntry={secureTextEntry}
          style={{ color: colors.text, minHeight: 56 }}
          className="flex-1 px-3 font-body text-[18px]"
          value={value}
          onChangeText={onChangeText}
        />
        {rightAccessory}
      </View>
    </View>
  );
}

export function AccessibilityToggle({
  colors,
  label,
  description,
  value,
  onValueChange
}: ThemeAwareProps & { label: string; description: string; value: boolean; onValueChange: (value: boolean) => void }) {
  return (
    <View style={{ backgroundColor: colors.card, borderColor: colors.border }} className="flex-row items-center justify-between rounded-3xl border p-4">
      <View className="flex-1 pr-4">
        <Text style={{ color: colors.text }} className="font-display text-[18px] font-semibold">
          {label}
        </Text>
        <Text style={{ color: colors.secondaryText }} className="mt-1 font-body text-[15px] leading-5">
          {description}
        </Text>
      </View>
      <Switch
        accessibilityLabel={label}
        accessibilityHint={description}
        thumbColor={value ? colors.card : colors.card}
        trackColor={{ false: colors.border, true: colors.primarySoft }}
        value={value}
        onValueChange={onValueChange}
      />
    </View>
  );
}

export function AnimatedLoader({ colors, label = "Loading" }: ThemeAwareProps & { label?: string }) {
  const pulse = useSharedValue(0);

  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(withTiming(1, { duration: 900, easing: Easing.out(Easing.quad) }), withTiming(0, { duration: 900, easing: Easing.in(Easing.quad) })),
      -1,
      false
    );
  }, [pulse]);

  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 0.92 + pulse.value * 0.08 }],
    opacity: 0.8 + pulse.value * 0.2
  }));

  return (
    <View className="items-center justify-center gap-3 py-6">
      <Animated.View style={[ringStyle, { backgroundColor: colors.primarySoft }]} className="h-20 w-20 items-center justify-center rounded-full">
        <View style={{ backgroundColor: colors.primary }} className="h-9 w-9 rounded-full" />
      </Animated.View>
      <Text style={{ color: colors.secondaryText }} className="font-body text-[15px]">
        {label}
      </Text>
    </View>
  );
}

export function ProgressRing({ colors, progress, size = 140, strokeWidth = 10, label }: ThemeAwareProps & { progress: number; size?: number; strokeWidth?: number; label?: string }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const animatedProgress = useSharedValue(progress);

  useEffect(() => {
    animatedProgress.value = withTiming(progress, { duration: 700 });
  }, [animatedProgress, progress]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference - (circumference * animatedProgress.value) / 100
  }));

  return (
    <View style={{ width: size, height: size }} className="items-center justify-center">
      <Svg width={size} height={size}>
        <Circle cx={size / 2} cy={size / 2} r={radius} stroke={colors.border} strokeWidth={strokeWidth} fill="transparent" />
        <AnimatedCircle
          animatedProps={animatedProps}
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={colors.primary}
          strokeDasharray={circumference}
          strokeLinecap="round"
          strokeWidth={strokeWidth}
          fill="transparent"
        />
      </Svg>
      <View className="absolute items-center justify-center">
        <Text style={{ color: colors.text }} className="font-display text-[28px] font-semibold">
          {Math.round(progress)}%
        </Text>
        {label ? (
          <Text style={{ color: colors.secondaryText }} className="font-body text-[14px] uppercase tracking-wider">
            {label}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

export function ScanStepCard({
  colors,
  index,
  title,
  description,
  active,
  completed
}: ThemeAwareProps & { index: number; title: string; description: string; active?: boolean; completed?: boolean }) {
  const tone = completed ? colors.successSoft : active ? colors.primarySoft : colors.elevated;

  return (
    <View style={{ backgroundColor: colors.card, borderColor: active ? colors.primarySoft : colors.border }} className="flex-row items-start gap-4 rounded-3xl border p-4">
      <View style={{ backgroundColor: tone }} className="h-11 w-11 items-center justify-center rounded-2xl">
        <Text style={{ color: completed ? colors.success : active ? colors.primary : colors.secondaryText }} className="font-display text-[16px] font-semibold">
          {index < 10 ? `0${index}` : index}
        </Text>
      </View>
      <View className="flex-1 gap-1">
        <Text style={{ color: colors.text }} className="font-display text-[18px] font-semibold">
          {title}
        </Text>
        <Text style={{ color: colors.secondaryText }} className="font-body text-[15px] leading-5">
          {description}
        </Text>
      </View>
      {completed ? <MaterialIcons name="check-circle" size={24} color={colors.success} /> : active ? <MaterialIcons name="radio-button-checked" size={24} color={colors.primary} /> : null}
    </View>
  );
}

export function GestureCard({
  colors,
  gesture,
  onPress
}: ThemeAwareProps & {
  gesture: { name: string; action: string; active: boolean; confidence: number };
  onPress?: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={{ backgroundColor: colors.card, borderColor: colors.border }}
      className="gap-4 rounded-3xl border p-4 active:opacity-90"
    >
      <View className="flex-row items-start justify-between gap-4">
        <View className="gap-2">
          <Text style={{ color: colors.text }} className="font-display text-[21px] font-semibold">
            {gesture.name}
          </Text>
          <Text style={{ color: colors.secondaryText }} className="font-body text-[15px]">
            {gesture.action}
          </Text>
        </View>
        <StatusBadge colors={colors} label={gesture.active ? "Active" : "Paused"} tone={gesture.active ? "success" : "neutral"} />
      </View>
      <View style={{ backgroundColor: colors.elevated }} className="h-3 overflow-hidden rounded-full">
        <View style={{ width: `${gesture.confidence}%`, backgroundColor: colors.primary }} className="h-3 rounded-full" />
      </View>
      <View className="flex-row items-center justify-between">
        <Text style={{ color: colors.secondaryText }} className="font-body text-[14px]">
          Recognition confidence
        </Text>
        <Text style={{ color: colors.text }} className="font-display text-[14px] font-semibold">
          {gesture.confidence}%
        </Text>
      </View>
    </Pressable>
  );
}

export function DeviceCard({
  colors,
  device,
  onToggle,
  onIntensityChange
}: ThemeAwareProps & {
  device: { name: string; type: string; status: string; active: boolean; intensity: number };
  onToggle?: (active: boolean) => void;
  onIntensityChange?: (value: number) => void;
}) {
  const [localIntensity, setLocalIntensity] = useState(device.intensity);

  useEffect(() => {
    setLocalIntensity(device.intensity);
  }, [device.intensity]);

  const position = Math.max(0, Math.min(100, localIntensity));

  return (
    <View style={{ backgroundColor: colors.card, borderColor: colors.border }} className="gap-4 rounded-3xl border p-4">
      <View className="flex-row items-start justify-between gap-4">
        <View className="flex-1 gap-1">
          <Text style={{ color: colors.text }} className="font-display text-[20px] font-semibold">
            {device.name}
          </Text>
          <Text style={{ color: colors.secondaryText }} className="font-body text-[15px]">
            {device.type}
          </Text>
        </View>
        <StatusBadge colors={colors} label={device.status} tone={device.active ? "success" : "neutral"} />
      </View>
      <View className="flex-row items-center justify-between gap-3">
        <Text style={{ color: colors.secondaryText }} className="font-body text-[14px]">
          Power
        </Text>
        <Switch
          accessibilityLabel={`${device.name} power`}
          value={device.active}
          trackColor={{ false: colors.border, true: colors.primarySoft }}
          thumbColor={device.active ? colors.primary : colors.card}
          onValueChange={onToggle}
        />
      </View>
      <View className="gap-2">
        <View className="flex-row items-center justify-between">
          <Text style={{ color: colors.secondaryText }} className="font-body text-[14px]">
            Fan speed
          </Text>
          <Text style={{ color: colors.text }} className="font-display text-[14px] font-semibold">
            {position}%
          </Text>
        </View>
        <View style={{ backgroundColor: colors.elevated }} className="h-3 overflow-hidden rounded-full">
          <View style={{ width: `${position}%`, backgroundColor: colors.primary }} className="h-3 rounded-full" />
        </View>
        <View className="flex-row gap-2">
          {[0, 25, 50, 75, 100].map((value) => (
            <Pressable
              key={value}
              onPress={() => {
                setLocalIntensity(value);
                onIntensityChange?.(value);
              }}
              style={{ backgroundColor: position === value ? colors.primarySoft : colors.elevated }}
              className="flex-1 rounded-2xl px-2 py-2"
            >
              <Text style={{ color: position === value ? colors.primary : colors.secondaryText }} className="text-center font-body text-[13px] font-semibold">
                {value}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>
    </View>
  );
}

export function UploadProgressCard({
  colors,
  fileName,
  progress,
  status,
  eta,
  tone = "primary"
}: ThemeAwareProps & {
  fileName: string;
  progress: number;
  status: string;
  eta: string;
  tone?: "primary" | "success" | "warning" | "danger";
}) {
  const toneColor = {
    primary: colors.primary,
    success: colors.success,
    warning: colors.warning,
    danger: colors.danger
  }[tone];

  return (
    <View style={{ backgroundColor: colors.card, borderColor: colors.border }} className="gap-4 rounded-3xl border p-4">
      <View className="flex-row items-center justify-between gap-4">
        <View className="flex-1 gap-1">
          <Text style={{ color: colors.text }} className="font-display text-[18px] font-semibold">
            {fileName}
          </Text>
          <Text style={{ color: colors.secondaryText }} className="font-body text-[14px]">
            {status}
          </Text>
        </View>
        <ProgressRing colors={colors} progress={progress} size={84} strokeWidth={8} />
      </View>
      <View style={{ backgroundColor: colors.elevated }} className="h-3 overflow-hidden rounded-full">
        <View style={{ width: `${progress}%`, backgroundColor: toneColor }} className="h-3 rounded-full" />
      </View>
      <View className="flex-row items-center justify-between">
        <StatusBadge colors={colors} label={status} tone={tone} />
        <Text style={{ color: colors.secondaryText }} className="font-body text-[13px]">
          ETA {eta}
        </Text>
      </View>
    </View>
  );
}

export function ScanOverlay({ colors, step, voiceEnabled = true }: ThemeAwareProps & { step: number; voiceEnabled?: boolean }) {
  const pulse = useSharedValue(0);

  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(withTiming(1, { duration: 1200 }), withTiming(0, { duration: 1200 })),
      -1,
      false
    );
  }, [pulse]);

  const pulseStyle = useAnimatedStyle(() => ({
    opacity: 0.18 + pulse.value * 0.32,
    transform: [{ scale: 0.98 + pulse.value * 0.02 }]
  }));

  return (
    <View pointerEvents="none" className="absolute inset-0">
      <View style={{ backgroundColor: colors.overlay }} className="absolute inset-0" />
      <View className="absolute inset-0 items-center justify-center">
        <Animated.View
          style={pulseStyle}
          className="h-[420px] w-[300px] rounded-[40px] border-2 border-dashed border-white/55"
        />
        <View className="absolute h-[420px] w-[300px] overflow-hidden rounded-[40px]">
          <View style={{ backgroundColor: colors.primary }} className="absolute left-0 right-0 top-0 h-[2px]" />
        </View>
      </View>
      <View className="absolute left-0 right-0 top-10 items-center px-5">
        <View style={{ backgroundColor: "rgba(255,255,255,0.12)" }} className="rounded-full px-4 py-2">
          <Text className="font-body text-[13px] font-semibold uppercase tracking-[0.2em] text-white">
            Step {step} of 5
          </Text>
        </View>
        <View className="mt-4 max-w-md rounded-3xl bg-black/35 p-4">
          <Text className="text-center font-display text-[26px] font-semibold text-white">Guided capture in progress</Text>
          <Text className="mt-2 text-center font-body text-[15px] leading-5 text-white/80">
            Align the hand inside the frame and hold steady for a precise medical scan.
          </Text>
        </View>
      </View>
      <View className="absolute bottom-8 left-0 right-0 items-center px-5">
        <View className="w-full max-w-md rounded-3xl bg-black/35 p-4">
          <View className="flex-row items-center justify-between">
            <View className="flex-1 pr-4">
              <Text className="font-display text-[18px] font-semibold text-white">Voice instruction</Text>
              <Text className="mt-1 font-body text-[14px] text-white/75">{voiceEnabled ? "Enabled for hands-free guidance" : "Muted for quiet scanning"}</Text>
            </View>
            <MaterialIcons name={voiceEnabled ? "volume-up" : "volume-off"} size={28} color="#FFFFFF" />
          </View>
        </View>
      </View>
    </View>
  );
}

export function ConfirmModal({
  colors,
  visible,
  title,
  message,
  primaryAction,
  secondaryAction
}: ThemeAwareProps & {
  visible: boolean;
  title: string;
  message: string;
  primaryAction: { label: string; onPress: () => void };
  secondaryAction?: { label: string; onPress: () => void };
}) {
  return (
    <Modal animationType="fade" transparent visible={visible}>
      <View style={{ backgroundColor: colors.overlay }} className="flex-1 items-center justify-center px-5">
        <View style={{ backgroundColor: colors.card, borderColor: colors.border }} className="w-full max-w-md gap-4 rounded-3xl border p-5">
          <Text style={{ color: colors.text }} className="font-display text-[24px] font-semibold">
            {title}
          </Text>
          <Text style={{ color: colors.secondaryText }} className="font-body text-[15px] leading-6">
            {message}
          </Text>
          <View className="gap-3 pt-2">
            <PrimaryButton colors={colors} title={primaryAction.label} onPress={primaryAction.onPress} icon="done" />
            {secondaryAction ? <SecondaryButton colors={colors} title={secondaryAction.label} onPress={secondaryAction.onPress} /> : null}
          </View>
        </View>
      </View>
    </Modal>
  );
}

export function PageScroll({ children }: { children: React.ReactNode }) {
  return (
    <ScrollView
      contentContainerStyle={{ paddingBottom: 40 }}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {children}
    </ScrollView>
  );
}
