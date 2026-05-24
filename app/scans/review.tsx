import React from "react";
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";

import { useAppTheme } from "../../lib/theme";
import { useAppStore } from "../../store/useAppStore";

const STEP_LABELS: { id: string; title: string }[] = [
  { id: "wrist",         title: "Wrist Profile"     },
  { id: "palm-front",   title: "Open Palm"          },
  { id: "palm-side",    title: "Side Profile"       },
  { id: "fingers",      title: "Extended Fingers"   },
  { id: "fist",         title: "Closed Fist"        },
  { id: "wrist-rotation", title: "Tendon Rotation"  },
  { id: "thumb",        title: "Thumb Profile"      },
  { id: "back-hand",    title: "Back of Hand"       },
];

export default function ReviewCapturesScreen() {
  const router = useRouter();
  const colors = useAppTheme();
  const gloveHand = useAppStore((state) => state.glove_hand) || "right";
  // Get the actual captured photos from store
  const scanCaptures = useAppStore((state) => state.scan_captures) as Record<string, string>;

  const capturedCount = Object.keys(scanCaptures).length;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <MaterialIcons name="arrow-back" size={24} color={colors.primary} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.primary }]}>Review Scan</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Title block */}
        <View style={styles.titleBlock}>
          <Text style={[styles.titleText, { color: colors.text }]}>Review Captures</Text>
          <Text style={[styles.subtitleText, { color: colors.secondaryText }]}>
            {capturedCount} of 8 frames captured for your {gloveHand} hand scan.
            {capturedCount === 8 ? " All frames uploaded successfully." : " Incomplete scan."}
          </Text>
        </View>

        {/* Status banner */}
        <View style={[styles.statusBanner, { backgroundColor: capturedCount === 8 ? "#0d7a3a" : "#7a4d0d" }]}>
          <MaterialIcons
            name={capturedCount === 8 ? "check-circle" : "warning"}
            size={20}
            color="#fff"
          />
          <Text style={styles.statusText}>
            {capturedCount === 8
              ? "✓ Scan complete — ready for measurement extraction"
              : `${8 - capturedCount} frames missing — please rescan`}
          </Text>
        </View>

        {/* Frame cards */}
        <View style={styles.grid}>
          {STEP_LABELS.map((step, idx) => {
            const capturedUri = scanCaptures[step.id];
            const isCaptured = !!capturedUri;

            return (
              <View
                key={step.id}
                style={[styles.card, { backgroundColor: colors.card, borderColor: isCaptured ? colors.primary : colors.border }]}
              >
                {/* Photo */}
                <View style={styles.imageContainer}>
                  {isCaptured ? (
                    <Image
                      source={{ uri: capturedUri }}
                      style={styles.photo}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={[styles.missingPhoto, { borderColor: colors.border }]}> 
                      <MaterialIcons name="photo-camera-back" size={34} color={colors.secondaryText} />
                      <Text style={[styles.missingPhotoText, { color: colors.secondaryText }]}>Capture missing</Text>
                    </View>
                  )}
                  {/* Step number badge */}
                  <View style={[styles.stepBadge, { backgroundColor: colors.primary }]}>
                    <Text style={styles.stepBadgeText}>{idx + 1}</Text>
                  </View>
                  {/* Captured checkmark */}
                  {isCaptured && (
                    <View style={styles.checkBadge}>
                      <MaterialIcons name="check-circle" size={28} color="#00e676" />
                    </View>
                  )}
                  {/* "YOUR PHOTO" label for actual captures */}
                  {isCaptured && (
                    <View style={[styles.yourPhotoLabel, { backgroundColor: colors.primary }]}>
                      <Text style={styles.yourPhotoText}>YOUR PHOTO</Text>
                    </View>
                  )}
                </View>

                {/* Info row */}
                <View style={styles.cardFooter}>
                  <View>
                    <Text style={[styles.cardTitle, { color: colors.text }]}>{step.title}</Text>
                    <Text style={[styles.cardSub, { color: isCaptured ? "#00c853" : colors.secondaryText }]}>
                      {isCaptured ? "Captured & uploaded" : "Not captured"}
                    </Text>
                  </View>
                  <Pressable
                    onPress={() => router.push("/scans/camera")}
                    style={[styles.retakeBtn, { borderColor: colors.border }]}
                  >
                    <MaterialIcons name="replay" size={14} color={colors.primary} />
                    <Text style={[styles.retakeText, { color: colors.primary }]}>RETAKE</Text>
                  </Pressable>
                </View>
              </View>
            );
          })}
        </View>

        {/* Action buttons */}
        <View style={styles.actions}>
          <Pressable
            style={[styles.primaryBtn, { backgroundColor: colors.primary }]}
            onPress={() => router.push("/scans/processing")}
          >
            <MaterialIcons name="straighten" size={22} color="#fff" />
            <Text style={styles.primaryBtnText}>Extract Measurements</Text>
          </Pressable>
          <Pressable
            style={[styles.secondaryBtn, { borderColor: colors.border }]}
            onPress={() => router.replace("/home")}
          >
            <Text style={[styles.secondaryBtnText, { color: colors.text }]}>Back to Home</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 52,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  backBtn: { padding: 8, borderRadius: 20 },
  headerTitle: { fontSize: 20, fontWeight: "700" },
  headerSpacer: { width: 40 },

  scroll: { padding: 20, paddingBottom: 48, gap: 16 },

  titleBlock: { gap: 6 },
  titleText: { fontSize: 28, fontWeight: "800" },
  subtitleText: { fontSize: 15, lineHeight: 22 },

  statusBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 14,
    borderRadius: 14,
  },
  statusText: { color: "#fff", fontSize: 14, fontWeight: "600", flex: 1 },

  grid: { gap: 16 },
  card: {
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: 2,
  },
  imageContainer: {
    height: 200,
    position: "relative",
    backgroundColor: "#111",
  },
  photo: { width: "100%", height: "100%" },
  missingPhoto: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1,
    borderStyle: "dashed",
  },
  missingPhotoText: { fontSize: 14, fontWeight: "600" },
  stepBadge: {
    position: "absolute",
    top: 12,
    left: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  stepBadgeText: { color: "#fff", fontSize: 14, fontWeight: "800" },
  checkBadge: {
    position: "absolute",
    top: 10,
    right: 10,
  },
  yourPhotoLabel: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingVertical: 6,
    alignItems: "center",
  },
  yourPhotoText: { color: "#fff", fontSize: 11, fontWeight: "700", letterSpacing: 2 },

  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
  },
  cardTitle: { fontSize: 16, fontWeight: "700" },
  cardSub: { fontSize: 13, marginTop: 2 },
  retakeBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  retakeText: { fontSize: 12, fontWeight: "700" },

  actions: { gap: 12, marginTop: 8 },
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
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  secondaryBtnText: { fontSize: 16, fontWeight: "600" },
});
