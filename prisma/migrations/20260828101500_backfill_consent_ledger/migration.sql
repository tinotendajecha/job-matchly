-- Seed the ledger from the consent already recorded on User.
--
-- Existing users agreed to the v1 agreement, and their row records that version
-- verbatim. v2 narrows recruiter sharing from a blanket authorisation to an
-- opt-in, so it is a substantive change: nobody is migrated onto it silently,
-- and nobody gains RECRUITER_VISIBILITY here. That permission starts at false
-- for every existing account and can only be granted by the user.
INSERT INTO "public"."ConsentRecord" ("id", "userId", "purpose", "granted", "version", "source", "createdAt")
SELECT
  'bf_' || substr(md5(random()::text || u."id"), 1, 22),
  u."id",
  'ACCOUNT_TERMS'::"public"."ConsentPurpose",
  TRUE,
  COALESCE(u."consentVersion", 'unknown-pre-ledger'),
  'backfill',
  COALESCE(u."consentGivenAt", u."createdAt")
FROM "public"."User" u
WHERE u."consentGiven" = TRUE
  AND NOT EXISTS (
    SELECT 1 FROM "public"."ConsentRecord" c
    WHERE c."userId" = u."id" AND c."purpose" = 'ACCOUNT_TERMS'
  );

-- Email preferences were already being honoured, so the ledger should say so.
INSERT INTO "public"."ConsentRecord" ("id", "userId", "purpose", "granted", "version", "source", "createdAt")
SELECT
  'bf_' || substr(md5(random()::text || u."id" || 'mkt'), 1, 22),
  u."id",
  'MARKETING_EMAIL'::"public"."ConsentPurpose",
  NOT u."marketingOptOut",
  COALESCE(u."consentVersion", 'unknown-pre-ledger'),
  'backfill',
  COALESCE(u."consentGivenAt", u."createdAt")
FROM "public"."User" u
WHERE NOT EXISTS (
  SELECT 1 FROM "public"."ConsentRecord" c
  WHERE c."userId" = u."id" AND c."purpose" = 'MARKETING_EMAIL'
);
