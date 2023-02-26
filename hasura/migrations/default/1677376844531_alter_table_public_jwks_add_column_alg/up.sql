alter table "public"."jwks" add column "alg" varchar
 not null default 'PS256';
