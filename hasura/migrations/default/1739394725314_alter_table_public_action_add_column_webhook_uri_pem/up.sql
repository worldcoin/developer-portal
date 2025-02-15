CREATE TYPE app_flow_on_complete_enum AS ENUM ('NONE', 'VERIFY');

ALTER TABLE public.action
    ADD COLUMN webhook_uri TEXT,
    ADD COLUMN webhook_pem TEXT,
    ADD COLUMN app_flow_on_complete app_flow_on_complete_enum;

COMMENT ON COLUMN public.action.webhook_uri IS 'URI to send a payload to the webhook, encrypted by the webhook_pem';
COMMENT ON COLUMN public.action.webhook_pem IS 'PEM used to encrypt the payload sent to the webhook_uri';