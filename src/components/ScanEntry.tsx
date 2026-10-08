"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export function RememberScan({ scanId }: { scanId: string }) {
  useEffect(() => {
    try { localStorage.setItem("vitals.scanId", scanId); } catch { /* storage may be disabled */ }
    document.cookie = `scanId=${encodeURIComponent(scanId)}; path=/; max-age=2592000; samesite=lax`;
  }, [scanId]);
  return null;
}

export default function ScanEntry({ destination, requestedScan }: { destination: "readout" | "assistant"; requestedScan?: string }) {
  const router = useRouter();
  const [checked, setChecked] = useState(false);
  useEffect(() => {
    let cancelled = false;
    async function restore() {
      let id = requestedScan;
      if (!id) {
        try { id = localStorage.getItem("vitals.scanId") || undefined; } catch { id = undefined; }
      }
      if (id) {
        try {
          const response = await fetch(`/api/scan?ids=${encodeURIComponent(id)}`, { cache: "no-store" });
          const data = await response.json() as { scans?: Array<{ id: string }> };
          if (response.ok && data.scans?.some((scan) => scan.id === id)) {
            try { localStorage.setItem("vitals.scanId", id); } catch { /* storage may be disabled */ }
            router.replace(`/${destination}/${encodeURIComponent(id)}?scan=${encodeURIComponent(id)}`);
            return;
          }
        } catch { /* invalid/offline lookup falls back to the empty state */ }
      }
      if (!cancelled) setChecked(true);
    }
    void restore();
    return () => { cancelled = true; };
  }, [destination, requestedScan, router]);

  return <main className="scan-empty flex-1 px-4 py-20 sm:py-28">
    <div className="mx-auto max-w-xl border border-border bg-surface p-7 sm:p-10">
      <p className="mb-4 font-mono text-[10px] tracking-[.12em] text-muted">{destination.toUpperCase()} / WAITING FOR INPUT</p>
      <h1 className="text-3xl font-semibold tracking-[-.04em] text-foreground">Start with your audit first</h1>
      <p className="mt-3 text-sm leading-6 text-muted">{checked ? "There is no saved audit to show here yet. Run an audit and Vitals will restore its readout and assistant history when you return." : "Checking for your saved audit…"}</p>
      {checked && <Link href="/" className="mt-7 inline-flex min-h-11 items-center border border-foreground bg-foreground px-5 text-sm font-medium text-background">Back to Audit</Link>}
    </div>
  </main>;
}
