export const patientSnapshot = {
  name: "Alex Morgan",
  condition: "Post-stroke rehabilitation",
  dominantHand: "Right hand",
  gloveStatus: "Connected",
  battery: 85,
  lastScan: "2 days ago",
  scanConfidence: 94,
  uploadStatus: "Processing"
};

export const quickActions = [
  { id: "scan", title: "Start Hand Scan", icon: "back-hand" },
  { id: "gestures", title: "Configure Gestures", icon: "gesture" },
  { id: "sos", title: "Emergency SOS", icon: "emergency" },
  { id: "voice", title: "Voice Settings", icon: "record-voice-over" }
];

export const scanSteps = [
  { id: "palm-front", title: "Palm front", description: "Face the palm toward the guide frame." },
  { id: "palm-side", title: "Palm side", description: "Rotate the hand to show the edge profile." },
  { id: "fingers", title: "Fingers extended", description: "Keep all fingers relaxed and open." },
  { id: "fist", title: "Closed fist", description: "Close the hand gently without tension." },
  { id: "wrist", title: "Wrist rotation", description: "Turn the wrist slowly for full motion capture." }
];

export const recentActivity = [
  { id: "scan", title: "Hand Strength Scan", time: "Today, 09:15", tone: "primary" },
  { id: "calibrate", title: "Glove Calibration", time: "Yesterday, 16:30", tone: "secondary" },
  { id: "upload", title: "Therapy Upload", time: "Oct 24, 11:20", tone: "success" }
];

export const devices = [
  { id: "light", name: "Living room lights", type: "Smart light", status: "Connected", active: true, intensity: 60 },
  { id: "fan", name: "Bedroom fan", type: "Smart fan", status: "Idle", active: true, intensity: 35 },
  { id: "speaker", name: "Voice speaker", type: "Bluetooth speaker", status: "Offline", active: false, intensity: 0 }
];

export const gestures = [
  { id: "pinch", name: "Pinch", action: "Toggle lights", active: true, confidence: 96 },
  { id: "double-pinch", name: "Double pinch", action: "Speak phrase", active: true, confidence: 92 },
  { id: "wave", name: "Wave", action: "Fan control", active: true, confidence: 90 },
  { id: "flex", name: "Flex", action: "Voice assistant", active: false, confidence: 86 },
  { id: "rotate", name: "Wrist rotate", action: "Emergency SOS", active: true, confidence: 89 }
];

export const emergencyContacts = [
  { id: "1", name: "Dr. Patel", relation: "Physician", status: "Primary" },
  { id: "2", name: "Nina Morgan", relation: "Caregiver", status: "Secondary" },
  { id: "3", name: "Local Emergency", relation: "Emergency services", status: "Fallback" }
];

export const adminStats = [
  { id: "patients", label: "Total patients", value: "1,284", delta: "+4.3%" },
  { id: "uploads", label: "Active uploads", value: "38", delta: "+9" },
  { id: "queue", label: "Processing queue", value: "12", delta: "-3" },
  { id: "alerts", label: "SOS alerts", value: "2", delta: "0" }
];

export const timeline = [
  { id: "1", title: "Upload received", detail: "Encrypted scan batch arrived", state: "done" },
  { id: "2", title: "Structure analysis", detail: "Measuring range, pressure, and motion", state: "active" },
  { id: "3", title: "Therapy summary", detail: "Waiting for report generation", state: "pending" }
];