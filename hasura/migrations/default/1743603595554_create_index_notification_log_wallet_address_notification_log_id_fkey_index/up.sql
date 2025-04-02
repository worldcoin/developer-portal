CREATE INDEX "notification_log_wallet_address_notification_log_id_fkey_index" on
  "public"."notification_log_wallet_address" using btree ("notification_log_id");
