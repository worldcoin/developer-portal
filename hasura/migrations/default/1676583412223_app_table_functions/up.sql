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
-- FUNCTION: create_default_app_for_team
CREATE OR REPLACE FUNCTION create_default_app_for_team() RETURNS trigger AS $$ BEGIN
INSERT INTO app (team_id, name)
VALUES (
    NEW.id,
    COALESCE(NULLIF(NEW.name, ''), 'Default App')
  );
RETURN null;
END;
$$ LANGUAGE 'plpgsql';
CREATE TRIGGER trigger_insert_team_create_default_app
after
insert on "public"."team" for each row execute procedure create_default_app_for_team();
