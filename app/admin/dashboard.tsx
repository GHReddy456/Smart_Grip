import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Alert, Dimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { apiUrl } from "../../lib/api";
import { useAppStore } from "../../store/useAppStore";

const STATUS_FLOW = ["Pending Scan", "Scan Uploaded", "Processing", "Fabricating", "Shipped", "Delivered", "Connected"];
const TABS = ["Registry", "Logistics", "Clinical", "AI Hub", "SOS Command"];

export default function AdminDashboardScreen() {
  const { themeMode, role } = useAppStore();
  const isDark = themeMode === "dark";
  const [patients, setPatients] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("Registry");
  const [selectedPatient, setSelectedPatient] = useState<any | null>(null);

  useEffect(() => {
    if (role !== "admin") {
      router.replace("/home");
    }
  }, [role]);

  const fetchPatients = async () => {
    try {
      const res = await fetch(apiUrl("/api/v1/patients"));
      if (res.ok) {
        const data = await res.json();
        data.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        setPatients(data);
      }
    } catch (e) {
      console.warn("Failed to fetch patients", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
    const interval = setInterval(fetchPatients, 3000); 
    return () => clearInterval(interval);
  }, []);

  const advanceStatus = async (id: string, currentStatus: string) => {
    const currentIndex = STATUS_FLOW.indexOf(currentStatus);
    if (currentIndex < STATUS_FLOW.length - 1) {
      const nextStatus = STATUS_FLOW[currentIndex + 1];
      try {
        const res = await fetch(apiUrl(`/api/v1/patient/${id}/status`), {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fabrication_status: nextStatus })
        });
        if (res.ok) fetchPatients();
        else Alert.alert("Error", "Failed to advance status in database");
      } catch (e) {
        Alert.alert("Network Error", "Could not reach backend");
      }
    }
  };

  // Shared Metrics
  const stats = {
    totalPatients: patients.length,
    pendingScans: patients.filter(p => p.fabrication_status === "Pending Scan").length,
    activeManufacturing: patients.filter(p => p.fabrication_status === "Processing" || p.fabrication_status === "Fabricating").length,
    activeGloves: patients.filter(p => p.fabrication_status === "Connected" || p.fabrication_status === "Delivered").length,
  };

  // -- VIEWS --
  const renderRegistryTab = () => (
    <View>
      <Text className={`text-sm font-bold uppercase tracking-wider mb-4 mt-2 ${isDark ? "text-slate-500" : "text-slate-400"}`}>
        Global Metrics (Live Database)
      </Text>
      <View className="flex-row flex-wrap justify-between mb-2">
        <MetricCard title="Registered" value={stats.totalPatients} icon="users" color={isDark ? "#60a5fa" : "#3b82f6"} isDark={isDark} />
        <MetricCard title="Active BLE" value={stats.activeGloves} icon="bluetooth" color={isDark ? "#34d399" : "#10b981"} isDark={isDark} />
        <MetricCard title="Fabricating" value={stats.activeManufacturing} icon="printer" color={isDark ? "#a855f7" : "#8b5cf6"} isDark={isDark} />
        <MetricCard title="Pending Scan" value={stats.pendingScans} icon="camera" color={isDark ? "#fbbf24" : "#f59e0b"} isDark={isDark} />
      </View>

      <View className="flex-row items-center justify-between mb-4 mt-2">
        <View>
          <Text className={`text-sm font-bold uppercase tracking-wider ${isDark ? "text-slate-500" : "text-slate-400"}`}>Patient Registry</Text>
          <Text className={`text-xs mt-1 ${isDark ? "text-slate-400" : "text-slate-500"}`}>Tap a row to manually advance phase</Text>
        </View>
        {isLoading && <ActivityIndicator size="small" color={isDark ? "#60a5fa" : "#3b82f6"} />}
      </View>

      <View className={`w-full rounded-3xl overflow-hidden border mb-8 ${isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"} shadow-sm`}>
        {patients.length === 0 && !isLoading ? (
          <View className="p-6 items-center justify-center">
            <Feather name="inbox" size={32} color={isDark ? "#334155" : "#cbd5e1"} className="mb-2" />
            <Text className={`font-semibold ${isDark ? "text-slate-500" : "text-slate-400"}`}>No patients found</Text>
          </View>
        ) : (
          patients.map((user, idx) => {
            const isLast = idx === patients.length - 1;
            let badgeBg = isDark ? "bg-slate-800" : "bg-slate-100";
            let badgeText = isDark ? "text-slate-300" : "text-slate-600";
            if (user.fabrication_status === "Connected" || user.fabrication_status === "Delivered") { badgeBg = isDark ? "bg-emerald-500/20" : "bg-emerald-100"; badgeText = isDark ? "text-emerald-400" : "text-emerald-600"; }
            else if (["Fabricating", "Processing", "Shipped", "Scan Uploaded"].includes(user.fabrication_status)) { badgeBg = isDark ? "bg-blue-500/20" : "bg-blue-100"; badgeText = isDark ? "text-blue-400" : "text-blue-600"; }
            else if (user.fabrication_status === "Pending Scan") { badgeBg = isDark ? "bg-amber-500/20" : "bg-amber-100"; badgeText = isDark ? "text-amber-400" : "text-amber-600"; }
            const shortId = "PT-" + user.id.split('-')[0].toUpperCase();

            return (
              <TouchableOpacity key={user.id} onPress={() => setSelectedPatient(user)} className={`p-4 flex-row items-center justify-between ${!isLast ? "border-b border-slate-200/20" : ""}`}>
                <View className="flex-row items-center">
                  <View className={`w-10 h-10 rounded-full items-center justify-center mr-3 ${isDark ? "bg-slate-800" : "bg-slate-100"}`}><Feather name="user" size={16} color={isDark ? "#94a3b8" : "#64748b"} /></View>
                  <View>
                    <Text className={`font-bold ${isDark ? "text-white" : "text-slate-900"}`}>{shortId}</Text>
                    <Text className={`text-xs ${isDark ? "text-slate-500" : "text-slate-400"}`}>Size {user.palm_width_mm < 75 ? "S" : user.palm_width_mm < 88 ? "M" : user.palm_width_mm < 100 ? "L" : "XL"}</Text>
                  </View>
                </View>
                <View className={`px-3 py-1 rounded-full ${badgeBg}`}><Text className={`text-xs font-bold ${badgeText}`}>{user.fabrication_status}</Text></View>
              </TouchableOpacity>
            );
          })
        )}
      </View>
      
      {/* Patient Details Modal (Detailed Metrics view) */}
      {selectedPatient && (
        <View className={`absolute inset-0 p-6 z-50 ${isDark ? "bg-slate-950/95" : "bg-white/95"}`}>
          <View className="flex-row items-center justify-between mt-12 mb-6">
            <Text className={`text-2xl font-bold ${isDark ? "text-white" : "text-slate-900"}`}>
              PT-{selectedPatient.id.split('-')[0].toUpperCase()} Metrics
            </Text>
            <TouchableOpacity onPress={() => setSelectedPatient(null)}>
              <Feather name="x" size={24} color={isDark ? "#94a3b8" : "#64748b"} />
            </TouchableOpacity>
          </View>
          
          <Text className={`text-sm font-bold uppercase tracking-wider mb-2 ${isDark ? "text-slate-500" : "text-slate-400"}`}>Status Progression</Text>
          <View className="flex-row mb-6 items-center">
             <Text className={`text-lg font-bold mr-4 ${isDark ? "text-slate-300" : "text-slate-700"}`}>Current: {selectedPatient.fabrication_status}</Text>
             <TouchableOpacity 
               onPress={() => advanceStatus(selectedPatient.id, selectedPatient.fabrication_status)} 
               className="bg-blue-600 px-4 py-2 rounded-full"
             >
               <Text className="text-white font-bold">Advance Phase</Text>
             </TouchableOpacity>
          </View>

          <Text className={`text-sm font-bold uppercase tracking-wider mb-2 ${isDark ? "text-slate-500" : "text-slate-400"}`}>Raw Extracted Dimensions</Text>
          <View className={`w-full rounded-2xl p-4 border ${isDark ? "bg-slate-900 border-slate-800" : "bg-slate-50 border-slate-200"}`}>
             <Text className={`font-bold mb-2 ${isDark ? "text-white" : "text-slate-900"}`}>Palm Width: {selectedPatient.palm_width_mm}mm</Text>
             <Text className={`font-bold mb-4 ${isDark ? "text-white" : "text-slate-900"}`}>Palm Height: {selectedPatient.palm_height_mm}mm</Text>
             
             {selectedPatient.finger_metrics && (
                <View>
                  <Text className={`text-xs mb-1 ${isDark ? "text-slate-400" : "text-slate-500"}`}>Thumb: {selectedPatient.finger_metrics.thumb?.length_mm}mm</Text>
                  <Text className={`text-xs mb-1 ${isDark ? "text-slate-400" : "text-slate-500"}`}>Index: {selectedPatient.finger_metrics.index?.length_mm}mm</Text>
                  <Text className={`text-xs mb-1 ${isDark ? "text-slate-400" : "text-slate-500"}`}>Middle: {selectedPatient.finger_metrics.middle?.length_mm}mm</Text>
                  <Text className={`text-xs mb-1 ${isDark ? "text-slate-400" : "text-slate-500"}`}>Ring: {selectedPatient.finger_metrics.ring?.length_mm}mm</Text>
                  <Text className={`text-xs mb-1 ${isDark ? "text-slate-400" : "text-slate-500"}`}>Pinky: {selectedPatient.finger_metrics.pinky?.length_mm}mm</Text>
                </View>
             )}
          </View>
        </View>
      )}
    </View>
  );

  const renderLogisticsTab = () => {
    const sizeCounts = patients.reduce((acc, p) => { 
      const size = p.palm_width_mm < 75 ? "S" : p.palm_width_mm < 88 ? "M" : p.palm_width_mm < 100 ? "L" : "XL";
      acc[size] = (acc[size] || 0) + 1; 
      return acc; 
    }, {});
    const total = patients.length || 1;
    const materialsNeeded = { yarn: stats.activeManufacturing * 1.2, elastic: stats.activeManufacturing * 0.5, flex_circuits: stats.activeManufacturing * 5 };

    return (
      <View>
        <Text className={`text-sm font-bold uppercase tracking-wider mb-4 mt-2 ${isDark ? "text-slate-500" : "text-slate-400"}`}>Size Distribution</Text>
        <View className={`p-6 rounded-3xl border mb-6 ${isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"} shadow-sm`}>
          {["S", "M", "L", "XL"].map(size => {
            const count = sizeCounts[size] || 0;
            const pct = Math.round((count / total) * 100);
            return (
              <View key={size} className="mb-3">
                <View className="flex-row justify-between mb-1">
                  <Text className={`font-bold ${isDark ? "text-white" : "text-slate-900"}`}>Size {size}</Text>
                  <Text className={`font-semibold ${isDark ? "text-slate-400" : "text-slate-500"}`}>{pct}% ({count})</Text>
                </View>
                <View className={`h-2 w-full rounded-full ${isDark ? "bg-slate-800" : "bg-slate-100"}`}>
                  <View className="h-full bg-blue-500 rounded-full" style={{ width: `${pct}%` }} />
                </View>
              </View>
            );
          })}
        </View>

        <Text className={`text-sm font-bold uppercase tracking-wider mb-4 ${isDark ? "text-slate-500" : "text-slate-400"}`}>Automated Material Est.</Text>
        <View className="flex-row flex-wrap justify-between">
          <MaterialCard title="Ag-Nylon Yarn" value={`${materialsNeeded.yarn.toFixed(1)} kg`} icon="box" isDark={isDark} />
          <MaterialCard title="Elastic Substrate" value={`${materialsNeeded.elastic.toFixed(1)} kg`} icon="layers" isDark={isDark} />
          <MaterialCard title="Flex Circuits" value={`${materialsNeeded.flex_circuits} units`} icon="cpu" isDark={isDark} />
          <MaterialCard title="Knitting Queue" value={`${stats.activeManufacturing} gloves`} icon="check-circle" isDark={isDark} />
        </View>
      </View>
    );
  };

  const renderClinicalTab = () => (
    <View>
      <Text className={`text-sm font-bold uppercase tracking-wider mb-4 mt-2 ${isDark ? "text-slate-500" : "text-slate-400"}`}>Sensor Drift Monitor</Text>
      <View className={`w-full rounded-3xl border mb-6 overflow-hidden ${isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"} shadow-sm`}>
        <View className={`p-4 flex-row items-center justify-between border-b ${isDark ? "border-slate-800" : "border-slate-100"}`}>
          <View className="flex-row items-center">
            <View className="w-10 h-10 rounded-full bg-red-500/20 items-center justify-center mr-3"><Feather name="alert-circle" size={16} color="#ef4444" /></View>
            <View><Text className={`font-bold ${isDark ? "text-white" : "text-slate-900"}`}>PT-F81A</Text><Text className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}>Index Finger Flex Sensor</Text></View>
          </View>
          <View><Text className="text-red-500 font-bold text-right">-14% Drift</Text><Text className={`text-xs text-right ${isDark ? "text-slate-500" : "text-slate-400"}`}>Needs Replacement</Text></View>
        </View>
        <View className="p-4 flex-row items-center justify-between">
          <View className="flex-row items-center">
            <View className="w-10 h-10 rounded-full bg-amber-500/20 items-center justify-center mr-3"><Feather name="activity" size={16} color="#f59e0b" /></View>
            <View><Text className={`font-bold ${isDark ? "text-white" : "text-slate-900"}`}>PT-B920</Text><Text className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}>Thumb Base IMU</Text></View>
          </View>
          <View><Text className="text-amber-500 font-bold text-right">-8% Drift</Text><Text className={`text-xs text-right ${isDark ? "text-slate-500" : "text-slate-400"}`}>Watchlist</Text></View>
        </View>
      </View>

      <Text className={`text-sm font-bold uppercase tracking-wider mb-4 ${isDark ? "text-slate-500" : "text-slate-400"}`}>Daily Compliance Logs</Text>
      <View className={`p-6 rounded-3xl border mb-6 ${isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"} shadow-sm`}>
        <View className="flex-row justify-between items-end h-32 mb-4">
          {[6, 8, 7, 5, 9, 8, 4].map((h, i) => (
            <View key={i} className="items-center flex-1">
              <View className="w-6 bg-emerald-500 rounded-t-sm" style={{ height: `${h * 10}%` }} />
            </View>
          ))}
        </View>
        <View className="flex-row justify-between border-t border-slate-200 pt-2 opacity-50">
          <Text className="text-xs">M</Text><Text className="text-xs">T</Text><Text className="text-xs">W</Text><Text className="text-xs">T</Text><Text className="text-xs">F</Text><Text className="text-xs">S</Text><Text className="text-xs">S</Text>
        </View>
        <Text className={`text-center mt-4 font-bold ${isDark ? "text-slate-300" : "text-slate-700"}`}>Avg. 6.7 hours / day</Text>
      </View>
    </View>
  );

  const renderAITab = () => (
    <View>
      <Text className={`text-sm font-bold uppercase tracking-wider mb-4 mt-2 ${isDark ? "text-slate-500" : "text-slate-400"}`}>Confidence Score Matrix</Text>
      <View className={`w-full rounded-3xl border mb-6 overflow-hidden ${isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"} shadow-sm`}>
        <AIGestureRow name="Pinch & Hold" score={94} users={112} isDark={isDark} />
        <AIGestureRow name="Double Tap" score={88} users={89} isDark={isDark} />
        <AIGestureRow name="Fist Clench" score={72} users={45} isDark={isDark} />
        <AIGestureRow name="Wrist Rotate" score={58} users={18} isDark={isDark} isLow={true} />
      </View>

      <Text className={`text-sm font-bold uppercase tracking-wider mb-4 ${isDark ? "text-slate-500" : "text-slate-400"}`}>False-Negative Classifier</Text>
      <View className={`p-6 rounded-3xl border mb-6 ${isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"} shadow-sm`}>
        <Text className={`font-bold mb-2 ${isDark ? "text-red-400" : "text-red-500"}`}>Priority Retraining Required: Wrist Rotate</Text>
        <Text className={`text-sm leading-relaxed ${isDark ? "text-slate-400" : "text-slate-600"}`}>
          Analysis shows IMU roll axis data conflicting with optical flex sensors on sizes XS and S. 
          Recommendation: Push OTA firmware update relaxing IMU pitch constraints during active roll phase.
        </Text>
        <TouchableOpacity className="mt-4 bg-blue-600 py-3 rounded-full items-center">
          <Text className="text-white font-bold">Approve Parameter Update</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderSOSTab = () => (
    <View>
      <Text className={`text-sm font-bold uppercase tracking-wider mb-4 mt-2 ${isDark ? "text-slate-500" : "text-slate-400"}`}>Active Incident Map</Text>
      <View className={`w-full h-64 rounded-3xl border mb-6 overflow-hidden items-center justify-center ${isDark ? "bg-slate-900 border-slate-800" : "bg-slate-200 border-slate-300"} shadow-sm`}>
        {/* Mock Map Background */}
        <View className="absolute inset-0 opacity-20">
          {[1,2,3,4,5,6].map(i => <View key={i} className="w-full h-px bg-slate-500 absolute" style={{top: `${i*16}%`}} />)}
          {[1,2,3,4,5,6].map(i => <View key={i} className="h-full w-px bg-slate-500 absolute" style={{left: `${i*16}%`}} />)}
        </View>
        
        {/* Active Ping */}
        <View className="items-center justify-center absolute" style={{ top: '40%', left: '30%' }}>
          <View className="w-16 h-16 rounded-full bg-red-500/30 absolute" />
          <View className="w-8 h-8 rounded-full bg-red-500/50 absolute" />
          <View className="w-4 h-4 rounded-full bg-red-500 absolute" />
          <View className={`mt-10 px-3 py-1 rounded-full ${isDark ? "bg-slate-800" : "bg-white"} shadow-sm`}>
            <Text className="text-xs font-bold text-red-500">PT-4482</Text>
          </View>
        </View>
      </View>

      <Text className={`text-sm font-bold uppercase tracking-wider mb-4 ${isDark ? "text-slate-500" : "text-slate-400"}`}>False-Trigger Filter</Text>
      <View className="flex-row justify-between mb-8">
        <View className={`w-[48%] p-4 rounded-3xl border ${isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"} shadow-sm`}>
          <Text className={`text-sm font-semibold mb-1 ${isDark ? "text-slate-400" : "text-slate-500"}`}>True Triggers</Text>
          <Text className={`text-2xl font-bold ${isDark ? "text-white" : "text-slate-900"}`}>14</Text>
          <Text className="text-xs text-emerald-500 mt-1">Confirmed emergency</Text>
        </View>
        <View className={`w-[48%] p-4 rounded-3xl border ${isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"} shadow-sm`}>
          <Text className={`text-sm font-semibold mb-1 ${isDark ? "text-slate-400" : "text-slate-500"}`}>Canceled (False)</Text>
          <Text className={`text-2xl font-bold ${isDark ? "text-white" : "text-slate-900"}`}>89</Text>
          <Text className="text-xs text-amber-500 mt-1">Canceled in 5s window</Text>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView className={`flex-1 ${isDark ? "bg-slate-950" : "bg-slate-50"}`}>
      {/* Header */}
      <View className="px-6 pt-6 pb-2 flex-row items-center justify-between">
        <TouchableOpacity onPress={() => router.back()} className={`w-10 h-10 items-center justify-center rounded-full ${isDark ? "bg-slate-800" : "bg-white"} shadow-sm`}>
          <Feather name="arrow-left" size={20} color={isDark ? "#f8fafc" : "#0f172a"} />
        </TouchableOpacity>
        <Text className={`text-lg font-semibold ${isDark ? "text-slate-100" : "text-slate-900"}`}>Clinical Control Center</Text>
        <TouchableOpacity><Feather name="settings" size={24} color={isDark ? "#94a3b8" : "#64748b"} /></TouchableOpacity>
      </View>

      {/* Tabs */}
      <View className="w-full border-b border-slate-200/20 mb-2">
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="px-6 py-3">
          {TABS.map((tab) => (
            <TouchableOpacity 
              key={tab} 
              onPress={() => setActiveTab(tab)}
              className={`mr-4 px-4 py-2 rounded-full ${activeTab === tab ? "bg-blue-600" : isDark ? "bg-slate-800" : "bg-slate-200"}`}
            >
              <Text className={`font-bold ${activeTab === tab ? "text-white" : isDark ? "text-slate-400" : "text-slate-600"}`}>{tab}</Text>
            </TouchableOpacity>
          ))}
          <View className="w-10" />
        </ScrollView>
      </View>

      <ScrollView className="flex-1 px-6" contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        {activeTab === "Registry" && renderRegistryTab()}
        {activeTab === "Logistics" && renderLogisticsTab()}
        {activeTab === "Clinical" && renderClinicalTab()}
        {activeTab === "AI Hub" && renderAITab()}
        {activeTab === "SOS Command" && renderSOSTab()}
      </ScrollView>
    </SafeAreaView>
  );
}

// Sub-components
const MetricCard = ({ title, value, icon, color, isDark }: any) => (
  <View className={`w-[48%] p-4 rounded-3xl border mb-4 ${isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"} shadow-sm`}>
    <View className="flex-row items-center justify-between mb-2">
      <Text className={`text-sm font-semibold ${isDark ? "text-slate-400" : "text-slate-500"}`}>{title}</Text>
      <Feather name={icon} size={16} color={color} />
    </View>
    <Text className={`text-3xl font-bold ${isDark ? "text-white" : "text-slate-900"}`}>{value}</Text>
  </View>
);

const MaterialCard = ({ title, value, icon, isDark }: any) => (
  <View className={`w-[48%] p-4 rounded-3xl border mb-4 ${isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"} shadow-sm`}>
    <View className={`w-10 h-10 rounded-full mb-3 items-center justify-center ${isDark ? "bg-slate-800" : "bg-slate-100"}`}>
      <Feather name={icon} size={18} color={isDark ? "#94a3b8" : "#64748b"} />
    </View>
    <Text className={`text-sm font-semibold ${isDark ? "text-slate-400" : "text-slate-500"}`}>{title}</Text>
    <Text className={`text-lg font-bold mt-1 ${isDark ? "text-white" : "text-slate-900"}`}>{value}</Text>
  </View>
);

const AIGestureRow = ({ name, score, users, isDark, isLow = false }: any) => (
  <View className={`p-4 flex-row items-center justify-between border-b ${isDark ? "border-slate-800" : "border-slate-100"}`}>
    <View>
      <Text className={`font-bold ${isDark ? "text-white" : "text-slate-900"}`}>{name}</Text>
      <Text className={`text-xs ${isDark ? "text-slate-500" : "text-slate-400"}`}>{users} users tracking</Text>
    </View>
    <View className={`px-3 py-1 rounded-full ${isLow ? "bg-red-500/20" : "bg-emerald-500/20"}`}>
      <Text className={`text-xs font-bold ${isLow ? "text-red-500" : "text-emerald-500"}`}>{score}% Acc.</Text>
    </View>
  </View>
);
