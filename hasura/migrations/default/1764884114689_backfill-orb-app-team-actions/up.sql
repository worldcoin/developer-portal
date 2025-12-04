INSERT INTO public.action (app_id, name, description, action, max_verifications, external_nullifier)
SELECT
  a.id,
  'Sign in with World ID',
  'Sign in with World ID',
  '',
  0,
  a.id
FROM public.app a
WHERE a.team_id = 'team_90a0b1944f38dd67417c3f09e9e7c21b'
  AND NOT EXISTS (
    SELECT 1
    FROM public.action act
    WHERE act.app_id = a.id
      AND act.name = 'Sign in with World ID'
      AND act.external_nullifier = a.id
  );
