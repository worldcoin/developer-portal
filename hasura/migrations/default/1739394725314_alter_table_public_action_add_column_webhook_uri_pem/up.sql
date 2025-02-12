alter table "public"."action" add column "webhook_uri" text
 null;

alter table "public"."action" add column "webhook_pem" text
 null;

comment on column "public"."action"."webhook_pem" is E'PEM used to encrypt the payload sent to the webhook_uri';
comment on column "public"."action"."webhook_uri" is E'uri to send a payload to the webhook, encrypted by the webhook_pem';