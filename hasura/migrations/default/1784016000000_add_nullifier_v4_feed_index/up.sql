CREATE INDEX "nullifier_v4_action_created_id_idx"
ON "public"."nullifier_v4" ("action_v4_id", "created_at" DESC, "id" DESC);
