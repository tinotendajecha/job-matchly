import { beforeEach } from 'vitest';
import { mockReset } from 'vitest-mock-extended';
import { prismaMock } from './test/prisma-mock';

beforeEach(() => {
  mockReset(prismaMock);
  // Default $transaction: run the callback against the same mock so nested
  // calls inside a transaction hit the same mocked model methods a test set up.
  prismaMock.$transaction.mockImplementation(((arg: any) => {
    if (typeof arg === 'function') return arg(prismaMock);
    return Promise.all(arg);
  }) as any);
});
