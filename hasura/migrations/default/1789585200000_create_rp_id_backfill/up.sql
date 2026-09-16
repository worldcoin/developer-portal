CREATE TABLE public.rp_id_backfill (
  app_id varchar(50) PRIMARY KEY,
  rp_id varchar(50) NOT NULL UNIQUE,
  production_status text NOT NULL CHECK (production_status IN ('unused', 'in_progress', 'reserved', 'already_registered', 'claimed_by_other')),
  production_request_id text,
  staging_status text NOT NULL CHECK (staging_status IN ('unused', 'in_progress', 'reserved', 'already_registered', 'claimed_by_other')),
  staging_request_id text,
  CHECK (app_id ~ '^app_[0-9a-f]{32}$'),
  CHECK (rp_id ~ '^rp_[0-9a-f]{16}$'),
  CHECK ((production_status = 'in_progress') = (production_request_id IS NOT NULL)),
  CHECK ((staging_status = 'in_progress') = (staging_request_id IS NOT NULL)),
  CHECK (production_request_id IS NULL OR production_request_id ~ '^0x[0-9a-f]{64}$'),
  CHECK (staging_request_id IS NULL OR staging_request_id ~ '^0x[0-9a-f]{64}$')
);

-- Deliberately no app foreign key: deletion must not erase unresolved operations.
COMMENT ON TABLE public.rp_id_backfill IS 'Fixed, service-only work list for the one-time RP ID backfill';
