DROP FUNCTION IF EXISTS public.rollup_world_id_analytics(date, date);
DROP FUNCTION IF EXISTS public.world_id_analytics_app_daily(varchar, varchar, date, date);
DROP TABLE IF EXISTS public.world_id_app_stats_daily;
DROP TABLE IF EXISTS public.action_v4_stats_daily;
DROP TABLE IF EXISTS public.action_legacy_stats_daily;
