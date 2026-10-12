"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

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

  return <main id="main-content" tabIndex={-1} className="scan-empty flex-1 px-4 py-20 sm:py-28 outline-none">
    <div className="mx-auto max-w-xl border border-border bg-surface p-7 sm:p-10">
      <h1 className="text-3xl font-semibold tracking-[-.04em] text-foreground">Enter a URL to scan</h1>
      <p className="mt-3 text-sm leading-6 text-muted">{checked ? "No saved audit found. Enter a URL on the Audit page to start a scan." : "Checking for a saved audit..."}</p>
      {checked && <Link href="/" className="mt-7 inline-flex min-h-11 items-center border border-foreground bg-foreground px-5 text-sm font-medium text-background">Back to Audit</Link>}
    </div>
  </main>;
}
