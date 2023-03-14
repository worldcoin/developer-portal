SET check_function_bodies = false;
INSERT INTO "public"."app" (is_archived,is_staging,name,team_id,description_internal,engine,logo_url,status,created_at,updated_at,verified_at)
VALUES
(false,true,'Sign In App','team_d7cde14f17eda7e0ededba7ded6b4467','This app is for Sign In with World ID','cloud','https://worldcoin.org/icons/logo-small.svg','active','2023-02-18T11:20:39.530041+00:00','2023-03-06T23:00:15.992529+00:00',NULL),
(false,true,'Multi-claim App','team_d7cde14f17eda7e0ededba7ded6b4467','This app has a multi-claim custom action','cloud','','active','2023-02-18T11:20:39.530041+00:00','2023-03-06T23:00:15.995455+00:00',NULL),
(false,false,'On-chain App','team_d7cde14f17eda7e0ededba7ded6b4467','This app is on-chain and in production','on-chain','','active','2023-02-18T11:20:39.530041+00:00','2023-03-06T23:00:15.998795+00:00',NULL),
(false,true,'Custom Action App','team_d7cde14f17eda7e0ededba7ded6b4467','This app has a one-time custom action','cloud','https://worldcoin.org/icons/logo-small.svg','active','2023-02-18T11:20:39.530041+00:00','2023-03-06T23:00:16.00117+00:00',NULL),
(true,true,'Archived App','team_d7cde14f17eda7e0ededba7ded6b4467','This app is inactive and archived','cloud','https://worldcoin.org/icons/logo-small.svg','inactive','2023-02-18T11:20:39.530041+00:00','2023-03-06T23:00:15.98657+00:00',NULL);