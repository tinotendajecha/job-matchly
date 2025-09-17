import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY || "");



const FROM = process.env.EMAIL_FROM || "JobMatchly <no-reply@example.com>";

export function verifyEmailSubject() {
  return "Verify your email — JobMatchly";
}

export function verifyEmailText(code: string) {
  return `Your JobMatchly verification code is: ${code}

Enter this 6-digit code within 15 minutes to verify your email.

If you didn't request this, you can safely ignore this email.`;
}



export function verifyEmailHTML(code: string) {
  // brand
  const brandGreen = "#A4FF3C";  // light theme primary
  const brandText  = "#0f172a";  // slate-900-ish
  const mutedText  = "#64748b";  // slate-500
  const cardBorder = "#e2e8f0";  // slate-200
  const surface    = "#ffffff";  // white
  const bg         = "#f8fafc";  // slate-50

  // preheader (hidden preview line in inbox)
  const preheader =
    "Use this 6-digit code within 15 minutes to verify your JobMatchly account.";

  return `<!doctype html>
<html lang="en">
  <head>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>Verify your email — JobMatchly</title>
    <meta name="color-scheme" content="light only" />
    <meta name="supported-color-schemes" content="light" />
    <style>
      /* some clients respect this, but all critical styles are inline */
      @media (max-width: 600px) {
        .container { width: 100% !important; }
        .card { border-radius: 16px !important; }
        .code { font-size: 22px !important; letter-spacing: 8px !important; }
      }
    </style>
  </head>
  <body style="margin:0;padding:0;background:${bg};">
    <!-- hidden preview text -->
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">
      ${preheader}
    </div>

    <table role="presentation" width="100%" cellPadding="0" cellSpacing="0" style="background:${bg};padding:24px 0;">
      <tr>
        <td align="center">
          <table role="presentation" width="600" class="container" cellPadding="0" cellSpacing="0" style="width:600px;max-width:92%;background:${surface};border:1px solid ${cardBorder};border-radius:20px;box-shadow:0 2px 10px rgba(15,23,42,.04);">
            <!-- Brand bar -->
            <tr>
              <td style="padding:0;">
                <div style="height:6px;background:${brandGreen};border-radius:20px 20px 0 0;"></div>
              </td>
            </tr>

            <!-- Header -->
            <tr>
              <td style="padding:28px 28px 0 28px;">
                <table role="presentation" width="100%">
                  <tr>
                    <td style="text-align:left;">
                      <div style="display:inline-block;padding:10px 12px;background:${brandGreen};border-radius:12px;">
                        <span style="font-family:Inter,system-ui,-apple-system,'Segoe UI',Roboto,Arial,sans-serif;font-weight:700;color:#000;font-size:14px;letter-spacing:.2px">JobMatchly</span>
                      </div>
                      <div style="height:16px;"></div>
                      <h1 style="margin:0 0 8px 0;font-family:Inter,system-ui,-apple-system,'Segoe UI',Roboto,Arial,sans-serif;font-size:22px;line-height:1.35;color:${brandText};">
                        Verify your email ✉️
                      </h1>
                      <p style="margin:0 0 16px 0;font-family:Inter,system-ui,-apple-system,'Segoe UI',Roboto,Arial,sans-serif;font-size:14px;color:${mutedText};">
                        Thanks for signing up for <strong style="color:${brandText};">JobMatchly</strong>. Enter the code below to finish creating your account.
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- Code block -->
            <tr>
              <td style="padding:8px 28px 0 28px;">
                <table role="presentation" width="100%">
                  <tr>
                    <td style="padding:16px 18px;border:1px solid ${cardBorder};border-radius:14px;background:${bg};text-align:center;">
                      <div class="code" style="font-family:ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace;font-size:26px;letter-spacing:10px;font-weight:800;color:${brandText};">
                        ${code}
                      </div>
                      <div style="height:8px;"></div>
                      <div style="font-family:Inter,system-ui,-apple-system,'Segoe UI',Roboto,Arial,sans-serif;font-size:12px;color:${mutedText};">
                        Expires in <strong style="color:${brandText};">15 minutes</strong>
                      </div>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- Help & safety -->
            <tr>
              <td style="padding:18px 28px 4px 28px;">
                <p style="margin:0;font-family:Inter,system-ui,-apple-system,'Segoe UI',Roboto,Arial,sans-serif;font-size:13px;color:${mutedText};">
                  Didn’t request this? You can safely ignore this email and your address won’t be verified.
                </p>
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td style="padding:20px 28px 28px 28px;">
                <hr style="border:0;border-top:1px solid ${cardBorder};margin:0 0 12px 0;" />
                <p style="margin:0 0 4px 0;font-family:Inter,system-ui,-apple-system,'Segoe UI',Roboto,Arial,sans-serif;font-size:12px;color:${mutedText};">
                  From: JobMatchly • Automated notification
                </p>
                <p style="margin:0;font-family:Inter,system-ui,-apple-system,'Segoe UI',Roboto,Arial,sans-serif;font-size:12px;color:${mutedText};">
                  Please don’t reply to this email.
                </p>
              </td>
            </tr>
          </table>

          <div style="height:12px;"></div>

          <table role="presentation" width="600" class="container" cellPadding="0" cellSpacing="0" style="width:600px;max-width:92%;">
            <tr>
              <td style="text-align:center;font-family:Inter,system-ui,-apple-system,'Segoe UI',Roboto,Arial,sans-serif;font-size:11px;color:${mutedText};">
                © ${new Date().getFullYear()} JobMatchly
              </td>
            </tr>
          </table>

        </td>
      </tr>
    </table>
  </body>
</html>`;
}

// keep the same signature your signup route already calls
export async function sendVerificationEmail(to: string, code: string) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM || "JobMatchly <no-reply@jobmatchly.app>";

  // Dev fallback
  if (!apiKey) {
    console.log(`[DEV] Verification code for ${to}: ${code}`);
    return;
  }

  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to,
      subject: verifyEmailSubject(),
      html: verifyEmailHTML(code),
      text: verifyEmailText(code),
    }),
  }).then(async (r) => {
    if (!r.ok) {
      console.error("Resend failed:", r.status, await r.text().catch(() => ""));
    }
  });
}
