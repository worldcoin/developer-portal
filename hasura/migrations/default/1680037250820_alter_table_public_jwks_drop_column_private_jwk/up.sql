
alter table "public"."jwks" drop column "private_jwk" cascade;

alter table "public"."jwks" drop column "alg";

alter table "public"."jwks" add column "kms_id" text
 not null unique;
