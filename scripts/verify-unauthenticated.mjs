import { tmpdir } from "node:os";
import { join } from "node:path";
import { chromium } from "playwright-core";

const baseUrl = process.env.QA_BASE_URL ?? "http://localhost:3000";
const widths = [320, 375, 393];
const browser = await chromium.launch({
  executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  headless: true,
});

const results = [];

try {
  for (const width of widths) {
    const page = await browser.newPage({ viewport: { width, height: 852 }, deviceScaleFactor: 1 });
    const messages = [];
    page.on("console", (message) => {
      if (["error", "warning"].includes(message.type())) messages.push(`${message.type()}: ${message.text()}`);
    });
    page.on("pageerror", (error) => messages.push(`pageerror: ${error.message}`));

    await page.goto(`${baseUrl}/study`, { waitUntil: "networkidle" });
    const protectedRouteRedirected = new URL(page.url()).pathname === "/login";
    const heading = await page.getByRole("heading", { name: "欢迎回来" }).textContent();
    const bodyHasHorizontalOverflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
    const frameworkOverlay = await page.locator("[data-nextjs-dialog], .vite-error-overlay, #webpack-dev-server-client-overlay").count();
    await page.getByRole("button", { name: "登录" }).click();
    const nativeValidationBlockedSubmit = await page.locator('input[name="email"]').evaluate((input) => !input.validity.valid);
    const screenshot = join(tmpdir(), `executive-growth-os-login-${width}.png`);
    await page.screenshot({ path: screenshot, fullPage: true });

    results.push({
      width,
      protectedRouteRedirected,
      heading,
      bodyHasHorizontalOverflow,
      frameworkOverlay,
      nativeValidationBlockedSubmit,
      consoleMessages: messages,
      screenshot,
    });
    await page.close();
  }
} finally {
  await browser.close();
}

console.log(JSON.stringify(results, null, 2));

if (results.some((result) =>
  !result.protectedRouteRedirected
  || result.heading !== "欢迎回来"
  || result.bodyHasHorizontalOverflow
  || result.frameworkOverlay > 0
  || !result.nativeValidationBlockedSubmit
  || result.consoleMessages.length > 0
)) process.exitCode = 1;
