CREATE TABLE "public"."sandbox_email_enrollment" (
  "id" varchar(50) NOT NULL DEFAULT gen_random_friendly_id('sbox'),
  "team_id" varchar(50) NOT NULL,
  "user_id" varchar(50) NOT NULL,
  "email" text NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY ("id"),
  FOREIGN KEY ("team_id") REFERENCES "public"."team"("id") ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON UPDATE CASCADE ON DELETE CASCADE,
  UNIQUE ("team_id", "user_id")
);

CREATE TRIGGER "set_public_sandbox_email_enrollment_updated_at"
BEFORE UPDATE ON "public"."sandbox_email_enrollment"
FOR EACH ROW
EXECUTE PROCEDURE "public"."set_current_timestamp_updated_at"();

COMMENT ON TRIGGER "set_public_sandbox_email_enrollment_updated_at" ON "public"."sandbox_email_enrollment"
IS 'trigger to set value of column "updated_at" to current timestamp on row update';

COMMENT ON TABLE "public"."sandbox_email_enrollment"
IS 'Tracks which team members have been enrolled in the WID sandbox TestFlight group';

CREATE INDEX "sandbox_email_enrollment_team_id_idx"
ON "public"."sandbox_email_enrollment" ("team_id");
