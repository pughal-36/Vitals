import fs from "fs";

const r = JSON.parse(fs.readFileSync("./audit/after/readout.report.json", "utf-8"));
const clsAudit = r.audits["layout-shifts"] || r.audits["cumulative-layout-shift"];
console.log("CLS Details:", JSON.stringify(clsAudit?.details?.items, null, 2));
const culprits = r.audits["layout-shift-culprits"];
console.log("Culprits:", JSON.stringify(culprits?.details?.items, null, 2));
