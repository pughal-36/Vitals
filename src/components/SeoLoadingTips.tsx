"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const fallbackTips = [
  "Fast pages give both people and crawlers fewer reasons to leave.",
  "A clear title helps searchers know what makes a page useful.",
  "Descriptive links make the next step easier for visitors and crawlers.",
  "Check important pages on a real phone-sized viewport, not just a desktop.",
  "Useful image descriptions improve context when images cannot be seen.",
  "A sitemap is a discovery aid, not a substitute for helpful links.",
  "One strong page title beats a pile of repeated keywords.",
  "Keep your canonical URL consistent across redirects and page markup.",
];
const KEY = "vitals.seoTips.seen.v1";

export default function SeoLoadingTips() {
  const [tip, setTip] = useState("");
  const seen = useRef<Set<string>>(new Set());
  const queued = useRef<string[]>([]);
  const fetching = useRef(false);
  const shownOnce = useRef(false);

  const getSeen = useCallback(() => {
    if (seen.current.size || typeof window === "undefined") return;
    try { seen.current = new Set(JSON.parse(sessionStorage.getItem(KEY) || "[]")); } catch { seen.current = new Set(); }
  }, []);

  const addBatch = useCallback(async () => {
    if (fetching.current) return;
    fetching.current = true;
    try {
      const response = await fetch("/api/tips", { cache: "no-store" });
      if (!response.ok) throw new Error("Tip service unavailable");
      const data = await response.json() as { tips?: string[] };
      const existing = new Set(queued.current);
      const fresh = (data.tips || []).map((value) => value.trim()).filter((value) => value && !seen.current.has(value) && !existing.has(value));
      queued.current.push(...fresh);
      if (!fresh.length) throw new Error("No fresh tips returned");
    } catch {
      const fresh = fallbackTips.filter((value) => !seen.current.has(value) && !queued.current.includes(value));
      queued.current.push(...fresh);
    } finally {
      fetching.current = false;
    }
  }, []);

  useEffect(() => {
    getSeen();
    let mounted = true;
    const initial = addBatch();
    const slowFallback = window.setTimeout(() => {
      if (mounted && !shownOnce.current) {
        const first = fallbackTips.find((value) => !seen.current.has(value));
        if (first) {
          seen.current.add(first);
          try { sessionStorage.setItem(KEY, JSON.stringify([...seen.current])); } catch { /* storage is optional */ }
          setTip(first);
          shownOnce.current = true;
        }
      }
    }, 3200);
    void initial.then(() => { if (mounted && queued.current.length && !shownOnce.current) advance(); });
    function advance() {
      getSeen();
      let next: string | undefined;
      while (queued.current.length && !next) {
        const candidate = queued.current.shift()!;
        if (!seen.current.has(candidate)) next = candidate;
      }
      if (!next) { void addBatch(); return; }
      seen.current.add(next);
      shownOnce.current = true;
      try { sessionStorage.setItem(KEY, JSON.stringify([...seen.current])); } catch { /* storage is optional */ }
      setTip(next);
      if (queued.current.length <= 2) void addBatch();
    }
    const timer = window.setInterval(advance, 5200);
    return () => { mounted = false; window.clearTimeout(slowFallback); window.clearInterval(timer); };
  }, [addBatch, getSeen]);

  return <p className="seo-tip" aria-live="polite" aria-atomic="true"><span className="seo-tip-index">FIELD NOTE</span><span key={tip} className="seo-tip-copy">{tip || "A few useful search signals are coming into focus…"}</span></p>;
}
