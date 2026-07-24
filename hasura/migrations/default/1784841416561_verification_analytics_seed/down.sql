-- The seed's data writes are not reversible (they merge into shared tables). This only
-- removes the markers and watermark so a fresh seed can run after the data is restored
-- from backup or the analytics tables are rebuilt.
DELETE FROM public.verification_analytics_config
WHERE key IN ('legacy_seed_completed_at', 'legacy_daily_delta_started_at');

DELETE FROM public.rollup_watermark WHERE key = 'verification_stats';

DELETE FROM public.verification_reconciliation_state;
