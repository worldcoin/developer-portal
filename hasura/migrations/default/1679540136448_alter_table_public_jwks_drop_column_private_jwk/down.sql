comment on column "public"."jwks"."private_jwk" is E'Stores valid JWKs used for offline signature verification';
alter table "public"."jwks" alter column "private_jwk" drop not null;
alter table "public"."jwks" add column "private_jwk" jsonb;
