-- Migration: Create rp_registration table for World ID 4.0 RP registration
-- Description: Stores RP registration state for on-chain registration flow

-- Create enum for registration mode (managed vs self-managed)
CREATE TYPE rp_registration_mode AS ENUM ('managed', 'self_managed');

-- Create enum for registration status
-- pending: Not yet registered on-chain
-- registered: Successfully registered on-chain
-- failed: Transaction failed (prompt retry)
CREATE TYPE rp_registration_status AS ENUM (
  'pending',
  'registered',
  'failed'
);

-- Create the rp_registration table
CREATE TABLE "public"."rp_registration" (
  "rp_id" varchar(50) NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  "app_id" varchar(50) NOT NULL,
  "mode" rp_registration_mode NOT NULL,
  "signer_address" text NOT NULL,
  "manager_kms_key_id" text,
  "status" rp_registration_status NOT NULL DEFAULT 'pending',
  "tx_hash" text,
  PRIMARY KEY ("rp_id"),
  FOREIGN KEY ("app_id") REFERENCES "public"."app"("id") ON UPDATE CASCADE ON DELETE CASCADE,
  UNIQUE ("app_id")
);

-- Add updated_at trigger (reuses existing function from app table)
CREATE TRIGGER "set_public_rp_registration_updated_at"
BEFORE UPDATE ON "public"."rp_registration"
FOR EACH ROW
EXECUTE PROCEDURE "public"."set_current_timestamp_updated_at"();

COMMENT ON TRIGGER "set_public_rp_registration_updated_at" ON "public"."rp_registration"
IS 'trigger to set value of column "updated_at" to current timestamp on row update';
