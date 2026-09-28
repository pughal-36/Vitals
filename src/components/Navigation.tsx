"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Navigation() {
  const pathname = usePathname();
  const match = pathname.match(/^\/(audit|readout|assistant)\/([^\/]+)/);
  const scanId = match ? match[2] : null;

  const getHref = (base: string) => (scanId ? `/${base}/${scanId}` : (base === "audit" ? "/" : `/${base}`));
  
  const navLinks = [
    { href: getHref("audit"), label: "AUDIT" },
    { href: getHref("readout"), label: "READOUT" },
    { href: getHref("assistant"), label: "ASSISTANT" },
  ];

  return (
    <nav className="vitals-nav sticky top-0 z-50">
      <div className="vitals-nav-inner mx-auto flex items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5" aria-label="Vitals home">
          <span className="vitals-logo-mark" aria-hidden="true"><span /></span>
          <span className="vitals-logo-word text-sm">VITALS</span>
          <span className="vitals-logo-tag hidden sm:inline">SEO AUDIT</span>
        </Link>
        <div className="flex items-center gap-1 sm:gap-2">
          {navLinks.map(({ href, label }) => (
            <Link 
              key={label} 
              href={href} 
              className="vitals-nav-link rounded-sm px-3 py-2" 
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
