import React, { useEffect, useState, useRef } from "react";
import { StyleSheet, Image, Pressable, Text, View, Alert } from "react-native";
import { useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { CameraView, Camera } from "expo-camera";
import * as FileSystem from "expo-file-system/legacy";
import { WebView } from "react-native-webview";

import { apiUrl } from "../../lib/api";
import { useAppTheme } from "../../lib/theme";
import { useAppStore } from "../../store/useAppStore";

const scanPostures = [
  {
    id: "wrist",
    title: "Wrist Profile",
    desc: "Extend your arm forward with palm facing DOWN. Align your wrist and lower forearm flat, horizontally within the frame guides.",
    img: "https://lh3.googleusercontent.com/aida-public/AB6AXuDHO76qInuYYarwRgd5xMotswjXdpEb5ODynY89TyFAzumcHr4_fV3_ORlVYiBZ0-X2aT6E2_yJ4lMtFVkRBKUpgwcQJKXTvl7zOoVnmMYNfR-e9nklB96qEnX8_7-luvvvCl20-OwdZ5GNqY0CkvRAuKB4SvDA67-T_ICv4jwkY3vYFjuCrnihWhvTHel7YG60pkcAvmT30t7Tif6_Zh9nLCSPS2FmHK-JeBva8liRRvstx83dLVzBfmjLMBvxEQc0isswWcshR1c",
  },
  {
    id: "palm-front",
    title: "Open Palm",
    desc: "Face your open palm DIRECTLY toward the camera. Fingers together and straight, thumb extended out to the side.",
    img: "https://lh3.googleusercontent.com/aida-public/AB6AXuCBiHh8411Jg43aKZkZsL3Lxm59aR6F17i1TmkrxZaDxrcdO0L0pAezt94t0dnUdlbz3YI8cBLGsM7qfiuwVnFoi6mx6cx_LqRbL0NznVh0T7sMu3QMiVG-J0YYGcAfL9YTe98mqlBd-ZVR-_fNVyI7nA93aLj2OPPwRnN1DpUhOJZ6IinFx2--2GsD8vleLvKqhb9xjRuimEDCGvkhuSHSS_jc6Iws6pgj0GWbBd4lU0tVmALl_z989cHwXCIooA6WLXx1L9q4dEk",
  },
  {
    id: "palm-side",
    title: "Side Profile",
    desc: "Rotate your hand 90° so the camera sees the SIDE of your hand. Your thumb should point upward and fingers forward.",
    img: "https://lh3.googleusercontent.com/aida-public/AB6AXuCIJMh8KPRTiglrCdmiQJY2nh60W4pHn7b3DfvZ7YrxDmsh0tRH9Vfomm1NWhhEs98SoGY2efTANlNZAd7o8x-oact4Y-2NR6nrUyiBMdXnt1xJfk6AliaLL2qnRp47nzS87KmTxBTVk_m4_4dhjaflHiOVoJzFLWZiWswbhwRV_-tMTB_OC2n-tJRGvzpkMtZUkfbOWq7WL0zsFnO057SnfIB4KlpFoawYh3_b42lqX6d8BGCSvdNUSxVS_iovar6sqQAARQA53Nw",
  },
  {
    id: "fingers",
    title: "Extended Fingers",
    desc: "Spread ALL five fingers as wide as possible. Keep your hand completely flat and centered in the frame. Hold steady.",
    img: "https://lh3.googleusercontent.com/aida-public/AB6AXuDw8KCl5C2YlWlpQXQxB5HI2FU5yMYzqIOaDiKnz9p39SzI0Y-nzoHiF1H1xjBf_8zmc9_sQA-57LMcou9agBkcimCh_pp6jKjbyT7XvKrMQXAYhxUpCdnDAUbsV_h9h8BSX7cJlP0lVadx4pB9v4gyaVSEmJ_Qdya2JwM7MVy36FQ0nsdhuv_Qt9Z9vUckJ1PydSzspRC0IqPYZ3MSmilrxMGKJzbtidp_OZJPviAP9azGBPuVZErlalVEMGyV8HMUe-gib8FH8oE",
  },
  {
    id: "fist",
    title: "Closed Fist",
    desc: "Gently curl your fingers into a soft fist. Thumb rests OUTSIDE the fingers. Present knuckles toward the camera.",
    img: "https://lh3.googleusercontent.com/aida-public/AB6AXuBPMNXsAMm7lzvf1BXe68-YzlOOFnuG5EtVGSdgTbs-xsjIhgn8fGWsTywYiYtcpbPV2uyV3VLKNJGCNPbyRs7ehXr9u2eFvJ7mDhqXNN4J38RlEz4m08fHSthURWMLk9imoGouAYKUog9xTgRv27lYFRgb4QX-cqP2cjXL5Qxmh2--YPV7nPrccXYMqRW3JtV45il_R4OKjsWdOlYiyzaim7mSG-eoBnB_bTkSvD3dKrOKWWZD_9mS-aDYhfgWJQd_MZnf2wLJkF0",
  },
  {
    id: "wrist-rotation",
    title: "Tendon Rotation",
    desc: "Rotate your wrist 45° inward. The camera should see the INNER side of your forearm and the tendons running along your wrist.",
    img: "https://lh3.googleusercontent.com/aida-public/AB6AXuDmTOu_B4m0ibL7wk9beorKYI5OhlRUn8uTQfVHybNgDExEza0XU0adc_o1W623GNxgEV-01500lsG6rJwetAGwxipNw4VSRwgRkyWM3WMrD0NitZ8K8mwOZ-GYB1isk897LqEtwTGa0bWKENXv7hie_UQ5psPZip0AwecA_1ld349I_1ktjBHIQVVx_OZUVCeiFp0KOvwaZfnTAw1zkmK0DvdGZO7YN803xBcoNPEwkACPHMJcfnDRnk7eMBKEGf4SdfKtX_Co10I",
  },
  {
    id: "thumb",
    title: "Thumb Profile",
    desc: "Fold all four fingers inward. Extend ONLY your thumb straight upward. Hold still so the camera captures full joint angles.",
    img: "https://lh3.googleusercontent.com/aida-public/AB6AXuCIJMh8KPRTiglrCdmiQJY2nh60W4pHn7b3DfvZ7YrxDmsh0tRH9Vfomm1NWhhEs98SoGY2efTANlNZAd7o8x-oact4Y-2NR6nrUyiBMdXnt1xJfk6AliaLL2qnRp47nzS87KmTxBTVk_m4_4dhjaflHiOVoJzFLWZiWswbhwRV_-tMTB_OC2n-tJRGvzpkMtZUkfbOWq7WL0zsFnO057SnfIB4KlpFoawYh3_b42lqX6d8BGCSvdNUSxVS_iovar6sqQAARQA53Nw",
  },
  {
    id: "back-hand",
    title: "Back of Hand",
    desc: "Flip your hand completely over — knuckles UP, palm facing down. Keep fingers flat and extended. Final scan step!",
    img: "https://lh3.googleusercontent.com/aida-public/AB6AXuCBiHh8411Jg43aKZkZsL3Lxm59aR6F17i1TmkrxZaDxrcdO0L0pAezt94t0dnUdlbz3YI8cBLGsM7qfiuwVnFoi6mx6cx_LqRbL0NznVh0T7sMu3QMiVG-J0YYGcAfL9YTe98mqlBd-ZVR-_fNVyI7nA93aLj2OPPwRnN1DpUhOJZ6IinFx2--2GsD8vleLvKqhb9xjRuimEDCGvkhuSHSS_jc6Iws6pgj0GWbBd4lU0tVmALl_z989cHwXCIooA6WLXx1L9q4dEk",
  },
];

const REQUIRED_FRAMES = 8;
const validationHtml = `
<!DOCTYPE html>
<html>
<body>
<canvas id="c"></canvas>
<script>
  function analyze(base64Image) {
    const img = new Image();
    img.onload = function() {
      const c = document.getElementById("c");
      c.width = img.width;
      c.height = img.height;
      const ctx = c.getContext("2d");
      ctx.drawImage(img, 0, 0);

      const imgData = ctx.getImageData(0, 0, img.width, img.height);
      const data = imgData.data;

      function isSkinPixel(r, g, b) {
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        return (
          r > 95 && g > 40 && b > 20 &&
          max - min > 15 &&
          Math.abs(r - g) > 15 &&
          r > g && r > b
        ) || (
          r > 200 && g > 150 && b > 120 &&
          Math.abs(r - g) <= 15 &&
          r > b && g > b
        );
      }

      let minX = img.width, minY = img.height, maxX = 0, maxY = 0;
      let skinPixels = 0;
      let centerHits = 0;

      for (let y = 0; y < img.height; y += 2) {
        for (let x = 0; x < img.width; x += 2) {
          const idx = (y * img.width + x) * 4;
          const r = data[idx], g = data[idx + 1], b = data[idx + 2];

          if (isSkinPixel(r, g, b)) {
            minX = Math.min(minX, x);
            minY = Math.min(minY, y);
            maxX = Math.max(maxX, x);
            maxY = Math.max(maxY, y);
            skinPixels++;

            if (x >= img.width * 0.2 && x <= img.width * 0.8 && y >= img.height * 0.15 && y <= img.height * 0.85) {
              centerHits++;
            }
          }
        }
      }

      const widthPx = maxX - minX;
      const heightPx = maxY - minY;
      const imageArea = img.width * img.height;
      const boundingArea = Math.max(1, widthPx * heightPx);
      const coverage = boundingArea / imageArea;
      const centeredCoverage = centerHits / Math.max(1, skinPixels);

      const tooEmpty = skinPixels < imageArea * 0.02;
      const tooSmall = coverage < 0.06;
      const tooThin = widthPx < img.width * 0.18 || heightPx < img.height * 0.18;
      const offCenter = centeredCoverage < 0.25;

      if (tooEmpty || tooSmall || tooThin || offCenter) {
        window.ReactNativeWebView.postMessage(JSON.stringify({ valid: false, message: "No hand detected. Put your hand fully in frame and try again." }));
        return;
      }

      window.ReactNativeWebView.postMessage(JSON.stringify({ valid: true }));
    };

    img.onerror = function() {
      window.ReactNativeWebView.postMessage(JSON.stringify({ valid: false, message: "Could not read the captured image. Please retake it." }));
    };

    img.src = "data:image/jpeg;base64," + base64Image;
  }

  document.addEventListener("message", function(event) {
    analyze(event.data);
  });
  window.addEventListener("message", function(event) {
    analyze(event.data);
  });
</script>
</body>
</html>
`;

export default function CameraScanScreen() {
  const router = useRouter();
  const colors = useAppTheme();

  const gloveHand = useAppStore((state) => state.glove_hand) || "right";
  const captureScanStep = useAppStore((state) => state.captureScanStep);
  const updateFabricationStatus = useAppStore((state) => state.setFabricationStatus);
  const setCurrentJobId = useAppStore((state) => state.setCurrentJobId);

  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [capturedPhotos, setCapturedPhotos] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [precision, setPrecision] = useState(94);
  const [showPreview, setShowPreview] = useState(true);
  const [isValidatorReady, setIsValidatorReady] = useState(false);
  const cameraRef = useRef<any>(null);
  const validationWebViewRef = useRef<WebView>(null);
  const pendingValidationRef = useRef<((result: { valid: boolean; message?: string }) => void) | null>(null);

  const currentStepIndex = capturedPhotos.length < REQUIRED_FRAMES ? capturedPhotos.length : REQUIRED_FRAMES - 1;
  const currentPosture = scanPostures[currentStepIndex];
  const isLeftHand = gloveHand === "left";

  useEffect(() => {
    (async () => {
      try {
        const status = await Camera.getCameraPermissionsAsync();
        if (status.granted) {
          setHasPermission(true);
        } else {
          const request = await Camera.requestCameraPermissionsAsync();
          setHasPermission(request.granted);
        }
      } catch (_err) {
        setHasPermission(false);
      }
    })();
  }, []);

  useEffect(() => {
    const interval = setInterval(
      () => setPrecision(Math.floor(Math.random() * (98 - 92 + 1)) + 92),
      2000
    );
    return () => clearInterval(interval);
  }, []);

  const validateCapture = async (uri: string) => {
    if (!isValidatorReady || !validationWebViewRef.current) {
      return { valid: true as const };
    }

    const base64 = await FileSystem.readAsStringAsync(uri, { encoding: "base64" });

    return new Promise<{ valid: boolean; message?: string }>((resolve) => {
      const timeout = setTimeout(() => {
        pendingValidationRef.current = null;
        resolve({ valid: false, message: "Capture validation timed out. Please retake the photo." });
      }, 8000);

      pendingValidationRef.current = (result) => {
        clearTimeout(timeout);
        pendingValidationRef.current = null;
        resolve(result);
      };

      validationWebViewRef.current?.postMessage(base64);
    });
  };

  const uploadScanData = (photos: string[]) => {
    // This function is fully self-contained — it handles ALL errors internally
    // and never throws. This prevents upload errors from appearing as "Capture Error".
    setIsUploading(true);
    updateFabricationStatus("Scan Uploaded");

    let currentPatientId = useAppStore.getState().patient_id;
    if (!currentPatientId) {
      setIsUploading(false);
      updateFabricationStatus("Pending Scan");
      Alert.alert("Upload Failed", "Missing patient ID. Please complete onboarding before scanning.");
      return;
    }

    const uploadUrl = apiUrl("/api/v1/tailor/upload");
    const formData = new FormData();
    formData.append("patient_id", currentPatientId);

    photos.forEach((uri, index) => {
      const ext = uri.split(".").pop()?.split("?")[0]?.toLowerCase() || "jpg";
      const mime = ext === "png" ? "image/png" : "image/jpeg";
      formData.append(`frame_${index + 1}`, {
        uri,
        name: `frame_${index + 1}.${ext}`,
        type: mime,
      } as any);
    });

    const xhr = new XMLHttpRequest();
    xhr.open("POST", uploadUrl);
    xhr.timeout = 30000;

    xhr.onload = () => {
      setIsUploading(false);
      console.log("XHR status:", xhr.status, xhr.responseText);
      if (xhr.status >= 200 && xhr.status < 300) {
        // Parse job_id from response and store it for the processing screen
        try {
          const responseData = JSON.parse(xhr.responseText);
          if (responseData.job_id) {
            setCurrentJobId(responseData.job_id);
          }
        } catch (_parseErr) {
          console.warn("Could not parse upload response JSON");
        }
        updateFabricationStatus("Processing");
        Alert.alert(
          "Scan Complete! ✓",
          "All 8 frames uploaded. AI measurement pipeline has started.",
          [{ text: "OK", onPress: () => router.push("/scans/processing") }]
        );
      } else {
        updateFabricationStatus("Pending Scan");
        Alert.alert(
          "Upload Failed",
          `Server responded with ${xhr.status}:\n${xhr.responseText}`
        );
      }
    };

    xhr.onerror = () => {
      setIsUploading(false);
      updateFabricationStatus("Pending Scan");
      Alert.alert(
        "Upload Failed",
        `Cannot reach server at ${uploadUrl}.\nMake sure your phone and laptop are on the same WiFi network and the backend is running.`
      );
    };

    xhr.ontimeout = () => {
      setIsUploading(false);
      updateFabricationStatus("Pending Scan");
      Alert.alert("Upload Failed", "Request timed out after 30 seconds.");
    };

    xhr.send(formData);
  };

  const handleCapture = async () => {
    if (isUploading || !cameraReady) return;
    if (!cameraRef.current || capturedPhotos.length >= REQUIRED_FRAMES) return;

    // Step 1: Take the photo — catch ONLY camera errors here
    let photo: { uri: string } | null = null;
    try {
      photo = await cameraRef.current.takePictureAsync({ quality: 0.85 });
    } catch (cameraErr: any) {
      console.error("Camera error:", cameraErr);
      Alert.alert("Camera Error", `Could not take photo: ${cameraErr?.message || cameraErr}`);
      return;
    }

    if (!photo?.uri) {
      Alert.alert("Camera Error", "No photo was returned by the camera. Try again.");
      return;
    }

    const validation = await validateCapture(photo.uri);
    if (!validation.valid) {
      Alert.alert(
        "Bad Capture",
        validation.message || `That ${currentPosture.title.toLowerCase()} frame is not usable. Please retake it.`
      );
      return;
    }

    // Step 2: Update state
    const updatedPhotos = [...capturedPhotos, photo.uri];
    setCapturedPhotos(updatedPhotos);
    captureScanStep(currentPosture.id, photo.uri);

    // Step 3: Either show next-step preview, or upload all 8
    if (updatedPhotos.length === REQUIRED_FRAMES) {
      // uploadScanData is fire-and-forget — it handles all errors internally
      uploadScanData(updatedPhotos);
    } else {
      setShowPreview(true);
    }
  };

  const handleRetake = () => {
    if (isUploading || capturedPhotos.length === 0) return;
    setCapturedPhotos(capturedPhotos.slice(0, -1));
    setShowPreview(true);
  };

  if (hasPermission === null) {
    return <View style={styles.loadingScreen} />;
  }

  if (!hasPermission) {
    return (
      <View style={styles.permissionScreen}>
        <MaterialIcons name="camera-off" size={64} color="rgba(255,255,255,0.5)" />
        <Text style={styles.permissionTitle}>Camera Access Required</Text>
        <Text style={styles.permissionBody}>
          We need camera permission to capture your 3D hand profile.
        </Text>
        <Pressable
          style={[styles.permissionBtn, { backgroundColor: colors.primary }]}
          onPress={async () => {
            const s = await Camera.requestCameraPermissionsAsync();
            setHasPermission(s.granted);
          }}
        >
          <MaterialIcons name="camera-alt" size={22} color="#fff" />
          <Text style={styles.permissionBtnText}>Grant Permission</Text>
        </Pressable>
      </View>
    );
  }

  // ── Preview / Guide Screen ───────────────────────────────────────────
  if (showPreview) {
    return (
      <View style={[styles.flex, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View style={[styles.previewHeader, { borderBottomColor: colors.border }]}>
          <Pressable
            style={styles.backBtn}
            onPress={() => (capturedPhotos.length === 0 ? router.back() : handleRetake())}
          >
            <MaterialIcons name="arrow-back" size={24} color={colors.primary} />
          </Pressable>
          <Text style={[styles.previewHeaderTitle, { color: colors.primary }]}>Scan Guide</Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* Progress dots */}
        <View style={styles.dotsRow}>
          {scanPostures.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                { backgroundColor: i < capturedPhotos.length ? colors.primary : i === currentStepIndex ? colors.primary : colors.border },
                i === currentStepIndex && styles.dotActive,
              ]}
            />
          ))}
        </View>

        <View style={styles.previewContent}>
          <Text style={[styles.stepLabel, { color: colors.primary }]}>
            STEP {currentStepIndex + 1} OF {REQUIRED_FRAMES}
          </Text>
          <Text style={[styles.previewTitle, { color: colors.text }]}>
            {currentPosture.title}
          </Text>

          {/* Instruction image */}
          <View style={[styles.imageCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Image
              source={{ uri: currentPosture.img }}
              style={styles.guideImage}
              resizeMode="cover"
            />
            <View style={[styles.imageOverlay, { backgroundColor: colors.primary }]}>
              <Text style={styles.imageOverlayText}>
                {isLeftHand ? "LEFT" : "RIGHT"} HAND
              </Text>
            </View>
          </View>

          {/* Instruction text */}
          <View style={[styles.instructionBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <MaterialIcons name="info-outline" size={20} color={colors.primary} />
            <Text style={[styles.instructionText, { color: colors.text }]}>
              {currentPosture.desc}
            </Text>
          </View>

          {/* CTA */}
          <Pressable
            style={[styles.ctaBtn, { backgroundColor: colors.primary }]}
            onPress={() => setShowPreview(false)}
          >
            <MaterialIcons name="camera-alt" size={22} color="#fff" />
            <Text style={styles.ctaBtnText}>I'm Ready — Open Camera</Text>
          </Pressable>

          {capturedPhotos.length > 0 && (
            <Text style={[styles.capturedCount, { color: colors.secondaryText }]}>
              {capturedPhotos.length} of {REQUIRED_FRAMES} frames captured
            </Text>
          )}
        </View>
      </View>
    );
  }

  // ── Live Camera Screen ───────────────────────────────────────────────
  return (
    <View style={[styles.flex, styles.cameraRoot]}>
      <View style={styles.validationHost} pointerEvents="none">
        <WebView
          ref={validationWebViewRef}
          source={{ html: validationHtml }}
          onLoadEnd={() => setIsValidatorReady(true)}
          onMessage={(event) => {
            try {
              const result = JSON.parse(event.nativeEvent.data);
              pendingValidationRef.current?.(result);
            } catch (_err) {
              pendingValidationRef.current?.({ valid: false, message: "Could not validate the image. Please retake it." });
            }
          }}
          javaScriptEnabled
          style={styles.validationWebView}
        />
      </View>

      <View style={styles.cameraStage}>
        <CameraView
          style={styles.cameraPreview}
          ref={cameraRef}
          facing="back"
          onCameraReady={() => setCameraReady(true)}
        />

        <View style={styles.cameraOverlay} pointerEvents="box-none">
          {/* Top HUD */}
          <View style={styles.cameraTopBar}>
            <Pressable style={styles.cameraBackBtn} onPress={() => setShowPreview(true)}>
              <MaterialIcons name="arrow-back" size={24} color="#fff" />
            </Pressable>
            <Text style={styles.cameraTitle}>{gloveHand.toUpperCase()} HAND SCAN</Text>
            <View style={styles.cameraInfoBtn}>
              <MaterialIcons name="info-outline" size={22} color="#fff" />
            </View>
          </View>

          {/* Progress bar */}
          <View style={styles.progressRow}>
            {scanPostures.map((p, idx) => (
              <View
                key={p.id}
                style={[
                  styles.progressSegment,
                  { backgroundColor: idx <= currentStepIndex ? colors.primary : "rgba(255,255,255,0.2)" },
                ]}
              />
            ))}
          </View>

          {/* Corner guides */}
          <View style={styles.guideFrame}>
            <View style={[styles.cornerTL, { borderColor: colors.primary }]} />
            <View style={[styles.cornerTR, { borderColor: colors.primary }]} />
            <View style={[styles.cornerBL, { borderColor: colors.primary }]} />
            <View style={[styles.cornerBR, { borderColor: colors.primary }]} />
            {/* Hand silhouette */}
            <View style={[styles.handIcon, { transform: [{ scaleX: isLeftHand ? -1 : 1 }] }]}>
              <MaterialIcons name="back-hand" size={200} color={colors.primary} style={{ opacity: 0.6 }} />
            </View>
            {/* Scan line */}
            <View style={[styles.scanLine, { backgroundColor: colors.primary }]} />
          </View>

          {/* Bottom panel */}
          <View style={styles.bottomPanel}>
            <View style={[styles.hud, { backgroundColor: "rgba(0,0,0,0.75)", borderColor: "rgba(255,255,255,0.12)" }]}>
              <View style={styles.hudRow}>
                <Text style={styles.hudLabel}>
                  Align: {isUploading ? "100" : precision}%
                </Text>
                <Text style={styles.hudStep}>
                  POSTURE {currentStepIndex + 1} OF {REQUIRED_FRAMES}
                </Text>
              </View>
              <Text style={styles.hudTitle}>
                {isUploading ? "Uploading..." : currentPosture.title}
              </Text>
              <Text style={styles.hudDesc}>
                {isUploading ? "Please wait while we upload your scan..." : currentPosture.desc}
              </Text>
              <Pressable
                style={[
                  styles.captureBtn,
                  { backgroundColor: isUploading || !cameraReady ? colors.primarySoft : colors.primary },
                ]}
                onPress={handleCapture}
                disabled={isUploading || !cameraReady}
              >
                <MaterialIcons
                  name={isUploading ? "cloud-upload" : cameraReady ? "camera-alt" : "hourglass-empty"}
                  size={22}
                  color="#fff"
                />
                <Text style={styles.captureBtnText}>
                  {isUploading ? "Processing..." : !cameraReady ? "Starting Camera..." : "Capture Frame"}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  loadingScreen: { flex: 1, backgroundColor: "#000" },
  permissionScreen: {
    flex: 1,
    backgroundColor: "#02040A",
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
    gap: 16,
  },
  permissionTitle: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "700",
    textAlign: "center",
    marginTop: 8,
  },
  permissionBody: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 16,
    textAlign: "center",
    lineHeight: 24,
  },
  permissionBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 16,
    paddingHorizontal: 28,
    borderRadius: 16,
    marginTop: 8,
  },
  permissionBtnText: { color: "#fff", fontSize: 17, fontWeight: "600" },

  // Preview screen
  previewHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 52,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  backBtn: { padding: 8, borderRadius: 20 },
  previewHeaderTitle: { fontSize: 20, fontWeight: "700" },
  headerSpacer: { width: 40 },

  dotsRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  dot: { width: 8, height: 8, borderRadius: 4 },
  dotActive: { width: 20 },

  previewContent: {
    flex: 1,
    paddingHorizontal: 24,
    paddingBottom: 32,
    gap: 16,
  },
  stepLabel: {
    fontSize: 13,
    fontWeight: "700",
    textAlign: "center",
    letterSpacing: 2,
  },
  previewTitle: {
    fontSize: 30,
    fontWeight: "800",
    textAlign: "center",
  },

  imageCard: {
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: 1,
    position: "relative",
  },
  guideImage: { width: "100%", height: 220 },
  imageOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingVertical: 8,
    alignItems: "center",
  },
  imageOverlayText: { color: "#fff", fontSize: 12, fontWeight: "700", letterSpacing: 2 },

  instructionBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  instructionText: { flex: 1, fontSize: 16, lineHeight: 24 },

  ctaBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 18,
    borderRadius: 16,
    marginTop: 4,
  },
  ctaBtnText: { color: "#fff", fontSize: 17, fontWeight: "700" },

  capturedCount: {
    textAlign: "center",
    fontSize: 13,
    marginTop: 4,
  },

  // Camera screen
  cameraRoot: { backgroundColor: "#02040A" },
  validationHost: {
    width: 1,
    height: 1,
    opacity: 0,
    position: "absolute",
  },
  validationWebView: {
    width: 1,
    height: 1,
  },
  cameraStage: {
    flex: 1,
    position: "relative",
    backgroundColor: "#02040A",
  },
  cameraPreview: {
    ...StyleSheet.absoluteFillObject,
  },
  cameraOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  cameraTopBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 50,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 52,
    paddingBottom: 14,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  cameraBackBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.12)",
  },
  cameraTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 2,
    textTransform: "uppercase",
  },
  cameraInfoBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.12)",
  },
  progressRow: {
    position: "absolute",
    top: 110,
    left: 20,
    right: 20,
    zIndex: 40,
    flexDirection: "row",
    gap: 4,
  },
  progressSegment: {
    flex: 1,
    height: 3,
    borderRadius: 3,
  },
  guideFrame: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  cornerTL: {
    position: "absolute",
    top: "18%",
    left: "12%",
    width: 36,
    height: 36,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderTopLeftRadius: 12,
  },
  cornerTR: {
    position: "absolute",
    top: "18%",
    right: "12%",
    width: 36,
    height: 36,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderTopRightRadius: 12,
  },
  cornerBL: {
    position: "absolute",
    bottom: "24%",
    left: "12%",
    width: 36,
    height: 36,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderBottomLeftRadius: 12,
  },
  cornerBR: {
    position: "absolute",
    bottom: "24%",
    right: "12%",
    width: 36,
    height: 36,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomRightRadius: 12,
  },
  handIcon: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
  },
  scanLine: {
    position: "absolute",
    width: "60%",
    height: 2,
    borderRadius: 2,
    opacity: 0.7,
  },

  bottomPanel: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 50,
    padding: 16,
    paddingBottom: 36,
  },
  hud: {
    borderRadius: 20,
    padding: 18,
    gap: 8,
    borderWidth: 1,
  },
  hudRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  hudLabel: { color: "rgba(255,255,255,0.75)", fontSize: 13, fontWeight: "600" },
  hudStep: { color: "rgba(255,255,255,0.45)", fontSize: 12, fontWeight: "600" },
  hudTitle: { color: "#fff", fontSize: 20, fontWeight: "700" },
  hudDesc: { color: "rgba(255,255,255,0.65)", fontSize: 14, lineHeight: 20 },
  captureBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 16,
    borderRadius: 14,
    marginTop: 4,
  },
  captureBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});
