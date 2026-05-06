import { prisma } from "@/lib/prisma";
import { computeSubtotalUSD, computeSubtotalZAR, toMinorUnits, toMinorUnitsZAR } from "@/lib/pricing";
import { getMarketConfig, type MarketCode } from "@/lib/market/config";
import { getDocumentDownloadState } from "@/lib/documents/access";
import { toJsonValue } from "@/lib/json";
import { sendReceiptEmail } from "@/lib/mail-receipt";
import { pesePayProvider, mapPesePayWebhookStatus } from "@/lib/payments/providers/pesepay";
import { paystackProvider } from "@/lib/payments/providers/paystack";
import type {
  InitializePaymentResult,
  NormalizedPaymentStatus,
  PaymentProvider,
  PaymentProviderName,
  PurchaseRecord,
  PurchaseType,
  WebhookPaymentResult,
} from "@/lib/payments/types";

function asMetaRecord(meta: unknown): Record<string, any> {
  return meta && typeof meta === "object" && !Array.isArray(meta) ? (meta as Record<string, any>) : {};
}

function toPurchaseRecord(purchase: any): PurchaseRecord {
  return {
    id: purchase.id,
    userId: purchase.userId,
    provider: purchase.provider,
    type: purchase.type,
    market: purchase.market,
    amount: purchase.amount,
    currency: purchase.currency,
    credits: purchase.credits,
    status: purchase.status,
    providerRef: purchase.providerRef,
    documentId: purchase.documentId,
    fulfilledAt: purchase.fulfilledAt,
    meta: purchase.meta,
    createdAt: purchase.createdAt,
  };
}

function getProvider(provider: string): PaymentProvider {
  if (provider === "PAYSTACK") return paystackProvider;
  if (provider === "PESEPAY") return pesePayProvider;
  throw new Error(`Unsupported payment provider: ${provider}`);
}

function normalizePurchaseType(value: string): PurchaseType {
  if (value === "RESUME_DOWNLOAD_UNLOCK") return value;
  if (value === "SYSTEM_BONUS") return value;
  return "CREDIT_TOPUP";
}

export function describePurchase(purchase: {
  type: string;
  credits: number;
  currency: string;
  amount: number;
  document?: { title: string } | null;
}) {
  const type = normalizePurchaseType(purchase.type);
  if (type === "RESUME_DOWNLOAD_UNLOCK") {
    return purchase.document?.title
      ? `Resume unlock: ${purchase.document.title}`
      : "Resume download unlock";
  }
  if (type === "SYSTEM_BONUS") {
    return purchase.credits > 0 ? `Bonus credits (${purchase.credits})` : "Bonus";
  }
  return `Credits (${purchase.credits})`;
}

export async function createCreditTopupPurchase(input: {
  userId: string;
  credits: number;
  market: MarketCode;
  description?: string;
}) {
  const cleanCredits = Math.max(3, Math.floor(input.credits || 3));
  const marketConfig = getMarketConfig(input.market);
  const isZAR = marketConfig.currency === "ZAR";
  const amountMinor = isZAR
    ? toMinorUnitsZAR(computeSubtotalZAR(cleanCredits))
    : toMinorUnits(computeSubtotalUSD(cleanCredits));

  return prisma.purchase.create({
    data: {
      userId: input.userId,
      provider: marketConfig.paymentProvider,
      type: "CREDIT_TOPUP",
      market: input.market,
      amount: amountMinor,
      currency: marketConfig.currency,
      credits: cleanCredits,
      status: "PENDING",
      meta: {
        description: input.description ?? `Credits purchase (${cleanCredits})`,
        pricingVersion: "promo_2_for_10",
      },
    },
  });
}

export async function createOrReuseResumeUnlockPurchase(input: {
  userId: string;
  documentId: string;
  market?: MarketCode;
}) {
  const document = await prisma.document.findFirst({
    where: { id: input.documentId, userId: input.userId },
    select: {
      id: true,
      userId: true,
      kind: true,
      title: true,
      market: true,
      downloadPriceMinor: true,
      downloadCurrency: true,
      unlockedAt: true,
      unlockPurchaseId: true,
    },
  });

  if (!document) {
    throw new Error("DOCUMENT_NOT_FOUND");
  }

  if (document.kind !== "TAILORED_RESUME") {
    throw new Error("DOCUMENT_UNLOCK_NOT_SUPPORTED");
  }

  const downloadState = getDocumentDownloadState(document);
  if (!downloadState.requiresPayment || downloadState.isUnlocked) {
    return { document, purchase: null, alreadyUnlocked: true as const };
  }

  const existing = await prisma.purchase.findFirst({
    where: {
      userId: input.userId,
      documentId: input.documentId,
      type: "RESUME_DOWNLOAD_UNLOCK",
      status: "PENDING",
    },
    orderBy: { createdAt: "desc" },
  });

  if (existing) {
    return { document, purchase: existing, alreadyUnlocked: false as const };
  }

  const market = (document.market === "ZA" ? "ZA" : input.market || "ZW") as MarketCode;
  const marketConfig = getMarketConfig(market);
  const purchase = await prisma.purchase.create({
    data: {
      userId: input.userId,
      provider: marketConfig.paymentProvider,
      type: "RESUME_DOWNLOAD_UNLOCK",
      market,
      amount: document.downloadPriceMinor ?? marketConfig.pricePerDownloadMinor ?? 0,
      currency: document.downloadCurrency ?? marketConfig.currency,
      credits: 0,
      status: "PENDING",
      documentId: document.id,
      meta: {
        description: `Resume download unlock (${document.title || "Untitled"})`,
      },
    },
  });

  return { document, purchase, alreadyUnlocked: false as const };
}

function getCheckoutUrls(purchaseId: string, provider: PaymentProviderName) {
  const appBase = process.env.APP_BASE_URL;
  if (!appBase) throw new Error("Missing APP_BASE_URL");

  return {
    returnUrl: `${appBase}/app/checkout/${purchaseId}`,
    resultUrl:
      provider === "PESEPAY" ? `${appBase}/api/billing/pesepay/webhook` : undefined,
    callbackUrl:
      provider === "PAYSTACK" ? `${appBase}/app/checkout/${purchaseId}` : undefined,
  };
}

function getStoredCheckoutUrl(meta: unknown) {
  const record = asMetaRecord(meta);
  return record.redirectUrl || record.checkoutUrl || null;
}

export async function initializePurchasePayment(purchaseId: string) {
  const purchase = await prisma.purchase.findUnique({
    where: { id: purchaseId },
    include: {
      user: { select: { email: true, name: true } },
      document: { select: { id: true, title: true } },
    },
  });

  if (!purchase) {
    throw new Error("PURCHASE_NOT_FOUND");
  }

  if (!purchase.user.email) {
    throw new Error("USER_EMAIL_REQUIRED");
  }

  const existingUrl = getStoredCheckoutUrl(purchase.meta);
  if (purchase.status === "PENDING" && existingUrl) {
    return { purchase, checkoutUrl: existingUrl, providerReference: purchase.providerRef };
  }

  const provider = getProvider(purchase.provider);
  const urls = getCheckoutUrls(purchase.id, purchase.provider as PaymentProviderName);
  const description = describePurchase(purchase);
  const result = await provider.initialize({
    purchase: toPurchaseRecord(purchase),
    email: purchase.user.email,
    name: purchase.user.name,
    description,
    returnUrl: urls.returnUrl,
    resultUrl: urls.resultUrl,
    callbackUrl: urls.callbackUrl,
    metadata: {
      purchaseId: purchase.id,
      documentId: purchase.documentId,
      purchaseType: purchase.type,
      market: purchase.market,
    },
  });

  const baseMeta = asMetaRecord(purchase.meta);
  await prisma.purchase.update({
    where: { id: purchase.id },
    data: {
      providerRef: result.providerReference ?? purchase.providerRef ?? purchase.id,
      meta: {
        ...baseMeta,
        ...toJsonValue(result.metadata || {}),
        checkoutUrl: result.checkoutUrl,
      },
    },
  });

  return { purchase, checkoutUrl: result.checkoutUrl, providerReference: result.providerReference };
}

async function markPurchaseStatus(input: {
  purchaseId: string;
  status: NormalizedPaymentStatus;
  providerReference?: string | null;
  metaPatch?: Record<string, unknown>;
}) {
  const purchase = await prisma.purchase.findUnique({ where: { id: input.purchaseId } });
  if (!purchase) return null;

  const baseMeta = asMetaRecord(purchase.meta);
  return prisma.purchase.update({
    where: { id: purchase.id },
    data: {
      status: input.status,
      providerRef: input.providerReference ?? purchase.providerRef,
      meta: {
        ...baseMeta,
        ...(input.metaPatch || {}),
      },
    },
  });
}

export async function fulfillPurchaseOnce(purchaseId: string) {
  let receiptPayload:
    | {
        to: string;
        name: string;
        credits: number;
        amountUSD: number;
        providerRef: string;
        purchaseId: string;
        dateISO: string;
      }
    | null = null;

  const result = await prisma.$transaction(async (tx) => {
    const purchase = await tx.purchase.findUnique({
      where: { id: purchaseId },
      include: {
        user: { select: { id: true, email: true, name: true } },
        document: {
          select: {
            id: true,
            userId: true,
            unlockedAt: true,
            unlockPurchaseId: true,
            title: true,
          },
        },
      },
    });

    if (!purchase) return { ok: false as const, reason: "not_found" };

    const type = normalizePurchaseType(purchase.type);
    const meta = asMetaRecord(purchase.meta);
    const now = new Date();

    if (purchase.fulfilledAt) {
      return { ok: true as const, already: true as const, type };
    }

    if (type === "CREDIT_TOPUP" && meta.credited === true) {
      await tx.purchase.update({
        where: { id: purchase.id },
        data: { fulfilledAt: purchase.fulfilledAt ?? now },
      });
      return { ok: true as const, already: true as const, type };
    }

    if (type === "RESUME_DOWNLOAD_UNLOCK" && (meta.unlocked === true || purchase.document?.unlockPurchaseId === purchase.id)) {
      await tx.purchase.update({
        where: { id: purchase.id },
        data: { fulfilledAt: purchase.fulfilledAt ?? now },
      });
      return { ok: true as const, already: true as const, type };
    }

    if (purchase.status !== "PAID" && purchase.status !== "BONUS") {
      return { ok: false as const, reason: "not_paid" };
    }

    if (type === "SYSTEM_BONUS") {
      await tx.purchase.update({
        where: { id: purchase.id },
        data: { fulfilledAt: now },
      });
      return { ok: true as const, type };
    }

    if (type === "CREDIT_TOPUP") {
      await tx.user.update({
        where: { id: purchase.userId },
        data: { credits: { increment: purchase.credits } },
      });

      await tx.purchase.update({
        where: { id: purchase.id },
        data: {
          status: purchase.status === "BONUS" ? "BONUS" : "PAID",
          fulfilledAt: now,
          meta: {
            ...meta,
            credited: true,
            creditedAt: now.toISOString(),
          },
        },
      });

      if (purchase.user.email) {
        receiptPayload = {
          to: purchase.user.email,
          name: purchase.user.name || "there",
          credits: purchase.credits,
          amountUSD: +(purchase.amount / 100).toFixed(2),
          providerRef: purchase.providerRef || "",
          purchaseId: purchase.id,
          dateISO: now.toISOString(),
        };
      }

      return { ok: true as const, type };
    }

    if (!purchase.document || purchase.document.userId !== purchase.userId) {
      return { ok: false as const, reason: "document_missing" };
    }

    if (purchase.document.unlockPurchaseId && purchase.document.unlockPurchaseId !== purchase.id) {
      await tx.purchase.update({
        where: { id: purchase.id },
        data: {
          fulfilledAt: now,
          meta: {
            ...meta,
            unlocked: false,
            skippedBecauseAlreadyUnlocked: true,
          },
        },
      });
      return { ok: true as const, already: true as const, type };
    }

    await tx.document.update({
      where: { id: purchase.document.id },
      data: {
        unlockedAt: purchase.document.unlockedAt ?? now,
        unlockPurchaseId: purchase.id,
      },
    });

    await tx.purchase.update({
      where: { id: purchase.id },
      data: {
        status: "PAID",
        fulfilledAt: now,
        meta: {
          ...meta,
          unlocked: true,
          unlockedAt: now.toISOString(),
          unlockedDocumentId: purchase.document.id,
        },
      },
    });

    return { ok: true as const, type, documentId: purchase.document.id };
  });

  if (receiptPayload) {
    queueMicrotask(async () => {
      try {
        await sendReceiptEmail(receiptPayload!);
      } catch (error) {
        console.error("receipt email failed", error);
      }
    });
  }

  return result;
}

export async function syncPurchaseStatus(purchaseId: string) {
  const purchase = await prisma.purchase.findUnique({ where: { id: purchaseId } });
  if (!purchase) {
    throw new Error("PURCHASE_NOT_FOUND");
  }

  if (purchase.status === "PAID" || purchase.status === "BONUS") {
    await fulfillPurchaseOnce(purchase.id);
    return purchase.status === "BONUS" ? "PAID" : purchase.status;
  }

  if (purchase.status === "FAILED" || purchase.status === "CANCELED") {
    return purchase.status;
  }

  const provider = getProvider(purchase.provider);
  const result = await provider.verify(toPurchaseRecord(purchase));

  await markPurchaseStatus({
    purchaseId: purchase.id,
    status: result.status,
    providerReference: result.providerReference,
    metaPatch: {
      ...result.metadata,
      lastVerification: toJsonValue(result.raw),
      lastVerifiedAt: new Date().toISOString(),
    },
  });

  if (result.status === "PAID") {
    await fulfillPurchaseOnce(purchase.id);
  }

  return result.status;
}

export async function applyProviderWebhookUpdate(update: WebhookPaymentResult) {
  const purchase = await prisma.purchase.findFirst({
    where: {
      OR: [{ providerRef: update.providerReference }, { id: update.providerReference }],
    },
  });

  if (!purchase) {
    return { ok: false as const, reason: "not_found" };
  }

  const baseMeta = asMetaRecord(purchase.meta);
  await prisma.purchase.update({
    where: { id: purchase.id },
    data: {
      status: update.status,
      providerRef: purchase.providerRef || update.providerReference,
      meta: {
        ...baseMeta,
        ...(update.metadata || {}),
        webhook: toJsonValue(update.raw),
        webhookReceivedAt: new Date().toISOString(),
      },
    },
  });

  if (update.status === "PAID") {
    await fulfillPurchaseOnce(purchase.id);
  }

  return { ok: true as const, purchaseId: purchase.id, status: update.status };
}

export function parsePesePayWebhook(payload: any): WebhookPaymentResult {
  const providerReference =
    payload?.referenceNumber ||
    payload?.reference ||
    payload?.transaction?.referenceNumber ||
    payload?.transaction?.reference;

  if (!providerReference) {
    throw new Error("Missing PesePay reference");
  }

  return {
    providerReference,
    status: mapPesePayWebhookStatus(payload),
    raw: toJsonValue(payload),
  };
}

export async function getPurchaseForUser(purchaseId: string, userId: string) {
  const purchase = await prisma.purchase.findUnique({
    where: { id: purchaseId },
    include: {
      document: { select: { id: true, title: true } },
    },
  });

  if (!purchase || purchase.userId !== userId) {
    throw new Error("PURCHASE_NOT_FOUND");
  }

  return purchase;
}
