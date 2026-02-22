"use client";

import { AuthProvider } from "@/components/AuthContext";
import SettingsModal from "@/components/SettingsModal";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      {children}
      <SettingsModal />
    </AuthProvider>
  );
}
