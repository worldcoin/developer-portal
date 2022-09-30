DROP TRIGGER IF EXISTS insert_action_generate_id ON "public"."action";

DROP FUNCTION IF EXISTS trigger_insert_action_id;

DROP FUNCTION IF EXISTS get_team_is_verified(team);

DROP FUNCTION IF EXISTS get_verified_app_logo(team);