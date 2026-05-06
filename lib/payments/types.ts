import type { MarketCode } from "@/lib/market/config";

export type PurchaseType = "CREDIT_TOPUP" | "RESUME_DOWNLOAD_UNLOCK" | "SYSTEM_BONUS";
export type PaymentProviderName = "PESEPAY" | "PAYSTACK" | "SYSTEM";
export type NormalizedPaymentStatus = "PENDING" | "PAID" | "FAILED" | "CANCELED";

export type PurchaseRecord = {
  id: string;
  userId: string;
  provider: PaymentProviderName | string;
  type: PurchaseType | string;
  market: MarketCode | string;
  amount: number;
  currency: string;
  credits: number;
  status: NormalizedPaymentStatus | "BONUS" | string;
  providerRef: string | null;
  documentId: string | null;
  fulfilledAt: Date | null;
  meta: unknown;
  createdAt: Date;
};

export type InitializePaymentInput = {
  purchase: PurchaseRecord;
  email: string;
  name?: string | null;
  description: string;
  resultUrl?: string;
  returnUrl: string;
  callbackUrl?: string;
  metadata?: Record<string, unknown>;
};

export type InitializePaymentResult = {
  checkoutUrl: string;
  providerReference: string | null;
  metadata?: Record<string, unknown>;
};

export type VerifyPaymentResult = {
  status: NormalizedPaymentStatus;
  providerReference: string | null;
  metadata?: Record<string, unknown>;
  raw: unknown;
};

export type WebhookPaymentResult = {
  providerReference: string;
  status: NormalizedPaymentStatus;
  metadata?: Record<string, unknown>;
  raw: unknown;
};

export interface PaymentProvider {
  name: PaymentProviderName;
  initialize(input: InitializePaymentInput): Promise<InitializePaymentResult>;
  verify(purchase: PurchaseRecord): Promise<VerifyPaymentResult>;
}
