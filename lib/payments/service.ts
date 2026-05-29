import { prisma } from "@/lib/prisma";
import { getMarketConfig, type MarketCode } from "@/lib/market/config";
import { getDocumentDownloadState } from "@/lib/documents/access";
import { toJsonValue } from "@/lib/json";
import { pesePayProvider, mapPesePayWebhookStatus } from "@/lib/payments/providers/pesepay";
import { paystackProvider } from "@/lib/payments/providers/paystack";
import type {
  InitializePaymentResult,
  NormalizedPaymentStatus,
  PaymentProvider,
  PaymentProviderName,
  PurchaseRecord,
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
      amount: document.downloadPriceMinor ?? 0,
      currency: document.downloadCurrency ?? marketConfig.currency,
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
  const description = purchase.document?.title
    ? `Resume unlock: ${purchase.document.title}`
    : "Resume download unlock";
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
  const result = await prisma.$transaction(async (tx) => {
    const purchase = await tx.purchase.findUnique({
      where: { id: purchaseId },
      include: {
        user: { select: { id: true } },
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

    const meta = asMetaRecord(purchase.meta);
    const now = new Date();

    if (purchase.fulfilledAt) {
      return { ok: true as const, already: true as const };
    }

    if (purchase.type === "RESUME_DOWNLOAD_UNLOCK" && (meta.unlocked === true || purchase.document?.unlockPurchaseId === purchase.id)) {
      await tx.purchase.update({
        where: { id: purchase.id },
        data: { fulfilledAt: purchase.fulfilledAt ?? now },
      });
      return { ok: true as const, already: true as const };
    }

    if (purchase.status !== "PAID" && purchase.status !== "BONUS") {
      return { ok: false as const, reason: "not_paid" };
    }

    if (purchase.type === "SYSTEM_BONUS") {
      await tx.purchase.update({
        where: { id: purchase.id },
        data: { fulfilledAt: now },
      });
      return { ok: true as const };
    }

    if (!purchase.document || purchase.document.userId !== purchase.userId) {
      return { ok: false as const, reason: "document_missing" };
    }

    if (purchase.document.unlockPurchaseId && purchase.document.unlockPurchaseId !== purchase.id) {
      await tx.purchase.update({
        where: { id: purchase.id },
        data: {
          fulfilledAt: now,
          meta: { ...meta, unlocked: false, skippedBecauseAlreadyUnlocked: true },
        },
      });
      return { ok: true as const, already: true as const };
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

    return { ok: true as const, documentId: purchase.document.id };
  });

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
