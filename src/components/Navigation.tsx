"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function Navigation() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const paramScanId = searchParams.get("scan");
  const match = pathname.match(/^\/(?:audit|readout|assistant)\/([^/?#]+)/);
  const urlScanId = paramScanId || match?.[1] || null;

  const [storedScanId, setStoredScanId] = useState<string | null>(null);

  useEffect(() => {
    if (urlScanId) {
      try {
        localStorage.setItem("vitals.scanId", urlScanId);
      } catch {
        // ignore
      }
    } else {
      try {
        const stored = localStorage.getItem("vitals.scanId");
        if (stored) {
          // eslint-disable-next-line react-hooks/set-state-in-effect
          setStoredScanId(stored);
        }
      } catch {
        // ignore
      }
    }
  }, [urlScanId]);

  const activeScanId = urlScanId || storedScanId;

  const getHref = (base: string) => {
    if (base === "audit") {
      return activeScanId ? `/?scan=${encodeURIComponent(activeScanId)}` : "/";
    }
    return activeScanId
      ? `/${base}/${encodeURIComponent(activeScanId)}?scan=${encodeURIComponent(activeScanId)}`
      : `/${base}`;
  };

  const isAuditActive = pathname === "/" || pathname.startsWith("/audit");
  const isReadoutActive = pathname.startsWith("/readout");
  const isAssistantActive = pathname.startsWith("/assistant");

  const navLinks = [
    { href: getHref("audit"), label: "AUDIT", active: isAuditActive },
    { href: getHref("readout"), label: "READOUT", active: isReadoutActive },
    { href: getHref("assistant"), label: "ASSISTANT", active: isAssistantActive },
  ];

  return (
    <nav className="vitals-nav sticky top-0 z-50">
      <div className="vitals-nav-inner mx-auto flex items-center justify-between px-4 sm:px-6">
        <Link href={getHref("audit")} className="flex items-center gap-2.5" aria-label="Vitals home">
          <span className="vitals-logo-mark" aria-hidden="true"><span /></span>
          <span className="vitals-logo-word text-sm">VITALS</span>
          <span className="vitals-logo-tag hidden sm:inline">SEO AUDIT</span>
        </Link>
        <div className="flex items-center gap-1 sm:gap-2">
          {navLinks.map(({ href, label, active }) => (
            <Link
              key={label}
              href={href}
              className={`vitals-nav-link rounded-sm px-3 py-2 ${active ? 'aria-current="page"' : ""}`}
              aria-current={active ? "page" : undefined}
              data-nav-label={label}
            >
              {label}
            </Link>
          ))}
          <span className="hidden sm:flex items-center gap-2 ml-4 text-[9px] font-mono tracking-[.08em] text-[#2B2E33]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#E8A33D]" /> SYSTEM ONLINE
          </span>
        </div>
      </div>
    </nav>
  );
}
