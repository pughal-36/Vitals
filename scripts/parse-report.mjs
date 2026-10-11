import fs from "fs";

export function readReport(path) {
  const data = JSON.parse(fs.readFileSync(path, "utf-8"));
  const cats = data.categories || {};
  const audits = data.audits || {};

  const perf = cats.performance ? Math.round(cats.performance.score * 100) : "N/A";
  const a11y = cats.accessibility ? Math.round(cats.accessibility.score * 100) : "N/A";
  const bp = cats["best-practices"] ? Math.round(cats["best-practices"].score * 100) : "N/A";
  const seo = cats.seo ? Math.round(cats.seo.score * 100) : "N/A";

  const lcp = audits["largest-contentful-paint"]?.displayValue || audits["largest-contentful-paint"]?.numericValue + " ms" || "N/A";
  const tbt = audits["total-blocking-time"]?.displayValue || audits["total-blocking-time"]?.numericValue + " ms" || "N/A";
  const cls = audits["cumulative-layout-shift"]?.displayValue || audits["cumulative-layout-shift"]?.numericValue || "N/A";

  return {
    perf,
    a11y,
    bp,
    seo,
    lcp,
    tbt,
    cls,
    url: data.finalUrl || data.requestedUrl
  };
}

if (process.argv[2]) {
  console.log(JSON.stringify(readReport(process.argv[2]), null, 2));
}
