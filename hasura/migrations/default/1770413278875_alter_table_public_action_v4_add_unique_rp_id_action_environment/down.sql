alter table "public"."action_v4" drop constraint "action_v4_rp_id_action_environment_key";
alter table "public"."action_v4" add constraint "action_v4_rp_id_action_key" unique ("rp_id", "action");
