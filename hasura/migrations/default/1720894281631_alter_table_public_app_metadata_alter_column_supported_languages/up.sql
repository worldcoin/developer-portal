ALTER TABLE "public"."app_metadata" ALTER COLUMN "supported_languages" TYPE text[];
alter table "public"."app_metadata" alter column "supported_languages" set default '{"en"}';
