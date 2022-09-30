CREATE OR REPLACE FUNCTION gen_random_friendly_id(prefix VARCHAR) 

RETURNS VARCHAR

AS

$$

BEGIN

RETURN CONCAT(prefix, '_', md5(random()::text));

END;

$$

LANGUAGE 'plpgsql';