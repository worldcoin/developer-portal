-- The seed's data writes are not reversible here; this removes the marker (disarming
-- the v4 rollup/reconciliation passes) so a fresh v4 seed can run after the v4 stats
-- rows and snapshots are cleaned up.
DELETE FROM public.verification_analytics_config WHERE key = 'v4_seed_completed_at';
