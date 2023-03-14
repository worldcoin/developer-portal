CREATE TABLE "public"."app_stats_returning" (
    "app_id" text NOT NULL, 
    "date" timestamp with time zone NOT NULL, 
    "verifications" numeric NOT NULL, 
    "unique_users" Numeric NOT NULL, 
    PRIMARY KEY ("app_id"), 
    FOREIGN KEY ("app_id") REFERENCES "public"."app"("id") 
        ON UPDATE restrict 
        ON DELETE restrict
);

COMMENT ON TABLE "public"."app_stats_returning" IS E'Returning value of app_stats function';

CREATE OR REPLACE FUNCTION public.app_stats(
    "timespan" character varying,
    "startsAt" timestamp with time zone, 
    "appId" character varying
)
-- If you changing returning values of this function, please, change app_stats_returning columns too
 RETURNS SETOF app_stats_returning
 LANGUAGE sql
 STABLE
AS $function$
SELECT
    action.app_id as app_id,
    DATE_TRUNC("timespan", nullifier.created_at) as date,
    SUM(COUNT(1)) OVER (ORDER BY DATE_TRUNC("timespan", nullifier.created_at)) as verifications,
    SUM(COUNT(DISTINCT nullifier_hash)) OVER (ORDER BY DATE_TRUNC("timespan", nullifier.created_at)) as unique_users
FROM nullifier AS nullifier
LEFT JOIN action action ON action.id = nullifier.action_id
WHERE app_id = "appId" AND nullifier.created_at >= "startsAt"
GROUP BY DATE_TRUNC("timespan", nullifier.created_at), app_id
$function$;
