CREATE  INDEX "public_apps_index" on
  "public"."app_metadata" using btree ("verification_status", "is_reviewer_app_store_approved");
