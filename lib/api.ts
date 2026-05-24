import Constants from "expo-constants";
import { Platform } from "react-native";

const DEFAULT_PORT = 3000;

function normalizeBaseUrl(value: string) {
  return value.replace(/\/$/, "");
}

export function getApiBaseUrl() {
  const configuredUrl = process.env.EXPO_PUBLIC_API_URL?.trim();
  if (configuredUrl) {
    return normalizeBaseUrl(configuredUrl);
  }

  if (Platform.OS === "web") {
    return `http://localhost:${DEFAULT_PORT}`;
  }

  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri) {
    const host = hostUri.split(":")[0];
    return `http://${host}:${DEFAULT_PORT}`;
  }

  return `http://127.0.0.1:${DEFAULT_PORT}`;
}

export function apiUrl(path: string) {
  return `${getApiBaseUrl()}${path.startsWith("/") ? path : `/${path}`}`;
}