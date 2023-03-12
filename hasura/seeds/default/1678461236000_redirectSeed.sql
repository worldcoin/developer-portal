SET check_function_bodies = false;
INSERT INTO "public"."redirect" (action_id, redirect_uri)
VALUES 
((select id from "public"."action" where action = '' and app_id = (select "id" from "public"."app" limit 1) limit 1), 'https://example.com');
