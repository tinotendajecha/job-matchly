-- Backfill closedAt for listings that expired before the column existed.
--
-- updatedAt is the closest proxy we have: the expiry pass was the last write to
-- these rows, so it approximates when the listing left the market. It is an
-- estimate, not a measurement — rows backfilled this way are only accurate to
-- the cron cadence. Everything expiring from now on is stamped precisely.
UPDATE "public"."JobPost"
SET "closedAt" = "updatedAt"
WHERE "status" = 'EXPIRED' AND "closedAt" IS NULL;
