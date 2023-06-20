
ALTER TABLE "public"."api_key" ALTER COLUMN "is_active" drop default;


ALTER TABLE "public"."api_key" DROP COLUMN "name";

ALTER TABLE "public"."api_key" DROP COLUMN "api_key";
