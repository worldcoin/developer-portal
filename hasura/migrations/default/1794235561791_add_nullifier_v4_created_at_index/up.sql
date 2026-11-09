-- Supports time-range usage counts per RP (/api/_bot-fence/rp-usage).
CREATE INDEX IF NOT EXISTS "nullifier_v4_created_at_idx" ON "public"."nullifier_v4" ("created_at");
