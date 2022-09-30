ALTER TABLE "public"."action" ALTER COLUMN "public_description" drop default;
ALTER TABLE "public"."action" ALTER COLUMN "crypto_chain" drop default;
ALTER TABLE "public"."action" ALTER COLUMN "return_url" drop default;
ALTER TABLE "public"."action" DROP COLUMN "smart_contract_address";