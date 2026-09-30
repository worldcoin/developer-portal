CREATE TABLE public.rp_id_backfill (
  app_id varchar(50) PRIMARY KEY,
  rp_id varchar(50) NOT NULL UNIQUE,
  production_status text NOT NULL,
  production_request_id text,
  staging_status text NOT NULL,
  staging_request_id text,
  CHECK (production_status IN ('unused', 'in_progress', 'reserved', 'already_registered', 'claimed_by_other')),
  CHECK (staging_status IN ('unused', 'in_progress', 'reserved', 'already_registered', 'claimed_by_other')),
  CHECK ((production_status = 'in_progress') = (production_request_id IS NOT NULL)),
  CHECK ((staging_status = 'in_progress') = (staging_request_id IS NOT NULL))
);
-- Deliberately no app foreign key: deleting an app must not release its ID.

-- All writes, including Portal finalization and manual SQL, share the operator lock.
CREATE FUNCTION public.lock_rp_id_backfill() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  PERFORM pg_advisory_xact_lock(824701);
  RETURN NULL;
END;
$$;
CREATE TRIGGER lock_rp_id_backfill BEFORE INSERT OR UPDATE OR DELETE
ON public.rp_id_backfill FOR EACH STATEMENT EXECUTE FUNCTION public.lock_rp_id_backfill();
