CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Base64url keeps all 32 random bytes within the existing varchar(50) column.
ALTER TABLE public.invite
  ALTER COLUMN id SET DEFAULT
    'inv_' || rtrim(translate(encode(gen_random_bytes(32), 'base64'), '+/', '-_'), '=');
