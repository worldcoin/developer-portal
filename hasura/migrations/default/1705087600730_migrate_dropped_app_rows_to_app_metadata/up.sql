INSERT INTO
    "public"."app_metadata" (
        "app_id",
        "name",
        "logo_img_url",
        "verified_at",
        "status"
    )
SELECT
    "id",
    "name",
    "logo_url",
    "verified_at",
    CASE
        WHEN "verified_at" IS NOT NULL THEN 'verified'
        ELSE 'unverified'
    END AS "status"
FROM
    "public"."app";