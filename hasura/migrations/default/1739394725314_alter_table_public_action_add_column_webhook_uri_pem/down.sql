ALTER TABLE public.action
DROP COLUMN webhook_uri,
  DROP COLUMN webhook_pem,
  DROP COLUMN app_flow_on_complete;

DROP TYPE app_flow_on_complete;