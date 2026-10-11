import { chromium } from "@playwright/test";
import path from "path";
import fs from "fs";

const VERCEL_URL = "https://vitals-red-six.vercel.app";
const LOCAL_URL = "http://localhost:3000";
const SCAN_ID = "7ad15c9e-92c3-425e-a620-b6bc78351b9f";

const outDir = path.resolve("audit/screenshots");
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

async function run() {
  const browser = await chromium.launch({
    executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    headless: true,
  });

  const mobileContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
    userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Mobile/15E148 Safari/604.1",
    deviceScaleFactor: 2,
  });

  console.log("Capturing screenshots...");

  // 1. Before Landing (Vercel)
  try {
    const pageBefore = await mobileContext.newPage();
    await pageBefore.goto(VERCEL_URL, { waitUntil: "networkidle", timeout: 25000 });
    await pageBefore.screenshot({ path: path.join(outDir, "before.png"), fullPage: false });
    await pageBefore.screenshot({ path: path.join(outDir, "before-full.png"), fullPage: true });
    console.log("Captured before.png");
    await pageBefore.close();
  } catch (e) {
    console.warn("Warning capturing before:", e.message);
  }

  // 2. After Landing (Local)
  try {
    const pageAfter = await mobileContext.newPage();
    await pageAfter.goto(LOCAL_URL, { waitUntil: "networkidle", timeout: 15000 });
    await pageAfter.screenshot({ path: path.join(outDir, "after.png"), fullPage: false });
    await pageAfter.screenshot({ path: path.join(outDir, "after-full.png"), fullPage: true });
    console.log("Captured after.png");

    // 3. Focus skip-link demonstration
    await pageAfter.keyboard.press("Tab");
    await pageAfter.screenshot({ path: path.join(outDir, "after-skip-link.png") });
    console.log("Captured after-skip-link.png");
    await pageAfter.close();
  } catch (e) {
    console.warn("Warning capturing after:", e.message);
  }

  // 4. After Readout
  try {
    const pageReadout = await mobileContext.newPage();
    await pageReadout.goto(`${LOCAL_URL}/readout/${SCAN_ID}`, { waitUntil: "networkidle", timeout: 15000 });
    await pageReadout.screenshot({ path: path.join(outDir, "after-readout.png"), fullPage: false });
    console.log("Captured after-readout.png");
    await pageReadout.close();
  } catch (e) {
    console.warn("Warning capturing readout:", e.message);
  }

  // 5. After Assistant
  try {
    const pageAssistant = await mobileContext.newPage();
    await pageAssistant.goto(`${LOCAL_URL}/assistant/${SCAN_ID}`, { waitUntil: "networkidle", timeout: 15000 });
    await pageAssistant.screenshot({ path: path.join(outDir, "after-assistant.png"), fullPage: false });
    console.log("Captured after-assistant.png");
    await pageAssistant.close();
  } catch (e) {
    console.warn("Warning capturing assistant:", e.message);
  }

  await browser.close();
  console.log("Screenshot capture complete.");
}

run().catch(console.error);
