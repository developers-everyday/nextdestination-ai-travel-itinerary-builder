"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

declare global {
  interface Window {
    gtag?: (command: string, targetId: string, config?: object) => void;
  }
}

export function usePageTracking() {
  const pathname = usePathname();

  useEffect(() => {
    if (typeof window !== "undefined" && window.gtag) {
      window.gtag("config", "G-JNN7SPCFSW", {
        page_path: pathname,
      });
    }
  }, [pathname]);
}
