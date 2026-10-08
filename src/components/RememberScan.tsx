"use client";
import { useEffect } from "react";
export default function RememberScan({ scanId }: { scanId: string }) {
  useEffect(() => {
    try { localStorage.setItem("vitals.scanId", scanId); } catch { /* optional browser storage */ }
    document.cookie = `scanId=${encodeURIComponent(scanId)}; path=/; max-age=2592000; samesite=lax`;
  }, [scanId]);
  return null;
}
