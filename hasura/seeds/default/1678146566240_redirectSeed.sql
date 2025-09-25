SET
  check_function_bodies = false;

WITH
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
  "public"."redirect" (action_id, redirect_uri)
VALUES
  (
    (
      SELECT
        id
      FROM
        "public"."action"
      WHERE
        app_id = (
          SELECT
            id
          FROM
            sign_in_app
        )
    ),
    'http://localhost:3000/login'

  )