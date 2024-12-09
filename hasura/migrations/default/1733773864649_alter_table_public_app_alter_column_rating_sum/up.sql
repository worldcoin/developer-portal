ALTER TABLE "public"."app"
ALTER COLUMN "rating_sum" TYPE int4;

ALTER TABLE "public"."app"
ALTER COLUMN "rating_count" TYPE int4;

alter table "public"."app"
alter column "rating_sum"
set
    not null;

alter table "public"."app"
alter column "rating_count"
set
    not null;