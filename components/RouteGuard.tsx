import React, { useEffect } from "react";
import { usePathname, useRouter, useSegments } from "expo-router";
import { useAppStore } from "../store/useAppStore";

type RouteGuardProps = {
  children: React.ReactNode;
};

export function RouteGuard({ children }: RouteGuardProps) {
  const router = useRouter();
  const segments = useSegments();
  const pathname = usePathname();

  const authenticated = useAppStore((state) => state.authenticated);
  const role = useAppStore((state) => state.role);
  const onboarding_completed = useAppStore((state) => state.onboarding_completed);
  const scan_completed = useAppStore((state) => state.scan_completed);
  const glove_delivered = useAppStore((state) => state.glove_delivered);
  const glove_connected = useAppStore((state) => state.glove_connected);
  const medical_condition = useAppStore((state) => state.medical_condition);
  const glove_hand = useAppStore((state) => state.glove_hand);
  const patient_details = useAppStore((state) => state.patient_details);

  useEffect(() => {
    // 1. Skip routing guard if index (splash) page
    if (segments.length === 0 || pathname === "/") {
      return;
    }

    const isAuthRoute = 
      pathname === "/login" || 
      pathname === "/register" || 
      pathname === "/forgot-password";

    // 2. Unauthenticated check
    if (!authenticated) {
      if (!isAuthRoute) {
        router.replace("/login");
      }
      return;
    }

    // 3. Authenticated check - prevent accessing auth screens
    if (isAuthRoute) {
      if (role === "admin") {
        router.replace("/admin");
      } else {
        router.replace("/home");
      }
      return;
    }

    // 4. Admin Routing Guard
    if (role === "admin") {
      const isAdminRoute = 
        segments[0] === "admin" || 
        pathname === "/profile" || 
        pathname === "/settings";
      if (!isAdminRoute) {
        router.replace("/admin");
      }
      return;
    }

    // 5. Patient Onboarding Guard
    if (!onboarding_completed) {
      if (medical_condition === "") {
        if (pathname !== "/onboarding/condition") {
          router.replace("/onboarding/condition");
        }
        return;
      }
      if (glove_hand === "") {
        if (pathname !== "/onboarding/hand") {
          router.replace("/onboarding/hand");
        }
        return;
      }
      if (patient_details === null) {
        if (pathname !== "/onboarding/details") {
          router.replace("/onboarding/details");
        }
        return;
      }
    }

    // 6. Patient Hand Scan Guard
    if (onboarding_completed && !scan_completed) {
      const isScanRoute = segments[0] === "scans";
      if (!isScanRoute) {
        router.replace("/scans/intro");
      }
      return;
    }

    // 7. Patient Smart Glove Connection Guard
    if (scan_completed && glove_delivered && !glove_connected) {
      const isConnectRoute = 
        pathname === "/glove/connect" || 
        pathname === "/profile" || 
        pathname === "/settings";
      if (!isConnectRoute) {
        router.replace("/glove/connect");
      }
      return;
    }

    // 8. Patient Fabricating (Waiting) Screen Route Guard
    if (scan_completed && !glove_delivered) {
      const allowedPaths = ["/home", "/profile", "/settings"];
      if (!allowedPaths.includes(pathname)) {
        router.replace("/home");
      }
      return;
    }

  }, [
    authenticated,
    role,
    onboarding_completed,
    scan_completed,
    glove_delivered,
    glove_connected,
    medical_condition,
    glove_hand,
    patient_details,
    pathname,
    segments
  ]);

  return <>{children}</>;
}
