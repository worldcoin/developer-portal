CREATE TABLE "public"."revocation" ("id" varchar(50) NOT NULL DEFAULT gen_random_friendly_id('rvk'), "identity_commitment" text NOT NULL, "type" text NOT NULL, "revoked_at" timestamptz NOT NULL DEFAULT now(), PRIMARY KEY ("id") , UNIQUE ("id"), UNIQUE ("identity_commitment"));
alter table "public"."revocation" rename column "type" to "credential_type";
