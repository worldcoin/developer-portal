
alter table "public"."jwks" drop column "private_jwk" cascade;

alter table "public"."jwks" alter column "alg" set default 'RS256'::character varying;

alter table "public"."jwks" add column "kms_id" text
 not null unique;
