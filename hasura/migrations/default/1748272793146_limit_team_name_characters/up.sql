-- 1. Limit length to 128 characters
ALTER TABLE public.team
ALTER COLUMN name TYPE VARCHAR(128);

-- 2. Disallow '<' and '>' characters using a CHECK constraint
ALTER TABLE public.team
ADD CONSTRAINT team_name_no_angle_brackets
CHECK (name !~ '[<>]');
