-- Collapse duplicate nullifier rows created before canonicalization (#3771261).
--
-- The split between the raw UNIQUE(nullifier_hash) and the canonical
-- nullifier_hash_int let one person create several rows for the same action via
-- hex re-encodings, each accruing `uses`. The verify handler only inspected the
-- first such row, so max_verifications could be exceeded once duplicates exist
-- (Codex review). Merge each duplicate group's `uses` into a single keeper so
-- the limit reflects total past verifications, delete the rest, and canonicalize
-- the survivor's nullifier_hash so future canonical writes collide on
-- unique_nullifier_hash (one row per person+action) instead of forming siblings.
--
-- Rows predating the nullifier_hash_int column (NULL int) are left untouched:
-- they were already deduped by the raw UNIQUE(nullifier_hash) of that era.

-- The merge below sets the keeper's uses to the group's total, which for the
-- bypassed rows this migration repairs can exceed max_verifications. The
-- enforce_uses_limit trigger (BEFORE UPDATE OF uses) would otherwise raise
-- "Maximum uses exceeded" and abort the migration, so disable it for the merge
-- only; the delete/canonicalize steps below do not modify uses.
ALTER TABLE public.nullifier DISABLE TRIGGER enforce_uses_limit;

-- 1. Merge uses into the keeper (earliest row) of each duplicate group.
--    Must run before the delete so the SUM still sees every duplicate.
WITH dups AS (
  SELECT
    nullifier_hash_int,
    (ARRAY_AGG(id ORDER BY created_at ASC, id ASC))[1] AS keep_id,
    SUM(uses) AS total_uses
  FROM public.nullifier
  WHERE nullifier_hash_int IS NOT NULL
  GROUP BY nullifier_hash_int
  HAVING COUNT(*) > 1
)
UPDATE public.nullifier n
SET uses = d.total_uses
FROM dups d
WHERE n.id = d.keep_id;

ALTER TABLE public.nullifier ENABLE TRIGGER enforce_uses_limit;

-- 2. Delete the non-keeper duplicates (same keeper ordering as step 1).
DELETE FROM public.nullifier n
USING (
  SELECT
    id,
    ROW_NUMBER() OVER (
      PARTITION BY nullifier_hash_int
      ORDER BY created_at ASC, id ASC
    ) AS rn
  FROM public.nullifier
  WHERE nullifier_hash_int IS NOT NULL
) ranked
WHERE n.id = ranked.id
  AND ranked.rn > 1;

-- 3. Canonicalize surviving rows' nullifier_hash to 0x + 64 lowercase hex.
--    Distinct nullifier_hash_int values map to distinct canonical hashes, so
--    this cannot collide with unique_nullifier_hash. Idempotent.
UPDATE public.nullifier
SET nullifier_hash =
  '0x' || lpad(regexp_replace(lower(translate(nullifier_hash, E' \t\n\r\f\v', '')), '^0x', ''), 64, '0')
WHERE nullifier_hash_int IS NOT NULL
  AND nullifier_hash IS DISTINCT FROM
    '0x' || lpad(regexp_replace(lower(translate(nullifier_hash, E' \t\n\r\f\v', '')), '^0x', ''), 64, '0');
