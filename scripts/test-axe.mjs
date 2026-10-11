import { chromium } from "@playwright/test";
import fs from "fs";

async function testAxe() {
  const browser = await chromium.launch({
    executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    headless: true,
  });
  const page = await browser.newPage();
  await page.goto("https://vitals-red-six.vercel.app/", { waitUntil: "networkidle" });
  
  const axeSource = fs.readFileSync("./node_modules/axe-core/axe.min.js", "utf-8");
  await page.evaluate(axeSource);
  const results = await page.evaluate(async () => {
    return await (window).axe.run();
  });
  
  console.log("Violations:", results.violations.length);
  results.violations.forEach((v) => {
    console.log(`- [${v.impact}] ${v.id}: ${v.description} (${v.nodes.length} nodes)`);
  });
  
  await browser.close();
}

testAxe().catch(console.error);
