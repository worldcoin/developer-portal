alter table "public"."action" add column "return_url" jsonb
 not null default '[]';
