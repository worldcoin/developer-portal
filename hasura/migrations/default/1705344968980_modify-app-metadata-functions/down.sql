DROP TRIGGER IF EXISTS "trigger_set_upsert_constraint" ON "public"."app_metadata";

DROP FUNCTION IF EXISTS "set_upsert_constraint";

DROP FUNCTION IF EXISTS "enforce_app_id_row_limit";

alter table "public"."app_metadata"
drop column if exists "unique_verification_status_row";