INSERT INTO
    "public"."app_metadata" (app_id, name, logo_img_url, verification_status)
SELECT
    app_id,
    name,
    logo_img_url,
    'unverified'
FROM
    "public"."app_metadata"
WHERE
    verification_status = 'verified';