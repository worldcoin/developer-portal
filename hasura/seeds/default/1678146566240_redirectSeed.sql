SET check_function_bodies = false;
WITH sign_in_app AS (
  SELECT id FROM "public"."app" WHERE name = 'Sign In App' LIMIT 1
)
INSERT INTO "public"."redirect" (action_id, redirect_uri)
VALUES
  ((SELECT id FROM "public"."action" WHERE app_id = (SELECT id FROM sign_in_app)), 'http://localhost:3000/login'),
  ((SELECT id FROM "public"."action" WHERE action = '' LIMIT 1), 'https://worldcoin.org'),
  ((SELECT id FROM "public"."action" WHERE action = '' LIMIT 1), 'https://example.com')