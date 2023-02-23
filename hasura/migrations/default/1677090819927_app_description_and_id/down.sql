-- FUNCTION: create_default_action_for_app
CREATE OR REPLACE FUNCTION create_default_action_for_app() RETURNS trigger AS $$ BEGIN
INSERT INTO action (app_id, name, description, action, max_verifications)
VALUES (
    NEW.id,
    COALESCE(NULLIF(NEW.name, ''), 'Sign in with World ID'),
    COALESCE(NULLIF(NEW.description, ''), 'Sign in with World ID'),
    '',
    0
  );
RETURN null;
END;
$$ LANGUAGE 'plpgsql';


DROP TRIGGER IF EXISTS trigger_insert_app_id ON "public"."app";

DROP FUNCTION IF EXISTS insert_app_generate_id;

alter table "public"."app" alter column "id" set default gen_random_friendly_id('app');

alter table "public"."app" rename column "description_internal" to "description";
