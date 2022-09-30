-- FIXME: Can we improve this to not rely on an intermediary table?
CREATE TABLE "public"."verified_humans_returning_value" ("data" json NOT NULL, "action_id" varchar NOT NULL, PRIMARY KEY ("action_id") , FOREIGN KEY ("action_id") REFERENCES "public"."action"("id") ON UPDATE restrict ON DELETE restrict, UNIQUE ("action_id"));COMMENT ON TABLE "public"."verified_humans_returning_value" IS E'Returning value of get_verified_humans function';
CREATE FUNCTION get_verified_humans("timespan" text, "startsAt" timestamptz, "actionId" varchar)
RETURNS SETOF "public"."verified_humans_returning_value" AS $$

SELECT json_agg((jsonb_build_object('createdAt', B."created_at") || jsonb_build_object('verified_humans_count', B."verified_humans_count"))) as "data", "action_id"
FROM
    (SELECT sum(sum(A."verified_during_timespan")) over (PARTITION by "action_id" order by "created_at" asc) as "verified_humans_count", "created_at", "action_id"
    FROM
        (SELECT DATE_TRUNC("timespan", "created_at") as "created_at", COUNT("id") as "verified_during_timespan", "action_id"
        FROM "public"."nullifier"
        WHERE "created_at" > "startsAt" AND "action_id" = "actionId"
        GROUP BY DATE_TRUNC("timespan", "created_at"), "action_id", "nullifier"."created_at") as A
    GROUP BY A."created_at", A."action_id") as B
GROUP BY "action_id"
$$ LANGUAGE sql STABLE;