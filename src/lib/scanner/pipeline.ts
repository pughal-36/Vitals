import * as cheerio from "cheerio";
import psi from "psi";
import { generateText } from "ai";
import { geminiFlash } from "@/lib/gemini/model";
import { updateScan, type QuickChecks, type ScanTimings } from "@/lib/supabase/scans";

export async function runScanPipeline(scanId: string, url: string, strategy: "mobile" | "desktop" = "mobile") {
  const startTime = Date.now();
  const timings: ScanTimings = {};

  try {
    // ══════════════════════════════════════════════════════════════════
    // PHASE 1: DIRECT HTML QUICK CHECKS (~2s)
    // ══════════════════════════════════════════════════════════════════
    const phase1Start = Date.now();
    let quickChecks: QuickChecks | null = null;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout

      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          "User-Agent":
            "Mozilla/5.0 (compatible; VitalsBot/1.0; +https://vitals.dev)",
          Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        },
      });
      clearTimeout(timeoutId);

      if (response.ok) {
        const html = await response.text();
        const $ = cheerio.load(html);

        const title = $("title").text().trim() || null;
        const description =
          $('meta[name="description"]').attr("content")?.trim() ||
          $('meta[property="og:description"]').attr("content")?.trim() ||
          null;
        const h1Elements = $("h1");
        const h1 = h1Elements.first().text().trim() || null;
        const h1Count = h1Elements.length;
        const canonical = $('link[rel="canonical"]').attr("href")?.trim() || null;
        const robots = $('meta[name="robots"]').attr("content")?.trim() || null;

        const imgs = $("img");
        let withAlt = 0;
        imgs.each((_, el) => {
          const alt = $(el).attr("alt");
          if (alt && alt.trim().length > 0) withAlt++;
        });
        const totalImgs = imgs.length;

        quickChecks = {
          title,
          description,
          h1,
          h1Count,
          canonical,
          robots,
          imageAlt: {
            total: totalImgs,
            withAlt,
            missingAlt: totalImgs - withAlt,
            percent: totalImgs === 0 ? 100 : Math.round((withAlt / totalImgs) * 100),
          },
        };
      }
    } catch (phase1Err) {
      console.warn("Phase 1 direct HTML fetch warning:", phase1Err);
      // Non-fatal: if direct HTML fails, continue to PSI
    }

    timings.phase1Ms = Date.now() - phase1Start;

    // Save Phase 1 progress to Supabase immediately so client renders quick checks
    await updateScan(scanId, {
      status: "running",
      quick_checks: quickChecks,
      timings,
    });

    // ══════════════════════════════════════════════════════════════════
    // PHASE 2: GOOGLE PAGESPEED INSIGHTS (PSI)
    // ══════════════════════════════════════════════════════════════════
    const phase2Start = Date.now();

    // Call PSI with timeout
    const psiPromise = psi(url, {
      key: process.env.VITALS_PAGESPEED_API_KEY,
      strategy,
    });

    // 35s max timeout for PSI
    const psiTimeout = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("Google PageSpeed Insights API timed out after 35s.")), 35000)
    );

    const { data } = await Promise.race([psiPromise, psiTimeout]);

    const categories = data.lighthouseResult?.categories;
    const scores = {
      performance: Math.round((categories?.performance?.score ?? 0) * 100),
      accessibility: Math.round((categories?.accessibility?.score ?? 0) * 100),
      bestPractices: Math.round((categories?.["best-practices"]?.score ?? 0) * 100),
      seo: Math.round((categories?.seo?.score ?? 0) * 100),
    };

    const audits = (data.lighthouseResult?.audits || {}) as Record<string, any>;

    // Extract key Core Web Vitals metrics
    const keyMetrics = {
      fcp: audits["first-contentful-paint"]?.displayValue || null,
      lcp: audits["largest-contentful-paint"]?.displayValue || null,
      cls: audits["cumulative-layout-shift"]?.displayValue || null,
      tbt: audits["total-blocking-time"]?.displayValue || null,
      speedIndex: audits["speed-index"]?.displayValue || null,
      interactive: audits["interactive"]?.displayValue || null,
    };

    // Extract trimmed failing audits
    const failingAudits = Object.values(audits)
      .filter((a) => a && a.score !== null && a.score !== undefined && a.score < 1)
      .map((a) => ({
        id: a.id,
        title: a.title,
        description: a.description,
        score: a.score,
        displayValue: a.displayValue || null,
      }))
      .slice(0, 20); // Trim to top 20 failing audits to keep row light

    const rawCategoriesPayload = {
      categories: data.lighthouseResult?.categories || {},
      keyMetrics,
      failingAudits,
    };

    timings.phase2Ms = Date.now() - phase2Start;

    // Update scan with scores & PSI results immediately
    await updateScan(scanId, {
      score_performance: scores.performance,
      score_accessibility: scores.accessibility,
      score_best_practices: scores.bestPractices,
      score_seo: scores.seo,
      raw_categories: rawCategoriesPayload,
      timings,
    });

    // ══════════════════════════════════════════════════════════════════
    // PHASE 3: GEMINI AI SUMMARY (Non-blocking background generation)
    // ══════════════════════════════════════════════════════════════════
    const phase3Start = Date.now();
    let summaryText: string | null = null;

    try {
      const topFailing = failingAudits.slice(0, 6).map(
        (a) => `- ${a.title}: ${a.displayValue || ""} (${a.description?.replace(/\[([^\]]+)\]\([^\)]+\)/g, "$1") || ""})`
      ).join("\n");

      const prompt = `You are an expert SEO and web performance consultant. Summarize this audit for ${url} in a concise, structured markdown readout.

Scores (0-100):
- Performance: ${scores.performance}/100 (FCP: ${keyMetrics.fcp || "N/A"}, LCP: ${keyMetrics.lcp || "N/A"}, CLS: ${keyMetrics.cls || "N/A"}, TBT: ${keyMetrics.tbt || "N/A"})
- SEO: ${scores.seo}/100
- Accessibility: ${scores.accessibility}/100
- Best Practices: ${scores.bestPractices}/100

Quick Checks:
- Title: ${quickChecks?.title || "Missing"}
- Meta Description: ${quickChecks?.description || "Missing"}
- H1: ${quickChecks?.h1 || "Missing"} (${quickChecks?.h1Count ?? 0} found)
- Canonical: ${quickChecks?.canonical || "Not specified"}
- Images with Alt Text: ${quickChecks?.imageAlt ? `${quickChecks.imageAlt.withAlt}/${quickChecks.imageAlt.total} (${quickChecks.imageAlt.percent}%)` : "N/A"}

Top Failing Audits:
${topFailing || "None - all audits passed!"}

Provide:
1. **Executive Verdict**: 1-2 sentence overall health summary.
2. **Top 3 High-Impact Fixes**: Numbered by impact. Be concrete with exact fixes (e.g. Next.js/Tailwind optimizations).
3. **Quick SEO Wins**: 2-3 quick bullet points.

Keep the summary clear, professional, and under 250 words.`;

      const { text } = await generateText({
        model: geminiFlash,
        prompt,
      });

      summaryText = text;
    } catch (phase3Err) {
      console.warn("Phase 3 AI summary generation error:", phase3Err);
      summaryText = "AI summary generation was skipped or encountered a temporary issue. You can ask specific questions in the Assistant tab.";
    }

    timings.phase3Ms = Date.now() - phase3Start;
    timings.totalMs = Date.now() - startTime;

    // Mark scan as DONE with summary and complete timings
    await updateScan(scanId, {
      status: "done",
      summary: summaryText,
      timings,
    });

    console.log(`Scan ${scanId} completed in ${timings.totalMs}ms (Phase 1: ${timings.phase1Ms}ms, Phase 2: ${timings.phase2Ms}ms, Phase 3: ${timings.phase3Ms}ms)`);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Audit processing failed.";
    console.error(`Scan ${scanId} failed:`, errorMessage);

    timings.totalMs = Date.now() - startTime;
    await updateScan(scanId, {
      status: "failed",
      error_text: errorMessage,
      timings,
    });
  }
}
