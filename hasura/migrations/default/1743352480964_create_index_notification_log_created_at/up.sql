CREATE  INDEX "notification_log_created_at" on
  "public"."notification_log" using btree ("created_at");
