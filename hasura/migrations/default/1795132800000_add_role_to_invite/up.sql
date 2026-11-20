-- Invites carry the membership role the invitee receives when they accept.
-- Existing and user-created invites default to MEMBER, so the previous
-- behaviour is unchanged for every caller that does not set a role (including
-- app versions still running during a rolling deploy). OWNER is excluded at
-- the database level: team ownership is never granted through an invite.
ALTER TABLE public.invite
  ADD COLUMN role text NOT NULL DEFAULT 'MEMBER',
  ADD CONSTRAINT invite_role_fkey FOREIGN KEY (role)
    REFERENCES public.role (value) ON UPDATE RESTRICT ON DELETE RESTRICT,
  ADD CONSTRAINT invite_role_not_owner CHECK (role IN ('ADMIN', 'MEMBER'));

-- Same atomic consume-and-join as 1783987200000_accept_team_invite_function,
-- except the membership role now comes from the consumed invite instead of
-- being hardcoded to MEMBER. The signature is unchanged so callers need no
-- update. See that migration for the concurrency reasoning.
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
  _invite_role TEXT;
BEGIN
  DELETE FROM public.invite
  WHERE id = _invite_id
  RETURNING team_id, role INTO _deleted_team_id, _invite_role;

  IF FOUND THEN
    RETURN QUERY
    INSERT INTO public.membership (team_id, user_id, role)
    VALUES (_deleted_team_id, _user_id, _invite_role)
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
