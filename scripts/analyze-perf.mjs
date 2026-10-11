import fs from "fs";

function analyzePerf(file) {
  console.log(`\n=== Analyzing ${file} ===`);
  const data = JSON.parse(fs.readFileSync(file, "utf-8"));
  const audits = data.audits || {};
  
  const metrics = [
    "first-contentful-paint",
    "largest-contentful-paint",
    "total-blocking-time",
    "cumulative-layout-shift",
    "speed-index",
    "interactive"
  ];
  
  metrics.forEach(m => {
    const a = audits[m];
    if (a) {
      console.log(`${m}: score=${a.score}, displayValue=${a.displayValue}, numericValue=${Math.round(a.numericValue)}`);
    }
  });

  console.log("\nOpportunities / Diagnostics with savings:");
  Object.keys(audits).forEach(k => {
    const a = audits[k];
    if (a.details && a.details.overallSavingsMs && a.details.overallSavingsMs > 100) {
      console.log(`- ${k}: ${a.title} (${a.details.overallSavingsMs}ms)`);
    }
    if (a.details && a.details.overallSavingsBytes && a.details.overallSavingsBytes > 20000) {
      console.log(`- ${k}: ${a.title} (${Math.round(a.details.overallSavingsBytes / 1024)}KB)`);
    }
  });
}

analyzePerf("./audit/after/readout.report.json");
analyzePerf("./audit/after/assistant.report.json");
