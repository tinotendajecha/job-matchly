import { describe, expect, it, vi } from 'vitest';

vi.mock('next/headers', () => ({ headers: () => new Headers() }));

import { getMarketFromRequest } from './request';

function req(headers: Record<string, string>) {
  return new Request('https://www.jobmatchly.co.za/api/x', { headers });
}

describe('getMarketFromRequest on the single jobmatchly.co.za domain', () => {
  const host = { host: 'www.jobmatchly.co.za' };

  it('treats a Zimbabwean visitor as ZW even though the host is .co.za', () => {
    expect(getMarketFromRequest(req({ ...host, 'x-vercel-ip-country': 'ZW' }))).toBe('ZW');
  });

  it('prefers the market cookie over the visitor country', () => {
    expect(
      getMarketFromRequest(req({ ...host, cookie: 'jm_vid=abc; jm_market=ZW', 'x-vercel-ip-country': 'ZA' }))
    ).toBe('ZW');
  });

  it('prefers the middleware header over everything', () => {
    expect(getMarketFromRequest(req({ ...host, 'x-market': 'ZA', cookie: 'jm_market=ZW' }))).toBe('ZA');
  });

  it('falls back to ZA for other countries on the .co.za host', () => {
    expect(getMarketFromRequest(req({ ...host, 'x-vercel-ip-country': 'GB' }))).toBe('ZA');
  });
});
