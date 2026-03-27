-- Convert any 'deactivated' rows back to 'registered' before removing the enum value
UPDATE rp_registration SET status = 'registered' WHERE status = 'deactivated';

-- Create new enum without 'deactivated'
CREATE TYPE rp_registration_status_new AS ENUM ('pending', 'registered', 'failed');

-- Update column to use new enum type
ALTER TABLE rp_registration 
  ALTER COLUMN status TYPE rp_registration_status_new 
  USING status::text::rp_registration_status_new;

-- Drop old enum and rename new one
DROP TYPE rp_registration_status;
ALTER TYPE rp_registration_status_new RENAME TO rp_registration_status;
