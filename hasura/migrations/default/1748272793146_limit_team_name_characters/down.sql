-- 1. Drop the CHECK constraint
ALTER TABLE public.team
DROP CONSTRAINT IF EXISTS team_name_no_angle_brackets;

-- 2. Revert the column to unbounded VARCHAR
ALTER TABLE public.team
ALTER COLUMN name TYPE VARCHAR;