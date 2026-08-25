const { chromium } = require("playwright");
const TOKEN = process.argv[2];
const BASE = "https://www.jobmatchly.co.za";
(async () => {
  const browser = await chromium.launch();
  for (const [name, width, height] of [["phone", 390, 844], ["tablet", 768, 1024]]) {
    const ctx = await browser.newContext({ viewport: { width, height } });
    await ctx.addCookies([{ name: "session_token", value: TOKEN, domain: "www.jobmatchly.co.za", path: "/", httpOnly: true, secure: true, sameSite: "Lax" }, { name: "session_token", value: TOKEN, domain: "www.jobmatchly.site", path: "/", httpOnly: true, secure: true, sameSite: "Lax" }]);
    const page = await ctx.newPage();
    await page.goto(`${BASE}/app/admin`, { waitUntil: "networkidle", timeout: 120000 }).catch(()=>{});
    await page.waitForTimeout(4000);
    const btn = page.locator('button[aria-label="Toggle menu"]');
    console.log(`${name}: url=${page.url()} asides=${await page.locator("aside").count()} toggle=${await btn.count()}`);
    await page.screenshot({ path: `_tmp-${name}-closed.png` });

    if (await btn.count()) {
      await btn.first().click();
      await page.waitForTimeout(1200);
      await page.screenshot({ path: `_tmp-${name}-open.png` });
      const o = await page.evaluate(() => {
        const b = document.querySelector('button[aria-label="Toggle menu"]');
        const brand = Array.from(document.querySelectorAll("h1")).find(h => h.offsetParent !== null && h.textContent?.includes("JobMatchly"));
        const r1 = b.getBoundingClientRect();
        if (!brand) return { brandVisible:false, btn:{x:Math.round(r1.x),y:Math.round(r1.y)} };
        const r2 = brand.getBoundingClientRect();
        return { brandVisible:true,
          overlaps: !(r1.right<r2.left||r1.left>r2.right||r1.bottom<r2.top||r1.top>r2.bottom),
          btn:{x:Math.round(r1.x),y:Math.round(r1.y),w:Math.round(r1.width),h:Math.round(r1.height)},
          brand:{x:Math.round(r2.x),y:Math.round(r2.y),w:Math.round(r2.width),text:brand.textContent.trim()} };
      });
      console.log(`  ${name} OPEN ->`, JSON.stringify(o));
    }
    await ctx.close();
  }
  await browser.close();
})().catch(e => { console.error("failed:", e.message); process.exit(1); });
