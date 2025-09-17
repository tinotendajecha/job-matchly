import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY || "");



const FROM = process.env.EMAIL_FROM || "JobMatchly <no-reply@example.com>";

function verifyEmailHTML(code: string) {
  return `
  <div style="font-family:Inter,system-ui,-apple-system,'Segoe UI',Roboto,Arial,sans-serif;line-height:1.6;color:#0f172a">
    <h2 style="margin:0 0 12px;font-weight:700">Verify your email</h2>
    <p>Thanks for signing up for <strong>JobMatchly</strong> 🎉</p>
    <p>Use this 6-digit code within <strong>15 minutes</strong>:</p>
    <div style="margin:16px 0;padding:14px 18px;border:1px solid #e2e8f0;border-radius:10px;display:inline-block;font-size:24px;letter-spacing:6px;font-weight:700;background:#f8fafc">
      ${code}
    </div>
    <p>If you didn’t request this, you can ignore this email.</p>
    <hr style="border:none;border-top:1px solid #e2e8f0;margin:18px 0" />
    <p style="font-size:12px;color:#64748b">From: JobMatchly • This mailbox is unattended.</p>
  </div>`;
}

// keep the same signature your signup route already calls
export async function sendVerificationEmail(to: string, code: string) {
  console.log(process.env.RESEND_API_KEY);
  if (!process.env.RESEND_API_KEY) {
    console.log(`[DEV] Verification code for ${to}: ${code}`);
    return;
  }
  await resend.emails.send({
    from: FROM,
    to,
    subject: "Verify your email — JobMatchly",
    html: verifyEmailHTML(code),
  });
}
