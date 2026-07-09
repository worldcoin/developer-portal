-- Merges a legacy Sign in with World ID account into another (current) user's
-- account, atomically:
--   * the legacy account's team memberships move to the current user, deduping
--     shared teams and keeping the highest role per team,
--   * the legacy row's world_id_nullifier moves to the current user verbatim
--     (login does an exact match against it),
--   * the legacy row loses both login identifiers (world_id_nullifier and
--     auth0Id) so World ID login resolves to exactly one user afterwards.
-- Apps, api keys and invites are team-scoped, so they follow the memberships.
--
-- _world_id_nullifier is the World ID the caller verified a proof for; the
-- merge aborts unless the legacy row still holds it. Nullifiers are compared
-- case- and 0x-prefix-insensitively, matching the application's normalization.
CREATE OR REPLACE FUNCTION public.merge_world_id_accounts(
  _current_user_id TEXT,
  _legacy_user_id TEXT,
  _world_id_nullifier TEXT
)
RETURNS SETOF public."user"
LANGUAGE plpgsql
VOLATILE
AS $$
DECLARE
  _current_nullifier TEXT;
  _legacy_nullifier TEXT;
BEGIN
  IF _legacy_user_id IS NULL OR _legacy_user_id = '' THEN
    RAISE EXCEPTION 'merge_world_id_accounts: _legacy_user_id is required';
  END IF;

  IF _world_id_nullifier IS NULL OR _world_id_nullifier = '' THEN
    RAISE EXCEPTION 'merge_world_id_accounts: _world_id_nullifier is required';
  END IF;

  IF _current_user_id = _legacy_user_id THEN
    RAISE EXCEPTION 'merge_world_id_accounts: cannot merge user % into itself',
      _current_user_id;
  END IF;

  -- Lock both user rows in a consistent order so concurrent calls touching
  -- the same accounts serialize instead of deadlocking.
  PERFORM 1 FROM public."user"
  WHERE id = LEAST(_current_user_id, _legacy_user_id)
  FOR UPDATE;

  PERFORM 1 FROM public."user"
  WHERE id = GREATEST(_current_user_id, _legacy_user_id)
  FOR UPDATE;

  SELECT world_id_nullifier INTO _current_nullifier
  FROM public."user" WHERE id = _current_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'merge_world_id_accounts: current user % not found',
      _current_user_id;
  END IF;

  SELECT world_id_nullifier INTO _legacy_nullifier
  FROM public."user" WHERE id = _legacy_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'merge_world_id_accounts: legacy user % not found',
      _legacy_user_id;
  END IF;

  IF _legacy_nullifier IS NULL THEN
    RAISE EXCEPTION 'merge_world_id_accounts: legacy user % has no world_id_nullifier',
      _legacy_user_id;
  END IF;

  -- The claimed World ID must be the one the legacy account holds (protects
  -- against the caller's lookup racing a concurrent change).
  IF regexp_replace(lower(_legacy_nullifier), '^0x', '')
    <> regexp_replace(lower(_world_id_nullifier), '^0x', '') THEN
    RAISE EXCEPTION 'merge_world_id_accounts: legacy user % holds a different World ID than the one being claimed',
      _legacy_user_id;
  END IF;

  -- Never silently replace a different World ID already linked to the
  -- current user.
  IF _current_nullifier IS NOT NULL
    AND regexp_replace(lower(_current_nullifier), '^0x', '')
      <> regexp_replace(lower(_world_id_nullifier), '^0x', '') THEN
    RAISE EXCEPTION 'merge_world_id_accounts: current user % is already linked to a different World ID',
      _current_user_id;
  END IF;

  -- Bump the current user's role in shared teams where the legacy account
  -- holds a higher role.
  UPDATE public.membership AS cm
  SET role = lm.role
  FROM (
    SELECT DISTINCT ON (team_id) team_id, role
    FROM public.membership
    WHERE user_id = _legacy_user_id
    ORDER BY team_id,
      CASE role WHEN 'OWNER' THEN 3 WHEN 'ADMIN' THEN 2 ELSE 1 END DESC
  ) AS lm
  WHERE cm.user_id = _current_user_id
    AND cm.team_id = lm.team_id
    AND (CASE cm.role WHEN 'OWNER' THEN 3 WHEN 'ADMIN' THEN 2 ELSE 1 END)
      < (CASE lm.role WHEN 'OWNER' THEN 3 WHEN 'ADMIN' THEN 2 ELSE 1 END);

  -- Drop legacy memberships in teams the current user is already in. There is
  -- no unique (user_id, team_id) constraint, so this is the dedupe step.
  DELETE FROM public.membership AS lm
  WHERE lm.user_id = _legacy_user_id
    AND EXISTS (
      SELECT 1 FROM public.membership AS cm
      WHERE cm.user_id = _current_user_id
        AND cm.team_id = lm.team_id
    );

  -- Dedupe the legacy account's own per-team duplicates (keep the highest
  -- role), then move what remains onto the current user.
  DELETE FROM public.membership AS lm
  WHERE lm.user_id = _legacy_user_id
    AND lm.id NOT IN (
      SELECT DISTINCT ON (team_id) id
      FROM public.membership
      WHERE user_id = _legacy_user_id
      ORDER BY team_id,
        CASE role WHEN 'OWNER' THEN 3 WHEN 'ADMIN' THEN 2 ELSE 1 END DESC
    );

  UPDATE public.membership
  SET user_id = _current_user_id
  WHERE user_id = _legacy_user_id;

  -- Neutralize the legacy account's login identifiers first, then move the
  -- nullifier, so the nullifier is never held by two rows. The legacy row's
  -- stored value is copied verbatim for login parity.
  UPDATE public."user"
  SET world_id_nullifier = NULL, "auth0Id" = NULL
  WHERE id = _legacy_user_id;

  UPDATE public."user"
  SET world_id_nullifier = _legacy_nullifier
  WHERE id = _current_user_id;

  RETURN QUERY
  SELECT * FROM public."user" WHERE id = _current_user_id;
END;
$$;
