import { PesePayClient } from "pesepay-js";
import { toJsonValue } from "@/lib/json";
import type { InitializePaymentInput, InitializePaymentResult, PaymentProvider, VerifyPaymentResult } from "@/lib/payments/types";

function getClient() {
  const integrationKey = process.env.PESEPAY_INTEGRATION_KEY;
  const encryptionKey = process.env.PESEPAY_ENCRYPTION_KEY;

  if (!integrationKey || !encryptionKey) {
    throw new Error("Missing PesePay environment variables");
  }

  return new PesePayClient(integrationKey, encryptionKey);
}

function mapPesePayStatus(value: unknown): VerifyPaymentResult["status"] {
  const normalized = String(value || "").toUpperCase();
  if (normalized.includes("PAID") || normalized.includes("SUCCESS")) return "PAID";
  if (normalized.includes("FAILED")) return "FAILED";
  if (normalized.includes("CANCEL")) return "CANCELED";
  return "PENDING";
}

export const pesePayProvider: PaymentProvider = {
  name: "PESEPAY",
  async initialize(input: InitializePaymentInput): Promise<InitializePaymentResult> {
    const client = getClient();
    const amount = +(input.purchase.amount / 100).toFixed(2);
    const reference = input.purchase.providerRef || input.purchase.id;
    const resultUrl = input.resultUrl ?? input.returnUrl;

    const init = await client.initiateTransaction({
      amountDetails: { amount, currencyCode: input.purchase.currency },
      reasonForPayment: input.description,
      resultUrl,
      returnUrl: input.returnUrl,
    });

    const redirectUrl = init?.redirectUrl;
    if (!redirectUrl) {
      throw new Error("PesePay did not return a redirect URL");
    }

    return {
      checkoutUrl: redirectUrl,
      providerReference: init?.referenceNumber ?? reference,
      metadata: {
        pollUrl: init?.pollUrl,
        redirectUrl,
        pesePayInit: toJsonValue(init),
      },
    };
  },
  async verify(purchase): Promise<VerifyPaymentResult> {
    const providerReference = purchase.providerRef || purchase.id;
    const client = getClient();
    const response = await client.checkPaymentStatus(providerReference);

    return {
      status: mapPesePayStatus(response?.transactionStatus),
      providerReference,
      metadata: {
        statusCheck: toJsonValue(response),
      },
      raw: toJsonValue(response),
    };
  },
};

export function mapPesePayWebhookStatus(payload: any): VerifyPaymentResult["status"] {
  return mapPesePayStatus(
    payload?.status ||
      payload?.transaction?.status ||
      payload?.paymentStatus
  );
}
