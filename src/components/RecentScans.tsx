"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { ScanRow } from "@/lib/supabase/scans";

export default function RecentScans() {
  const [scans, setScans] = useState<ScanRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadScans() {
      try {
        const recent = JSON.parse(localStorage.getItem("recentScans") || "[]");
        if (recent.length > 0) {
          // Fetch from API instead of importing getScanById directly if we hit CORS/Client issues, 
          // but we can just fetch from an API route. Wait, `getScanById` uses Supabase client.
          // Since Supabase client in `client.ts` is likely isomorphic, let's see.
          const res = await fetch(`/api/scan?ids=${recent.join(',')}`);
          if (res.ok) {
            const data = await res.json();
            setScans(data.scans);
          }
        }
      } catch (err) {
        console.error("Failed to load recent scans", err);
      } finally {
        setLoading(false);
      }
    }
    loadScans();
  }, []);

  if (loading || scans.length === 0) return null;

  return (
    <div className="mt-12 w-full max-w-3xl text-left border-t border-border/40 pt-8">
      <h3 className="text-sm font-semibold text-foreground mb-4">Recent Scans</h3>
      <div className="space-y-3">
        {scans.map(scan => (
          <Link 
            key={scan.id} 
            href={`/?scan=${encodeURIComponent(scan.id)}`}
            onClick={() => { try { localStorage.setItem("vitals.scanId", scan.id); } catch { /* storage is optional */ } }}
            className="flex items-center justify-between p-4 rounded-xl border border-border bg-surface/50 hover:bg-surface transition-colors"
          >
            <div className="flex flex-col">
              <span className="font-medium text-sm text-foreground">{scan.url}</span>
              <span className="text-xs text-muted">
                {new Date(scan.created_at).toLocaleString()}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1 text-xs">
                <span className="text-accent">{scan.score_performance}</span>
                <span className="text-muted">|</span>
                <span className="text-warning">{scan.score_accessibility}</span>
                <span className="text-muted">|</span>
                <span className="text-danger">{scan.score_best_practices}</span>
                <span className="text-muted">|</span>
                <span className="text-accent">{scan.score_seo}</span>
              </div>
              <svg className="w-4 h-4 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
