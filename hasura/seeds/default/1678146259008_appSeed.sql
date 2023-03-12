SET check_function_bodies = false;
INSERT INTO "public"."app" (is_archived,is_staging,id,name,team_id,description_internal,engine,logo_url,status,created_at,updated_at,verified_at)
VALUES
(true,true,'app_staging_3c2982b8c12bc85250d1e810bd9d4069','Archived App','team_d7cde14f17eda7e0ededba7ded6b4467','This app is inactive and archived','cloud','https://worldcoin.org/icons/logo-small.svg','inactive','2023-02-18T11:20:39.530041+00:00','2023-03-06T23:00:15.98657+00:00',NULL),
(false,true,'app_staging_70e1d8985198fb4f752680aa0563c3d1','Sign In App','team_d7cde14f17eda7e0ededba7ded6b4467','This app is for Sign In with World ID','cloud','https://worldcoin.org/icons/logo-small.svg','active','2023-02-18T11:20:39.530041+00:00','2023-03-06T23:00:15.992529+00:00',NULL),
(false,true,'app_staging_db2d27a24855dc01c49358e771070410','Multi-claim App','team_d7cde14f17eda7e0ededba7ded6b4467','This app has a multi-claim custom action','cloud','','active','2023-02-18T11:20:39.530041+00:00','2023-03-06T23:00:15.995455+00:00',NULL),
(false,false,'app_402042a5e0de48c05fc7c39ed9150e98','On-chain App','team_d7cde14f17eda7e0ededba7ded6b4467','This app is on-chain and in production','on-chain','','active','2023-02-18T11:20:39.530041+00:00','2023-03-06T23:00:15.998795+00:00',NULL),
(false,true,'app_staging_23ba86acf1d516342118fc5a1ccc80a6','Custom Action App','team_d7cde14f17eda7e0ededba7ded6b4467','This app has a one-time custom action','cloud','https://worldcoin.org/icons/logo-small.svg','active','2023-02-18T11:20:39.530041+00:00','2023-03-06T23:00:16.00117+00:00',NULL);
