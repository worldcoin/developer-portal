ALTER TABLE public.action
DROP COLUMN webhook_uri,
  DROP COLUMN webhook_pem,
  DROP COLUMN flow;

DROP TYPE action_flow_enum;