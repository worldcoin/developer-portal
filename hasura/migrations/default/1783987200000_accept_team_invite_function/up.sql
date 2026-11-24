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
-- If the invite is already gone, the caller may be a duplicate or concurrent
-- callback from a user who just joined via the winning request (the DELETE
-- above blocked until that request committed). In that case we return the
-- caller's existing membership in the invited team so the callback is
-- idempotent, instead of looking like a failure. A different user who never
-- won the invite has no such membership and gets an empty result.
--
-- The caller (web/api/login-callback) validates the invite beforehand (expiry,
-- and the email match for email/password users); this function owns only the
-- atomic consume-and-join. Membership role is fixed to MEMBER by design.
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
