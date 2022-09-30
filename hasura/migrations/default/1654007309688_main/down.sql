
DROP TABLE "public"."nullifier";

alter table "public"."action" drop constraint "status_choices";

alter table "public"."action" drop constraint "engine_choices";

DROP TABLE "public"."action";

alter table "public"."user" alter column "team_id" drop not null;

DROP TABLE "public"."user";

DROP TABLE "public"."team";

DROP TABLE "public"."cache";

DROP TABLE "public"."jwks";