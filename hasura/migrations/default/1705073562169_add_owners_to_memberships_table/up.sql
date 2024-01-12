INSERT INTO memberships (user_id, team_id, role)
SELECT id, team_id, 'OWNER'
FROM "public".user;
