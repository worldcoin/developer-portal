-- Atomically consumes a single-use team invite and creates the resulting
-- membership in one transaction.
--
-- The DELETE on the invite's primary key is the concurrency gate: Postgres
-- takes a row lock on the invite, so concurrent callers bearing the same
-- invite_id serialize, and only the one that actually removes the row goes on
-- to insert a membership. A single-use invite therefore yields exactly one
-- membership even under a concurrent request burst, and the delete + insert can
-- never partially apply (both commit together or neither does, so a failed
-- insert leaves the invite intact for a retry).
--
-- The caller (web/api/login-callback) validates the invite beforehand (expiry,
-- and the email match for email/password users); this function owns only the
-- atomic consume-and-join. Membership role is fixed to MEMBER by design.
CREATE OR REPLACE FUNCTION public.accept_team_invite(
  _invite_id TEXT,
  _user_id TEXT
)
RETURNS SETOF public.membership
LANGUAGE plpgsql
VOLATILE
AS $$
DECLARE
  _team_id TEXT;
BEGIN
  DELETE FROM public.invite
  WHERE id = _invite_id
  RETURNING team_id INTO _team_id;

  -- Invite already consumed (lost the race) or never existed: create nothing.
  -- The caller distinguishes this from success by the empty result set.
  IF NOT FOUND THEN
    RETURN;
  END IF;

  RETURN QUERY
  INSERT INTO public.membership (team_id, user_id, role)
  VALUES (_team_id, _user_id, 'MEMBER')
  RETURNING *;
END;
$$;
