import { execSync } from "child_process";
import { chromium } from "@playwright/test";
import fs from "fs";
import path from "path";

const BASE_URL = "http://localhost:3000";
const SCAN_ID = "7ad15c9e-92c3-425e-a620-b6bc78351b9f";

const PAGES = [
  { name: "home", url: `${BASE_URL}/` },
  { name: "about", url: `${BASE_URL}/about` },
  { name: "readout", url: `${BASE_URL}/readout/${SCAN_ID}` },
  { name: "assistant", url: `${BASE_URL}/assistant/${SCAN_ID}` },
];

const targetDir = "audit/after";
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

async function runLighthouse(pageItem) {
  const outputPath = path.join(targetDir, pageItem.name);
  console.log(`\n========================================`);
  console.log(`[Lighthouse AFTER] Auditing ${pageItem.name}: ${pageItem.url}`);
  console.log(`========================================`);
  
  process.env.CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
  const cmd = `node ./node_modules/lighthouse/cli/index.js "${pageItem.url}" --form-factor=mobile --output=json --output=html --output-path="${outputPath}" --chrome-flags="--headless --no-sandbox"`;
  
  try {
    execSync(cmd, { stdio: "inherit" });
    console.log(`[Lighthouse] Saved to ${outputPath}.report.json & .html`);
  } catch (err) {
    console.error(`[Lighthouse] Error on ${pageItem.name}:`, err.message);
  }
}

async function runAxe(browser, pageItem) {
  const page = await browser.newPage({
    viewport: { width: 390, height: 844 },
    userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Mobile/15E148 Safari/604.1",
  });
  
  console.log(`\n========================================`);
  console.log(`[axe-core AFTER] Scanning ${pageItem.name}: ${pageItem.url}`);
  console.log(`========================================`);
  
  await page.goto(pageItem.url, { waitUntil: "networkidle", timeout: 30000 }).catch(e => console.warn("Navigation warning:", e.message));
  await page.waitForTimeout(1000);
  
  const axeSource = fs.readFileSync("./node_modules/axe-core/axe.min.js", "utf-8");
  await page.evaluate(axeSource);
  
  const results = await page.evaluate(async () => {
    return await window.axe.run({
      runOnly: {
        type: "tag",
        values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "best-practice"],
      },
    });
  });
  
  const axeOutputPath = path.join(targetDir, `${pageItem.name}.axe.json`);
  fs.writeFileSync(axeOutputPath, JSON.stringify(results, null, 2));
  
  console.log(`[axe-core AFTER] Violations: ${results.violations.length}`);
  results.violations.forEach((v) => {
    console.log(`  - [${v.impact?.toUpperCase()}] ${v.id}: ${v.help} (${v.nodes.length} occurrences)`);
  });
  
  console.log(`[axe-core AFTER] Incomplete/Alerts: ${results.incomplete.length}`);
  results.incomplete.forEach((inc) => {
    console.log(`  - [ALERT] ${inc.id}: ${inc.help} (${inc.nodes.length} occurrences)`);
  });
  
  await page.close();
  return results;
}

async function main() {
  for (const pageItem of PAGES) {
    await runLighthouse(pageItem);
  }

  const browser = await chromium.launch({
    executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    headless: true,
  });

  const axeResults = {};
  for (const pageItem of PAGES) {
    axeResults[pageItem.name] = await runAxe(browser, pageItem);
  }
  await browser.close();

  console.log("\n=======================================================");
  console.log("            BEFORE vs AFTER COMPARISON TABLE");
  console.log("=======================================================");
  console.log("| Page | Metric | Before | After | Delta |");
  console.log("|------|--------|--------|-------|-------|");

  const metrics = ["perf", "a11y", "bp", "seo", "lcp", "tbt", "cls"];

  function getMetrics(dir, name) {
    const reportPath = path.join(dir, `${name}.report.json`);
    if (!fs.existsSync(reportPath)) return {};
    const data = JSON.parse(fs.readFileSync(reportPath, "utf-8"));
    return {
      perf: data.categories?.performance ? Math.round(data.categories.performance.score * 100) : "N/A",
      a11y: data.categories?.accessibility ? Math.round(data.categories.accessibility.score * 100) : "N/A",
      bp: data.categories?.["best-practices"] ? Math.round(data.categories["best-practices"].score * 100) : "N/A",
      seo: data.categories?.seo ? Math.round(data.categories.seo.score * 100) : "N/A",
      lcp: data.audits?.["largest-contentful-paint"]?.displayValue || "N/A",
      tbt: data.audits?.["total-blocking-time"]?.displayValue || "N/A",
      cls: data.audits?.["cumulative-layout-shift"]?.displayValue || "N/A",
    };
  }

  for (const pageItem of PAGES) {
    const before = getMetrics("audit/before", pageItem.name);
    const after = getMetrics("audit/after", pageItem.name);
    
    for (const m of metrics) {
      const bVal = before[m] ?? "N/A";
      const aVal = after[m] ?? "N/A";
      let delta = "-";
      if (typeof bVal === "number" && typeof aVal === "number") {
        const d = aVal - bVal;
        delta = d >= 0 ? `+${d}` : `${d}`;
      }
      console.log(`| ${pageItem.name} | ${m.toUpperCase()} | ${bVal} | ${aVal} | ${delta} |`);
    }
  }
}

main().catch(console.error);
