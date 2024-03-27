
-- Could not auto-generate a down migration.
-- Please write an appropriate down migration for the SQL below:
DROP FUNCTION public.count_redirects;

-- Could not auto-generate a down migration.
-- Please write an appropriate down migration for the SQL below:
alter table "public"."auth_code" drop column "redirect_uri";
