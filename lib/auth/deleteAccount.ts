// lib/auth/deleteAccount.ts
//
// Self-serve account deletion. POPIA gives people the right to have their data
// erased, and until now the only route was emailing support.
import { prisma } from '@/lib/prisma';

/**
 * What survives, and why.
 *
 * Erasure is not absolute: it yields to records another law requires us to
 * keep. There are 78 paid purchases on this platform, and South African tax law
 * requires transaction records be retained for five years, so Purchase and
 * Subscription rows stay. They are kept attached to a User row that has been
 * stripped of everything identifying rather than orphaned, because a financial
 * record with a dangling reference is worse than one pointing at a stub.
 *
 * JobShareEvent keeps its row and loses its userId: the counts behind the share
 * dashboard are not personal data once the link to a person is gone.
 *
 * Everything else — profile, documents, sessions, tokens, matches, consent
 * history — is deleted outright.
 */
export interface DeletionSummary {
  documents: number;
  matches: number;
  sessions: number;
  consentRecords: number;
  shareEventsAnonymised: number;
  purchasesRetained: number;
}

export async function deleteAccount(userId: string): Promise<DeletionSummary> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, deletedAt: true },
  });
  if (!user) throw new Error('NOT_FOUND');
  if (user.deletedAt) throw new Error('ALREADY_DELETED');

  const purchasesRetained = await prisma.purchase.count({ where: { userId } });

  // A tombstone address rather than null: email is unique but nullable, and
  // several nulls would collide on a later signup check. ".invalid" is reserved
  // by RFC 2606 and already excluded by isSendableEmail, so nothing can ever
  // try to send to it.
  const tombstone = `deleted-${userId}@deleted.invalid`;

  const [documents, matches, sessions, consentRecords, shareEvents] = await prisma.$transaction([
    prisma.document.deleteMany({ where: { userId } }),
    prisma.jobMatch.deleteMany({ where: { userId } }),
    prisma.session.deleteMany({ where: { userId } }),
    prisma.consentRecord.deleteMany({ where: { userId } }),
    // Kept as an aggregate, detached from the person.
    prisma.jobShareEvent.updateMany({ where: { userId }, data: { userId: null } }),

    prisma.profile.deleteMany({ where: { userId } }),
    prisma.emailVerification.deleteMany({ where: { userId } }),
    prisma.passwordReset.deleteMany({ where: { userId } }),
    prisma.oAuthAccount.deleteMany({ where: { userId } }),
    prisma.userProfession.deleteMany({ where: { userId } }),
    prisma.subscriptionUsage.deleteMany({ where: { userId } }),

    // Delivery logs carry the address; drop the address and the link, keep the
    // send/bounce outcome so broadcast reporting stays honest.
    prisma.emailDelivery.updateMany({
      where: { userId },
      data: { userId: null, email: tombstone },
    }),

    prisma.user.update({
      where: { id: userId },
      data: {
        deletedAt: new Date(),
        email: tombstone,
        name: null,
        image: null,
        passwordHash: null,
        emailVerified: null,
        isAdmin: false,
        // Belt and braces: nothing should reach a deleted account, and these
        // are what every send path actually checks.
        marketingOptOut: true,
        jobAlertsOptOut: true,
        recruiterVisible: false,
        onboardingComplete: false,
      },
    }),
  ]);

  return {
    documents: documents.count,
    matches: matches.count,
    sessions: sessions.count,
    consentRecords: consentRecords.count,
    shareEventsAnonymised: shareEvents.count,
    purchasesRetained,
  };
}
