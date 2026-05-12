import { mkdir, rename, rm } from "node:fs/promises";
import { join, resolve } from "node:path";

import { chromium } from "playwright";

const webUrl = process.env.WEB_URL ?? "http://localhost:5173";
const demoEmail = process.env.DEMO_EMAIL ?? "demo@databridge.dev";
const demoPassword = process.env.DEMO_PASSWORD ?? "Demo@123456";
const outputDir = resolve("../docs/assets/demo");
const outputFile = join(outputDir, "data-bridge-demo.webm");

await mkdir(outputDir, { recursive: true });
await rm(outputFile, { force: true });

const browser = await chromium.launch({
  channel: process.env.PLAYWRIGHT_CHANNEL ?? "msedge",
  headless: true,
});
const context = await browser.newContext({
  recordVideo: {
    dir: outputDir,
    size: { width: 1440, height: 900 },
  },
  viewport: { width: 1440, height: 900 },
});
const page = await context.newPage();

await page.goto(`${webUrl}/login`);
await page.waitForTimeout(700);
await page.locator('input[type="email"]').fill(demoEmail);
await page.locator('input[type="password"]').fill(demoPassword);
await page.locator('button[type="submit"]').click();
await page.waitForURL(`${webUrl}/app`, { timeout: 15_000 });
await page.waitForTimeout(1200);

for (const route of [
  "/app/datasets",
  "/app/imports",
  "/app/alerts",
  "/app/reports",
  "/app/audit",
  "/app/settings",
]) {
  await page.goto(`${webUrl}${route}`);
  await page.waitForTimeout(1200);
}

const video = page.video();
await page.close();
await context.close();
await browser.close();

if (video) {
  const generatedVideo = await video.path();
  await rename(generatedVideo, outputFile);
  console.log(`Demo video saved to ${outputFile}`);
}
