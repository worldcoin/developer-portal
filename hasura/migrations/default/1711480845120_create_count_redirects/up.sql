CREATE FUNCTION public.count_redirects(action action)
 RETURNS integer
 LANGUAGE sql
 STABLE
AS $function$
    SELECT COUNT(id) 
    FROM redirect 
    WHERE action_id = action.id
$function$;
