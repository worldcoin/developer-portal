SET check_function_bodies = false;
INSERT INTO "public"."app" (id, created_at, updated_at, team_id, name, logo_url, verified_at, description_internal, is_staging, engine, status, is_archived) VALUES ('app_staging_c58ee9db137b07f56f1ebd342057833a', '2023-02-18 11:20:39.530041+00', '2023-02-18 11:20:39.530041+00', 'team_d7cde14f17eda7e0ededba7ded6b4467', 'Default App', '', NULL, 'App Description', true, 'cloud', 'active', false);
UPDATE "public"."action" SET "external_nullifier" = '0x00bbb658813151e0abcf6f4968304c807baff10f42bd163d86faa33edbbb73e1';
