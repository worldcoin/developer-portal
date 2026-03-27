-- Migration: Create action_v4 and nullifier_v4 tables for World ID 4.0
-- Description: Stores actions and nullifiers for the new verify v4 endpoint

-- Create enum for action environment (staging vs production)
CREATE TYPE action_environment AS ENUM ('staging', 'production');

-- Create the action_v4 table
-- Note: No 'name' field - only action identifier
CREATE TABLE "public"."action_v4" (
  "id" varchar(50) NOT NULL DEFAULT gen_random_friendly_id('action_v4'),
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  "rp_id" varchar(50) NOT NULL,
  "action" text NOT NULL,
  "description" text NOT NULL DEFAULT '',
  "environment" action_environment NOT NULL DEFAULT 'production',
  PRIMARY KEY ("id"),
  FOREIGN KEY ("rp_id") REFERENCES "public"."rp_registration"("rp_id") ON UPDATE CASCADE ON DELETE CASCADE,
  UNIQUE ("rp_id", "action")
);

-- Add updated_at trigger for action_v4
CREATE TRIGGER "set_public_action_v4_updated_at"
BEFORE UPDATE ON "public"."action_v4"
FOR EACH ROW
EXECUTE PROCEDURE "public"."set_current_timestamp_updated_at"();

COMMENT ON TRIGGER "set_public_action_v4_updated_at" ON "public"."action_v4"
IS 'trigger to set value of column "updated_at" to current timestamp on row update';

-- Create the nullifier_v4 table
CREATE TABLE "public"."nullifier_v4" (
  "id" varchar(50) NOT NULL DEFAULT gen_random_friendly_id('nullifier_v4'),
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "action_v4_id" varchar(50) NOT NULL,
  "nullifier" text NOT NULL,
  PRIMARY KEY ("id"),
  FOREIGN KEY ("action_v4_id") REFERENCES "public"."action_v4"("id") ON UPDATE CASCADE ON DELETE CASCADE,
  UNIQUE ("nullifier")
);

-- Add indexes for common queries
CREATE INDEX "action_v4_rp_id_idx" ON "public"."action_v4" ("rp_id");
CREATE INDEX "nullifier_v4_action_v4_id_idx" ON "public"."nullifier_v4" ("action_v4_id");

-- Comments
COMMENT ON TABLE "public"."action_v4" IS 'Actions for World ID 4.0 verification, tied to RP registration';
COMMENT ON COLUMN "public"."action_v4"."rp_id" IS 'Reference to the RP registration (on-chain RP ID)';
COMMENT ON COLUMN "public"."action_v4"."action" IS 'Action identifier as passed by the developer';
COMMENT ON COLUMN "public"."action_v4"."description" IS 'Human-readable description of the action';
COMMENT ON COLUMN "public"."action_v4"."environment" IS 'Whether this action is for staging (allows nullifier reuse) or production';

COMMENT ON TABLE "public"."nullifier_v4" IS 'Nullifiers for World ID 4.0 verification, ensures uniqueness per action';
COMMENT ON COLUMN "public"."nullifier_v4"."nullifier" IS 'The nullifier hash from the proof, unique globally';
