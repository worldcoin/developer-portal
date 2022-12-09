CREATE TABLE "public"."doc_check" ("id" varchar(50) NOT NULL DEFAULT gen_random_friendly_id('docc'), "session_id" varchar NOT NULL, "document_hash" varchar NOT NULL DEFAULT '', "status" varchar NOT NULL DEFAULT 'created', "identity_commitment" varchar NOT NULL, "error_details" varchar NOT NULL DEFAULT '', PRIMARY KEY ("id") , UNIQUE ("id"), UNIQUE("session_id"), UNIQUE("document_hash") );

alter table "public"."doc_check" add column "created_at" timestamptz not null default now();

alter table "public"."doc_check" add column "updated_at" timestamptz
 null default now();

CREATE OR REPLACE FUNCTION "public"."set_current_timestamp_updated_at"()
RETURNS TRIGGER AS $$
DECLARE
  _new record;
BEGIN
  _new := NEW;
  _new."updated_at" = NOW();
  RETURN _new;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER "set_public_doc_check_updated_at"
BEFORE UPDATE ON "public"."doc_check"
FOR EACH ROW
EXECUTE PROCEDURE "public"."set_current_timestamp_updated_at"();
COMMENT ON TRIGGER "set_public_doc_check_updated_at" ON "public"."doc_check" 
IS 'trigger to set value of column "updated_at" to current timestamp on row update';