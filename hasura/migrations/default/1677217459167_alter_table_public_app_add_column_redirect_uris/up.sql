alter table "public"."app" add column "redirect_uris" jsonb
 not null default '[]';
