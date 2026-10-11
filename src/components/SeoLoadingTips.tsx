"use client";

import { useEffect, useState } from "react";

export const LOADING_TIPS = [
  "Every page should have one h1 heading.",
  "Add alt text to images that carry meaning.",
  "Use width and height attributes on images to avoid layout shift.",
  "Keep page titles unique and descriptive across your site.",
  "Provide meta descriptions that accurately summarize page content.",
  "Use semantic HTML elements like main, nav, and article for structure.",
  "Ensure color contrast between text and background meets accessibility guidelines.",
  "Compress images and use modern formats like WebP or AVIF.",
  "Avoid blocking the main thread with heavy JavaScript execution.",
  "Set descriptive text on link elements instead of click here.",
  "Use canonical tags when similar content exists on multiple URLs.",
  "Ensure interactive elements can be focused and operated with a keyboard.",
  "Keep server response times fast to improve Largest Contentful Paint.",
  "Minimize third-party scripts that slow down page loading.",
  "Include viewport meta tags so pages display properly on mobile devices.",
  "Specify a language attribute on the html element for screen readers.",
  "Preconnect to required external origins to reduce connection latency.",
  "Keep cumulative layout shifts low by reserving space for dynamic content.",
  "Use robots.txt to keep crawlers away from private or duplicate sections.",
  "Test pages on real mobile connections to spot performance bottlenecks.",
];

export default function SeoLoadingTips() {
  const [index, setIndex] = useState<number | null>(null);

  useEffect(() => {
    const start = Math.floor(Math.random() * LOADING_TIPS.length);
    setIndex(start);

    const interval = window.setInterval(() => {
      setIndex((prev) => (prev === null ? start : (prev + 1) % LOADING_TIPS.length));
    }, 6000);

    return () => window.clearInterval(interval);
  }, []);

  const tip = index !== null ? LOADING_TIPS[index] : "";

  return (
    <p className="seo-tip" aria-live="polite" aria-atomic="true">
      <span className="seo-tip-copy">{tip}</span>
    </p>
  );
}
