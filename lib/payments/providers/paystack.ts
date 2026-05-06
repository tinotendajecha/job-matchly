import crypto from "crypto";
import { toJsonValue } from "@/lib/json";
import type {
  InitializePaymentInput,
  InitializePaymentResult,
  PaymentProvider,
  VerifyPaymentResult,
  WebhookPaymentResult,
} from "@/lib/payments/types";

const PAYSTACK_BASE_URL = "https://api.paystack.co";

function getSecretKey() {
  const secretKey = process.env.PAYSTACK_SECRET_KEY;
  if (!secretKey) throw new Error("Missing PAYSTACK_SECRET_KEY");
  return secretKey;
}

function mapPaystackStatus(value: unknown): VerifyPaymentResult["status"] {
  const normalized = String(value || "").toLowerCase();
  if (normalized === "success") return "PAID";
  if (normalized === "failed" || normalized === "error") return "FAILED";
  if (normalized === "abandoned" || normalized === "cancelled" || normalized === "canceled") return "CANCELED";
  return "PENDING";
}

async function paystackRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${PAYSTACK_BASE_URL}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${getSecretKey()}`,
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
  });

  const payload = await response.json().catch(() => null);
  if (!response.ok || !payload?.status) {
    throw new Error(payload?.message || "Paystack request failed");
  }

  return payload as T;
}

export const paystackProvider: PaymentProvider = {
  name: "PAYSTACK",
  async initialize(input: InitializePaymentInput): Promise<InitializePaymentResult> {
    const providerReference = input.purchase.providerRef || input.purchase.id;
    const payload = await paystackRequest<any>("/transaction/initialize", {
      method: "POST",
      body: JSON.stringify({
        email: input.email,
        amount: input.purchase.amount,
        currency: input.purchase.currency,
        reference: providerReference,
        callback_url: input.callbackUrl || input.returnUrl,
        metadata: {
          purchaseId: input.purchase.id,
          purchaseType: input.purchase.type,
          documentId: input.purchase.documentId,
          market: input.purchase.market,
          ...(input.metadata || {}),
        },
      }),
    });

    const checkoutUrl = payload?.data?.authorization_url;
    if (!checkoutUrl) throw new Error("Paystack did not return an authorization URL");

    return {
      checkoutUrl,
      providerReference: payload?.data?.reference || providerReference,
      metadata: {
        paystackInit: toJsonValue(payload),
        accessCode: payload?.data?.access_code ?? null,
        redirectUrl: checkoutUrl,
      },
    };
  },
  async verify(purchase): Promise<VerifyPaymentResult> {
    const providerReference = purchase.providerRef || purchase.id;
    const payload = await paystackRequest<any>(`/transaction/verify/${encodeURIComponent(providerReference)}`);

    return {
      status: mapPaystackStatus(payload?.data?.status),
      providerReference: payload?.data?.reference || providerReference,
      metadata: {
        statusCheck: toJsonValue(payload),
      },
      raw: toJsonValue(payload),
    };
  },
};

export function verifyPaystackSignature(rawBody: string, signature?: string | null) {
  if (!signature) return false;
  const expected = crypto.createHmac("sha512", getSecretKey()).update(rawBody).digest("hex");
  return expected === signature;
}

export function parsePaystackWebhook(rawBody: string, signature?: string | null): WebhookPaymentResult {
  if (!verifyPaystackSignature(rawBody, signature)) {
    throw new Error("Invalid Paystack signature");
  }

  const payload = JSON.parse(rawBody);
  const providerReference = payload?.data?.reference;
  if (!providerReference) {
    throw new Error("Missing Paystack reference");
  }

  return {
    providerReference,
    status: mapPaystackStatus(payload?.data?.status || payload?.event),
    metadata: {
      webhookEvent: payload?.event || null,
    },
    raw: toJsonValue(payload),
  };
}
