// lib/mail.ts
export async function sendVerificationEmail(to: string, code: string) {
  // TODO: integrate real provider (Resend, Mailgun, SES, etc.)
  // For now, log so you can copy the code while testing:
  console.log(`[DEV] Verification code for ${to}: ${code}`);
}
