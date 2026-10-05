import { describe, expect, it } from 'vitest';
import {
  DEFAULT_BRACKET,
  guessBracket,
  bracketFromText,
  resolveBracket,
  seniorityFromTitle,
  seniorityProximity,
} from './brackets';

describe('guessBracket', () => {
  it('returns null for empty input', () => {
    expect(guessBracket(null)).toBeNull();
    expect(guessBracket(undefined)).toBeNull();
    expect(guessBracket('')).toBeNull();
  });

  it('requires a word boundary for short keywords', () => {
    expect(guessBracket('Victoria Falls Tour Guide')).not.toEqual(
      expect.objectContaining({ keyword: 'ict' }),
    );
    expect(guessBracket('ICT Officer')?.keyword).toBe('ict');
  });

  it('prefers the longest matching keyword', () => {
    // "data scientist" should win over any bare "data"-style keyword.
    expect(guessBracket('Senior Data Scientist')?.keyword).toBe('data scientist');
    expect(guessBracket('Data Analyst')?.keyword).toBe('data analyst');
  });

  it('flags generic role words as weak', () => {
    const guess = guessBracket('Civil Engineer');
    expect(guess?.bracket).toBe('Engineering & Technical');
    expect(guess?.strong).toBe(false);
  });

  it('flags a software term at least as long as "engineer" as strong', () => {
    const guess = guessBracket('QA Engineer');
    expect(guess?.bracket).toBe('Software & IT');
    expect(guess?.strong).toBe(true);
  });

  it('KNOWN BUG: a software term shorter than "engineer" loses to the generic weak keyword', () => {
    // SORTED_KEYWORDS orders purely by string length, so 'engineer' (8 chars,
    // weak) is checked before shorter SOFTWARE_TERMS entries like 'android'
    // (7), 'python' (6), 'react' (5), 'php' (3), etc. and wins outright. This
    // defeats the documented purpose of SOFTWARE_TERMS for every entry
    // shorter than 8 characters. Regression-pinned here rather than silently
    // asserted as correct; see conversation notes for the full list of
    // affected terms.
    const guess = guessBracket('Android Engineer');
    expect(guess?.bracket).toBe('Engineering & Technical');
    expect(guess?.strong).toBe(false);
  });

  it('flags unambiguous profession keywords as strong', () => {
    const guess = guessBracket('Senior Accountant');
    expect(guess?.bracket).toBe('Finance & Accounting');
    expect(guess?.strong).toBe(true);
  });
});

describe('bracketFromText', () => {
  it('unwraps guessBracket to just the bracket', () => {
    expect(bracketFromText('Registered Nurse')).toBe('Healthcare');
    expect(bracketFromText('asdkjaslkdj')).toBeNull();
  });
});

describe('resolveBracket', () => {
  it('prefers a strong title match over the category', () => {
    expect(resolveBracket('Software Developer', 'General')).toBe('Software & IT');
  });

  it('falls back to the category when the title match is weak', () => {
    expect(resolveBracket('Civil Engineer', 'General')).toBe('General');
  });

  it('falls back to a weak title guess when there is no category', () => {
    expect(resolveBracket('Civil Engineer', null)).toBe('Engineering & Technical');
  });

  it('falls back to the default bracket when nothing matches', () => {
    expect(resolveBracket('Mystery Role', null)).toBe(DEFAULT_BRACKET);
  });
});

describe('seniorityFromTitle', () => {
  it('returns null for no title or no match', () => {
    expect(seniorityFromTitle(null)).toBeNull();
    expect(seniorityFromTitle('Software Developer')).toBeNull();
  });

  it('matches intern-level titles', () => {
    expect(seniorityFromTitle('Marketing Internship')).toBe('INTERN');
  });

  it('matches lead-level titles before the generic senior pattern', () => {
    expect(seniorityFromTitle('Head of Finance')).toBe('LEAD');
    expect(seniorityFromTitle('Chief Technology Officer')).toBe('LEAD');
  });

  it('matches senior-level titles, including plain "Manager"', () => {
    expect(seniorityFromTitle('Senior Software Engineer')).toBe('SENIOR');
    expect(seniorityFromTitle('Branch Manager')).toBe('SENIOR');
  });

  it('matches junior-level titles', () => {
    expect(seniorityFromTitle('Junior Developer')).toBe('JUNIOR');
    expect(seniorityFromTitle('Entry-Level Accountant')).toBe('JUNIOR');
  });
});

describe('seniorityProximity', () => {
  it('is neutral when either side is missing or unrecognized', () => {
    expect(seniorityProximity(null, 'SENIOR')).toBe(0.5);
    expect(seniorityProximity('SENIOR', null)).toBe(0.5);
    expect(seniorityProximity('WIZARD', 'SENIOR')).toBe(0.5);
  });

  it('is 1 for an exact match', () => {
    expect(seniorityProximity('SENIOR', 'SENIOR')).toBe(1);
  });

  it('decays with distance and clamps at 0', () => {
    // INTERN -> LEAD is 5 steps apart in SENIORITY_ORDER, decay would go negative.
    expect(seniorityProximity('INTERN', 'LEAD')).toBe(0);
    // JUNIOR -> MID is 1 step apart.
    expect(seniorityProximity('JUNIOR', 'MID')).toBeCloseTo(1 - 1 / 3, 5);
  });
});
