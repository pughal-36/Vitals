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
    if (base === "audit") return activeScanId ? `/?scan=${encodeURIComponent(activeScanId)}` : "/";
    return activeScanId
      ? `/${base}/${encodeURIComponent(activeScanId)}?scan=${encodeURIComponent(activeScanId)}`
      : `/${base}`;
  };

  const navLinks = [
    { href: getHref("audit"), label: "Audit", active: pathname === "/" || pathname.startsWith("/audit") },
    { href: getHref("readout"), label: "Readout", active: pathname.startsWith("/readout") },
    { href: getHref("assistant"), label: "Assistant", active: pathname.startsWith("/assistant") },
    { href: "/about", label: "About", active: pathname.startsWith("/about") },
  ];

  return (
    <nav className="vitals-nav sticky top-0 z-50" aria-label="Main navigation">
      <div className="vitals-nav-inner mx-auto flex items-center justify-between px-4 sm:px-6">
        <Link href={getHref("audit")} className="flex items-center gap-2.5" aria-label="Vitals home">
          <span className="vitals-logo-word">VITALS</span>
        </Link>
        <div className="flex items-center gap-1 sm:gap-2">
          {navLinks.map(({ href, label, active }) => (
            <Link key={label} href={href} className="vitals-nav-link rounded-sm px-3 py-2" aria-current={active ? "page" : undefined}>
              {label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}
