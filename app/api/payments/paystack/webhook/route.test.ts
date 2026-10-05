import crypto from 'crypto';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { prismaMock } from '../../../../../test/prisma-mock';
import { POST } from './route';

const SECRET = 'test_paystack_secret';

function signedRequest(payload: unknown) {
  const rawBody = JSON.stringify(payload);
  const signature = crypto.createHmac('sha512', SECRET).update(rawBody).digest('hex');
  return new Request('http://localhost/api/payments/paystack/webhook', {
    method: 'POST',
    body: rawBody,
    headers: { 'x-paystack-signature': signature },
  });
}

beforeEach(() => {
  vi.stubEnv('PAYSTACK_SECRET_KEY', SECRET);
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('POST /api/payments/paystack/webhook', () => {
  it('rejects a missing signature before touching the DB', async () => {
    const rawBody = JSON.stringify({ event: 'charge.success', data: {} });
    const req = new Request('http://localhost/x', { method: 'POST', body: rawBody });

    const res = await POST(req);

    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ ok: false, error: 'Invalid signature' });
    expect(prismaMock.purchase.findFirst).not.toHaveBeenCalled();
  });

  it('rejects a wrong signature', async () => {
    const rawBody = JSON.stringify({ event: 'charge.success', data: {} });
    const req = new Request('http://localhost/x', {
      method: 'POST',
      body: rawBody,
      headers: { 'x-paystack-signature': 'not-the-right-one' },
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('subscription.create: activates the subscription found by customer code', async () => {
    prismaMock.subscription.updateMany.mockResolvedValue({ count: 1 });

    const req = signedRequest({
      event: 'subscription.create',
      data: { customer: { customer_code: 'CUS_1' }, subscription_code: 'SUB_1', plan: { plan_code: 'PLN_1' } },
    });

    const res = await POST(req);

    expect(res.status).toBe(200);
    expect(prismaMock.subscription.updateMany).toHaveBeenCalledWith({
      where: { paystackCustomerCode: 'CUS_1' },
      data: { status: 'ACTIVE', paystackSubscriptionCode: 'SUB_1', paystackPlanCode: 'PLN_1' },
    });
  });

  it('subscription.create: is a silent no-op when codes are missing from the payload', async () => {
    const req = signedRequest({ event: 'subscription.create', data: {} });

    const res = await POST(req);

    expect(res.status).toBe(200);
    expect(prismaMock.subscription.updateMany).not.toHaveBeenCalled();
  });

  it('charge.success with a subscription_code: extends the period from "now", not the stale currentPeriodEnd, when the sub already lapsed', async () => {
    const now = new Date('2026-09-20T12:00:00.000Z');
    vi.useFakeTimers();
    vi.setSystemTime(now);

    prismaMock.subscription.findFirst.mockResolvedValue({
      userId: 'user_1',
      billingCycle: 'MONTHLY',
      currentPeriodEnd: new Date('2026-08-01T00:00:00.000Z'), // lapsed, in the past
    } as any);
    prismaMock.subscription.update.mockResolvedValue({} as any);

    const req = signedRequest({ event: 'charge.success', data: { subscription_code: 'SUB_1' } });
    const res = await POST(req);

    expect(res.status).toBe(200);
    expect(prismaMock.subscription.update).toHaveBeenCalledWith({
      where: { userId: 'user_1' },
      data: expect.objectContaining({
        status: 'ACTIVE',
        currentPeriodEnd: new Date('2026-10-20T12:00:00.000Z'), // one month from "now", not from the lapsed date
      }),
    });

    vi.useRealTimers();
  });

  it('charge.success with a subscription_code but no matching subscription: silently acknowledges', async () => {
    prismaMock.subscription.findFirst.mockResolvedValue(null);

    const req = signedRequest({ event: 'charge.success', data: { subscription_code: 'SUB_MISSING' } });
    const res = await POST(req);

    expect(res.status).toBe(200);
    expect(prismaMock.subscription.update).not.toHaveBeenCalled();
  });

  it('charge.success with NO subscription_code falls through to the legacy one-time-purchase path', async () => {
    prismaMock.purchase.findFirst.mockResolvedValue({
      id: 'purchase_1',
      providerRef: 'REF_1',
      meta: {},
      fulfilledAt: null,
      type: 'RESUME_DOWNLOAD_UNLOCK',
      status: 'PENDING',
      userId: 'user_1',
      document: null,
    } as any);
    prismaMock.purchase.update.mockResolvedValue({} as any);

    const req = signedRequest({ event: 'charge.success', data: { reference: 'REF_1', status: 'success' } });
    const res = await POST(req);

    expect(res.status).toBe(200);
    // Proves it fell through into applyProviderWebhookUpdate rather than being
    // swallowed as an unrecognised event.
    expect(prismaMock.purchase.findFirst).toHaveBeenCalled();
    expect(prismaMock.purchase.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: 'PAID' }) }),
    );
  });

  it('invoice.payment_failed: marks the subscription PAST_DUE', async () => {
    prismaMock.subscription.updateMany.mockResolvedValue({ count: 1 });

    const req = signedRequest({ event: 'invoice.payment_failed', data: { subscription: { subscription_code: 'SUB_1' } } });
    const res = await POST(req);

    expect(res.status).toBe(200);
    expect(prismaMock.subscription.updateMany).toHaveBeenCalledWith({
      where: { paystackSubscriptionCode: 'SUB_1' },
      data: { status: 'PAST_DUE' },
    });
  });

  it('subscription.disable: marks the subscription CANCELED', async () => {
    prismaMock.subscription.updateMany.mockResolvedValue({ count: 1 });

    const req = signedRequest({ event: 'subscription.disable', data: { subscription_code: 'SUB_1' } });
    const res = await POST(req);

    expect(res.status).toBe(200);
    expect(prismaMock.subscription.updateMany).toHaveBeenCalledWith({
      where: { paystackSubscriptionCode: 'SUB_1' },
      data: { status: 'CANCELED' },
    });
  });

  it('customer.identified: only backfills paystackCustomerCode when not already set', async () => {
    prismaMock.user.findUnique.mockResolvedValue({ id: 'user_1' } as any);
    prismaMock.subscription.updateMany.mockResolvedValue({ count: 1 });

    const req = signedRequest({ event: 'customer.identified', data: { customer_code: 'CUS_1', email: 'a@b.com' } });
    const res = await POST(req);

    expect(res.status).toBe(200);
    expect(prismaMock.subscription.updateMany).toHaveBeenCalledWith({
      where: { userId: 'user_1', paystackCustomerCode: null },
      data: { paystackCustomerCode: 'CUS_1' },
    });
  });

  it('customer.identified: no-ops when no user matches the email', async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);

    const req = signedRequest({ event: 'customer.identified', data: { customer_code: 'CUS_1', email: 'nobody@b.com' } });
    const res = await POST(req);

    expect(res.status).toBe(200);
    expect(prismaMock.subscription.updateMany).not.toHaveBeenCalled();
  });

  it('acknowledges an unrecognised event with no reference instead of erroring', async () => {
    const req = signedRequest({ event: 'some.other.event', data: {} });
    const res = await POST(req);

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
  });

  it('returns 404 when the legacy purchase reference matches nothing', async () => {
    prismaMock.purchase.findFirst.mockResolvedValue(null);

    const req = signedRequest({ event: 'some.other.event', data: { reference: 'REF_MISSING', status: 'success' } });
    const res = await POST(req);

    expect(res.status).toBe(404);
  });

  it('returns 400 instead of crashing on malformed JSON with a valid signature', async () => {
    const rawBody = '{not valid json';
    const signature = crypto.createHmac('sha512', SECRET).update(rawBody).digest('hex');
    const req = new Request('http://localhost/x', {
      method: 'POST',
      body: rawBody,
      headers: { 'x-paystack-signature': signature },
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
  });
});
