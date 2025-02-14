CREATE TYPE action_flow_enum AS ENUM ('VERIFY', 'PARTNER');

ALTER TABLE public.action
    ADD COLUMN webhook_uri TEXT,
    ADD COLUMN webhook_pem TEXT,
    ADD COLUMN flow action_flow_enum;

COMMENT ON COLUMN public.action.webhook_uri IS 'URI to send a payload to the webhook, encrypted by the webhook_pem';
COMMENT ON COLUMN public.action.webhook_pem IS 'PEM used to encrypt the payload sent to the webhook_uri';