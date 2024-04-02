CREATE FUNCTION get_team_owners_count(team_row team)
RETURNS integer AS $$
    SELECT COUNT(*)
    FROM "public"."membership"
    WHERE team_id = team_row.id AND role = 'OWNER'
$$ LANGUAGE sql STABLE;
