SET check_function_bodies = false;
INSERT INTO "public"."app" (id, team_id, name) VALUES ('app_ZmRro4qgtICFSEFA0DjN', 'team_IgEuV02qINgIreD7uMqp', 'PurpleApp');
INSERT INTO "public"."action" (app_id, name, public_description, description, crypto_chain, return_url, status) VALUES ('app_ZmRro4qgtICFSEFA0DjN', 'My cool airdrop', 'Airdropping the best tokens', 'For internal use only.', '', '', 'active');
INSERT INTO "public"."action" (app_id, name, public_description, description, crypto_chain, return_url) VALUES ('app_ZmRro4qgtICFSEFA0DjN', 'The purple drop', 'Purple rocks!☂️☂️', 'Internal description?', '', '');


-- Another team
INSERT INTO "public"."app" (id, team_id, name) VALUES ('app_Xsolnp4solwJXp4n', 'team_Fo4qgtIZmRrFSECA0DjN', 'PurpleApp');
INSERT INTO "public"."action" (app_id, name, public_description, description, crypto_chain, return_url) VALUES ('app_Xsolnp4solwJXp4n', 'The orange action', 'Orange rocks!🍊🍊', 'Internal description?', '', '');