-- FUNCTION: insert_action_generate_id
CREATE OR REPLACE FUNCTION insert_action_generate_id() returns trigger as $$
DECLARE
  _new record;
BEGIN
    _new := NEW;
    _new."updated_at" = NOW();
    if _new."is_staging" then
        _new."id" = gen_random_friendly_id('wid_staging');
    else
        _new."id" = gen_random_friendly_id('wid');
    end if;
    return _new;
END;
$$ language plpgsql;

CREATE TRIGGER trigger_insert_action_id
before insert
on "public"."action"
for each row
execute procedure insert_action_generate_id();

-- FUNCTION: get_team_is_verified
CREATE OR REPLACE FUNCTION get_team_is_verified(team_row team) 

RETURNS boolean

AS

$$

SELECT CASE WHEN (team_row.verified_at is not null) THEN true ELSE false END

$$

LANGUAGE sql STABLE;


-- FUNCTION: get_verified_app_logo
CREATE OR REPLACE FUNCTION get_verified_app_logo(team_row team) 

RETURNS VARCHAR

AS

$$

SELECT CASE WHEN (team_row.verified_at is not null) THEN team_row.app_logo_url ELSE '' END

$$

LANGUAGE sql STABLE;
