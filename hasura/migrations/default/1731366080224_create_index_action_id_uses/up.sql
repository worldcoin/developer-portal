CREATE  INDEX "action_id_uses" on
  "public"."nullifier" using btree ("action_id", "uses");
