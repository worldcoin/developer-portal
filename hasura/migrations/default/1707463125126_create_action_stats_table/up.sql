CREATE TABLE "public"."action_stats_returning" (
    "action_id" text NOT NULL, 
    "date" timestamp with time zone NOT NULL, 
    "verifications" numeric NOT NULL, 
    "unique_users" Numeric NOT NULL, 
    PRIMARY KEY ("action_id"), 
    FOREIGN KEY ("action_id") REFERENCES "public"."action"("id") 
        ON UPDATE restrict 
        ON DELETE restrict
);

COMMENT ON TABLE "public"."action_stats_returning" IS E'Returning value of action_stats function';

CREATE OR REPLACE FUNCTION public.action_stats(
    "timespan" character varying,
    "startsAt" timestamp with time zone, 
    "actionId" character varying
)
-- If you changing returning values of this function, please, change action_stats_returning columns too
 RETURNS SETOF action_stats_returning
 LANGUAGE sql
 STABLE
AS $function$
WITH sum_query AS (
    SELECT
        action.id as action_id,
        DATE_TRUNC("timespan", nullifier.created_at) as date,
        SUM(nullifier.uses) as verifications,
        SUM(COUNT(DISTINCT nullifier_hash)) OVER (ORDER BY DATE_TRUNC("timespan", nullifier.created_at)) as unique_users
    FROM nullifier AS nullifier
    LEFT JOIN action action ON action.id = nullifier.action_id
    WHERE action_id = "actionId" AND nullifier.created_at >= "startsAt"
    GROUP BY DATE_TRUNC("timespan", nullifier.created_at), action.id
)
SELECT
    action_id,
    date,
    SUM(verifications) OVER (ORDER BY date) as total_verifications,
    unique_users
FROM sum_query;
$function$;