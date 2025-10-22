SET
  check_function_bodies = false;

WITH
  multi_claim_app AS (
    SELECT
      app.id
    FROM
      "public"."app"
      JOIN "public"."app_metadata" ON app.id = app_metadata.app_id
    WHERE
      app_metadata.name = 'Multi-claim App'
    LIMIT
      1
  ),
  custom_action_app AS (
    SELECT
      app.id
    FROM
      "public"."app"
      JOIN "public"."app_metadata" ON app.id = app_metadata.app_id
    WHERE
      app_metadata.name = 'Custom Action App'
    LIMIT
      1
  ),
  sign_in_app AS (
    SELECT
      app.id
    FROM
      "public"."app"
      JOIN "public"."app_metadata" ON app.id = app_metadata.app_id
    WHERE
      app_metadata.name = 'Sign In App'
    LIMIT
      1
  )
INSERT INTO
  "public"."action" (
    id,
    created_at,
    updated_at,
    name,
    description,
    action,
    external_nullifier,
    app_id,
    max_accounts_per_user,
    max_verifications,
    creation_mode,
    client_secret,
    kiosk_enabled,
    status
  )
VALUES
  (
    'action_86e839ee931232e27c7866adf4ce67ba',
    '2023-02-28T20:44:01.1748+00:00',
    '2023-03-06T23:24:31.438404+00:00',
    'Multi-claim action',
    'This action can be claimed twice',
    'test',
    '0x00e57a1e126e6a4dd2066053678a560ffc4e0a30679c678b19810c0fd02bca53',
    (
      select
        "id"
      from
        "multi_claim_app"
    ),
    1,
    2,
    'developer_portal',
    '',
    'true',
    'active'
  ),
  (
    'action_b799ea110537a268cbeb20b9422fc0d5',
    '2023-02-28T22:47:28.86605+00:00',
    '2023-03-06T23:24:42.755009+00:00',
    'Custom Action 1',
    'This is a custom, one-time action',
    'one',
    '0x00d4a2b7a811e911e380c1db56cb6c168e9638e0d5f81950a013a9e86b75be1b',
    (
      select
        "id"
      from
        "custom_action_app"
    ),
    1,
    1,
    'developer_portal',
    '',
    'true',
    'active'
  ),
  (
    'action_810128f36ae7da142be1f6825f5f067f',
    '2023-02-28T22:48:26.819152+00:00',
    '2023-03-06T23:24:50.624226+00:00',
    'Custom Action 2',
    'This is a custom, multi-claim action',
    'multi',
    '0x002dff037d63b95eb49c8c46e8451cffa3111fe11c98e3fab28f3bdb110005ec',
    (
      select
        "id"
      from
        "custom_action_app"
    ),
    1,
    0,
    'developer_portal',
    '',
    'true',
    'active'
  ),
    (
    'action_bad7149fad76ee1109f044dc58aea7a1',
    '2023-02-28T20:44:01.1748+00:00',
    '2023-03-06T23:24:31.438404+00:00',
    'Sign in with World ID',
    'Sign in with World ID',
    '',
    '0x00c4ecd22f8a6b28b2a24b09ad04b4ac7f07ba6d05b3a7a1dc96ddea00a4ea65',
    (
      select
        "id"
      from
        "sign_in_app"
    ),
    1,
    0,
    'developer_portal',
    '',
    'true',
    'active'
  );

-- set external_nullifier for the sign in action
UPDATE "public"."action"
SET
  "external_nullifier" = '0x00bbb658813151e0abcf6f4968304c807baff10f42bd163d86faa33edbbb73e1'
WHERE
  app_id IN (
    SELECT
      app.id
    FROM
      "public"."app"
      JOIN "public"."app_metadata" ON app.id = app_metadata.app_id
    WHERE
      app_metadata.name = 'Sign In App'
  );