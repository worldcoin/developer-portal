SET check_function_bodies = false;
INSERT INTO "public"."redirect"(action_id,redirect_uri)
VALUES
((SELECT id from "public"."action" WHERE "action" = '' limit 1),'https://worldcoin.org');
