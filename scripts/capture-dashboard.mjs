import { chromium } from "playwright-core";

const browser = await chromium.launch({
  executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  headless: true,
});

try {
  const mobilePage = await browser.newPage({ viewport: { width: 393, height: 852 }, deviceScaleFactor: 1 });
  await mobilePage.goto("http://localhost:3000/", { waitUntil: "networkidle" });
  await mobilePage.screenshot({ path: "docs/design/dashboard-mobile-render.png", fullPage: true });

  const desktopPage = await browser.newPage({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1 });
  await desktopPage.goto("http://localhost:3000/", { waitUntil: "networkidle" });
  await desktopPage.screenshot({ path: "docs/design/dashboard-desktop-render.png", fullPage: true });
} finally {
  await browser.close();
}
