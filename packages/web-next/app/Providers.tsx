"use client";

// Client boundary — all browser-dependent providers live here.
// AuthProvider + Navbar will be wired in during Phase 2 of the migration
// once those components have been ported from packages/web.

export default function Providers({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
