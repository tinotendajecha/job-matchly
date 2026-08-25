const { chromium } = require("playwright");
(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  await ctx.addCookies([{ name: "session_token", value: process.argv[2], domain: "localhost", path: "/", httpOnly: true, sameSite: "Lax" }]);
  const page = await ctx.newPage();
  page.on("console", m => console.log("CONSOLE", m.type(), m.text().slice(0,200)));
  page.on("pageerror", e => console.log("PAGEERROR", e.message.slice(0,200)));
  page.on("response", r => { if (r.url().includes("/api/")) console.log("RESP", r.status(), r.url()); });
  await page.goto("http://localhost:3000/app/admin", { waitUntil: "domcontentloaded", timeout: 120000 });
  await page.waitForTimeout(9000);
  console.log("BODY:", (await page.locator("body").innerText().catch(()=> "")).replace(/\s+/g," ").slice(0,300));
  await browser.close();
})().catch(e => console.error("failed:", e.message));
