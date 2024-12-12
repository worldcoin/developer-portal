ALTER TABLE "public"."app"
ALTER COLUMN "rating_count" TYPE bigint;

ALTER TABLE "public"."app"
ALTER COLUMN "rating_sum" TYPE bigint;

alter table "public"."app"
alter column "rating_sum"
drop not null;

alter table "public"."app"
alter column "rating_count"
drop not null;