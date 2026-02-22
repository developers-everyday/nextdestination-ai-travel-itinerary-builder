"use client";

import { AuthProvider } from "@/components/AuthContext";
import SettingsModal from "@/components/SettingsModal";
import { usePageTracking } from "@/hooks/usePageTracking";

function TrackingProvider({ children }: { children: React.ReactNode }) {
  usePageTracking();
  return <>{children}</>;
}

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <TrackingProvider>
        {children}
        <SettingsModal />
      </TrackingProvider>
    </AuthProvider>
  );
}
