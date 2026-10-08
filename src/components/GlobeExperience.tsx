"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";

const DynamicGlobe = dynamic(() => import("./GlobeScene"), {
  ssr: false,
  loading: () => <StaticGlobe />,
});

function StaticGlobe({ highlighted = false }: { highlighted?: boolean }) {
  return <div className="globe-fallback" role="img" aria-label="Static illustration of the Vitals audit globe">
    <svg viewBox="0 0 360 360" aria-hidden="true">
      <circle cx="180" cy="180" r="126" fill="#3A3E44" stroke="#AEB4BA" strokeWidth="1" />
      <circle cx="180" cy="180" r="116" fill="none" stroke="#D9DCE0" strokeOpacity=".24" />
      <ellipse cx="180" cy="180" rx="54" ry="126" fill="none" stroke="#D9DCE0" strokeOpacity=".22" />
      <ellipse cx="180" cy="180" rx="102" ry="126" fill="none" stroke="#D9DCE0" strokeOpacity=".16" />
      <ellipse cx="180" cy="180" rx="124" ry="47" fill="none" stroke="#D9DCE0" strokeOpacity=".18" />
      <path d="M120 88l15 8 4 16 14 6 3 13-14 9-3 17-18 8-8 19-18-4-12-15 3-17-11-14 10-18 5-18 16-6z" fill="#C8CDD2" />
      <path d="M157 177l18 5 9 15-7 17 8 19-8 21-18 17-10-17-3-22-9-17 4-19z" fill="#D9DCE0" />
      <path d="M224 103l18 7 7 16 17 6 10 18-14 10-18-8-14 9-9-13-15-5 1-20z" fill="#C8CDD2" />
      <path d="M234 169l19 2 12 14-4 16 13 11-8 18-16 9-10-12-16-3-8-19 9-15z" fill="#D9DCE0" />
      {highlighted && <g>
        <circle cx="244" cy="148" r="13" fill="none" stroke="#E8A33D" strokeWidth="1.5" />
        <path d="M244 146v-26" stroke="#E8A33D" strokeWidth="1.5" />
        <circle cx="244" cy="148" r="4" fill="#E8A33D" />
      </g>}
    </svg>
  </div>;
}

function supportsWebGL() {
  try {
    const canvas = document.createElement("canvas");
    return Boolean(window.WebGLRenderingContext && (canvas.getContext("webgl") || canvas.getContext("experimental-webgl")));
  } catch { return false; }
}

export default function GlobeExperience({ scanId, score }: { scanId?: string; score?: number }) {
  const panelRef = useRef<HTMLDivElement>(null);
  const intersectsViewport = useRef(false);
  const [nearViewport, setNearViewport] = useState(false);
  const [visible, setVisible] = useState(false);
  const [staticOnly, setStaticOnly] = useState(true);

  useEffect(() => {
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const lowPower = navigator.hardwareConcurrency <= 2 || (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData === true;
    // Browser capability checks are external state; static markup is the SSR-safe first paint.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setStaticOnly(motion || lowPower || !supportsWebGL());
    const node = panelRef.current;
    if (!node) return;
    const warmObserver = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setNearViewport(true); warmObserver.disconnect(); }
    }, { rootMargin: "220px 0px", threshold: 0.01 });
    const visibleObserver = new IntersectionObserver(([entry]) => {
      intersectsViewport.current = entry.isIntersecting;
      setVisible(entry.isIntersecting && document.visibilityState === "visible");
    }, { threshold: 0.01 });
    warmObserver.observe(node);
    visibleObserver.observe(node);
    const onVisibility = () => setVisible(document.visibilityState === "visible" && intersectsViewport.current);
    document.addEventListener("visibilitychange", onVisibility);
    return () => { warmObserver.disconnect(); visibleObserver.disconnect(); document.removeEventListener("visibilitychange", onVisibility); };
  }, []);

  const highlighted = Boolean(scanId && score !== undefined);
  return <div className="globe-instrument">
    <div className="globe-panel" ref={panelRef}>
      <div className="globe-panel-inner">
        {staticOnly || !nearViewport ? <StaticGlobe highlighted={highlighted} /> : <DynamicGlobe scanId={scanId} score={score} active={visible} />}
      </div>
      <div className="globe-instrument-readout" aria-hidden="true"><span>EARTH / 001</span><span>{highlighted ? "SITE SIGNAL LOCKED" : "BASELINE / CALM"}</span></div>
    </div>
    <p className="globe-help">DRAG TO TILT <span>·</span> SCROLL TO ADJUST</p>
  </div>;
}
