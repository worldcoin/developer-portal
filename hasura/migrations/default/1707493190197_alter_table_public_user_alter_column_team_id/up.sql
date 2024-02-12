alter table "public"."user" alter column "team_id" drop not null;
alter table "public"."user" drop constraint "user_team_id_fkey",
  add constraint "user_team_id_fkey"
  foreign key ("team_id")
  references "public"."team"
  ("id") on update restrict on delete set null;
