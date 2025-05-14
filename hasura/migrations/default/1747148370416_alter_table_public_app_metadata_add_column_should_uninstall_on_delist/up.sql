alter table "public"."app_metadata" add column "should_uninstall_on_delist" boolean
 not null default 'false';
