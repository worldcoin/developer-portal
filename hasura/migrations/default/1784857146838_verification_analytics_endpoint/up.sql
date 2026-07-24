-- PR 3: bounded analytics endpoint support.

-- Action-list pagination for the endpoint (ORDER BY created_at DESC, id DESC per
-- (rp, environment) page). Preflight prod row counts before deploy, as with PR 1/2.
CREATE INDEX "action_v4_rp_id_environment_created_at_idx"
  ON "public"."action_v4" ("rp_id", "environment", "created_at" DESC, "id" DESC);

-- The watermark and config tables stay untracked (plan section 10); the endpoint reads
-- their timestamps through this STABLE query function instead.
CREATE TABLE "public"."verification_meta_returning" (
  "key" text NOT NULL,
  "timestamp_value" timestamptz
);
COMMENT ON TABLE "public"."verification_meta_returning" IS 'Returning value of verification_analytics_meta function';

CREATE OR REPLACE FUNCTION public.verification_analytics_meta()
RETURNS SETOF public.verification_meta_returning
LANGUAGE sql
STABLE
AS $$
  SELECT 'watermark_last_until'::text AS key, w.last_until AS timestamp_value
  FROM public.rollup_watermark w
  WHERE w.key = 'verification_stats'
  UNION ALL
  SELECT 'watermark_last_success_at', w.last_success_at
  FROM public.rollup_watermark w
  WHERE w.key = 'verification_stats'
  UNION ALL
  SELECT c.key, c.timestamp_value
  FROM public.verification_analytics_config c
$$;
