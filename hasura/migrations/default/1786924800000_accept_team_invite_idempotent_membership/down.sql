-- Restore the previous definition, which inserted unconditionally once it won
-- the invite delete.
CREATE OR REPLACE FUNCTION public.accept_team_invite(
  _invite_id TEXT,
  _team_id TEXT,
  _user_id TEXT
)
RETURNS SETOF public.membership
LANGUAGE plpgsql
VOLATILE
AS $$
DECLARE
  _deleted_team_id TEXT;
BEGIN
  DELETE FROM public.invite
  WHERE id = _invite_id
  RETURNING team_id INTO _deleted_team_id;

  IF FOUND THEN
    RETURN QUERY
    INSERT INTO public.membership (team_id, user_id, role)
    VALUES (_deleted_team_id, _user_id, 'MEMBER')
    RETURNING *;
  ELSE
    RETURN QUERY
    SELECT *
    FROM public.membership
    WHERE team_id = _team_id AND user_id = _user_id
    LIMIT 1;
  END IF;
END;
$$;
