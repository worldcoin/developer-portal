CREATE OR REPLACE FUNCTION create_default_action_for_app()
RETURNS trigger AS $$
BEGIN
  INSERT INTO action (app_id, name, description, action, max_verifications, external_nullifier)
  VALUES (
    NEW.id,
    'Sign in with World ID',
    'Sign in with World ID',
    '',
    0,
    NEW.id
  );

  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_insert_app_create_default_action ON public.app;

CREATE TRIGGER trigger_insert_app_create_default_action
AFTER INSERT ON public.app
FOR EACH ROW
WHEN (NEW.team_id = 'team_90a0b1944f38dd67417c3f09e9e7c21b')
EXECUTE PROCEDURE create_default_action_for_app();
