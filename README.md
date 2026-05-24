# Assistive Smart Grip

Assistive Smart Grip is a comprehensive mobile application built with React Native and Expo. It provides an intuitive, highly accessible interface for patients to order, manage, and interact with a custom-fabricated smart assistive glove device. 

## Key Features & Architecture

### 1. Patient Onboarding & Profiling
- **Medical Profile:** Users can configure their specific medical condition and select the affected hand (Left/Right) during the onboarding flow.
- **Patient Details:** Captures personal details including age, height, weight, emergency contact information, and accessibility preferences like Voice Instructions (e.g., "Arthur", "Emma").

### 2. Custom 3D Hand Scanning Workflow
A major feature of the app is the end-to-end flow for ordering a custom-fitted smart glove:
- **Guided Camera Scanning:** Interactive camera guides to capture different hand angles for 3D modeling (`app/scans`).
- **Review & Upload:** Interface to review scan quality before securely uploading it to the backend.
- **Fabrication Tracking:** Real-time status updates on the glove's manufacturing process (Pending Scan → Scan Uploaded → Processing → Fabricating → Shipped → Delivered).

### 3. Smart Glove Management & Telemetry
Once the custom glove is delivered, the app manages connection and data:
- **Bluetooth Pairing:** Screens specifically designed for pairing and connecting to the physical device.
- **Real-Time Telemetry:** Displays the glove's battery life, signal strength, and connection state directly from the Home dashboard.

### 4. Smart Home & Device Integration
The glove acts as an intuitive universal remote for IoT devices around the patient:
- **Device Management:** Connect, monitor, and control the power and intensity of connected smart devices (Smart Lights, Fans, TVs, Speakers).
- **Custom Action Mapping:** Map specific hand gestures to specific device actions (e.g., mapping a "Pinch" gesture to toggle a Living Room Light, or a "Wrist rotate" to change a Fan's speed).

### 5. Gesture Training & Library
- **AI Gesture Recognition:** Users can train the glove to recognize custom physical gestures or view the default library (Pinch, Double Pinch, Wrist Rotate).
- **Confidence Scores:** The app tracks the number of training samples and AI confidence scores for each gesture.

### 6. Emergency SOS & Accessibility
- **SOS Alerts:** Dedicated emergency features to trigger SOS events, logging the time and location for immediate assistance to emergency contacts.
- **Accessibility Modes:** Deep accessibility integration across the app including High Contrast mode, Reduced Motion, Voice Instructions, and Haptic feedback.

### 7. Administrative Controls
- **Role-Based Access:** Built-in role state management toggling between "patient" and "admin" interfaces.
- **Admin Panel:** Separate interface (`app/admin`) for clinical administrators to oversee patients and configurations.

## Tech Stack & Architecture

- **Frontend Framework:** React Native, Expo, and Expo Router (File-based routing)
- **Styling:** NativeWind (Tailwind CSS for React Native) ensuring a highly responsive and modern interface.
- **State Management:** Zustand is used extensively for global state (`store/useAppStore.ts`), handling everything from fabrication tracking to accessibility toggles.
- **Data Fetching & Caching:** React Query (`@tanstack/react-query`) is configured for robust asynchronous state management and backend synchronization.
- **Backend Infrastructure:** A robust Rust-based backend API (`backend/` directory built with Cargo).

## Getting Started

### Prerequisites
- Node.js and npm installed
- Expo Go app installed on your physical mobile device (or an iOS/Android simulator configured)
- Rust and Cargo (if running the backend locally)

### Installation & Running

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start the frontend application:**
   ```bash
   npm start
   # or
   npx expo start
   ```

3. **Open the app:**
   - Scan the generated QR code using the **Expo Go** app on your physical device.
   - Alternatively, press `i` to open in an iOS simulator or `a` to open in an Android emulator.
# hand_glove
