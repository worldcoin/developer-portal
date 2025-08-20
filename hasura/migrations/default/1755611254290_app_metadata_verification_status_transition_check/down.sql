-- drop the trigger
DROP TRIGGER IF EXISTS app_metadata_verification_status_transition_check ON "public"."app_metadata";

-- drop the function
DROP FUNCTION IF EXISTS prevent_verified_status_change();
