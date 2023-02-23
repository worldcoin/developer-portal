alter table "public"."app" rename column "description" to "description_internal";

-- FUNCTION: insert_app_generate_id
CREATE OR REPLACE FUNCTION insert_app_generate_id() returns trigger as $$
DECLARE
  _new record;
BEGIN
    _new := NEW;
    _new."updated_at" = NOW();
    if _new."is_staging" then
        _new."id" = gen_random_friendly_id('app_staging');
    else
        _new."id" = gen_random_friendly_id('app');
    end if;
    return _new;
END;
$$ language plpgsql;

CREATE TRIGGER trigger_insert_app_id
before insert
on "public"."app"
for each row
execute procedure insert_app_generate_id();


ALTER TABLE "public"."app" ALTER COLUMN "id" drop default;


-- FUNCTION: create_default_action_for_app
CREATE OR REPLACE FUNCTION create_default_action_for_app() RETURNS trigger AS $$ BEGIN
INSERT INTO action (app_id, name, description, action, max_verifications)
VALUES (
    NEW.id,
    'Sign in with World ID',
    'Sign in with World ID',
    '',
    0
  );
RETURN null;
END;
$$ LANGUAGE 'plpgsql';