SET check_function_bodies = false;
INSERT INTO "public"."redirect"(action_id,redirect_uri)
VALUES
((SELECT id from "public"."action" WHERE "action" = '' and "app_id" = 'app_staging_70e1d8985198fb4f752680aa0563c3d1'),'https://worldcoin.org');
