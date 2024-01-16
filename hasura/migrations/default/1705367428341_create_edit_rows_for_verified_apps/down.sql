DELETE FROM "public"."app_metadata"
WHERE verification_status = 'unverified'
AND app_id IN (
    SELECT app_id
    FROM "public"."app_metadata"
    WHERE verification_status = 'verified'
);