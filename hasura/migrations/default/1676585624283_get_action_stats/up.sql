CREATE TABLE "public"."action_stats_returning_value" (
  "action_id" text NOT NULL,
  "date" timestamp with time zone NOT NULL,
  "total" numeric NOT NULL,
  "total_cumulative" Numeric NOT NULL,
  PRIMARY KEY ("action_id"),
  FOREIGN KEY ("action_id") REFERENCES "public"."action"("id") ON UPDATE restrict ON DELETE restrict
);
COMMENT ON TABLE "public"."action_stats_returning_value" IS E'Returning value of get_action_stats function';
---
CREATE OR REPLACE FUNCTION public.get_action_stats(
    timespan text,
    "startsAt" timestamp with time zone,
    "actionId" character varying
  ) -- If you changing returning values of this function, please, change action_stats_returning_value columns too
  RETURNS SETOF action_stats_returning_value LANGUAGE sql STABLE AS $function$
SELECT action_id,
  DATE_TRUNC("timespan", nullifier.created_at) as date,
  count(1) as total,
  sum(count(1)) OVER (
    ORDER BY DATE_TRUNC("timespan", nullifier.created_at)
  ) as total_cumulative
FROM nullifier
WHERE action_id = "actionId"
  AND created_at >= "startsAt"
GROUP BY DATE_TRUNC("timespan", created_at),
  action_id $function$;
