// lib/billing.ts
import { prisma } from "@/lib/prisma";
import { addCredits } from "@/lib/credits";
// import { sendReceiptEmail } from "@/lib/mail-receipts";
import { sendReceiptEmail } from "./mail-receipt";

export async function finalizePaidPurchaseOnce(purchaseId: string) {
  return await prisma.$transaction(async (tx) => {
    const p = await tx.purchase.findUnique({ where: { id: purchaseId } });
    if (!p) return { ok: false, reason: "not_found" };

    const meta =
      p.meta && typeof p.meta === "object" && !Array.isArray(p.meta)
        ? (p.meta as Record<string, any>)
        : {};

    if (meta.credited === true) return { ok: true, already: true };

    const user = await tx.user.findUnique({ where: { id: p.userId }, select: { id: true, email: true, name: true } });
    if (!user) return { ok: false, reason: "user_missing" };

    if (p.status !== "PAID") {
      await tx.purchase.update({ where: { id: p.id }, data: { status: "PAID" } });
    }

    await addCredits(p.userId, p.credits);

    // Mark as credited before sending to ensure idempotency if email provider retries
    await tx.purchase.update({
      where: { id: p.id },
      data: { meta: { ...meta, credited: true, creditedAt: new Date().toISOString() } as any },
    });

    // Send receipt (best-effort, outside the transaction commit not strictly required)
    queueMicrotask(async () => {
      try {
        await sendReceiptEmail({
          to: user.email!,
          name: user.name || "there",
          credits: p.credits,
          amountUSD: +(p.amount / 100).toFixed(2),
          providerRef: p.providerRef || "",
          purchaseId: p.id,
          dateISO: new Date().toISOString(),
        });
      } catch (e) {
        // swallow email errors; core crediting already persisted
        console.error("receipt email failed", e);
      }
    });

    return { ok: true };
  });
}
