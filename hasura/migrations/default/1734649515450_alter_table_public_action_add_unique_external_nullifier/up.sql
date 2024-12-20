-- FUNCTION: create_default_action_for_app
CREATE OR REPLACE FUNCTION create_default_action_for_app() RETURNS trigger AS $$ BEGIN
INSERT INTO action (app_id, name, description, action, max_verifications, external_nullifier)
VALUES (
    NEW.id,
    'Sign in with World ID',
    'Sign in with World ID',
    '',
    0,
    NEW.id
  );
RETURN null;
END;
$$ LANGUAGE 'plpgsql';

