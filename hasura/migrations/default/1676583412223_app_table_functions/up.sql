-- FUNCTION: get_app_is_verified
CREATE OR REPLACE FUNCTION get_app_is_verified(app_row app) RETURNS boolean AS $$
SELECT CASE
    WHEN (app_row.verified_at is not null) THEN true
    ELSE false
  END $$ LANGUAGE sql STABLE;
-- FUNCTION: get_verified_app_logo
CREATE OR REPLACE FUNCTION get_verified_app_logo(app_row app) RETURNS VARCHAR AS $$
SELECT CASE
    WHEN (app_row.verified_at is not null) THEN app_row.logo_url
    ELSE ''
  END $$ LANGUAGE sql STABLE;
-- FUNCTION: create_default_action_for_app
CREATE OR REPLACE FUNCTION create_default_action_for_app() RETURNS trigger AS $$ BEGIN
INSERT INTO action (app_id, name)
VALUES (
    NEW.id,
    COALESCE(NULLIF(NEW.name, ''), 'Default Action')
  );
RETURN null;
END;
$$ LANGUAGE 'plpgsql';
CREATE TRIGGER trigger_insert_app_create_default_action
after
insert on "public"."team" for each row execute procedure create_default_action_for_app();
