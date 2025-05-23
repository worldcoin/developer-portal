-- Drop the trigger and function related to the new table
DROP TRIGGER IF EXISTS trg_after_nullifier_insert ON nullifier;
DROP FUNCTION IF EXISTS trg_update_app_stats;

-- Drop the new app_stats table and its index
DROP INDEX IF EXISTS idx_app_stats_app_id;
DROP TABLE IF EXISTS app_stats;

-- Recreate the original app_stats_returning table
CREATE TABLE public.app_stats_returning (
  app_id TEXT NOT NULL,
  date TIMESTAMPTZ NOT NULL,
  verifications NUMERIC NOT NULL,
  unique_users NUMERIC NOT NULL,
  PRIMARY KEY (app_id),
  FOREIGN KEY (app_id) REFERENCES public.app(id)
    ON UPDATE RESTRICT
    ON DELETE RESTRICT
);

COMMENT ON TABLE public.app_stats_returning IS E'Returning value of app_stats function';

-- Recreate the original app_stats function
CREATE OR REPLACE FUNCTION public.app_stats(
  timespan character varying,
  startsAt timestamptz,
  appId character varying
)
RETURNS SETOF app_stats_returning
LANGUAGE sql
STABLE
AS $function$
  SELECT
    action.app_id as app_id,
    DATE_TRUNC(timespan, nullifier.created_at) as date,
    SUM(COUNT(1)) OVER (ORDER BY DATE_TRUNC(timespan, nullifier.created_at)) as verifications,
    SUM(COUNT(DISTINCT nullifier_hash)) OVER (ORDER BY DATE_TRUNC(timespan, nullifier.created_at)) as unique_users
  FROM nullifier
  LEFT JOIN action ON action.id = nullifier.action_id
  WHERE app_id = appId AND nullifier.created_at >= startsAt
  GROUP BY DATE_TRUNC(timespan, nullifier.created_at), app_id
$function$;