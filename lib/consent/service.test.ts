import { describe, expect, it } from 'vitest';
import { prismaMock } from '../../test/prisma-mock';
import {
  consentVersionFor,
  countRecruiterVisible,
  recordConsent,
  recruiterVisibleWhere,
  setRecruiterVisibility,
} from './service';

describe('consentVersionFor', () => {
  it('returns the version pinned to the market', () => {
    expect(consentVersionFor('ZA')).toBe('ZA-2026-v2');
    expect(consentVersionFor('ZW')).toBe('ZW-2026-v2');
  });

  it('defaults to ZW for null, undefined, or an unrecognized market', () => {
    expect(consentVersionFor(null)).toBe('ZW-2026-v2');
    expect(consentVersionFor(undefined)).toBe('ZW-2026-v2');
    expect(consentVersionFor('ALL' as any)).toBe('ZW-2026-v2');
  });
});

describe('recordConsent', () => {
  it('is a plain append: two calls for the same user+purpose create two rows', async () => {
    prismaMock.consentRecord.create.mockResolvedValue({} as any);

    await recordConsent({ userId: 'u1', purpose: 'ACCOUNT_TERMS', granted: true, version: 'ZW-2026-v2', source: 'signup' });
    await recordConsent({ userId: 'u1', purpose: 'ACCOUNT_TERMS', granted: false, version: 'ZW-2026-v2', source: 'unsubscribe-link' });

    expect(prismaMock.consentRecord.create).toHaveBeenCalledTimes(2);
    expect(prismaMock.consentRecord.update).not.toHaveBeenCalled();
  });

  it('writes through the caller-supplied transaction client when given one', async () => {
    const tx = { consentRecord: { create: prismaMock.consentRecord.create } } as any;

    await recordConsent({ userId: 'u1', purpose: 'MARKETING_EMAIL', granted: true, version: 'v1', source: 'profile', tx });

    // Called on tx (same mock fn here), not routed through the bare client's $transaction.
    expect(prismaMock.$transaction).not.toHaveBeenCalled();
    expect(prismaMock.consentRecord.create).toHaveBeenCalled();
  });
});

describe('setRecruiterVisibility', () => {
  it('sets recruiterVisibleAt on grant, and logs it in the same transaction as the flag write', async () => {
    prismaMock.user.update.mockResolvedValue({ id: 'u1', recruiterVisible: true, recruiterVisibleAt: new Date() } as any);
    prismaMock.consentRecord.create.mockResolvedValue({} as any);

    await setRecruiterVisibility({ userId: 'u1', granted: true, version: 'ZA-2026-v2', source: 'profile' });

    expect(prismaMock.$transaction).toHaveBeenCalledTimes(1);
    expect(prismaMock.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ recruiterVisible: true, recruiterVisibleAt: expect.any(Date) }),
      }),
    );
    expect(prismaMock.consentRecord.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ purpose: 'RECRUITER_VISIBILITY', granted: true }),
      }),
    );
  });

  it('does not clear or touch recruiterVisibleAt on withdrawal', async () => {
    prismaMock.user.update.mockResolvedValue({ id: 'u1', recruiterVisible: false, recruiterVisibleAt: null } as any);
    prismaMock.consentRecord.create.mockResolvedValue({} as any);

    await setRecruiterVisibility({ userId: 'u1', granted: false, version: 'ZA-2026-v2', source: 'profile' });

    const call = prismaMock.user.update.mock.calls[0][0] as any;
    expect(call.data).not.toHaveProperty('recruiterVisibleAt');
    expect(call.data.recruiterVisible).toBe(false);
  });
});

describe('recruiterVisibleWhere / countRecruiterVisible', () => {
  it('requires both recruiterVisible and a non-null email', () => {
    expect(recruiterVisibleWhere()).toEqual({ recruiterVisible: true, email: { not: null } });
  });

  it('counts using exactly that where-clause', async () => {
    prismaMock.user.count.mockResolvedValue(42);

    const count = await countRecruiterVisible();

    expect(count).toBe(42);
    expect(prismaMock.user.count).toHaveBeenCalledWith({ where: recruiterVisibleWhere() });
  });
});
