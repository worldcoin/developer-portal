-- Keep the strongest existing membership for each account and team.
LOCK TABLE public.membership IN ACCESS EXCLUSIVE MODE;

WITH ranked AS (
  SELECT id, row_number() OVER (
    PARTITION BY team_id, user_id
    ORDER BY CASE role WHEN 'OWNER' THEN 1 WHEN 'ADMIN' THEN 2 ELSE 3 END,
             created_at, id
  ) AS position
  FROM public.membership
)
DELETE FROM public.membership AS membership
USING ranked
WHERE membership.id = ranked.id AND ranked.position > 1;

ALTER TABLE public.membership
  ADD CONSTRAINT membership_team_id_user_id_key UNIQUE (team_id, user_id);

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
    ON CONFLICT ON CONSTRAINT membership_team_id_user_id_key DO NOTHING
    RETURNING *;

    IF FOUND THEN
      RETURN;
    END IF;
  END IF;

  -- A retry or another join path may already have created the membership.
  RETURN QUERY
  SELECT *
  FROM public.membership
  WHERE team_id = COALESCE(_deleted_team_id, _team_id) AND user_id = _user_id;
END;
$$;
