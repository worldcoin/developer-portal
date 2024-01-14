WITH
    inserted_app AS (
        INSERT INTO
            "public"."app" (
                is_archived,
                is_staging,
                team_id,
                engine,
                status,
                created_at,
                updated_at
            )
        VALUES
            (
                false,
                false,
                'team_d7cde14f17eda7e0ededba7ded6b4467',
                'cloud',
                'active',
                '2023-02-18T11:20:39.530041+00:00',
                '2023-03-06T23:00:15.992529+00:00'
            ) RETURNING id
    )
INSERT INTO
    "public"."app_metadata" (app_id, name, description, logo_img_url, status)
SELECT
    id,
    'Sign In App',
    'This app is for Sign In with World ID',
    'https://worldcoin.org/icons/logo-small.svg',
    'unverified'
FROM
    inserted_app;

WITH
    inserted_app AS (
        INSERT INTO
            "public"."app" (
                is_archived,
                is_staging,
                team_id,
                engine,
                status,
                created_at,
                updated_at
            )
        VALUES
            (
                false,
                true,
                'team_d7cde14f17eda7e0ededba7ded6b4467',
                'cloud',
                'active',
                '2023-02-18T11:20:39.530041+00:00',
                '2023-03-06T23:00:15.995455+00:00'
            ) RETURNING id
    )
INSERT INTO
    "public"."app_metadata" (app_id, name, description, logo_img_url, status)
SELECT
    id,
    'Multi-claim App',
    'This app has a multi-claim custom action',
    '',
    'unverified'
FROM
    inserted_app;

WITH
    inserted_app AS (
        INSERT INTO
            "public"."app" (
                is_archived,
                is_staging,
                team_id,
                engine,
                status,
                created_at,
                updated_at
            )
        VALUES
            (
                false,
                false,
                'team_d7cde14f17eda7e0ededba7ded6b4467',
                'on-chain',
                'active',
                '2023-02-18T11:20:39.530041+00:00',
                '2023-03-06T23:00:15.998795+00:00'
            ) RETURNING id
    )
INSERT INTO
    "public"."app_metadata" (app_id, name, description, logo_img_url, status)
SELECT
    id,
    'On-chain App',
    'This app is on-chain and in production',
    '',
    'unverified'
FROM
    inserted_app;

WITH
    inserted_app AS (
        INSERT INTO
            "public"."app" (
                is_archived,
                is_staging,
                team_id,
                engine,
                status,
                created_at,
                updated_at
            )
        VALUES
            (
                false,
                true,
                'team_d7cde14f17eda7e0ededba7ded6b4467',
                'cloud',
                'active',
                '2023-02-18T11:20:39.530041+00:00',
                '2023-03-06T23:00:16.00117+00:00'
            ) RETURNING id
    )
INSERT INTO
    "public"."app_metadata" (app_id, name, description, logo_img_url, status)
SELECT
    id,
    'Custom Action App',
    'This app has a one-time custom action' '',
    'unverified'
FROM
    inserted_app;

WITH
    inserted_app AS (
        INSERT INTO
            "public"."app" (
                is_archived,
                is_staging,
                team_id,
                engine,
                status,
                created_at,
                updated_at
            )
        VALUES
            (
                true,
                true,
                'team_d7cde14f17eda7e0ededba7ded6b4467',
                'cloud',
                'inactive',
                '2023-02-18T11:20:39.530041+00:00',
                '2023-03-06T23:00:15.98657+00:00'
            ) RETURNING id
    )
    -- Insert into the app_metadata table using the returned id from the app table
INSERT INTO
    "public"."app_metadata" (app_id, name, description, logo_img_url, status)
SELECT
    id,
    'Archived App',
    'This app is inactive and archived',
    'https://worldcoin.org/icons/logo-small.svg',
    'unverified'
FROM
    inserted_app;