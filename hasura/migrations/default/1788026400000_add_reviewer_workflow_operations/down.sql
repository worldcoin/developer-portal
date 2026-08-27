DROP FUNCTION public.reviewer_save_app_review_checklist(uuid, uuid, integer, text, jsonb, text, text);
DROP FUNCTION public.reviewer_release_app_review_submission(uuid, uuid, integer, text, text);
DROP FUNCTION public.reviewer_heartbeat_app_review_submission(uuid, uuid, integer, text, text);
DROP FUNCTION public.reviewer_claim_app_review_submission(uuid, integer, text, text);
DROP INDEX "public"."app_review_event_event_sequence_unique";
ALTER TABLE "public"."app_review_event" DROP COLUMN "event_sequence";
