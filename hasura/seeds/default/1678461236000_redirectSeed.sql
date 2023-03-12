SET check_function_bodies = false;
INSERT INTO "public"."redirect" (action_id, redirect_uri) VALUES ((select id from "public"."action" limit 1), 'https://example.com');
