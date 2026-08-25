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

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Admin-authored broadcast. `bodyText` is PLAIN TEXT written in the admin
 * composer — it is escaped, then blank-line-separated blocks become paragraphs.
 */
export function broadcastEmailHTML(opts: {
  subject: string;
  bodyText: string;
  name?: string | null;
  unsubscribeUrl?: string;
}) {
  const brandGreen = "#A4FF3C";
  const brandText = "#0f172a";
  const mutedText = "#64748b";
  const cardBorder = "#e2e8f0";
  const surface = "#ffffff";
  const bg = "#f8fafc";

  const greetingName = (opts.name || "there").trim() || "there";
  const personalized = opts.bodyText.replace(/\{\{\s*name\s*\}\}/gi, greetingName);

  const paragraphs = escapeHtml(personalized)
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter(Boolean)
    .map(
      (block) =>
        `<p style="margin:0 0 14px 0;font-family:Inter,system-ui,-apple-system,'Segoe UI',Roboto,Arial,sans-serif;font-size:14px;line-height:1.6;color:${brandText};">${block.replace(
          /\n/g,
          "<br />"
        )}</p>`
    )
    .join("");

  const unsubscribeBlock = opts.unsubscribeUrl
    ? `<p style="margin:8px 0 0 0;font-family:Inter,system-ui,-apple-system,'Segoe UI',Roboto,Arial,sans-serif;font-size:12px;color:${mutedText};">
         Don't want these emails? <a href="${opts.unsubscribeUrl}" style="color:${mutedText};">Unsubscribe</a>.
       </p>`
    : "";

  return `<!doctype html>
<html lang="en">
  <head>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>${escapeHtml(opts.subject)}</title>
    <meta name="color-scheme" content="light only" />
  </head>
  <body style="margin:0;padding:0;background:${bg};">
    <table role="presentation" width="100%" cellPadding="0" cellSpacing="0" style="background:${bg};padding:24px 0;">
      <tr>
        <td align="center">
          <table role="presentation" width="600" cellPadding="0" cellSpacing="0" style="width:600px;max-width:92%;background:${surface};border:1px solid ${cardBorder};border-radius:20px;">
            <tr><td style="padding:0;"><div style="height:6px;background:${brandGreen};border-radius:20px 20px 0 0;"></div></td></tr>
            <tr>
              <td style="padding:28px 28px 8px 28px;">
                <div style="display:inline-block;padding:10px 12px;background:${brandGreen};border-radius:12px;">
                  <span style="font-family:Inter,system-ui,-apple-system,'Segoe UI',Roboto,Arial,sans-serif;font-weight:700;color:#000;font-size:14px;">JobMatchly</span>
                </div>
                <div style="height:16px;"></div>
                <h1 style="margin:0 0 14px 0;font-family:Inter,system-ui,-apple-system,'Segoe UI',Roboto,Arial,sans-serif;font-size:20px;line-height:1.35;color:${brandText};">
                  ${escapeHtml(opts.subject)}
                </h1>
                ${paragraphs}
              </td>
            </tr>
            <tr>
              <td style="padding:12px 28px 28px 28px;">
                <hr style="border:0;border-top:1px solid ${cardBorder};margin:0 0 12px 0;" />
                <p style="margin:0;font-family:Inter,system-ui,-apple-system,'Segoe UI',Roboto,Arial,sans-serif;font-size:12px;color:${mutedText};">
                  © ${new Date().getFullYear()} JobMatchly
                </p>
                ${unsubscribeBlock}
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

/**
 * Deliberately plain: no logo, no colour bar, no card, no buttons, no images.
 * Gmail's Promotions classifier keys heavily on marketing chrome, so a
 * re-engagement note stands a much better chance of Primary looking like this.
 */
export function personalEmailHTML(opts: {
  bodyText: string;
  name?: string | null;
  unsubscribeUrl?: string;
}) {
  const greetingName = (opts.name || "there").trim() || "there";
  const personalized = opts.bodyText.replace(/\{\{\s*name\s*\}\}/gi, greetingName);

  const paragraphs = escapeHtml(personalized)
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter(Boolean)
    .map(
      (block) =>
        `<p style="margin:0 0 16px 0;">${block.replace(/\n/g, "<br />")}</p>`
    )
    .join("");

  const unsubscribeBlock = opts.unsubscribeUrl
    ? `<p style="margin:24px 0 0 0;font-size:12px;color:#888;">
         <a href="${opts.unsubscribeUrl}" style="color:#888;">Unsubscribe from these emails</a>
       </p>`
    : "";

  return `<!doctype html>
<html lang="en">
  <head><meta charset="utf-8" /><meta name="viewport" content="width=device-width,initial-scale=1" /></head>
  <body style="margin:0;padding:0;background:#ffffff;">
    <div style="max-width:560px;margin:0;padding:16px;font-family:-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:15px;line-height:1.6;color:#222222;">
      ${paragraphs}
      ${unsubscribeBlock}
    </div>
  </body>
</html>`;
}

export function broadcastEmailText(bodyText: string, name?: string | null, unsubscribeUrl?: string) {
  const greetingName = (name || "there").trim() || "there";
  const personalized = bodyText.replace(/\{\{\s*name\s*\}\}/gi, greetingName);
  return unsubscribeUrl ? `${personalized}\n\n—\nUnsubscribe: ${unsubscribeUrl}` : personalized;
}

export interface BroadcastRecipient {
  email: string;
  name?: string | null;
  userId?: string;
  unsubscribeUrl?: string;
}

export interface BroadcastRecipientResult {
  email: string;
  userId?: string;
  /** Resend's message id — required to look the delivery up later. */
  resendId?: string;
  accepted: boolean;
  error?: string;
}

const RESEND_BATCH_LIMIT = 100;

export type BroadcastStyle = "PERSONAL" | "BRANDED";

/**
 * Broadcasts send from a human-looking address rather than the no-reply used
 * for verification mail — a no-reply sender is a strong "bulk mail" signal.
 */
function broadcastFrom(): string {
  return (
    process.env.BROADCAST_FROM ||
    process.env.EMAIL_FROM ||
    "JobMatchly <no-reply@jobmatchly.app>"
  );
}

/** Omitted entirely when unset — a Reply-To that bounces is worse than none. */
function broadcastReplyTo(): string | undefined {
  return process.env.BROADCAST_REPLY_TO || undefined;
}

function renderBody(
  style: BroadcastStyle,
  opts: { subject: string; bodyText: string; name?: string | null; unsubscribeUrl?: string }
): string {
  return style === "PERSONAL"
    ? personalEmailHTML({ bodyText: opts.bodyText, name: opts.name, unsubscribeUrl: opts.unsubscribeUrl })
    : broadcastEmailHTML(opts);
}

/**
 * Sends one personalized email per recipient via Resend's batch endpoint and
 * reports the outcome PER RECIPIENT, capturing each message id so delivery can
 * be verified afterwards. A failing chunk marks only its own recipients failed
 * rather than aborting the rest of the run.
 */
export async function sendBroadcastBatch(
  recipients: BroadcastRecipient[],
  subject: string,
  bodyText: string,
  style: BroadcastStyle = "PERSONAL"
): Promise<BroadcastRecipientResult[]> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = broadcastFrom();
  const replyTo = broadcastReplyTo();

  if (!apiKey) {
    console.log(`[DEV] Would broadcast "${subject}" to ${recipients.length} recipient(s)`);
    return recipients.map((r) => ({
      email: r.email,
      userId: r.userId,
      accepted: false,
      error: "RESEND_API_KEY not configured",
    }));
  }

  const results: BroadcastRecipientResult[] = [];

  for (let i = 0; i < recipients.length; i += RESEND_BATCH_LIMIT) {
    const chunk = recipients.slice(i, i + RESEND_BATCH_LIMIT);
    const payload = chunk.map((r) => ({
      from,
      to: r.email,
      subject,
      ...(replyTo ? { reply_to: replyTo } : {}),
      html: renderBody(style, { subject, bodyText, name: r.name, unsubscribeUrl: r.unsubscribeUrl }),
      text: broadcastEmailText(bodyText, r.name, r.unsubscribeUrl),
    }));

    try {
      const res = await fetch("https://api.resend.com/emails/batch", {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const raw = await res.text().catch(() => "");

      if (!res.ok) {
        const message = `Resend ${res.status}: ${raw.slice(0, 300)}`;
        console.error("Resend batch failed:", message);
        chunk.forEach((r) => results.push({ email: r.email, userId: r.userId, accepted: false, error: message }));
        continue;
      }

      // Success body is { data: [{ id }, ...] } in the same order as the request.
      let ids: Array<{ id?: string }> = [];
      try {
        ids = JSON.parse(raw)?.data ?? [];
      } catch {
        /* fall through — treated as missing ids below */
      }

      chunk.forEach((r, idx) => {
        const id = ids[idx]?.id;
        results.push({
          email: r.email,
          userId: r.userId,
          resendId: id,
          accepted: Boolean(id),
          error: id ? undefined : "Resend accepted the request but returned no message id",
        });
      });
    } catch (e) {
      const message = (e as Error)?.message || String(e);
      console.error("Resend batch threw:", message);
      chunk.forEach((r) => results.push({ email: r.email, userId: r.userId, accepted: false, error: message }));
    }
  }

  return results;
}

/** Current delivery state of one message, straight from Resend. */
export async function fetchResendEvent(resendId: string): Promise<string | null> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;
  try {
    const res = await fetch(`https://api.resend.com/emails/${resendId}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    if (!res.ok) return null;
    return (await res.json())?.last_event ?? null;
  } catch {
    return null;
  }
}

/**
 * Single email — used by the composer's "send test" button.
 * `unsubscribeUrl` is passed so the test is a faithful preview of what real
 * recipients get, and so a broken/missing signing secret surfaces here rather
 * than partway through a real broadcast.
 */
export async function sendSingleBroadcastEmail(
  to: string,
  subject: string,
  bodyText: string,
  opts: { name?: string | null; unsubscribeUrl?: string; style?: BroadcastStyle } = {}
) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = broadcastFrom();
  const replyTo = broadcastReplyTo();

  if (!apiKey) {
    console.log(`[DEV] Would send test "${subject}" to ${to}`);
    return;
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from,
      to,
      subject,
      ...(replyTo ? { reply_to: replyTo } : {}),
      html: renderBody(opts.style ?? "PERSONAL", {
        subject,
        bodyText,
        name: opts.name ?? null,
        unsubscribeUrl: opts.unsubscribeUrl,
      }),
      text: broadcastEmailText(bodyText, opts.name ?? null, opts.unsubscribeUrl),
    }),
  });

  if (!res.ok) {
    throw new Error(`Resend failed (${res.status}): ${await res.text().catch(() => "")}`);
  }
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
