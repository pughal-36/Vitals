"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const fallbackTips = [
  "A useful page title tells people what the page is about before they open it.",
  "Write a distinct title for each important page; repeated titles make pages harder to tell apart.",
  "A concise meta description can help searchers decide whether a result fits their needs.",
  "Search engines may create a snippet from page content instead of using your meta description.",
  "Describe an image's purpose in its alt text; decorative images can use empty alt text.",
  "Clear heading levels help readers scan a page and understand its structure.",
  "Keep the main heading focused on the page's actual topic.",
  "Compress large images and serve appropriately sized versions to reduce page weight.",
  "Slow loading can frustrate visitors, especially on mobile connections.",
  "Test key pages on a phone-sized screen as well as on desktop.",
  "Make sure important text and controls remain readable at narrow widths.",
  "A descriptive link label tells people where a link will take them.",
  "Use a canonical URL when the same or very similar content is reachable at multiple URLs.",
  "A sitemap can help search engines discover URLs; it does not guarantee indexing.",
  "Check that important pages can be reached through links on your site.",
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
