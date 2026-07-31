DROP FUNCTION IF EXISTS public.rollup_world_id_analytics();
DROP FUNCTION IF EXISTS public.world_id_analytics_app_daily(varchar, varchar, date, date);
DROP TABLE IF EXISTS public.world_id_app_stats_daily;
DROP TABLE IF EXISTS public.world_id_analytics_state;
DROP INDEX IF EXISTS public.nullifier_v4_created_at_idx;
DROP TABLE IF EXISTS public.action_v4_stats_daily;
DROP TABLE IF EXISTS public.action_v3_stats_daily;
