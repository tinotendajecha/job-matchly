const brand = { green: "#A4FF3C", text: "#0f172a", muted: "#64748b", border: "#e2e8f0", surface: "#ffffff", bg: "#f8fafc" };

export async function sendReceiptEmail(input: {
  to: string;
  name: string;
  description: string;
  amountDisplay: string;
  providerRef: string;
  purchaseId: string;
  dateISO: string;
}) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM || "JobMatchly <no-reply@jobmatchly.app>";
  if (!apiKey || !input.to) return;

  const subject = `Payment received — ${input.description}`;
  const html = `<!doctype html><html><body style="margin:0;padding:0;background:${brand.bg}">
    <table width="100%" cellspacing="0" cellpadding="0" style="background:${brand.bg};padding:24px 0;">
      <tr><td align="center">
        <table width="600" style="width:600px;max-width:92%;background:${brand.surface};border:1px solid ${brand.border};border-radius:20px;">
          <tr><td><div style="height:6px;background:${brand.green};border-radius:20px 20px 0 0;"></div></td></tr>
          <tr><td style="padding:28px">
            <h1 style="margin:0 0 8px 0;font-family:Inter,system-ui,sans-serif;color:${brand.text};font-size:22px">Thanks, your payment is complete</h1>
            <p style="margin:0 0 12px 0;font-family:Inter,system-ui,sans-serif;color:${brand.muted};font-size:14px">
              Hi ${input.name}, your payment for <strong>${input.description}</strong> has been confirmed.
            </p>
            <div style="margin-top:12px;border:1px solid ${brand.border};border-radius:12px;padding:14px;background:${brand.bg};font-family:Inter,system-ui,sans-serif;color:${brand.text}">
              <div style="display:flex;justify-content:space-between;margin-bottom:6px"><span>Amount</span><strong>${input.amountDisplay}</strong></div>
              <div style="display:flex;justify-content:space-between;margin-bottom:6px"><span>Reference</span><strong>${input.providerRef}</strong></div>
              <div style="display:flex;justify-content:space-between"><span>Purchase ID</span><strong>${input.purchaseId}</strong></div>
              <div style="margin-top:8px;font-size:12px;color:${brand.muted}">Date: ${new Date(input.dateISO).toLocaleString()}</div>
            </div>
            <p style="margin-top:14px;font-family:Inter,system-ui,sans-serif;color:${brand.muted};font-size:12px">Keep this email for your records.</p>
          </td></tr>
        </table>
      </td></tr>
    </table>
  </body></html>`;

  const text = `Thanks, your payment is complete.\n\nAmount: ${input.amountDisplay}\nReference: ${input.providerRef}\nPurchase ID: ${input.purchaseId}\nDate: ${new Date(input.dateISO).toLocaleString()}\n\n— JobMatchly`;

  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from, to: input.to, subject, html, text }),
  }).then(async (r) => {
    if (!r.ok) console.error("Resend receipt failed:", r.status, await r.text().catch(() => ""));
  });
}
