/**
 * processing.tsx — AI Measurement Review Screen
 *
 * Replaces the old WebView skin-pixel bounding-box approach with
 * a server-side polling flow:
 *
 *   1. Read job_id from the Zustand store (set by camera.tsx on upload)
 *   2. Poll GET /api/v1/tailor/status/{job_id} every 3 seconds
 *   3. On "done" → fetch GET /api/v1/tailor/results/{job_id}
 *   4. Display real millimetre measurements from MediaPipe + depth pipeline
 *   5. Allow manual override of any value
 *   6. On Approve → POST measurements to /api/v1/tailor/dimensions → navigate home
 */

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  TextInput,
  ActivityIndicator,
  Animated,
  Easing,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Feather, MaterialIcons, MaterialCommunityIcons } from "@expo/vector-icons";
import { apiUrl } from "../../lib/api";
import { useAppStore } from "../../store/useAppStore";
import { useAppTheme } from "../../lib/theme";

// ── Types ────────────────────────────────────────────────────────────────────

type ProcessingPhase =
  | "waiting"       // job_id not available yet
  | "polling"       // actively polling status endpoint
  | "done"          // measurements ready
  | "failed"        // pipeline error
  | "timeout";      // polling timed out (> 120s)

interface FingerGirths {
  thumb?: number;
  index?: number;
  middle?: number;
  ring?: number;
  pinky?: number;
}

interface GloveCalibration {
  glove_size: string;
  actuator_positions: Array<{ finger: string; zone: string; u: number; v: number }>;
  sensor_positions: Array<{ sensor_type: string; finger?: string }>;
}

interface MeasurementData {
  palm_width_mm: number;
  palm_length_mm: number;
  thumb_length_mm: number;
  index_length_mm: number;
  middle_length_mm: number;
  ring_length_mm: number;
  pinky_length_mm: number;
  finger_girths_mm?: FingerGirths;
  confidence_score: number;
  confidence_per_key?: Record<string, number>;
  glove_calibration?: GloveCalibration;
  views_used?: number;
  views_rejected?: number;
}

interface EditableMetrics {
  palmWidth: string;
  palmHeight: string;
  thumbLength: string;
  indexLength: string;
  middleLength: string;
  ringLength: string;
  pinkyLength: string;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const POLL_INTERVAL_MS = 3000;
const POLL_TIMEOUT_MS  = 120_000;

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatMm(val: number | undefined): string {
  if (val === undefined || val === null || val <= 0) return "";
  return val.toFixed(1);
}

function confidenceBadgeColor(score: number): string {
  if (score >= 0.75) return "#22c55e";
  if (score >= 0.50) return "#f59e0b";
  return "#ef4444";
}

function confidenceLabel(score: number): string {
  if (score >= 0.75) return "High confidence";
  if (score >= 0.50) return "Medium confidence";
  return "Low confidence — consider retaking";
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function MeasurementProcessingScreen() {
  const colors    = useAppTheme();
  const { themeMode } = useAppStore();
  const isDark    = themeMode === "dark";

  const jobId     = useAppStore((s) => s.current_job_id);
  const patientId = useAppStore((s) => s.patient_id);

  const [phase, setPhase]           = useState<ProcessingPhase>("waiting");
  const [errorMsg, setErrorMsg]     = useState<string | null>(null);
  const [rawData, setRawData]       = useState<MeasurementData | null>(null);
  const [isEditing, setIsEditing]   = useState(false);
  const [isSaving, setIsSaving]     = useState(false);
  const [pollElapsed, setPollElapsed] = useState(0);

  const [metrics, setMetrics] = useState<EditableMetrics>({
    palmWidth:    "",
    palmHeight:   "",
    thumbLength:  "",
    indexLength:  "",
    middleLength: "",
    ringLength:   "",
    pinkyLength:  "",
  });

  // Animated pulse for polling indicator
  const pulseAnim = useRef(new Animated.Value(0.4)).current;
  const pollTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const elapsedTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Polling animation ─────────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== "polling") return;
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1,   duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 0.4, duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    ).start();
    return () => pulseAnim.stopAnimation();
  }, [phase]);

  // ── Fetch results once status is "done" ───────────────────────────────────
  const fetchResults = useCallback(async (jid: string) => {
    try {
      const res = await fetch(apiUrl(`/api/v1/tailor/results/${jid}`));
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(`Results fetch failed (${res.status}): ${txt}`);
      }
      const data: MeasurementData = await res.json();
      setRawData(data);
      setMetrics({
        palmWidth:    formatMm(data.palm_width_mm),
        palmHeight:   formatMm(data.palm_length_mm),
        thumbLength:  formatMm(data.thumb_length_mm),
        indexLength:  formatMm(data.index_length_mm),
        middleLength: formatMm(data.middle_length_mm),
        ringLength:   formatMm(data.ring_length_mm),
        pinkyLength:  formatMm(data.pinky_length_mm),
      });
      setPhase("done");
    } catch (err: any) {
      setErrorMsg(err.message || "Could not load measurement results.");
      setPhase("failed");
    }
  }, []);

  // ── Poll status endpoint ──────────────────────────────────────────────────
  const startPolling = useCallback((jid: string) => {
    setPhase("polling");
    setPollElapsed(0);

    // Elapsed counter
    elapsedTimer.current = setInterval(() => {
      setPollElapsed((e) => e + 1);
    }, 1000);

    pollTimer.current = setInterval(async () => {
      setPollElapsed((e) => {
        if (e >= POLL_TIMEOUT_MS / 1000) {
          stopPolling();
          setPhase("timeout");
          setErrorMsg("Processing timed out after 120 seconds. The server may be overloaded.");
        }
        return e;
      });

      try {
        const res = await fetch(apiUrl(`/api/v1/tailor/status/${jid}`));
        if (!res.ok) return;
        const data = await res.json();

        if (data.status === "done") {
          stopPolling();
          await fetchResults(jid);
        } else if (data.status === "failed") {
          stopPolling();
          setErrorMsg(data.error_message || "CV pipeline failed. Please retake the scan.");
          setPhase("failed");
        }
        // "pending" | "processing" → keep polling
      } catch (_e) {
        // Network hiccup — keep polling
      }
    }, POLL_INTERVAL_MS);
  }, [fetchResults]);

  const stopPolling = () => {
    if (pollTimer.current) { clearInterval(pollTimer.current); pollTimer.current = null; }
    if (elapsedTimer.current) { clearInterval(elapsedTimer.current); elapsedTimer.current = null; }
  };

  useEffect(() => {
    return () => stopPolling(); // cleanup on unmount
  }, []);

  // ── Begin polling when job_id becomes available ───────────────────────────
  useEffect(() => {
    if (!jobId) {
      setPhase("waiting");
      return;
    }
    startPolling(jobId);
  }, [jobId]);

  // ── Approve & submit ──────────────────────────────────────────────────────
  const handleApprove = async () => {
    setIsSaving(true);
    try {
      const palmWidth    = parseFloat(metrics.palmWidth);
      const palmHeight   = parseFloat(metrics.palmHeight);
      const thumbLength  = parseFloat(metrics.thumbLength);
      const indexLength  = parseFloat(metrics.indexLength);
      const middleLength = parseFloat(metrics.middleLength);
      const ringLength   = parseFloat(metrics.ringLength);
      const pinkyLength  = parseFloat(metrics.pinkyLength);

      if ([palmWidth, palmHeight, thumbLength, indexLength, middleLength, ringLength, pinkyLength]
          .some((v) => isNaN(v) || v <= 0)) {
        setErrorMsg("Some measurements are missing or invalid. Edit values before approving.");
        setIsSaving(false);
        return;
      }

      const baseWidthFromPalm = (ratio: number) => Number((palmWidth * ratio).toFixed(1));

      const payload = {
        patient_id:    patientId,
        palm_width_mm: palmWidth,
        palm_height_mm: palmHeight,
        finger_metrics: {
          thumb:  { length_mm: thumbLength,  base_width_mm: baseWidthFromPalm(0.22) },
          index:  { length_mm: indexLength,  base_width_mm: baseWidthFromPalm(0.19) },
          middle: { length_mm: middleLength, base_width_mm: baseWidthFromPalm(0.20) },
          ring:   { length_mm: ringLength,   base_width_mm: baseWidthFromPalm(0.185) },
          pinky:  { length_mm: pinkyLength,  base_width_mm: baseWidthFromPalm(0.17) },
        },
      };

      const res = await fetch(apiUrl("/api/v1/tailor/dimensions"), {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(payload),
      });

      if (!res.ok) {
        console.warn("Backend error, proceeding locally:", await res.text());
      }
    } catch (e) {
      console.warn("Telemetry submission failed:", e);
    } finally {
      setIsSaving(false);
      useAppStore.getState().setScanCompleted(true);
      router.replace("/home");
    }
  };

  // ── Subcomponents ─────────────────────────────────────────────────────────

  const bg = isDark ? "#020617" : "#f8fafc";
  const cardBg = isDark ? "#0f172a" : "#ffffff";
  const cardBorder = isDark ? "#1e293b" : "#e2e8f0";
  const textPrimary = isDark ? "#f8fafc" : "#0f172a";
  const textSecondary = isDark ? "#94a3b8" : "#64748b";

  // ── Polling screen ────────────────────────────────────────────────────────
  if (phase === "waiting" || phase === "polling") {
    const steps = [
      { label: "Extracting landmarks",  icon: "hand-back-right", done: pollElapsed > 5 },
      { label: "Estimating depth",       icon: "layers-triple",   done: pollElapsed > 20 },
      { label: "Computing measurements", icon: "ruler",           done: pollElapsed > 40 },
      { label: "Fusing views",           icon: "merge",           done: pollElapsed > 55 },
      { label: "AI calibration",         icon: "brain",           done: pollElapsed > 70 },
    ];

    return (
      <SafeAreaView style={[s.root, { backgroundColor: bg, justifyContent: "center", alignItems: "center" }]}>
        <Animated.View style={{ opacity: pulseAnim, marginBottom: 28 }}>
          <MaterialCommunityIcons name="hand-wave" size={72} color={colors.primary} />
        </Animated.View>

        <Text style={[s.loadingTitle, { color: textPrimary }]}>Analysing Your Hand</Text>
        <Text style={[s.loadingSubtitle, { color: textSecondary }]}>
          {phase === "waiting"
            ? "Waiting for upload to complete…"
            : `Running AI measurement pipeline… (${pollElapsed}s)`}
        </Text>

        <View style={[s.stepsCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
          {steps.map((step) => (
            <View key={step.label} style={s.stepRow}>
              <MaterialCommunityIcons
                name={step.icon as any}
                size={18}
                color={step.done ? "#22c55e" : colors.primary}
                style={{ opacity: step.done ? 1 : 0.5 }}
              />
              <Text style={[s.stepLabel, { color: step.done ? "#22c55e" : textSecondary }]}>
                {step.label}
              </Text>
              {step.done && <MaterialIcons name="check-circle" size={16} color="#22c55e" />}
            </View>
          ))}
        </View>
      </SafeAreaView>
    );
  }

  // ── Error / timeout screen ────────────────────────────────────────────────
  if (phase === "failed" || phase === "timeout") {
    return (
      <SafeAreaView style={[s.root, { backgroundColor: bg, justifyContent: "center", alignItems: "center", paddingHorizontal: 32 }]}>
        <MaterialIcons name="error-outline" size={56} color="#ef4444" style={{ marginBottom: 20 }} />
        <Text style={[s.loadingTitle, { color: textPrimary }]}>
          {phase === "timeout" ? "Processing Timed Out" : "Measurement Failed"}
        </Text>
        <Text style={{ color: "#ef4444", textAlign: "center", marginTop: 12, fontWeight: "600", lineHeight: 22 }}>
          {errorMsg}
        </Text>
        <TouchableOpacity
          style={[s.primaryBtn, { backgroundColor: colors.primary, marginTop: 32 }]}
          onPress={() => router.back()}
        >
          <MaterialIcons name="camera-alt" size={20} color="#fff" />
          <Text style={s.primaryBtnText}>Retake Photos</Text>
        </TouchableOpacity>

        {/* Manual fallback option */}
        <TouchableOpacity
          style={[s.secondaryBtn, { borderColor: colors.primary, marginTop: 16 }]}
          onPress={() => {
            setPhase("done");
            setRawData(null);
          }}
        >
          <Feather name="edit-2" size={16} color={colors.primary} />
          <Text style={[s.secondaryBtnText, { color: colors.primary }]}>Enter Measurements Manually</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // ── Results screen ────────────────────────────────────────────────────────
  const confidence = rawData?.confidence_score ?? 0;
  const gloveSize  = rawData?.glove_calibration?.glove_size;

  return (
    <SafeAreaView style={[s.root, { backgroundColor: bg }]}>
      {/* Header */}
      <View style={[s.header, { borderBottomColor: cardBorder }]}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
          <MaterialIcons name="arrow-back" size={24} color={textPrimary} />
        </TouchableOpacity>
        <Text style={[s.headerTitle, { color: textPrimary }]}>Measurement Results</Text>
        <TouchableOpacity style={s.editBtn} onPress={() => setIsEditing(!isEditing)}>
          <Feather name={isEditing ? "check" : "edit-2"} size={20} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        {/* Confidence badge */}
        {rawData && (
          <View style={[s.confidenceBanner, { backgroundColor: cardBg, borderColor: cardBorder }]}>
            <View style={[s.confidenceDot, { backgroundColor: confidenceBadgeColor(confidence) }]} />
            <View style={{ flex: 1 }}>
              <Text style={[s.confidenceLabel, { color: confidenceBadgeColor(confidence) }]}>
                {confidenceLabel(confidence)}
              </Text>
              <Text style={[s.confidenceSub, { color: textSecondary }]}>
                {rawData.views_used ?? "—"} of {(rawData.views_used ?? 0) + (rawData.views_rejected ?? 0)} views used
                {gloveSize ? `  •  Glove size: ${gloveSize}` : ""}
              </Text>
            </View>
            <Text style={[s.confidenceScore, { color: confidenceBadgeColor(confidence) }]}>
              {(confidence * 100).toFixed(0)}%
            </Text>
          </View>
        )}

        {/* Source notice */}
        {rawData ? (
          <Text style={[s.sourceNote, { color: textSecondary }]}>
            ✓ Auto-extracted by MediaPipe + depth AI pipeline. Tap the pencil icon to correct any value.
          </Text>
        ) : (
          <Text style={[s.sourceNote, { color: "#f59e0b" }]}>
            ⚠ Pipeline unavailable. Please enter measurements manually.
          </Text>
        )}

        {/* Core Measurements */}
        <Text style={[s.sectionLabel, { color: textSecondary }]}>PALM</Text>
        <View style={[s.card, { backgroundColor: cardBg, borderColor: cardBorder }]}>
          <MetricRow
            label="Palm Width"
            value={metrics.palmWidth}
            isEditing={isEditing}
            onChange={(v) => setMetrics((m) => ({ ...m, palmWidth: v }))}
            isDark={isDark}
            confidence={rawData?.confidence_per_key?.palm_width_mm}
            primary={colors.primary}
          />
          <View style={[s.divider, { backgroundColor: cardBorder }]} />
          <MetricRow
            label="Palm Length"
            value={metrics.palmHeight}
            isEditing={isEditing}
            onChange={(v) => setMetrics((m) => ({ ...m, palmHeight: v }))}
            isDark={isDark}
            confidence={rawData?.confidence_per_key?.palm_length_mm}
            primary={colors.primary}
          />
        </View>

        <Text style={[s.sectionLabel, { color: textSecondary }]}>FINGER LENGTHS</Text>
        <View style={[s.card, { backgroundColor: cardBg, borderColor: cardBorder }]}>
          {([
            ["Thumb",  "thumbLength",  "thumb_length_mm"],
            ["Index",  "indexLength",  "index_length_mm"],
            ["Middle", "middleLength", "middle_length_mm"],
            ["Ring",   "ringLength",   "ring_length_mm"],
            ["Pinky",  "pinkyLength",  "pinky_length_mm"],
          ] as [string, keyof EditableMetrics, string][]).map(([label, key, confKey], i, arr) => (
            <React.Fragment key={key}>
              <MetricRow
                label={label}
                value={metrics[key]}
                isEditing={isEditing}
                onChange={(v) => setMetrics((m) => ({ ...m, [key]: v }))}
                isDark={isDark}
                confidence={rawData?.confidence_per_key?.[confKey]}
                primary={colors.primary}
              />
              {i < arr.length - 1 && <View style={[s.divider, { backgroundColor: cardBorder }]} />}
            </React.Fragment>
          ))}
        </View>

        {/* Finger Girths (if available from side view) */}
        {rawData?.finger_girths_mm && Object.values(rawData.finger_girths_mm).some(Boolean) && (
          <>
            <Text style={[s.sectionLabel, { color: textSecondary }]}>FINGER GIRTHS (circumference)</Text>
            <View style={[s.card, { backgroundColor: cardBg, borderColor: cardBorder }]}>
              {Object.entries(rawData.finger_girths_mm).map(([finger, val], i, arr) =>
                val != null ? (
                  <React.Fragment key={finger}>
                    <View style={s.metricRow}>
                      <Text style={[s.metricLabel, { color: isDark ? "#cbd5e1" : "#334155" }]}>
                        {finger.charAt(0).toUpperCase() + finger.slice(1)}
                      </Text>
                      <View style={{ flexDirection: "row", alignItems: "center" }}>
                        <Text style={[s.metricValue, { color: isDark ? "#fff" : "#0f172a" }]}>
                          {(val as number).toFixed(1)}
                        </Text>
                        <Text style={[s.unitLabel, { color: textSecondary }]}>mm</Text>
                      </View>
                    </View>
                    {i < arr.length - 1 && <View style={[s.divider, { backgroundColor: cardBorder }]} />}
                  </React.Fragment>
                ) : null
              )}
            </View>
          </>
        )}

        {/* Glove calibration summary */}
        {gloveSize && (
          <>
            <Text style={[s.sectionLabel, { color: textSecondary }]}>GLOVE CALIBRATION</Text>
            <View style={[s.card, { backgroundColor: cardBg, borderColor: cardBorder, padding: 18 }]}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                <MaterialCommunityIcons name="hand-okay" size={28} color={colors.primary} />
                <View>
                  <Text style={[s.metricLabel, { color: textPrimary, fontSize: 18 }]}>
                    Size: <Text style={{ color: colors.primary, fontWeight: "800" }}>{gloveSize}</Text>
                  </Text>
                  <Text style={[s.unitLabel, { color: textSecondary, marginTop: 2 }]}>
                    {rawData?.glove_calibration?.actuator_positions?.length ?? 0} actuator positions configured
                  </Text>
                </View>
              </View>
            </View>
          </>
        )}

        {/* Approve button */}
        <View style={{ marginTop: 24 }}>
          <TouchableOpacity
            style={[s.primaryBtn, { backgroundColor: isSaving || isEditing ? "#94a3b8" : colors.primary }]}
            onPress={handleApprove}
            disabled={isEditing || isSaving}
          >
            {isSaving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <MaterialIcons name="check-circle-outline" size={22} color="#fff" />
            )}
            <Text style={s.primaryBtnText}>
              {isEditing ? "Save Edits First" : isSaving ? "Saving…" : "Approve & Proceed"}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ── MetricRow ─────────────────────────────────────────────────────────────────

function MetricRow({
  label, value, isEditing, onChange, isDark, confidence, primary,
}: {
  label: string;
  value: string;
  isEditing: boolean;
  onChange: (val: string) => void;
  isDark: boolean;
  confidence?: number;
  primary: string;
}) {
  const hasConfidence = confidence !== undefined && confidence > 0;
  return (
    <View style={s.metricRow}>
      <View style={{ flex: 1 }}>
        <Text style={[s.metricLabel, { color: isDark ? "#cbd5e1" : "#334155" }]}>{label}</Text>
        {hasConfidence && (
          <View style={[s.confPill, { backgroundColor: confidenceBadgeColor(confidence!) + "22" }]}>
            <Text style={[s.confPillText, { color: confidenceBadgeColor(confidence!) }]}>
              {(confidence! * 100).toFixed(0)}% conf
            </Text>
          </View>
        )}
      </View>
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        {isEditing ? (
          <TextInput
            style={[
              s.metricInput,
              {
                color: isDark ? "#fff" : "#0f172a",
                backgroundColor: isDark ? "#1e293b" : "#f1f5f9",
                borderColor: primary,
              },
            ]}
            value={value}
            onChangeText={onChange}
            keyboardType="decimal-pad"
            selectTextOnFocus
          />
        ) : (
          <Text style={[s.metricValue, { color: isDark ? "#fff" : "#0f172a" }]}>
            {value || "—"}
          </Text>
        )}
        <Text style={[s.unitLabel, { color: isDark ? "#64748b" : "#94a3b8" }]}>mm</Text>
      </View>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  backBtn: { padding: 8 },
  editBtn: { padding: 8 },
  headerTitle: { fontSize: 18, fontWeight: "700" },
  scroll: { padding: 20, paddingBottom: 48 },

  // Loading
  loadingTitle: { fontSize: 22, fontWeight: "800", textAlign: "center" },
  loadingSubtitle: { fontSize: 14, textAlign: "center", marginTop: 8, marginBottom: 28, paddingHorizontal: 32 },
  stepsCard: {
    width: "85%",
    borderRadius: 16,
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    gap: 14,
  },
  stepRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  stepLabel: { flex: 1, fontSize: 14, fontWeight: "500" },

  // Confidence
  confidenceBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 12,
  },
  confidenceDot: { width: 12, height: 12, borderRadius: 6 },
  confidenceLabel: { fontSize: 14, fontWeight: "700" },
  confidenceSub: { fontSize: 12, marginTop: 2 },
  confidenceScore: { fontSize: 22, fontWeight: "900" },
  sourceNote: { fontSize: 13, lineHeight: 18, marginBottom: 20 },

  // Section
  sectionLabel: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1.5,
    marginTop: 10,
    marginBottom: 8,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
    marginBottom: 20,
  },
  metricRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  metricLabel: { fontSize: 16, fontWeight: "600" },
  metricValue: { fontSize: 18, fontWeight: "700", marginRight: 6 },
  metricInput: {
    fontSize: 16,
    fontWeight: "600",
    borderWidth: 1.5,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    width: 80,
    textAlign: "right",
    marginRight: 6,
  },
  unitLabel: { fontSize: 14, fontWeight: "500" },
  divider: { height: 1 },
  confPill: {
    alignSelf: "flex-start",
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginTop: 3,
  },
  confPillText: { fontSize: 10, fontWeight: "700" },

  // Buttons
  primaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 18,
    borderRadius: 16,
  },
  primaryBtnText: { color: "#fff", fontSize: 17, fontWeight: "700" },
  secondaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  secondaryBtnText: { fontSize: 15, fontWeight: "600" },
});
