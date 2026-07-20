CREATE INDEX IF NOT EXISTS "membership_user_id_role_idx"
  ON "public"."membership" USING btree ("user_id", "role");

CREATE INDEX IF NOT EXISTS "membership_team_id_role_idx"
  ON "public"."membership" USING btree ("team_id", "role");

CREATE INDEX IF NOT EXISTS "membership_owner_team_id_idx"
  ON "public"."membership" USING btree ("team_id")
  WHERE "role" = 'OWNER';
